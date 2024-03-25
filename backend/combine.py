from pathlib import Path
import json


def combine_annotations(annotation_path: Path):
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
                "type": "chemical",
                "collection": dataset_type,
                "annotation": annotation_type,
            } for pre, post in annotations_of_type]
            annotations.extend(processed_annotations)
    return annotations


# combine_annotations(Path("raw-data") / "annotations")


def combine_connections(connections_path: Path):
    connections = []
    for file in connections_path.iterdir():
        if file.suffix != ".json":
            continue
        dataset_id, _, _ = file.name.partition('.')
        json_content = json.loads(file.read_text())
        for entry in json_content:
            entry["dataset_id"] = dataset_id
        connections.extend(json_content)
    import ipdb; ipdb.set_trace()  # fmt: skip

    return connections


combine_connections(Path("raw-data") / "connections")

# // take the files in ./raw-data/connections and combine them into one list
# // appending dataset data to each connection
# let loadConnectionData = () => {
#   let connectionsJSON = [];

#   fs.readdirSync(CONNECTIONS_DATA_PATH).forEach(filename => {
#     const filepath = path.resolve(CONNECTIONS_DATA_PATH, filename);
#     const name = path.parse(filename).name;
#     const datasetId = name.split('.')[0];

#     let datasetConnectionsJSON = JSON.parse(fs.readFileSync(filepath));

#     datasetConnectionsJSON.forEach(c => {
#       c.datasetId = datasetId;
#     });

#     connectionsJSON = connectionsJSON.concat(datasetConnectionsJSON);
#   });

#   return connectionsJSON;
# };