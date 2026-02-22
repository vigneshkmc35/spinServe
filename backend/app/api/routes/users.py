from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database

router = APIRouter()

from pydantic import BaseModel
from fastapi import HTTPException

from app.services.user_service import UserService

class LoginRequest(BaseModel):
    mobile: str
    password: str

@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Authenticate user with mobile number and password."""
    return await UserService.authenticate_user(db, req.mobile, req.password)
