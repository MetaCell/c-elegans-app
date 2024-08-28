from __future__ import annotations

import os
from pathlib import Path


def _path_from_env(var: str, default: Path) -> Path:
    if (value := os.environ.get(var)) and (path := Path(value)).is_absolute():
        return path
    return default


def xdg_config_home() -> Path:
    return _path_from_env("XDG_CONFIG_HOME", Path.home() / ".config")


def xdg_cache_home() -> Path:
    return _path_from_env("XDG_CACHE_HOME", Path.home() / ".cache")


def xdg_gcloud_config() -> Path:
    return xdg_config_home() / "gcloud"


def xdg_celegans_cache() -> Path:
    p = xdg_cache_home() / "celegans"
    p.mkdir(parents=True, exist_ok=True)
    return p
