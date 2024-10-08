
# C-Elegans Utility CLI Tool

The C-Elegans Utility CLI Tool supports the C-Elegans application by allowing users to extract segmentation data from their datasets and upload it into the deployment environment.

## Installation

### 1. Using Private Access Token (PAT)

If you have been provided with a GitHub access token, you can install the tool by running the following command:

```bash
pip install "git+https://github.com/MetaCell/c-elegans-app.git@feature/CELE-78#egg=ingestion&subdirectory=ingestion"
```

The access token will be prompted as the password during installation.

### 2. Using SSH

If you prefer using SSH for installation, ensure you have set up an SSH key on your computer. You can find the setup instructions in the GitHub documentation here: [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

Once your SSH key is set up, install the CLI tool by running:

```bash
pip install "git+ssh://git@github.com/MetaCell/c-elegans-app.git@feature/CELE-78#egg=ingestion&subdirectory=ingestion"
```

### 3. From Source

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

To ensure the CLI tool is installed correctly, run the following command:

```bash
celegans --help
```

This will display the help menu and available commands.

## Usage

You can view command usage by adding the `--help` flag to any subcommand.

### Extracting Segmentation from Bitmap Files

Assuming your bitmap images are located at `/path/to/bitmap/files` and your metadata file is at `/path/to/metadata/SEM_adult_metadata.txt`, run the following command to extract segmentation data:

```bash
celegans extract -i /path/to/bitmap/files -l /path/to/metadata/SEM_adult_metadata.txt
```

Note that the process may take a significant amount of time, depending on the number of files and the computational power of your system.

> [!NOTE]  
> To view additional flags for the `extract` subcommand, run `celegans extract --help`.

### Uploading Datasets

To upload dataset files such as 3D neuron models, EM tile images, and dataset information, use the `ingest` subcommand.

#### Authenticating with Google Cloud

You'll need a set of credentials with appropriate IAM permissions to upload files to the Google Cloud Bucket. These credentials should have been provided to you. Handle them carefully and share them securely.

While you can specify the location of this file every time you run an ingestion command, it’s more convenient to export the `GOOGLE_APPLICATION_CREDENTIALS` environment variable for automatic usage.

#### Ingesting Files

To begin uploading files, use the `add-dataset` subcommand.

> [!WARNING]  
> Ensure that your files and directories adhere to the formatting guidelines outlined in the `format-ingestion.md` specification.

For ingestion, you need to specify the `--data` flag, which indicates the base folder containing JSON files about neurons, datasets, and connectivity that will be ingested into the database.

> [!NOTE]  
> To explore other flags for the `ingest` subcommand, run `celegans ingest --help` and `celegans ingest add-dataset --help`.

When using the `add-dataset` subcommand, you'll need to specify the dataset ID corresponding to the files you're uploading.
The following flags help determine which files to upload:

- `-s`/`--segmentation`: Path to the directory or files containing segmentation JSON data.
- `-3`/`--3d`: Path to the directory or files containing 3D neuron models.
- `-e`/`--em`: Path to the directory or files containing EM tile images.

You can specify one, two, or all three flags.

For example, to upload 3D neuron models from `/path/to/3d/models` for the dataset `witvliet_2020_2`, use the following command:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 --3d /path/to/3d/models
```

You can upload multiple datasets by chaining `add-dataset` commands. For example, to upload 3D neuron models for `witvliet_2020_2` and EM images for `witvliet_2020_3`, use this command:

```bash
celegans ingest --data /path/to/data/db-raw-data add-dataset --id witvliet_2020_2 --3d /path/to/3d/models add-dataset --id witvliet_2020_3 --em /path/to/em/images
```


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
