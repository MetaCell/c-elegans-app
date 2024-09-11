from __future__ import annotations

from pathlib import Path

import pytest

from ingestion.em_metadata import Tile
from ingestion.storage.blob import (
    fs_3d_blob_name,
    fs_em_tile_blob_name,
    fs_segmentation_blob_name,
)


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
    ],
)
def test__fs_3d_blob_name(dataset_id: str, file_path: Path, blob_name: str):
    assert fs_3d_blob_name(dataset_id, file_path) == blob_name


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
