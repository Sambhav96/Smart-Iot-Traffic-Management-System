import pytest
from app.core.state import AppState


@pytest.fixture(autouse=True)
def reset_app_state():
    """Reset the singleton AppState before each test to ensure isolation."""
    AppState._engine = None
    yield
    AppState._engine = None


@pytest.fixture
def engine():
    """Provide a fresh simulation engine instance for testing."""
    return AppState.get_engine()
