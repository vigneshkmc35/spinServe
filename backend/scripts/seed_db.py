import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "spinservedb")

async def seed_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    
    # Define the restaurant first
    restaurant = {
        "_id": "rest_001",
        "name": "SpinServe Premium",
        "address": "123 Gourmet Street",
        "owner_id": "owner_001",
        "game_unlock_threshold": 200.0,
        "spinner_slots": [
            {"label": "10% Off", "probability": 20.0, "reward": {"offer_type": "PERCENTAGE_DISCOUNT", "value": 10.0, "description": "10% Off via SpinWheel"}},
            {"label": "Free Dessert", "probability": 10.0, "reward": {"offer_type": "FREE_ITEM", "value": 0.0, "description": "Free Dessert", "item_name": "Gulab Jamun"}},
            {"label": "Try Again", "probability": 70.0, "reward": None}
        ]
    }
    
    await db.restaurants.update_one({"_id": "rest_001"}, {"$set": restaurant}, upsert=True)
    print("Restaurant seeded.")

    # Seed Staff (Users)
    kitchen_names = ['Chef Ramu', 'Chef Mani', 'Chef Rahul', 'Chef Priya', 'Chef Arjun', 'Chef Suman', 'Chef Vikram', 'Chef Ananya', 'Chef Kabir', 'Chef Zara', 'Chef Ishaan', 'Chef Diya', 'Chef Advait', 'Chef Kavya', 'Chef Vivaan', 'Chef Meera', 'Chef Reyansh', 'Chef Saisha', 'Chef Aarav', 'Chef Myra']
    server_names = ['Kumar', 'Sunil', 'Anita', 'Rohan', 'Sneha', 'Deepak', 'Pooja', 'Vikash', 'Neha', 'Amit', 'Suresh', 'Kiran', 'Preeti', 'Rajesh', 'Sonal', 'Varun', 'Tanya', 'Akash', 'Shweta', 'Nitin']

    staff_to_insert = []
    
    # Passwords are hardcoded for now in this dummy data
    for i, name in enumerate(kitchen_names):
        staff_to_insert.append({
            "_id": f"k{i+1}",
            "name": name,
            "email": f"{name.lower().replace(' ', '.')}@example.com",
            "mobile": f"98765432{10+i}",
            "hashed_password": "hashed_password_placeholder", # In a real app, hash this
            "role": "KITCHEN",
            "restaurant_id": "rest_001"
        })

    for i, name in enumerate(server_names):
        staff_to_insert.append({
            "_id": f"s{i+1}",
            "name": name,
            "email": f"{name.lower().replace(' ', '.')}@example.com",
            "mobile": f"99887766{10+i}",
            "hashed_password": "hashed_password_placeholder",
            "role": "SERVER",
            "restaurant_id": "rest_001"
        })

    # Clear existing users (that are staff) and insert new ones
    await db.users.delete_many({"role": {"$in": ["KITCHEN", "SERVER"]}})
    await db.users.insert_many(staff_to_insert)
    print(f"Seeded {len(staff_to_insert)} staff members.")

    # Seed Menu Items
    menu_data = [
        # Breads
        {"name": "Butter Naan", "category": "Breads", "price": 40},
        {"name": "Garlic Naan", "category": "Breads", "price": 50},
        {"name": "Roti", "category": "Breads", "price": 20},
        {"name": "Laccha Paratha", "category": "Breads", "price": 60},
        # Signature Rice
        {"name": "Jeera Rice", "category": "Signature Rice", "price": 120},
        {"name": "Veg Biryani", "category": "Signature Rice", "price": 180},
        {"name": "Paneer Pulao", "category": "Signature Rice", "price": 200},
        {"name": "Kashmiri Pulao", "category": "Signature Rice", "price": 220},
        # Gourmet Sides
        {"name": "Paneer Tikka", "category": "Gourmet Sides", "price": 250},
        {"name": "Dal Makhani", "category": "Gourmet Sides", "price": 280},
        {"name": "Butter Chicken", "category": "Gourmet Sides", "price": 350},
        {"name": "Mix Veg", "category": "Gourmet Sides", "price": 180},
        # Desserts
        {"name": "Gulab Jamun", "category": "Desserts", "price": 80},
        {"name": "Rasmalai", "category": "Desserts", "price": 120},
        {"name": "Kulfi", "category": "Desserts", "price": 100},
        {"name": "Gajar Halwa", "category": "Desserts", "price": 150},
        # Beverages
        {"name": "Mango Lassi", "category": "Beverages", "price": 90},
        {"name": "Masala Chai", "category": "Beverages", "price": 40},
        {"name": "Fresh Lime Soda", "category": "Beverages", "price": 70},
        {"name": "Cold Coffee", "category": "Beverages", "price": 130}
    ]

    menu_items_to_insert = []
    for i, item in enumerate(menu_data):
        menu_items_to_insert.append({
            "_id": f"m{i+1}",
            "restaurant_id": "rest_001",
            "name": item["name"],
            "price": float(item["price"]),
            "category": item["category"],
            "is_available": True
        })

    await db.menu_items.delete_many({})
    await db.menu_items.insert_many(menu_items_to_insert)
    print(f"Seeded {len(menu_items_to_insert)} menu items.")

    client.close()
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
