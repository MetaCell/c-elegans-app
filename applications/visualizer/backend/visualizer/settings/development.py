import json

from niquests import Session
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

    @classmethod
    def get_segmentation_metadata(cls, dataset_id):
        file = GCS_BUCKET_URL / dataset_id / "segmentations" / "metadata.json"
        if not file.exists():
            return {}
        return json.loads(file.read_text())

    @classmethod
    def get_em_metadata(cls, dataset_id):
        file = GCS_BUCKET_URL / dataset_id / "em" / "metadata.json"
        if not file.exists():
            return {}
        return json.loads(file.read_text())

    def get_metadata_files(self, dataset_id):
        return (
            self.get_em_metadata(dataset_id),
            self.get_segmentation_metadata(dataset_id),
        )


RAW_DB_DATA_DOWNLOADER = DbDataDownloader
METADATA_DOWNLOADER = DbDataDownloader


GCS_BUCKET = "celegans"
GCS_BUCKET_URL = f"https://storage.googleapis.com/{GCS_BUCKET}"
DB_RAW_DATA_FOLDER = "db-raw-data"


class DbDataDownloader:
    def __init__(self):
        self.session = Session(multiplexed=True)

    def get_summary(self):
        summary_content = self.session.get(
            f"{GCS_BUCKET_URL}/{DB_RAW_DATA_FOLDER}/summary.txt", allow_redirects=True
        )
        if summary_content.status_code != 200:
            raise Exception(
                f"Error while pulling 'summary.txt' from the bucket: {summary_content}"
            )
        assert summary_content.text, "The summary.txt looks empty"
        return summary_content.text

    def pull_files(self):
        summary = self.get_summary()
        files = {}
        print("Pulling DB data files from the bucket (multiplexed)...")
        for bucket_file_path in summary.split():
            destination = BASE_DIR / bucket_file_path
            print(f"  . pulling gs://{GCS_BUCKET}/{bucket_file_path} to {destination}")
            files[destination] = self.session.get(
                f"{GCS_BUCKET_URL}/{bucket_file_path}", allow_redirects=True
            )
        self.session.gather()
        print("Writing the files...")
        for file_path, result in files.items():
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(result.text)

        # We pull the segmentation metadata and the EM viewer metadata
        self._pull_metadata()

        return BASE_DIR / DB_RAW_DATA_FOLDER

    def _pull_metadata(self):
        db_data_folder = BASE_DIR / DB_RAW_DATA_FOLDER
        datasets = json.loads((db_data_folder / "datasets.json").read_text())
        files = {}
        print(
            "Pulling EM viewer and segmentation config data files from the bucket (multiplexed)..."
        )
        for dataset in datasets:
            dataset_id = dataset["id"]
            em_metadata = db_data_folder / dataset_id / "em_metadata.json"
            segmentation_metadata = (
                db_data_folder / dataset_id / "segmentation_metadata.json"
            )
            files[segmentation_metadata] = self._pull_segmentation_metadata(dataset_id)
            files[em_metadata] = self._pull_em_metadata(dataset_id)

        for file_path, result in files.items():
            if result.status_code != 200 or not result.text:
                print(f"  [ ] no {file_path.name} data for {file_path.parent.name}")
                continue
            print(
                f"  [x] configuration found for {file_path.parent.name}, writing in {file_path}"
            )
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(result.text)

    def _pull_segmentation_metadata(self, dataset_id):
        url = f"{GCS_BUCKET_URL}/{dataset_id}/segmentations/metadata.json"
        print(f"  . pulling gs://{url}")
        return self.session.get(url)

    def _pull_em_metadata(self, dataset_id):
        url = f"{GCS_BUCKET_URL}/{dataset_id}/em/metadata.json"
        print(f"  . pulling gs://{url}")
        return self.session.get(url)

    @classmethod
    def get_segmentation_metadata(cls, dataset_id):
        file = BASE_DIR / DB_RAW_DATA_FOLDER / dataset_id / "segmentation_metadata.json"
        if not file.exists():
            return {}
        return json.loads(file.read_text())

    @classmethod
    def get_em_metadata(cls, dataset_id):
        file = BASE_DIR / DB_RAW_DATA_FOLDER / dataset_id / "em_metadata.json"
        if not file.exists():
            return {}
        return json.loads(file.read_text())

    def get_metadata_files(self, dataset_id):
        return (
            self.get_em_metadata(dataset_id),
            self.get_segmentation_metadata(dataset_id),
        )


RAW_DB_DATA_DOWNLOADER = DbDataDownloader
METADATA_DOWNLOADER = DbDataDownloader
