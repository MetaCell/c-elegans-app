import json
from pathlib import Path
from operator import itemgetter
from .models import Dataset, Neuron, Annotation, Connection, Synapse, ViewerConfig
from django.conf import settings


# Will be populated by the ingest_neurons function
cell_to_class = {}


def translate(translation_map, data):
    for old, new in translation_map.items():
        try:
            data[new] = data[old]
            del data[old]
        except Exception:
            ...
    return data


def clear_db(_, print, print_success):
    print("Cleaning all the entries from the tables...")
    for table in (Synapse, Connection, Annotation, Neuron, Dataset):
        print(f"  . removing entries from {table.__name__}...", ending="")
        table.objects.all().delete()
        print_success("\t[OK]")


def populate_datasets(path, print, print_success):
    print("Populate Dataset table...", ending="")
    raw_datasets = path / "datasets.json"
    datasets = json.loads(raw_datasets.read_text())

    Dataset.objects.bulk_create(
        [
            Dataset(**translate({"visualTime": "visual_time"}, dataset))
            for dataset in datasets
        ],
        ignore_conflicts=True,
    )
    print_success("\t\t[OK]")


def populate_config(path: Path, print, print_success):
    print("Populate Dataset configs...", ending="")
    MetadataFetcher = settings.METADATA_DOWNLOADER

    configs = []
    for dataset in Dataset.objects.all():
        dataset_id = dataset.id
        em_config = MetadataFetcher.get_em_metadata(dataset_id)
        segmentation_config = MetadataFetcher.get_segmentation_metadata(dataset_id)
        if not em_config and not segmentation_config:
            continue
        print(f"\n   . adding config for {dataset_id}")
        if em_config:
            print("     identified EM config", ending="")
        if segmentation_config:
            print("\n     identified SEG config", ending="")

        configs.append(
            ViewerConfig(
                em_config=em_config,
                segmentation_config=segmentation_config,
                dataset=Dataset.objects.get(id=dataset_id),
            )
        )

    ViewerConfig.objects.bulk_create(configs, ignore_conflicts=True)
    print_success("\t\t[OK]")


def populate_neurons(path, print, print_success):
    print("Populate Neuron table...", ending="")
    raw_datasets = path / "neurons.json"
    json_neurons = json.loads(raw_datasets.read_text())

    neurons = []
    for data in json_neurons:
        cell_to_class[data["name"]] = data["classes"]
        translate(
            {
                "typ": "type",
                "nt": "neurotransmitter",
                "emb": "embryonic",
                "classes": "nclass",
            },
            data,
        )
        neurons.append(Neuron(**data))

    Neuron.objects.bulk_create(neurons, ignore_conflicts=True)
    print_success("\t\t[OK]")


def combine_annotations(annotation_path: Path, print):
    print("  . Combining annotations")
    annotations = []
    for file in annotation_path.iterdir():
        if file.suffix != ".json":
            continue
        dataset_type, _, _ = file.name.partition(".")
        json_content = json.loads(file.read_text())
        for annotation_type, annotations_of_type in json_content.items():
            processed_annotations = [
                {
                    "pre": pre,
                    "post": post,
                    "collection": dataset_type,
                    "annotation": annotation_type,
                }
                for pre, post in annotations_of_type
            ]
            annotations.extend(processed_annotations)
    return annotations


def expand_annotations(annotations, print):
    print("  . Expanding annotations")
    processed_annotations = []
    annotations_seen = set()

    for annotation in annotations:
        pre, post, collection, annotation_type = annotation.values()
        pre_class = cell_to_class[pre]
        post_class = cell_to_class[post]

        expanded_annotations_data = (
            (pre, post),
            (pre_class, post),
            (pre, post_class),
            (pre_class, post_class),
        )
        for pre, post in expanded_annotations_data:
            key = f"{pre}-{post}-{collection}-{annotation_type}"
            if key not in annotations_seen:
                processed_annotations.append(
                    {
                        "pre": pre,
                        "post": post,
                        "type": "chemical",
                        "collection": collection,
                        "annotation": annotation_type,
                    }
                )
                annotations_seen.add(key)

    return processed_annotations


