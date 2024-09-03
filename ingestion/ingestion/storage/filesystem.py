from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, TypeAlias, get_args

from ingestion.schema import DataAnnotationEntry, DataContainer

logger = logging.getLogger(__name__)

_NEURONS_FILE = "neurons.json"
_DATASETS_FILE = "datasets.json"
_CONNECTIONS_DIR = "connections"
_ANNOTATIONS_DIR = "annotations"


def find_data_files(dir: Path) -> DataContainer[Path]:
    neurons_file = dir / _NEURONS_FILE
    if not neurons_file.exists():
        raise FileNotFoundError(neurons_file)
    logger.debug(f"found neurons file: {neurons_file}")

    datasets_file = dir / _DATASETS_FILE
    if not datasets_file.exists():
        raise FileNotFoundError(datasets_file)
    logger.debug(f"found datasets file: {datasets_file}")

    connections_dir = dir / _CONNECTIONS_DIR
    connections_files = {}

    for file in connections_dir.glob("*.json"):
        logger.debug(f"found '{file.stem}' connections file: {file}")
        connections_files[file.stem] = file

    annotations_dir = dir / _ANNOTATIONS_DIR
    annotations_files: dict[DataAnnotationEntry, Path] = {}

    for possible_entry in get_args(DataAnnotationEntry):
        annotation_file = annotations_dir / f"{possible_entry}.annotations.json"
        if annotation_file.exists():
            logger.debug(
                f"found '{possible_entry}' annotations file: {annotation_file}"
            )
            annotations_files[possible_entry] = annotation_file
        else:
            logger.debug(f"did not find '{possible_entry}' annotations file")

    return DataContainer(
        neurons=neurons_file,
        datasets=datasets_file,
        connections=connections_files,
        annotations=annotations_files,
    )


def load_data(files: DataContainer[Path]) -> dict:
    with open(files.neurons) as f:
        neurons = json.load(f)

    with open(files.datasets) as f:
        datasets = json.load(f)

    def load_json_file(file: Path) -> Any:
        with open(file) as f:
            return json.load(f)

    connections = {
        dataset: load_json_file(file) for dataset, file in files.connections.items()
    }
    annotations = {
        annotation_entry: load_json_file(file)
        for annotation_entry, file in files.annotations.items()
    }

    return {
        "neurons": neurons,
        "datasets": datasets,
        "connections": connections,
        "annotations": annotations,
    }


Slice: TypeAlias = int


def find_segmentation_files(dir: Path) -> list[tuple[Slice, Path]]:
    def extract_slice(filepath: Path) -> int:
        match = re.search(r"_s(\d+)\.json$", str(filepath))
        if match:
            return int(match.group(1))
        raise Exception(
            f"unable to extract slice number from segmentation file: {filepath}"
        )

    return [(extract_slice(f), f) for f in dir.glob("*.json")]


TILE_GLOB = "*_*_*.jpg"


def find_tiles(dir: Path) -> dict[Slice, list[Path]]:
    tiles: dict[Slice, list[Path]] = {}

    for e in os.listdir(dir):
        entry = dir / e
        if not entry.is_dir() or not e.isdigit():
            logging.warn(f"tile finder: skipping entry '{entry}'")
            continue

        tiles[int(e)] = [f for f in entry.glob(TILE_GLOB)]

    return tiles
