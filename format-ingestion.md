# Format of data ingested in the database

The management script is able to ingest data represented in a JSON format.
Different files are necessary:

* `neurons.json` that encodes the information about the neurons in general
* `datasets.json` that encodes the information about the different datasets
* `connections/xxx.json` that encodes the different connections for dedicated datasets
* `annotations/xxx.json` that encodes annotations for different zones of the anatomy

Those files are automatically exported from third-party tool and shouldn't be edited manually.

## Format of `neurons.json`

This file defines a list of JSON object as root structure:

```json
[
    {
        ...  // definition of neuron 1
    },
    ...,
    {
        ...  // definition of neuron N
    }
]
```

Each JSON object represents a neuron with this schema:

```json
{
    "inhead": int,      // int used as bool, is the neuron part of the head or not
    "name": string,     // name of the neuron, can be same as classes, or L or R of classes
    "emb": int,         // int used as bool
    "nt": string,       // neurotransmitter type
    "intail": int,      // int used as bool
    "classes": string,  // general name of the neuron
    "typ": string       // type of the neuron: "i" =>  ,  TODO fillme
}
```


## Format of `datasets.json`

This file defines a list of JSON object as root structure.

```json
[
    {
        ...  // definition of dataset 1
    },
    ...,
    {
        ...  // definition of dataset N
    }
]
```

Each JSON object represents a specific dataset with this schema:

```json
{
    "id": string           // unique ID for the dataset
    "name": string         // display name of the dataset
    "type": string         // type of dataset: "complete", "head" or "tail"
    "time": float          // time of the dataset
    "visualTime": float    // visualTime of the dataset
    "description": string  // description of the dataset
    "axes": [              // OPTIONAL: different axes and their representation, not used but can appear in the file
        ...
    ]
}
```

## Format of `connections/xxx.json`

The `connections` directory encodes the information about the different connections by dataset.
Each file in this directory is named after the `id` of a dataset present in the `datasets.json` file, e.g.: a dataset defined using the `id` `white_1986_jsh` will defines each of the connections of the dataset in the file `connections/white_1986_jsh.json`.

Each of those files is a list of JSON object where each of the JSON objects encodes different connections between different neurons.
The schema is the following:

```json
{
    "ids": [ ... ],       // a list of int, where each int represents the ID of the neurons involved in this connection
    "post": string,       // the name of a neuron as defined in "neurons.json"
    "post_tid": [ ... ],  // a list of int where each int represents the ID of a post synapse for a dedicated post neuron
    "pre": string,        // the name of a neuron as defined in "neurons.json"
    "pre_tid": [ ... ],   // a list of int where each int represents the ID of a pre synapse for a dedicated pre neuron
    "syn": [ ... ],       // a list of int where each int represents the weight of a post or pre synapses (indice matches the neuron in pre/post_tid)
    "typ": int            // the type of connection ("electrical" (0) or "chemical" (2))
}
```

For each of those objects: `ids`, `post_tid`, `pre_tid` and `syn` need to have the same number of elements when `ids` is present.

## Format of `annotations/xxx.json`

The `annotations` directory encodes annotations about the different part (`head` or `complete`) following the naming convention `part.annotations.json`, e.g.: the annotations for the `head` are located in `annotations/head.annotations.json`.

Each of those files is a JSON object that defines categories as keys and a list of neurons couples as values.
Here is the schema for the `head.annotations.json` file (the `complete.annotations.json` file, while existing, is an empty JSON object).

```json
{
    "increase": [    // the type of annotation
        [
            string,  // pre, the ID/name of a neuron from "neurons.json"
            string   // post, the ID/name of the other neuron from "neurons.json" that is part of the couple
        ]
    ]
}
```

The types of annotations can be `increase`, `variable`, `postembryonic`, `decrease` or `stable`

### Note:

The existing repository contains a `trajectories` folder with a set of JSON files.
Those files are not ingested anymore, they are part of a legacy system.
