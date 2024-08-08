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


EM_DATA_FOLDER = BASE_DIR.parent.parent.parent / "SEM_adult_catmaid_tiles"
