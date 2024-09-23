from __future__ import annotations

import sys
from argparse import ArgumentTypeError
from pathlib import Path


def ask(question: str) -> bool:
    """Ask for confirmation from user."""

    print(f"{question} [Y/n]", file=sys.stderr)
    while True:
        match input().lower().strip():
            case "y" | "yes":
                return True
            case "n" | "no":
                return False
            case _:
                print("Please enter Y or N", file=sys.stderr)
                continue


def type_directory(raw_path: str) -> Path:
    """Argument parser type for a directory"""
    p = Path(raw_path).resolve()
    if not p.is_dir():
        raise ArgumentTypeError(
            f"{raw_path} does not exist or is not an existing directory"
        )
    return p


def type_file(raw_path: str) -> Path:
    """Argument parser type for a file"""
    f = Path(raw_path).resolve()
    if not f.is_file():
        raise ArgumentTypeError(f"{raw_path} does not exist or is not a file")
    return f
