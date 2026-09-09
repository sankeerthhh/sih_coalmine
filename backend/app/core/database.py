from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

_is_postgres = settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres")

connect_args = {}
engine_kwargs: dict = {"echo": False}

if not _is_postgres:
    # SQLite needs check_same_thread=False for multi-threaded FastAPI usage
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL connection pool settings for production robustness
    engine_kwargs.update({
        "pool_pre_ping": True,   # Drop stale connections before use
        "pool_recycle": 300,     # Recycle connections every 5 minutes
        "pool_size": 5,          # Persistent connection pool size
        "max_overflow": 10,      # Allow up to 10 extra connections under load
    })

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
