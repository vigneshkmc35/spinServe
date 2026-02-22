import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "spinservedb")

async def seed_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    print(f"Connecting to {MONGODB_URL}...")

    # ── Restaurant ──────────────────────────────────────────────────────────
    restaurant = {
        "_id": "rest_001", "name": "SpinServe Premium", "address": "123 Gourmet Street",
        "owner_id": "owner_001", "game_unlock_threshold": 200.0,
        "spinner_slots": [
            {"label": "10% Off", "probability": 20.0, "reward": {"offer_type": "PERCENTAGE_DISCOUNT", "value": 10.0, "description": "10% Off via SpinWheel"}},
            {"label": "Free Dessert", "probability": 10.0, "reward": {"offer_type": "FREE_ITEM", "value": 0.0, "description": "Free Dessert", "item_name": "Gulab Jamun"}},
            {"label": "Try Again", "probability": 70.0, "reward": None}
        ]
    }
    await db.restaurants.update_one({"_id": "rest_001"}, {"$set": restaurant}, upsert=True)
    print("Restaurant seeded.")

    # ── Staff ───────────────────────────────────────────────────────────────
    kitchen_names = ['Chef Ramu', 'Chef Mani', 'Chef Rahul', 'Chef Priya', 'Chef Arjun',
                     'Chef Suman', 'Chef Vikram', 'Chef Ananya', 'Chef Kabir', 'Chef Zara',
                     'Chef Ishaan', 'Chef Diya', 'Chef Advait', 'Chef Kavya', 'Chef Vivaan',
                     'Chef Meera', 'Chef Reyansh', 'Chef Saisha', 'Chef Aarav', 'Chef Myra']
    server_names = ['Kumar', 'Sunil', 'Anita', 'Rohan', 'Sneha', 'Deepak', 'Pooja',
                    'Vikash', 'Neha', 'Amit', 'Suresh', 'Kiran', 'Preeti', 'Rajesh',
                    'Sonal', 'Varun', 'Tanya', 'Akash', 'Shweta', 'Nitin']
    staff_docs = []
    for i, name in enumerate(kitchen_names):
        staff_docs.append({"_id": f"k{i+1}", "name": name,
            "email": f"{name.lower().replace(' ', '.')}@example.com",
            "mobile": f"98765432{10+i}", "hashed_password": "hashed",
            "role": "KITCHEN", "restaurant_id": "rest_001"})
    for i, name in enumerate(server_names):
        staff_docs.append({"_id": f"s{i+1}", "name": name,
            "email": f"{name.lower().replace(' ', '.')}@example.com",
            "mobile": f"99887766{10+i}", "hashed_password": "hashed",
            "role": "SERVER", "restaurant_id": "rest_001"})
    await db.users.delete_many({"role": {"$in": ["KITCHEN", "SERVER"]}})
    await db.users.insert_many(staff_docs)
    print(f"Seeded {len(staff_docs)} staff members.")

    # ── Menu Groups ─────────────────────────────────────────────────────────
    groups = [
        {"_id": "mg1", "restaurant_id": "rest_001", "title": "Biryani",
         "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"},
        {"_id": "mg2", "restaurant_id": "rest_001", "title": "Shawarma",
         "image_url": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=400"},
        {"_id": "mg3", "restaurant_id": "rest_001", "title": "Dosa",
         "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=400"},
    ]
    await db.menu_groups.delete_many({})
    await db.menu_groups.insert_many(groups)
    print(f"Seeded {len(groups)} menu groups.")

    # ── Menu Items ──────────────────────────────────────────────────────────
    items = [
        # Biryani
        {"_id": "mi1", "restaurant_id": "rest_001", "group_id": "mg1",
         "name": "Chicken Biryani", "price": 280.0, "is_available": True,
         "description": "Aromatic basmati cooked with tender chicken pieces, saffron, golden onions and whole spices. Served with raita.",
         "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi2", "restaurant_id": "rest_001", "group_id": "mg1",
         "name": "Mutton Biryani", "price": 360.0, "is_available": True,
         "description": "Slow-cooked tender mutton layered with fragrant long-grain rice and caramelized onions. A royal Mughlai preparation.",
         "image_url": "https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi3", "restaurant_id": "rest_001", "group_id": "mg1",
         "name": "Veg Biryani", "price": 200.0, "is_available": True,
         "description": "Seasonal vegetables cooked in buttery rice with whole spices, nuts and dried fruits. A vegetarian celebration.",
         "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi4", "restaurant_id": "rest_001", "group_id": "mg1",
         "name": "Prawn Biryani", "price": 380.0, "is_available": True,
         "description": "Juicy prawns marinated in coastal spices, cooked in dum style with basmati. A seafood indulgence.",
         "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi5", "restaurant_id": "rest_001", "group_id": "mg1",
         "name": "Hyderabadi Biryani", "price": 320.0, "is_available": True,
         "description": "The iconic dum-cooked Hyderabadi preparation with kacche gosht. Slow-cooked in a sealed handi for maximum flavour.",
         "image_url": "https://images.unsplash.com/photo-1645177628172-a94c1f96debb?auto=format&fit=crop&q=80&w=800"},
        # Shawarma
        {"_id": "mi6", "restaurant_id": "rest_001", "group_id": "mg2",
         "name": "Chicken Shawarma", "price": 120.0, "is_available": True,
         "description": "Rotisserie-cooked spiced chicken sliced thin, wrapped with garlic sauce, pickles and fresh vegetables in flatbread.",
         "image_url": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi7", "restaurant_id": "rest_001", "group_id": "mg2",
         "name": "Paneer Shawarma", "price": 110.0, "is_available": True,
         "description": "Marinated grilled paneer with tahini, cucumber, tomato and herb sauce wrapped in soft Lebanese bread.",
         "image_url": "https://images.unsplash.com/photo-1512058556646-c4da40fba323?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi8", "restaurant_id": "rest_001", "group_id": "mg2",
         "name": "Mixed Shawarma", "price": 150.0, "is_available": True,
         "description": "A generous blend of chicken and beef with all the classic toppings — hummus, pickles, garlic mayo and fresh greens.",
         "image_url": "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi9", "restaurant_id": "rest_001", "group_id": "mg2",
         "name": "Egg Shawarma", "price": 90.0, "is_available": True,
         "description": "Classic egg wrap with hummus spread, crispy onions, garlic sauce and fresh herbs in toasted flatbread.",
         "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=800"},
        # Dosa
        {"_id": "mi10", "restaurant_id": "rest_001", "group_id": "mg3",
         "name": "Masala Dosa", "price": 80.0, "is_available": True,
         "description": "Crispy golden rice crepe filled with spiced potato masala. Served with coconut chutney and sambar.",
         "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi11", "restaurant_id": "rest_001", "group_id": "mg3",
         "name": "Paper Dosa", "price": 70.0, "is_available": True,
         "description": "Ultra-thin paper-crisp style dosa — impossibly light, golden and satisfying. Best dipped in sambar.",
         "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi12", "restaurant_id": "rest_001", "group_id": "mg3",
         "name": "Rava Dosa", "price": 90.0, "is_available": True,
         "description": "Instant semolina dosa with crispy caramelized onions and roasted cashews. Light and lacy texture.",
         "image_url": "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi13", "restaurant_id": "rest_001", "group_id": "mg3",
         "name": "Onion Dosa", "price": 75.0, "is_available": True,
         "description": "Classic dosa topped generously with caramelized sweet onions, green chillies and coriander.",
         "image_url": "https://images.unsplash.com/photo-1598511726623-d2e9996872b4?auto=format&fit=crop&q=80&w=800"},
        {"_id": "mi14", "restaurant_id": "rest_001", "group_id": "mg3",
         "name": "Set Dosa", "price": 65.0, "is_available": True,
         "description": "Soft, fluffy and spongy set of 3 dosas. Light on the stomach and perfect with coconut chutney.",
         "image_url": "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&q=80&w=800"},
    ]
    await db.menu_items.delete_many({})
    await db.menu_items.insert_many(items)
    print(f"Seeded {len(items)} menu items.")

    client.close()
    print("✅ Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
