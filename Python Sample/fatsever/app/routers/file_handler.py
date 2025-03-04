from fastapi import APIRouter, HTTPException
import os
from pathlib import Path

router = APIRouter(
    prefix="/api/files",
    tags=["files"]
)

@router.delete("/{file_type}/{filename}")
async def delete_file(file_type: str, filename: str):
    # 根據檔案類型決定路徑
    base_path = Path("")
    if file_type == "image":
        file_path = base_path / "img" / filename
    elif file_type == "video":
        file_path = base_path / "video" / filename
    else:
        file_path = base_path / "files" / filename

    print('file_path:', file_path)
    try:
        if file_path.exists():
            os.remove(file_path)
            return {"message": f"檔案 {filename} 已成功刪除"}
        else:
            raise HTTPException(status_code=404, detail="檔案不存在")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))