from __future__ import annotations

from enum import IntEnum
from typing import Any, Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field
from pydantic.alias_generators import to_camel


class Data(BaseModel):
    neurons: List[Neuron]
    datasets: List[Dataset]
    connections: Dict[str, Connection]
    annotations: Dict[str, Annotation]


class Neuron(BaseModel):
    inhead: bool  # int used as bool, is the neuron part of the head or not
    name: str  # name of the neuron, can be same as classes, or L or R of classes
    emb: bool  # int used as bool
    nt: str  # neurotransmitter type
    intail: bool  # int used as bool
    classes: str  # general name of the neuron
    typ: str  # type of the neuron


class Axe(BaseModel):
    face: str
    axisIndex: int
    axisTransform: int


class Dataset(BaseModel):
    id: str
    name: str
    type: Literal["complete", "head", "tail"]
    time: int  # TODO: should be gte than 0?
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
        ..., description="list of neuron IDs involved in this connection"
    )
    post: str  # the name of a neuron as defined in "neurons.json"
    post_tid: List[int] = Field(
        ...,
        description="list of neuron IDs of a post synapse for a dedicated post neuron",
    )
    pre: str  # the name of a neuron as defined in "neurons.json"
    pre_tid: List[int] = Field(
        ...,
        description="list of neuron IDs of a pre synapse for a dedicated pre neuron",
    )
    syn: List[int] = Field(
        ...,
        description="list of weights of a post or pre synapses (indice matches the neuron in pre/post_tid)",
    )
    typ: ConnectionType  # the type of connection ("electrical" or "chemical")


class Annotation(BaseModel):
    increase: List[
        Tuple[  # the type of annotation
            str,  # pre, the ID/name of a neuron from "neurons.json"
            str,  # post, the ID/name of the other neuron from "neurons.json" that is part of the couple
        ]
    ]
