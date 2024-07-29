import io
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.urls import reverse
from django.utils._os import safe_join

from .settings import EM_DATA_FOLDER
from PIL import Image


def view_404(request, exception=None):
    return HttpResponseRedirect(reverse("index"))


def index(request, path=""):
    if path == "":
        path = "index.html"
    fullpath = Path(safe_join(settings.STATIC_ROOT, "www", path))
    content_type, _ = mimetypes.guess_type(str(fullpath))
    content_type = content_type or "application/octet-stream"
    try:
        fullpath.open("rb")
    except FileNotFoundError:
        return index(request, "")  # index.html
    return FileResponse(fullpath.open("rb"), content_type=content_type)


TILE_SIZE = 512
BLACK_TILE = Image.new("RGB", (TILE_SIZE, TILE_SIZE))
BLACK_TILE_BUFFER = io.BytesIO()
BLACK_TILE.save(BLACK_TILE_BUFFER, format="JPEG")
MAX_ZOOM = 6


def get_tile(request, slice, x, y, zoom):
    path = Path(f"{slice}") / f"{y}_{x}_{MAX_ZOOM - int(zoom)}.jpg"

    full_path = Path(safe_join(EM_DATA_FOLDER, path))
    content_type, _ = mimetypes.guess_type(str(full_path))
    content_type = content_type or "application/octet-stream"
    if not full_path.exists():
        content = BLACK_TILE_BUFFER.getbuffer()
        # raise Http404()
    else:
        content = full_path.open("rb")

    return FileResponse(content, content_type=content_type)


def get_seg(request, slice):
    path = Path(
        f"Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s{slice}.json"
    )

    full_path = Path(
        safe_join(EM_DATA_FOLDER.parent / "SEM_adult_segmentation_mip0/", path)
    )

    content_type, _ = mimetypes.guess_type(str(full_path))
    content_type = content_type or "application/octet-stream"
    content = full_path.open("rb")
    return FileResponse(content, content_type=content_type)

def get_seg_pbf(request, slice):
    path = Path(
        f"Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s{slice}.pbf"
    )

    full_path = Path(
        safe_join(EM_DATA_FOLDER.parent / "SEM_adult_segmentation_mip0/", path)
    )

    if not full_path.exists():
        raise Http404()

    content_type = "text/plain"
    content = full_path.open("rb")
    return FileResponse(content, content_type=content_type)
