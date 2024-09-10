from __future__ import annotations

import logging
import os
from pathlib import Path

import pytest

from ingestion.__main__ import _done_message, main
from ingestion.testing.gcs_mock import Mount  # type: ignore
from ingestion.testing.gcs_mock import patch as gcs_patch  # type: ignore


def test__main_ingest_valid_data(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    data_dir = Path(request.fspath).parent / "fixtures" / "reference-data"  # type: ignore
    main(
        [
            "ingest",
            "dataset8",
            "--data",
            str(data_dir),
        ]
    )

    out, err = capsys.readouterr()
    assert out == _done_message() + "\n"
    assert err == ""


def test__main_ingest_invalid_data(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    data_dir = Path(request.fspath).parent / "fixtures" / "invalid-data"  # type: ignore

    with pytest.raises(SystemExit) as excinfo:
        main(
            [
                "ingest",
                "dataset8",
                "--data",
                str(data_dir),
            ]
        )
    assert excinfo.type == SystemExit
    assert excinfo.value.code == 1

    out, err = capsys.readouterr()

    assert out == ""
    assert err != ""


def test__main_ingest_bad_data_dir_schema(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    # data_path dir schema doesn't match what we expect
    data_dir = Path(request.fspath).parent / "fixtures"  # type: ignore

    with pytest.raises(SystemExit) as excinfo:
        main(
            [
                "ingest",
                "dataset8",
                "--data",
                str(data_dir),  # parent just cause its easy
            ]
        )
    assert excinfo.type == SystemExit
    assert excinfo.value.code == 1

    out, err = capsys.readouterr()

    assert out == ""
    assert err == f"FileNotFoundError: {data_dir}/neurons.json\n"


def compare_directories(dir1: Path, dir2: Path):
    """
    Compare the contents of `dir1` and `dir2`, considering only the relative paths and file contents.
    Standard libraty filecmp.dircmp can not perform relative path comparison, so even if the contents
    of a directory are the same, the relative path will forcefully assert to false.
    """
    dir1_files = sorted(p.relative_to(dir1) for p in dir1.rglob("*") if p.is_file())
    dir2_files = sorted(p.relative_to(dir2) for p in dir2.rglob("*") if p.is_file())

    if dir1_files != dir2_files:
        raise Exception(f"{dir1_files} != {dir2_files}")

    for relative_path in dir1_files:
        file1 = dir1 / relative_path
        file2 = dir2 / relative_path

        if file1.read_text() != file2.read_text():
            return False

    return True


def test__main_ingest_segmentations(
    tmp_path: Path, capsys: pytest.CaptureFixture, caplog: pytest.LogCaptureFixture
):
    gcp_creds_path = tmp_path / "secret.json"
    gcp_creds_path.write_text("{}")

    local_dir = tmp_path / "local"
    local_dir.mkdir()

    celegans_dir = tmp_path / "celegans"
    celegans_dir.mkdir()

    # create a bunch of segmentation files
    for slice in range(1):
        (local_dir / f"s{str(slice):03}.json").write_text("{}")

    with (
        gcs_patch([Mount("celegans", celegans_dir, readable=True, writable=True)]),
        caplog.at_level(logging.INFO),
    ):
        main(
            [
                "ingest",
                "dataset8",
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--segmentations",
                str(local_dir),
                "--debug",
            ]
        )

    assert compare_directories(local_dir, celegans_dir / "dataset8" / "segmentations")

    out, _ = capsys.readouterr()
    assert out == _done_message() + "\n"
    for log in [
        "skipping data validation: flag not set",
        "skipping 3D files upload: flag not set",
        "skipping EM tiles upload: flag not set",
    ]:
        assert log in caplog.text


def test__main_ingest_3d(
    tmp_path: Path, capsys: pytest.CaptureFixture, caplog: pytest.LogCaptureFixture
):
    gcp_creds_path = tmp_path / "secret.json"
    gcp_creds_path.write_text("{}")

    local_dir = tmp_path / "local"
    local_dir.mkdir()

    celegans_dir = tmp_path / "celegans"
    celegans_dir.mkdir()

    neuron_names = [
        "BAGR",
        "BDUL",
        "BWM-DL01",
        "BWM-DL02",
        "Fragment1",
        "Fragment11",
    ]
    expected_neurons_blob_names = [
        "BAGR.stl",
        "BDUL.stl",
        "BWM-DL01.stl",
        "BWM-DL02.stl",
        "Fragment1.stl",
        "Fragment11.stl",
    ]

    # create a bunch of 3d files
    for neuron in neuron_names:
        (local_dir / f"{neuron}-SEM_adult.stl").touch()

    with (
        gcs_patch([Mount("celegans", celegans_dir, readable=True, writable=True)]),
        caplog.at_level(logging.INFO),
    ):
        main(
            [
                "ingest",
                "dataset8",
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--3d",
                str(local_dir),  # parent just cause its easy
                "--debug",
            ]
        )

    remote_files = os.listdir(local_dir)

    assert remote_files.sort() == expected_neurons_blob_names.sort()

    out, _ = capsys.readouterr()
    assert out == _done_message() + "\n"
    for log in [
        "skipping data validation: flag not set",
        "skipping segmentation upload: flag not set",
        "skipping EM tiles upload: flag not set",
    ]:
        assert log in caplog.text
