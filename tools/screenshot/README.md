Screenshot capture tool

This folder contains a Playwright script to capture before/after screenshots of the public SwiftPay site and a local preview of this project.

Files
- capture.js — Playwright script that captures 4 screenshots:
  - swiftpay_public_desktop.png
  - swiftpay_public_mobile.png
  - local_preview_desktop.png
  - local_preview_mobile.png
  Screenshots are written to /tmp/screenshots by default.

Usage
1. Serve your local build of the frontend (one of these):
   - Python:
     cd /path/to/repo
     python3 -m http.server 5174 --directory frontend/dist
   - Or npm http-server:
     cd /path/to/repo/frontend/dist
     npx http-server -p 5174

2. Prepare a temporary folder and install Playwright:
   mkdir -p ~/tmp/screenshot
   cd ~/tmp/screenshot
   npm init -y
   npm install playwright@latest

3. Install Playwright browsers:
   npx playwright install

4. Copy capture.js into ~/tmp/screenshot/ (or run it from this repo path) and run:
   node capture.js

5. The output PNGs will be in /tmp/screenshots on the machine where you run the script.

Notes
- Playwright will download browser binaries on `npx playwright install` — ensure your machine has internet access and the required OS packages. If installation fails, follow the error message and install the missing OS libraries (apt-get packages). 
- You can edit capture.js to target other URLs or viewport sizes (e.g., different pages: /dashboard, /login).

Troubleshooting
- If capture fails due to missing OS dependencies, install widely required libs on Debian/Ubuntu:
  sudo apt-get update && sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxrandr2 libasound2 libgbm1 libgtk-3-0

License
- MIT-like: feel free to use and modify the script for your QA workflow.
