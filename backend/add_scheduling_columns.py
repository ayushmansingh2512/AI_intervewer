"""
Database Migration Script - Add scheduling columns to interviews table

Run this script to add the scheduled_start_time and duration_minutes columns.

Usage:
    python add_scheduling_columns.py
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

# SQL to add the columns (PostgreSQL syntax)
add_columns_sql = """
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
"""

try:
    with engine.connect() as connection:
        print("Adding scheduling columns to interviews table...")
        connection.execute(text(add_columns_sql))
        connection.commit()
        print("✅ Successfully added scheduling columns!")
        print("\nYou can now restart your application.")
        
except Exception as e:
    print(f"❌ Error adding columns: {e}")
    print("\nAlternative: You can run this SQL manually in your database:")
    print(add_columns_sql)
