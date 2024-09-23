from __future__ import annotations

import io
import logging
from pathlib import Path

from google.cloud.storage import Blob, Bucket

from ingestion.hash import Crc32cCalculator


class RemoteStorage:
    """Abstracts uploading files to GCP blob storage."""

    bucket: Bucket
    dry_run: bool

    _logger: logging.Logger

    def __init__(
        self,
        bucket: Bucket,
        *,
        dry_run: bool = False,
    ) -> None:
        self.bucket = bucket
        self.dry_run = dry_run

        self._logger = logging.getLogger(f"{__name__} ({bucket.name=})")
        if dry_run:
            self._logger.setLevel(logging.DEBUG)

    def upload(self, source_file: Path, blob_name: str, *, overwrite: bool = False):
        with open(source_file, "rb") as f:
            calc = Crc32cCalculator(f)
            content = calc.read()

        blob = self.bucket.get_blob(blob_name)

        if blob is None:
            blob = self.bucket.blob(blob_name)
            if self.dry_run:
                self._logger.debug(
                    f"dryrun: remote blob doesn't exist: uploading {source_file} --> {self.bucket.name}://{blob_name}"
                )
                return
            blob.upload_from_string(content)
        else:
            if calc.hexdigest() == blob.crc32c or not overwrite:
                self._logger.debug(f"skipping {blob_name}: already in the bucket")
                return
            if self.dry_run:
                self._logger.debug(
                    f"dryrun: remote blob exists but hash doesn't match: uploading {source_file} --> {self.bucket.name}://c{blob_name}"
                )
                return
            blob.upload_from_string(content)

        if not calc.hexdigest() == blob.crc32c:
            self._logger.error(
                f"wrong integrity for blob '{blob.name}', you may want to retry upload {source_file}"
            )

    def get_blob(self, blob_name: str) -> Blob | None:
        return self.bucket.get_blob(blob_name)
