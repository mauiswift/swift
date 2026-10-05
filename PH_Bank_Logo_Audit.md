PH Bank Logo & Icon Audit

Date: 2026-10-06

Summary
-------
This audit inspects the repository for Philippine bank logos and related icons, checks for duplication, accessibility, and theme/format issues.

Key findings
------------
- Logos exist in both `frontend/public/logos/` and `backend/static/logos/` (many duplicates). This increases repo size and risks drift between copies.
- Many SVG brand files include hardcoded color values (e.g., `fill="#..."`, `stroke="#..."`). Examples: `metrobank.svg`, `maya.svg`, `gcash_wide.svg`, `bsp.svg`, `dpo.svg`, etc.
- UI components reference `/logos/...` assets and most `<img>` usages include `alt` attributes (good). Some programmatic JSON references (server-side) also reference logo paths — these are not visual elements and therefore do not have alt text.
- Merchant-uploaded logos use `/uploads/logos/...` and are served from `backend/static/uploads/logos`. The app redirects missing upload logos to `/logo.svg` to avoid broken images.

Risks & Impact
--------------
- Duplicate files: inconsistency risk, larger repo, harder to update branding (e.g., color change).
- Hardcoded SVG colors: logos won't adapt to dark theme or be stylable via CSS if you need monochrome variants or theme-aware icons. Some brand colors, of course, must remain as-is for brand identity — for UI contexts where you need monochrome icons (badges, footers) a separate monochrome variant is preferred.
- Accessibility: most `<img>` tags have `alt` attributes; continue ensuring all decorative images use `alt=""` or `role="presentation"` and all informative logos have meaningful alt text.

Files / duplicate candidates (examples)
--------------------------------------
- frontend/public/logos/* (many SVG/PNG files)
- backend/static/logos/* (many SVG/PNG files)

Duplicate filenames found (intersection sample):
- woori-bank.svg
- wechat.png
- visa.svg
- va.svg
- unionpay.svg
- unionbank.svg (svg/png)
- tos s pay (tosspay.svg / tosspay.png)
- toss-bank.png / toss-bank-account.png
- tether.svg
- shinhan-bank.svg
- security-bank.svg
- sc-first-bank.svg
- rcbc.svg / rcbc.png

(Please confirm the full duplicate list with a local check before deleting anything.)

SVG color hardcoded detection (examples)
----------------------------------------
Patterns like `fill="#` and `stroke="#` are present in many files. Example files containing hex color fills:
- frontend/public/logos/metrobank.svg
- frontend/public/logos/maya.svg
- frontend/public/logos/bsp.svg
- frontend/public/logos/dpo.svg
- backend/static/logos/gcash_wide.svg
- backend/static/logos/maya.svg

Recommendations (actionable)
----------------------------
1) Consolidate canonical logo location
   - Option A (recommended): Keep canonical copies under `backend/static/logos/` (what the running server serves) and remove `frontend/public/logos/*` duplicates from source control. Adjust frontend build to reference `/logos/...` paths and use `sync_frontend_assets` to copy final assets when needed.
   - Option B: Keep canonical copies under `frontend/public/logos/` and update `sync_frontend_assets` to copy those into `backend/static/logos/` during the build. Both are workable; pick one canon location.

2) Automate deduplication during build
   - Update `start_app_v2.sh` or CI pipeline to run `pnpm build` and then `python backend/sync_frontend_assets.py` so backend static always mirrors the frontend build. Add a small validation step in CI that checks for duplicate filenames between `frontend/public/logos` and `backend/static/logos` and fails if duplicates differ in checksum.

3) Detect and optionally convert SVGs with hardcoded colors
   - For logos that must keep brand color, leave as-is.
   - For UI contexts requiring monochrome (badges, small icons), create monochrome SVG variants using `fill="currentColor"` or CSS variables, or create inverted/dark versions (e.g., `name-dark.svg`).
   - Tooling: install `svgo` and use a config that preserves viewBox and IDs but can replace colors where desired. Example CLI:
     - `pnpm add -D svgo` then `svgo -f frontend/public/logos -o frontend/public/logos.optimized`

4) Optimize raster assets
   - Use `pngquant` or `oxipng` to compress PNGs in `frontend/public/logos` and `backend/static/logos`.
   - Example commands:
     - `pngquant --force --ext .png --quality=65-90 $(find frontend/public/logos -name "*.png")`
     - On Windows Powershell, use appropriate tooling or run in WSL.

5) Accessibility
   - Ensure all `<img src="/logos/...">` in JSX include meaningful `alt` attributes. Decorative logos should use `alt=""`.
   - For images rendered via CSS background images, provide accessible text alternatives nearby or via aria labels.

6) Add an automatic audit
   - Add a script `tools/audit_logos.py` which:
     - lists all images under `frontend/public/logos` and `backend/static/logos`
     - identifies duplicates by filename and size/checksum
     - greps all SVGs for `fill="#` / `stroke="#` and outputs files needing review
   - Run this script as part of CI and during local development.

Quick scripts & commands (run locally)
--------------------------------------
1) List duplicate filenames between folders (PowerShell):
```powershell
$frontend = Get-ChildItem -Path .\frontend\public\logos -File -Recurse | Select-Object -ExpandProperty Name
$backend = Get-ChildItem -Path .\backend\static\logos -File -Recurse | Select-Object -ExpandProperty Name
Compare-Object $frontend $backend -IncludeEqual | Where-Object { $_.SideIndicator -eq '==' } | Select-Object InputObject
```

2) Find SVGs with hex colors (PowerShell):
```powershell
Select-String -Path .\frontend\public\logos\*.svg -Pattern 'fill="#|stroke="#' -List | Select-Object Filename, LineNumber, Line
Select-String -Path .\backend\static\logos\*.svg -Pattern 'fill="#|stroke="#' -List | Select-Object Filename, LineNumber, Line
```

3) Optimize SVGs with svgo (Node):
```bash
pnpm add -D svgo
npx svgo -f frontend/public/logos -o frontend/public/logos.optimized --config=./svgo.config.js
```

Suggested next steps I can perform now (pick one)
--------------------------------------------------
- I can create `tools/audit_logos.py` to automate the checks and commit it to the repo.
- I can produce a PR that deduplicates logos (move everything under `backend/static/logos` and update references), but this is destructive and needs review — I will only propose the patch first.
- I can run automated `fill`/`stroke` grep across all SVGs and produce a CSV of files to review (I can run this and commit the report file).

Which would you like me to do next? If you want me to proceed with automated fixes (optimize SVGs, convert colorable icons to use currentColor, dedupe files), tell me which approach you prefer for canonical logo storage (backend or frontend) and whether brand-color fidelity must be preserved for all logos.
