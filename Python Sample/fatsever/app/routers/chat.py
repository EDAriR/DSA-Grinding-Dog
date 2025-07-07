from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.services.chat_service import chat_manager
import json
from datetime import datetime

router = APIRouter(tags=["chat"])

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@router.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await chat_manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type")
            if msg_type == "join":
                name = data.get("name") or websocket.client.host
                chat_manager.connections[websocket] = name
                await chat_manager.broadcast({
                    "system": True,
                    "message": f"{name} 已加入聊天",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif msg_type == "rename":
                new_name = data.get("name") or websocket.client.host
                old_name = chat_manager.connections.get(websocket, websocket.client.host)
                chat_manager.connections[websocket] = new_name
                await chat_manager.broadcast({
                    "system": True,
                    "message": f"{old_name} 改名為 {new_name}",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif msg_type == "chat":
                name = chat_manager.connections.get(websocket, websocket.client.host)
                await chat_manager.broadcast({
                    "name": name,
                    "message": data.get("message", ""),
                    "timestamp": datetime.utcnow().isoformat()
                })
    except WebSocketDisconnect:
        await chat_manager.disconnect(websocket)
