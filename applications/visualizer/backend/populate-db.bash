#!/usr/bin/env bash

# Trick to have folder relative to the script, not CWD
PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "${PARENT_PATH}"


case "$1" in
    "compose")
      ENV="visualizer"
      DB_DATA="../../../data/db-raw-data/"
      echo "In postgresql db in docker compose"
      ;;
    "k8s")
      ENV="visualizer"
      # Need copy using gsutil if we keep this script to trigger DB ingestion
      DB_DATA="/mnt/data/db-raw-data/"
      echo "In postgresql db in k8s"
      ;;
    *)
      DB_DATA="../../../data/db-raw-data/"
      echo "In local sqlite3 db"
    ;;
esac

CH_CURRENT_APP_NAME=${ENV} python manage.py migrate
CH_CURRENT_APP_NAME=${ENV} python manage.py populatedb ${DB_DATA}
