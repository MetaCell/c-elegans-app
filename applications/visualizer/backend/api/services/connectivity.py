from collections import defaultdict

from django.db.models import Q

from api.models import Annotation, Connection


def query_connections(
        cells: list[str],
        dataset_ids: list[str],
        dataset_type: str,
        threshold_chemical: int,
        threshold_electrical: int,
        include_neighboring_cells: bool,
        include_annotations: bool,
):
    connections = _query_raw_connections(cells, dataset_ids, include_neighboring_cells, threshold_chemical,
                                         threshold_electrical)

    annotations_map = _query_annotations(cells, dataset_type, include_annotations, include_neighboring_cells)

    grouped_connections = defaultdict(list)
    for connection in connections:
        key = _get_connection_key(connection.pre, connection.post, connection.type)
        grouped_connections[key].append(connection)

    response_data = []
    for key, group in grouped_connections.items():
        synapses = {conn.dataset_id: conn.synapses for conn in group}

        # It's safe to access the first item directly as group won't be empty by design of the grouping process
        connection = group[0]
        response_data.append({
            'pre': connection.pre,
            'post': connection.post,
            'type': connection.type,
            'annotations': annotations_map.get(key, []) if include_annotations else [],
            'synapses': synapses
        })

    return response_data


# SELECT pre, post, type, annotation
#     FROM annotations
#     WHERE (pre in (${cells})
#     ${includeNeighboringCells ? 'OR' : 'AND'} post in (${cells}))
#       AND collection in (${datasetType})

def _query_annotations(cells, dataset_type, include_annotations, include_neighboring_cells):
    annotations_map = {}
    if include_annotations:
        annotations = Annotation.objects.filter(
            Q(pre__in=cells) | Q(post__in=cells) if include_neighboring_cells else Q(pre__in=cells,
                                                                                     post__in=cells),
            collection=dataset_type
        )
        for annotation in annotations:
            key = _get_connection_key(annotation.pre, annotation.post, annotation.type)
            if key in annotations_map:
                annotations_map[key].append(annotation.annotation)
            else:
                annotations_map[key] = [annotation.annotation]
    return annotations_map


# SELECT c.pre, c.post, c.type, c.dataset_id, c.synapses from (
#   SELECT pre, post, type
#   FROM connections
#   WHERE (pre IN (${cells})
#   ${includeNeighboringCells ? 'OR' : 'AND'} post IN (${cells}))
#     AND dataset_id IN (${datasetIds})
#     AND (
#       (type = 'chemical' && synapses >= ${thresholdChemical})
#       OR (type = 'electrical' && synapses >= ${thresholdElectrical})
#     )
#   GROUP BY pre, post, type
# ) f
# LEFT JOIN connections c ON f.pre = c.pre AND f.post = c.post AND f.type = c.type
# WHERE c.dataset_id IN (${datasetIds})

def _query_raw_connections(cells, dataset_ids, include_neighboring_cells, threshold_chemical, threshold_electrical):
    connection_query = Q(pre__in=cells) | Q(post__in=cells) if include_neighboring_cells else Q(pre__in=cells,
                                                                                                post__in=cells)
    connection_query &= Q(dataset_id__in=dataset_ids)
    connection_query &= (
            Q(type='chemical', synapses__gte=threshold_chemical) |
            Q(type='electrical', synapses__gte=threshold_electrical)
    )
    return Connection.objects.filter(connection_query).select_related('dataset').distinct()


def _get_connection_key(pre, post, connection_type):
    return pre, post, connection_type
