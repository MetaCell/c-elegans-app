#!/usr/bin/env bash

OPENAPI_FOLDER="openapi/openapi.json"

# Trick to have folder relative to the script, not CWD
PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "${PARENT_PATH}"


# Generates the openAPI specification
(cd backend && DJANGO_EXTRA_APPS="ninja" python manage.py export_openapi_schema --output "${OPENAPI_FOLDER}" --indent 2)
cp backend/"${OPENAPI_FOLDER}" api/

# Generates the typescript API binding
(cd frontend && npm run generate-client)
