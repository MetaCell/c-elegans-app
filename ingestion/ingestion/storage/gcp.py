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


if __name__ == "__main__":
    # NOTE: test program to iterate on the code above (TO REMOVE)

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
    with open(file_path, "rb") as f:
        crc32c_calc = Crc32cCalculator(f)
        content = crc32c_calc.read()

    print(blob.crc32c, crc32c_calc.hexdigest(), blob.generation)
