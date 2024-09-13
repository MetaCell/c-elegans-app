from __future__ import annotations

import logging
import os
import random
from itertools import chain
from pathlib import Path

import pytest

from ingestion.__main__ import main, split_argv
from ingestion.ingest import _done_message
from ingestion.testing.gcs_mock import Mount  # type: ignore
from ingestion.testing.gcs_mock import patch as gcs_patch  # type: ignore


@pytest.mark.parametrize(
    "argv, delimiter, expected",
    [
        (  # single dataset
            [
                "/Users/user1/lib/celegans",
                "ingest",
                "--debug",
                "add-dataset",
                "dataset_1",
                "--seg-folder",
                "../data/sem-adult/segmentation-mip0",
                "--em-folder",
                "../data/sem-adult/catmaid-tiles",
                "--3d-data",
                "../data",
            ],
            "add-dataset",
            [
                ["/Users/user1/lib/celegans", "ingest", "--debug"],
                [
                    "add-dataset",
                    "dataset_1",
                    "--seg-folder",
                    "../data/sem-adult/segmentation-mip0",
                    "--em-folder",
                    "../data/sem-adult/catmaid-tiles",
                    "--3d-data",
                    "../data",
                ],
            ],
        ),
        (  # many datasets and shell glob expansion
            [
                "/Users/user1/lib/celegans",
                "ingest",
                "--debug",
                "add-dataset",
                "dataset_1",
                "--seg-folder",
                "../data/sem-adult/segmentation-mip0",
                "--em-folder",
                "../data/sem-adult/catmaid-tiles/130/0_0_5.jpg",  # from shell glob expansion
                "../data/sem-adult/catmaid-tiles/130/0_1_5.jpg",
                "../data/sem-adult/catmaid-tiles/130/1_0_5.jpg",
                "../data/sem-adult/catmaid-tiles/130/1_1_5.jpg",
                "--3d-data",
                "../data",
                "add-dataset",
                "dataset_2",
                "--seg-folder",
                "../data/sem-adult/segmentation-mip0",
                "--em-folder",
                "../data/sem-adult/catmaid-tiles",
                "--3d-data",
                "../data",
            ],
            "add-dataset",
            [
                ["/Users/user1/lib/celegans", "ingest", "--debug"],
                [
                    "add-dataset",
                    "dataset_1",
                    "--seg-folder",
                    "../data/sem-adult/segmentation-mip0",
                    "--em-folder",
                    "../data/sem-adult/catmaid-tiles/130/0_0_5.jpg",
                    "../data/sem-adult/catmaid-tiles/130/0_1_5.jpg",
                    "../data/sem-adult/catmaid-tiles/130/1_0_5.jpg",
                    "../data/sem-adult/catmaid-tiles/130/1_1_5.jpg",
                    "--3d-data",
                    "../data",
                ],
                [
                    "add-dataset",
                    "dataset_2",
                    "--seg-folder",
                    "../data/sem-adult/segmentation-mip0",
                    "--em-folder",
                    "../data/sem-adult/catmaid-tiles",
                    "--3d-data",
                    "../data",
                ],
            ],
        ),
        (  # other command that does not match delimiter
            [
                "celegans",
                "extract",
                "-i",
                "/path/to/image.png",
                "-l",
                "/path/to/lut.csv",
                "--write-img",
                "--overwrite",
            ],
            "add-dataset",
            [
                [
                    "celegans",
                    "extract",
                    "-i",
                    "/path/to/image.png",
                    "-l",
                    "/path/to/lut.csv",
                    "--write-img",
                    "--overwrite",
                ]
            ],
        ),
    ],
)
def test__split_argv(argv: list[str], delimiter: str, expected: list[list[str]]):
    assert split_argv(argv, delimiter) == expected


def test__main_can_help():
    def must(argv: list[str]):
        with pytest.raises(SystemExit) as excinfo:
            main(argv)
        assert excinfo.type == SystemExit
        assert excinfo.value.code == 0

    must(["--help"])
    must(["ingest", "--help"])


