import json
from pathlib import Path
from typing import Any, Callable, NamedTuple

import pytest
from pydantic import ValidationError

from ingestion.validator import (
    Annotation,
    Axe,
    Connection,
    ConnectionType,
    Data,
    Dataset,
    DatasetType,
    Neuron,
)

JSON = dict[str, Any]  # just for type checking; otherwise does nothing


class NeuronTc(NamedTuple):
    data: JSON
    expected: Neuron


valid_neurons_tc: list[NeuronTc] = [
    NeuronTc(
        data={
            "inhead": 1,
            "name": "ADAL",
            "emb": 1,
            "nt": "l",
            "intail": 0,
            "classes": "ADA",
            "typ": "i",
        },
        expected=Neuron(
            inhead=True,
            name="ADAL",
            emb=True,
            nt="l",
            intail=False,
            classes="ADA",
            typ="i",
        ),
    )
]


@pytest.mark.parametrize("data, expected", valid_neurons_tc)
def test__valid_neuron(data: JSON, expected: Neuron):
    neuron = Neuron.model_validate(data)
    assert neuron == expected


invalid_neurons_tc: list[JSON] = [
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
]


@pytest.mark.parametrize("data", invalid_neurons_tc)
def test__invalid_neuron(data: JSON):
    with pytest.raises(ValidationError):
        Neuron.model_validate(data)


class DatasetTc(NamedTuple):
    data: JSON
    expected: Dataset


valid_datasets_tc: list[DatasetTc] = [
    DatasetTc(
        data={
            "id": "white_1986_jse",
            "name": "White et al., 1986, JSE (adult)",
            "type": "tail",
            "time": 60,
            "visualTime": 50,
            "description": "Adult legacy tail with pre-anal ganglion",
        },
        expected=Dataset(
            id="white_1986_jse",
            name="White et al., 1986, JSE (adult)",
            type=DatasetType.TAIL,
            time=60,
            visualTime=50,
            description="Adult legacy tail with pre-anal ganglion",
        ),
    ),
    DatasetTc(
        data={
            "id": "witvliet_2020_1",
            "name": "Witvliet et al., 2020, Dataset 1 (L1)",
            "type": "head",
            "time": 0.62,
            "visualTime": 0.5,
            "description": "~0 hours after birth",
            "axes": [
                {"face": "right", "axisIndex": 2, "axisTransform": 1},
                {"face": "dorsal", "axisIndex": 1, "axisTransform": -1},
                {"face": "anterior", "axisIndex": 0, "axisTransform": 1},
            ],
        },
        expected=Dataset(
            id="witvliet_2020_1",
            name="Witvliet et al., 2020, Dataset 1 (L1)",
            type=DatasetType.HEAD,
            time=0.62,
            visualTime=0.5,
            description="~0 hours after birth",
            axes=[
                Axe(face="right", axisIndex=2, axisTransform=1),
                Axe(face="dorsal", axisIndex=1, axisTransform=-1),
                Axe(face="anterior", axisIndex=0, axisTransform=1),
            ],
        ),
    ),
]


@pytest.mark.parametrize("data, expected", valid_datasets_tc)
def test__valid_dataset(data: JSON, expected: Dataset):
    dataset = Dataset.model_validate(data)
    assert dataset == expected


invalid_datasets_tc: list[JSON] = [
    {
        "id": "white_1986_jse",
        "name": "White et al., 1986, JSE (adult)",
        "type": "taill",  # invalid dataset type
        "time": 60,
        "visualTime": 50,
        "description": "Adult legacy tail with pre-anal ganglion",
    }
]


@pytest.mark.parametrize("data", invalid_datasets_tc)
def test__invalid_dataset(data: JSON):
    with pytest.raises(ValidationError):
        Dataset.model_validate(data)


class ConnectionTc(NamedTuple):
    data: JSON
    expected: Connection


valid_connections_tc: list[ConnectionTc] = [
    ConnectionTc(
        data={
            "ids": [9583833],
            "post": "ADAR",
            "post_tid": [9576727],
            "pre": "ADAL",
            "pre_tid": [9577831],
            "syn": [1],
            "typ": 2,
        },
        expected=Connection(
            ids=[9583833],
            post="ADAR",
            post_tid=[9576727],
            pre="ADAL",
            pre_tid=[9577831],
            syn=[1],
            typ=ConnectionType.CHEMICAL,
        ),
    ),
    ConnectionTc(
        data={
            "post": "ADAR",
            "pre": "ADAL",
            "syn": [1],
            "typ": 2,
        },
        expected=Connection(
            ids=[],
            post="ADAR",
            post_tid=[],
            pre="ADAL",
            pre_tid=[],
            syn=[1],
            typ=ConnectionType.CHEMICAL,
        ),
    ),
]


@pytest.mark.parametrize("data, expected", valid_connections_tc)
def test__valid_connection(data: JSON, expected: Connection):
    conn = Connection.model_validate(data)
    assert conn == expected


