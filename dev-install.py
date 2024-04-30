from subprocess import run
from pathlib import Path
import sys

HERE = Path(__file__).resolve()
APP_FOLDER = Path("applications") / "celegans"


# Helper for easily creating command
# (easy version, complete version has pipe support)
class Command(object):
    def __init__(self, exec=None, parent_cmd=None):
        self.exec = exec
        self.parent_cmd = parent_cmd
        self.args = []

    def __getattr__(self, name):
        return Command(name, parent_cmd=self)

    def _build_command(self):
        final_cmd = []
        current = self
        while current and current is not sh:
            final_cmd.extend(current.args[::-1])
            final_cmd.append(current.exec)
            current = current.parent_cmd
        return final_cmd[::-1]

    def __call__(self, *args, stdin=None, capture_output=False):
        final_cmd = self._build_command()
        final_cmd.extend(args)
        return run(final_cmd, capture_output=capture_output, check=True, input=stdin)

    def __getitem__(self, keys):
        if isinstance(keys, tuple):
            self.args.extend(keys)
        else:
            self.args.append(keys)
        return self


sh = Command()


def in_venv():
    return f"{Path(sys.executable).parent}" not in ["/usr/bin", "/usr/local/bin"]


def check_venv_activate():
    if not in_venv():
        print(
            "You are not in a virtualenv, please initialise and activate a python 3.11 venv before running this script"
        )
        sys.exit(1)


def install_cloud_harness():
    if not Path("cloud-harness").exists():
        print(
            "Cloning cloud-harness branch CH-100 (experimental docker compose support)"
        )
        sh.git.clone(
            "--single-branch",
            "--branch",
            "feature/CH-100",
            "https://github.com/MetaCell/cloud-harness.git",
        )

    print("Installing cloud-harness")
    sh.bash("cloud-harness/install.sh")


# fmt: off
def generate_local_dev_deployment():
    sh("harness-deployment",
       "cloud-harness", ".",
       "-l",
       "-d", "local",
       "-dtls",
       "-n", "celegans",
       "-e", "dev",
       "-i", "celegans",
       "--docker-compose"
    )


def generate_k8_dev_deployment():
    sh("harness-deployment",
       "cloud-harness", ".",
       "-n", "celegans",
       "-e", "dev",
       "-i", "celegans",
    )



def generate_k8_prod_deployment():
    sh("harness-deployment",
       "cloud-harness", ".",
       "-n", "celegans",
       "-e", "prod",
       "-i", "celegans",
    )
# fmt: on


def install_backend_dependencies():
    sh.pip.install("-r", APP_FOLDER / "backend" / "requirements.txt")
    sh.pip.install("-r", APP_FOLDER / "backend" / "requirements-dev.txt")


def install_frontend_dependencies():
    sh.yarn("--cwd", APP_FOLDER / "frontend", "install")


if __name__ == "__main__":
    check_venv_activate()
    install_cloud_harness()
    # generate_k8_dev_deployment()
    # generate_k8_prod_deployment()
    generate_local_dev_deployment()

    install_backend_dependencies()
    install_frontend_dependencies()
