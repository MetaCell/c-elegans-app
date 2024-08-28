from __future__ import annotations

import logging
import os
import sys
from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser, ArgumentTypeError
from collections import namedtuple
from itertools import islice
from pathlib import Path
from typing import Sequence

from google.cloud import storage
from pydantic import ValidationError
from tqdm import tqdm

from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.filesystem import find_data_files, load_data
from ingestion.schema import Data
from ingestion.storage.sqlite import SQLiteKVStore
from ingestion.xdg import xdg_celegans_cache, xdg_gcloud_config

logger = logging.getLogger(__name__)


def ask(question: str) -> bool:
    """Ask for confirmation from user."""

    print(question + " [Y/n]")
    while True:
        match input().lower().strip():
            case "y" | "yes":
                return True
            case "n" | "no" | "":  # abort on no consent by default
                return False
            case _:
                print("Please enter Y or N")
                continue


def main(argv: Sequence[str] | None = None):
    parser = ArgumentParser(
        prog="celegans",
        description="Tool for the c-elegans application.",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    # global command flags
    parser.add_argument(
        "--debug",
        help="runs the ingestion with debug logs",
        default=False,
        action="store_true",
    )

    subparsers = parser.add_subparsers(dest="command")

    # subcommand for the extraction of segmentation files
    parser_extract = subparsers.add_parser(
        name="extract",
        help="Extracs segentations from the bitmap files.",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    # subcommand for the file ingestionsubparsers = parser.add_subparsers()
    parser_ingest = subparsers.add_parser(
        name="ingest",
        help="Ingest files into the c-elegans deployment.",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    def type_directory(raw_path: str) -> Path:
        """Argument parser type for a directory"""
        if not os.path.isdir(raw_path):
            raise ArgumentTypeError(f"{raw_path} is not an existing directory")
        return Path(os.path.abspath(raw_path))

    def type_file(raw_path: str) -> Path:
        """Argument parser type for a file"""
        if not os.path.isfile(raw_path):
            raise ArgumentTypeError(f"{raw_path} is not a file")
        return Path(os.path.abspath(raw_path))

    parser_ingest.add_argument(
        "dir",
        help="input files to be ingested (default: current directory)",
        type=type_directory,
        default=os.path.curdir,
    )

    def add_in_dir(parser: ArgumentParser, kind: str):
        parser.add_argument(
            f"-{kind[0]}",
            f"--{kind}-dir",
            default=None,
            type=type_directory,
            help=f"directory for {kind} data",
        )

    add_in_dir(parser_ingest, "segmentation")

    parser_ingest.add_argument(
        "--overwrite",
        help="overwrite files in the bucket",
        default=False,
        action="store_true",
    )

    parser_ingest.add_argument(
        "--prune",
        help="prune files in the bucket before upload",
        default=False,
        action="store_true",
    )

    parser_ingest.add_argument(
        "-y",
        help="responds with yes to all user prompts (including '--prune')",
        default=False,
        action="store_true",
    )

    def add_flag(parser: ArgumentParser, name: str, help: str):
        parser.add_argument(
            f"--{name}",
            default=True,
            action="store_true",
            help=f"{help} (default true)",
        )
        parser.add_argument(
            f"--no-{name}", dest=name, action="store_false", help=f"don't {help}"
        )

    add_flag(parser_ingest, "cache", "use cached bucket files metadata")

    ENV_PREFIX = "C_ELEGANS"

    def envOr(name: str, default: str) -> str:
        return os.environ.get(ENV_PREFIX + "_" + name, default)

    parser_ingest.add_argument(
        "--cache-path",
        help="file with c-elegans cache",
        type=type_directory,
        default=envOr("CACHE_PATH", str(xdg_celegans_cache())),
    )

    parser_ingest.add_argument(
        "--gcp-bucket",
        help="google storage bucket name",
        default=envOr("GCP_BUCKET_NAME", "celegans"),
    )

    parser_ingest.add_argument(
        "--gcp-credentials",
        help="google cloud json credentials",
        type=type_file,
        default=os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            str(xdg_gcloud_config() / "application_default_credentials.json"),
        ),
    )

    args = parser.parse_args(argv)

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    def ingest(args):
        """Runs the ingestion command."""
        data_files = find_data_files(args.dir)
        json_data = load_data(data_files)

        err_header = (
            "Seems like we found something unexpected with your data.\n"
            "Bellow is an overview of what we think may be wrong.\n"
            "If you think this is an error on our side, please reach out!\n"
        )

        try:
            Data.model_validate(json_data)
        except ValidationError as e:
            sys.stdout.write(
                DataValidationError(e).humanize(
                    w=ErrorWriter(),
                    header=err_header,
                    data_files=data_files,
                )
            )
            sys.exit(1)

        # understand what we have in the GCP bucket
        storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
        bucket = storage_client.get_bucket(args.gcp_bucket)

        blobs = [
            blob
            for blob in tqdm(
                islice(
                    bucket.list_blobs(fields="items(name,crc32c),nextPageToken"), 0, 10
                )
            )
        ]  # TODO: remove 10 blobs limit

        blobs_hash = SQLiteKVStore(args.cache_path / "blobs-hash-cache.db")
        for blob in blobs:
            blobs_hash.set(blob.name, blob.crc32c)
            print(blob.name, blob.crc32c)
        blobs_hash.close()  # commit changes

        if args.prune:
            prune = args.y or ask(
                "Are you sure you want to delete all files in the bucket?"
            )

            if prune:
                logger.warn(f"prunning all files from {bucket.name=}...")
            else:
                logger.debug("keeping files in the bucket")

        print("OK")

    def extract(args):
        print("Not Implemented")

    match args.command:
        case "ingest":
            ingest(args)
        case "extract":
            extract(args)


if __name__ == "__main__":
    main()
