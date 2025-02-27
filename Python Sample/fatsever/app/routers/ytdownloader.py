# Standard library imports
import asyncio
import os
import re
import uuid
import json
from typing import Dict, Optional

# Third-party imports
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

# Local application imports
from app.services.youtube_service import YoutubeService

router = APIRouter()
youtube_service = YoutubeService()

# 儲存下載任務狀態
download_tasks: Dict[str, asyncio.Queue] = {}

class VideoDownloadRequest(BaseModel):
    url: str

async def download_video(task_id: str, url: str, queue: asyncio.Queue):
    result = await youtube_service.download_video(url, queue)
    await queue.put(result)

@router.post("/ytdownloader/start")
async def start_download(
    request: VideoDownloadRequest, 
    background_tasks: BackgroundTasks
) -> JSONResponse:
    # Validate YouTube URL
    if not is_valid_youtube_url(request.url):
        raise HTTPException(
            status_code=400, 
            detail="Invalid YouTube URL"
        )
    
    try:
        task_id = str(uuid.uuid4())
        queue = asyncio.Queue()
        download_tasks[task_id] = queue
        
        background_tasks.add_task(download_video, task_id, request.url, queue)
        return JSONResponse(
            content={"taskId": task_id},
            status_code=202
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start download: {str(e)}"
        )

def is_valid_youtube_url(url: str) -> bool:
    youtube_regex = r'^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+$'
    return bool(re.match(youtube_regex, url))

@router.get("/ytdownloader/status/{task_id}")
async def get_download_status(task_id: str):
    if task_id not in download_tasks:
        # 回傳單一事件資料即可，注意包在 "data" 中
        return EventSourceResponse({"data": json.dumps({"status": "not_found"})})
    
    queue = download_tasks[task_id]
    
    async def event_generator():
        try:
            while True:
                data = await queue.get()
                # 將資料包裝成 "data" 欄位 (字串格式)
                event_payload = {"data": json.dumps(data)}
                if data["status"] in ["completed", "failed"]:
                    # 清理任務
                    del download_tasks[task_id]
                    yield event_payload
                    break
                yield event_payload
        except asyncio.CancelledError:
            pass
    
    return EventSourceResponse(event_generator())

@router.get("/subtitles/{video_id}")
async def get_subtitles(video_id: str):
    # Placeholder for subtitle retrieval logic
    subtitle_path = os.path.join('video', f"{video_id}.txt")
    if os.path.exists(subtitle_path):
        with open(subtitle_path, 'r') as file:
            subtitles = file.read()
        return {"video_id": video_id, "subtitles": subtitles}
    else:
        raise HTTPException(status_code=404, detail="Subtitles not found")