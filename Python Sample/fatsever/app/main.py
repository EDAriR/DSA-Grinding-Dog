from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime

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

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))

app.mount("/img", StaticFiles(directory="img"), name="img")
app.mount("/video", StaticFiles(directory="video"), name="video")
app.mount("/files", StaticFiles(directory="files"), name="files")

# 掛載各個 router
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(ytdownloader.router, prefix="/api", tags=["ytdownloader"])

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # 取得各資料夾的檔案清單
    img_files = get_file_list("img")
    video_files = get_file_list("video")
    other_files = get_file_list("files")

    current_year = datetime.now().year

    return templates.TemplateResponse("base.html", {
        "request": request,
        "img_files": img_files,
        "video_files": video_files,
        "other_files": other_files,
        "current_year": current_year
    })
