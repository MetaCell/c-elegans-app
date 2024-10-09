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

DB_RAW_DATA_FOLDER = "db-raw-data"


class DbDataDownloader:
    def __init__(self): ...

    def get_summary(self):
        summary_path = GCS_BUCKET_URL / DB_RAW_DATA_FOLDER / "summary.txt"
        print(f"Getting summary of raw db files from {summary_path}")
        return summary_path

    def pull_files(self):
        # In the local version, we just return the parent, the files are already pulled
        files = self.get_summary().parent
        print(f"Getting raw db files from {files}")
        return files


RAW_DB_DATA_DOWNLOADER = DbDataDownloader
