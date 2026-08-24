import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.government_schemes import scheme_service
from app.services.market_prices import MarketPricesService

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.is_running = False
        self.refresh_interval = 24 * 60 * 60  # 24 hours in seconds
        self.market_prices_service = MarketPricesService()
    
    async def start_scheduler(self):
        """Start the background scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        self.is_running = True
        logger.info("Starting background schedulers")
        
        # Run the schedulers in background tasks
        asyncio.create_task(self._run_schemes_scheduler())
        asyncio.create_task(self._run_market_prices_scheduler())
    
    async def stop_scheduler(self):
        """Stop the background scheduler"""
        self.is_running = False
        logger.info("Stopping background schedulers")
    
    async def _run_schemes_scheduler(self):
        """Government schemes scheduler loop"""
        while self.is_running:
            try:
                # Check if it's time for the next refresh
                db = next(get_db())
                refresh_status = scheme_service.get_refresh_status(db)
                
                if self._should_refresh(refresh_status):
                    logger.info("Starting scheduled scheme refresh")
                    await scheme_service.refresh_schemes_from_external_apis(db)
                    logger.info("Scheduled scheme refresh completed")
                
                # Wait for 1 hour before checking again
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in schemes scheduler: {str(e)}")
                # Wait 5 minutes before retrying on error
                await asyncio.sleep(300)
    
    async def _run_market_prices_scheduler(self):
        """Market prices scheduler loop - refreshes every 2 hours"""
        while self.is_running:
            try:
                logger.info("Starting scheduled market prices refresh")
                db = next(get_db())
                result = await self.market_prices_service.fetch_live_prices(db)
                logger.info(f"Scheduled market prices refresh completed: {result}")
                
                # Wait for 2 hours before next refresh
                await asyncio.sleep(2 * 60 * 60)
                
            except Exception as e:
                logger.error(f"Error in market prices scheduler: {str(e)}")
                # Wait 30 minutes before retrying on error
                await asyncio.sleep(30 * 60)
    
    def _should_refresh(self, refresh_status: dict) -> bool:
        """Check if it's time to refresh schemes"""
        if not refresh_status.get("next_refresh"):
            return True
        
        next_refresh = refresh_status["next_refresh"]
        if isinstance(next_refresh, str):
            next_refresh = datetime.fromisoformat(next_refresh.replace('Z', '+00:00'))
        
        return datetime.utcnow() >= next_refresh
    
    async def force_refresh(self):
        """Force an immediate refresh"""
        try:
            db = next(get_db())
            result = await scheme_service.refresh_schemes_from_external_apis(db)
            logger.info(f"Forced refresh completed: {result}")
            return result
        except Exception as e:
            logger.error(f"Error in force refresh: {str(e)}")
            raise

# Global scheduler instance
scheduler_service = SchedulerService()
