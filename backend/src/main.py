from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.database import engine
from sqlalchemy import text
from src.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify database connection without auto-creating tables
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection successfully verified.")
    except Exception as e:
        print(f"Warning: Could not connect to database on startup: {e}")
    yield
    # Shutdown: Clean up resources if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(health.router)  # Root /health alias if needed


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
