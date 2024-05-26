from django.http import HttpResponse
from ninja import NinjaAPI, Router, Schema
from ninja.pagination import paginate, PageNumberPagination
from django.shortcuts import aget_object_or_404
from django.db.models import Q

from .schemas import Dataset, Neuron, Connection
from .models import (
    Dataset as DatasetModel,
    Neuron as NeuronModel,
    Connection as ConnectionModel,
)
from .services.connectivity import query_connections


class ErrorMessage(Schema):
    detail: str


async def to_list(q):
    return [x async for x in q]


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


@api.get("/datasets", response=list[Dataset], tags=["datasets"])
async def get_all_datasets(request):
    """Returns all the datasets from the DB"""
    return await to_list(DatasetModel.objects.all())


# @api.get("/datasets/{dataset}/full", response=FullDataset, tags=["datasets"])
# async def get_full_dataset(request, dataset: str):
#     return await DatasetModel.objects.prefetch_related("connections").aget(id=dataset)


## V1
# @api.get("/datasets/{dataset}", response={200: Dataset, 404: ErrorMessage}, tags=["datasets"])
# async def get_dataset(request, dataset: str):
#     """Returns a specific dataset"""
#     try:
#         dataset_object = await DatasetModel.objects.aget(id=dataset)
#         return 200, dataset_object
#     except DatasetModel.DoesNotExist:
#         return 404, {"detail": f'Dataset "{dataset}" does not exist'}


## V2
@api.get(
    "/datasets/{dataset}", response={200: Dataset, 404: ErrorMessage}, tags=["datasets"]
)
async def get_dataset(request, dataset: str):
    """Returns a specific dataset"""
    return await aget_object_or_404(DatasetModel, id=dataset)


@api.get(
    "/datasets/{dataset}/neurons",
    response={200: list[Neuron], 404: ErrorMessage},
    tags=["datasets"],
)
async def get_dataset_neurons(request, dataset: str):
    """Returns all the neurons of a dedicated dataset"""
    return await to_list(
        NeuronModel.objects.filter(
            Q(
                name__in=ConnectionModel.objects.filter(
                    dataset__id=dataset
                ).values_list("pre", flat=True)
            )
            | Q(
                name__in=ConnectionModel.objects.filter(
                    dataset__id=dataset
                ).values_list("post", flat=True)
            )
        )
    )


@api.get("/cells", response=list[Neuron], tags=["neurons"])
@paginate(PageNumberPagination, page_size=50)
def get_all_cells(request):
    """Returns all the cells (neurons) from the DB"""
    return NeuronModel.objects.all()


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
    return query_connections(
        [c.strip() for c in cells.split(",")],
        [d.strip() for d in dataset_ids.split(",")],
        [d.strip() for d in dataset_type.split(",")],
        threshold_chemical,
        threshold_electrical,
        include_neighboring_cells,
        include_annotations,
    )


# @api.get("/connections/{dataset}", response=list[Connection], tags=["connectivity"])
# # @paginate
# async def get_dataset_connections(request, dataset: str):
#     """Gets the connections of a dedicated Dataset"""
#     # res = ConnectionModel.objects.filter(dataset_id=dataset))
#     # # import ipdb; ipdb.set_trace()  # fmt: skip
#     return await to_list(ConnectionModel.objects.filter(dataset_id=dataset))


# @api.get("/download-connectivity", response=list[Connection], tags=["connectivity"])
# async def get_dataset_connectivity(request, datasetId: str):
#     neurons = {x.name async for x in NeuronModel.objects.all()}
#     return await to_list(
#         ConnectionModel.objects.filter(
#             dataset_id=datasetId, pre__in=neurons, post__in=neurons
#         ).order_by("pre", "post", "type")
#     )


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
