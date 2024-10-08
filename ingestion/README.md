# C-Elegans Utility CLI Tool

## Installation

Currently you can only install from source.
This should change in the future as soon as the CLI is ready for user testing.

Clone the repository and `cd` in to the `ingestion` directory.
Be sure to setup a virtual environment if that is you intention.
Then run:

```console
pip install .
```

You should now have the CLI available to run. Try it out by running:

```console
celegans --help
```

## Usage

```TODO```

## Development

Setup a virtual environment with conda or equivalent so you have a clean python to work with.
To install the project dependencies and development packages, run:

```console
pip install -e ".[dev]"
```

You should now be able to run the CLI, make changes to it and see it reflected in the script entrypoint output.

Before pushing any code to the remote repository, be sure to run the code formater and unit tests.
