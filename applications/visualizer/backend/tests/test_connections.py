from ninja.testing import TestAsyncClient
import pytest
from model_bakery import baker


from api.api import api as celegans_api
from api.models import Connection
from .utils import flat_dict, generate_instance


# Some test data
connections = [
    {"id": "1", "dataset": {"id": "ds3", "name": "Dr. Seuss"}},
]


@pytest.fixture(scope="module")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        generate_instance(Connection, connections)


@pytest.mark.django_db
def test__fk_creation():
    o = Connection.objects.get(id=1)

    assert o.dataset
    assert o.dataset.id == "ds3"
    assert o.dataset.name == "Dr. Seuss"
