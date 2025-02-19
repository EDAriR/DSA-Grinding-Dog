from fastapi import APIRouter, File, UploadFile, HTTPException
import os

router = APIRouter()

UPLOAD_DIRS = {
    'image': 'img/',
    'video': 'video/',
    'file': 'files/'
}

ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif'},
    'video': {'mp4', 'mkv', 'avi'},
    'file': {'txt', 'pdf', 'docx'}
}

def allowed_file(filename, file_type):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS[file_type]

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if not allowed_file(file.filename, 'image'):
        raise HTTPException(status_code=400, detail="Invalid image file type.")
    
    file_location = os.path.join(UPLOAD_DIRS['image'], file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    return {"info": f"Image '{file.filename}' uploaded successfully."}

@router.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    if not allowed_file(file.filename, 'video'):
        raise HTTPException(status_code=400, detail="Invalid video file type.")
    
    file_location = os.path.join(UPLOAD_DIRS['video'], file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    return {"info": f"Video '{file.filename}' uploaded successfully."}

@router.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename, 'file'):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    
    file_location = os.path.join(UPLOAD_DIRS['file'], file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    return {"info": f"File '{file.filename}' uploaded successfully."}