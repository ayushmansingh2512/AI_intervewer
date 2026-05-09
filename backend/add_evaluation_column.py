from backend.database import engine, Base
from sqlalchemy import text

def add_evaluation_column():
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE answers ADD COLUMN evaluation JSONB"))
            print("Successfully added evaluation column to answers table")
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    add_evaluation_column()
