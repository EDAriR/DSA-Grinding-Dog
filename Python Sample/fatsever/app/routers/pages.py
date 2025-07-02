from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent.parent
PAGES_DIR = BASE_DIR / "templates" / "pages"

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

router = APIRouter(prefix="/static", tags=["static-pages"])


def _list_page_names():
    return [p.stem for p in PAGES_DIR.glob("*.html") if p.is_file()]


@router.get("/", response_class=HTMLResponse)
async def list_pages(request: Request):
    pages = _list_page_names()
    return templates.TemplateResponse("pages/list_pages.html", {"request": request, "pages": pages})


@router.get("/{page_name}", response_class=HTMLResponse)
async def show_page(page_name: str, request: Request):
    file_path = PAGES_DIR / f"{page_name}.html"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Page not found")
    template_name = f"pages/{page_name}.html"
    return templates.TemplateResponse(template_name, {"request": request})
