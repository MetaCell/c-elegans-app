from __future__ import annotations

import logging
import operator
import os
import re
import sys
from argparse import ArgumentParser, Namespace
from itertools import groupby
from pathlib import Path
from time import sleep

from google.cloud import storage
from pydantic import BaseModel, ValidationError
from tqdm import tqdm

from ingestion.cli import ask, type_directory, type_file
from ingestion.em_metadata import Piramid, Tile
from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.schema import Data
from ingestion.storage.blob import (
    fs_3d_blob_name,
    fs_em_tile_blob_name,
    fs_segmentation_blob_name,
)
from ingestion.storage.filesystem import (
    find_3d_files,
    find_data_files,
    find_segmentation_files,
    load_data,
    load_tiles,
)
from ingestion.storage.gcp import RemoteStorage
from ingestion.xdg import xdg_gcloud_config

logger = logging.getLogger(__name__)


def add_flags(parser: ArgumentParser):
    parser.add_argument(
        "dataset_id",
        help="dataset identifier for the ingested files",
    )

    def add_in_dir(parser: ArgumentParser, kind: str):
        parser.add_argument(
            f"-{kind.lower()[0]}",
            f"--{kind.lower()}",
            default=None,
            type=type_directory,
            help=f"directory for {kind} data",
        )

    def add_in_paths(parser: ArgumentParser, kind: str):
        parser.add_argument(
            f"-{kind.lower()[0]}",
            f"--{kind.lower()}",
            nargs="+",
            type=Path,
            help=f"directory, files or glob match for {kind} data",
        )

    def add_flag(parser: ArgumentParser, name: str, help: str):
        group = parser.add_mutually_exclusive_group()
        group.add_argument(
            f"--{name}",
            default=True,
            action="store_true",
            help=f"{help}",
        )
        group.add_argument(
            f"--no-{name}", dest=name, action="store_false", help=f"don't {help}"
        )

    add_in_dir(parser, "data")
    add_in_paths(parser, "segmentations")
    add_in_paths(parser, "3D")
    add_in_paths(parser, "EM")

    add_flag(parser, "overwrite", "overwrite files in the bucket")

    parser.add_argument(
        "--prune",
        help="prune files in the bucket before upload",
        default=False,
        action="store_true",
    )

    parser.add_argument(
        "-y",
        help="responds with yes to all user prompts (including '--prune')",
        default=False,
        action="store_true",
    )

    ENV_PREFIX = "C_ELEGANS"

    def envOr(name: str, default: str) -> str:
        return os.environ.get(ENV_PREFIX + "_" + name, default)

    parser.add_argument(
        "--gcp-bucket",
        help=f"google storage bucket name (envvar: {ENV_PREFIX}_GCP_BUCKET_NAME)",
        default=envOr("GCP_BUCKET_NAME", "celegans"),
    )

    parser.add_argument(
        "--gcp-credentials",
        help="google cloud json credentials (envvar: GOOGLE_APPLICATION_CREDENTIALS)",
        type=type_file,
        default=os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            str(xdg_gcloud_config() / "application_default_credentials.json"),
        ),
    )


def validate_data(dir: Path):
    # TODO: do something with dataset_id, like check if present in datasets.json

    data_files = find_data_files(dir)
    json_data = load_data(data_files)

    try:
        Data.model_validate(json_data)
    except ValidationError as e:
        err_header = (
            "Seems like we found something unexpected with your data.\n"
            "Bellow is an overview of what we think may be wrong.\n"
            "If you think this is an error on our side, please reach out!\n"
        )

        sys.stderr.write(
            DataValidationError(e).humanize(
                w=ErrorWriter(),
                header=err_header,
                data_files=data_files,
            )
        )

        sys.exit(1)

    logger.info(f"data in {dir} is valid!")


def prune_bucket(bucket: storage.Bucket):
    """Prune the bucket and waits until the bucket is empty by checking it periodically."""

    bucket.lifecycle_rules = [{"action": {"type": "Delete"}, "condition": {"age": 0}}]
    bucket.patch()

    try:
        sleep_interval = 10
        while True:
            has_blobs = len(list(bucket.list_blobs(max_results=1))) != 0
            if not has_blobs:
                break

            logger.info(f"bucket '{bucket.name}' is not yet empty. waiting...")
            sleep(sleep_interval)
    except Exception as e:
        raise
    finally:
        # ensure that the lifecycle rule is removed
        bucket.lifecycle_rules = []
        bucket.patch()

    logger.info(f"bucket '{bucket.name}' was pruned successfully!")


