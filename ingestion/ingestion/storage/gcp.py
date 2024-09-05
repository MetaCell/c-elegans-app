from __future__ import annotations

import logging
from pathlib import Path

from google.cloud.storage import Bucket, Client

from ingestion.hash import Crc32cCalculator

logger = logging.getLogger(__name__)


class RemoteStorage:
    """Abstracts uploading files to GCP blob storage."""

    bucket: Bucket

    def __init__(
        self,
        bucket: Bucket,
    ) -> None:
        self.bucket = bucket

    def upload(self, source_file: Path, blob_name: str, *, overwrite: bool = False):
        with open(source_file, "rb") as f:
            calc = Crc32cCalculator(f)
            content = calc.read()

        blob = self.bucket.get_blob(blob_name)

        if blob is None:
            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(content)
            blob.reload()
        else:
            if calc.hexdigest() == blob.crc32c or not overwrite:
                logger.debug(f"skipping {blob_name}: already in the bucket")
                return

            blob.upload_from_string(content)
            blob.reload()

        if not calc.hexdigest() == blob.crc32c:
            logger.error(
                f"wrong integrity for blob '{blob.name}', you may want to retry upload {source_file}"
            )
