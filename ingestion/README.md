
# C-Elegans Utility CLI Tool

The C-Elegans Utility CLI Tool supports the C-Elegans application by allowing users to extract segmentation data from their datasets and upload it into the deployment environment.

- [C-Elegans Utility CLI Tool](#c-elegans-utility-cli-tool)
  - [Installation](#installation)
    - [Using Private Access Token (PAT)](#using-private-access-token-pat)
    - [Using SSH](#using-ssh)
    - [From Source](#from-source)
    - [Verifying Installation](#verifying-installation)
  - [Usage](#usage)
    - [Uploading Datasets](#uploading-datasets)
      - [Authenticating with Google Cloud](#authenticating-with-google-cloud)
      - [Ingesting Files](#ingesting-files)
    - [Ingesting Segmentations](#ingesting-segmentations)
      - [Extract segmentations from bitmap Files](#extract-segmentations-from-bitmap-files)
      - [Ingest the Segmentations](#ingest-the-segmentations)
      - [Synapse coordinate conversion script](#synapse-coordinate-conversion-script)
  - [FAQ](#faq)
    - [What should be the file names and directory structure for the files I want to upload](#what-should-be-the-file-names-and-directory-structure-for-the-files-i-want-to-upload)
    - [Re-upload new version of the Dataset or related data](#re-upload-new-version-of-the-dataset-or-related-data)
  - [Development](#development)
    - [Setting up the Development Environment](#setting-up-the-development-environment)
    - [Running and Modifying the CLI Tool](#running-and-modifying-the-cli-tool)
    - [Pre-Commit Checklist](#pre-commit-checklist)

## Installation

To install the C-Elegans CLI tool you have 3 options:

1. [Using Private Access Token (PAT)](#using-private-access-token-pat)
2. [Using SSH](#using-ssh)
3. [From Source](#from-source)

### Using Private Access Token (PAT)

If you have been provided with a GitHub access token, you can install the tool by running the following command:

```bash
pip install "git+https://github.com/MetaCell/c-elegans-app.git@develop#egg=ingestion&subdirectory=ingestion"
```

The access token will be prompted as the password during installation.

### Using SSH

If you prefer using SSH for installation, ensure you have set up an SSH key on your computer. You can find the setup instructions in the GitHub documentation here: [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

Once your SSH key is set up, install the CLI tool by running:

```bash
pip install "git+ssh://git@github.com/MetaCell/c-elegans-app.git@develop#egg=ingestion&subdirectory=ingestion"
```

### From Source

If you'd like to install the CLI from the source code, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/MetaCell/c-elegans-app.git
   ```

2. Navigate to the `ingestion` directory:

   ```bash
   cd c-elegans-app/ingestion
   ```

3. Install the tool:

   ```bash
   pip install .
   ```

### Verifying Installation

To ensure the CLI tool is installed correctly, run the following command, e.g.:

```bash
celegans --help
```

This will display the help menu and available commands.

## Usage

You can view command usage by adding the `--help` flag to any subcommand.

> [!NOTE]
> If at anytime, you are unsure of what the command will do, you can pass the `--dry-run` flag. Instead of executing the command, the dry run will instead describe what it would do. With this you can validate beforehand that's actually what you want to execute.

### Uploading Datasets

Every piece of data you ingest in to C-Elegans is related to a dataset.
The datasets are a set of structured json files describing how neurons relate to each other:

```
.
├── annotations
│   ├── complete.annotations.json
│   └── head.annotations.json
├── connections
│   ├── <dataset_id>.json
│   ...
├── synapses
│   ├── <dataset_id>.json
|   ...
├── datasets.json
├── neurons.json
└── trajectories
    ├── <dataset_id>.json
    ...
```

To upload a dataset and its related files, such as 3D neuron models, EM tile images and segmentations, use the `ingest` subcommand.

The root to the datasets must be provided to the `ingest` subcommand, so we can properly validate that everything is correct and within the specification of the [ingestion format](format-ingestion.md).
All datasets have an unique identifier that must be specified throughout the ingestion (using the `--id` flag).

So, for every data you want to ingest, you will specify the path to the datasets and the ID of the dataset related to the files you are uploading, e.g:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 ...
```

> [!NOTE]
> The datasets files will be uploaded with the other files only if they have never been previously uploaded. To force a re-upload of files you can specify the `--overwrite` flag.

#### Authenticating with Google Cloud

You'll need a set of credentials with appropriate IAM permissions to upload files to the Google Cloud Bucket. These credentials should have been provided to you. Handle them carefully and share them securely.

While you can specify the location of this file every time you run an ingestion command, it’s more convenient to export the `GOOGLE_APPLICATION_CREDENTIALS` environment variable for automatic usage.

#### Ingesting Files

To upload dataset files such as 3D neuron models, EM tile images and segmentations, use the `ingest add-dataset` subcommand.

> [!WARNING]
> Ensure that your files and directories adhere to the formatting guidelines outlined in the [ingestion format specification](format-ingestion.md). We validate this, so no issues should raise if by mistake you ingest these files.

When using the `add-dataset` subcommand, don't forget to specify the dataset ID corresponding to the files you're uploading (we will remember you otherwise).
The following flags help determine which files to upload:

- `-seg`/`--segmentation`: Path to the directory or files containing neuron segmentation data.
- `-3`/`--3d`: Path to the directory or files containing 3D neuron models and 3D synapse models.
- `-e`/`--em`: Path to the directory or files containing EM tile images.
- `-syn`/`--synapses`: Path to the directory or files containin synapses segmentation data.

You can specify one, two, or all flags.

For example, to upload 3D neuron models from `/path/to/3d/models` for the dataset `witvliet_2020_2`, use the following command:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 --3d /path/to/3d/models
```

This command will also try to detect all the 3D synapse models that could be located under `/path/to/3d/models/synapses` and will also check for a conversion script if there is one. If the conversion script exists, the tool will automatically run it to convert the coordinates or data as required before uploading.

You can upload multiple datasets by chaining `add-dataset` commands. For example, to upload 3D neuron models for `witvliet_2020_2` and EM images for `witvliet_2020_3`, use this command:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 --3d /path/to/3d/models add-dataset --id witvliet_2020_3 --em /path/to/em/images
```

> [!NOTE]
> To explore other flags for the `ingest` subcommand, run `celegans ingest --help` and `celegans ingest add-dataset --help`.

### Ingesting Segmentations

To ingest segmentations in to C-Elegans you need to take an extra step:

1. [Extract segmentations from the bitmap files](#extracting-segmentation-from-bitmap-files)
2. [Ingest these segmentation into the C-Elegans cloud deployment](#ingesting-files)

**This is valid for either neuron segmentations and synapses segmentations.**

#### Extract segmentations from bitmap Files

To extract the segmentation files from the bitmap files you will need a metadata file. This file contains information describing how the neurons or synapses can be identified in these bitmap file.

So assuming your bitmap images are located at `/path/to/bitmap/files` and your metadata file is at `/path/to/metadata/the_metadata.txt`, run the following command to extract the segmentations data:

```bash
celegans extract -i /path/to/bitmap/files -l /path/to/metadata/the_metadata.txt
```

**The segmentation will be saved in the same directory as your bitmap files.**
This process may take a significant amount of time, depending on the number of files and the computational power of your system.

> [!NOTE]
> To view additional flags for the `extract` subcommand, run `celegans extract --help`.

#### Ingest the Segmentations

In same manner as described in [Ingest Files](#ingesting-files) section, you can upload the segmentation you just created by running:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 -seg /path/to/bitmap/files
```

1. Substituting the `--id` for your dataset ID
2. Using the correct flag for either neuron segmentations (`-seg` or `--segmentation`) or the synapses segmentations (`-syn` or `--synapses`)
3. Pointing to the segmentation output directory, which is the same as the bitmap files directory.

#### Synapse coordinate conversion script

The synapse coordinate conversion script is searched in the 3D synapse model folder. It has to be named `convert.py` and has to contain at least one function named `convert` with this signature `convert(f: Path, mesh: trimesh.Geometry, bbox_center: ndarray) -> ndarray`.

Here is an example of conversion script

```python
from pathlib import Path
from numpy import ndarray
import trimesh


def convert(f: Path, mesh: trimesh.Geometry, bbox_center: ndarray) -> ndarray:
   center = -bbox_center
   center[0], center[1] = center[1] * 2, center[0] * 2
   return center
```

## FAQ

### What should be the file names and directory structure for the files I want to upload

You can find the specification for those in the [ingestion format specification](format-ingestion.md).
The specification was design around your specific data, so out of the box it is expected to be in accordance to the specification.

Our suggestion would be to manage and store your files as follows:

```console
.
├── dataset-metadata
│   ├── annotations
│   │   ├── complete.annotations.json
│   │   └── head.annotations.json
│   ├── connections
│   │   ├── <dataset_id>.json
│   │   ...
│   ├── datasets.json
│   ├── neurons.json
│   └── trajectories
│       ├── <dataset_id>.json
│       ...
├── dataset-1
│   ├── 3d
│   │   ├── nervering.stl
│   │   ├── ADAL.stl
│   │   ├── ADAR.stl
│   │   ├── ADEL.stl
│   │   │   ...
|   |   ├── synapses
|   |   |   ├── convert.py  # [optional] coordinate script conversion
|   |   |   ├── _0001_ADAL_synapses.ADAL_AVBL,AVBR,RIML_8414886-SEM_adult.stl  # or .obj
|   |   |   ├── _0002_ADAL_synapses.ADAL_AVBL,AVJL,AVBR_8414874-SEM_adult.stl
|   |   |   ├── ...
│   ├── em
│   │   ├── ...
│   │   ├── 13
│   │   │   ├── 0_0_5.jpg
│   │   │   ├── 0_1_4.jpg
│   │   │   ├── 0_1_5.jpg
│   │   │   ...
│   │   ├── ...
│   │   ...
│   ├── segmentations
│   │   ├── s000.json
│   │   ├── Dataset8_seg...127.vsseg_export_s000.png
│   │   ├── s001.json
│   │   ├── Dataset8_seg...127.vsseg_export_s001.png
│   │   └── ...
│   └── synapses
│       └── segmentations
│           ├── s000.json
│           ├── Dataset8_synapses__s000.png
│           ├── s001.json
│           ├── Dataset8_synapses__s001.png
│           └── ...
├── dataset-2
├── dataset-3
...
```

Where `dataset-metadata` is directory containing the datasets set of structured json files.

> [!WARNING]
> The synapses 3D files name **have to** follow this format: `[something].[pre-post]_[catmaid-id]([postfix]?).{stl|obj}`, otherwise, we cannot extract the catmaid id and map the positions that we find to the real synapse.


### Re-upload new version of the Dataset or related data

You can simply upload the files as previously described with the `--overwrite` flag.
We will check if the files have changed and upload them accordingly, removing old data and uploading new data.

> [!WARNING]
> We check if the files have changed by its content and **NOT** by its name. So we assume that a new version of a file has the **same** name and different content.

## Development

To start development on the CLI tool, it's recommended to use a virtual environment to keep your Python environment isolated and clean. You can use Conda or any virtual environment manager of your choice.

### Setting up the Development Environment

1. Create and activate a virtual environment:

   ```bash
   conda create --name celegans-cli python=3.10
   conda activate celegans-cli
   ```

   Or using `venv`:

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install the project dependencies along with the development packages by running:

   ```bash
   pip install -e ".[dev]"
   ```

### Running and Modifying the CLI Tool

You should now be able to run the CLI tool locally. You can make changes to the tool's source code, and these changes will be reflected when you run the tool via the entry point script.

### Pre-Commit Checklist

Before committing and pushing your code changes to the remote repository, follow these steps:

1. **Code Formatting**: Ensure your code is properly formatted by running the code formatter:

   ```bash
   isort . && black .
   ```

2. **Run Unit Tests**: Execute the unit tests to ensure your changes do not break the tool:

   ```bash
   pytest
   ```
