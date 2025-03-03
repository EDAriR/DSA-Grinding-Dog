import os
from pathlib import Path

def get_file_list(folder_path: str) -> list[str]:
    p = Path(folder_path)
    if not p.exists():
        return []
    return [f.name for f in p.iterdir() if f.is_file()]

def get_video_files():
    video_dir = "video"
    try:
        files = os.listdir(video_dir)
    except FileNotFoundError:
        return []

    video_ext = {'.mp4', '.mkv', '.avi'}
    image_ext = {'.jpg', '.png', '.webp'}
    videos = []

    for f in files:
        base, ext = os.path.splitext(f)
        if ext.lower() in video_ext:
            # 尋找同檔名縮圖，忽略 .description
            thumbnail = None
            for img_ext in image_ext:
                candidate = base + img_ext
                if candidate in files:  # 找到符合的縮圖
                    thumbnail = candidate
                    break
            videos.append({"video": f, "thumbnail": thumbnail})
    return videos
