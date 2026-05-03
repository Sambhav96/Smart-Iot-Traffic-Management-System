from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import (
    health_router,
    simulation_router,
    traffic_router,
    logs_router,
    analytics_router
)

app = FastAPI(
    title="Smart Traffic Management System Simulation API",
    description="Backend API for the Smart Traffic Simulation IoT project",
    version="1.0.0",
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(simulation_router, prefix="/api", tags=["Simulation"])
app.include_router(traffic_router, prefix="/api", tags=["Traffic"])
app.include_router(logs_router, prefix="/api", tags=["Logs"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "Welcome to the Smart Traffic Management System API"}
