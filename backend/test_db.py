from app.database import engine

try:
    with engine.connect() as connection:
        print("SUCCESS: Connected to MySQL!")
except Exception as e:
    print("ERROR:", e)