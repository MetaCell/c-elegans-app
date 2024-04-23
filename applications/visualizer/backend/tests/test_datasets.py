from ninja.testing import TestAsyncClient
import pytest
from model_bakery import baker


from api.api import api as celegans_api
from api.models import Dataset


# Some test data
datasets = [
    {
        "id": "ds1",
        "name": "Dataset 1",
    },
    {
        "id": "gg",
        "name": "Gamma Goblin",
    },
    {
        "id": "ds3",
        "name": "Dr. Seuss",
    },
]


# Setup the db for this module with some data
# @pytest.fixture(scope="module")
# def django_db_setup(django_db_setup, django_db_blocker):
#     with django_db_blocker.unblock():
#         for dataset in datasets:
#             Dataset.objects.create(**dataset)


# Setup the db for this module with some data
# Data are baked with "baker", it allows to create dummy values automatically
# and also to specify some fields. It is used here to "fill" the fields which are
# marked as "non-null" in the model which we don't want to manually fill.
@pytest.fixture(scope="module")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        for dataset in datasets:
            baker.make(Dataset, **dataset)


# Fixture to access the test client in all test functions
@pytest.fixture
def api_client():
    client = TestAsyncClient(celegans_api.default_router)
    return client


# Test function
@pytest.mark.django_db  # required to access the DB
@pytest.mark.asyncio  # required as we access a async function
async def test__get_nonexisting_dataset(api_client):
    response = await api_client.get("/datasets/nonexisting")
    assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.asyncio
async def test__get_existing_dataset(api_client):
    response = await api_client.get("/datasets/ds3")
    assert response.status_code == 200

    dataset = response.json()
    assert dataset["id"] == "ds3"
    assert dataset["name"] == "Dr. Seuss"


@pytest.mark.django_db
@pytest.mark.asyncio
async def test__get_all_datasets(api_client):
    response = await api_client.get("/datasets")
    assert response.status_code == 200

    datasets = response.json()
    assert len(datasets) == 3

    datasets_id = [dataset["id"] for dataset in datasets]
    assert "ds1" in datasets_id
    assert "ds3" in datasets_id
    assert "gg" in datasets_id
