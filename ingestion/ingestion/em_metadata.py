from __future__ import annotations

import operator
from dataclasses import dataclass
from functools import lru_cache
from itertools import chain, groupby
from pathlib import Path
from typing import Iterator

from PIL import Image
from pydantic import BaseModel


@dataclass(frozen=True)
class Tile:
    position: tuple[int, int]  # (width, height)
    zoom: int
    path: Path
    slice: int

    @property
    @lru_cache(1)
    def size(self) -> tuple[int, int]:  # (w, h)
        with Image.open(self.path) as img:
            return img.size


@dataclass
class TileGrid:
    """A matrix of tiles representing a zoom layer."""

    zoom: int
    size: tuple[int, int]  # rows and columns
    matrix: list[list[Tile | None]]  # tiles organized in a matrix [row][col]

    def __iter__(self) -> Iterator[Tile | None]:
        return (tile for row in self.matrix for tile in row)

    @staticmethod
    def _matrix_size(tiles: list[Tile]) -> tuple[int, int]:
        maxx, maxy = 0, 0
        for tile in tiles:
            x, y = tile.position
            if x > maxx:
                maxx = x
            if y > maxy:
                maxy = y
        return (maxy + 1, maxx + 1)

    @staticmethod
    def _are_tiles_size_eq(tiles: list[Tile]) -> bool:
        if len(tiles) == 0:
            raise Exception("no tiles to calculate the size equality")

        size = tiles[0].size
        for tile in tiles[1:]:
            if tile.size != size:
                return False
        return True

    def _first_tile_non_none(self) -> Tile | None:
        return next((item for item in chain(*self.matrix) if item is not None), None)

    @property
    def tile_dimensions(self) -> tuple[int, int]:
        """
        Returns the dimensions of a tile.
        It assumes that all the tiles have the same size.
        """
        tile = self._first_tile_non_none()
        if tile is None:  # no tiles in the matrix
            return (0, 0)
        return tile.size

    @property
    def resolution(self) -> tuple[int, int]:
        """Resolution of the grid in pixels"""
        n_rows, n_cols = self.size
        width, height = self.tile_dimensions
        return (width * n_cols, height * n_rows)

    @classmethod
    def from_tiles(cls, tiles: list[Tile]) -> TileGrid:
        if len(tiles) == 0:
            raise Exception("tiles can not be an empty list")

        n_rows, n_cols = cls._matrix_size(tiles)
        # It's not necessary to test all the tiles size in a same slice
        # We consider that they have the same size
        # assert cls._are_tiles_size_eq(tiles)

        zoom = tiles[0].zoom

        matrix: list[list[Tile | None]] = [[None] * n_cols for _ in range(n_rows)]
        for tile in tiles:
            x, y = tile.position
            matrix[y][x] = tile

        return cls(zoom=zoom, size=(n_rows, n_cols), matrix=matrix)


@dataclass
class Pyramid:
    """A pyramid structure with a tile matrix for each zoom level"""

    levels: dict[int, TileGrid]

    def number_levels(self) -> int:
        return len(self.levels)

    @property
    def extent(self) -> tuple[int, int, int, int]:
        maxX, maxY = (0, 0)
        if self.zooms:
            maxX, maxY = self.levels[self.minzoom].resolution

        # TODO: this may be optimized further to excluse black tiles from being requested
        minX, minY = (0, 0)
        return (minX, minY, maxX, maxY)

    @property
    def zooms(self) -> list[int]:
        return [lvl for lvl in self.levels.keys()]

    @property
    def minzoom(self) -> int:
        """Minimum zoom value that exits in the pyramid"""
        return min(self.zooms)

    @property
    def maxzoom(self) -> int:
        """Maximum zoom value that exits in the pyramid"""
        return max(self.zooms)

    @property
    def tile_dimensions(self) -> tuple[int, int]:
        # it assumes that tile size is the same across zoom levels
        zooms = self.zooms
        if len(zooms) == 0:
            return (0, 0)  # no data
        return self.levels[zooms[0]].tile_dimensions

    @property
    def resolution(self) -> tuple[int, int]:
        """Resolution of the maxzoom tiles"""
        zooms = self.zooms
        if len(zooms) == 0:
            return (0, 0)  # no data

        tile_grid = self.levels[self.minzoom + 1]
        [w, h] = self.tile_dimensions
        [r, c] = tile_grid.size

        return (c * w, r * h)

    @classmethod
    def build(cls, tiles: list[Tile]) -> Pyramid:
        levels: dict[int, TileGrid] = {}

        tiles.sort(key=operator.attrgetter("zoom"))  # groupby expects things sorted
        for zoom, ztiles in groupby(tiles, lambda t: t.zoom):
            levels[zoom] = TileGrid.from_tiles(list(ztiles))

        return cls(levels)


