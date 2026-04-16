from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import analyze, payments, sessions
import os

app = FastAPI(title="ConvoForge API", version="2026.04.15")

# Configure CORS
origins = [
    os.getenv("APP_URL", "http://localhost:3000"),
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])

@app.get("/")
async def root():
    return {"message": "ConvoForge API is active.", "docs": "/docs"}
