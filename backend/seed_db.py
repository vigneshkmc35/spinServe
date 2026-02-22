import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

async def seed_database():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DATABASE_NAME", "spinservedb")]
    
    # Drop existing collections for clean seed
    await db.users.drop()
    await db.restaurants.drop()
    await db.tables.drop()
    await db.menu_items.drop()
    await db.dining_sessions.drop()

    # 1. Create Owner & Staff
    owner_id = "user_owner_6374503440"
    server_id = "user_server_001"
    billing_id = "user_billing_001"
    
    await db.users.insert_many([
        {
            "_id": "user_owner_6374503440",
            "name": "Admin Owner",
            "email": "owner@spinserve.com",
            "mobile": "6374503440",
            "hashed_password": "Abc@123", # Plain text for now as per current backend auth
            "role": "OWNER",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "_id": "user_kitchen_001",
            "name": "Chef Ramu",
            "email": "kitchen@spinserve.com",
            "mobile": "9999911111",
            "hashed_password": "kitchen_password",
            "role": "KITCHEN",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "_id": "user_server_001",
            "name": "Kumar Server",
            "email": "server@spinserve.com",
            "mobile": "8888822222",
            "hashed_password": "server_password",
            "role": "SERVER",
            "created_at": datetime.now(timezone.utc)
        }
    ])

    # 2. Create Restaurant with Spinner Config
    restaurant_id = "rest_001"
    await db.restaurants.insert_one({
        "_id": restaurant_id,
        "name": "Spicy Chettinad",
        "address": "123 Main Street, Chennai",
        "owner_id": owner_id,
        "game_unlock_threshold": 200.0,
        "spinner_slots": [
            {
                "label": "1 Plate Biriyani",
                "probability": 10.0,
                "reward": {
                    "offer_type": "FREE_ITEM",
                    "value": 0,
                    "description": "1 Plate Biriyani",
                    "item_name": "Biriyani"
                }
            },
            {
                "label": "10% Discount",
                "probability": 40.0,
                "reward": {
                    "offer_type": "PERCENTAGE_DISCOUNT",
                    "value": 10,
                    "description": "10% Off via SpinWheel"
                }
            },
            {
                "label": "1 Idly",
                "probability": 30.0,
                "reward": {
                    "offer_type": "FREE_ITEM",
                    "value": 0,
                    "description": "1 Piece Idly",
                    "item_name": "Idly"
                }
            },
            {
                "label": "Next Spin",
                "probability": 20.0,
                "reward": None
            }
        ],
        "created_at": datetime.now(timezone.utc)
    })

    # Update users with restaurant_id
    await db.users.update_many({}, {"$set": {"restaurant_id": restaurant_id}})

    # 3. Create Menu Items
    menu_items = [
        {"_id": "item_001", "restaurant_id": restaurant_id, "name": "Parotta", "price": 20.0, "category": "Bread", "is_available": True},
        {"_id": "item_002", "restaurant_id": restaurant_id, "name": "Chicken Biriyani", "price": 250.0, "category": "Rice", "is_available": True},
        {"_id": "item_003", "restaurant_id": restaurant_id, "name": "Idly", "price": 10.0, "category": "Tiffin", "is_available": True},
        {"_id": "item_004", "restaurant_id": restaurant_id, "name": "Mutton Chukka", "price": 300.0, "category": "Sides", "is_available": True}
    ]
    await db.menu_items.insert_many(menu_items)

    # 4. Create Tables
    await db.tables.insert_many([
        {"_id": "table_001", "restaurant_id": restaurant_id, "table_number": 1, "qr_code_id": "QR_TBL1", "current_session_id": None},
        {"_id": "table_002", "restaurant_id": restaurant_id, "table_number": 2, "qr_code_id": "QR_TBL2", "current_session_id": None},
        {"_id": "table_003", "restaurant_id": restaurant_id, "table_number": 3, "qr_code_id": "QR_TBL3", "current_session_id": "session_001"}
    ])

    # 5. Create Sample Dining Session
    await db.dining_sessions.insert_one({
        "_id": "session_001",
        "restaurant_id": restaurant_id,
        "table_id": "table_003",
        "server_id": server_id,
        "items": [
            {
                "menu_item_id": "item_001",
                "name": "Parotta",
                "quantity": 10,
                "price_per_item": 20.0,
                "notes": "Hot"
            }
        ],
        "total_amount": 200.0,
        "game_status": "UNLOCKED", # Unlocked because 200 >= threshold 200
        "reward_won": None,
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc),
        "closed_at": None
    })

    print("Database Seeded Successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
