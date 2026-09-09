"""
Top-level entrypoint for service runners and serverless platforms.
Re-exports the FastAPI instance from app.main.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

__all__ = ["app"]
