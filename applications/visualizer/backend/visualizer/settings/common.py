"""
Django settings for celegans project.

Generated by 'django-admin startproject' using Django 5.0.3.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
CURRENT_APP_NAME = os.environ.get("CH_CURRENT_APP_NAME", None)
IS_PRODUCTION = os.environ.get("PRODUCTION", False)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-fht$5&8wk6+iw-%ajq@bs!3q!4vp=j$w=9dx%$(huqkq!xc%se"


ALLOWED_HOSTS = [
    "*",
]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

EXTRA_APPS = os.environ.setdefault("DJANGO_EXTRA_APPS", "")
if EXTRA_APPS:
    INSTALLED_APPS.extend(EXTRA_APPS.split(","))

MIDDLEWARE = [
    "django.middleware.gzip.GZipMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "visualizer.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "visualizer.wsgi.application"


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

PROJECT_NAME = "visualizer".upper()

# Persistent storage
PERSISTENT_ROOT = BASE_DIR / "persistent"

# # ***********************************************************************
# # * visualizer settings
# # ***********************************************************************
# from cloudharness.applications import get_configuration
# from cloudharness.utils.config import ALLVALUES_PATH, CloudharnessConfig

# # ***********************************************************************
# # * import base CloudHarness Django settings
# # ***********************************************************************
# from cloudharness_django.settings import *

# add the local apps to get access to new custom management commands
INSTALLED_APPS += ["api"]

# # override django admin base template with a local template
# # to add some custom styling
# TEMPLATES[0]["DIRS"] = [BASE_DIR / "templates"]

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/
STATIC_ROOT = BASE_DIR / "static"
STATIC_URL = "static/"


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

NINJA_PAGINATION_PER_PAGE = 100

# Fragments for various artifacts
# In this format: {var} is changed by the backend, while {{var}} is something that need to be changed by the frontend
# NEURON_REPRESENTATION_3D_URL_FORMAT = "resources/{{dataset}}/3d-model/{name}"
# DATASET_NEURON_REPRESENTATION_3D_URL_FORMAT = "resources/{dataset}/3d-model/{{name}}"
# DATASET_EMDATA_URL_FORMAT = "resources/{dataset}/em-data/tiles/{{index}}"
# DATASET_EMDATA_SEGMENTATION_URL_FORMAT = "resources/{dataset}/em-data/segmentation/{{index}}"


NEURON_REPRESENTATION_3D_URL_FORMAT = "resources/{{dataset}}/3d-model/{name}"
DATASET_NEURON_REPRESENTATION_3D_URL_FORMAT = "resources/{dataset}/3d-model/{{name}}"
DATASET_EMDATA_URL_FORMAT = f"resources/sem-adult/catmaid-tiles/{{index}}"
DATASET_EMDATA_SEGMENTATION_URL_FORMAT = f"resources/sem-adult/segmentation-mip0/Dataset8_segmentation_withsoma_Mona_updated_20230127.vsseg_export_s{{index}}.json"
