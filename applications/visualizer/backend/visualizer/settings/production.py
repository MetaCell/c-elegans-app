from pathlib import Path
from functools import lru_cache
from ruamel.yaml import YAML
from .common import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False


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
    yaml = YAML(typ='safe')   # default, if not specfied, is 'rt' (round-trip)
    return Config(yaml.load(Path("/opt/cloudharness/resources/allvalues.yaml"))["apps"][CURRENT_APP_NAME])


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
