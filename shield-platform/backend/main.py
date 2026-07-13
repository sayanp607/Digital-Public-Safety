"""
SHIELD Platform — FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scam_detection, fraud_graph, geospatial, currency_detection

app = FastAPI(
    title="SHIELD Platform API",
    description="AI-powered Digital Public Safety Intelligence Platform",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(scam_detection.router, prefix="/api/scam",      tags=["Scam Detection"])
app.include_router(fraud_graph.router,    prefix="/api/graph",     tags=["Fraud Graph"])
app.include_router(geospatial.router,     prefix="/api/geo",       tags=["Geospatial"])
app.include_router(currency_detection.router, prefix="/api/currency", tags=["Currency"])


@app.get("/")
def root():
    return {"status": "SHIELD API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
