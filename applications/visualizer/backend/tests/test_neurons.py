from ninja.testing import TestClient
import pytest
import warnings
from pytest_unordered import unordered

from api.models import (
    Neuron as NeuronModel,
    Connection as ConnectionModel,
)
from api.api import api as celegans_api
from .utils import generate_instance


# Some test data
neurons = [
    {
        "name": "ADAL",
        "nclass": "ADA",
        "neurotransmitter": "l",
        "type": "i",
    },
    {
        "name": "ADAR",
        "nclass": "ADA",
        "neurotransmitter": "l",
        "type": "i",
    },
    {
        "name": "ADEL",
        "nclass": "ADA",
        "neurotransmitter": "l",
        "type": "i",
    },
    {
        "name": "ADER",
        "nclass": "ADR",
        "neurotransmitter": "d",
        "type": "sn",
    },
    {
        "name": "ADFR",
        "nclass": "ADF",
        "neurotransmitter": "as",
        "type": "sn",
    },
    {
        "name": "AFDL",
        "nclass": "AFD",
        "neurotransmitter": "l",
        "type": "s",
    },
]

datasets = [
    {
        "id": "ds1",
        "name": "Dataset 1",
    },
    {
        "id": "ds2",
        "name": "Gamma Goblin",
    },
    {
        "id": "ds3",
        "name": "Dr. Seuss",
    },
]

connections = [
    {
        "dataset": datasets[0],
        "pre": "ADAL",
        "post": "ADAR",
    },
    {
        "dataset": datasets[1],
        "pre": "ADEL",
        "post": "ADER",
    },
    {
        "dataset": datasets[1],
        "pre": "ADAR",
        "post": "ADEL",
    },
    {
        "dataset": datasets[2],
        "pre": "ADFR",
        "post": "ADAR",
    },
]


# Setup the db for this module with some data
# Data are baked with "baker", it allows to create dummy values automatically
# and also to specify some fields. It is used here to "fill" the fields which are
# marked as "non-null" in the model which we don't want to manually fill.
@pytest.fixture(scope="module")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        generate_instance(NeuronModel, neurons)
        generate_instance(ConnectionModel, connections)


# Fixture to access the test client in all test functions
@pytest.fixture
def api_client():
    client = TestClient(celegans_api.default_router)
    return client


@pytest.mark.django_db  # required to access the DB
def test__get_all_cells(api_client):
    expected_dataset_ids = {
        "ADAL": ["ds1"],
        "ADAR": ["ds1", "ds2", "ds3"],
        "ADEL": ["ds2"],
        "ADER": ["ds2"],
        "ADFR": ["ds3"],
        "AFDL": [],
    }

    response = api_client.get("/cells")
    assert response.status_code == 200

    neurons = response.json()["items"]
    assert len(neurons) == len(expected_dataset_ids)

    for neuron in neurons:
        name = neuron["name"]

        if name not in expected_dataset_ids:
            warnings.warn(
                f"please, update test: neuron '{name}' not found in expected dataset ids"
            )
            continue

        assert expected_dataset_ids[name] == unordered(neuron["datasetIds"])


@pytest.mark.django_db  # required to access the DB
def test__get_all_cells_from_specific_datasets(api_client):
    dataset_ids = ["ds1", "ds2"]
    expected_dataset_ids = {
        "ADAL": ["ds1"],
        "ADAR": ["ds1", "ds2", "ds3"],  # ds3 should be present!
        "ADEL": ["ds2"],
        "ADER": ["ds2"],
        # "ADFR": ["ds3"], not part of ds1 or ds2
        # "AFDL": [], not part of ds1 or ds2
    }

    query_params = "?" + "&".join([f"dataset_ids={ds}" for ds in dataset_ids])
    response = api_client.get("/cells" + query_params)
    assert response.status_code == 200

    neurons = response.json()["items"]

    assert len(neurons) == len(expected_dataset_ids)

    for neuron in neurons:
        name = neuron["name"]

        assert name in expected_dataset_ids, f"unexpected neuron result: {neuron}"
        assert expected_dataset_ids[name] == unordered(neuron["datasetIds"])


@pytest.mark.django_db  # required to access the DB
def test__search_cells(api_client):
    search_query = "ada"
    expected_neurons_names = ["ADAL", "ADAR"]

    response = api_client.get(f"/cells/search?name={search_query}")
    assert response.status_code == 200

    neurons = response.json()
    assert len(neurons) == len(
        expected_neurons_names
    ), f"expected to query {len(expected_neurons_names)} and got {len(neurons)}"

    assert [n["name"] for n in neurons] == expected_neurons_names


@pytest.mark.django_db  # required to access the DB
def test__search_cells_in_datasets_without_match(api_client):
    search_query = "ade"
    dataset_ids = ["ds1", "ds3"]

    # Search dataset that do not contain a match
    query_params = f"?name={search_query}&" + "&".join(
        [f"dataset_ids={ds}" for ds in dataset_ids]
    )
    response = api_client.get(f"/cells/search" + query_params)
    assert response.status_code == 200

    neurons = response.json()
    assert len(neurons) == 0, f"expected datasets to not contain search matches"


@pytest.mark.django_db  # required to access the DB
def test__search_cells_in_datasets_with_match(api_client):
    dataset_ids = ["ds1", "ds3", "ds2"]
    search_query = "ade"

    # Search dataset with matching neurons
    expected_neurons_names = ["ADEL", "ADER"]

    query_params = f"?name={search_query}&" + "&".join(
        [f"dataset_ids={ds}" for ds in dataset_ids]
    )

    response = api_client.get(f"/cells/search" + query_params)
    assert response.status_code == 200

    neurons = response.json()
    assert len(neurons) == len(expected_neurons_names)

    assert [n["name"] for n in neurons] == expected_neurons_names
