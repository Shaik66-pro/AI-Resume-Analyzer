import os
import sys

backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, os.path.abspath(os.path.join(backend_path, "..")))

from app import app

handler = app
