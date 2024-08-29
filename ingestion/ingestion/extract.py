from __future__ import annotations

import logging
from argparse import ArgumentParser, Namespace

from ingestion.cli import type_directory, type_file


def add_flags(parser: ArgumentParser):
    parser.add_argument(
        "-i",
        "--img-path",
        type=type_directory,
        help="path of a segmentation image or the folder containing the segmentation images",
        required=True,
    )

    parser.add_argument(
        "-l",
        "--lut",
        type=type_file,
        help="path towards the look-up table",
        required=True,
    )
    parser.add_argument(
        "--no-json", help="disable JSON file output", action="store_true"
    )
    parser.add_argument(
        "--write-img", help="write the result in an img format", action="store_true"
    )
    parser.add_argument(
        "--overwrite", help="force JSON/img production", action="store_true"
    )


def extract_cmd(args: Namespace, *, debug: bool = False):
    from tqdm import tqdm

    from ingestion.segmentation.extraction import extract, parse_entries  # type: ignore

    metadata_path = args.lut
    segmentation_folder = args.img_path
    files = (
        list(segmentation_folder.glob("*.png"))
        if segmentation_folder.is_dir()
        else [segmentation_folder]
    )
    for file in tqdm(files):
        tqdm.write(f"Extracting segments from {file}")
        extract(
            file,
            parse_entries(metadata_path),
            overwrite=args.overwrite,
            write_img=args.write_img,
            write_json=not args.no_json,
            print=tqdm.write,
        )


if __name__ == "__main__":
    from argparse import ArgumentDefaultsHelpFormatter

    parser = ArgumentParser(
        prog="extract",
        description="extracs segentations from the bitmap files",
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

    extract_cmd(args, debug=args.debug)
