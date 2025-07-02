from fastapi import WebSocket

class ChatService:
    def __init__(self):
        self.connections: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[websocket] = websocket.client.host
        await self.broadcast(f"{websocket.client.host} 已加入聊天")

    async def disconnect(self, websocket: WebSocket) -> None:
        ip = self.connections.pop(websocket, None)
        if ip:
            await self.broadcast(f"{ip} 已離開聊天")

    async def broadcast(self, message: str) -> None:
        for ws in list(self.connections.keys()):
            try:
                await ws.send_text(message)
            except Exception:
                await self.disconnect(ws)

chat_manager = ChatService()
