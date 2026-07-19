const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const outDir = '/tmp/screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { name: 'swiftpay_public_desktop', url: 'https://swiftpay.ph', width: 1280, height: 800 },
    { name: 'swiftpay_public_mobile',  url: 'https://swiftpay.ph', width: 390, height: 844 },
    { name: 'local_preview_desktop', url: 'http://127.0.0.1:5174', width: 1280, height: 800 },
    { name: 'local_preview_mobile',  url: 'http://127.0.0.1:5174', width: 390, height: 844 },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const t of targets) {
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: t.width, height: t.height });
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
      // small wait so entrance animations can finish
      await page.waitForTimeout(1200);
      const path = `${outDir}/${t.name}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log('Saved', path);
    } catch (err) {
      console.error('Failed to capture', t.name, t.url, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('Done');
})();