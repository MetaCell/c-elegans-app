from __future__ import annotations

from collections import defaultdict
from itertools import combinations
import re
from pathlib import Path

from ingestion.em_metadata import Tile
from ingestion.storage.filesystem import SEGMENTATION_REGEX

STL_FILE_REGEX = r"-[^-_]+_[^-]+\.stl"


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

    path_names = [p.name for p in paths]
    suffix_count = defaultdict(int)

    # Iterate over all unique pairs of path names
    for name1, name2 in combinations(path_names, 2):
        suffix = ""
        min_len = min(len(name1), len(name2))

        # Compare suffixes character by character from the end
        for k in range(1, min_len + 1):
            # We update the suffix if it's common
            if name1[-k] == name2[-k]:
                suffix = name1[-k:]
                suffix_count[suffix] += 1
            else:
                break

    # Find the longest suffix with at least 2 occurrences
    longest_suffix = ""
    for suffix, count in suffix_count.items():
        if count >= 1 and len(suffix) > len(longest_suffix):
            longest_suffix = suffix

    return longest_suffix


def fs_3d_blob_name(dataset_id: str, p: Path, regex: str) -> str:
    name = p.name
    regex = STL_FILE_REGEX if not regex else regex
    name = re.sub(regex, ".stl", name)
    return f"{dataset_id}/3d/{name}"


def fs_em_tile_blob_name(dataset_id: str, tile: Tile) -> str:
    # <dataset_id>/em/<slice>/<y>_<x>_<z>.jpg
    return f"{dataset_id}/em/{tile.slice}/{tile.path.name}"


def em_metadata_blob_name(dataset_id: str) -> str:
    return f"{dataset_id}/em/metadata.json"
