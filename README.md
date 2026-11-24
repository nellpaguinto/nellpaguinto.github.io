# Portfolio Website: Jonell Paguinto

Static personal portfolio site hosted at `https://nellpaguinto.github.io/` with HTML, CSS, vanilla JavaScript, and a Python build/verification pipeline for GitHub Pages.

## Structure

- `index.html`: Glass Canopy hero with scroll cue, scroll-aware sticky header, KulturaQuest showcase (trailer card and 9-slide carousel), WeedsOut! gameplay section, 4-panel 3D Works gallery, Background (skills and public Credly certification links), Contact, and footer.
- `styles.css`: Open dark-studio layout, responsive desktop/mobile breakpoints, cinema lightbox, and multi-view 3D modal.
- `script.js`: Scroll-aware top banner and project logos, dual-resolution KulturaQuest carousel, dedicated cinema lightbox, multi-view 3D lightbox, and portrait protection.
- `site.config.json`: Canonical domain and social meta configuration (`https://nellpaguinto.github.io`).
- `scripts/build.py`: Builds clean deployable output into `dist/` (ignored by Git) with stamped root-hosted canonical/OG tags, `.nojekyll`, `robots.txt`, `sitemap.xml`, and only referenced production assets.
- `scripts/verify.py`: Strict release verification gate checking `dist/` assets, SEO URLs, text constraints, Credly links, video embeds, and image protections.
- `.github/workflows/`: Automated PR check (`checks.yml`) and main-branch GitHub Pages deploy (`pages.yml`).
- `SETUP.md`: Live deployment architecture, revision workflow, and optional future custom-domain DNS checklist.

## Build and Preview Locally

```powershell
python scripts/build.py
python scripts/verify.py
python -m http.server 8080 --directory dist
```

Then visit `http://localhost:8080` (YouTube embeds require an HTTP server rather than `file://`).
