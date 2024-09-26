from __future__ import annotations

import operator
from dataclasses import dataclass
from functools import lru_cache
from itertools import chain, groupby
from pathlib import Path

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
    def size(self) -> tuple[int, int]:
        with Image.open(self.path) as img:
            return img.size


@dataclass
class TileGrid:
    """A matrix of tiles representing a zoom layer."""

    zoom: int
    size: tuple[int, int]  # rows and columns
    matrix: list[list[Tile | None]]  # tiles organized in a matrix

    @staticmethod
    def _matrix_size(tiles: list[Tile]) -> tuple[int, int]:
        maxx, maxy = 0, 0
        for tile in tiles:
            x, y = tile.position
            if x > maxx:
                maxx = x
            if y > maxy:
                maxy = y
        return (maxx + 1, maxy + 1)

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
        return (height * n_rows, width * n_cols)

    @classmethod
    def from_tiles(cls, tiles: list[Tile]) -> TileGrid:
        if len(tiles) == 0:
            raise Exception("tiles can not be an empty list")

        size = cls._matrix_size(tiles)
        assert cls._are_tiles_size_eq(tiles)

        zoom = tiles[0].zoom

        matrix: list[list[Tile | None]] = [[None] * size[1] for _ in range(size[0])]
        for tile in tiles:
            x, y = tile.position
            matrix[x][y] = tile

        return cls(zoom=zoom, size=size, matrix=matrix)


@dataclass
class Piramid:
    """A piramid structure with a tile matrix for each zoom level"""

    levels: dict[int, TileGrid]

    def number_levels(self) -> int:
        return len(self.levels)

    @property
    def extent(self) -> tuple[int, int, int, int]:
        maxX, maxY = (0, 0)
        for lvl in self.levels.values():
            if lvl is not None:
                maxX, maxY = lvl.resolution
                break

        # TODO: this may be optimized further to excluse black tiles from being requested
        minX, minY = (0, 0)
        return (minX, minY, maxX, maxY)

    @property
    def zooms(self) -> list[int]:
        return [lvl for lvl in self.levels.keys()]

    @property
    def minzoom(self) -> int:
        """Minimum zoom value that exits in the piramid"""
        return min(self.zooms)

    @property
    def maxzoom(self) -> int:
        """Maximum zoom value that exits in the piramid"""
        return max(self.zooms)

    @property
    def tile_dimensions(self) -> tuple[int, int]:
        # it assumes that tile size is the same across zoom levels
        zooms = self.zooms
        if zooms == 0:
            return (0, 0)  # no data
        return self.levels[zooms[0]].tile_dimensions

    @classmethod
    def build(cls, tiles: list[Tile]) -> Piramid:
        levels: dict[int, TileGrid] = {}

        tiles.sort(key=operator.attrgetter("zoom"))  # groupby expects things sorted
        for zoom, ztiles in groupby(tiles, lambda t: t.zoom):
            levels[zoom] = TileGrid.from_tiles(list(ztiles))

        return cls(levels)


class SliceMetadata(BaseModel):
    slice: int
    zooms: list[int]
    minzoom: int
    maxzoom: int
    tile_size: tuple[int, int]


class EMMetadata(BaseModel):
    number_slices: int
    slice_range: tuple[int, int]
    slices: list[SliceMetadata]

    @classmethod
    def from_tiles(cls, tiles: list[Tile]) -> EMMetadata:
        metadata: list[SliceMetadata] = []
        available_slices: list[int] = []

        tiles.sort(key=operator.attrgetter("slice"))  # groupby expects things sorted
        for slice, stiles in groupby(tiles, lambda t: t.slice):
            piramid = Piramid.build(list(stiles))

            available_slices.append(slice)
            metadata.append(
                SliceMetadata(
                    slice=slice,
                    zooms=piramid.zooms,
                    minzoom=piramid.minzoom,
                    maxzoom=piramid.maxzoom,
                    tile_size=piramid.tile_dimensions,
                )
            )

        return cls(
            number_slices=len(metadata),
            slice_range=(min(available_slices), max(available_slices)),
            slices=metadata,
        )

    def merge(self, emm2: EMMetadata) -> EMMetadata:
        slices_dict = {s.slice: s for s in self.slices}

        for emm2s in emm2.slices:
            s = slices_dict.get(emm2s.slice)
            if s is None or s != emm2s:
                slices_dict[emm2s.slice] = emm2s

        slices_metadata = [s for s in slices_dict.values()]
        slices_metadata.sort(key=operator.attrgetter("slice"))
        slice_range = (
            min(s.slice for s in slices_metadata),
            max(s.slice for s in slices_metadata),
        )

        return EMMetadata(
            number_slices=len(slices_metadata),
            slice_range=slice_range,
            slices=slices_metadata,
        )


if __name__ == "__main__":
    import sys
    from argparse import ArgumentParser

    from ingestion.storage.filesystem import load_tiles

    parser = ArgumentParser(description="computed EM tiles metadata")
    parser.add_argument(
        "em_paths",
        nargs="+",
        type=Path,
        help=f"directory, files or glob match for EM data",
    )
    parser.add_argument(
        "--indent",
        type=int,
        help="indentation to use in the JSON output.",
        default=None,
    )

    args = parser.parse_args()
    tiles = load_tiles(args.em_paths)
    metadata = EMMetadata.from_tiles(list(tiles))
    print(metadata.model_dump_json(indent=args.indent), file=sys.stdout)
