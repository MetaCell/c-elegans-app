# C-Elegans App

This is a first PoC using django-ninja for the CElegans project.
It includes the backend, the DB population (currently associated to django migration), and some of the routes of the original project.

## Backend

Setup of the backend (migration, ...)

```bash
# !!
# First create a VENV!
# !!
cd backend
pip install -r requirements.txt
pip install -r requirements-dev.txt
bash ./setup-backend.bash
```

Run the server

```bash
# in the "backend" folder
bash ./run-server.bash
```

To check if everything is running fine, navigate to http://127.0.0.1:8000/api/docs