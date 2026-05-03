from .health import router as health_router
from .simulation import router as simulation_router
from .traffic import router as traffic_router
from .logs import router as logs_router
from .analytics import router as analytics_router

__all__ = [
    "health_router",
    "simulation_router",
    "traffic_router",
    "logs_router",
    "analytics_router"
]
