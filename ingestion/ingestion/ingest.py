from __future__ import annotations

import concurrent.futures
from functools import lru_cache
import json
import logging
import os
import subprocess
import sys
from argparse import ArgumentParser, Namespace
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from google.api_core.exceptions import PreconditionFailed
from google.cloud import storage
from pydantic import ValidationError
from tqdm import tqdm
import niquests

from ingestion.cli import ask, type_directory, type_file
from ingestion.em_metadata import EMMetadata, Tile
from ingestion.errors import DataValidationError, ErrorWriter
from ingestion.schema import Data, DataContainer
from ingestion.storage.blob import (
    em_metadata_blob_name,
    find_longest_suffix,
    fs_3d_blob_name,
    fs_3d_synapse_blob_name,
    fs_data_blob_name,
    fs_em_tile_blob_name,
    fs_segmentation_blob_name,
    fs_segmentations_resolutions_metadata_blob_name,
    fs_synapses_blob_name,
    fs_synapses_resolutions_metadata_blob_name,
)
from ingestion.storage.filesystem import (
    find_3d_files,
    find_data_files,
    find_segmentation_files,
    find_segmentation_resolution_metadata_file,
    find_synapses_files,
    find_synapses_resolution_metadata_file,
    load_data,
    load_tiles,
)
from ingestion.storage.gcp import FakeBucket, RemoteStorage
from ingestion.xdg import xdg_config_celegans, xdg_gcloud_config

logger = logging.getLogger(__name__)


def _done_message(dataset_name: str | None, dry_run: bool = False) -> str:
    """Generate a completion message for the ingestion process."""
    if dataset_name:
        return f"==> Done {'upload simulation for' if dry_run else 'uploading'} dataset '{dataset_name}'! ✨"
    else:
        return "==> Ingestion completed! ✨"


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
        "-d",
        "--data",
        type=type_directory,
        help="folder with the main structure with JSON files about neurons/datasets/connectivity/synapses information that will be ingested in the DB (for all datasets)",
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

    def env_or(name: str, default: str) -> str:
        return os.environ.get(f"{ENV_PREFIX}_{name}", default)

    parser.add_argument(
        "--gcp-bucket",
        help=f"google storage bucket name (envvar: {ENV_PREFIX}_GCP_BUCKET_NAME)",
        default=env_or("GCP_BUCKET_NAME", "celegans"),
    )

    parser.add_argument(
        "--gcp-credentials",
        help="google cloud json credentials (envvar: GOOGLE_APPLICATION_CREDENTIALS)",
        type=type_file,
        default=os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            f"{xdg_gcloud_config() / 'application_default_credentials.json'}",
        ),
    )

    parser.add_argument(
        "--populate-db",
        action="store_true",
        help="Trigger DB population via the API endpoint",
    )

    parser.add_argument(
        "--populate-db-url",
        default="https://celegans.dev.metacell.us/api/populate_db",
        help="The API URL to trigger DB population",
    )


def add_add_dataset_flags(parser: ArgumentParser):
    parser.add_argument(
        "--id",
        type=str,
        required=True,
        help="dataset identifier for the ingested files",
    )

    # def add_in_dir(parser: ArgumentParser, kind: str):
    #     parser.add_argument(
    #         f"-{kind.lower()[0]}",
    #         f"--{kind.lower()}",
    #         default=None,
    #         type=type_directory,
    #         help=f"{kind} directory",
    #     )

    def add_in_paths(
        parser: ArgumentParser, kind: str, *, short_flag: str | None = None
    ):
        parser.add_argument(
            f"-{short_flag or kind.lower()[0]}",
            f"--{kind.lower()}",
            nargs="+",
            type=Path,
            help=f"directory, files or glob match for {kind} data",
        )

    # add_in_dir(parser, "connectivity")
    add_in_paths(parser, "segmentation", short_flag="seg")
    add_in_paths(parser, "3D")
    add_in_paths(parser, "EM")
    add_in_paths(parser, "synapses", short_flag="syn")


@lru_cache()
def collect_and_validate_data(dir: Path) -> tuple[Data, DataContainer[Path]]:
    data_files = find_data_files(dir)
    json_data = load_data(data_files)

    try:
        data = Data.model_validate(json_data)
        logger.info(f"Data in {dir} has the right structure and is valid!")
        return data, data_files
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


