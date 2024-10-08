import time
from functools import lru_cache, partial, update_wrapper
from django.utils.functional import lazy
from django.conf import settings

from .schemas import EMData


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
def fetch_dataset_metadata(dataset_id):
    downloader = settings.METADATA_DOWNLOADER()
    em_metadata, segmentation_metadata = downloader.get_metadata_files(dataset_id)

    return EMData(
        min_zoom=em_metadata["minzoom"],
        max_zoom=em_metadata["maxzoom"],
        nb_slices=em_metadata["number_slices"],
        tile_size=tuple(em_metadata["tile_size"]),
        slice_range=tuple(em_metadata["slice_range"]),
        segmentation_size=tuple(segmentation_metadata["resolution"]),
        resource_url=settings.DATASET_EMDATA_URL_FORMAT.format(dataset=dataset_id),
        segmentation_url=settings.DATASET_EMDATA_SEGMENTATION_URL_FORMAT.format(
            dataset=dataset_id
        ),
    )
