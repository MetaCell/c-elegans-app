from __future__ import annotations

import json
import logging
import os
import sys
from argparse import ArgumentParser, Namespace
from pathlib import Path
from time import sleep

from google.cloud import storage
from pydantic import ValidationError
from tqdm import tqdm

from ingestion.cli import ask, type_directory, type_file
from ingestion.em_metadata import EMMetadata, Tile
from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.schema import Data
from ingestion.storage.blob import (
    em_metadata_blob_name,
    fs_3d_blob_name,
    fs_data_blob_name,
    fs_em_tile_blob_name,
    fs_resolutions_metadata_blob_name,
    fs_segmentation_blob_name,
)
from ingestion.storage.filesystem import (
    find_3d_files,
    find_data_files,
    find_segmentation_files,
    find_segmentation_resolution_metadata_file,
    load_data,
    load_tiles,
)
from ingestion.storage.gcp import RemoteStorage
from ingestion.xdg import xdg_config_celegans, xdg_gcloud_config

logger = logging.getLogger(__name__)


def _done_message(dataset_name: str) -> str:
    return f"==> Done uploading dataset '{dataset_name}'! ✨"


def add_flags(parser: ArgumentParser):
    parser.add_argument(
        "--overwrite",
        default=False,
        action="store_true",
        help="overwrite files in the bucket",
    )

    parser.add_argument(
        "--dry-run",
        default=False,
        action="store_true",
        help="show what would have been uploaded and where",
    )

    parser.add_argument(
        "--prune",
        help="prune files in the bucket before upload",
        default=False,
        action="store_true",
    )

    parser.add_argument(
        "-y",
        help="responds with yes to all user prompts (including '--prune')",
        default=False,
        action="store_true",
    )

    ENV_PREFIX = "C_ELEGANS"

    def envOr(name: str, default: str) -> str:
        return os.environ.get(ENV_PREFIX + "_" + name, default)

    parser.add_argument(
        "--gcp-bucket",
        help=f"google storage bucket name (envvar: {ENV_PREFIX}_GCP_BUCKET_NAME)",
        default=envOr("GCP_BUCKET_NAME", "celegans"),
    )

    parser.add_argument(
        "--gcp-credentials",
        help="google cloud json credentials (envvar: GOOGLE_APPLICATION_CREDENTIALS)",
        type=type_file,
        default=os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            str(xdg_gcloud_config() / "application_default_credentials.json"),
        ),
    )


def add_add_dataset_flags(parser: ArgumentParser):
    parser.add_argument(
        "dataset_id",
        help="dataset identifier for the ingested files",
    )

    def add_in_dir(parser: ArgumentParser, kind: str):
        parser.add_argument(
            f"-{kind.lower()[0]}",
            f"--{kind.lower()}",
            default=None,
            type=type_directory,
            help=f"directory for {kind} data",
        )

    def add_in_paths(parser: ArgumentParser, kind: str):
        parser.add_argument(
            f"-{kind.lower()[0]}",
            f"--{kind.lower()}",
            nargs="+",
            type=Path,
            help=f"directory, files or glob match for {kind} data",
        )

    add_in_dir(parser, "data")
    add_in_paths(parser, "segmentations")
    add_in_paths(parser, "3D")
    add_in_paths(parser, "EM")


def validate_and_upload_data(
    dataset_id: str, dir: Path, rs: RemoteStorage, *, overwrite: bool = False
):
    data_files = find_data_files(dir)
    json_data = load_data(data_files)

    try:
        data = Data.model_validate(json_data)
    except ValidationError as e:
        err_header = (
            "Seems like we found something unexpected with your data.\n"
            "Bellow is an overview of what we think may be wrong.\n"
            "If you think this is an error on our side, please reach out!\n"
        )

        sys.stderr.write(
            DataValidationError(e).humanize(
                w=ErrorWriter(),
                header=err_header,
                data_files=data_files,
            )
        )

        sys.exit(1)

    if dataset_id not in (ds.id for ds in data.datasets):
        raise Exception(
            f"specified dataset '{dataset_id}' was not found in datasets.json"
        )

    logger.info(f"data in {dir} is valid!")

    logger.info(f"uploading raw data...")

    paths: list[Path] = [data_files.neurons, data_files.datasets]
    paths += [conn for conn in data_files.connections.values()]
    paths += [ann for ann in data_files.annotations.values()]

    pbar = tqdm(paths, disable=rs.dry_run)
    for p in pbar:
        pbar.set_description(str(p))
        rs.upload(p, fs_data_blob_name(dataset_id, p, dir), overwrite=overwrite)

    logger.info(f"done uploading raw data!")


def prune_bucket(bucket: storage.Bucket):
    """Prune the bucket and waits until the bucket is empty by checking it periodically."""

    bucket.lifecycle_rules = [{"action": {"type": "Delete"}, "condition": {"age": 0}}]
    bucket.patch()

    try:
        sleep_interval = 10
        while True:
            has_blobs = len(list(bucket.list_blobs(max_results=1))) != 0
            if not has_blobs:
                break

            logger.info(f"bucket '{bucket.name}' is not yet empty. waiting...")
            sleep(sleep_interval)
    except Exception as e:
        raise
    finally:
        # ensure that the lifecycle rule is removed
        bucket.lifecycle_rules = []
        bucket.patch()

    logger.info(f"bucket '{bucket.name}' was pruned successfully!")


