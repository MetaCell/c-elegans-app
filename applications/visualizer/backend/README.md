# Django-ninja backend

## Overview

The backend is based on [django-ninja](https://django-ninja.dev/), which allows one to have django interfaced with a kind of fastAPI.
The structure of the backend part is the following (only the important files are highlighted)

```bash
backend
├── api
│   ├── api.py                  # defines the different "routes" and behaviors
│   ├── management
│   │   └── commands
│   │       └── populatedb.py   # the custom command to run the DB population
│   ├── models.py               # the Django model (DB model)
│   ├── populatedb.py           # dedicated function to take the raw-data and create the django entities
│   └── schemas.py              # the django-ninja Schemas
├── openapi
│   └── openapi.json         # The openapi.json generated from the routes defined in "api.py"
├── populate-db.bash         # the script to populate the DB
└── visualizer
    ├── asgi.py
    ├── models.py
    ├── settings             # backend settings
    │   ├── common.py        # common settings (to dev and prod)
    │   ├── development.py   # development settings
    │   └── production.py    # production settings
    ├── urls.py              # urls to which django will answer
    └── views.py             # special view to serve the "index.html"
```

## Easily test new django queries

To help in developing django queries, when in "development" mode, the `django-extension` library is added.
This allows you to launch a shell automatically configured with the django models of the project and with various imports.
To launch the shell:

```bash
# from inside the "backend" folder
python manage.py shell_plus
```

If you also want to see the SQL commands that are sent to the DB, you can start the shell this way:

```bash
# from inside the "backend" folder
python manage.py shell_plus --print-sql
```