invalid_connections_tc: list[JSON] = [
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
        "post_tid": [9576727, 9583834, 9583834],  # should be the same length as ids
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


@pytest.mark.parametrize("data", invalid_connections_tc)
def test__invalid_connection(data: JSON):
    with pytest.raises(ValidationError):
        Connection.model_validate(data)


class AnnotationTc(NamedTuple):
    data: JSON
    expected: Annotation


valid_annotations_tc: list[AnnotationTc] = [
    AnnotationTc(
        data={
            "increase": [
                ["ADAL", "RIPL"],
                ["ADAR", "RIPR"],
                ["ADEL", "AVKR"],
            ]
        },
        expected=Annotation(
            root={
                "increase": [
                    ("ADAL", "RIPL"),
                    ("ADAR", "RIPR"),
                    ("ADEL", "AVKR"),
                ]
            }
        ),
    ),
    AnnotationTc(
        data=json.loads("{}"),  # empty annotation seems to be valid
        expected=Annotation(),
    ),
    AnnotationTc(  # multiple annotation types
        data={"increase": [["ADAL", "RIPL"]], "postembryonic": [["ADAL", "RIPL"]]},
        expected=Annotation(
            root={"increase": [("ADAL", "RIPL")], "postembryonic": [("ADAL", "RIPL")]}
        ),
    ),
]


@pytest.mark.parametrize("data, expected", valid_annotations_tc)
def test__valid_annotation(data: JSON, expected: Annotation):
    annotation = Annotation.model_validate(data)
    assert annotation == expected


invalid_annotations_tc: list[JSON] = [
    {"inexistent": [["ADAL", "RIPL"]]},  # inexistent is not an annotation type
    {
        "increase": [
            ["ADAL", "RIPL", "CEPDL"],  # not a tuple of only pre and post
            ["ADAR", "RIPR"],
        ]
    },
]


@pytest.mark.parametrize("data", invalid_annotations_tc)
def test__invalid_annotation(data: JSON):
    with pytest.raises(ValidationError):
        Annotation.model_validate(data)


instanciate_valid_data_tc: list[Callable[..., Data]] = [
    lambda: Data(
        neurons=[
            Neuron(
                inhead=True,
                name="ADAL",
                emb=True,
                nt="l",
                intail=False,
                classes="ADA",
                typ="i",
            ),
            Neuron(
                inhead=True,
                name="ADAR",
                emb=True,
                nt="l",
                intail=False,
                classes="ADA",
                typ="i",
            ),
        ],
        datasets=[
            Dataset(
                id="white_1986_jse",
                name="White et al., 1986, JSE (adult)",
                type=DatasetType.TAIL,
                time=60,
                visualTime=50,
                description="Adult legacy tail with pre-anal ganglion",
            )
        ],
        connections={
            "white_1986_jse": [
                Connection(
                    ids=[6949667],
                    post="ADAR",
                    post_tid=[6693872],
                    pre="ADAL",
                    pre_tid=[6719648],
                    syn=[1],
                    typ=ConnectionType.CHEMICAL,
                )
            ]
        },
        annotations={
            "head": Annotation(
                root={
                    "increase": [
                        ("ADAL", "RIPL"),
                        ("ADAR", "RIPR"),
                        ("ADEL", "AVKR"),
                    ],
                    "postembryonic": [
                        ("ADAL", "RMFL"),
                    ],
                }
            ),
            "complete": Annotation(),
        },
    ),
]


@pytest.mark.parametrize("data_fn", instanciate_valid_data_tc)
def test__valid_data(data_fn: Callable[..., Data]):
    # every data definition should be able to correctly
    # be instanciated
    data_fn()


instanciate_invalid_data_tc: list[Callable[..., Data]] = [
    lambda: Data(
        neurons=[],
        datasets=[],
        connections={"white_1986_jse": []},  # dataset id not in datasets
    ),
    lambda: Data(
        neurons=[],
        datasets=[],
        connections={},
        annotations={
            # headd is not a valid annotation key
            "headd": Annotation(),  # type: ignore
        },
    ),
]


@pytest.mark.parametrize("data_fn", instanciate_invalid_data_tc)
def test__invalid_data(data_fn: Callable[..., Data]):
    # every data definition should raise an exception upon
    # being instanciated
    with pytest.raises(ValidationError):
        data_fn()


@pytest.fixture
def data_fixture(request: pytest.FixtureRequest) -> JSON:
    # TODO: can we move fixtures close to the test? i.g Path(request.fspath).parent / Path("fixtures")
    ROOT_DIR = Path(request.fspath).parent.parent.parent.parent.parent.parent  # type: ignore
    FIXTURES_DIR = ROOT_DIR / "data" / "db-raw-data"

    def load_file(f: str) -> dict:
        with (FIXTURES_DIR / f).open() as file:
            return json.load(file)

    def load_dir(dir: str, *, trim_file_extension: bool = True) -> dict[str, Any]:
        dir_path = FIXTURES_DIR / dir
        files_data = {}

        for file_path in dir_path.glob("*.json"):
            key = file_path.stem if trim_file_extension else file_path.name
            with open(file_path, "r") as file:
                files_data[key] = json.load(file)

        return files_data

    annotations = load_dir("annotations")
    for annotation_file_name in annotations.copy().keys():
        name = annotation_file_name.split(".")[0]
        annotations[name] = annotations.pop(annotation_file_name)

    return {
        "neurons": load_file("neurons.json"),
        "datasets": load_file("datasets.json"),
        "connections": load_dir("connections"),
        "annotations": annotations,
    }


def test__data_fixtures(data_fixture: JSON):
    Data.model_validate(data_fixture)
