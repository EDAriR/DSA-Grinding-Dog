from contextlib import asynccontextmanager
import uvicorn
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from routers import upload, ytdownloader
from routers.upload import calculate_total_size, CACHE

from services.file_service import get_file_list

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: 初始化 CACHE
    CACHE['total_size'] = calculate_total_size()
    yield
    # Shutdown: (可選) 在此處做關閉操作

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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

# filetype img, video, files
@app.get("/files")
async def get_files(filetype: str):
    return get_file_list(filetype)


if __name__ == "__main__":
    uvicorn.run(
        app
        , host="127.0.0.1"
        , port=9001
        # , reload=True
        # , ssl_keyfile="./ssl/key.pem"
        # , ssl_certfile="./ssl/cert.pem"
        , server_header=False
        , proxy_headers=True
        , forwarded_allow_ips="*"
        )
