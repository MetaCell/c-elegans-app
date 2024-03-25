from django.test import TestCase
from ninja.testing import TestAsyncClient
from api.api import api


class HelloTest(TestCase):
    async def test_hello(self):
        client = TestAsyncClient(api.default_router)
        response = await client.get("/download-connectivity", datasetId="white_1986_jsh")

        self.assertEqual(response.status_code, 200)
        # self.assertEqual(response.json(), {"msg": "Hello World"})