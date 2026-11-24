"""Build static production output into dist/ for GitHub Pages custom-domain hosting."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def load_config() -> dict[str, str]:
    cfg_path = ROOT / "site.config.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    site_url = str(cfg.get("siteUrl", "")).strip().rstrip("/")
    parsed = urlparse(site_url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/"):
        raise ValueError(
            f"siteUrl must be an https:// root custom domain without a subpath, got: {site_url!r}"
        )
    cfg["siteUrl"] = site_url
    return cfg


def stamp_head(html: str, cfg: dict[str, str]) -> str:
    origin = cfg["siteUrl"]
    og_rel = "/" + str(cfg.get("ogImage", "/assets/img/kq-landmarks.webp")).lstrip("/")
    og_abs = origin + og_rel

    replacements = [
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{origin}/">'),
        (r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{origin}/">'),
        (r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{og_abs}">'),
        (r'<meta name="twitter:image" content="[^"]*">', f'<meta name="twitter:image" content="{og_abs}">'),
    ]
    stamped = html
    for pattern, repl in replacements:
        stamped, count = re.subn(pattern, repl, stamped, count=1)
        if count != 1:
            raise RuntimeError(f"Expected 1 match for head pattern: {pattern}")
    return stamped


def build() -> None:
    cfg = load_config()
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "script.js").read_text(encoding="utf-8")

    stamped_html = stamp_head(html, cfg)

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)

    (DIST / "index.html").write_text(stamped_html, encoding="utf-8")
    (DIST / "styles.css").write_text(css, encoding="utf-8")
    (DIST / "script.js").write_text(js, encoding="utf-8")

    asset_refs = set(re.findall(r'assets/[^\s"\')>]+', stamped_html + "\n" + css + "\n" + js))
    og_rel = str(cfg.get("ogImage", "")).lstrip("/")
    if og_rel.startswith("assets/"):
        asset_refs.add(og_rel)

    copied_bytes = 0
    for rel in sorted(asset_refs):
        src = ROOT / rel
        if not src.is_file():
            raise FileNotFoundError(f"Referenced production asset missing: {rel}")
        dst = DIST / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied_bytes += dst.stat().st_size

    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {cfg['siteUrl']}/sitemap.xml\n",
        encoding="utf-8",
    )
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <url>\n"
        f"    <loc>{cfg['siteUrl']}/</loc>\n"
        "  </url>\n"
        "</urlset>\n",
        encoding="utf-8",
    )

    total_mb = (copied_bytes + (DIST / "index.html").stat().st_size + (DIST / "styles.css").stat().st_size + (DIST / "script.js").stat().st_size) / (1024 * 1024)
    print(f"Built dist/ for {cfg['siteUrl']} ({len(asset_refs)} assets copied, {total_mb:.2f} MB total)")


if __name__ == "__main__":
    build()