def validate_dataset(dataset_id: str, data: Data):
    if dataset_id not in (ds.id for ds in data.datasets):
        raise Exception(
            f"Specified dataset '{dataset_id}' was not found in datasets.json"
        )


def upload_dataset_data(
    dir: Path, remote_storage: RemoteStorage, *, overwrite: bool = False
):
    _, data_files = collect_and_validate_data(dir)

    logger.info(f"Uploading raw json data...")

    paths: list[Path] = list(data_files.all_paths())

    pbar = tqdm(paths, disable=remote_storage.dry_run)
    for p in pbar:
        pbar.set_description(str(p))
        remote_storage.upload(p, fs_data_blob_name(p, dir), overwrite=overwrite)

    logger.info("Done uploading raw json data!")

    logger.info("Building the summary.txt file...")
    summary_file = dir / "summary.txt"
    summary_file.write_text("\n".join(fs_data_blob_name(file, dir) for file in paths))
    remote_storage.upload(
        summary_file, fs_data_blob_name(summary_file, dir), overwrite=overwrite
    )
    logger.info("Done uploading summary.txt")


def prune_bucket(bucket: storage.Bucket | FakeBucket):
    """Asynchronously prune the bucket from content older than today. This can take up to 24h."""

    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    prune_rule = {
        "action": {"type": "Delete"},
        "condition": {"createdBefore": yesterday.strftime("%Y-%m-%d")},
    }

    def is_prune_lifecycle(rule: dict) -> bool:
        return (
            rule["action"]["type"] == "Delete" and "createdBefore" in rule["condition"]
        )

    lifecycle_rules = list(bucket.lifecycle_rules)

    for lifecycle in lifecycle_rules:
        if is_prune_lifecycle(lifecycle):
            lifecycle["condition"]["createdBefore"] = prune_rule["condition"][
                "createdBefore"
            ]
            break
    else:
        lifecycle_rules.append(prune_rule)  # type: ignore

    bucket.lifecycle_rules = lifecycle_rules
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

    seg_files = list(segmentation_files)
    if len(seg_files) == 0:
        logger.warning("skipping segmentation upload: no files found")
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
            "skipping segmentation resolutions metadata upload: no files found"
        )
        return

    rs.upload(
        resolutions_metadata,
        fs_segmentations_resolutions_metadata_blob_name(dataset_id),
        overwrite=overwrite,
    )


