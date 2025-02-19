from pathlib import Path

def get_file_list(folder_path: str) -> list[str]:
    p = Path(folder_path)
    if not p.exists():
        return []
    return [f.name for f in p.iterdir() if f.is_file()]
