from __future__ import annotations

from pathlib import Path

import pytest

from ingestion.em_metadata import Piramid, Tile, TileGrid
from ingestion.storage.filesystem import TILE_GLOB, extract_tile_metadata


@pytest.fixture
def slices_dir_fixture(request: pytest.FixtureRequest) -> Path:
    return Path(request.fspath).parent / "fixtures" / "em-tiles"  # type: ignore


SLICE209_TILEGRID_ZOOM5_RESOLUTION = (1024, 1024)


@pytest.fixture
def slice209_tilegrid_zoom5(slices_dir_fixture: Path) -> TileGrid:
    dir_path = slices_dir_fixture / "209"
    return TileGrid(
        zoom=5,
        size=(2, 2),
        matrix=[
            [
                Tile(
                    position=(0, 0),
                    zoom=5,
                    path=dir_path / "0_0_5.jpg",
                    slice=209,
                ),
                Tile(
                    position=(0, 1),
                    zoom=5,
                    path=dir_path / "1_0_5.jpg",
                    slice=209,
                ),
            ],
            [
                Tile(
                    position=(1, 0),
                    zoom=5,
                    path=dir_path / "0_1_5.jpg",
                    slice=209,
                ),
                Tile(
                    position=(1, 1),
                    zoom=5,
                    path=dir_path / "1_1_5.jpg",
                    slice=209,
                ),
            ],
        ],
    )


SLICE209_TILEGRID_ZOOM4_RESOLUTION = (2048, 1536)


@pytest.fixture
def slice209_tilegrid_zoom4(slices_dir_fixture: Path) -> TileGrid:
    dir_path = slices_dir_fixture / "209"
    return TileGrid(
        zoom=4,
        size=(4, 3),
        matrix=[
            [None, None, None],
            [
                Tile(
                    position=(1, 0),
                    zoom=4,
                    path=dir_path / "0_1_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(1, 1),
                    zoom=4,
                    path=dir_path / "1_1_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(1, 2),
                    zoom=4,
                    path=dir_path / "2_1_4.jpg",
                    slice=209,
                ),
            ],
            [
                Tile(
                    position=(2, 0),
                    zoom=4,
                    path=dir_path / "0_2_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(2, 1),
                    zoom=4,
                    path=dir_path / "1_2_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(2, 2),
                    zoom=4,
                    path=dir_path / "2_2_4.jpg",
                    slice=209,
                ),
            ],
            [
                Tile(
                    position=(3, 0),
                    zoom=4,
                    path=dir_path / "0_3_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(3, 1),
                    zoom=4,
                    path=dir_path / "1_3_4.jpg",
                    slice=209,
                ),
                Tile(
                    position=(3, 2),
                    zoom=4,
                    path=dir_path / "2_3_4.jpg",
                    slice=209,
                ),
            ],
        ],
    )


def test__tile_matrix(
    slices_dir_fixture: Path,
    slice209_tilegrid_zoom5: TileGrid,
    slice209_tilegrid_zoom4: TileGrid,
):
    tiles = filter(
        lambda t: t.zoom == 5,
        (
            extract_tile_metadata(tile_path)
            for tile_path in (slices_dir_fixture / "209").glob(TILE_GLOB)
        ),
    )

    assert TileGrid.from_tiles(list(tiles)) == slice209_tilegrid_zoom5

    tiles = filter(
        lambda t: t.zoom == 4,
        (
            extract_tile_metadata(tile_path)
            for tile_path in (slices_dir_fixture / "209").glob(TILE_GLOB)
        ),
    )

    assert TileGrid.from_tiles(list(tiles)) == slice209_tilegrid_zoom4


