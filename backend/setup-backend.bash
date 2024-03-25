#!/usr/bin/env bash

echo "Setup the backend for the first time"

python manage.py migrate
python manage.py makemigrations api
python manage.py migrate api