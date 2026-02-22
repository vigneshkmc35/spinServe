from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

class MongoDB:
    def __init__(self):
        self.client: AsyncIOMotorClient | None = None
        self.db: AsyncIOMotorDatabase | None = None

db = MongoDB()

async def connect_to_mongo():
    """Create database connection."""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")

def get_database() -> AsyncIOMotorDatabase:
    """Dependency to provide the database instance."""
    return db.db
