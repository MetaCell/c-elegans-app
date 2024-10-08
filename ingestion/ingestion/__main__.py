from __future__ import annotations

import logging
import sys
from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser

from ingestion.extract import add_flags as add_extract_flags
from ingestion.extract import extract_cmd
from ingestion.ingest import add_add_dataset_flags as add_ingest_add_dataset_flags
from ingestion.ingest import add_flags as add_ingest_flags
from ingestion.ingest import ingest_cmd
from ingestion.logging import setup_logger

logger = logging.getLogger(__name__)


def split_argv(argv: list[str], delimiter: str) -> list[list[str]]:
    out: list[list[str]] = []
    temp: list[str] = []

    for arg in argv:
        if arg == delimiter:
            out.append(temp)
            temp = [arg]
            continue
        temp.append(arg)

    if temp:
        out.append(temp)

    return out


def _main(argv: list[str] | None = None):
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

    subparsers_ingest = parser_ingest.add_subparsers(dest="ingest_subcommand")

    parser_ingest_add_dataset = subparsers_ingest.add_parser(
        name="add-dataset",
        help="ingests a dataset data",
        formatter_class=ArgumentDefaultsHelpFormatter,
    )

    add_ingest_add_dataset_flags(parser_ingest_add_dataset)

    if argv is not None and len(argv) == 0:
        parser.print_help(sys.stderr)
        sys.exit(0)

    args = parser.parse_args(argv)

    setup_logger(args.debug)

    try:
        match args.command:
            case "ingest":
                ingest_cmd(args)
            case "extract":
                extract_cmd(args, debug=args.debug)
    except KeyboardInterrupt as e:
        if args.debug:
            raise
        logger.error(
            "execution interrupted, some resources may have not uploaded properly!"
        )
    except Exception as e:
        if args.debug:
            raise
        print(f"{type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)


def main(argv: list[str] | None = None):
    """Calls main but is inspects argv and splits accordingly"""

    if argv is None:
        argv = sys.argv[1:]

    if "ingest" in argv and "add-dataset" in argv:
        argvl = split_argv(argv, "add-dataset")

        # TODO: print help of missing "add-dataset" if repeated flags are detected

        for add_dataset_args in argvl[1:]:
            _main(argvl[0] + add_dataset_args)
    else:
        _main(argv)


if __name__ == "__main__":
    main()
