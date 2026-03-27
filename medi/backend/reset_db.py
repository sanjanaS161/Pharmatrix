import sqlite3
import os

db_path = 'medicine.db'
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Deleted existing {db_path}")

# main.py will recreate the database with correct schema when it runs
print("Database will be recreated on next app start.")
