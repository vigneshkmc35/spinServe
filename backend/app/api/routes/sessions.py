from fastapi import APIRouter, Depends, HTTPException, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import List, Dict
import random

router = APIRouter()

@router.get("/")
async def get_sessions(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch all open sessions (Billing & Server use)"""
    cursor = db.dining_sessions.find({"restaurant_id": "rest_001", "status": "OPEN"})
    sessions = await cursor.to_list(length=100)
    return sessions

@router.get("/{session_id}")
async def get_session(session_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    session = await db.dining_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(404, "Session not found")
    return session

@router.post("/{session_id}/add-items")
async def add_session_items(session_id: str, data: dict = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Server adds items to session and checks if game unlocks"""
    session = await db.dining_sessions.find_one({"_id": session_id})
    restaurant = await db.restaurants.find_one({"_id": session["restaurant_id"]})
    
    new_total = session["total_amount"] + sum([item["price_per_item"] * item["quantity"] for item in data["items"]])
    game_status = session["game_status"]
    
    # Auto unlock if over threshold and previously locked
    if new_total >= restaurant["game_unlock_threshold"] and game_status == "LOCKED":
        game_status = "UNLOCKED"
        
    await db.dining_sessions.update_one(
        {"_id": session_id},
        {
            "$set": {
                "total_amount": new_total,
                "game_status": game_status
            },
            "$push": {"items": {"$each": data["items"]}}
        }
    )
    return await db.dining_sessions.find_one({"_id": session_id})

@router.post("/{session_id}/game-won")
async def game_won(session_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Customer finishes puzzle"""
    result = await db.dining_sessions.update_one(
        {"_id": session_id, "game_status": "UNLOCKED"},
        {"$set": {"game_status": "WON"}}
    )
    if result.modified_count == 0:
        raise HTTPException(400, "Game is not unlocked or doesn't exist.")
    return {"message": "Game Won! You can now spin."}
    
@router.post("/{session_id}/spin")
async def spin_wheel(session_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Customer spins wheel based on probabilities"""
    session = await db.dining_sessions.find_one({"_id": session_id})
    if not session or session["game_status"] != "WON" or session.get("reward_won"):
        raise HTTPException(400, "Cannot spin. Must win game first and have no previous reward.")
        
    restaurant = await db.restaurants.find_one({"_id": session["restaurant_id"]})
    slots = restaurant["spinner_slots"]
    
    rand = random.uniform(0, 100)
    cumulative = 0.0
    won_slot = None
    
    for slot in slots:
        cumulative += slot["probability"]
        if rand <= cumulative:
            won_slot = slot
            break
            
    if not won_slot:
        won_slot = slots[-1] # Fallback to last item due to floating errors
        
    await db.dining_sessions.update_one(
        {"_id": session_id},
        {"$set": {"reward_won": won_slot["reward"]}}
    )
    
    return {"won_slot": won_slot}
