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
    file_content = await file.read()
    mime = magic.Magic(mime=True)
    file_mime_type = mime.from_buffer(file_content)
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_mime_type in ALLOWED_MIME_TYPES['image'] and file_extension in {'.png', '.jpeg', '.jpg', '.gif', '.webp'}:
        file_type = 'image'
    elif file_mime_type in ALLOWED_MIME_TYPES['video'] and file_extension in {'.mp4', '.mkv', '.avi'}:
        file_type = 'video'
    else:
        file_type = 'file'
    
    file_size = len(file_content)
    if CACHE['total_size'] + file_size > 5 * 1024 * 1024 * 1024:  # 5GB
        raise HTTPException(status_code=400, detail="Storage limit exceeded. Current usage: {:.2f} GB".format(CACHE['total_size'] / (1024 * 1024 * 1024)))

    file_location = os.path.join(UPLOAD_DIRS[file_type], file.filename)
    # 檢查檔案是否已存在，如果存在則重新命名
    file_location = get_unique_filename(file_location)

    if file_type == 'image' and file_mime_type == 'image/webp':
        # Convert webp to png
        image = Image.open(BytesIO(file_content))
        file_location = os.path.splitext(file_location)[0] + '.png'
        # 再次檢查 PNG 檔案是否存在
        file_location = get_unique_filename(file_location)
        image.save(file_location, 'PNG')
        file_size = os.path.getsize(file_location)
    else:
        async with aiofiles.open(file_location, "wb") as out_file:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                await out_file.write(chunk)

    CACHE['total_size'] += file_size
    logging.info("%s '%s' uploaded successfully.", file_type.capitalize(), file.filename)
    return {"info": f"{file_type.capitalize()} '{file.filename}' uploaded successfully."}
