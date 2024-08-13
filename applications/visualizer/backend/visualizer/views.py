import io
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseRedirect, Http404, HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.utils._os import safe_join

from PIL import Image


def view_404(request, exception=None):
    return HttpResponseRedirect(reverse("index"))


def index(request, path="", already_asked=False):
    if path == "":
        path = "index.html"
    fullpath = Path(safe_join(settings.STATIC_ROOT, "www", path))
    content_type, _ = mimetypes.guess_type(str(fullpath))
    content_type = content_type or "application/octet-stream"
    try:
        fullpath.open("rb")
    except FileNotFoundError:
        if already_asked:
            # This is here to avoid recursive loop in local dev
            return HttpResponse(content=f"Page {path} cannot be found :(", status=404)
        return index(request, "", already_asked=True)  # index.html
    return FileResponse(fullpath.open("rb"), content_type=content_type)


TILE_SIZE = 512  # Should be computed
BLACK_TILE = Image.new("RGB", (TILE_SIZE, TILE_SIZE))
BLACK_TILE_BUFFER = io.BytesIO()
BLACK_TILE.save(BLACK_TILE_BUFFER, format="JPEG")
MAX_ZOOM = 6  # Should be set


def get_tile(request, slice, x, y, zoom):
    path = (
        Path("sem-adult")
        / "catmaid-tiles"
        / f"{slice}"
        / f"{y}_{x}_{MAX_ZOOM - int(zoom)}.jpg"
    )

    return access_bucket_artifact(
        request, path, unavaiable_page=BLACK_TILE_BUFFER.getbuffer()
    )


def access_bucket_artifact(request, path, unavaiable_page=None):
    resource_folder = Path(settings.GCS_BUCKET_URL)
    if resource_folder.exists():
        full_path = resource_folder / path
        content_type, _ = mimetypes.guess_type(str(full_path))
        content_type = content_type or "application/octet-stream"
        try:
            return FileResponse(full_path.open("rb"), content_type=content_type)
        except FileNotFoundError:
            if unavaiable_page:
                return FileResponse(unavaiable_page, content_type=content_type)
            return index(request, "")  # index.html

    return redirect(f"{settings.GCS_BUCKET_URL}/{path}", permanent=True)
