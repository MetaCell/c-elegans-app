from __future__ import annotations

from enum import IntEnum, StrEnum
from typing import Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field, RootModel, model_validator


class Neuron(BaseModel):
    inhead: bool  # int used as bool, is the neuron part of the head or not
    name: str  # name of the neuron, can be same as classes, or L or R of classes
    emb: bool  # int used as bool
    nt: str  # neurotransmitter type
    intail: bool  # int used as bool
    classes: str  # general name of the neuron
    typ: str  # type of the neuron


class DatasetType(StrEnum):
    COMPLETE = "complete"
    HEAD = "head"
    TAIL = "tail"


class Axe(BaseModel):
    face: str
    axisIndex: int
    axisTransform: int


class Dataset(BaseModel):
    id: str
    name: str
    type: DatasetType
    time: float  # TODO: should be gte than 0?
    visualTime: float  # TODO: should be gte than 0?
    description: str
    axes: Optional[List[Axe]] = Field(
        default=None, description="different axes and their representation"
    )


class ConnectionType(IntEnum):
    ELECTRICAL = 0
    CHEMICAL = 2


class Connection(BaseModel):
    ids: List[int] = Field(
        default_factory=list,
        description="list of neuron IDs involved in this connection",
    )  # TODO: should be optional? appers to be empty in some entries
    post: str  # the name of a neuron as defined in "neurons.json"
    post_tid: List[int] = Field(
        default_factory=list,
        description="list of neuron IDs of a post synapse for a dedicated post neuron",
    )  # TODO: should be optional? appers to be empty in some entries
    pre: str  # the name of a neuron as defined in "neurons.json"
    pre_tid: List[int] = Field(
        default_factory=list,
        description="list of neuron IDs of a pre synapse for a dedicated pre neuron",
    )  # TODO: should be optional? appers to be empty in some entries
    syn: List[int] = Field(
        ...,
        description="list of weights of a post or pre synapses (indice matches the neuron in pre/post_tid)",
    )
    typ: ConnectionType  # the type of connection ("electrical" or "chemical")

    @model_validator(mode="after")
    def check_same_size_elements(self):
        if len(self.ids) != 0:
            length = len(self.ids)
            assert all(
                len(l) == length for l in iter([self.post_tid, self.pre_tid, self.syn])
            ), "ids, post_tid, pre_tid and syn must have the same number of elements"

        return self


class Annotation(RootModel):
    root: Dict[
        Literal["increase", "variable", "postembryonic", "decrease", "stable"],
        List[
            Tuple[  # the type of annotation
                str,  # pre, the ID/name of a neuron from "neurons.json"
                str,  # post, the ID/name of the other neuron from "neurons.json" that is part of the couple
            ]
        ],
    ] = {}


class Data(BaseModel):
    neurons: List[Neuron]
    datasets: List[Dataset]
    connections: Dict[str, List[Connection]] = {}
    annotations: Dict[
        Literal["head", "complete"], Annotation  # TODO: should 'tail' be included
    ] = {}

    @model_validator(mode="after")
    def check_connection_dataset_exists(self):
        existing_datasets = [dt.id for dt in self.datasets]
        assert all(
            [dataset_id in existing_datasets for dataset_id in self.connections.keys()]
        ), "missing dataset definition for connection"
        return self
