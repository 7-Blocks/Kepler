from app.core.celery_app import celery_app
from database.session import SessionLocal
from orbital.spacetrack import spacetrack_service
from services.weather_service import weather_service
from orbital.collision_engine import collision_engine
import logging

logger = logging.getLogger("app")

@celery_app.task(name="app.tasks.sync_spacetrack_data")
def sync_spacetrack_data():
    logger.info("Executing periodic catalog synchronization...")
    db = SessionLocal()
    try:
        status = spacetrack_service.sync_all_groups(db, limit_per_group=500)
        if status["total_failed"] > 0:
            logger.warning(
                f"Space-Track sync completed with issues — "
                f"upserted={status['total_upserted']}, failed={status['total_failed']}."
            )
        else:
            logger.info(
                f"Space-Track sync succeeded — upserted={status['total_upserted']}."
            )
    except Exception as e:
        logger.error(f"Space-Track sync task failed: {e}", exc_info=True)
    finally:
        db.close()

@celery_app.task(name="app.tasks.sync_space_weather")
def sync_space_weather():
    logger.info("Executing periodic NOAA space weather poll...")
    db = SessionLocal()
    try:
        weather_service.sync_weather(db)
        logger.info("Space weather sync succeeded.")
    except Exception as e:
        logger.error(f"Space weather sync task failed: {e}")
    finally:
        db.close()

@celery_app.task(name="app.tasks.run_collision_scanning")
def run_collision_scanning():
    logger.info("Executing periodic orbital flyby conjunction scan...")
    db = SessionLocal()
    try:
        collisions = collision_engine.predict_collisions(db)
        logger.info(f"Conjunction scan finished. Found {len(collisions)} items.")
    except Exception as e:
        logger.error(f"Collision scanning task failed: {e}")
    finally:
        db.close()
