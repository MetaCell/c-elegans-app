import os
from .common import *


is_production = os.environ.get('PRODUCTION', False)

if is_production:
    from .production import *
else:
    from .development import *