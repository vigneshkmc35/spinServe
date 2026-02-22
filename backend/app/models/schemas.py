from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

# --- Domain Roles & Enums ---

class UserRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    SERVER = "SERVER"
    KITCHEN = "KITCHEN"
    BILLING = "BILLING"

class GameStatus(str, Enum):
    LOCKED = "LOCKED"           # Customer cannot play yet
    UNLOCKED = "UNLOCKED"       # Server unlocked it (bought enough items)
    PLAYING = "PLAYING"         # Customer is currently playing
    WON = "WON"                 # Customer won the puzzle
    LOST = "LOST"               # Customer lost or time ran out

class OfferType(str, Enum):
    PERCENTAGE_DISCOUNT = "PERCENTAGE_DISCOUNT"   # e.g., 10% off
    FLAT_DISCOUNT = "FLAT_DISCOUNT"               # e.g., $5 off
    FREE_ITEM = "FREE_ITEM"                       # e.g., Free Biryani

class SessionStatus(str, Enum):
    OPEN = "OPEN"               # Dining in progress
    FOOD_DELIVERED = "FOOD_DELIVERED"
    BILLED = "BILLED"           # Bill generated, waiting for payment
    CLOSED = "CLOSED"           # Paid

# --- Core Entities ---

class Restaurant(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    address: Optional[str] = None
    owner_id: str  # Reference to the owner User ID
    
    # Owner-configurable Gamification Metrics
    game_unlock_threshold: float = 200.0      # E.g., Order must be > 200 Rs to unlock the game
    spinner_slots: List["SpinnerSlot"] = []   # The different prizes & probabilities available on the wheel

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: EmailStr
    mobile: str
    hashed_password: str
    role: UserRole
    restaurant_id: Optional[str] = None # Optional because Owner creates restaurant later
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Table(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    restaurant_id: str
    table_number: int
    qr_code_id: str             # Unique short string/UUID to build the QR code URL (e.g. /qr/<qr_code_id>)
    current_session_id: Optional[str] = None # Open dining session ID if occupied

class MenuGroup(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    restaurant_id: str
    title: str
    image_url: Optional[str] = None

class MenuItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    restaurant_id: str
    group_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True

class Reward(BaseModel):
    offer_type: OfferType
    value: float                # Value for percentage, or value in currency for flat discount
    description: str            # E.g., "10% Off via SpinWheel", "1 Plate Biriyani"
    item_name: Optional[str] = None # Set if offer_type is FREE_ITEM

class SpinnerSlot(BaseModel):
    label: str                  # e.g., "1 Plate Biriyani", "10% Off", "Next Spin"
    probability: float          # Win percentage chance (0 to 100). The sum of all slots in the app should equal 100%.
    reward: Optional[Reward] = None # If None, they win nothing (e.g. "Try again" "Next Spin")

class OrderLine(BaseModel):
    menu_item_id: str
    name: str                   # E.g., "Parotta"
    quantity: int               # E.g., 5
    price_per_item: float
    notes: Optional[str] = None

class DiningSession(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    restaurant_id: str
    table_id: str
    server_id: str
    
    items: List[OrderLine] = []
    total_amount: float = 0.0
    
    # Gamification State
    game_status: GameStatus = GameStatus.LOCKED
    reward_won: Optional[Reward] = None
    
    status: SessionStatus = SessionStatus.OPEN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
