from app.simulation.engine import SimulationEngine

class AppState:
    """
    Singleton-like state container for the in-memory simulation engine.
    Ensures that the entire FastAPI application shares the same engine instance.
    """
    _engine = None

    @classmethod
    def get_engine(cls) -> SimulationEngine:
        if cls._engine is None:
            cls._engine = SimulationEngine()
        return cls._engine

    @classmethod
    def reset(cls):
        cls._engine = SimulationEngine()