def upload_segmentations(
    dataset_id: str,
    seg_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    logger.info(f"uploading segmentation...")

    segmentation_files = find_segmentation_files(seg_paths)

    # list cast to have a progression bar (it sucks)
    seg_files = list(segmentation_files)
    if len(seg_files) == 0:
        logger.warning("skipping segmentation upload: no files matched")
        return

    pbar = tqdm(seg_files)
    for _, segmentation_file in pbar:
        pbar.set_description(str(segmentation_file))
        rs.upload(
            segmentation_file,
            fs_segmentation_blob_name(dataset_id, segmentation_file),
            overwrite=overwrite,
        )


def upload_3d(
    dataset_id: str, paths: list[Path], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info(f"uploading 3D files...")

    paths_3d = find_3d_files(paths)

    files_3d = list(paths_3d)  # list cast to have a progression bar (it sucks)
    if len(files_3d) == 0:
        logger.warning("skipping 3D files upload: no files matched")
        return

    pbar = tqdm(files_3d)
    for f3d in pbar:
        pbar.set_description(str(f3d))
        rs.upload(f3d, fs_3d_blob_name(dataset_id, f3d), overwrite=overwrite)


class PiramidMetadata(BaseModel):
    slice: int
    zooms: list[int]
    extent: tuple[int, int, int, int]
    resolutions: list[tuple[int, int]]
    sizes: list[tuple[int, int]]


class Metadata(BaseModel):
    nslices: int
    slices: list[PiramidMetadata]


def upload_tileset_metadata(
    tiles: list[Tile], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info("calculating EM tiles metadata...")

    metadata: list[PiramidMetadata] = []

    tiles.sort(key=operator.attrgetter("slice"))  # groupby expects things sorted
    pbar = tqdm(tiles)
    for slice, stiles in groupby(pbar, lambda t: t.slice):
        pbar.set_description(str(slice))
        piramid = Piramid.build(list(stiles))

        metadata.append(
            PiramidMetadata(
                slice=slice,
                zooms=piramid.zooms,
                extent=piramid.extent,
                resolutions=[zoom.resolution for zoom in piramid.levels.values()],
                sizes=[zoom.size for zoom in piramid.levels.values()],
            )
        )

    logger.info("uploading EM tiles metadata...")
    
    # TODO: this will overwrite all the metadata in the bucket (a file by slice?)
    json_content = Metadata(nslices=len(metadata), slices=metadata).model_dump_json(indent=2)
    rs.upload_from_string(json_content, "metadata-dev-test.json", overwrite=overwrite)


def upload_em_tiles(
    dataset_id: str,
    tile_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    # list cast to have a progression bar, which takes a lot of time (it sucks)
    tiles = list(load_tiles(tile_paths))
    if len(tiles) == 0:
        logger.warning("skipping EM tiles upload: no files matched")
        return

    upload_tileset_metadata(tiles, rs, overwrite=overwrite)

    logger.info("uploading EM tiles...")

    pbar = tqdm(tiles)
    for tile in pbar:
        pbar.set_description(str(tile.path))
        rs.upload(
            tile.path, fs_em_tile_blob_name(dataset_id, tile), overwrite=overwrite
        )
        # TODO: the amount of files is a bit overwelming and takes a lot of time


def ingest_cmd(args: Namespace):
    """Runs the ingestion command."""

    if args.data:
        validate_data(args.data)
    else:
        logger.warning(f"skipping data validation: flag not set")

    storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
    bucket = storage_client.get_bucket(args.gcp_bucket)
    rs = RemoteStorage(bucket)

    if args.prune:
        prune = args.y or ask(
            "Are you sure you want to delete all files on the bucket?"
        )

        if prune:
            logger.warning(f"prunning all files from {bucket.name=}...")
            prune_bucket(bucket)
        else:
            logger.info(f"skipped prunning files from the bucket")

    if args.segmentations:
        upload_segmentations(
            args.dataset_id, args.segmentations, rs, overwrite=args.overwrite
        )
    else:
        logger.warning("skipping segmentation upload: flag not set")

    if paths := vars(args)["3d"]:
        upload_3d(args.dataset_id, paths, rs, overwrite=args.overwrite)
    else:
        logger.warning("skipping 3D files upload: flag not set")

    if args.em:
        upload_em_tiles(args.dataset_id, args.em, rs, overwrite=args.overwrite)
    else:
        logger.warning("skipping EM tiles upload: flag not set")


if __name__ == "__main__":
    from argparse import ArgumentDefaultsHelpFormatter

    from ingestion.logging import setup_logger

    parser = ArgumentParser(
        prog="ingest",
        description="ingest files into the c-elegans deployment",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "--debug",
        help="runs with debug logs",
        default=False,
        action="store_true",
    )

    add_flags(parser)

    args = parser.parse_args()

    setup_logger(args.debug)

    ingest_cmd(args)
