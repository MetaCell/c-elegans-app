#!/usr/bin/env bash

OPENAPI_JSON="openapi.json"
OPENAPI_YAML="openapi.yaml"
OPENAPI_FOLDER="openapi/${OPENAPI_JSON}"

# Trick to have folder relative to the script, not CWD
PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "${PARENT_PATH}"

function json2yaml {
  python -c 'import sys, yaml, json; print(yaml.dump(json.loads(sys.stdin.read())))'
}

# Generates the openAPI specification
(cd backend && DJANGO_EXTRA_APPS="ninja" python manage.py export_openapi_schema --output "${OPENAPI_FOLDER}" --indent 2)
cp backend/"${OPENAPI_FOLDER}" api/
cat api/"${OPENAPI_JSON}" | json2yaml > api/"${OPENAPI_YAML}"

# Generates the typescript API binding
(cd frontend && npm run generate-client)
