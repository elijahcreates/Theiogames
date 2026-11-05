// Smoke test: open every game, interact, check for JS errors.
// Usage: node tools/smoke.js [id ...] [--shots DIR] [--mobile] [--p2]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const si = args.indexOf('--shots'); const shotDir = si >= 0 ? args[si + 1] : null;
  const only = args.filter((a, i) => !a.startsWith('--') && !(si >= 0 && i === si + 1));
  const mobile = args.includes('--mobile'), p2 = args.includes('--p2');
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(url); await page.waitForTimeout(500);
  if (errs.length) console.log('HOME ERRORS', errs);
  if (shotDir) await page.screenshot({ path: shotDir + '/home.png' });
  const ids = await page.evaluate(() => TheIOGames.games.map(g => g.id));
  console.log('games:', ids.length);
  const chooser = async () => { const bs = await page.$$('#chooser:not([hidden]) #cOpts button'); if (bs.length) { await bs[p2 && bs[1] ? 1 : 0].click(); await page.waitForTimeout(150); return true; } return false; };
  for (const id of ids) {
    if (only.length && !only.includes(id)) continue;
    errs = [];
    await page.evaluate(id => location.hash = id, id);
    await page.waitForTimeout(300);
    await chooser(); await chooser();
    for (let i = 0; i < 14; i++) {
      const x = 200 + (i * 137) % 900, y = 150 + (i * 211) % 520;
      if (mobile) await page.touchscreen.tap(x, y); else { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y - 80, { steps: 4 }); await page.mouse.up(); }
      await page.keyboard.press(['Space', 'ArrowUp', 'ArrowLeft', 'KeyW', 'KeyD', 'ArrowRight', 'Enter', 'KeyA'][i % 8]);
      await page.waitForTimeout(110);
      await chooser();
    }
    await page.keyboard.down('ArrowRight'); await page.keyboard.down('KeyW'); await page.waitForTimeout(600); await page.keyboard.up('ArrowRight'); await page.keyboard.up('KeyW');
    await page.waitForTimeout(400);
    if (shotDir) await page.screenshot({ path: `${shotDir}/${id}.png` });
    await page.keyboard.press('KeyP'); await page.waitForTimeout(80); await page.keyboard.press('KeyP');
    await page.click('#btnRestart').catch(() => {}); await page.waitForTimeout(250);
    await chooser();
    await page.waitForTimeout(250);
    await page.evaluate(() => { history.pushState(null, '', location.pathname); dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForTimeout(150);
    console.log((errs.length ? 'FAIL ' : 'ok   ') + id + (errs.length ? '  ' + errs.slice(0, 3).join(' | ') : ''));
  }
  await browser.close();
})();
