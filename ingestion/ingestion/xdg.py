from __future__ import annotations

import os
from pathlib import Path


def _path_from_env(var: str, default: Path) -> Path:
    if (value := os.environ.get(var)) and (path := Path(value)).is_absolute():
        return path
    return default


def xdg_config_home() -> Path:
    return _path_from_env("XDG_CONFIG_HOME", Path.home() / ".config")


def xdg_gcloud_config() -> Path:
    return xdg_config_home() / "gcloud"
