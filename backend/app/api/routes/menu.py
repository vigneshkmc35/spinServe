from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import List, Optional
from pydantic import BaseModel, validator
import uuid

router = APIRouter()

# ─── Schemas ────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    title: str
    image_url: Optional[str] = None
    restaurant_id: str = "rest_001"

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Group title cannot be empty')
        return v.strip()

class GroupResponse(BaseModel):
    id: str
    title: str
    image_url: Optional[str] = None
    restaurant_id: str

class ItemCreate(BaseModel):
    group_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    restaurant_id: str = "rest_001"

    @validator('name')
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Item name cannot be empty')
        return v.strip()

    @validator('price')
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

class ItemResponse(BaseModel):
    id: str
    group_id: str
    restaurant_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool

# ─── Group Endpoints ─────────────────────────────────────────────────────────

@router.get("/groups", response_model=List[GroupResponse])
async def get_groups(db: AsyncIOMotorDatabase = Depends(get_database)):
    groups = []
    async for doc in db.menu_groups.find({"restaurant_id": "rest_001"}):
        groups.append(GroupResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            image_url=doc.get("image_url"),
            restaurant_id=doc["restaurant_id"]
        ))
    return groups

@router.post("/groups", response_model=GroupResponse, status_code=201)
async def create_group(payload: GroupCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Check duplicate title in same restaurant
    existing = await db.menu_groups.find_one({"restaurant_id": payload.restaurant_id, "title": {"$regex": f"^{payload.title}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=409, detail=f'A group named "{payload.title}" already exists.')
    new_id = str(uuid.uuid4())[:8]
    doc = {"_id": new_id, "restaurant_id": payload.restaurant_id, "title": payload.title, "image_url": payload.image_url}
    await db.menu_groups.insert_one(doc)
    return GroupResponse(id=new_id, title=payload.title, image_url=payload.image_url, restaurant_id=payload.restaurant_id)

@router.delete("/groups/{group_id}")
async def delete_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    result = await db.menu_groups.delete_one({"_id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    # Also delete all items in the group
    await db.menu_items.delete_many({"group_id": group_id})
    return {"message": "Group and all its items deleted"}

# ─── Item Endpoints ──────────────────────────────────────────────────────────

@router.get("/items", response_model=List[ItemResponse])
async def get_items(group_id: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_database)):
    query: dict = {"restaurant_id": "rest_001"}
    if group_id:
        query["group_id"] = group_id
    items = []
    async for doc in db.menu_items.find(query):
        items.append(ItemResponse(
            id=str(doc["_id"]),
            group_id=doc["group_id"],
            restaurant_id=doc["restaurant_id"],
            name=doc["name"],
            description=doc.get("description"),
            price=doc["price"],
            image_url=doc.get("image_url"),
            is_available=doc.get("is_available", True)
        ))
    return items

@router.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(payload: ItemCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    group = await db.menu_groups.find_one({"_id": payload.group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    # Check duplicate name in same group
    existing = await db.menu_items.find_one({"group_id": payload.group_id, "name": {"$regex": f"^{payload.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=409, detail=f'"{payload.name}" already exists in this group.')
    new_id = str(uuid.uuid4())[:8]
    doc = {
        "_id": new_id,
        "restaurant_id": payload.restaurant_id,
        "group_id": payload.group_id,
        "name": payload.name,
        "description": payload.description,
        "price": payload.price,
        "image_url": payload.image_url,
        "is_available": True
    }
    await db.menu_items.insert_one(doc)
    return ItemResponse(id=new_id, group_id=payload.group_id, restaurant_id=payload.restaurant_id,
                        name=payload.name, description=payload.description, price=payload.price,
                        image_url=payload.image_url, is_available=True)

@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, payload: ItemUpdate, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing = await db.menu_items.find_one({"_id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if updates:
        await db.menu_items.update_one({"_id": item_id}, {"$set": updates})
    updated = await db.menu_items.find_one({"_id": item_id})
    return ItemResponse(id=str(updated["_id"]), group_id=updated["group_id"],
                        restaurant_id=updated["restaurant_id"], name=updated["name"],
                        description=updated.get("description"), price=updated["price"],
                        image_url=updated.get("image_url"), is_available=updated.get("is_available", True))

@router.delete("/items/{item_id}")
async def delete_item(item_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    result = await db.menu_items.delete_one({"_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}
