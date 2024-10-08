from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Iterable

from dataclasses import dataclass, field
from google.cloud.storage import Blob, Bucket

from ingestion.hash import Crc32cCalculator


@dataclass
class FakeBlob:
    def upload_from_string(self, *args, **kwargs): ...


@dataclass
class FakeBucket:
    name: str
    lifecycle_rules: list[Any] = field(default_factory=list)

    def get_blob(self, *_): ...
    def blob(self, *_) -> Blob:
        return FakeBlob()  # type:ignore

    def patch(self, *_): ...
    def list_blobs(self, *_, **kwargs) -> Iterable[Any]: ...  # type:ignore


class RemoteStorage:
    """Abstracts uploading files to GCP blob storage."""

    bucket: Bucket | FakeBucket
    dry_run: bool

    _logger: logging.Logger

    def __init__(
        self,
        bucket: Bucket | FakeBucket,
        *,
        dry_run: bool = False,
    ) -> None:
        self.bucket = bucket
        self.dry_run = dry_run

        self._logger = logging.getLogger(f"{__name__} ({bucket.name=})")
        # if dry_run:
        #     self._logger.setLevel(logging.DEBUG)

    def upload(self, source_file: Path, blob_name: str, *, overwrite: bool = False):
        if self.dry_run:
            self._logger.info(
                f" * File {source_file} will be uplodaded\n"
                f"   to {self.bucket.name}://{blob_name}"
            )
            return

        with open(source_file, "rb") as f:
            calc = Crc32cCalculator(f)
            content = calc.read()

        blob = self.bucket.get_blob(blob_name)
        if blob is None:
            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(content)
        else:
            if calc.hexdigest() == blob.crc32c or not overwrite:
                self._logger.debug(f"skipping {blob_name}: already in the bucket")
                return
            # if self.dry_run:
            #     self._logger.info(
            #         f" * file will {source_file} be uploaded as remote blob exists but hash doesn't match --> {self.bucket.name}://{blob_name}"
            #     )
            #     return
            blob.upload_from_string(content)

        if not calc.hexdigest() == blob.crc32c:
            self._logger.error(
                f"wrong integrity for blob '{blob.name}', you may want to retry upload {source_file}"
            )

    def get_blob(self, blob_name: str) -> Blob | None:
        return self.bucket.get_blob(blob_name)
