from datetime import datetime
import json
from fastapi import WebSocket

class ChatService:
    def __init__(self):
        self.connections: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[websocket] = websocket.client.host
        await self.broadcast({
            "system": True,
            "message": f"{websocket.client.host} 已加入聊天",
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect(self, websocket: WebSocket) -> None:
        name = self.connections.pop(websocket, None)
        if name:
            await self.broadcast({
                "system": True,
                "message": f"{name} 已離開聊天",
                "timestamp": datetime.utcnow().isoformat()
            })

    async def broadcast(self, payload: dict) -> None:
        msg = json.dumps(payload, ensure_ascii=False)
        for ws in list(self.connections.keys()):
            try:
                await ws.send_text(msg)
            except Exception:
                await self.disconnect(ws)

chat_manager = ChatService()
