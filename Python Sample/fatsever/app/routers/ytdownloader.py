from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yt_dlp
import os

router = APIRouter()

class VideoDownloadRequest(BaseModel):
    url: str

@router.post("/download")
async def download_video(request: VideoDownloadRequest):
    try:
        ydl_opts = {
            'format': 'best',
            'outtmpl': os.path.join('video', '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegSubtitles',
                'langs': ['en'],
                'format': 'srt',
            }],
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(request.url, download=True)
            return {"status": "success", "title": info_dict.get('title'), "filename": info_dict.get('title') + '.mp4'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status/{video_id}")
async def get_download_status(video_id: str):
    # Placeholder for download status logic
    return {"video_id": video_id, "status": "downloaded"}  # Example response

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