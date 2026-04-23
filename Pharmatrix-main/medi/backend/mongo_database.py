import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://medi-db:medi1234@medi.5ce29of.mongodb.net/?appName=medi")

# Use serverSelectionTimeoutMS so it doesn't hang indefinitely on startup
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# Use the 'medi' database
db = client["medi"]

# Collections
users_collection = db["users"]

# Create unique indexes — wrap in try/except so a cold Atlas connection doesn't crash startup
def ensure_indexes():
    try:
        users_collection.create_index("username", unique=True)
        users_collection.create_index("email", unique=True)
        users_collection.create_index("phone_number", unique=True)
        users_collection.create_index("user_id", unique=True)
        print("INFO: MongoDB indexes ensured.")
    except Exception as e:
        print(f"WARNING: Could not create MongoDB indexes: {e}")

ensure_indexes()

def get_next_user_id() -> int:
    """Auto-increment style integer ID stored in a counters collection."""
    counters = db["counters"]
    result = counters.find_one_and_update(
        {"_id": "user_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]
