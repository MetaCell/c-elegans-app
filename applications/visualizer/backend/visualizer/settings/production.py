from pathlib import Path
from functools import lru_cache
from ruamel.yaml import YAML
from niquests.sessions import Session
from .common import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

GCS_BUCKET = "celegans"
GCS_BUCKET_URL = f"https://storage.googleapis.com/{GCS_BUCKET}"


class Config(dict):
    def __getattr__(self, key):
        result = self[key]
        if isinstance(result, dict):
            return Config(result)
        if isinstance(result, list):
            return [Config(x) for x in result]
        return result


@lru_cache
def read_config():
    yaml = YAML(typ="safe")  # default, if not specfied, is 'rt' (round-trip)
    if IS_PRODUCTION and CURRENT_APP_NAME:
        # We are in cluster mode
        config_file = "/opt/cloudharness/resources/allvalues.yaml"
        return Config(yaml.load(Path(config_file))["apps"][CURRENT_APP_NAME])

    # We are in local cluster mode (feeding the DB for example)
    config_file = "../../../deployment/compose/allvalues.yaml"
    config_map = yaml.load(Path(config_file))["apps"][CURRENT_APP_NAME]
    # explicitly set host to 127.0.0.1
    config_map["harness"]["database"]["name"] = "127.0.0.1"
    return Config(config_map)


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": read_config().harness.database.postgres.initialdb,
        "USER": getattr(read_config().harness.database, "user", None),
        "PASSWORD": getattr(read_config().harness.database, "pass", None),
        "HOST": read_config().harness.database.name,
        "PORT": read_config().harness.database.postgres.ports[0].port,
        # "TEST": {
        #     "ENGINE": "django.db.backends.sqlite3",
        #     "NAME": PERSISTENT_ROOT / "testdb.sqlite3"),
        # },
    },
}


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

        return BASE_DIR / DB_RAW_DATA_FOLDER


RAW_DB_DATA_DOWNLOADER = DbDataDownloader
