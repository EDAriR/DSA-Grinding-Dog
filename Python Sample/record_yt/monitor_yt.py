import time
from datetime import datetime
import requests
import os
import sys
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

import yt_dlp

import whisper
from whisper.utils import get_writer


YT_API_KEY = 'AIzaSyAFOCW-YXn_yY7x9S1Dq_zLF7BD5ewcuew'

# https://stackoverflow.com/questions/64825310/downloading-data-directly-into-a-temporary-file-with-python-youtube-dl
ydl_opts = {
    'outtmpl': './%(uploader)s/%(title)s_%(release_date)s.%(ext)s',
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    'merge_output_format': 'mp4',
    'writethumbnail' : True,
    'writedescription': True,
    'nocheckcertificate': True,
    # CHROMIUM_BASED_BROWSERS = {'brave', 'chrome', 'chromium', 'edge', 'opera', 'vivaldi'}
    # 'cookiesfrombrowser': ('edge',),
    'cookiefile': 'youtube.com_cookies.txt',
    'live_from_start': True,
    "nopart": True
}

ydl_opts_skip_dl = {
    'outtmpl': './%(uploader)s/%(title)s_%(release_date)s.%(ext)s',
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    'merge_output_format': 'mp4',
    'writethumbnail': True,
    "nopart": True,
    # 'cookiefile': 'youtube.com_cookies.txt',
    # CHROMIUM_BASED_BROWSERS = {'brave', 'chrome', 'chromium', 'edge', 'opera', 'vivaldi'}
    'cookiesfrombrowser': ('edge',),
    'skip_download': True,
}

mp3_opts = {
    'format': 'bestaudio/best',
    'writethumbnail': True,
    'writedescription': True,
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '320',
    }],
    'nocheckcertificate': True
}


async def create_session():
    return aiohttp.ClientSession()


def check_live_stream_title(info, keywords):
    title = info.get('title', '').lower()
    return any(keyword.lower() in title for keyword in keywords)


async def dl_main(opts, url):
    session = await create_session()

    async with session:
        local_opts = opts.copy()  # 創建 opts 的副本
        local_opts['skip_download'] = True  # 僅修改副本
        
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url)
            thumbnail = sorted(filter(lambda d: d.get('height') is not None, info['thumbnails']), key=lambda x: x['height'])[-1]
            print(f'"thumbnail":{thumbnail["url"]}')
            print(f"file path:{ydl.get_output_path()}")

        img_task = asyncio.create_task(download_img(session, thumbnail, info))
        video_task = asyncio.create_task(download_video(opts, url))
        
        await asyncio.gather(img_task, video_task)

    return info

# 單獨用於打印資訊的函數
def print_info(info):
    print(f"live_status:{info.get('live_status', 'N/A')}")
    print(f"channel:{info.get('channel', 'N/A')}")
    print(f"is_live:{info.get('is_live', 'N/A')}")
    print(f"upload_date:{info.get('upload_date', 'N/A')}")
    print(f"uploader:{info.get('uploader', 'N/A')}")
    print(f"title:{info.get('title', 'N/A')}")


async def download_img(session, thumbnail, info):
    async with session.get(thumbnail['url']) as resp:
        img_content = await resp.read()
        try:
            print(f"down load image : {info['uploader']} {info['title']}")
            with open(f"./{info['uploader']}/{info['title']}_{info['release_date']}.jpg", "wb") as file:
                file.write(img_content)
        except FileNotFoundError:
            print(f"try download image fail now try use fath :{info['title']}_{info['uploader']}_{info['release_date']}.jpg")
            with open(f"{info['title']}_{info['uploader']}_{info['release_date']}.jpg", "wb") as file:
                file.write(img_content)


async def download_video(opts, url):
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url)
        file_path = ydl.get_output_path()
        print(f"download success path : {file_path}")
    
    return file_path


def count_down(num, t_name='分鐘', wait_sec=60):

    print(f'wait {str(num)} t_name')
    t_num = int(num)

    if 'hours' in t_name:
        t_num = t_num * 60

    print('Start count down :' + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    for i in range(t_num):

        print(f'need {str(t_num - i)} 分鐘')
        time.sleep(wait_sec)

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'End count down :{now}')


async def wait_dl(yt_url, keywords):
    while True:
        try:
            info = await dl_main(ydl_opts, yt_url)
            if check_live_stream_title(info, keywords):
                print("Recording live stream...")
                await download_video(ydl_opts, yt_url)
                break
            else:
                print("No matching live stream found. Checking again...")
        except yt_dlp.utils.DownloadError as e:
            print(f"DownloadError: {e}")
        except Exception as e:
            print(f"Error: {e}")

        # Wait for some time before checking again
        await asyncio.sleep(300)  # Check every 5 minutes


def get_now(format_str :str ="%Y-%m-%d %H:%M:%S"):
    return datetime.now().strftime(format_str)


async def transcribe_audio(file_path:str):

    print(f'start transcribe_audio : {get_now()}')

    loop = asyncio.get_event_loop()
    output_directory = os.path.dirname(file_path)
    model = whisper.load_model("large-v2", device="cuda")
    input_file = f"{file_path}".replace("mp4", "srt")

    with ThreadPoolExecutor() as pool:
        print(f'loading file : {get_now()}')

        # Load the audio file in a separate thread
        audio = await loop.run_in_executor(pool, lambda: whisper.load_audio(file_path))

        print(f'transcribe : {get_now()}')

        # Transcribe the audio in a separate thread
        transcription = await loop.run_in_executor(pool, lambda: model.transcribe(audio))

        print(f'write file : {get_now()}')

        # Save as an SRT file
        srt_writer = get_writer("srt", output_directory)
        await loop.run_in_executor(pool, lambda: srt_writer(transcription, input_file, {}))

        print(f'done : {get_now()}')


async def monitor_channel(yt_url, keywords):
    while True:
        try:
            info = await dl_main(ydl_opts, yt_url + '/live')
            if check_live_stream_title(info, keywords):
                print(f"Recording live stream from {yt_url}...")
                await download_video(ydl_opts, yt_url + '/live')
                # 移除 break，使函數繼續監視頻道
            else:
                print(f"No matching live stream found on {yt_url}. Checking again...")
        except yt_dlp.utils.DownloadError as e:
            print(f"DownloadError on {yt_url}: {e}")
        except Exception as e:
            print(f"Error on {yt_url}: {e}")

        await asyncio.sleep(1800)  # 每5分鐘檢查一次



async def main(channels, keywords):
    tasks = [monitor_channel(url, keywords) for url in channels]
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    channels = [
        'https://www.youtube.com/channel/UC8rcEBzJSleTkf_-agPM20g', # IRyS Ch. hololive-EN
        'https://www.youtube.com/channel/UCoSrY_IQQVpmIRZ9Xf-y93g', # Gawr Gura Ch. hololive-EN
        'https://www.youtube.com/channel/UCL_qhgtOy0dy1Agp8vkySQg'  # Mori Calliope Ch. hololive-EN
    ]
    keywords = ['unarchive', 'アーカイブ']
    asyncio.run(main(channels, keywords))