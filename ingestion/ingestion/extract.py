from __future__ import annotations

import logging
from argparse import ArgumentParser, Namespace

from pydantic import BaseModel

from ingestion.cli import type_directory, type_file

logger = logging.getLogger(__name__)


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


class Metadata(BaseModel):
    resolution: tuple[int, int]


def extract_cmd(args: Namespace, *, debug: bool = False):
    from tqdm import tqdm

    from ingestion.seg_extraction import (  # type: ignore
        extract,
        extract_slice_number,
        parse_entries,
    )

    metadata_path = args.lut
    segmentation_folder = args.img_path
    files = (
        list(segmentation_folder.glob("*.png"))
        if segmentation_folder.is_dir()
        else [segmentation_folder]
    )

    resolutions_dict: dict[int, tuple[int, int]] = {}

    for file in tqdm(files):
        tqdm.write(f"Extracting segments from {file}")
        resolution = extract(
            file,
            parse_entries(metadata_path),
            overwrite=args.overwrite,
            write_img=args.write_img,
            write_json=not args.no_json,
            print=tqdm.write,
        )

        if resolution is not None:
            slice = extract_slice_number(file)
            resolutions_dict[slice] = resolution

    resolutions = [res for res in resolutions_dict.values()]
    are_same = all(resolutions[0] == res for res in resolutions[1:])
    if not are_same:
        logger.warning(
            "skipping resolution metadata upload: multiple resolutions found for same dataset"
        )
        return

    resolution = resolutions[0]

    metadata_path = segmentation_folder / "metadata.json"
    metadata_path.write_text(Metadata(resolution=resolution).model_dump_json())


if __name__ == "__main__":
    from argparse import ArgumentDefaultsHelpFormatter

    from ingestion.logging import setup_logger

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

    setup_logger(args.debug)

    extract_cmd(args, debug=args.debug)
