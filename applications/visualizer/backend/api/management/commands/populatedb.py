from django.core.management.base import BaseCommand, CommandError
from pathlib import Path
from api.populatedb import populate_functions


class Command(BaseCommand):
    help = "Transform data from raw-directory and populate DB"

    def add_arguments(self, parser):
        parser.add_argument("raw_folder", type=str)

    def handle(self, *args, **options):
        folder = Path(options["raw_folder"])
        if not folder.exists():
            raise CommandError(f"Folder {folder} does not exist")

        for func in populate_functions:
            func(folder,
                 lambda *args, **kwargs: self.stdout.write(*args, **kwargs),
                 lambda *args, **kwargs: self.stdout.write(self.style.SUCCESS(*args, **kwargs)))