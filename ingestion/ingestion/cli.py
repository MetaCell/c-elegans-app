from __future__ import annotations

import os
import sys
from argparse import ArgumentTypeError
from pathlib import Path


def ask(question: str) -> bool:
    """Ask for confirmation from user."""

    print(question + " [Y/n]", file=sys.stderr)
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
    if not os.path.isdir(raw_path):
        raise ArgumentTypeError(f"{raw_path} is not an existing directory")
    return Path(os.path.abspath(raw_path))


def type_file(raw_path: str) -> Path:
    """Argument parser type for a file"""
    if not os.path.isfile(raw_path):
        raise ArgumentTypeError(f"{raw_path} is not a file")
    return Path(os.path.abspath(raw_path))
