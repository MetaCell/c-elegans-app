import os
from .common import *


is_production = os.environ.get('PRODUCTION', False)


if is_production:
    if CURRENT_APP_NAME:
        from .production import *
else:
    from .development import *