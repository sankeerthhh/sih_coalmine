"""
Top-level entrypoint for service runners and serverless platforms.
Re-exports the FastAPI instance from app.main.
"""
from app.main import app

__all__ = ["app"]
