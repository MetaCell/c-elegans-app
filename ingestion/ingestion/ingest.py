from __future__ import annotations

import logging
import os
from argparse import ArgumentParser, Namespace

from ingestion.cli import type_directory, type_file
from ingestion.xdg import xdg_celegans_cache, xdg_gcloud_config

logger = logging.getLogger(__name__)


def add_flags(parser: ArgumentParser):
    parser.add_argument(
        "dir",
        help="input files to be ingested (default: current directory)",
        type=type_directory,
        default=os.path.curdir,
    )

    def add_in_dir(kind: str):
        parser.add_argument(
            f"-{kind[0]}",
            f"--{kind}-dir",
            default=None,
            type=type_directory,
            help=f"directory for {kind} data",
        )

    add_in_dir("segmentation")

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

    def add_flag(name: str, help: str):
        parser.add_argument(
            f"--{name}",
            default=True,
            action="store_true",
            help=f"{help} (default true)",
        )
        parser.add_argument(
            f"--no-{name}", dest=name, action="store_false", help=f"don't {help}"
        )

    add_flag("cache", "use cached bucket files metadata")

    ENV_PREFIX = "C_ELEGANS"

    def envOr(name: str, default: str) -> str:
        return os.environ.get(ENV_PREFIX + "_" + name, default)

    parser.add_argument(
        "--cache-path",
        help="file with c-elegans cache",
        type=type_directory,
        default=envOr("CACHE_PATH", str(xdg_celegans_cache())),
    )

    parser.add_argument(
        "--gcp-bucket",
        help="google storage bucket name",
        default=envOr("GCP_BUCKET_NAME", "celegans"),
    )

    parser.add_argument(
        "--gcp-credentials",
        help="google cloud json credentials",
        type=type_file,
        default=os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            str(xdg_gcloud_config() / "application_default_credentials.json"),
        ),
    )


def ingest_cmd(args: Namespace, *, debug: bool = False):
    """Runs the ingestion command."""

    import sys
    from itertools import islice

    from google.cloud import storage
    from pydantic import ValidationError
    from tqdm import tqdm

    from ingestion.cli import ask
    from ingestion.errors import DataValidationError, ErrorWriter
    from ingestion.filesystem import find_data_files, load_data
    from ingestion.schema import Data
    from ingestion.storage.sqlite import SQLiteKVStore

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

    # find segmentation files

    # upload segmentation files

    # find tile files

    # upload tile files

    blobs = [
        blob
        for blob in tqdm(
            islice(bucket.list_blobs(fields="items(name,crc32c),nextPageToken"), 0, 10)
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


if __name__ == "__main__":
    from argparse import ArgumentDefaultsHelpFormatter

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

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    ingest_cmd(args, debug=args.debug)
