import os

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from routers import analyze, deepgram, payments, sessions, stats, tts, users

SENTRY_DSN = (os.getenv("SENTRY_DSN_API") or os.getenv("SENTRY_DSN") or "").strip()
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,
        environment=os.getenv("APP_ENV", "production"),
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        send_default_pii=False,
    )

app = FastAPI(title="ConvoForge API", version="2026.04.15")

# Configure CORS
origins = [
    os.getenv("APP_URL", "http://localhost:3015"),
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
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(deepgram.router, prefix="/api/deepgram", tags=["Deepgram"])
app.include_router(tts.router, prefix="/api/tts", tags=["TTS"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])

@app.get("/")
async def root():
    return {"message": "ConvoForge API is active.", "docs": "/docs"}
