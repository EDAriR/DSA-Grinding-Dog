import logging
from fastapi import APIRouter, HTTPException
import os
from pathlib import Path
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter(
    prefix="/api/files",
    tags=["files"]
)

@router.delete("/{file_type}/{filename}")
async def delete_file(file_type: str, filename: str):
    base_path = Path("")
    if file_type == "image":
        file_path = base_path / "img" / filename
    elif file_type == "video":
        file_path = base_path / "video" / filename
    else:
        file_path = base_path / "files" / filename

    logger.info(f"檔案刪除，檔案路徑: {file_path}")
    try:
        if file_path.exists():
            os.remove(file_path)
            return {"message": f"檔案 {filename} 已成功刪除"}
        else:
            raise HTTPException(status_code=404, detail="檔案不存在")
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{file_type}/{filename}")
async def download_file(file_type: str, filename: str):
    base_path = Path("")
    if file_type == "image":
        file_path = base_path / "img" / filename
    elif file_type == "video":
        file_path = base_path / "video" / filename
    else:
        file_path = base_path / "files" / filename

    if not file_path.exists():
        logger.error(f"檔案不存在，嘗試存取路徑: {file_path.resolve()}")
        raise HTTPException(status_code=404, detail="檔案不存在")
    
    return FileResponse(
        path=str(file_path),
        media_type="application/octet-stream",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )