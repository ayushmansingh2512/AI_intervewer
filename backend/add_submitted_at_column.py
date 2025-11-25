"""
Database Migration Script - Add submitted_at column to answers table

Run this script to add the submitted_at column to the existing answers table.
This will allow the application to store submission timestamps.

Usage:
    python add_submitted_at_column.py
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env file")
    exit(1)

print(f"Connecting to database...")

# Create engine
engine = create_engine(DATABASE_URL)

# SQL to add the column (PostgreSQL syntax)
add_column_sql = """
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();
"""

try:
    with engine.connect() as connection:
        print("Adding submitted_at column to answers table...")
        connection.execute(text(add_column_sql))
        connection.commit()
        print("✅ Successfully added submitted_at column!")
        print("\nYou can now restart your application.")
        
except Exception as e:
    print(f"❌ Error adding column: {e}")
    print("\nAlternative: You can run this SQL manually in your database:")
    print(add_column_sql)
