from argparse import ArgumentParser
import diplib as dip
from time import time
from pathlib import Path
import geojson
from geojson import FeatureCollection, Feature, MultiPolygon
from geojson_rewind import rewind
import numpy as np
from dataclasses import dataclass, fields as dataclass_fields
from tqdm import tqdm


# @dataclass
# class Color(object):
#     rgb: tuple[int]
#     red: int
#     green: int
#     blue: int
#     pattern: int


@dataclass
class LUTEntry(object):
    nr: int
    # flags: int
    color1: list[int]
    color2: list[int]
    # anchor: list[int]
    # parentnr: int
    # childnr: int
    # prevnr: int
    # nextnr: int
    # collapsednr: int
    bbox1: list[int]
    bbox2: list[int]
    name: str


def extract_headers(metadata_path: Path):
    headers = []
    marker = "% Columns:"
    with metadata_path.open("r") as f:
        for line in f:
            if line.startswith(marker):
                headers = [s.lower() for s in line[len(marker) :].split()]
    return headers


def parse_entries(metadata_path: Path):
    fields = extract_headers(metadata_path)
    entries = {}
    with metadata_path.open("r") as f:
        for line in f:
            if line.startswith("%") or not line.strip():
                continue
            entry = parse_entry(line, fields)
            entries[entry.nr] = entry
    return entries


def transform_point(src_point, src_bbox, dst_bbox=((-179, 85), (179, -85))):
    (src_x_min, src_y_min), (src_x_max, src_y_max) = src_bbox
    (dst_x_min, dst_y_min), (dst_x_max, dst_y_max) = dst_bbox

    scale_x = (dst_x_max - dst_x_min) / (src_x_max - src_x_min)
    scale_y = (dst_y_max - dst_y_min) / (src_y_max - src_y_min)

    dst_x = dst_x_min + (src_point[0] - src_x_min) * scale_x
    dst_y = dst_y_min + (src_point[1] - src_y_min) * scale_y

    return (dst_x, dst_y)


def parse_entry(line, fields):
    name_start = line.index('"')
    values = line[:name_start].split()
    values = [int(v) for v in values]
    preformat = {k: v for k, v in zip(fields, values)}
    sub_line = line[name_start + 1 :]
    preformat["name"] = sub_line[: sub_line.index('"')]
    preformat["bbox1"] = [preformat["bboxx1"], preformat["bboxy1"], preformat["bboxz1"]]
    preformat["bbox2"] = [preformat["bboxx2"], preformat["bboxy2"], preformat["bboxz2"]]
    preformat["color1"] = (preformat["red1"], preformat["green1"], preformat["blue1"])
    preformat["color2"] = (preformat["red2"], preformat["green2"], preformat["blue2"])

    dc_fields = [field.name for field in dataclass_fields(LUTEntry)]
    return LUTEntry(**{k: v for k, v in preformat.items() if k in dc_fields})


def extract(
    img_path,
    metadata_entries,
    overwrite=False,
    write_json=True,
    write_img=False,
    print=print,
):
    result_json_path = img_path.parent / f"{img_path.stem}.json"
    if not overwrite and result_json_path.exists():
        print(f"JSON position {result_json_path} already exist, skipping")
        return

    t = time()

    print(f"= Position extraction and LUT parsing for {img_path}")
    dimg = dip.ImageRead(f"{img_path}")  # Reads the image using diplib

    # Gets the chaincodes (8-connected chain codes)
    code_chains = dip.GetImageChainCodes(dimg)
    res_contours = {}
    res_coords = {}

    i = 0
    masked = np.array(dimg)  # original image progressively masked
    mask = np.zeros_like(dimg).astype(bool)  # progressive mask

    # While the 8-connected algo finds code chains
    while code_chains:
        # Register the values discovered
        print(f"  * Iteration {i} for {[c.objectID for c in code_chains]}")
        for chain in code_chains:
            # Extract the polygon and transform it in a list
            polygon = list(chain.Polygon().Simplify())
            polygon.append(polygon[0])  # Last element = first to be geojson compliant
            res_contours.setdefault(chain.objectID, []).append(polygon)

            # Also store the coords
            # (not used right now, will be later for 3D surface reconstruction)
            # 3D reconstruction candidates are "vedo", or "open3D" (used in first SOW in Natus)
            # for a dedicated region number, the coordinates for each slice will be stacked
            # to form a 3D cloud of points using rolling-ball, marching cube or poisson reconstruction
            res_coords.setdefault(chain.objectID, []).append(list(chain.Coordinates()))

            # Construct the mask of the element to remove using the bounding box
            ((a, b), (c, d)) = chain.BoundingBox()
            mask[b : d + 1, a : c + 1] |= masked[b : d + 1, a : c + 1] == chain.objectID

        # Once all elements have been registered for a first application of the 8-connected algo
        # We apply the mask, consequently removing the elements that we already registered
        # and we start again the process (8-connected algo + polygon extraction).
        # This is to overcome a limitation:
        #   * diplib, discover properly 1 shape per label. If the number repeats in another
        #     shape (i.e: there is multiple closed shapes with the same label), only 1 shape will
        #     be discovered.
        masked = np.where(mask, 0, masked)
        dimg = dip.Image(masked)
        code_chains = dip.GetImageChainCodes(dimg)
        i += 1
    print(f"  * Labels polygon extraction: {time() - t}s")

    shape = dimg.Size(0), dimg.Size(1)
    if write_img:
        from PIL import Image

        Image.MAX_IMAGE_PIXELS = None
        result_img_path = img_path.parent / f"{img_path.stem}-colored-seg.png"
        cpy = Image.new("RGB", shape)

        print(f"  ** Writing result img in {result_img_path}")
        for v, zones in res_coords.items():
            for zone in zones:
                for x, y in zone:
                    cpy.putpixel((x, y), metadata_entries[v].color1)
        cpy.save(result_img_path)

    if write_json:
        features = [
            Feature(
                geometry=MultiPolygon([[zone] for zone in zones]),
                properties={
                    "region_number": nr,
                    "color": metadata_entries[nr].color1,
                    "name": metadata_entries[nr].name,
                },
            )
            for nr, zones in res_contours.items()
        ]
        fc = FeatureCollection(features)
        geojson.utils.map_tuples(
            lambda coord: transform_point(coord, ((0, 0), shape)), fc
        )

        result_json_path.write_text(rewind(geojson.dumps(fc)))
        print(f"  ** JSON saved as {result_json_path}\n")


if __name__ == "__main__":
    parser = ArgumentParser(description="Extract positions from segmentation file")
    parser.add_argument(
        "-i",
        "--img-path",
        help="Path of a segmentation image or the folder containing the segmentation images",
        required=True,
    )
    parser.add_argument(
        "-l", "--lut", help="Path towards the look-up table", required=True
    )
    parser.add_argument(
        "--no-json", help="Disable JSON file output", action="store_true"
    )
    parser.add_argument(
        "--write-img", help="Write the result in an img format", action="store_true"
    )
    parser.add_argument(
        "--overwrite", help="Force JSON/img production", action="store_true"
    )
    args = vars(parser.parse_args())

    metadata_path = Path(args["lut"])
    segmentation_folder = Path(args["img_path"])
    files = (
        list(segmentation_folder.glob("*.png"))
        if segmentation_folder.is_dir()
        else [segmentation_folder]
    )
    for file in tqdm(files):
        tqdm.write(f"Extracting segments from {file}")
        extract(
            file,
            parse_entries(metadata_path),
            overwrite=args["overwrite"],
            write_img=args["write_img"],
            write_json=not args["no_json"],
            print=tqdm.write,
        )
