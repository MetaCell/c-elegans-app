from __future__ import annotations

import logging
import sys
from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from typing import Sequence

from ingestion.extract import add_flags as add_extract_flags
from ingestion.extract import extract_cmd
from ingestion.ingest import add_flags as add_ingest_flags
from ingestion.ingest import ingest_cmd
from ingestion.logging import setup_logger

logger = logging.getLogger(__name__)


def main(argv: Sequence[str] | None = None):
    parser = ArgumentParser(
        prog="celegans",
        description="Support tool for the C-Elegans application",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    def add_debug_flag(parser: ArgumentParser):
        parser.add_argument(
            "--debug",
            help="runs with debug logs",
            default=False,
            action="store_true",
        )

    add_debug_flag(parser)

    subparsers = parser.add_subparsers(dest="command")

    # subcommand for the extraction of segmentation files
    parser_extract = subparsers.add_parser(
        name="extract",
        help="extracs segentations from the bitmap files",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    add_extract_flags(parser_extract)
    add_debug_flag(parser_extract)

    # subcommand for the file ingestion
    parser_ingest = subparsers.add_parser(
        name="ingest",
        help="ingest files into the C-Elegans deployment",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    add_ingest_flags(parser_ingest)
    add_debug_flag(parser_ingest)

    args = parser.parse_args(argv)

    setup_logger(args.debug)

    exec = lambda: ...  # command to run
    match args.command:
        case "ingest":
            exec = lambda: ingest_cmd(args, debug=args.debug)
        case "extract":
            exec = lambda: extract_cmd(args, debug=args.debug)

    try:
        exec()
    except Exception as e:
        if args.debug:
            raise
        else:
            print(e, file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
