"""WebSocket relay between the browser and Deepgram. Audio bytes flow
browser → FastAPI → Deepgram; transcript JSON flows the other way.
The Deepgram API key never leaves the server."""
import asyncio
import logging
import os
from urllib.parse import urlencode

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
log = logging.getLogger("deepgram_proxy")
log.setLevel(logging.INFO)

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

DEEPGRAM_PARAMS = {
    "model": "nova-3",
    "smart_format": "true",
    "interim_results": "true",
    "endpointing": "300",
}
DEEPGRAM_URL = "wss://api.deepgram.com/v1/listen?" + urlencode(DEEPGRAM_PARAMS)


@router.websocket("/stream")
async def proxy_stream(ws: WebSocket) -> None:
    await ws.accept()
    if not DEEPGRAM_API_KEY:
        await ws.send_json({"type": "error", "message": "Deepgram not configured"})
        await ws.close(code=1011)
        return

    try:
        dg = await websockets.connect(
            DEEPGRAM_URL,
            additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
            max_size=None,
            ping_interval=20,
        )
    except Exception as exc:
        await ws.send_json({"type": "error", "message": f"Deepgram connect failed: {exc}"})
        await ws.close(code=1011)
        return

    closed = asyncio.Event()
    stats = {"client_msgs": 0, "client_bytes": 0, "dg_msgs": 0, "transcripts": 0}

    async def client_to_dg() -> None:
        try:
            while not closed.is_set():
                msg = await ws.receive()
                if msg["type"] == "websocket.disconnect":
                    return
                if msg.get("bytes") is not None:
                    data = msg["bytes"]
                    stats["client_msgs"] += 1
                    stats["client_bytes"] += len(data)
                    await dg.send(data)
                elif msg.get("text") is not None:
                    await dg.send(msg["text"])
        except WebSocketDisconnect:
            return
        except Exception:
            return
        finally:
            closed.set()

    async def dg_to_client() -> None:
        try:
            async for raw in dg:
                if closed.is_set():
                    return
                stats["dg_msgs"] += 1
                if isinstance(raw, str) and '"transcript"' in raw and '"transcript":""' not in raw:
                    stats["transcripts"] += 1
                try:
                    if isinstance(raw, (bytes, bytearray)):
                        await ws.send_bytes(bytes(raw))
                    else:
                        await ws.send_text(raw)
                except (WebSocketDisconnect, RuntimeError):
                    return
        except websockets.ConnectionClosed:
            return
        finally:
            closed.set()

    try:
        await asyncio.gather(client_to_dg(), dg_to_client())
    finally:
        closed.set()
        log.info(
            "[dg_proxy] closed. client=%d msgs (%d B), dg=%d msgs, transcripts=%d",
            stats["client_msgs"], stats["client_bytes"],
            stats["dg_msgs"], stats["transcripts"],
        )
        try:
            await dg.close()
        except Exception:
            pass
        try:
            await ws.close()
        except Exception:
            pass
