from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from app.models.schemas import User

class UserService:
    @staticmethod
    async def authenticate_user(db: AsyncIOMotorDatabase, mobile: str, password: str):
        user_data = await db.users.find_one({"mobile": mobile})
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid mobile number or security key")
            
        # Standard safety check: In production use hashed password comparison
        # For this standard architecture demo, we match seeded password
        if user_data["hashed_password"] != password:
            raise HTTPException(status_code=401, detail="Invalid mobile number or security key")
            
        return {
            "id": str(user_data["_id"]),
            "name": user_data["name"],
            "role": user_data["role"],
            "restaurant_id": user_data.get("restaurant_id")
        }
