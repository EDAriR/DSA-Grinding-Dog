# config/settings.py

from pydantic import BaseSettings

class Settings(BaseSettings):
    upload_folder: str = "uploads"
    video_folder: str = "video"
    image_folder: str = "img"
    files_folder: str = "files"
    max_upload_size: int = 10 * 1024 * 1024  # 10 MB
    allowed_image_types: list = ["image/jpeg", "image/png", "image/gif"]
    allowed_video_types: list = ["video/mp4", "video/mkv", "video/webm"]
    allowed_file_types: list = ["application/pdf", "application/zip"]

    class Config:
        env_file = ".env"

settings = Settings()