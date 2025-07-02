from contextlib import asynccontextmanager
import uvicorn
import logging
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Request, Depends, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import starlette.formparsers

from app.routers import upload, ytdownloader, file_handler, chat, pages
from app.routers.upload import calculate_total_size, CACHE

from app.services.file_service import get_file_list, get_video_files
from app.services.db import get_db

# 設定您期望的最大檔案大小限制
# 設定為略大於 10GB，例如 10.5GB，以位元組為單位
# 強烈警告：設定如此高的限制會帶來顯著的記憶體消耗和DoS風險。
# 對於超大檔案，建議考慮客戶端分塊上傳或其他專用解決方案。
NEW_MAX_SIZE = int(10.5 * 1024 * 1024 * 1024)  # 約 10.5 GB

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.info("啟動 FastAPI 應用程式...")

# 修改 Starlette FormParser 和 MultiPartParser 的預設 max_size
# 這必須在 FastAPI app 實例化以及路由被包含之前執行
starlette.formparsers.FormParser.max_size = NEW_MAX_SIZE
starlette.formparsers.MultiPartParser.max_size = NEW_MAX_SIZE
logger.info("設定最大檔案大小限制: %d GB", NEW_MAX_SIZE / (1024 * 1024 * 1024))



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: 初始化 CACHE
    CACHE['total_size'] = calculate_total_size()
    yield
    # Shutdown: (可選) 在此處做關閉操作

app = FastAPI(
    lifespan=lifespan,
    # 增加請求體大小限制
    docs_url="/docs",
    redoc_url="/redoc"
)

# 加入請求日誌中介軟體
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    logger.info("請求開始: %s %s", request.method, request.url)
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info("請求完成: %s %s - 狀態碼: %d - 處理時間: %.2f 秒", 
                request.method, request.url, response.status_code, process_time)
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))
app.mount("/assets", StaticFiles(directory="app/static"), name="assets")

app.mount("/img", StaticFiles(directory="img"), name="img")
app.mount("/video", StaticFiles(directory="video"), name="video")
app.mount("/files", StaticFiles(directory="files"), name="files")

# 掛載各個 router
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(ytdownloader.router, prefix="/api", tags=["ytdownloader"])
app.include_router(file_handler.router)
app.include_router(chat.router)
app.include_router(pages.router)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # 取得各資料夾的檔案清單
    img_files = get_file_list("img")
    # 使用自訂的 get_video_files 來取得影片相關資料
    video_files = get_video_files()
    other_files = get_file_list("files")

    current_year = datetime.now().year

    return templates.TemplateResponse("home.html", {
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

@app.get("/test", response_class=HTMLResponse)
async def test_page(request: Request):
    return templates.TemplateResponse("test_upload.html", {"request": request})

@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """簡單的檔案上傳測試端點"""
    try:
        logger.info("收到測試上傳請求: %s, 檔案大小: %s", file.filename, file.size)
        content = await file.read()
        logger.info("成功讀取檔案內容，實際大小: %d bytes", len(content))
        return {
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "status": "success"
        }
    except Exception as e:
        logger.error("測試上傳失敗: %s", str(e))
        return {"error": str(e), "status": "failed"}

@app.get("/status", response_class=HTMLResponse)
async def status(request: Request, db: AsyncSession = Depends(get_db)):
    # 執行 SQL 查詢時必須加 await 以取得 ExecResult
    result = await db.execute(
        text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    )
    # result.all() 回傳所有列的列表
    tables = result.all()
    table_list = [row[0] for row in tables]

    print(table_list)

    return templates.TemplateResponse(
        "status.html",
        {
            "request": request,
            "table_list": table_list
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=9001,
        # reload=True,
        # ssl_keyfile="./ssl/key.pem",
        # ssl_certfile="./ssl/cert.pem",
        server_header=False,
        proxy_headers=True,
        forwarded_allow_ips="*",
        timeout_keep_alive=300,  # 設定閒置等待時間為 300 秒
        limit_max_requests=1000,
        limit_concurrency=100,
        # 增加請求體大小限制
        h11_max_incomplete_event_size=512 * 1024 * 1024,  # 512MB
        ws_max_size=16777216  # 16MB
    )