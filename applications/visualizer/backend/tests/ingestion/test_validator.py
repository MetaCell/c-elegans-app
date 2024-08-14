from typing import Any, Dict, List, NamedTuple

import pytest
from pydantic import ValidationError

from ingestion.validator import Axe, Dataset, Neuron

JSON = Dict[str, Any]  # just for type checking; otherwise does nothing


class NeuronValidTc(NamedTuple):
    data: JSON
    expected: Neuron


valid_neurons_tc: List[NeuronValidTc] = [
    NeuronValidTc(
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
def test__valida_neuron(data: JSON, expected: Neuron):
    neuron = Neuron.model_validate(data)
    assert neuron == expected


class NeuronInvalidTc(NamedTuple):
    data: JSON


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


class DatasetValidTc(NamedTuple):
    data: JSON
    expected: Dataset


valid_datasets_tc: List[DatasetValidTc] = [
    DatasetValidTc(
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
            type="tail",
            time=60,
            visualTime=50,
            description="Adult legacy tail with pre-anal ganglion",
        ),
    ),
    DatasetValidTc(
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
            type="head",
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


class DatasetInvalidTc(NamedTuple):
    data: JSON


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
