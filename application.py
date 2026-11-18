import os
import sys

# Ensure backend directory is in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Elastic Beanstalk looks for a callable named 'application' by default
from app import app as application

if __name__ == "__main__":
    application.run(port=5000)
