import csv
import io
import json
from asgiref.sync import sync_to_async
from collections import defaultdict
from typing import Iterable, Literal, Optional

from django.http import HttpResponse
from ninja import NinjaAPI, Router, Query, Schema
from ninja.pagination import paginate, PageNumberPagination
from ninja.errors import HttpError

from django.shortcuts import aget_object_or_404
from django.db.models import Q
from django.conf import settings
from django.core.management import call_command


from .utils import get_dataset_viewer_config, to_list

from .schemas import (
    Dataset,
    EMData,
    GroupedConnection,
    Neuron,
    Connection,
    RawConnection,
)
from .models import (
    Dataset as DatasetModel,
    Neuron as NeuronModel,
    Connection as ConnectionModel,
)
from .decorators.streaming import with_stdout_streaming
from .services.connectivity import query_nematode_connections
from .authenticators.basic_auth_super_user import basic_auth_superuser


class ErrorMessage(Schema):
    detail: str


class CElegansAPI(NinjaAPI):

    def get_openapi_operation_id(self, operation):
        return operation.view_func.__name__


class ByAliasRouter(Router):
    def api_operation(self, *args, **kwargs):
        kwargs["by_alias"] = True
        return super().api_operation(*args, **kwargs)


api = CElegansAPI(title="C. Elegans Visualizer", default_router=ByAliasRouter())


# @api.exception_handler(ObjectDoesNotExist)
# def service_unavailable(request, exc):
#     return api.create_response(
#         request,
#         {"message": exc.args[0]},
#         status=404,
#     )


async def annotate_dataset(datasets: Iterable[DatasetModel]):
    for dataset in datasets:
        dataset_id = dataset.id
        dataset.neuron3D_url = (  # type: ignore
            settings.DATASET_NEURON_REPRESENTATION_3D_URL_FORMAT.format(
                dataset=dataset_id
            )
        )
        dataset.em_data = await get_dataset_viewer_config(dataset)  # type: ignore


@api.get("/datasets", response=list[Dataset], tags=["datasets"])
async def get_datasets(request, ids: Optional[list[str]] = Query(None)):  # type: ignore the Query type error
    """Returns all datasets or a filtered list based on provided IDs"""
    if ids:
        datasets = await to_list(DatasetModel.objects.filter(id__in=ids))
    else:
        datasets = await to_list(DatasetModel.objects.all())

    await annotate_dataset(datasets)
    return datasets


## V2
@api.get("/datasets/count", response=int, tags=["datasets"])
def get_datasets_count(request):
    """Returns the number of known datasets"""
    return DatasetModel.objects.all().count()


@api.get(
    "/datasets/{dataset}", response={200: Dataset, 404: ErrorMessage}, tags=["datasets"]
)
async def get_dataset(request, dataset: str):
    """Returns a specific dataset"""
    obj = await aget_object_or_404(DatasetModel, id=dataset)
    await annotate_dataset((obj,))
    return obj


def annotate_neurons(neurons) -> None:
    """Queries the datasets ids for each neuron."""
    neuron_names = neurons.values_list("name", flat=True).distinct()
    pre = (
        ConnectionModel.objects.filter(pre__in=neuron_names)
        .values_list("pre", "dataset")
        .distinct()
    )
    post = (
        ConnectionModel.objects.filter(post__in=neuron_names)
        .values_list("post", "dataset")
        .distinct()
    )

    # Filter out repeated dataset ids
    neurons_dataset_ids = defaultdict(set)
    for neuron, dataset in pre.union(post):
        neurons_dataset_ids[neuron].add(dataset)

    # Add dataset ids, 3D representation path and documentation reference url
    for neuron in neurons:
        name = neuron.name
        neuron.dataset_ids = neurons_dataset_ids[name]  # type: ignore
        neuron.model3D_urls = [settings.NEURON_REPRESENTATION_3D_URL_FORMAT.format(name=name)]  # type: ignore
        neuron.reference = settings.NEURON_REFERENCE_URL_FORMAT.format(nclass=neuron.nclass)  # type: ignore


def neurons_from_datasets(neurons, dataset_ids):
    """Filters neurons belonging to specific datasets."""
    neurons = neurons.filter(
        Q(
            name__in=ConnectionModel.objects.filter(
                dataset__id__in=dataset_ids
            ).values_list("pre", flat=True)
        )
        | Q(
            name__in=ConnectionModel.objects.filter(
                dataset__id__in=dataset_ids
            ).values_list("post", flat=True)
        )
    )
    return neurons


@api.get(
    "/datasets/{dataset}/neurons",
    response={200: list[Neuron], 404: ErrorMessage},
    tags=["datasets"],
)
def get_dataset_neurons(request, dataset: str):
    """Returns all the neurons of a dedicated dataset"""
    neurons = neurons_from_datasets(NeuronModel.objects, [dataset])
    annotate_neurons(neurons)

    return neurons


@api.get("/cells/search", response=list[Neuron], tags=["neurons"])
def search_cells(
    request,
    name: Optional[str] = Query(None),  # type: ignore the Query type error
    dataset_ids: Optional[list[str]] = Query(None),  # type: ignore the Query type error
):
    neurons = NeuronModel.objects.all()

    if name:
        neurons = neurons.filter(name__istartswith=name)

    if dataset_ids:
        neurons = neurons_from_datasets(neurons, dataset_ids)
    annotate_neurons(neurons)

    return neurons


