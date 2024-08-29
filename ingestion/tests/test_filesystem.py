from __future__ import annotations

import json
from pathlib import Path

from ingestion.filesystem import _CONNECTIONS_DIR, find_data_files, load_data
from ingestion.schema import DataContainer


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
