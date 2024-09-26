from .common import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

GCS_BUCKET_URL = BASE_DIR.parent.parent.parent / "data"

INSTALLED_APPS += ["django_extensions"]

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "TEST": {"NAME": BASE_DIR / "tests" / "testdb.sqlite3"},
    }
}


class DbDataDownloader:
    def __init__(self): ...

    def get_summary(self):
        return GCS_BUCKET_URL / "db-raw-data" / "summary.json"

    def pull_files(self):
        # In the local version, we just return the parent, the files are already pulled
        files = self.get_summary()
        return files.parent


RAW_DB_DATA_DOWNLOADER = DbDataDownloader
