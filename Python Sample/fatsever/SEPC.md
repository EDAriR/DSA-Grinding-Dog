# fast api project (Router 版本)

## 主要功能

- 使用`yt-dlp`下載 video 至`/video`
- 上傳圖片至專案`/img`資料夾
- 上傳影片、圖片以外檔案至專案`/files`資料夾
- 基礎的 HTML 介面，包含：
  - 列出`/img`、`/video`、`/files`底下所有檔案並提供下載
- 根路徑 `/`
  - 標題 (title)
  - 上傳區塊 (支援拖曳與貼上圖片上傳)
  - 根據副檔名自動上傳至對應資料夾 (`/img`、`/video`、`/files`)
- `/yt`
  - 輸入欲下載影片的網址
  - 顯示下載狀態

### 次要功能

- 完成影片下載後，利用`openai-whisper local`(large mode)轉檔出帶時間軸的字幕文字
  - `字幕檔`存放於`/video`，與原影片同名，副檔名 `.txt`
  - 於 `/yt` 頁面顯示該字幕文字
- 調用`ollama llama3 summary`對字幕執行摘要，並將摘要結果顯示於字幕文字下方

## 專案構造 (Router 版本)

- `app`
  - `main.py`：FastAPI 主程式
  - `routers/`
    - `upload.py`：與上傳檔案相關的路由
    - `ytdownloader.py`：與影片下載、字幕轉檔相關的路由
  - `services/`
    - 可放置上傳服務、下載邏輯、OpenAI Whisper等核心業務邏輯
  - `templates/`：HTML 模板 (對應 Jinja2 等)
- `img/`：上傳圖片儲存目錄
- `video/`：下載影片及字幕儲存目錄
- `files/`：其他類型檔案儲存目錄
- `config/`：放置設定檔
- `DOCKERFILE`：專案容器化設定

> Router 架構說明：
> - 在`main.py`內初始化 FastAPI，掛載各個`routers/*`檔案 (例如`upload.py`、`ytdownloader.py`)。
> - 每支路由檔中使用`APIRouter()`，將相關路徑/功能拆分管理。

## 使用套件

- `fast-api`
- `openai-whisper`
- `yt-dlp`
