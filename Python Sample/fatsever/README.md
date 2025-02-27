# FastAPI Project

## Overview

This FastAPI project provides a web interface for downloading videos and uploading files, including images and other types of documents. It utilizes `yt-dlp` for video downloads and `openai-whisper` for generating subtitles.

## 啟動方式

1. 安裝相依套件：`pip install -r requirements.txt`

2. 啟動 FastAPI 應用程式：
   `uvicorn app.main:app --reload --port 9001`

3. 在瀏覽器中開啟 <http://127.0.0.1:9001> 即可使用應用程式界面。

## Features

- Download videos to the `/video` directory using `yt-dlp`.
- Upload images to the `/img` directory.
- Upload other file types to the `/files` directory.
- A basic HTML interface that allows users to:
  - List and download files from `/img`, `/video`, and `/files`.
  - Upload files via drag-and-drop or paste.
  - Automatically route uploads to the appropriate directory based on file type.
- Video download status tracking on the `/yt` endpoint.
- Subtitle generation using `openai-whisper` after video downloads, with subtitles saved in the `/video` directory.

## Project Structure

```
fatAPI
├── app
│   ├── main.py               # Entry point of the FastAPI application
│   ├── routers
│   │   ├── upload.py         # Routes for file uploads
│   │   └── ytdownloader.py    # Routes for video downloading
│   ├── services
│   │   └── __init__.py       # Core business logic
│   └── templates
│       └── base.html         # HTML template for the web interface
├── img                        # Directory for uploaded images
├── video                      # Directory for downloaded videos and subtitles
├── files                      # Directory for other uploaded files
├── config
│   └── settings.py           # Configuration settings for the application
└── README.md                 # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd fastapi-project
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the FastAPI application:
   ```
   uvicorn app.main:app --reload
   ```

4. Access the application in your web browser at `http://127.0.0.1:8000`.

## Usage Guidelines

- Use the upload section on the home page to upload images and other files.
- Enter a video URL in the `/yt` section to download videos.
- After downloading, subtitles will be generated and displayed on the `/yt` page.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.