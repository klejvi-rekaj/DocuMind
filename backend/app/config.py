from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    environment: str = "development"
    port: int = 8000
    
    # Models / AI
    openai_api_key: str = ""
    gemini_api_key: str = ""
    
    # Auth
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    
    # Storage
    faiss_index_path: str = "./data/faiss/index.bin"
    pdf_upload_dir: str = "./data/uploads/"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
