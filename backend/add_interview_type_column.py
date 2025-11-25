from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def add_interview_type_column():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Add interview_type column with default value 'text'
            conn.execute(text("ALTER TABLE interviews ADD COLUMN interview_type VARCHAR DEFAULT 'text'"))
            print("Successfully added interview_type column to interviews table")
            conn.commit()
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_interview_type_column()
