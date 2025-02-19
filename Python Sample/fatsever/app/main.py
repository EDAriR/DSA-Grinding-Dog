# main.py

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pathlib import Path

from app.routers import upload, ytdownloader

from app.services.file_service import get_file_list


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# 掛載各個 router
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(ytdownloader.router, prefix="/yt", tags=["ytdownloader"])

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # 取得各資料夾的檔案清單
    img_files = get_file_list("img")
    video_files = get_file_list("video")
    other_files = get_file_list("files")

    return templates.TemplateResponse("home.html", {
        "request": request,
        "img_files": img_files,
        "video_files": video_files,
        "other_files": other_files
    })
