from __future__ import annotations

import logging
import platform
from contextlib import contextmanager
from dataclasses import dataclass
from functools import lru_cache
from itertools import groupby, islice
from pathlib import Path
from typing import NamedTuple, cast, get_args

from colorama import Back, Fore, Style, just_fix_windows_console
from json_source_map import calculate
from json_source_map.types import Entry, TSourceMap
from pydantic import ValidationError
from pydantic_core import ErrorDetails

from ingestion.schema import DataAnnotationEntry, DataCollectionEntry, DataContainer

logger = logging.getLogger(__name__)

BOLD = "\033[1m"
BLOCK_STYLE = (":", "")

if platform.system() == "Windows":  # fix ansi on windows
    just_fix_windows_console()


class ErrorWriter:
    def __init__(self, w: str = "") -> None:
        self.w = w
        self.i = 0
        self.begin = True

    def __str__(self) -> str:
        return self.w

    def __repr__(self) -> str:
        return self.w

    def error(self) -> str:
        return self.w

    def raise_exception(self):
        raise Exception(self.w)

    def clear(self):
        self.__init__()

    def noindent(self, text: str):
        self.w += text
        self.w += "\n"

    def linebreak(self):
        self.w += "\n"

    def write(self, text: str, pre: str = "", color: str | None = None):
        indent = self.i * "\t" + pre
        if color is not None:
            indent = color + indent

        for line in text.splitlines():
            self.w += indent + line + "\n"

        if color is not None:
            self.w += Style.RESET_ALL

    def _indent(self):
        """Increase the indentation level for all subsequent output."""
        self.i += 1
        self.begin = True

    def _dedent(self):
        """Decrease the indentation level fro all subsequent output."""
        self.i = max(self.i - 1, 0)
        self.begin = True

    @contextmanager
    def wrap(self, before_start: str = "", after_end: str = "\n"):
        self.write(f"{before_start.strip()}")
        yield
        self.write(f"{after_end}")

    @contextmanager
    def block(
        self,
        before_start: str = "",
        style: tuple[str, str] = BLOCK_STYLE,
        after_end: str = "\n",
    ):
        """Returns a context within which writes are indented inside style.
        By default, this looks like:
            :
                <output written within context>

            <next write goes here>

        Use like any other python context. E.g., this code:
            with writer.block('error:', style=(' (',')')):
                for i in range(3):
                    w.write(f'Hello{i} = 1 + {i}')
        has this output:
            error: (
                Hello0 = 1 + 0
                Hello1 = 1 + 1
                Hello2 = 1 + 2
            )
        """
        self.write(f"{before_start.strip()}{style[0]}".strip())
        self._indent()
        yield
        self._dedent()
        self.write(f"{style[1]}{after_end}")

    @contextmanager
    def color(self, color: str):
        """Returns a context within which writes are colorized."""
        self.w += color
        yield
        self.w += Style.RESET_ALL


class DataErrorLoc(NamedTuple):
    collection: DataCollectionEntry
    path: Path
    field: str
    entry: Entry


class _DataErrorLocFinderError(Exception): ...


