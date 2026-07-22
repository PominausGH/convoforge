"""Avatar TTS via OpenAI's audio/speech endpoint. Falls back to 503 when no key
is configured so the frontend can use the browser's native speechSynthesis."""
import os

import httpx
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

router = APIRouter()

OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
DEFAULT_VOICE = os.getenv("OPENAI_TTS_VOICE", "nova")
DEFAULT_MODEL = os.getenv("OPENAI_TTS_MODEL", "tts-1")


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voice: str = DEFAULT_VOICE


@router.post("/")
async def synthesize(data: TTSRequest) -> Response:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or api_key.endswith("..."):
        raise HTTPException(status_code=503, detail="OpenAI TTS not configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            OPENAI_TTS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEFAULT_MODEL,
                "voice": data.voice,
                "input": data.text,
                "response_format": "mp3",
            },
        )

    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"OpenAI TTS failed: {res.text[:200]}")

    return Response(content=res.content, media_type="audio/mpeg")
