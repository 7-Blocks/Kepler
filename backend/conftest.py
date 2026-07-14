"""Pytest configuration: ensure the backend package root is importable."""
import os
import sys

# Add the backend directory (this file's parent) to sys.path so that
# top-level packages (app, api, schemas, services, ...) can be imported
# regardless of the directory pytest is invoked from.
_BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)