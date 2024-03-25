from django.db import migrations
import json
from pathlib import Path
from operator import itemgetter



# Will be populated by the ingest_neurons function
cell_to_class = {}


def translate(d, data):
    for old, new in d.items():
        try:
            data[new] = data[old]
            del data[old]
        except Exception:
            ...


def populate_datasets(apps, schema_editor):
    print("\n    * Populate Dataset table...", end="")
    raw_datasets = Path("raw-data") / "datasets.json"
    datasets = json.loads(raw_datasets.read_text())

    Dataset = apps.get_model("api", "Dataset")
    for dataset in datasets:
        translate({
            "visualTime": "visual_time"
        }, dataset)
        ds = Dataset(**dataset)
        ds.save()
    print("\t\t[OK]")


def populate_neurons(apps, schema_editor):
    print("    * Populate Neuron table...", end="")
    raw_datasets = Path("raw-data") / "neurons.json"
    neurons = json.loads(raw_datasets.read_text())

    Neuron = apps.get_model("api", "Neuron")
    for data in neurons:
        cell_to_class[data["name"]] = data["classes"]
        translate({
            "typ": "type",
            "nt": "neurotransmitter",
            "emb": "embryonic",
            "classes": "nclass",
        }, data)
        ds = Neuron(**data)
        ds.save()
    print("\t\t[OK]")


def combine_annotations(annotation_path: Path):
    print("      . Combining annotations")
    annotations = []
    for file in annotation_path.iterdir():
        if file.suffix != ".json":
            continue
        dataset_type, _, _ = file.name.partition('.')
        json_content = json.loads(file.read_text())
        for annotation_type, annotations_of_type in json_content.items():
            processed_annotations = [{
                "pre": pre,
                "post": post,
                "collection": dataset_type,
                "annotation": annotation_type,
            } for pre, post in annotations_of_type]
            annotations.extend(processed_annotations)
    return annotations


def expand_annotations(annotations):
    print("      . Expanding annotations")
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
            (pre_class, post_class)
        )
        for pre, post in expanded_annotations_data:
            key = f"{pre}-{post}-{collection}-{annotation_type}"
            if key not in annotations_seen:
                processed_annotations.append({
                    "pre": pre,
                    "post": post,
                    "type": "chemical",
                    "collection": collection,
                    "annotation": annotation_type,
                })
                annotations_seen.add(key)

    return processed_annotations


def populate_annotations(apps, schema_editor):
    print("    * Populate Annotation table...")
    data_folder = Path("raw-data") / "annotations"
    annotations = combine_annotations(data_folder)
    annotations = expand_annotations(annotations)

    Annotation = apps.get_model("api", "Annotation")
    print("      . saving annotations", end="")
    for data in annotations:
        ds = Annotation(**data)
        ds.save()
    print("\t\t[OK]")


def combine_connections(connections_path: Path):
    print("      . Combining connections")
    connections = []
    for file in connections_path.iterdir():
        if file.suffix != ".json":
            continue
        dataset_id, _, _ = file.name.partition('.')
        json_content = json.loads(file.read_text())
        for entry in json_content:
            entry["dataset_id"] = dataset_id
        connections.extend(json_content)
    return connections

synapses = []

def compute_connections_synapses(json_connections, apps):
    print("      . Compute connections and synapses", end="")
    def get_class(cell, connection):
        # TODO include legacy type?
        return cell_to_class.get(cell, cell)

    Dataset = apps.get_model("api", "Dataset")

    connections = {}
    # synapses = []
    connection_counter = 0
    nb_connections = len(json_connections)
    for i, connection in enumerate(json_connections):
        if i == nb_connections // 4:
            print("  25%  ", end="")
        if i == nb_connections // 2:
            print("  50%  ", end="")
        if i == (nb_connections // 4) * 3:
            print("  75%  ", end="")

        pre, post, typ, syn, dataset_id = itemgetter("pre", "post", "typ", "syn", "dataset_id")(connection)
        ids, pre_tid, post_tid = connection.get("ids"), connection.get("pre_tid"), connection.get("post_tid")

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
                    "synapses": 0
                }
            connections[key]["synapses"] += edge_count

        if ids:
            for connector_id, synid, pretid, posttid in zip(ids, syn, pre_tid, post_tid):
                key = ",".join((dataset_id, pre, post, type))
                synapses.append({
                    "connection_id": connections[key]["id"],
                    "connector_id": connector_id,
                    "weight": synid,
                    "pre_tid": pretid,
                    "post_tid": posttid,
                })
    print(" 100%")
    return connections


def populate_connections(apps, schema_editor):
    print("    * Populate Connection table...")
    data_folder = Path("raw-data") / "connections"
    json_connections = combine_connections(data_folder)

    connections = compute_connections_synapses(json_connections, apps)

    Connection = apps.get_model("api", "Connection")
    print("      . saving connections", end="")
    for connection in connections.values():
        ds = Connection(**connection)
        ds.save()
    print("\t\t[OK]")


def populate_synapses(apps, schema_editor):
    print("    * Populate Synapse table...")

    Connection = apps.get_model("api", "Connection")
    Synapse = apps.get_model("api", "Synapse")

    print("      . saving synapses", end="")
    for synapse in synapses:
        synapse["connection_id"] = Connection.objects.get(id=synapse["connection_id"])
        ds = Synapse.objects.create(**synapse)
        ds.save()
    print("\t\t\t[OK]")


populate_functions = [
    migrations.RunPython(populate_datasets),
    migrations.RunPython(populate_neurons),
    migrations.RunPython(populate_annotations),
    migrations.RunPython(populate_connections),
    migrations.RunPython(populate_synapses),
]
