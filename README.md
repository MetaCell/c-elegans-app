# C Elegans App

This application is visualizer for various C Elegans brain map datasets, with multi-viewer support for easy comparison.

## Development Setup

The dev enviroment relies on Python 3.11 and Node >= 18.0.
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

To run the application in Docker Compose, you need first to build the Docker images using Skaffold, then you need to go in the `deployment` folder and start docker compose from there.

```bash
# From the root of the project
skaffold build
cd deployment
docker compose up
```

Then add `visualizer.celegans.local` for `127.0.0.1` in your `/etc/hosts`, and navigate with your browser to [http://visualizer.celegans.local](http://visualizer.celegans.local).
