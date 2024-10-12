import time
from functools import lru_cache, partial, update_wrapper
from django.utils.functional import lazy
from django.conf import settings

from .schemas import EMData
from .models import Dataset


## Some util functions
async def to_list(q):
    return [x async for x in q]


def lru_cache_time(seconds, maxsize=None):
    def wrapper(func):
        # Lazy function that makes sure the lru_cache() invalidate after X secs
        ttl_hash = lazy(lambda: round(time.time() / seconds), int)()

        @lru_cache(maxsize)
        def time_aware(__ttl, *args, **kwargs):
            return func(*args, **kwargs)

        return update_wrapper(partial(time_aware, ttl_hash), func)

    return wrapper


@lru_cache_time(seconds=60 * 60, maxsize=10)  # We cache information for 1h
async def get_dataset_viewer_config(dataset: Dataset):
    config = await dataset.config.afirst()  # type: ignore
    if config is None:
        return None
    em_metadata = config.em_config
    segmentation_metadata = config.segmentation_config
    resolution = segmentation_metadata.get("resolution")
    return EMData(
        min_zoom=em_metadata.get("minzoom"),
        max_zoom=em_metadata.get("maxzoom"),
        nb_slices=em_metadata.get("number_slices"),
        tile_size=tuple(em_metadata.get("tile_size")),
        slice_range=tuple(em_metadata.get("slice_range")),
        segmentation_size=tuple(resolution) if resolution else None,
        resource_url=settings.DATASET_EMDATA_URL_FORMAT.format(dataset=dataset.id),
        segmentation_url=(
            settings.DATASET_EMDATA_SEGMENTATION_URL_FORMAT.format(dataset=dataset.id)
            if resolution
            else None
        ),
    )
