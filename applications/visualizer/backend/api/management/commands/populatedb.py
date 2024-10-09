from django.core.management.base import BaseCommand, CommandError
from pathlib import Path
from api.populatedb import populate_functions
from django.conf import settings


class Command(BaseCommand):
    help = "Transform data from raw-directory and populate DB"

    def handle(self, *args, **options):
        try:
            downloader = settings.RAW_DB_DATA_DOWNLOADER()
            folder = downloader.pull_files()
        except Exception as e:
            raise CommandError(
                f'An error occured while pulling the files from the bucket or the local file system: "{e}"'
            )

        for func in populate_functions:
            func(
                folder,
                lambda *args, **kwargs: self.stdout.write(*args, **kwargs),
                lambda *args, **kwargs: self.stdout.write(
                    self.style.SUCCESS(*args, **kwargs)
                ),
            )
