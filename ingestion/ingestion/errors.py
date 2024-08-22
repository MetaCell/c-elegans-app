from __future__ import annotations

from contextlib import contextmanager
from enum import Enum
from itertools import groupby
from typing import Callable

from pydantic import ValidationError

from ingestion.validator import Data


class Colors(str, Enum):
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


# end of format
ENDC = "\033[0m"

STYLE = (":", "")


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

    def write(self, text: str, pre: str = "", color: Colors | None = None):
        indent = self.i * "\t" + pre
        if color is not None:
            indent = color + indent

        for line in text.splitlines():
            self.w += indent + line.strip() + "\n"

        if color is not None:
            self.w += ENDC

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
        style: tuple[str, str] = STYLE,
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
    def color(self, color: Colors):
        """Returns a context within which writes are colorized."""
        self.w += color
        yield
        self.w += ENDC


DataErrorWriterOpt = Callable[
    ["DataErrorWriter"], None
]  # defines a DataErrorWriter configuration option


def with_header(header: str) -> DataErrorWriterOpt:
    """Show a custom head at the beginning of the error message"""

    def fn(dew: DataErrorWriter):
        dew.header = header

    return fn


class DataErrorWriter:
    header: str | None = (
        None  # show a custom head at the beginning of the error message
    )

    def __init__(self, *opts: DataErrorWriterOpt) -> None:
        for opt in opts:
            opt(self)

    def humanize(self, exc: ValidationError) -> str:
        w = ErrorWriter()

        if self.header is not None:
            w.write(self.header, color=Colors.FAIL)
            w.linebreak()

        for k, errors in groupby(exc.errors(), lambda err: err["loc"][0]):
            with w.block(str(k)):
                for error in errors:
                    w.write(
                        " -> ".join([str(l) for l in error["loc"][1:]])
                        + ": "
                        + error["msg"]
                    )

        return w.error()


if __name__ == "__main__":
    bad_data = {
        "neurons": [
            {
                "inhead": 0,
                "name": 123,  # invalid name
                "emb": 1,
                "nt": "l",
                "intail": 0,
                "classes": "ADA",
                "typ": "i",
            },
            {
                "inhead": 2,  # not valid bool interpretation
                "name": "ADAL",
                "emb": 1,
                "nt": "l",
                "intail": 0,
                "classes": "ADA",
                "typ": "i",
            },
            {
                "inhead": 0,
                "name": "ADAL",
                "emb": -1,  # not valid bool interpretation
                "nt": "l",
                "intail": 0,
                "classes": "ADA",
                "typ": "i",
            },
            {
                "inhead": 0,
                "name": "ADAL",
                "emb": 1,
                "nt": "l",
                "intail": 1.2,  # not valid bool interpretation
                "classes": "ADA",
                "typ": "i",
            },
        ],
        "datasets": [
            {
                "id": "white_1986_jse",
                "name": "White et al., 1986, JSE (adult)",
                "type": "taill",  # invalid dataset type
                "time": 60,
                "visualTime": 50,
                "description": "Adult legacy tail with pre-anal ganglion",
            }
        ],
        "connections": {
            "white_1986_jse": [
                {
                    "ids": [9583833],
                    "post": "ADAR",
                    "post_tid": [9576727],
                    "pre": "ADAL",
                    "pre_tid": [9577831],
                    "syn": [1],
                    "typ": 1,  # invalid connection type
                },
                {
                    "ids": [9583833, 9583834],
                    "post": "ADAR",
                    "post_tid": [9576727],
                    "pre": "ADAL",
                    "pre_tid": [9577831],  # should be the same length as ids
                    "syn": [1],
                    "typ": 2,
                },
                {
                    "ids": [9583833],
                    "post": "ADAR",
                    "post_tid": [
                        9576727,
                        9583834,
                        9583834,
                    ],  # should be the same length as ids
                    "pre": "ADAL",
                    "pre_tid": [9577831],
                    "syn": [1],
                    "typ": 2,
                },
                {
                    "ids": [9583833],
                    "post": "ADAR",
                    "post_tid": [9576727],
                    "pre": "ADAL",
                    "pre_tid": [9577831],
                    "syn": [1, 1],  # should be the same length as ids
                    "typ": 2,
                },
            ]
        },
        "annotations": {
            "head": {
                "inexistent": [["ADAL", "RIPL"]]
            },  # inexistent is not an annotation type
            "complete": {
                "increase": [
                    ["ADAL", "RIPL", "CEPDL"],  # not a tuple of only pre and post
                    ["ADAR", "RIPR"],
                ]
            },
            "taill": {  # taill is not valid annotation entry
                "increase": [
                    ["ADAL", "RIPL"],
                    ["ADAR", "RIPR"],
                    ["ADEL", "AVKR"],
                ]
            },
        },
    }

    err_w = DataErrorWriter(
        with_header("Woops! We found some inconsistencies in your data!")
    )

    try:
        Data.model_validate(bad_data)
    except ValidationError as e:
        print(err_w.humanize(e))
