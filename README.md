# C Elegans App

This application is visualizer for various C Elegans brain map datasets, with multi-viewer support for easy comparison.

## Development Setup

The dev environment relies on Python 3.11 and Node >= 18.0.
For "in situ" tests, this project uses Docker and Docker Compose.
If you don't want to test the app deployed with Docker Composer, you don't need to install it.

### Setup your environment

First, create a virtual environment for Python 3.11 using conda, mamba, micromamba or pyenv, and activate it.

Using conda:

```bash
conda create --name celegans python=3.11
conda activate celegans
```

Using mamba/micromamba (example with micromamba):

```bash
micromamba create -n celegans python=3.11  -c conda-forge
micromamba activate celegans
```

Using pyenv:

```bash
pyenv install 3.11
pyenv virtualenv 3.11 celegans
pyenv activate celegans
```

Once your virtualenv is activated, run the `dev-install.py` script.
This script will:

1. clone cloud-harness,
2. install cloud-harness from the right experimental branch,
3. generate the deployment scripts in `deployment`,
4. install the backend dependencies and backend dev dependencies,
5. install the frontend dependencies.

```bash
python dev-install.py
```

## Run the Application in Dev Mode

To start the full application in dev mode, you need to run in one terminal the server, and in another one the frontend.

Start the server this way:

```bash
bash run-server.bash
```

To see if everything is working well, go to [the API generated doc](http://localhost:8000/api/docs)

Then, once the server is started, start the client this way:

```bash
bash run-frontend.bash
```

To see if everything is working well, go to [localhost:9000](http://localhost:9000)


## Run the Application in Docker Compose

To run the application in Docker Compose, you need first to build the Docker images using Skaffold, then you need to start docker compose using the configuration file `development/docker-compose.yaml`.

```bash
# From the root of the project
skaffold build
docker compose -f deployment/docker-compose.yaml up
```

Then add `visualizer.celegans.local` for `127.0.0.1` in your `/etc/hosts`, and navigate with your browser to [http://visualizer.celegans.local](http://visualizer.celegans.local).


## Populate the DB

By default, the DB is not populated and is empty.
There is two modes, either you can populate the dev DB, which is basically a sqlite3 file that will be produced, or you can populate the DB of your docker compose instance.

### Populate the Dev DB

Run the following script that will take all the data from `data/db-raw-data`, process them and insert them in the sqlite3 db.

```
bash applications/visualizer/backend/populate-db.bash
```

This command will apply the necessary migrations to the file db and populate it.

### Populate the Docker Compose DB

First, you need to have your docker compose services running (ensure you are running the `docker compose -f deployment/docker-compose.yaml up` command).
Then, run the following script that will take all the data from `data/db-raw-data`, process them and insert them in the postgresql db

```
bash applications/visualizer/backend/populate-db.bash compose
```

This command will apply the necessary migrations to the postgresql db and populate it.


### Backend Development Notes

If the API signature changes (endpoints signature changes, new endpoints, new exceptions, pagination, ...), the code of the REST client must be generated again.
The generation relies on the fact that the server can be launched properly (in a way), so be sure you have all that you need to run the backend in local (no need to have docker compose setup for this).
Run the following script:

```bash
bash applications/visualizer/generate-binding.bash
```

This will trigger the `openapi.json` file generation from the backend and the generation of the frontend REST API client.