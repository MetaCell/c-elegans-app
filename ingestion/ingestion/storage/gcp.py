from __future__ import annotations

import logging
from pathlib import Path

from google.cloud.storage import Bucket, Client

from ingestion.hash import Crc32cCalculator
from ingestion.storage.sqlite import SQLiteKVStore
from ingestion.xdg import xdg_celegans_cache

_DEFAULT_SEGMENTATION_CACHE = xdg_celegans_cache() / "segmentation-cache.db"

logger = logging.getLogger(__name__)


class Uploader:
    """Abstracts uploading files to GCP blob storage."""

    bucket: Bucket

    # TODO: add cache support
    cache_enabled: bool
    cache: SQLiteKVStore

    def __init__(
        self,
        bucket: Bucket,
        *,
        enable_cache: bool = False,
        cache_location: Path | None = None,
    ) -> None:
        self.bucket = bucket
        self.cache_enabled = enable_cache

        if enable_cache:
            cache_location = cache_location or _DEFAULT_SEGMENTATION_CACHE
            self.cache = SQLiteKVStore(cache_location)

    def upload(self, source_file: Path, blob_name: str, *, overwrite: bool = False):
        blob = self.bucket.blob(blob_name)

        if not overwrite and self.bucket.get_blob(blob_name):
            logger.debug(f"skipping {blob_name}")
            return

        blob.upload_from_filename(source_file)


# TODO: verify blob integrity

# blob = self.bucket.get_blob(name)
# if blob is not None:
#     with open(source_file) as f:
#         crc32c_calc = Crc32cCalculator(f)
#         crc32c_calc.read()
#         print(crc32c_calc.hexdigest())

# generation_match_precondition = None
# blob = self.bucket.blob(name)
# blob.upload_from_file(source_file, if_generation_match=generation_match_precondition)

# blobs = [
#     blob
#     for blob in tqdm(
#         islice(
#             bucket.list_blobs(fields="items(name,crc32c,generation),nextPageToken"),
#             0,
#             10,
#         )
#     )
# ]  # TODO: remove 10 blobs limit

# blobs_hash = SQLiteKVStore(args.cache_path / "blobs-hash-cache.db")
# for blob in blobs:
#     blobs_hash.set(blob.name, blob.crc32c)
#     print(blob.name, blob.crc32c)
# blobs_hash.close()  # commit changes


if __name__ == "__main__":
    import sys
    from argparse import ArgumentParser

    from ingestion.ingest import add_flags

    parser = ArgumentParser()

    add_flags(parser)

    args = parser.parse_args()

    storage_client = Client.from_service_account_json(args.gcp_credentials)
    bucket = storage_client.get_bucket(args.gcp_bucket)

    segmentation_path: Path = (
        args.segmentations_dir or args.dir / "sem-adult" / "segmentation-mip0"
    )

    slice = 587
    blob_name = "sem-adult/segmentation-mip0/Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s587.json"
    file_path = (
        segmentation_path
        / "Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s587.json"
    )

    blob = bucket.get_blob(blob_name)

    if blob is None:
        print("blob is None!")
        sys.exit()

    # calc crc32c
    with open(file_path) as f:
        crc32c_calc = Crc32cCalculator(f)
        content = crc32c_calc.read()

    print(blob.crc32c, crc32c_calc.hexdigest(), blob.generation)


# https://storage.googleapis.com/celegans/sem-adult/catmaid-tiles/487/12_31_0.jpg
