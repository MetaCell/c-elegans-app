from __future__ import annotations

import logging
import os
import sys
from argparse import ArgumentParser, Namespace
from itertools import islice
from pathlib import Path

from google.cloud import storage
from pydantic import ValidationError
from tqdm import tqdm

from ingestion.cli import ask, type_file, type_directory
from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.schema import Data
from ingestion.segmentation.piramid import Tile
from ingestion.storage.filesystem import (
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
    # TODO: do something with dataset_id

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

        sys.stdout.write(
            DataValidationError(e).humanize(
                w=ErrorWriter(),
                header=err_header,
                data_files=data_files,
            )
        )

        sys.exit(1)
    
    logger.info(f"data in {dir} is valid!")


def prune_bucket(bucket: storage.Bucket):
    bucket.lifecycle_rules = [{"action": {"type": "Delete"}, "condition": {"age": 0}}]
    bucket.patch()

    """Wait until the bucket is empty by checking periodically."""

    from time import sleep

    sleep_interval = 10
    while True:
        has_blobs = len(list(bucket.list_blobs(max_results=1))) != 0
        if not has_blobs:
            break

        print(f"bucket '{bucket.name}' is not yet empty. waiting...")
        sleep(sleep_interval)

    logger.info(f"bucket '{bucket.name}' was pruned successfully!")

    bucket.lifecycle_rules = []
    bucket.patch()


def upload_segmentations(
    seg_paths: list[Path], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info(f"uploading segmentation...")

    segmentation_files = find_segmentation_files(seg_paths)

    def fs_to_blob_name(f: Path) -> str:
        return f"sem-adult/segmentation-mip0/{f.name}"

    seg_files = list(
        segmentation_files
    )  # list cast to have a progression bar (it sucks)
    if len(seg_files) == 0:
        logger.warn("skipping segmentation upload: no files matched")
        return

    pbar = tqdm(seg_files)
    for _, segmentation_file in pbar:
        pbar.set_description(segmentation_file.name)
        rs.upload(
            segmentation_file,
            fs_to_blob_name(segmentation_file),
            overwrite=overwrite,
        )


def upload_em_tiles(
    tile_paths: list[Path], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info("uploading EM tiles...")

    tiles = load_tiles(tile_paths)

    def fs_to_blob_name(tile: Tile) -> str:
        # sem-adult/catmaid-tiles/<slice>/<y>_<x>_<z>.jpg
        return f"sem-adult/catmaid-tiles/{tile.slice}/{tile.path.name}"

    # TODO: understand where to send tile matrixes and piramid metadata
    # store at the root of the dataset 'dir'

    # NOTE: alternative iterator to group by slice
    # pbar = tqdm(
    #     [(slice, tile) for slice, tiles in groupby(tiles, lambda t: t.slice) for tile in tiles]
    # )

    tile_files = list(tiles)  # list cast to have a progression bar (it sucks)
    if len(tile_files) == 0:
        logger.warn("skipping EM tiles upload: no files matched")
        return

    pbar = tqdm(tile_files)
    for tile in pbar:
        pbar.set_description(str(tile.path))
        rs.upload(tile.path, fs_to_blob_name(tile), overwrite=overwrite)
        # TODO: the amount of files is a bit overwelming and takes a lot of time


def ingest_cmd(args: Namespace):
    """Runs the ingestion command."""

    if args.data:
        validate_data(args.data)
    else:
        logger.warn(f"skipping data validation: flag not set")

    storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
    bucket = storage_client.get_bucket(args.gcp_bucket)
    rs = RemoteStorage(bucket)

    if args.prune:
        prune = args.y or ask(
            "Are you sure you want to delete all files on the bucket?"
        )

        if prune:
            logger.warn(f"prunning all files from {bucket.name=}...")
            prune_bucket(bucket)
        else:
            logger.info(f"skipped prunning files from the bucket")

    if args.segmentations:
        upload_segmentations(args.segmentations, rs, overwrite=args.overwrite)
    else:
        logger.warn("skipping segmentation upload: flag not set")

    if args.em:
        upload_em_tiles(args.em, rs, overwrite=args.overwrite)
    else:
        logger.warn("skipping EM tiles upload: flag not set")

    print("Done! 🎉")


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
