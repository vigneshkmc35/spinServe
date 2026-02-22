from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    await connect_to_mongo()
    yield
    # Shutdown event
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    # In production, replace with the specific origin of your frontend application
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
