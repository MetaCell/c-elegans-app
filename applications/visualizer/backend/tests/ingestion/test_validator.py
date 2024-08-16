import json
from typing import Any, Dict, List, NamedTuple

import pytest
from pydantic import ValidationError

from ingestion.validator import (
    Annotation,
    Axe,
    Connection,
    ConnectionType,
    Dataset,
    DatasetType,
    Neuron,
)

JSON = Dict[str, Any]  # just for type checking; otherwise does nothing


class NeuronTc(NamedTuple):
    data: JSON
    expected: Neuron


valid_neurons_tc: List[NeuronTc] = [
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


invalid_neurons_tc: List[JSON] = [
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


valid_datasets_tc: List[DatasetTc] = [
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
            "time": 0,
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
            time=0,
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


invalid_datasets_tc: List[JSON] = [
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


valid_connections_tc: List[ConnectionTc] = [
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
    )
]


@pytest.mark.parametrize("data, expected", valid_connections_tc)
def test__valid_connection(data: JSON, expected: Connection):
    conn = Connection.model_validate(data)
    assert conn == expected


invalid_connections_tc: List[JSON] = [
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
        "ids": [9583833, 9583834],  # not same length
        "post": "ADAR",
        "post_tid": [9576727],
        "pre": "ADAL",
        "pre_tid": [9577831],
        "syn": [1],
        "typ": 2,
    },
    {
        "ids": [9583833],
        "post": "ADAR",
        "post_tid": [9576727, 9583834, 9583834],  # not same length
        "pre": "ADAL",
        "pre_tid": [9577831],
        "syn": [1],
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


valid_annotations_tc: List[AnnotationTc] = [
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


invalid_annotations_tc: List[JSON] = [
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
