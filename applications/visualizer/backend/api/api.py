from ninja import NinjaAPI, Router, Schema
from ninja.pagination import paginate
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import aget_object_or_404
from django.http import Http404




from .schemas import Dataset, FullDataset, Neuron, Connection, ConnectionRequest
from .models import (
    Dataset as DatasetModel,
    Neuron as NeuronModel,
    Connection as ConnectionModel,
)


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
@api.get("/datasets/{dataset}", response={200: Dataset, 404: ErrorMessage}, tags=["datasets"])
async def get_dataset(request, dataset: str):
    """Returns a specific dataset"""
    return await aget_object_or_404(DatasetModel, id=dataset)


# @api.get("/cells", response=list[Neuron], tags=["neurons"])
# async def get_all_cells(request):
#     """Returns all the cells (neurons) from the DB"""
#     return await to_list(NeuronModel.objects.all())


# # @api.post("/connections", response=list[Connection], tags=["connectivity"])
# # # @paginate
# # def get_connections(request, options: ConnectionRequest):
# #     """Gets the connections of a dedicated Dataset"""
# #     return query_connections(**options.dict())


# @api.get("/connections", response=list[Connection], tags=["connectivity"])
# # @paginate
# def get_connections(
#     request,
#     cells: str,
#     datasetIds: str,
#     datasetType: str,
#     thresholdChemical: int = 3,
#     thresholdElectrical: int = 3,
#     includeNeighboringCells: bool = False,
#     includeAnnotations: bool = False,
# ):
#     """Gets the connections of a dedicated Dataset"""
#     # res = ConnectionModel.objects.filter(dataset_id=dataset))
#     # # import ipdb; ipdb.set_trace()  # fmt: skip
#     return query_connections(
#             [c.strip() for c in cells.split(",")],
#             [d.strip() for d in datasetIds.split(",")],
#             datasetType,
#             thresholdChemical,
#             thresholdElectrical,
#             includeNeighboringCells,
#             includeAnnotations,
#         )


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


# def query_connections(
#     cells: list[str],
#     dataset_ids: list[str],
#     dataset_type: str,
#     threshold_chemical: int,
#     threshold_electrical: int,
#     include_neighboringcells: bool,
#     include_annotations: bool,
# ):
#     if len(cells) == 0:
#         return []

#     # TODO


@api.get("/live", tags=["heathcheck"])
async def live(request):
    """Test if application is healthy"""
    return "I'm alive!"

@api.get("/ping", tags=["heathcheck"])
async def ping(request):
    """test the application is up"""
    return "Ping!"


@api.get("/ready", tags=["heathcheck"])
async def ready(request):
    """Test if application is ready to take requests"""
    return "I'm READY!"