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
_SYNAPSES_DIR = "synapses"


def find_data_files(dir: Path) -> DataContainer[Path]:
    neurons_file = dir / _NEURONS_FILE
    if not neurons_file.exists():
        raise FileNotFoundError(neurons_file)
    logger.info(f"found neurons file: {neurons_file}")

    datasets_file = dir / _DATASETS_FILE
    if not datasets_file.exists():
        raise FileNotFoundError(datasets_file)
    logger.info(f"found datasets file: {datasets_file}")

    connections_dir = dir / _CONNECTIONS_DIR
    if not connections_dir.exists():
        raise FileNotFoundError(connections_dir)
    connections_files = {}

    for file in connections_dir.glob("*.json"):
        logger.info(f"found '{file.stem}' connections file: {file}")
        connections_files[file.stem] = file

    synapses_dir = dir / _SYNAPSES_DIR
    if not synapses_dir.exists():
        raise FileNotFoundError(synapses_dir)
    synapses_files = {}

    for file in synapses_dir.glob("*.json"):
        logger.info(f"found '{file.stem}' synapses file: {file}")
        synapses_files[file.stem] = file

    annotations_dir = dir / _ANNOTATIONS_DIR
    annotations_files: dict[DataAnnotationEntry, Path] = {}

    for possible_entry in get_args(DataAnnotationEntry):
        annotation_file = annotations_dir / f"{possible_entry}.annotations.json"
        if annotation_file.exists():
            logger.info(f"found '{possible_entry}' annotations file: {annotation_file}")
            annotations_files[possible_entry] = annotation_file
        else:
            logger.warning(f"did not find '{possible_entry}' annotations file")

    return DataContainer(
        neurons=neurons_file,
        datasets=datasets_file,
        connections=connections_files,
        annotations=annotations_files,
        synapses=synapses_files,
    )


def load_data(files: DataContainer[Path]) -> dict:
    def load_json_file(file: Path) -> Any:
        with open(file) as f:
            return json.load(f)

    neurons = load_json_file(files.neurons)
    datasets = load_json_file(files.datasets)
    connections = {
        dataset: load_json_file(file) for dataset, file in files.connections.items()
    }
    synapses = {
        dataset: load_json_file(file) for dataset, file in files.synapses.items()
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
        "synapses": synapses,
    }


Slice: TypeAlias = int

SEGMENTATION_REGEX = re.compile(r".*s(\d+)\.json$")


def find_segmentation_files(paths: list[Path]) -> Generator[tuple[Slice, Path]]:
    def extract_slice(filepath: Path) -> int:
        match = re.search(SEGMENTATION_REGEX, str(filepath))
        if match:
            return int(match.group(1))
        raise Exception(
            f"unable to extract slice number from segmentation file: {filepath}"
        )

    if len(paths) == 1 and paths[0].is_dir():
        return (
            (extract_slice(f), f)
            for f in paths[0].rglob("*.json")
            if re.search(SEGMENTATION_REGEX, str(f))
        )

    return (
        (extract_slice(path), path)
        for path in paths
        if re.search(SEGMENTATION_REGEX, str(path))
    )


SYNAPSES_REGEX = re.compile(r".*s(\d+)\.json$")


def find_synapses_files(paths: list[Path]) -> Generator[tuple[Slice, Path]]:
    def extract_slice(filepath: Path) -> int:
        match = re.search(SYNAPSES_REGEX, str(filepath))
        if match:
            return int(match.group(1))
        raise Exception(
            f"unable to extract slice number from synapses file: {filepath}"
        )

    if len(paths) == 1 and paths[0].is_dir():
        return (
            (extract_slice(f), f)
            for f in paths[0].rglob("*.json")
            if re.search(SYNAPSES_REGEX, str(f))
        )

    return (
        (extract_slice(path), path)
        for path in paths
        if re.search(SYNAPSES_REGEX, str(path))
    )


def find_segmentation_resolution_metadata_file(paths: list[Path]) -> Path | None:
    if len(paths) == 0:
        return None

    if len(paths) == 1 and paths[0].is_dir():
        metadata_path = paths[0] / "metadata.json"
        if metadata_path.exists() and metadata_path.is_file():
            return metadata_path
        return None

    metadata_path = paths[0].parent / "metadata.json"
    if not metadata_path.exists():
        return None
    return metadata_path


def find_synapses_resolution_metadata_file(paths: list[Path]) -> Path | None:
    return find_segmentation_resolution_metadata_file(paths)  # same namming scheme


DEFAULT_EXCLUDED_WORDS = ["synapse"]


def find_3d_files(
    paths: list[Path], *, exclude_files_w_words: list[str] = DEFAULT_EXCLUDED_WORDS
) -> Generator[Path]:
    def contains_word(s: str, word_list: list[str]) -> bool:
        return any(word in s for word in word_list)

    if len(paths) == 1 and paths[0].is_dir():
        return (
            f
            for f in paths[0].rglob("*.stl")
            if not contains_word(str(f), exclude_files_w_words)
        )

    return (
        path
        for path in paths
        if path.suffix == ".stl"
        if not contains_word(str(path), exclude_files_w_words)
    )


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