@dataclass
class _DataErrorLocFinder:
    source_files: DataContainer[Path]

    @staticmethod
    def data_collection(err: ErrorDetails) -> DataCollectionEntry:
        loc = err["loc"]
        if loc[0] not in get_args(DataCollectionEntry):
            raise Exception(
                f"unexpected data collection entry from pydantic error: '{loc[0]}'"
            )
        return cast(DataCollectionEntry, loc[0])

    @staticmethod
    @lru_cache  # TODO: find a better way to keep used source maps in memory
    def load_source_map(p: Path) -> TSourceMap:
        with open(p, "r") as f:
            source_map = calculate(f.read())
            logger.debug(f"computed json source map for {p}")
            return source_map

    def get_source_map(self, err: ErrorDetails) -> TSourceMap:
        # only compute the source map that haven't yet been
        match self.data_collection(err):
            case "neurons":
                return self.load_source_map(self.source_files.neurons)
            case "datasets":
                return self.load_source_map(self.source_files.datasets)
            case "connections":
                dataset_w_err = str(err["loc"][1])
                return self.load_source_map(
                    self.source_files.connections[dataset_w_err]
                )
            case "annotations":
                annotation_w_err = err["loc"][1]

                if annotation_w_err not in get_args(DataAnnotationEntry):
                    raise _DataErrorLocFinderError(
                        f"unexpected annotation entry: '{annotation_w_err}'"
                    )

                annotation_entry = cast(DataAnnotationEntry, annotation_w_err)
                return self.load_source_map(
                    self.source_files.annotations[annotation_entry]
                )

    def find(self, err: ErrorDetails) -> DataErrorLoc:
        source_map = self.get_source_map(err)
        collection = self.data_collection(err)

        def compute_field(loc: tuple[str | int, ...]) -> str:
            return ".".join(str(l) for l in loc)

        def compute_key(loc: tuple[str | int, ...]) -> str:
            # filter loc for inexistent keys and other edge cases
            if "[key]" in loc:
                loc = loc[: len(loc) - 1]

            key_fragment = "/".join(str(l) for l in loc)
            key = f"/{key_fragment}"
            return key

        match collection:
            case "neurons":
                loc = err["loc"][1:]
                return DataErrorLoc(
                    collection=collection,
                    path=self.source_files.neurons,
                    field=compute_field(loc),
                    entry=source_map[compute_key(loc)],
                )
            case "datasets":
                loc = err["loc"][1:]
                return DataErrorLoc(
                    collection=collection,
                    path=self.source_files.datasets,
                    field=compute_field(loc),
                    entry=source_map[compute_key(loc)],
                )
            case "connections":
                dataset_name = str(err["loc"][1])
                loc = err["loc"][2:]
                return DataErrorLoc(
                    collection=collection,
                    path=self.source_files.connections[dataset_name],
                    field=compute_field(loc),
                    entry=source_map[compute_key(loc)],
                )
            case "annotations":
                annotation_entry = str(err["loc"][1])
                if annotation_entry not in get_args(DataAnnotationEntry):
                    raise Exception(f"unknown annotation: '{annotation_entry}'")
                annotation = cast(DataAnnotationEntry, annotation_entry)

                loc = err["loc"][2:]
                return DataErrorLoc(
                    collection=collection,
                    path=self.source_files.annotations[annotation],
                    field=compute_field(loc),
                    entry=source_map[compute_key(loc)],
                )
            case _:
                raise _DataErrorLocFinderError(f"unknown data entry: '{collection}'")


def _write_error_snippet(
    w: ErrorWriter, err: ErrorDetails, finder: _DataErrorLocFinder, *, padding: int = 3
):
    _, file_path, _, entry = finder.find(err)

    read_from_line = entry.value_start.line - padding
    if read_from_line < 0:
        read_from_line = 0
    to_line = entry.value_end.line + padding  # iter will stop early without exception

    with open(file_path) as file:
        w.write(f"In {file_path}:{entry.value_start.line + 1}")

        with w.block(before_start="\n", style=("", "")):
            i = read_from_line
            if i == 0:
                w.linebreak()
            else:
                w.write("...")

            for line in islice(file, read_from_line, to_line):
                s = str(i) + "\t"
                s += line

                if i >= entry.value_start.line and i <= entry.value_end.line:
                    with w.color(Fore.RED):
                        w.write(s)
                else:
                    w.write(s)
                i += 1

            w.write("...")


class DataValidationError:
    _exc: ValidationError

    def __init__(self, exc: ValidationError) -> None:
        self._exc = exc

    def humanize(
        self,
        w: ErrorWriter,
        *,
        header: str | None = None,
        data_files: DataContainer[Path] | None = None,
    ) -> str:
        """Returns a string with a humanized version of the validation error"""

        if header is not None:
            w.write(header, color=Back.RED)
            w.linebreak()

        finder: _DataErrorLocFinder | None = None
        if data_files is not None:
            finder = _DataErrorLocFinder(data_files)

        for k, errors in groupby(self._exc.errors(), lambda err: err["loc"][0]):
            collection_rule = f"--- {str(k)} "
            collection_rule += (88 - len(collection_rule)) * "-"
            w.write(collection_rule, color=Fore.CYAN)

            w.linebreak()
            for error in errors:
                with w.color(BOLD):
                    w.write("Error: " + error["msg"])

                if finder is not None:
                    _write_error_snippet(w, error, finder)
            w.linebreak()

        return w.error()
