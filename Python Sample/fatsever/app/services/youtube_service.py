import os
import yt_dlp
from typing import Dict, Any

ydl_opts = {
    'outtmpl': './video/%(title)s_%(release_date)s.%(ext)s',
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    'merge_output_format': 'mp4',
    'writethumbnail' : True,
    'writedescription': True,
    'nocheckcertificate': True,
    # CHROMIUM_BASED_BROWSERS = {'brave', 'chrome', 'chromium', 'edge', 'opera', 'vivaldi'}
    'cookiesfrombrowser': ('edge',),
    # 'cookiefile': 'youtube.com_cookies.txt',
    "nopart": True
}

class YoutubeService:
    def __init__(self):
        self.download_dir = 'video'

    async def create_progress_hook(self, queue):
        async def progress_hook(d: Dict[str, Any]):
            if d['status'] == 'downloading':
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes', 0)
                if total > 0:
                    progress = int((downloaded / total) * 100)
                    await queue.put({
                        "status": "processing",
                        "progress": progress,
                        "speed": d.get('speed', 0),
                        "eta": d.get('eta', 0)
                    })
        return progress_hook

    def get_ydl_opts(self, progress_hook):
        return {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
            'writethumbnail' : True,
            'writedescription': True,
            'nocheckcertificate': True,
            "nopart": True,
            'outtmpl': os.path.join(self.download_dir, '%(title)s_%(release_date)s.%(ext)s'),
            'progress_hooks': [progress_hook],
            'postprocessors': [{
                'key': 'FFmpegSubtitles',
                'langs': ['en'],
                'format': 'srt',
            }],
        }

    async def download_video(self, url: str, queue) -> Dict[str, Any]:
        try:
            # 通知開始處理
            await queue.put({"status": "processing", "progress": 0})
            
            # 設定下載選項
            progress_hook = await self.create_progress_hook(queue)
            ydl_opts = self.get_ydl_opts(progress_hook)

            # 執行下載
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)

            # 回傳成功結果
            return {
                "status": "completed",
                "title": info_dict.get('title'),
                "filename": f"{info_dict.get('title')}.{info_dict.get('ext', 'mp4')}"
            }

        except Exception as e:
            # 回傳錯誤結果
            return {
                "status": "failed",
                "error": str(e)
            }