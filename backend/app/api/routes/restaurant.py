from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import List

router = APIRouter()

@router.get("/config")
async def get_restaurant_config(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch restaurant gamification config (for owner/public view)."""
    # Simply fetching the first seeded restaurant
    restaurant = await db.restaurants.find_one({"_id": "rest_001"})
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    return restaurant

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