def populate_annotations(path, print, print_success):
    print("Populate Annotation table...")
    data_folder = path / "annotations"
    annotations = combine_annotations(data_folder, print)
    annotations = expand_annotations(annotations, print)

    print("  . Saving annotations", ending="")
    Annotation.objects.bulk_create(
        [Annotation(**data) for data in annotations], ignore_conflicts=True
    )
    print_success("\t\t\t[OK]")


def combine_connections(connections_path: Path, print):
    print("  . Combining connections")
    connections = []
    for file in connections_path.iterdir():
        if file.suffix != ".json":
            continue
        dataset_id, _, _ = file.name.partition(".")
        json_content = json.loads(file.read_text())
        for entry in json_content:
            entry["dataset_id"] = dataset_id
        connections.extend(json_content)
    return connections


synapses = []


def compute_connections_synapses(json_connections, print):
    print("  . Compute connections and synapses")

    def get_class(cell, connection):
        # TODO include legacy type?
        return cell_to_class.get(cell, cell)

    connections = {}
    # synapses = []
    connection_counter = 0
    nb_connections = len(json_connections)
    for i, connection in enumerate(json_connections):
        # ugly
        if i == nb_connections // 4:
            print("    25%  ")
        if i == nb_connections // 2:
            print("    50%  ")
        if i == (nb_connections // 4) * 3:
            print("    75%  ")

        pre, post, typ, syn, dataset_id = itemgetter(
            "pre", "post", "typ", "syn", "dataset_id"
        )(connection)
        ids, pre_tid, post_tid = (
            connection.get("ids"),
            connection.get("pre_tid"),
            connection.get("post_tid"),
        )

        type = "chemical" if typ == 0 else "electrical"
        synapses_count = len(syn)

        # Skip gap junctions already counted in the reverse direction
        key = ",".join((dataset_id, post, pre, type))
        if type == "electrical" and key in connections:
            continue

        # Add connections and class connections
        pre_class = get_class(pre, connection)
        post_class = get_class(post, connection)

        edges = [(pre, post, synapses_count)]
        if pre_class != post_class:
            if pre != pre_class:
                edges.append((pre_class, post, synapses_count))
            if post != post_class:
                edges.append((pre, post_class, synapses_count))
        if pre != pre_class and post != post_class:
            edges.append((pre_class, post_class, synapses_count))

        for edge_pre, edge_post, edge_count in edges:
            if not edge_pre and not edge_post:
                continue
            connection_counter += 1
            key = ",".join((dataset_id, edge_pre, edge_post, type))
            if key not in connections:
                connections[key] = {
                    "id": connection_counter,
                    # "dataset": dataset_id,
                    "dataset": Dataset.objects.get(id=dataset_id),
                    "pre": edge_pre,
                    "post": edge_post,
                    "type": type,
                    "synapses": 0,
                }
            connections[key]["synapses"] += edge_count

        if ids:
            for connector_id, synid, pretid, posttid in zip(
                ids, syn, pre_tid, post_tid
            ):
                key = ",".join((dataset_id, pre, post, type))
                synapses.append(
                    {
                        "connection_id": connections[key]["id"],
                        "connector_id": connector_id,
                        "weight": synid,
                        "pre_tid": pretid,
                        "post_tid": posttid,
                    }
                )
    print("    100%")
    return connections


def populate_connections(path, print, print_success):
    print("Populate Connection table...")
    data_folder = path / "connections"
    json_connections = combine_connections(data_folder, print)

    connections = compute_connections_synapses(json_connections, print)

    print("  . Saving connections", ending="")
    Connection.objects.bulk_create(
        [Connection(**connection) for connection in connections.values()],
        ignore_conflicts=True,
    )
    print_success("\t\t\t[OK]")


def populate_synapses(_, print, print_success):
    print("Populate Synapse table...")

    synapse_objects = []
    print("  . Saving synapses", ending="")
    for synapse in synapses:
        synapse["connection"] = Connection.objects.get(id=synapse["connection_id"])
        synapse_objects.append(Synapse(**synapse))

    Synapse.objects.bulk_create(synapse_objects, ignore_conflicts=True)
    print_success("\t\t\t[OK]")


populate_functions = [
    clear_db,
    populate_datasets,
    populate_config,
    populate_neurons,
    populate_annotations,
    populate_connections,
    populate_synapses,
]
