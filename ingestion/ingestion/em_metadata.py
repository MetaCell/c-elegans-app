from __future__ import annotations

import operator
from dataclasses import dataclass
from functools import lru_cache
from itertools import groupby
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class Tile:
    position: tuple[int, int]
    zoom: int
    path: Path
    slice: int

    @property
    @lru_cache(1)
    def size(self) -> tuple[int, int]:
        with Image.open(self.path) as img:
            return img.size


def unique_levels(tiles: list[Tile]) -> set[int]:
    """Returns a set with all levels available in the tile list"""
    levels: set[int] = set()
    for tile in tiles:
        if tile.zoom not in levels:
            levels.add(tile.zoom)
    return levels


@dataclass
class TileGrid:
    """A matrix of tiles representing a zoom layer."""

    zoom: int
    size: tuple[int, int]  # rows and columns
    resolution: tuple[int, int]  # in pixels
    _matrix: list[list[Tile | None]]  # rows x colums tile matrix

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

    @classmethod
    def from_tiles(cls, tiles: list[Tile]) -> TileGrid:
        if len(tiles) == 0:
            raise Exception("tiles can not be an empty list")

        size = cls._matrix_size(tiles)
        assert cls._are_tiles_size_eq(tiles)

        zoom = tiles[0].zoom
        tile_size = tiles[0].size
        resolution = (tile_size[0] * size[0], tile_size[1] * size[1])

        matrix: list[list[Tile | None]] = [[None] * size[1] for _ in range(size[0])]
        for tile in tiles:
            x, y = tile.position
            matrix[x][y] = tile

        return cls(zoom=zoom, size=size, resolution=resolution, _matrix=matrix)


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
        return min(self.zooms)

    @property
    def maxzoom(self) -> int:
        return max(self.zooms)

    @classmethod
    def build(cls, tiles: list[Tile]) -> Piramid:
        levels: dict[int, TileGrid] = {}

        tiles.sort(key=operator.attrgetter("zoom"))  # groupby expects things sorted
        for zoom, ztiles in groupby(tiles, lambda t: t.zoom):
            levels[zoom] = TileGrid.from_tiles(list(ztiles))

        return cls(levels)
