import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import reverse
from django.utils._os import safe_join


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

    return redirect(f"{settings.GCS_BUCKET_URL}/{path}", permanent=True)