class SliceMetadata:
    slice: int
    zooms: list[int]
    minzoom: int
    maxzoom: int
    tile_size: tuple[int, int]


class EMMetadata(BaseModel):
    number_slices: int
    slice_range: tuple[int, int]
    minzoom: int
    maxzoom: int
    tile_size: tuple[int, int]
    resolution: tuple[int, int]
    slices: list[int]

    @classmethod
    def from_tiles(cls, tiles: list[Tile]) -> EMMetadata:
        available_slices = []

        pyramid = None
        tiles.sort(key=operator.attrgetter("slice"))  # groupby expects things sorted
        previous_pyramid = None
        for slice, stiles in groupby(tiles, lambda t: t.slice):
            pyramid = Pyramid.build(list(stiles))
            available_slices.append(slice)
            assert (
                not previous_pyramid
                or previous_pyramid.tile_dimensions == pyramid.tile_dimensions
            )
        assert pyramid
        return cls(
            number_slices=len(available_slices),
            slice_range=(min(available_slices), max(available_slices)),
            slices=available_slices,
            minzoom=pyramid.minzoom,
            maxzoom=pyramid.maxzoom,
            tile_size=pyramid.tile_dimensions,
            resolution=pyramid.resolution,
        )

    def merge(self, emm2: EMMetadata) -> EMMetadata:
        if emm2.minzoom != self.minzoom or self.maxzoom != emm2.maxzoom:
            raise Exception(
                f"Zoom level [{emm2.minzoom}, {emm2.maxzoom}] of the added metadata set is not compatible with the existing one [{self.minzoom}, {self.maxzoom}]"
            )
        if emm2.tile_size != self.tile_size:
            raise Exception(
                f"Tiles size {emm2.tile_size} of the added metadata set is not compatible with the existing tile size {self.tile_size}"
            )
        slices = set(self.slices)
        slices.update(emm2.slices)
        slices = sorted(slices)

        return EMMetadata(
            number_slices=len(slices),
            slices=slices,
            slice_range=(slices[0], slices[-1]),
            minzoom=self.minzoom,
            maxzoom=self.maxzoom,
            tile_size=self.tile_size,
            resolution=self.resolution,
        )


