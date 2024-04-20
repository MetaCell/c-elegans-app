import os
from .common import *


if CURRENT_APP_NAME:
    from .production import *
elif not IS_PRODUCTION:
    from .development import *