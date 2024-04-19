from ninja import ModelSchema, Schema
from .models import Dataset as DatasetModel, Neuron as NeuronModel, Connection as ConnectionModel


def to_camel(string: str) -> str:
    words = string.split('_')
    return words[0] + ''.join(word.capitalize() for word in words[1:])


# This class is here to configure an auto snake2camel case translator
# it will be part of the base class for all the schemas
class BilingualSchema(Schema):
    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class Dataset(ModelSchema, BilingualSchema):
    class Meta:
        model = DatasetModel
        fields = ["id", "collection", "name", "description", "time", "visual_time", "type", "axes"]


class Neuron(ModelSchema, BilingualSchema):
    class Meta:
        model = NeuronModel
        fields = ["name", "nclass", "neurotransmitter", "type", "embryonic", "inhead", "intail"]


class Connection(ModelSchema, BilingualSchema):
    class Meta:
        model = ConnectionModel
        fields = ["dataset", "pre", "post", "type", "synapses"]


class FullDataset(Dataset):
    connections: list[Connection]

    Dataset.Meta.fields += "connections"


class ConnectionRequest(BilingualSchema):
    cells: list[str]
    dataset_ids: list[str]
    dataset_type: str
    threshold_chemical: int
    threshold_electrical: int
    include_neighboringcells: bool
    include_annotations: bool