@api.get("/cells", response=list[Neuron], tags=["neurons"])
@paginate(PageNumberPagination, page_size=50)  # BUG: this is not being applied
def get_all_cells(request, dataset_ids: Optional[list[str]] = Query(None)):  # type: ignore the Query type error
    """Returns all the cells (neurons) from the DB"""
    neurons = NeuronModel.objects.all()

    if dataset_ids:
        neurons = neurons_from_datasets(neurons, dataset_ids)

    annotate_neurons(neurons)
    return neurons


@api.get("/cells/count", response=int, tags=["neurons"])
def get_cells_count(request):
    """Returns the cells (neurons) count  from the DB"""
    dataset_ids = DatasetModel.objects.all().values_list("id", flat=True).distinct()
    neurons = neurons_from_datasets(NeuronModel.objects, dataset_ids)
    return (
        neurons.values_list("name", flat=True)
        .union(neurons.values_list("nclass", flat=True))
        .count()
    )


# # @api.post("/connections", response=list[Connection], tags=["connectivity"])
# # # @paginate
# # def get_connections(request, options: ConnectionRequest):
# #     """Gets the connections of a dedicated Dataset"""
# #     return query_connections(**options.dict())


@api.get("/connections", response=list[Connection], tags=["connectivity"])
# @paginate
def get_connections(
    request,
    cells: str,
    dataset_ids: str,
    dataset_type: str,
    threshold_chemical: int = 3,
    threshold_electrical: int = 3,
    include_neighboring_cells: bool = False,
    include_annotations: bool = False,
):
    """Gets the connections of a dedicated Dataset"""
    return query_nematode_connections(
        [c.strip() for c in cells.split(",")],
        [d.strip() for d in dataset_ids.split(",")],
        [d.strip() for d in dataset_type.split(",")],
        threshold_chemical,
        threshold_electrical,
        include_neighboring_cells,
        include_annotations,
    )


async def get_connections_excluding_neuron_classes(
    dataset_id: str,
) -> list[ConnectionModel]:
    neurons = {x.name async for x in NeuronModel.objects.all()}
    return await to_list(
        ConnectionModel.objects.filter(
            dataset_id=dataset_id, pre__in=neurons, post__in=neurons
        ).order_by("pre", "post", "type")
    )


@api.get("/connections/{datasetId}/download", tags=["connectivity"])
async def get_dataset_connectivity(
    request, datasetId: str, format: Literal["csv", "json"] = "csv"
):
    """Download the connections of a dedicated Dataset in either CSV or JSON format (default CSV)."""
    connections = await get_connections_excluding_neuron_classes(dataset_id=datasetId)

    content_type = "application/json" if format == "json" else "text/csv"
    content_disposition = f'attachment; filename="{datasetId}.{format}"'
    if not connections:
        response = HttpResponse("", content_type=content_type)
        response["Content-Disposition"] = content_disposition
        return response

    buffer = io.StringIO()

    connections = [RawConnection.from_orm(c).model_dump() for c in connections]
    if format == "json":
        json.dump(connections, buffer, indent=2)
    else:
        fieldnames = connections[0].keys()
        writer = csv.DictWriter(buffer, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(connections)

    response = HttpResponse(
        buffer.getvalue(), content_type=f"{content_type}; charset=utf-8"
    )
    response["Content-Disposition"] = content_disposition
    return response


@sync_to_async
def get_specific_connections(dataset, neurons):
    queryset = (
        ConnectionModel.objects.filter(
            Q(dataset_id=dataset) & (Q(pre__in=neurons) | Q(post__in=neurons))
        )
        .values("pre", "post")
        .order_by("pre", "post")
    )

    grouped_connections = defaultdict(list)

    for entry in queryset:
        if entry["pre"] in neurons:
            neuron = entry["pre"]
        elif entry["post"] in neurons:
            neuron = entry["post"]
        else:
            # Shouldn't happen, but just in case
            print(f"Neuron {entry['pre']} or {entry['post']} is not in {neurons}")
            continue

        grouped_connections[neuron].append(entry)

    return [
        GroupedConnection(neuron=n, connections=c)
        for n, c in grouped_connections.items()
    ]


@api.get(
    "/connections/{datasetId}",
    response=list[RawConnection] | list[GroupedConnection],
    tags=["connectivity"],
)
# @paginate
async def get_dataset_connections(
    request,
    datasetId: str,
    exclude_class: bool = False,
    neurons: Optional[list[str]] = Query(None),  # type: ignore the Query type error
):
    """Gets the connections of a dedicated Dataset
    Connections includes connection towards the neurons and their classes by default.
    if exclude_class is set to true: the neuron classes (higher level neuron) is not included.
    """
    if neurons:
        return await get_specific_connections(datasetId, neurons)
    if exclude_class:
        return get_connections_excluding_neuron_classes(dataset_id=datasetId)
    return await to_list(ConnectionModel.objects.filter(dataset_id=datasetId))


## ***********************
## Ingestion


@api.get("/populate_db", auth=basic_auth_superuser, tags=["ingestion"])
@with_stdout_streaming
def populate_db(request):
    try:
        print("Starting DB population...\n")
        call_command("migrate")
        call_command("populatedb")
    except Exception as e:
        raise HttpError(500)  # type: ignore type error


## ***********************
## Healthcheck


@api.get("/live", tags=["healthcheck"])
async def live(request):
    """Test if application is healthy"""
    return "I'm alive!"


@api.get("/ping", tags=["healthcheck"])
async def ping(request):
    """test the application is up"""
    return "Ping!"


@api.get("/ready", tags=["healthcheck"])
async def ready(request):
    """Test if application is ready to take requests"""
    return "I'm READY!"