def upload_segmentations(
    dataset_id: str,
    seg_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    logger.info(f"uploading segmentation...")

    segmentation_files = find_segmentation_files(seg_paths)

    # list cast to have a progression bar (it sucks)
    seg_files = list(segmentation_files)
    if len(seg_files) == 0:
        logger.warning("skipping segmentation upload: no files matched")
        return

    pbar = tqdm(seg_files, disable=rs.dry_run)
    for _, segmentation_file in pbar:
        pbar.set_description(str(segmentation_file))
        rs.upload(
            segmentation_file,
            fs_segmentation_blob_name(dataset_id, segmentation_file),
            overwrite=overwrite,
        )

    # upload segmentation images resolution metadata
    resolutions_metadata = find_segmentation_resolution_metadata_file(seg_paths)
    if resolutions_metadata is None:
        logger.warning(
            "skipping segmentation resolutions metadata upload: file not found"
        )
        return

    rs.upload(
        resolutions_metadata,
        fs_resolutions_metadata_blob_name(dataset_id),
        overwrite=overwrite,
    )


def upload_3d(
    dataset_id: str, paths: list[Path], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info(f"uploading 3D files...")

    paths_3d = find_3d_files(paths)

    files_3d = list(paths_3d)  # list cast to have a progression bar (it sucks)
    if len(files_3d) == 0:
        logger.warning("skipping 3D files upload: no files matched")
        return

    pbar = tqdm(files_3d, disable=rs.dry_run)
    for f3d in pbar:
        pbar.set_description(str(f3d))
        rs.upload(f3d, fs_3d_blob_name(dataset_id, f3d), overwrite=overwrite)


def _tiles_root_path(tiles: list[Tile]) -> Path:
    if len(tiles) == 0:
        return xdg_config_celegans()

    def root(tile: Tile) -> Path:
        return tile.path.parent.parent

    root_parent = root(tiles[0])
    for tile in tiles[1:]:
        nr = root(tile)
        if nr != root_parent:
            xdg = xdg_config_celegans()
            logger.warning(
                f"found multiple root parents of the EM tiles, will save metadata in {xdg}"
            )
            return xdg

    return root_parent


def upload_tileset_metadata(
    dataset_id: str, tiles: list[Tile], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info("calculating EM tiles metadata...")

    metadata_blob_name = em_metadata_blob_name(dataset_id)
    remote_metadata_blob = rs.get_blob(metadata_blob_name)

    metadata = EMMetadata.from_tiles(tiles)

    if remote_metadata_blob is not None:
        # merge remote metadata with local
        remote_json_metadata = json.loads(remote_metadata_blob.download_as_string())
        try:
            remote_metadata = EMMetadata(**remote_json_metadata)
            metadata = remote_metadata.merge(metadata)
            # TODO: we do not account for new data on a existing slice
            # so this can be improved further (e.g merge slice metadata)
        except ValidationError:
            logger.error(
                "remote EM tiles metadata is malformed and will be overwritten"
            )

    local_metadata_dir = _tiles_root_path(tiles)
    local_metadata_dir.mkdir(parents=True, exist_ok=True)
    local_metadata_path = local_metadata_dir / Path(metadata_blob_name).name

    logger.info(f"saving EM tiles metadata in {local_metadata_path}...")

    with open(local_metadata_path, "w") as f:
        f.write(metadata.model_dump_json())

    rs.upload(local_metadata_path, metadata_blob_name, overwrite=overwrite)

    logger.info("uploaded EM tiles metadata!")


def upload_em_tiles(
    dataset_id: str,
    tile_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    # list cast to have a progression bar, which takes a lot of time (it sucks)
    tiles = list(load_tiles(tile_paths))
    if len(tiles) == 0:
        logger.warning("skipping EM tiles upload: no files matched")
        return

    upload_tileset_metadata(dataset_id, tiles, rs, overwrite=overwrite)

    logger.info("uploading EM tiles...")

    pbar = tqdm(tiles, disable=rs.dry_run)
    for tile in pbar:
        pbar.set_description(str(tile.path))
        rs.upload(
            tile.path, fs_em_tile_blob_name(dataset_id, tile), overwrite=overwrite
        )
        # TODO: the amount of files is a bit overwelming and takes a lot of time


def ingest_cmd(args: Namespace):
    """Runs the ingestion command."""

    storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
    bucket = storage_client.get_bucket(args.gcp_bucket)

    rs = RemoteStorage(bucket, dry_run=args.dry_run)

    if args.data:
        validate_and_upload_data(
            args.dataset_id, args.data, rs, overwrite=args.overwrite
        )
    else:
        logger.warning(f"skipping data validation: flag not set")

    if args.prune:
        prune = args.y or ask(
            "Are you sure you want to delete all files on the bucket?"
        )

        if prune:
            logger.warning(f"prunning all files from {bucket.name=}...")
            prune_bucket(bucket)
        else:
            logger.info(f"skipped prunning files from the bucket")

    if args.segmentations:
        upload_segmentations(
            args.dataset_id, args.segmentations, rs, overwrite=args.overwrite
        )
    else:
        logger.warning("skipping segmentation upload: flag not set")

    if paths := vars(args)["3d"]:
        upload_3d(args.dataset_id, paths, rs, overwrite=args.overwrite)
    else:
        logger.warning("skipping 3D files upload: flag not set")

    if args.em:
        upload_em_tiles(args.dataset_id, args.em, rs, overwrite=args.overwrite)
    else:
        logger.warning("skipping EM tiles upload: flag not set")

    print(_done_message(args.dataset_id))
