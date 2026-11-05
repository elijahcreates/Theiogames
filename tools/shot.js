// Screenshot a game after a delay. Usage: node tools/shot.js <id> <ms> <out.png> [--p2] [--mobile] [--click x,y]... [--key Code]... [--hold Code]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const a = process.argv.slice(2); const id = a[0], ms = +a[1], out = a[2];
  const mobile = a.includes('--mobile');
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html') + (id === 'home' ? '' : '#' + id));
  await page.waitForTimeout(400);
  const bs = await page.$$('#chooser:not([hidden]) #cOpts button'); if (bs.length) await bs[a.includes('--p2') && bs[1] ? 1 : 0].click();
  await page.waitForTimeout(200);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--click') { const [x, y] = a[i + 1].split(',').map(Number); await page.mouse.click(x, y); await page.waitForTimeout(150); }
    if (a[i] === '--key') { await page.keyboard.press(a[i + 1]); await page.waitForTimeout(100); }
    if (a[i] === '--hold') { await page.keyboard.down(a[i + 1]); }
    if (a[i] === '--wait') { await page.waitForTimeout(+a[i + 1]); }
  }
  await page.waitForTimeout(ms);
  await page.screenshot({ path: out, fullPage: a.includes('--full') });
  if (errs.length) console.log('ERRORS:', errs.slice(0, 5).join(' | ')); else console.log('ok');
  await browser.close();
})();
