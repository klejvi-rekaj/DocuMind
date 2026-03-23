import sys
import os
import logging
from contextlib import asynccontextmanager

# Force the backend directory into the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, query
from app.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events.
    Keep startup light so the API can boot even if model loading is slow.
    """
    logger.info("--- STARTUP: API booting with lazy model loading enabled ---")
    
    yield
    
    logger.info("--- SHUTDOWN: Cleaning up resources ---")

app = FastAPI(
    title="Document Analyzer API",
    description="Backend AI Context API with FAISS and RAG built for production",
    version="1.0.0",
    lifespan=lifespan  # Hooking the lifespan manager here
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.environment}
