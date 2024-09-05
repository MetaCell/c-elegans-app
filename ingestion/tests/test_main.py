from __future__ import annotations

from pathlib import Path

import pytest

from ingestion.__main__ import _done_message, main


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
