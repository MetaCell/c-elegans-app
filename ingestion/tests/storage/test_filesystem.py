from __future__ import annotations

import json
from pathlib import Path

import pytest

from ingestion.em_metadata import Tile
from ingestion.schema import DataContainer
from ingestion.storage.filesystem import (
    _CONNECTIONS_DIR,
    extract_tile_metadata,
    find_data_files,
    load_data,
)


def create_json_file(file_path: Path, content: dict | list[dict]):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w+") as f:
        json.dump(content, f)


def test__find_and_load_unknown_dataset(tmp_path: Path):
    create_json_file(tmp_path / "neurons.json", [])
    create_json_file(tmp_path / "datasets.json", [])  # white_1986_jse not defined here
    create_json_file(tmp_path / _CONNECTIONS_DIR / "white_1986_jse.json", [])

    data_files = find_data_files(tmp_path)

    assert data_files == DataContainer(
        neurons=tmp_path / "neurons.json",
        datasets=tmp_path / "datasets.json",
        connections={
            "white_1986_jse": tmp_path / _CONNECTIONS_DIR / "white_1986_jse.json"
        },
    )

    data = load_data(data_files)

    assert data == {
        "neurons": [],
        "datasets": [],
        "connections": {
            "white_1986_jse": []  # still exist here and will fail in validation
        },
        "annotations": {},
    }


def test__find_and_load_unknown_annotation(tmp_path: Path):
    create_json_file(tmp_path / "neurons.json", [])
    create_json_file(tmp_path / "datasets.json", [])
    create_json_file(tmp_path / "annotations/headd.annotations.json", {})

    data_files = find_data_files(tmp_path)

    assert data_files == DataContainer(
        neurons=tmp_path / "neurons.json",
        datasets=tmp_path / "datasets.json",
    )

    data = load_data(data_files)

    assert data == {
        "neurons": [],
        "datasets": [],
        "connections": {},
        "annotations": {},
    }


@pytest.fixture
def slice_em_fixture(request: pytest.FixtureRequest) -> Path:
    return Path(request.fspath).parent.parent / "fixtures" / "em-tiles" / "209"  # type: ignore


def test__extract_tile_metadata(slice_em_fixture: Path):
    test_tile_path = slice_em_fixture / "0_0_5.jpg"
    assert test_tile_path.exists() and test_tile_path.is_file()

    expected = Tile(position=(0, 0), zoom=5, path=test_tile_path, slice=209)

    got = extract_tile_metadata(test_tile_path)

    assert got == expected
