from __future__ import annotations

import logging
import platform

from colorama import Fore, Style, just_fix_windows_console

if platform.system() == "Windows":  # fix ansi on windows
    just_fix_windows_console()


class LogFormatter(logging.Formatter):
    _debug: bool = False

    _format = "%(message)s"
    _format_debug = (
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
    )

    FORMATS = {
        logging.DEBUG: Fore.BLACK + _format + Fore.RESET,
        logging.INFO: Fore.CYAN + _format + Fore.RESET,
        logging.WARNING: Fore.YELLOW + "warning: " + _format + Fore.RESET,
        logging.ERROR: Fore.RED + "error: " + _format + Fore.RESET,
        logging.CRITICAL: Fore.RED
        + Style.BRIGHT
        + "critial error: "
        + _format
        + Style.RESET_ALL,
    }

    FORMATS_DEBUG = {
        logging.DEBUG: Fore.BLACK + _format_debug + Fore.RESET,
        logging.INFO: Fore.GREEN + _format_debug + Fore.RESET,
        logging.WARNING: Fore.YELLOW + _format_debug + Fore.RESET,
        logging.ERROR: Fore.RED + _format_debug + Fore.RESET,
        logging.CRITICAL: Fore.RED + Style.BRIGHT + _format_debug + Style.RESET_ALL,
    }

    def set_debug(self, enable: bool):
        self._debug = enable

    def format(self, record):
        if self._debug:
            log_fmt = self.FORMATS_DEBUG.get(record.levelno)
        else:
            log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)


def setup_logger(debug: bool = False):
    handler = logging.StreamHandler()

    formatter = LogFormatter()
    formatter.set_debug(debug)
    handler.setFormatter(formatter)

    level = logging.INFO
    if debug:
        level = logging.DEBUG
    logging.basicConfig(level=level, handlers=[handler])
