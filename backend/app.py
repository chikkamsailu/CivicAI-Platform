import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import engine, Base
from backend.models import *
from backend.seed_data import seed_database

from backend.api import (
    complaints_router,
    ai_router,
    institutions_router,
    field_ops_router,
    inventory_router,
    gis_router
)


# Ensure database tables exist
Base.metadata.create_all(bind=engine)

# Seed demo data if the database is empty
seed_database()


app = FastAPI(
    title="CivicAI Platform",
    description="AI-Powered Civic and Institutional Issue Reporting and Resolution Platform",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Routers
app.include_router(complaints_router)
app.include_router(ai_router)
app.include_router(institutions_router)
app.include_router(field_ops_router)
app.include_router(inventory_router)
app.include_router(gis_router)


# Mount Static Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STATIC_DIR = os.path.join(BASE_DIR, "backend", "static")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)

os.makedirs(os.path.join(FRONTEND_DIR, "css"), exist_ok=True)
os.makedirs(os.path.join(FRONTEND_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(FRONTEND_DIR, "assets"), exist_ok=True)


app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)

app.mount(
    "/css",
    StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")),
    name="css"
)

app.mount(
    "/js",
    StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")),
    name="js"
)

app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
    name="assets"
)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "platform": "CivicAI",
        "version": "2.0.0"
    }


@app.get("/")
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")

    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {
        "message": "CivicAI API Online. Frontend index.html not yet generated."
    }