def test__main_ingest_valid_data(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    data_dir = Path(request.fspath).parent / "fixtures" / "reference-data"  # type: ignore
    main(
        [
            "ingest",
            "add-dataset",
            "white_1986_jsh",
            "--data",
            str(data_dir),
        ]
    )

    out, err = capsys.readouterr()
    assert _done_message("white_1986_jsh") in out
    assert err == ""


def test__main_ingest_invalid_data(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    data_dir = Path(request.fspath).parent / "fixtures" / "invalid-data"  # type: ignore

    with pytest.raises(SystemExit) as excinfo:
        main(
            [
                "ingest",
                "add-dataset",
                "white_1986_jsh",
                "--data",
                str(data_dir),
            ]
        )
    assert excinfo.type == SystemExit
    assert excinfo.value.code == 1

    out, err = capsys.readouterr()

    assert out == ""
    assert err != ""


def test__main_ingest_valid_data_for_unknown_dataset_id(request: pytest.FixtureRequest):
    data_dir = Path(request.fspath).parent / "fixtures" / "reference-data"  # type: ignore
    with pytest.raises(Exception):
        main(
            [
                "ingest",
                "--debug",  # to bubble up the exception
                "add-dataset",
                "unknown_dataset_id",
                "--data",
                str(data_dir),
            ]
        )


def test__main_ingest_bad_data_dir_schema(
    capsys: pytest.CaptureFixture, request: pytest.FixtureRequest
):
    # data_path dir schema doesn't match what we expect
    data_dir = Path(request.fspath).parent / "fixtures"  # type: ignore

    with pytest.raises(SystemExit) as excinfo:
        main(
            [
                "ingest",
                "add-dataset",
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

        if file1.read_bytes() != file2.read_bytes():
            raise Exception(f"content differs: {file1} != {file2}")

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
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--debug",
                "add-dataset",
                "dataset8",
                "--segmentations",
                str(local_dir),
            ]
        )

    assert compare_directories(local_dir, celegans_dir / "dataset8" / "segmentations")

    out, _ = capsys.readouterr()
    assert _done_message("dataset8") in out
    for log in [  # TODO: is this relevant?
        "skipping data validation: flag not set",
        "skipping 3D files upload: flag not set",
        "skipping EM tiles upload: flag not set",
    ]:
        assert log in caplog.text


def test__main_ingest_em_tiles(
    request: pytest.FixtureRequest,
    tmp_path: Path,
    capsys: pytest.CaptureFixture,
    caplog: pytest.LogCaptureFixture,
):
    gcp_creds_path = tmp_path / "secret.json"
    gcp_creds_path.write_text("{}")

    celegans_dir = tmp_path / "celegans"
    celegans_dir.mkdir()

    em_fixtures_dir = Path(request.fspath).parent / "fixtures" / "em-tiles"  # type: ignore

    with (
        gcs_patch([Mount("celegans", celegans_dir, readable=True, writable=True)]),
        caplog.at_level(logging.INFO),
    ):
        main(
            [
                "ingest",
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--debug",
                "add-dataset",
                "dataset8",
                "--em",
                str(em_fixtures_dir),
            ]
        )

    assert compare_directories(em_fixtures_dir, celegans_dir / "dataset8" / "em")
    out, _ = capsys.readouterr()
    assert _done_message("dataset8") in out


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
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--debug",
                "add-dataset",
                "dataset8",
                "--3d",
                str(local_dir),  # parent just cause its easy
            ]
        )

    remote_files = os.listdir(local_dir)

    assert remote_files.sort() == expected_neurons_blob_names.sort()

    out, _ = capsys.readouterr()
    assert _done_message("dataset8") in out
    for log in [  # TODO: is this relevant?
        "skipping data validation: flag not set",
        "skipping segmentation upload: flag not set",
        "skipping EM tiles upload: flag not set",
    ]:
        assert log in caplog.text


def test__main_ingest_multiple_datasets(
    tmp_path: Path, capsys: pytest.CaptureFixture, caplog: pytest.LogCaptureFixture
):
    # lets try ingest segmentation from multiple datasets

    gcp_creds_path = tmp_path / "secret.json"
    gcp_creds_path.write_text("{}")

    local_dir = tmp_path / "local"
    local_dir.mkdir()

    celegans_dir = tmp_path / "celegans"
    celegans_dir.mkdir()

    def create_dummy_segmentations(dataset: str):
        seg_dir = local_dir / dataset / "segmentations"
        seg_dir.mkdir(parents=True)

        for slice in random.sample(range(999), 10):
            (seg_dir / f"s{str(slice):03}.json").write_text("{}")

    datasets = ["dataset8", "dataset11", "someother-Dataset"]

    for ds in datasets:
        create_dummy_segmentations(ds)

    datasets_argv = list(
        chain(
            *[
                [
                    "add-dataset",
                    ds,
                    "--segmentations",
                    str(local_dir / ds / "segmentations"),
                ]
                for ds in datasets
            ]
        )
    )

    with (
        gcs_patch([Mount("celegans", celegans_dir, readable=True, writable=True)]),
        caplog.at_level(logging.INFO),
    ):
        main(
            [
                "ingest",
                "--gcp-credentials",
                str(gcp_creds_path),
                "--gcp-bucket",
                "celegans",
                "--debug",
            ]
            + datasets_argv
        )

    assert compare_directories(local_dir, celegans_dir)

    out, _ = capsys.readouterr()
    for ds in datasets:
        assert _done_message(ds) in out
