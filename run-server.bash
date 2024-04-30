#!/usr/bin/env bash

SERVER_FOLDER="applications/celegans/backend"
cd "${SERVER_FOLDER}"

uvicorn visualizer.asgi:application --reload