def test__tile_matrix_with_holes(slices_dir_fixture: Path):
    slice_209_path = slices_dir_fixture / "209"
    expected_matrix_zoom_5 = TileGrid(
        zoom=5,
        size=(2, 2),
        matrix=[
            [
                Tile(
                    position=(0, 0),
                    zoom=5,
                    path=slice_209_path / "0_0_5.jpg",
                    slice=209,
                ),
                None,  # the hole
            ],
            [
                Tile(
                    position=(1, 0),
                    zoom=5,
                    path=slice_209_path / "0_1_5.jpg",
                    slice=209,
                ),
                Tile(
                    position=(1, 1),
                    zoom=5,
                    path=slice_209_path / "1_1_5.jpg",
                    slice=209,
                ),
            ],
        ],
    )

    tiles = list(
        filter(
            lambda t: t.zoom == 5 and t.position != (0, 1),  # filter our the hole
            (
                extract_tile_metadata(tile_path)
                for tile_path in slice_209_path.glob(TILE_GLOB)
            ),
        )
    )

    grid = TileGrid.from_tiles(tiles)
    assert grid == expected_matrix_zoom_5
    assert (
        grid.resolution == SLICE209_TILEGRID_ZOOM5_RESOLUTION
    )  # keeps the same resolution


def test__tile_matrix_missing_row(slices_dir_fixture: Path):
    slice_209_path = slices_dir_fixture / "209"
    expected_matrix_zoom_5 = TileGrid(
        zoom=5,
        size=(2, 1),
        matrix=[
            [
                Tile(
                    position=(0, 0),
                    zoom=5,
                    path=slice_209_path / "0_0_5.jpg",
                    slice=209,
                ),
            ],
            [
                Tile(
                    position=(1, 0),
                    zoom=5,
                    path=slice_209_path / "0_1_5.jpg",
                    slice=209,
                ),
            ],
        ],
    )

    tiles = list(
        filter(
            lambda t: t.zoom == 5 and t.position[1] != 1,  # filter out 2nd row
            (
                extract_tile_metadata(tile_path)
                for tile_path in slice_209_path.glob(TILE_GLOB)
            ),
        )
    )

    grid = TileGrid.from_tiles(tiles)
    assert grid == expected_matrix_zoom_5
    assert grid.resolution == (1024, 512)


def test__tile_matrix_missing_column(slices_dir_fixture: Path):
    slice_209_path = slices_dir_fixture / "209"
    expected_matrix_zoom_5 = TileGrid(
        zoom=5,
        size=(1, 2),
        matrix=[
            [
                Tile(
                    position=(0, 0),
                    zoom=5,
                    path=slice_209_path / "0_0_5.jpg",
                    slice=209,
                ),
                Tile(
                    position=(0, 1),
                    zoom=5,
                    path=slice_209_path / "1_0_5.jpg",
                    slice=209,
                ),
            ]
        ],
    )

    tiles = list(
        filter(
            lambda t: t.zoom == 5 and t.position[0] != 1,  # filter out 2nd column
            (
                extract_tile_metadata(tile_path)
                for tile_path in slice_209_path.glob(TILE_GLOB)
            ),
        )
    )

    grid = TileGrid.from_tiles(tiles)
    assert grid == expected_matrix_zoom_5
    assert grid.resolution == (512, 1024)


def test__piramid(
    slices_dir_fixture: Path,
    slice209_tilegrid_zoom5: TileGrid,
    slice209_tilegrid_zoom4: TileGrid,
):
    tiles = list(
        extract_tile_metadata(tile_path)
        for tile_path in (slices_dir_fixture / "209").glob(TILE_GLOB)
    )

    expected_piramid = Piramid(
        levels={
            4: slice209_tilegrid_zoom4,
            5: slice209_tilegrid_zoom5,
        }
    )

    piramid = Piramid.build(tiles)

    assert piramid == expected_piramid
    assert piramid.extent == expected_piramid.extent
    assert piramid.minzoom == expected_piramid.minzoom
    assert piramid.maxzoom == expected_piramid.maxzoom
    assert piramid.tile_dimensions == expected_piramid.tile_dimensions
