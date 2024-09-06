from __future__ import annotations

from pathlib import Path

from ingestion.hash import Crc32cCalculator


def test__crc32c_read_bytes(tmp_path: Path):
    test_file = tmp_path / "testfile.json"
    test_file.write_bytes(b"{}")

    with open(test_file, "rb") as f:
        calc = Crc32cCalculator(f)
        calc.read()

    assert calc.hexdigest() == "KXvQqg=="


def test__crc32c_read_str(tmp_path: Path):
    test_file = tmp_path / "testfile.json"
    test_file.write_bytes(b"{}")

    with open(test_file, "r") as f:
        calc = Crc32cCalculator(f)
        calc.read()

    assert calc.hexdigest() == "KXvQqg=="


def test__crc32c_write_bytes(tmp_path: Path):
    test_file = tmp_path / "testfile.json"

    with open(test_file, "wb") as f:
        calc = Crc32cCalculator(f)
        calc.write(b"{}")

    assert calc.hexdigest() == "KXvQqg=="


def test__crc32c_write_str(tmp_path: Path):
    test_file = tmp_path / "testfile.json"

    with open(test_file, "w") as f:
        calc = Crc32cCalculator(f)
        calc.write("{}")

    assert calc.hexdigest() == "KXvQqg=="
