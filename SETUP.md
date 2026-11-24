# Deployment Guide: `https://nisynn.github.io/`

Hosted on GitHub Pages (`nisynn/nisynn.github.io`) and deployed automatically from `main` via GitHub Actions.

## Live Architecture

- **Production URL:** `https://nisynn.github.io/`
- **Repository:** `https://github.com/nisynn/nisynn.github.io`
- **Build & Gate:** `scripts/build.py` outputs `dist/` and `scripts/verify.py` gates every PR and push.
- **Workflows:**
  - `.github/workflows/checks.yml`: Runs build and verification checks on pull requests to `main`.
  - `.github/workflows/pages.yml`: Runs build, verification, and GitHub Pages deployment on pushes to `main`.

## Day-to-Day Revision Cycle

1. Make edits locally (`index.html`, `styles.css`, `script.js`, `assets/`, or `site.config.json`).
2. Build and verify:

```powershell
python scripts/build.py
python scripts/verify.py
```

3. Preview the built output (`dist/` matches what deploys):

```powershell
python -m http.server 8080 --directory dist
```

4. Review `git status` and `git diff`, commit, and push to `main`. `.github/workflows/pages.yml` builds, runs the verification gate, and updates `https://nisynn.github.io/` automatically.

## Optional: Attaching a Custom Domain Later

If you decide to attach a custom domain (for example, `.me`, `.dev`, or `.com`) later:

1. Update `"siteUrl"` inside `site.config.json` to your `https://<your-domain>` root origin.
2. Re-run `python scripts/build.py` and `python scripts/verify.py`, then commit and push to `main`.
3. In GitHub repository **Settings** -> **Pages**, enter your custom domain under **Custom domain** (Source stays **GitHub Actions**).
4. In your registrar's **Advanced DNS** panel:
   - Remove default parking/redirect records on `@` and `www`.
   - Add the four GitHub Pages `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Optionally add the four `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   - Add one `CNAME` record for `www` pointing to `nisynn.github.io`.
   - Keep any GitHub domain verification `TXT` record if requested.
5. After DNS propagates, enable **Enforce HTTPS** in GitHub Pages settings.
