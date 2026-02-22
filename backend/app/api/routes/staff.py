from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import List, Optional
from pydantic import BaseModel, validator
import re

router = APIRouter()

MOBILE_REGEX = re.compile(r'^[6-9]\d{9}$')

class StaffResponse(BaseModel):
    id: str
    name: str
    mobile: str
    role: str
    status: str = "online"

class StaffCreate(BaseModel):
    name: str
    mobile: str
    role: str  # "KITCHEN" or "SERVER"
    restaurant_id: str = "rest_001"

    @validator('name')
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()

    @validator('mobile')
    def mobile_valid(cls, v):
        if not MOBILE_REGEX.match(v.strip()):
            raise ValueError('Mobile must be a valid 10-digit Indian number starting with 6-9')
        return v.strip()

    @validator('role')
    def role_valid(cls, v):
        if v not in ('KITCHEN', 'SERVER'):
            raise ValueError('Role must be KITCHEN or SERVER')
        return v

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None

    @validator('name')
    def name_not_empty(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters')
            return v.strip()
        return v

    @validator('mobile')
    def mobile_valid(cls, v):
        if v is not None:
            if not MOBILE_REGEX.match(v.strip()):
                raise ValueError('Mobile must be a valid 10-digit Indian number starting with 6-9')
            return v.strip()
        return v


@router.get("/", response_model=List[StaffResponse])
async def get_all_staff(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Fetch all kitchen and server staff."""
    staff = []
    async for doc in db.users.find({"role": {"$in": ["KITCHEN", "SERVER"]}}):
        staff.append(StaffResponse(
            id=str(doc.get("_id", "")),
            name=doc["name"],
            mobile=doc["mobile"],
            role=doc["role"],
            status="online"
        ))
    return staff


@router.post("/", response_model=StaffResponse, status_code=201)
async def create_staff(payload: StaffCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Onboard a new staff member with duplicate mobile validation."""
    # Check duplicate mobile
    existing = await db.users.find_one({"mobile": payload.mobile})
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A staff member with mobile {payload.mobile} already exists."
        )

    import uuid
    new_id = str(uuid.uuid4())[:8]
    doc = {
        "_id": new_id,
        "name": payload.name,
        "mobile": payload.mobile,
        "role": payload.role,
        "restaurant_id": payload.restaurant_id,
        "hashed_password": "placeholder",
        "email": f"{payload.name.lower().replace(' ', '.')}@staff.spinserve.com"
    }
    await db.users.insert_one(doc)
    return StaffResponse(id=new_id, name=payload.name, mobile=payload.mobile, role=payload.role)


@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(staff_id: str, payload: StaffUpdate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Edit staff member details with duplicate mobile validation."""
    existing = await db.users.find_one({"_id": staff_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Staff member not found")

    updates: dict = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.mobile is not None:
        # Check no OTHER user has this mobile
        conflict = await db.users.find_one({"mobile": payload.mobile, "_id": {"$ne": staff_id}})
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Mobile {payload.mobile} is already used by another staff member."
            )
        updates["mobile"] = payload.mobile

    if updates:
        await db.users.update_one({"_id": staff_id}, {"$set": updates})

    updated = await db.users.find_one({"_id": staff_id})
    return StaffResponse(
        id=str(updated["_id"]),
        name=updated["name"],
        mobile=updated["mobile"],
        role=updated["role"]
    )


@router.delete("/{staff_id}")
async def delete_staff(staff_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Remove a staff member from the system."""
    result = await db.users.delete_one({"_id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"message": "Staff member removed successfully"}
