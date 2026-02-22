from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application Settings
    Loads configuration from environment variables or .env file.
    """
    PROJECT_NAME: str = "SpinServe API"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB Config
    MONGODB_URL: str
    DATABASE_NAME: str
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
