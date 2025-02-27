from fastapi import APIRouter, File, UploadFile, HTTPException
import os
import magic
from PIL import Image
from io import BytesIO
import logging

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

    if file_type == 'image' and file_mime_type == 'image/webp':
        # Convert webp to png
        image = Image.open(BytesIO(file_content))
        file_location = os.path.splitext(file_location)[0] + '.png'
        image.save(file_location, 'PNG')
        file_size = os.path.getsize(file_location)
    else:
        with open(file_location, "wb") as f:
            f.write(file_content)

    CACHE['total_size'] += file_size
    logging.info("%s '%s' uploaded successfully.", file_type.capitalize(), file.filename)
    return {"info": f"{file_type.capitalize()} '{file.filename}' uploaded successfully."}
