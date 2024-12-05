from __future__ import annotations

from collections import Counter
import re
from pathlib import Path

from ingestion.em_metadata import Tile
from ingestion.storage.filesystem import SEGMENTATION_REGEX

STL_FILE_REGEX = r"-[^-_]+_[^-]+\.\w+$"


def fs_data_blob_name(p: Path, base_dir: Path) -> str:
    return f"db-raw-data/{p.relative_to(base_dir)}"


def fs_segmentation_blob_name(dataset_id: str, p: Path) -> str:
    match = re.search(SEGMENTATION_REGEX, p.name)
    if not match:
        raise Exception(f"could not extract the slice id from segmentation file: {p}")

    return f"{dataset_id}/segmentations/s{match.group(1)}.json"


def fs_resolutions_metadata_blob_name(dataset_id: str) -> str:
    return f"{dataset_id}/segmentations/metadata.json"


def find_longest_suffix(paths: list[Path]) -> str:
    if not paths or len(paths) < 2:
        return ""

    suffixes = Counter(
        [f"-{p.stem.split('-')[-1]}" if "-" in p.stem else "" for p in paths]
    )
    most_common_suffix, _ = suffixes.most_common(1)[0]
    return most_common_suffix if len(most_common_suffix) > 0 else ""


def fs_3d_blob_name(dataset_id: str, p: Path, regex: str) -> str:
    name = p.name
    substitution = p.suffix if not regex else ""
    regex = STL_FILE_REGEX if not regex else regex
    name = re.sub(regex, substitution, name)
    return f"{dataset_id}/3d/{name}"


def fs_em_tile_blob_name(dataset_id: str, tile: Tile) -> str:
    # <dataset_id>/em/<slice>/<y>_<x>_<z>.jpg
    return f"{dataset_id}/em/{tile.slice}/{tile.path.name}"


def em_metadata_blob_name(dataset_id: str) -> str:
    return f"{dataset_id}/em/metadata.json"
