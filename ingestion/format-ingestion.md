# Data ingest specification

This document describes the requirements and expectations of all the data ingested in to the C-Elegans application.

- [Dataset Identifier](#dataset-identifier)
- [EM data](#em-data)
- [3D data](#3d-data)
- [Format of data ingested in the database](#format-of-data-ingested-in-the-database)
  - [Format of `neurons.json`](#format-of-neuronsjson)
  - [Format of `datasets.json`](#format-of-datasetsjson)
  - [Format of `connections/xxx.json`](#format-of-connectionsxxxjson)
  - [Format of `annotations/xxx.json`](#format-of-annotationsxxxjson)
- [Bucket Storage](#bucket-storage)

## Dataset Identifier

All ingested data is contextualized within a dataset identifier.
The identifier will segregate the data in the database and in the GCP bucket, ensuring that the data is easily indexed and managed.

It is important to note that the dataset identifier is related to all data in the databse, so it has to match that of the ids in those files.

> [!WARNING]  
> The dataset identifier should not contain spaces or special characters.

## Segmentations

Segmentation files are json files that encode positions on neuron labels.
They MUST follow the file path naming scheme: `**/*s<slice>.json`, where slice is a positive integer.

## EM data

Electromagnetic data MUST follow the file path namming scheme: `**/<slice>/<y>_<x>_<z>.jpg`, where `slice`, `x`, `y` and `z` are positive integers.

Files MUST be `jpg` images with the same width and height dimentions.
These images are tiled by zoom level at double the resolution of the previous zoom.

<!-- TODO: understand the impact of varying metersPerUnit (e.g 2nm voxels) in the map projection -->

## 3D data

For the 3D data, we upload all STL files following a format of `<neuron name>-*.stl`, like in <https://github.com/zhenlab-ltri/catmaid-data-explorer/tree/3d-viewer/server/3d-models>.

> [!NOTE]  
> Synapsys are not currently being uploaded.

## Format of data ingested in the database

The management script is able to ingest data represented in a JSON format.
Different files are necessary:

* `neurons.json` that encodes the information about the neurons in general
* `datasets.json` that encodes the information about the different datasets
* `connections/xxx.json` that encodes the different connections for dedicated datasets
* `annotations/xxx.json` that encodes annotations for different zones of the anatomy

Those files are automatically exported from third-party tool and shouldn't be edited manually.

### Format of `neurons.json`

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


### Format of `datasets.json`

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

> [!WARNING]  
> It is important to note that the datasets `id` defined in `datasets.json` MUST match with the [Dataset Identifier](#dataset-identifier) specified through the ingestion process so data can be correlated.

### Format of `connections/xxx.json`

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

### Format of `annotations/xxx.json`

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

## Bucket Storage

The cloud storage of the ingested files will be organized in the following pattern:

```console
.
├── dataset-1
│   ├── 3d
│   │   ├── nervering.stl
│   │   ├── ADAL.stl
│   │   ├── ADAR.stl
│   │   ├── ADEL.stl
│   │   │   ...
│   ├── em
│   │   ├── ...
│   │   ├── 13
│   │   │   ├── 0_0_5.jpg
│   │   │   ├── 0_1_4.jpg
│   │   │   ├── 0_1_5.jpg
│   │   │   ...
│   │   ├── ...
│   │   └── metadata.json
│   └── segmentations
│       ├── s000.json
│       └── s001.json
│       └── ...
├── dataset-2
├── dataset-3
...
```

Each dataset will have its own base directory with the name being the dataset identifier. Inside each dataset directory we will find 3 subdirectories:

- `3d`: containing the 3D models for the neurons with the file name following `<neuron name>.stl`, with the exception of `nervering.stl`.
- `em`: storing each slice tileset in its own subdirectory and a `metadata.json` file with information required to represent the tiles in the frontend application _(TODO: define `metadata.json` format)_.
- `segmentations`: stores all the segmentation json files following the namming schema `s<slice>.json`, where `slice` is a positive integer (can contain left padding zeros).
