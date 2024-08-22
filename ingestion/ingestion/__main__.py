from __future__ import annotations

import logging

from pydantic import ValidationError

from ingestion.filesystem import find_data_files, load_data
from ingestion.schema import Data


def main():
    import argparse
    import os

    parser = argparse.ArgumentParser(
        description="This is a python script to read c-elegans ingestion"
        "files and validate its content."
    )

    def directory(raw_path):
        if not os.path.isdir(raw_path):
            raise argparse.ArgumentTypeError(f"{raw_path} is not an existing directory")
        return os.path.abspath(raw_path)

    parser.add_argument(
        "-i",
        "--ingestion-dir",
        help="input files to be ingested (default: current directory)",
        type=directory,
        default=os.path.curdir,
    )

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
        "--debug",
        help="runs the ingestion with debug logs",
        default=False,
        action="store_true",
    )

    args = parser.parse_args()

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    data_files = find_data_files(args.ingestion_dir)
    json_data = load_data(data_files)
    Data.model_validate(json_data)
    print("OK")


if __name__ == "__main__":
    try:
        import pydantic as _
    except ImportError:
        print('error: missing pydantic; try "pip install pydantic"')

    try:
        main()
    except ValidationError as e:
        print(str(e))
        raise
