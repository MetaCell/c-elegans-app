from __future__ import annotations

import json
from argparse import ArgumentParser
from dataclasses import asdict, dataclass
from itertools import chain
from pathlib import Path

from PIL import Image

TILE_GLOB = "*_*_*.jpg"


@dataclass(frozen=True)
class Tile:
    position: tuple[int, int]
    zoom: int
    size: tuple[int, int]
    path: Path


def extract_tile_metadata(f: Path) -> Tile:
    """Extracts the tile metadata from the file with path f"""
    s = f.name.split("_")
    if len(s) < 3:
        raise Exception(f"unexpected file name: {f.name}")

    x = int(s[1])
    y = int(s[0])
    zoom = int(s[2].split(".")[0])

    with Image.open(f) as img:
        size = img.size

    return Tile(position=(x, y), zoom=zoom, path=f, size=size)


def unique_levels(tiles: list[Tile]) -> set[int]:
    """Returns a set with all levels available in the tile list"""
    levels: set[int] = set()
    for tile in tiles:
        if tile.zoom not in levels:
            levels.add(tile.zoom)
    return levels


class TileMatrix:
    """A matrix of tiles representing a zoom layer."""

    zoom: int
    size: tuple[int, int]  # rows and columns
    resolution: tuple[int, int]  # in pixels

    _tiles: list[list[Tile | None]]  # rows x colums tile matrix

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

    def __init__(self, tiles: list[Tile]) -> None:
        self.size = self._matrix_size(tiles)
        assert self._are_tiles_size_eq(tiles)

        self.zoom = tiles[0].zoom
        tile_size = tiles[0].size
        self.resolution = (tile_size[0] * self.size[0], tile_size[1] * self.size[1])

        # create tile matrix
        self._tiles = [[None] * self.size[1] for _ in range(self.size[0])]
        for tile in tiles:
            x, y = tile.position
            self._tiles[x][y] = tile


@dataclass
class Piramid:
    """A piramid structure with a tile matrix for each zoom level"""

    levels: list[TileMatrix]

    def number_levels(self) -> int:
        return len(self.levels)

    def extent(self) -> list[int]:
        maxX, maxY = self.levels[0].resolution
        # TODO: this may be optimized further to excluse black tiles from being requested
        minX, minY = (0, 0)
        return [minX, minY, maxX, maxY]

    @classmethod
    def build(cls, tiles: list[Tile]) -> Piramid:
        u_levels = unique_levels(tiles)

        tiles_by_lvl: list[list[Tile]] = [[] for _ in u_levels]
        for tile in tiles:
            tiles_by_lvl[tile.zoom].append(tile)

        levels: list[TileMatrix] = [TileMatrix(tile_set) for tile_set in tiles_by_lvl]

        return cls(levels)


if __name__ == "__main__":
    parser = ArgumentParser(description="Build a tile grid from the segmentation tiles")
    parser.add_argument(
        "-i",
        "--img-path",
        help="Path of a segmentation image or the folder containing the segmentation images",
        required=True,
    )

    args = vars(parser.parse_args())

    dir = Path(args["img_path"])

    tiles = [extract_tile_metadata(f) for f in dir.glob(TILE_GLOB)]

    piramid = Piramid.build(tiles)

    print("z", "col,row", "resolution")
    for lvl in piramid.levels:
        print(lvl.zoom, lvl.size, lvl.resolution)
