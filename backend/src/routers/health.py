import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.dependencies.database import get_db
from src.schemas.health import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    db_connected = True
    try:
        # Verify database connection
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Database health check failed")
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "message": "Database is connected" if db_connected else "Database is unavailable",
        "version": settings.VERSION,
    }
