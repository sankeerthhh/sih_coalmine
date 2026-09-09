import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("subsidence.database")

db_url = settings.DATABASE_URL.strip()
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# On serverless platforms like Vercel or AWS Lambda, the app root is read-only.
# If SQLite is configured or used as fallback, redirect it to the writable /tmp directory.
if not db_url.startswith("postgresql") and (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")):
    if "sqlite:///" in db_url and not db_url.startswith("sqlite:////tmp"):
        db_url = "sqlite:////tmp/mine_subsidence.db"

_is_postgres = db_url.startswith("postgresql")

connect_args = {}
engine_kwargs: dict = {"echo": False}

if not _is_postgres:
    # SQLite needs check_same_thread=False for multi-threaded FastAPI usage
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL connection pool settings for production robustness & Supabase SSL
    connect_args = {"sslmode": "require"}
    engine_kwargs.update({
        "pool_pre_ping": True,   # Drop stale connections before use
        "pool_recycle": 300,     # Recycle connections every 5 minutes
        "pool_size": 5,          # Persistent connection pool size
        "max_overflow": 10,      # Allow up to 10 extra connections under load
    })

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_tables_initialized = False

def init_db_safely():
    """Lazily ensure tables exist, vital for serverless runtimes that skip lifespan."""
    global _tables_initialized
    if not _tables_initialized:
        try:
            import app.models  # ensure models registered
            Base.metadata.create_all(bind=engine)
            _tables_initialized = True
        except Exception as e:
            logger.warning(f"Lazy DB table initialization skipped or failed: {e}")


def get_db():
    init_db_safely()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