def upload_synapses(
    dataset_id: str,
    synapses_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    logger.info(f"uploading synapses positions for EM Viewer...")

    synapses_files = find_synapses_files(synapses_paths)

    syn_files = list(synapses_files)
    if len(syn_files) == 0:
        logger.warning("skipping synapses positions upload: no files found")
        return

    pbar = tqdm(syn_files, disable=rs.dry_run)
    for _, synapses_file in pbar:
        pbar.set_description(str(synapses_file))
        rs.upload(
            synapses_file,
            fs_synapses_blob_name(dataset_id, synapses_file),
            overwrite=overwrite,
        )

    # upload synapses images resolution metadata
    resolutions_metadata = find_synapses_resolution_metadata_file(synapses_paths)
    if resolutions_metadata is None:
        logger.warning("skipping synapses resolutions metadata upload: no files found")
        return

    rs.upload(
        resolutions_metadata,
        fs_synapses_resolutions_metadata_blob_name(dataset_id),
        overwrite=overwrite,
    )


def upload_3d(
    dataset_id: str, paths: list[Path], rs: RemoteStorage, *, overwrite: bool = False
):
    logger.info(f"uploading 3D files (synapses, neurons)... [{paths}]")

    neurons = find_3d_files(paths, exclude_files_w_words=["synapse"])

    files_3d = list(neurons)
    if len(files_3d) == 0:
        logger.warning("skipping 3D neurons files upload: no files found")
    else:
        longest_common_suffix = find_longest_suffix(files_3d)
        pbar = tqdm(files_3d, disable=rs.dry_run)
        for f3d in pbar:
            pbar.set_description(str(f3d))
            rs.upload(
                f3d,
                fs_3d_blob_name(dataset_id, f3d, regex=longest_common_suffix),
                overwrite=overwrite,
            )

    synapses_dirs = [p / "synapses" for p in paths]
    synapses = find_3d_files(synapses_dirs)

    files_3d = list(synapses)
    if len(files_3d) == 0:
        logger.warning("skipping 3D synapses files upload: no files found")
    else:
        logger.info(
            "Extract and process synapses positions (this step is always run, even in dry-run mode)..."
        )
        import re

        conversion_script = synapses_dirs[0] / "convert.py"

        conversion_fun = None
        if conversion_script.exists():
            logger.info(f"Conversion script detected: {conversion_script}")
            import importlib

            spec = importlib.util.spec_from_file_location(  # type: ignore
                "synapses_converter", conversion_script
            )
            module = importlib.util.module_from_spec(spec)  # type: ignore
            spec.loader.exec_module(module)
            try:
                conversion_fun = getattr(module, "convert")
            except AttributeError:
                logger.warning(
                    "Conversion script had been found, but it doesn't have a 'convert' function. Coordinate conversion will not be applied"
                )

        synapses_positions_file = synapses_dirs[0] / "synapses_positions.txt"
        f = synapses_positions_file.open("w")

        def extract_last_number(filename: str) -> str | None:
            match = re.findall(r"\d+", filename)
            return match[-1] if match else None

        file3d_pbar = tqdm(files_3d)
        for file in file3d_pbar:
            import trimesh

            mesh = trimesh.load(file)

            # Gets the center of the bbox
            bbox = mesh.bounds
            bbox_min, bbox_max = bbox
            center = (bbox_min + bbox_max) / 2

            # We call the conversion function if there is one
            if conversion_fun:
                center = conversion_fun(file, mesh, center)

            # Extract catmaid connector id
            connector_id = extract_last_number(file.stem)
            entry = f"{connector_id}: [{center[0]}, {center[1]}, {center[2]}]\n"
            f.write(entry)

        f.close()

        logger.info("Upload 3D synapses files...")
        longest_common_suffix = find_longest_suffix(files_3d)
        rs.upload(
            synapses_positions_file,
            fs_3d_synapse_blob_name(
                dataset_id, synapses_positions_file, regex=longest_common_suffix
            ),
            overwrite=True,
        )

        pbar = tqdm(files_3d, disable=rs.dry_run)
        for f3d in pbar:
            pbar.set_description(str(f3d))
            rs.upload(
                f3d,
                fs_3d_synapse_blob_name(dataset_id, f3d, regex=longest_common_suffix),
                overwrite=overwrite,
            )


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
    dataset_id: str,
    tiles: list[Tile],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    dry_run = rs.dry_run
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
    if not dry_run:
        local_metadata_dir.mkdir(parents=True, exist_ok=True)
    local_metadata_path = local_metadata_dir / Path(metadata_blob_name).name

    if dry_run:
        logger.info(
            f"EM tiles metadata will be saved in {local_metadata_path} and uploaded as {metadata_blob_name}..."
        )
    else:
        logger.info(f"saving EM tiles metadata in {local_metadata_path}...")

    local_metadata_path.write_text(metadata.model_dump_json())

    rs.upload(local_metadata_path, metadata_blob_name, overwrite=overwrite)

    if not dry_run:
        logger.info("uploaded EM tiles metadata!")


def upload_em_tiles(
    dataset_id: str,
    tile_paths: list[Path],
    rs: RemoteStorage,
    *,
    overwrite: bool = False,
):
    tiles = list(load_tiles(tile_paths))
    if len(tiles) == 0:
        logger.warning("skipping EM tiles upload: no files found")
        return

    upload_tileset_metadata(dataset_id, tiles, rs, overwrite=overwrite)

    logger.info("uploading EM tiles...")

    # hold in memory tiles that failed to upload
    # retries are provided by google.storage but some errors seem to
    # not be intermittent and bubble up
    # if the program is stopped, it is fine, each tile will be checked
    # in the bucket and uploaded accordingly
    failed_upload_tiles: list[Tile] = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_tile = {
            executor.submit(
                rs.upload,
                tile.path,
                fs_em_tile_blob_name(dataset_id, tile),
                overwrite=overwrite,
            ): tile
            for tile in tiles
        }

        pbar = tqdm(total=len(future_to_tile))
        for future in concurrent.futures.as_completed(future_to_tile):
            tile = future_to_tile[future]
            pbar.update(1)
            exp = future.exception()
            if exp and not isinstance(exp, PreconditionFailed):
                logger.error(f"uploading EM tile {tile.path} exception: {str(exp)}")
                failed_upload_tiles.append(tile)
                continue

        pbar.close()

        # retry tiles that failed to upload
        pbar = tqdm(total=len(failed_upload_tiles))
        while len(failed_upload_tiles) > 0:
            tile = failed_upload_tiles.pop()
            pbar.set_description(f"retrying upload {tile.path}")
            try:
                rs.upload(
                    tile.path,
                    fs_em_tile_blob_name(dataset_id, tile),
                    overwrite=overwrite,
                )
                pbar.update(1)
            except PreconditionFailed:
                pass
            except Exception as exp:
                failed_upload_tiles.append(tile)

        pbar.close()


def trigger_populate_db(args):
    try:
        api_url = args.populate_db_url

        # Load service account credentials from gcp_credentials
        with open(args.gcp_credentials, "r") as f:
            gcp_creds = json.load(f)

        client_id = gcp_creds.get("client_id")
        private_key_id = gcp_creds.get("private_key_id")

        if not client_id or not private_key_id:
            print(
                "Error: Could not extract client_id or private_key_id from gcp_credentials",
                file=sys.stderr,
            )
            return

        session = niquests.Session(resolver="doh+google://", multiplexed=True)

        with session.get(
            api_url, auth=(client_id, private_key_id), stream=True, timeout=None
        ) as response:
            if response.status_code != 200:
                print(
                    f"Error: Received status code {response.status_code}",
                    file=sys.stderr,
                )
                return
            try:
                for line in response.iter_lines(decode_unicode=True):
                    if line:
                        if isinstance(line, bytes):
                            line = line.decode("utf-8")
                        print(line, flush=True)
            except KeyboardInterrupt:
                print("\nStreaming interrupted by user.", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)


def ingest_cmd(args: Namespace):
    """Runs the ingestion command."""

    dry_run = args.dry_run
    if dry_run:
        bucket = FakeBucket(args.gcp_bucket)
    else:
        storage_client = storage.Client.from_service_account_json(args.gcp_credentials)
        bucket = storage_client.get_bucket(args.gcp_bucket)
    rs = RemoteStorage(bucket, dry_run=args.dry_run)

    dataset_id = getattr(args, "id", None)
    overwrite = args.overwrite

    if args.prune:
        prune = args.y or ask(
            "Are you sure you want to delete all files on the bucket?"
        )

        if prune:
            logger.warning(f"prunning all files from {bucket.name=}...")
            prune_bucket(bucket)
        elif dry_run:
            logger.info(f"skipped prunning files from the bucket")

    if args.data:
        data_dir = args.data
        data, _ = collect_and_validate_data(data_dir)
        if not dry_run:
            logger.info("Skipping raw json dataset information upload")
            upload_dataset_data(data_dir, remote_storage=rs, overwrite=overwrite)
    else:
        logger.error("Raw json data directory for the dataset is missing!")
        sys.exit(-1)

    if dataset_id:
        # validates that the dataset id is well in the raw json data
        validate_dataset(dataset_id, data)
        if args.segmentation:
            upload_segmentations(dataset_id, args.segmentation, rs, overwrite=overwrite)
        elif dry_run:
            logger.warning("skipping segmentation upload: flag not set")

        if args.synapses:
            upload_synapses(dataset_id, args.synapses, rs, overwrite=overwrite)
        elif dry_run:
            logger.warning("skipping synapses upload: flag not set")

        if paths := getattr(args, "3d"):
            upload_3d(dataset_id, paths, rs, overwrite=overwrite)
        elif dry_run:
            logger.warning("skipping 3D files upload: flag not set")

        if args.em:
            upload_em_tiles(dataset_id, args.em, rs, overwrite=overwrite)
        elif dry_run:
            logger.warning("skipping EM tiles upload: flag not set")
    else:
        logger.warning(
            "No dataset ID provided, skipping dataset dependent artifacts upload"
        )

    if args.populate_db:
        trigger_populate_db(args)
    elif dry_run:
        logger.warning("skipping populate DB: flag not set")

    print(_done_message(dataset_id, dry_run))