if __name__ == "__main__":
    import logging
    from argparse import ArgumentParser
    from dataclasses import fields, is_dataclass
    from inspect import getmembers, isdatadescriptor
    from sys import maxsize

    from ingestion.log import setup_logger
    from ingestion.storage.filesystem import load_tiles

    parser = ArgumentParser(description="computed EM tiles metadata")
    parser.add_argument(
        "em_paths",
        nargs="+",
        type=Path,
        help=f"directory, files or glob match for EM data",
    )
    parser.add_argument(
        "--debug",
        help="runs with debug logs",
        default=False,
        action="store_true",
    )

    args = parser.parse_args()

    setup_logger(args.debug)
    logger = logging.getLogger("em_data")

    tiles = list(load_tiles(args.em_paths))
    logger.debug(f"found {len(tiles)} tiles")

    def print_dataclass(dc, *, exclude: set[str] | None = None):
        if not is_dataclass(dc):
            raise ValueError("Input must be a dataclass instance")

        exclude = exclude or set()

        attrs = []
        attrs.extend(
            (field.name, getattr(dc, field.name))
            for field in fields(dc)
            if field.name not in exclude
        )
        properties = getmembers(type(dc), isdatadescriptor)
        attrs.extend(
            (name, getattr(dc, name))
            for name, _ in properties
            if isinstance(getattr(type(dc), name), property) and name not in exclude
        )

        if not attrs:
            return

        max_length = max(len(name) for name, _ in attrs)
        for name, val in attrs:
            print(f"{name:<{max_length}}: {val}")

    def print_basemodel(model: BaseModel, exclude: set[str] | None = None):
        if not isinstance(model, BaseModel):
            raise ValueError("Input must be a Pydantic BaseModel instance")

        exclude = exclude or set()

        fields = [
            (field_name, getattr(model, field_name))
            for field_name in model.model_fields.keys()
            if field_name not in exclude
        ]

        if not fields:
            return

        max_length = max(len(name) for name, _ in fields)
        for name, val in fields:
            print(f"{name:<{max_length}}: {val}")

    print("========= EM metadata =========")

    em_meta = EMMetadata.from_tiles(tiles)
    print_basemodel(em_meta)

    def print_slice_variations():
        pyramids: dict[int, Pyramid] = {}
        tiles.sort(key=operator.attrgetter("slice"))
        for slice, stiles in groupby(tiles, lambda t: t.slice):
            pyramids[slice] = Pyramid.build(list(stiles))

        min_extent: tuple[int, int, int, int] = (maxsize, maxsize, maxsize, maxsize)
        min_extent_slice: int = -1

        max_extent: tuple[int, int, int, int] = (-1, -1, -1, -1)
        max_extent_slice: int = -1

        min_resolution: tuple[int, int] = (maxsize, maxsize)
        min_resolution_slice: int = -1

        max_resolution: tuple[int, int] = (-1, -1)
        max_resolution_slice: int = -1

        for slice, pyr in pyramids.items():
            extent = pyr.extent[2:]
            if extent < min_extent:
                min_extent = pyr.extent
                min_extent_slice = slice
            if extent > max_extent:
                max_extent = pyr.extent
                max_extent_slice = slice

            resolution = pyr.resolution
            if resolution < min_resolution:
                min_resolution = resolution
                min_resolution_slice = slice
            if resolution > max_resolution:
                max_resolution = resolution
                max_resolution_slice = slice

        @dataclass
        class PyramidVariationsStats:
            min_extent: tuple[int, int, int, int]
            min_extent_slice: int
            max_extent: tuple[int, int, int, int]
            max_extent_slice: int

            min_resolution: tuple[int, int]
            min_resolution_slice: int
            max_resolution: tuple[int, int]
            max_resolution_slice: int

        print_dataclass(
            PyramidVariationsStats(
                min_extent=min_extent,
                min_extent_slice=min_extent_slice,
                max_extent=max_extent,
                max_extent_slice=max_extent_slice,
                min_resolution=min_resolution,
                min_resolution_slice=min_resolution_slice,
                max_resolution=max_resolution,
                max_resolution_slice=max_resolution_slice,
            )
        )

    print("~~~~~ Deviation")

    print_slice_variations()

    print("\n====== Pyramid metadata =======")

    pyramid = Pyramid.build(tiles)

    def validate_pyramid(pyramid: Pyramid):
        for lvl, grid in pyramid.levels.items():
            for tile in grid:
                if tile is None:
                    continue
                assert tile.zoom == lvl

        assert pyramid.maxzoom == max(pyramid.levels.keys())
        assert pyramid.minzoom == min(pyramid.levels.keys())

    validate_pyramid(pyramid)
    print_dataclass(pyramid, exclude={"levels"})

    print("\n======= Pyramid Levels ========")

    for lvl, grid in pyramid.levels.items():
        print(f"~~~{lvl}~~~")
        print_dataclass(grid, exclude={"matrix"})
