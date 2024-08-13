import io
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseRedirect
from django.shortcuts import redirect
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
        f"Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s{int(slice):03d}.json"
    )

    full_path = Path(
        safe_join(EM_DATA_FOLDER.parent / "SEM_adult_segmentation_mip0/", path)
    )

    content_type, _ = mimetypes.guess_type(str(full_path))
    content_type = content_type or "application/octet-stream"
    content = full_path.open("rb")
    return FileResponse(content, content_type=content_type)


def access_bucket_artifact(request, path):
    resource_folder = Path(settings.GCS_BUCKET_URL)
    if resource_folder.exists():
        full_path = resource_folder / path
        content_type, _ = mimetypes.guess_type(str(full_path))
        content_type = content_type or "application/octet-stream"
        try:
            return FileResponse(full_path.open("rb"), content_type=content_type)
        except FileNotFoundError:
            return index(request, "")  # index.html

    return redirect(f"{settings.GCS_BUCKET_URL}/{path}")
