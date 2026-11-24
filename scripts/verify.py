"""Verification gate for the built static site in dist/ (used locally and in CI)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def check(condition: bool, label: str, detail: str = "") -> bool:
    status = "PASS" if condition else "FAIL"
    suffix = f" ({detail})" if detail else ""
    print(f"[{status}] {label}{suffix}")
    return condition


def main() -> int:
    ok = True

    cfg = json.loads((ROOT / "site.config.json").read_text(encoding="utf-8"))
    site_url = str(cfg.get("siteUrl", "")).strip().rstrip("/")
    parsed = urlparse(site_url)
    ok &= check(
        parsed.scheme == "https" and bool(parsed.netloc) and parsed.path in ("", "/"),
        "Root custom domain config",
        site_url,
    )

    required_files = ["index.html", "styles.css", "script.js", ".nojekyll", "robots.txt", "sitemap.xml"]
    missing_dist = [f for f in required_files if not (DIST / f).is_file()]
    ok &= check(not missing_dist, "Built dist/ core files present", f"missing={missing_dist}")
    if missing_dist:
        return 1

    html = (DIST / "index.html").read_text(encoding="utf-8")
    css = (DIST / "styles.css").read_text(encoding="utf-8")
    js = (DIST / "script.js").read_text(encoding="utf-8")
    sitemap = (DIST / "sitemap.xml").read_text(encoding="utf-8")

    refs = sorted(set(re.findall(r'assets/[^\s"\')>]+', html + "\n" + css + "\n" + js)))
    missing_assets = [r for r in refs if not (DIST / r).is_file()]
    ok &= check(not missing_assets, "All dist/ assets present", f"{len(refs)} checked, missing={missing_assets}")

    raw_leaks = [
        p.relative_to(DIST).as_posix()
        for p in (DIST / "assets").rglob("*")
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    ]
    ok &= check(not raw_leaks, "No raw source JPG/PNG files in dist/assets/", f"leaks={raw_leaks}")

    expected_og = f"{site_url}/{str(cfg.get('ogImage', '')).lstrip('/')}"
    seo_ok = all([
        f'<link rel="canonical" href="{site_url}/">' in html,
        f'<meta property="og:url" content="{site_url}/">' in html,
        f'<meta property="og:image" content="{expected_og}">' in html,
        f'<meta name="twitter:image" content="{expected_og}">' in html,
        f"<loc>{site_url}/</loc>" in sitemap,
    ])
    ok &= check(seo_ok, "Root-hosted canonical, OG, Twitter, and sitemap URLs")

    emoji_re = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]")
    bad_em = "\u2014" in html or "&mdash;" in html.lower() or "\u2014" in js or "\u2014" in css
    bad_emoji = bool(emoji_re.search(html) or emoji_re.search(js))
    ok &= check(not bad_em and not bad_emoji, "Zero em dashes and zero emojis")

    preview_remnants = [
        s
        for s in ["cue-preview-bar", "hero-preview-bar", "data-cue-mode", "data-hero-mode", "hero-switch-btn"]
        if s in html or s in css or s in js
    ]
    ok &= check(not preview_remnants, "Temporary preview controls removed", f"found={preview_remnants}")

    bad_terms = (
        "TICaP" in html
        or "TICaP" in js
        or bool(re.search(r"\bNell\b", html))
        or bool(re.search(r"\bNell\b", js))
        or bool(re.search(r"\bintern(ship|s)?\b", html, re.I))
        or any(t in html or t in js for t in ["Copy Email", "Official Trailer", "Watch on YouTube", "/earner/earned/"])
    )
    ok &= check(not bad_terms, "Zero forbidden strings or wording")

    credly_links = re.findall(r"https://www\.credly\.com/badges/[0-9a-f-]+/public_url", html)
    ok &= check(len(credly_links) == 5, "Five public Credly certification links", f"count={len(credly_links)}")

    kq_iframes = html.count("uhRj6BiGLUQ")
    wo_iframes = html.count("NeNk38zZwaM")
    ok &= check(kq_iframes == 1 and wo_iframes == 1, "Project video embeds intact", f"kq={kq_iframes}, wo={wo_iframes}")

    me_imgs = re.findall(r'<img[^>]*me-(?:avatar|portrait)\.webp[^>]*>', html)
    photo_ok = (
        len(me_imgs) == 3
        and all('draggable="false"' in tag for tag in me_imgs)
        and "user-select: none" in css
        and "pointer-events: none" in css
        and "contextmenu" in js
        and "dragstart" in js
        and "me-avatar" not in js
        and "me-portrait" not in js
    )
    ok &= check(photo_ok, "Personal portrait protections active")

    hidden_ok = css.lstrip().startswith("[hidden] {") and "display: none !important;" in css[:80]
    ok &= check(hidden_ok, "Global [hidden] rule preserved")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
