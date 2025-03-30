from fastapi import APIRouter, File, UploadFile, HTTPException
import os
import magic
from PIL import Image
from io import BytesIO
import logging
from datetime import datetime
import aiofiles

router = APIRouter()

UPLOAD_DIRS = {
    'image': 'img/',
    'video': 'video/',
    'file': 'files/'
}

ALLOWED_MIME_TYPES = {
    'image': {'image/png', 'image/jpeg', 'image/gif', 'image/webp'},
    'video': {'video/mp4', 'video/x-matroska', 'video/x-msvideo'},
    'file': {'text/plain', 'application/pdf', 'application/msword'}
}

CACHE = {
    'total_size': 0
}

CHUNK_SIZE = 1024 * 1024  # 1MB 每次讀取

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def calculate_total_size():
    total_size = 0
    for dir_path in UPLOAD_DIRS.values():
        for root, dirs, files in os.walk(dir_path):
            total_size += sum(os.path.getsize(os.path.join(root, name)) for name in files)
    return total_size

def allowed_file(file_content, file_type):
    mime = magic.Magic(mime=True)
    file_mime_type = mime.from_buffer(file_content)
    return file_mime_type in ALLOWED_MIME_TYPES[file_type]

def get_unique_filename(filepath):
    """
    如果檔案已存在，自動在檔名後加上時間戳記
    例如: test.jpg -> test_20250227133010.jpg
    """
    if not os.path.exists(filepath):
        return filepath
    
    directory = os.path.dirname(filepath)
    filename = os.path.basename(filepath)
    name, ext = os.path.splitext(filename)
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{name}_{timestamp}{ext}"
    return os.path.join(directory, new_filename)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 先讀取檔案開頭來確認 MIME 類型
    initial_content = await file.read(1024)  # 讀取前 1KB 來檢查 MIME 類型
    mime = magic.Magic(mime=True)
    file_mime_type = mime.from_buffer(initial_content)
    file_extension = os.path.splitext(file.filename)[1].lower()

    # 決定檔案類型
    if file_mime_type in ALLOWED_MIME_TYPES['image'] and file_extension in {'.png', '.jpeg', '.jpg', '.gif', '.webp'}:
        file_type = 'image'
    elif file_mime_type in ALLOWED_MIME_TYPES['video'] and file_extension in {'.mp4', '.mkv', '.avi'}:
        file_type = 'video'
    else:
        file_type = 'file'

    # 準備檔案路徑
    file_location = os.path.join(UPLOAD_DIRS[file_type], file.filename)
    file_location = get_unique_filename(file_location)

    try:
        # 特殊處理 webp 檔案
        if file_type == 'image' and file_mime_type == 'image/webp':
            content = await file.read()
            image = Image.open(BytesIO(content))
            file_location = os.path.splitext(file_location)[0] + '.png'
            file_location = get_unique_filename(file_location)
            image.save(file_location, 'PNG')
            file_size = os.path.getsize(file_location)
        else:
            # 重設檔案指標到開頭
            await file.seek(0)
            
            # 分塊寫入檔案並記錄進入與離開訊息
            file_size = 0
            chunk_index = 0
            logger.info("開始分塊寫入檔案")
            async with aiofiles.open(file_location, 'wb') as out_file:
                while content := await file.read(CHUNK_SIZE):
                    await out_file.write(content)
                    file_size += len(content)
                    chunk_index += 1
                    logger.info("寫入 chunk %d, 長度: %d bytes", chunk_index, len(content))
            logger.info("分塊寫入完成，總共寫入 %d bytes", file_size)

        # 檢查總容量限制
        if CACHE['total_size'] + file_size > 50 * 1024 * 1024 * 1024:  # 5GB
            if os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=400, 
                detail=f"Storage limit exceeded. Current usage: {CACHE['total_size'] / (1024 * 1024 * 1024):.2f} GB"
            )

        CACHE['total_size'] += file_size
        logger.info("%s '%s' 上傳成功, 檔案大小: %d bytes", file_type.capitalize(), file.filename, file_size)
        return {"info": f"{file_type.capitalize()} '{file.filename}' uploaded successfully."}

    except Exception as e:
        # 發生錯誤時清理已寫入的檔案
        if os.path.exists(file_location):
            os.remove(file_location)
        logger.error("上傳失敗: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
