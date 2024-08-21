from __future__ import annotations

from enum import Enum, IntEnum
from typing import Literal

from pydantic import BaseModel, Field, RootModel, model_validator


class Neuron(BaseModel):
    inhead: bool  # int used as bool, is the neuron part of the head or not
    name: str  # name of the neuron, can be same as classes, or L or R of classes
    emb: bool  # int used as bool
    nt: str  # neurotransmitter type
    intail: bool  # int used as bool
    classes: str  # general name of the neuron
    typ: str  # type of the neuron


class DatasetType(str, Enum):
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
    time: float  # TODO: should add validation gte than 0?
    visualTime: float  # TODO: should add validation gte than 0?
    description: str
    axes: list[Axe] | None = Field(
        default=None, description="different axes and their representation"
    )


class ConnectionType(IntEnum):
    ELECTRICAL = 0
    CHEMICAL = 2


class Connection(BaseModel):
    ids: list[int] = Field(
        default_factory=list,
        description="list of neuron IDs involved in this connection",
    )
    post: str  # the name of a neuron as defined in "neurons.json"
    post_tid: list[int] = Field(
        default_factory=list,
        description="list of neuron IDs of a post synapse for a dedicated post neuron",
    )
    pre: str  # the name of a neuron as defined in "neurons.json"
    pre_tid: list[int] = Field(
        default_factory=list,
        description="list of neuron IDs of a pre synapse for a dedicated pre neuron",
    )
    syn: list[int] = Field(
        ...,
        description="list of weights of a post or pre synapses (indice matches the neuron in pre/post_tid)",
    )
    typ: ConnectionType  # the type of connection ("electrical" or "chemical")

    @model_validator(mode="after")
    def check_same_size_elements(self):
        if len(self.ids) != 0:
            assert (
                len(self.ids)
                == len(self.post_tid)
                == len(self.pre_tid)
                == len(self.syn)
            ), "ids, post_tid, pre_tid and syn must have the same number of elements"

        return self


class Annotation(RootModel):
    root: dict[
        Literal["increase", "variable", "postembryonic", "decrease", "stable"],
        list[
            tuple[  # the type of annotation
                str,  # pre, the ID/name of a neuron from "neurons.json"
                str,  # post, the ID/name of the other neuron from "neurons.json" that is part of the couple
            ]
        ],
    ] = {}


class Data(BaseModel):
    neurons: list[Neuron]
    datasets: list[Dataset]
    connections: dict[str, list[Connection]] = {}
    annotations: dict[Literal["head", "complete", "tail"], Annotation] = {}

    @model_validator(mode="after")
    def check_connection_dataset_exists(self):
        existing_datasets = [dt.id for dt in self.datasets]
        assert all(
            dataset_id in existing_datasets for dataset_id in self.connections.keys()
        ), "missing dataset definition for connection"
        return self
