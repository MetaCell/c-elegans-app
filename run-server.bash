#!/usr/bin/env bash

SERVER_FOLDER="applications/visualizer/backend"
cd "${SERVER_FOLDER}"

uvicorn visualizer.asgi:application --reload