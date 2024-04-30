#!/usr/bin/env bash

# Trick to have folder relative to the script, not CWD
PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "${PARENT_PATH}"


case "$1" in
    "compose")
      ENV="visualizer"
      echo "In postgresql db"
      ;;
    *)
      echo "In local sqlite3 db"
    ;;
esac

CH_CURRENT_APP_NAME=${ENV} python manage.py migrate
CH_CURRENT_APP_NAME=${ENV} python manage.py populatedb ../../../raw-data/
