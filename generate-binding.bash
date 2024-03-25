#!/usr/bin/env bash

# Generates the openAPI specification
OPENAPI_FOLDER="openapi/openapi.json"
(cd backend && DJANGO_EXTRA_APPS="ninja" python manage.py export_openapi_schema --output "${OPENAPI_FOLDER}" --indent 2)


# Generates the typescript API binding
# (cd frontend && npm run generate-client)
