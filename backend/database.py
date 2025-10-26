from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from pathlib import Path

# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent

# Load .env from the backend directory
load_dotenv(dotenv_path=BASE_DIR / '.env')

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Ensure SSL mode is set for Neon
if "sslmode" not in SQLALCHEMY_DATABASE_URL:
    separator = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
    SQLALCHEMY_DATABASE_URL = f"{SQLALCHEMY_DATABASE_URL}{separator}sslmode=require"

# For Neon, use the direct (non-pooled) endpoint if pooled is timing out
# Replace '-pooler' with nothing in the URL for direct connection
# Example: ep-xxx-pooler.region.neon.tech -> ep-xxx.region.neon.tech
if "-pooler" in SQLALCHEMY_DATABASE_URL:
    print("Using pooled connection. If timeouts persist, switch to direct connection.")
    # Uncomment next line to use direct connection:
    # SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("-pooler", "")

# Create engine with aggressive timeout and retry settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,  # Recycle connections after 5 minutes
    pool_size=5,  # Number of connections to maintain
    max_overflow=10,  # Additional connections when needed
    pool_timeout=30,  # Wait up to 30 seconds for a connection
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()