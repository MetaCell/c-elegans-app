from collections import defaultdict
from api.models import Annotation, Connection


## This module was converted from the original nemanode code found here:
## https://github.com/zhenlab-ltri/NemaNode/blob/master/src/server/db/nematode-connections.js

def query_nematode_connections(
        cells: list[str],
        dataset_ids: list[str],
        dataset_type: list[str],
        threshold_chemical: int,
        threshold_electrical: int,
        include_neighboring_cells: bool,
        include_annotations: bool,
):
    if not cells:
        return []

    annotations_map = defaultdict(list)
    if include_annotations:
        annotations = query_annotations(cells, include_neighboring_cells, dataset_type)
        for annotation in annotations:
            pre = annotation['pre']
            post = annotation['post']
            connection_type = annotation['type']
            annotation_type = annotation['annotation']
            key = get_connection_primary_key(pre, post, connection_type)
            annotations_map[key].append(annotation_type)

    raw_connections = query_connections(cells, dataset_ids, include_neighboring_cells, threshold_chemical,
                                        threshold_electrical)

    connections = []
    # Group raw_connections by the connection key
    grouped_connections = defaultdict(list)
    for raw_conn in raw_connections:
        key = get_connection_primary_key(raw_conn['pre'], raw_conn['post'], raw_conn['type'])
        grouped_connections[key].append(raw_conn)

    for key, grouped in grouped_connections.items():
        pre = grouped[0]['pre']
        post = grouped[0]['post']
        type_ = grouped[0]['type']
        annotations = annotations_map[key] if include_annotations else []

        # Accumulate all synapses for the grouped connections
        synapses = {g['dataset_id']: g['synapses'] for g in grouped}

        connections.append({
            'pre': pre,
            'post': post,
            'type': type_,
            'annotations': annotations,
            'synapses': synapses
        })
    gap_junctions = [c for c in connections if c['type'] == 'electrical']
    chemical_synapses = [c for c in connections if c['type'] == 'chemical']

    merged_gap_junctions = merge_gap_junctions(gap_junctions)

    return merged_gap_junctions + chemical_synapses


def get_connection_primary_key(pre, post, type_):
    return hash(f'{pre}-{post}-{type_}')


def merge_gap_junctions(gap_junctions):
    gap_junctions_key_map = {}

    for gj in gap_junctions:
        pre, post = gj['pre'], gj['post']
        synapses = gj['synapses']
        key = '$'.join(sorted([pre, post]))

        if key not in gap_junctions_key_map:
            gap_junctions_key_map[key] = gj
        else:
            for dataset, synapse_count in synapses.items():
                if dataset in gap_junctions_key_map[key]['synapses']:
                    gap_junctions_key_map[key]['synapses'][dataset] += synapse_count
                else:
                    gap_junctions_key_map[key]['synapses'][dataset] = synapse_count

    merged = []
    for gj_key, gj in gap_junctions_key_map.items():
        pre, post = gj_key.split('$')
        type_, synapses, annotations = gj['type'], gj['synapses'], gj['annotations']
        merged.append({
            'pre': pre,
            'post': post,
            'type': type_,
            'synapses': synapses,
            'annotations': annotations
        })

    return merged


def query_annotations(cells, include_neighboring_cells, dataset_type):
    # Prepare the SQL query
    sql_query = f"""
    SELECT pre, post, type, annotation
    FROM api_annotation
    WHERE (pre IN ({', '.join(['%s'] * len(cells))})
    {'OR' if include_neighboring_cells else 'AND'} post IN ({', '.join(['%s'] * len(cells))}))
      AND collection IN ({', '.join(['%s'] * len(dataset_type))})
    """

    # Combine all parameters into a single list for passing to the query
    params = cells + cells + dataset_type

    # Execute the raw query using Django's raw() method
    annotations = Annotation.objects.raw(sql_query, params)

    # Convert the result to a list of dictionaries
    results = [
        {'pre': annotation.pre, 'post': annotation.post, 'type': annotation.type, 'annotation': annotation.annotation}
        for annotation in annotations
    ]

    return results


def query_connections(cells, dataset_ids, include_neighboring_cells, threshold_chemical, threshold_electrical):
    # Prepare the SQL query
    sql_query = f"""
    SELECT c.id, c.pre, c.post, c.type, c.dataset_id, c.synapses 
    FROM (
        SELECT pre, post, type
        FROM api_connection
        WHERE (pre IN ({', '.join(['%s'] * len(cells))})
        {'OR' if include_neighboring_cells else 'AND'} post IN ({', '.join(['%s'] * len(cells))}))
          AND dataset_id IN ({', '.join(['%s'] * len(dataset_ids))})
          AND (
            (type = 'chemical' AND synapses >= %s)
            OR (type = 'electrical' AND synapses >= %s)
          )
        GROUP BY pre, post, type
    ) f
    LEFT JOIN api_connection c ON f.pre = c.pre AND f.post = c.post AND f.type = c.type
    WHERE c.dataset_id IN ({', '.join(['%s'] * len(dataset_ids))})
    """

    # Combine all parameters into a single list for passing to the query
    params = cells + cells + dataset_ids + [threshold_chemical, threshold_electrical] + dataset_ids

    # Execute the raw query using Django's raw() method
    connections = Connection.objects.raw(sql_query, params)

    # Convert the result to a list of dictionaries (similar to what Django ORM's .values() would return)
    results = [
        {'id': connection.id, 'pre': connection.pre, 'post': connection.post, 'type': connection.type,
         'dataset_id': connection.dataset_id, 'synapses': connection.synapses}
        for connection in connections
    ]

    return results
