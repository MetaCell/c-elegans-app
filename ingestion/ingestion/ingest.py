from __future__ import annotations

import logging
import os
import sys
from argparse import ArgumentParser, Namespace, _ArgumentGroup
from pathlib import Path

from google.cloud import storage
from pydantic import ValidationError
from tqdm import tqdm

from ingestion.cli import ask, type_directory, type_file
from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.schema import Data
from ingestion.storage.filesystem import (
    find_data_files,
    find_segmentation_files,
    find_tiles,
    load_data,
)
from ingestion.storage.gcp import Uploader
from ingestion.xdg import xdg_celegans_cache, xdg_gcloud_config

logger = logging.getLogger(__name__)


def add_flags(parser: ArgumentParser):
    parser.add_argument(
        "dir",
        help="input directory to be ingested (default: current directory)",
        type=type_directory,
        default=os.path.curdir,
    )

    def add_in_dir(parser: ArgumentParser | _ArgumentGroup, kind: str):
        parser.add_argument(
            f"-{kind[0]}",
            f"--{kind}-dir",
            default=None,
            type=type_directory,
            help=f"directory for {kind} data",
        )

    def add_flag(parser: ArgumentParser | _ArgumentGroup, name: str, help: str):
        group = parser.add_mutually_exclusive_group()
        group.add_argument(
            f"--{name}",
            default=True,
            action="store_true",
            help=f"{help} (default true)",
        )
        group.add_argument(
            f"--no-{name}", dest=name, action="store_false", help=f"don't {help}"
        )

    dir_overlay = parser.add_argument_group("overlays")

    add_in_dir(dir_overlay, "segmentations")
    add_flag(dir_overlay, "segmentations", "upload segmentation files")

    add_in_dir(dir_overlay, "tiles")
    add_flag(dir_overlay, "tiles", "upload tile files")

    parser.add_argument(
        "--overwrite",
        help="overwrite files in the bucket",
        default=False,
        action="store_true",
    )

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

    add_flag(parser, "cache", "use cached bucket files metadata")

    ENV_PREFIX = "C_ELEGANS"

    def envOr(name: str, default: str) -> str:
        return os.environ.get(ENV_PREFIX + "_" + name, default)

    parser.add_argument(
        "--cache-path",
        help=f"file with c-elegans cache (envvar: {ENV_PREFIX}_CACHE_PATH)",
        type=type_directory,
        default=envOr("CACHE_PATH", str(xdg_celegans_cache())),
    )

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


def upload_segmentations(dir: Path, uploader: Uploader, *, overwrite: bool = False):
    if not dir.exists():  # only relevant when there is no overlay set
        logger.warn(f"skipping segmentations upload: expected '{dir}' doesn't exist!")
        return

    logger.info(f"uploading segmentation files in {dir}")

    segmentation_files = find_segmentation_files(dir)

    def fs_to_blob_name(f: Path) -> str:
        return str("sem-adult/segmentation-mip0" / f.relative_to(dir))

    pbar = tqdm(segmentation_files)
    for _, segmentation_file in pbar:
        pbar.set_description(segmentation_file.name)
        uploader.upload(
            segmentation_file,
            fs_to_blob_name(segmentation_file),
            overwrite=overwrite,
        )


def upload_tiles(dir: Path, uploader: Uploader, *, overwrite: bool = False):
    if not dir.exists():  # only relevant when there is no overlay set
        logger.warn(f"skipping tiles upload: expected '{dir}' doesn't exist!")
        return

    logger.info(f"uploading tiles in {dir}")

    slices_tiles = find_tiles(dir)

    def fs_to_blob_name(f: Path) -> str:
        return str("sem-adult/catmaid-tiles" / f.relative_to(dir))

    # TODO: understand where to send tile matrixes and piramid metadata

    pbar = tqdm(
        [(slice, path) for slice, paths in slices_tiles.items() for path in paths]
    )

    for slice, tile_path in pbar:
        pbar.set_description(f"{slice}/{tile_path.name}")
        uploader.upload(tile_path, fs_to_blob_name(tile_path), overwrite=overwrite)
        # TODO: the amount of files is a bit overwelming and takes a lot of time


def ingest_cmd(args: Namespace, *, debug: bool = False):
    """Runs the ingestion command."""

    data_files = find_data_files(args.dir)
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

    storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
    bucket = storage_client.get_bucket(args.gcp_bucket)
    uploader = Uploader(bucket)

    if args.prune:
        prune = args.y or ask(
            "Are you sure you want to delete all files on the bucket?"
        )

        if prune:
            logger.warn(f"prunning all files from {bucket.name=}...")
            # TODO: prune all files from bucket
        else:
            logger.info(f"skipped prunning files from the bucket")

    # upload segmentation files
    segmentation_path: Path = (
        args.segmentations_dir or args.dir / "sem-adult" / "segmentation-mip0"
    )
    if args.segmentations:
        upload_segmentations(segmentation_path, uploader, overwrite=args.overwrite)

    # upload tile files
    tiles_path: Path = args.tiles_dir or args.dir / "catmaid-tiles"
    if args.tiles:
        upload_tiles(tiles_path, uploader, overwrite=args.overwrite)

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

    ingest_cmd(args, debug=args.debug)
