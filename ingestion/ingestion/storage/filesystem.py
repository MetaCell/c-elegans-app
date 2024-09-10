from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Generator, TypeAlias, get_args

from ingestion.em_metadata import Tile
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

SEGMENTATION_REGEX = r".*s(\d+)\.json$"


def find_segmentation_files(paths: list[Path]) -> Generator[tuple[Slice, Path]]:
    def extract_slice(filepath: Path) -> int:
        match = re.search(SEGMENTATION_REGEX, str(filepath))
        if match:
            return int(match.group(1))
        raise Exception(
            f"unable to extract slice number from segmentation file: {filepath}"
        )

    if len(paths) == 1 and paths[0].is_dir():
        return ((extract_slice(f), f) for f in paths[0].rglob("*.json"))

    return (
        (extract_slice(path), path)
        for path in paths
        if re.search(SEGMENTATION_REGEX, str(path))
    )


def find_3d_files(paths: list[Path]) -> Generator[Path]:
    if len(paths) == 1 and paths[0].is_dir():
        return (f for f in paths[0].rglob("*.stl"))

    return (path for path in paths if path.suffix == ".stl")


def extract_tile_metadata(f: Path) -> Tile:
    """Extracts the tile metadata from the file with path f"""
    # expected format is **/<slice>/<y>_<x>_<z>.jpg

    if f.suffix not in (".jpg"):  # TODO: understand which format we support
        raise Exception("unsupported EM tile image format (supported: .jpg)")

    s = f.stem.split("_")
    if len(s) < 3:
        raise Exception(f"unexpected file name: {f.name}")

    x = int(s[1])
    y = int(s[0])
    zoom = int(s[2])

    if not f.parent.stem.isdigit():
        raise Exception(f"could not extract slice information from: {f}")

    slice = int(f.parent.stem)

    return Tile(position=(x, y), zoom=zoom, path=f, slice=slice)


TILE_GLOB = "*_*_*.jpg"


def load_tiles(paths: list[Path]) -> Generator[Tile]:
    # handle path being a single directory
    if len(paths) == 1 and paths[0].is_dir():
        paths = [f for f in paths[0].rglob(TILE_GLOB)]

    return (extract_tile_metadata(path) for path in paths)
