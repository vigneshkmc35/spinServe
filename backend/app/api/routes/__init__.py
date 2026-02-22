from fastapi import APIRouter
from app.api.routes import users, restaurant, sessions, staff

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(restaurant.router, prefix="/restaurant", tags=["restaurant"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(staff.router, prefix="/staff", tags=["staff"])
