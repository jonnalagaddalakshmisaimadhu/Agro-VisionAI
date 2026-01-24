from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_URI)
            self.db = self.client[settings.MONGO_DB_NAME]
            # Verify connection
            await self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            raise e

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")

mongo_db = MongoDB()

def get_mongo_db():
    return mongo_db.db
