from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import List, Optional

router = APIRouter()

@router.get("/config")
async def get_restaurant_config(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch restaurant gamification config (for owner/public view)."""
    # Simply fetching the first seeded restaurant
    restaurant = await db.restaurants.find_one({"_id": "rest_001"})
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    return restaurant

from pydantic import BaseModel
from app.models.schemas import SpinnerSlot

class UpdateConfigReq(BaseModel):
    game_unlock_threshold: Optional[float] = None
    game_unlock_initial: Optional[float] = None
    game_unlock_increment: Optional[float] = None
    spinner_slots: List[SpinnerSlot]

@router.put("/config")
async def update_restaurant_config(req: UpdateConfigReq, db: AsyncIOMotorDatabase = Depends(get_database)):
    update_data = req.dict(exclude_unset=True)
    res = await db.restaurants.update_one(
        {"_id": "rest_001"},
        {"$set": update_data}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"status": "success"}

@router.get("/menu")
async def get_menu(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch all available menu items."""
    cursor = db.menu_items.find({"restaurant_id": "rest_001", "is_available": True})
    items = await cursor.to_list(length=100)
    return items

@router.get("/tables")
async def get_tables(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch all tables with session context."""
    cursor = db.tables.find({"restaurant_id": "rest_001"})
    tables = await cursor.to_list(length=100)
    return tables
