from django.test import TestCase
from .models import (
    Dataset as DatasetModel,
    Neuron as NeuronModel,
    Connection as ConnectionModel,
)
from django.db.models import Q, F, Value, CharField, Func, OuterRef, Subquery
from django.db.models.functions import Coalesce, Concat
from django.contrib.postgres.aggregates import StringAgg, ArrayAgg


# Create your tests here.


class BaseTestCase(TestCase):
    def setUp(self) -> None:
        self.ds1 = DatasetModel.objects.create(
            id="dataset1",
            collection="",
            name="Dataset 1",
            description="Dataset 1 from 1901",
            time=60,
            visual_time=50,
            type="complete",
            axes=None,
        )
        self.ds2 = DatasetModel.objects.create(
            id="dataset2",
            collection="",
            name="Dataset 2",
            description="Dataset 2 from 1902",
            time=40,
            visual_time=40,
            type="complete",
            axes=None,
        )
        self.ds3 = DatasetModel.objects.create(
            id="dataset3",
            collection="",
            name="Dataset 3",
            description="Dataset 3 from 1903",
            time=53.5,
            visual_time=53.5,
            type="complete",
            axes=[
                {"face": "right", "axisIndex": 2, "axisTransform": 1},
                {"face": "dorsal", "axisIndex": 1, "axisTransform": -1},
                {"face": "anterior", "axisIndex": 0, "axisTransform": 1},
            ],
        )

        self.nADAL = NeuronModel.objects.create(
            name="ADAL",
            nclass="ADA",
            neurotransmitter="l",
            type="i",
            embryonic=True,
            inhead=True,
            intail=False,
        )
        self.nADAR = NeuronModel.objects.create(
            name="ADAR",
            nclass="ADA",
            neurotransmitter="l",
            type="i",
            embryonic=True,
            inhead=True,
            intail=False,
        )
        self.nADEL = NeuronModel.objects.create(
            name="ADEL",
            nclass="ADA",
            neurotransmitter="l",
            type="i",
            embryonic=True,
            inhead=True,
            intail=False,
        )
        self.nADER = NeuronModel.objects.create(
            name="ADER",
            nclass="ADR",
            neurotransmitter="d",
            type="sn",
            embryonic=True,
            inhead=True,
            intail=False,
        )
        self.nADFR = NeuronModel.objects.create(
            name="ADFR",
            nclass="ADF",
            neurotransmitter="as",
            type="sn",
            embryonic=True,
            inhead=True,
            intail=False,
        )

        ConnectionModel.objects.create(
            id=1,
            dataset=self.ds1,
            pre=self.nADAL.name,
            post=self.nADAR.name,
            type="electrical",
            synapses=1
        )
        ConnectionModel.objects.create(
            id=2,
            dataset=self.ds2,
            pre=self.nADEL.name,
            post=self.nADER.name,
            type="electrical",
            synapses=2
        )
        ConnectionModel.objects.create(
            id=3,
            dataset=self.ds2,
            pre=self.nADAR.name,
            post=self.nADEL.name,
            type="electrical",
            synapses=1
        )
        ConnectionModel.objects.create(
            id=4,
            dataset=self.ds3,
            pre=self.nADFR.name,
            post=self.nADAR.name,
            type="electrical",
            synapses=1
        )

class GetAllCellsTestCase(BaseTestCase):
    def setUp(self) -> None:
        return super().setUp()

    def test_no_params(self):
        neurons = NeuronModel.objects.all()
        self.assertEquals(list(neurons), [
            self.nADAL,
            self.nADAR,
            self.nADEL,
            self.nADER,
            self.nADFR
        ])

    def test_filter_datasets(self) -> None:
        dataset_ids = [self.ds1.id, self.ds3.id]
        expected_neurons = [
            { "neuron": self.nADAL, "dataset_ids": [self.ds1.id] },
            { "neuron": self.nADAR, "dataset_ids": [self.ds1.id, self.ds3.id] },
            { "neuron": self.nADFR, "dataset_ids": [self.ds3.id] }
        ]

        neurons = NeuronModel.objects.filter(
            Q(name__in=ConnectionModel.objects.filter(dataset__id__in=dataset_ids).values_list("pre", flat=True))
            | Q (name__in=ConnectionModel.objects.filter(dataset__id__in=dataset_ids).values_list("post", flat=True))
        ).annotate(
            datasets_pre=Subquery(ConnectionModel.objects.filter(pre=F("pre")).values_list("dataset_id", flat=True)),
            datasets_post=Subquery(ConnectionModel.objects.filter(post=F("post")).values_list("dataset_id", flat=True)),
        )

        a = ConnectionModel.objects.filter(pre="ADAR").values_list("dataset_id", flat=True)
        b = ConnectionModel.objects.filter(post="ADAR").values_list("dataset_id", flat=True)

        print("datasets for ADAR:")
        print(a)
        print(b)

        for neuron in list(neurons):
            print(f"{neuron.name=}, {neuron.datasets_pre=}, {neuron.datasets_post=}, neuron.concatenated_datasets=")
