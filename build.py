# assets/work/<폴더>/ 안의 파일을 읽어 works.js 를 자동 생성 (직접 고칠 필요 없음)
import json, unicodedata
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
IMG = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VID = {".mp4", ".webm", ".mov"}
nfc = lambda s: unicodedata.normalize("NFC", s)   # 맥 한글 파일명 대응

works = {}
for folder in sorted(p for p in (ROOT / "assets/work").iterdir() if p.is_dir()):
    files = [p for p in folder.iterdir() if p.is_file() and not p.name.startswith(".")]
    texts = {nfc(p.stem): p for p in files if p.suffix.lower() == ".txt"}
    items = []
    # 파일명 역순: 최신 연도가 먼저
    for p in sorted(files, key=lambda p: nfc(p.name), reverse=True):
        ext = p.suffix.lower()
        if ext not in IMG | VID:
            continue
        stem = nfc(p.stem)
        parts = stem.split("_", 2)
        year, company, title = parts if len(parts) == 3 else ("", "", stem)
        t = texts.get(stem)
        items.append({
            "year": year, "company": company, "title": title,
            "desc": t.read_text(encoding="utf-8-sig", errors="replace").strip() if t else "",
            "video" if ext in VID else "img": quote(p.relative_to(ROOT).as_posix()),
        })
    works[folder.name] = items

(ROOT / "works.js").write_text("const WORKS = " + json.dumps(works, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print({k: len(v) for k, v in works.items()})
