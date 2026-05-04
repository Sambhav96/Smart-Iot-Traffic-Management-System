import os
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

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(simulation_router, prefix="/api", tags=["Simulation"])
app.include_router(traffic_router, prefix="/api", tags=["Traffic"])
app.include_router(logs_router, prefix="/api", tags=["Logs"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "Welcome to the Smart Traffic Management System API"}

@app.get("/health")
def health_root():
    return {"status": "ok"}