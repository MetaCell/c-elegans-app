from __future__ import annotations

from pathlib import Path

import pytest

from ingestion.em_metadata import Tile
from ingestion.storage.blob import (
    find_longest_suffix,
    fs_3d_blob_name,
    fs_data_blob_name,
    fs_em_tile_blob_name,
    fs_segmentation_blob_name,
)


@pytest.mark.parametrize(
    "dataset_id, file_path, base_dir, blob_name",
    [
        (
            "witvliet_2020_1",
            Path("./data/db-raw-data/neurons.json"),
            Path("./data/db-raw-data"),
            "db-raw-data/neurons.json",
        ),
        (
            "witvliet_2020_1",
            Path("./data/db-raw-data/datasets.json"),
            Path("./data/db-raw-data"),
            "db-raw-data/datasets.json",
        ),
        (
            "witvliet_2020_1",
            Path("./data/db-raw-data/connections/white_1986_whole.json"),
            Path("./data/db-raw-data"),
            "db-raw-data/connections/white_1986_whole.json",
        ),
        (
            "witvliet_2020_1",
            Path("./data/db-raw-data/annotations/complete.annotations.json"),
            Path("./data/db-raw-data"),
            "db-raw-data/annotations/complete.annotations.json",
        ),
    ],
)
def test__fs_data_blob_name(
    dataset_id: str, file_path: Path, base_dir: Path, blob_name: str
):
    assert fs_data_blob_name(file_path, base_dir) == blob_name


@pytest.mark.parametrize(
    "dataset_id, file_path, blob_name",
    [
        (
            "witvliet_2020_1",
            Path(
                "../sem-adult/segmentation-mip0Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s690.json"
            ),
            "witvliet_2020_1/segmentations/s690.json",
        ),
    ],
)
def test__fs_segmentation_blob_name(dataset_id: str, file_path: Path, blob_name: str):
    assert fs_segmentation_blob_name(dataset_id, file_path) == blob_name


@pytest.mark.parametrize(
    "dataset_id, file_path, blob_name",
    [
        (
            "witvliet_2020_1",
            Path("../data/the-3d-files/SDQR-SEM_adult.stl"),
            "witvliet_2020_1/3d/SDQR.stl",
        ),
        (
            "dataset8",
            Path("~/BWM-DL02-SEM_adult.stl"),
            "dataset8/3d/BWM-DL02.stl",
        ),
        (
            "PopCorn",
            Path("./../hhh/Fragment11-SEM_adult.stl"),
            "PopCorn/3d/Fragment11.stl",
        ),
        (
            "witvliet_2020_1",
            Path("../data/the-3d-files/SDQR.stl"),  # no SEM_adult
            "witvliet_2020_1/3d/SDQR.stl",
        ),
        (
            "witvliet_2020_2",
            Path("../data/the-3d-files/SDQR-ABCD.stl"),  # no SEM_adult
            "witvliet_2020_2/3d/SDQR-ABCD.stl",
        ),
        (
            "witvliet_2020_3",
            Path("../data/the-3d-files/SDQR-ABCD-SEM_TEENAGER.stl"),
            "witvliet_2020_3/3d/SDQR-ABCD.stl",
        ),
        (
            "witvliet_2020_4",
            Path("../data/the-3d-files/SDQR-SEM_TEENAGER.stl"),  # no SEM_adult
            "witvliet_2020_4/3d/SDQR.stl",
        ),
    ],
)
def test__fs_3d_blob_name(dataset_id: str, file_path: Path, blob_name: str):
    assert fs_3d_blob_name(dataset_id, file_path, regex="") == blob_name


@pytest.mark.parametrize(
    "paths, suffix",
    [
        (["ABC", "DEF"], ""),
        (["ABCF", "DEF"], "F"),
        (["ABC-DEF.stl", "DEF.stl"], "DEF.stl"),
        (["ABC-DEF-SEM_adult.stl", "AAA-SEM_adult.stl"], "-SEM_adult.stl"),
        (["ABC-DEF-SEM_adult.stl", "AAA-SEM_adult.stl", "DEF.stl"], "-SEM_adult.stl"),
        (
            ["ABC-DEF-SEM_adult.stl", "AAA-SEM_adult.stl", "DEF.stl", "AABC.stl"],
            "-SEM_adult.stl",
        ),
    ],
)
def test__longest_common_suffix(paths: list[str], suffix: str):
    # wrap the strings as Path first
    file_paths = [Path(s) for s in paths]
    assert find_longest_suffix(file_paths) == suffix


@pytest.mark.parametrize(
    "dataset_id, tile, blob_name",
    [
        (
            "witvliet_2020_1",
            Tile(
                position=(1, 0),
                zoom=4,
                path=Path("ingestion/tests/fixtures/em-tiles/209/0_1_4.jpg"),
                slice=209,
            ),
            "witvliet_2020_1/em/209/0_1_4.jpg",
        ),
    ],
)
def test__fs_em_tile_blob_name(dataset_id: str, tile: Tile, blob_name: str):
    assert fs_em_tile_blob_name(dataset_id, tile) == blob_name
