// End-to-end test of the analytics against tools/analytics-dev.mjs (start it first on :8787).
// Simulates human visitors, a fast human, a returning visitor, automated browsers, known bots,
// scripts, no-JS requests and a request burst, then checks the dashboard numbers.
const { chromium } = require('playwright');
const BASE = process.env.TG_BASE || 'http://localhost:8787';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const notWebdriver = () => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });

async function humanVisit(browser, { ip, returning, fast, game, mobile }) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: IPHONE, extraHTTPHeaders: { 'x-test-ip': ip, 'sec-ch-ua': '"Safari";v="17"' } } : { viewport: { width: 1280, height: 800 }, userAgent: CHROME, extraHTTPHeaders: { 'x-test-ip': ip, 'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"' } });
  await ctx.addInitScript(notWebdriver);
  if (returning) await ctx.addInitScript(() => { if (!localStorage.getItem('tg_vid')) { localStorage.setItem('tg_vid', 'returningvisitor01'); localStorage.setItem('tg_first', '2026-01-01'); } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/'); await sleep(2700);
  if (mobile) { await p.touchscreen.tap(200, 400); await sleep(300); }
  else { for (let i = 0; i < 25; i++) { await p.mouse.move(300 + Math.sin(i / 3) * 200, 300 + Math.cos(i / 2) * 150); await sleep(fast ? 5 : 30); } }
  if (game) { await p.evaluate(g => { location.hash = '#' + g; }, game); await sleep(fast ? 4000 : 6000); await p.keyboard.press('Space'); await p.keyboard.press('KeyD'); await sleep(500); await p.evaluate(() => { location.hash = ''; }); }
  await sleep(fast ? 3500 : 3500);
  await p.close(); await sleep(300); await ctx.close();
}
async function automatedVisit(browser, ip) {          // Playwright as-is: navigator.webdriver === true
  const ctx = await browser.newContext({ userAgent: CHROME, extraHTTPHeaders: { 'x-test-ip': ip } }); const p = await ctx.newPage();
  await p.goto(BASE + '/'); await sleep(3000); await p.close(); await ctx.close();
}
const raw = (ua, ip, extra = {}) => fetch(BASE + '/', { headers: { 'user-agent': ua, 'x-test-ip': ip, ...extra } }).then(r => r.text());
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

(async () => {
  const browser = await chromium.launch();
  await Promise.all([
    humanVisit(browser, { ip: '10.0.0.1', game: 'slope' }),
    humanVisit(browser, { ip: '10.0.0.2', game: 'hammer', returning: true }),
    humanVisit(browser, { ip: '10.0.0.3', fast: true, game: 'snake' }),      // fast browsing is still human
    humanVisit(browser, { ip: '10.0.0.4', mobile: true }),
    automatedVisit(browser, '10.0.0.9'),
  ]);
  await raw('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '66.249.66.1');
  await raw('WhatsApp/2.23.20.0', '31.13.1.1');
  await raw('python-requests/2.31.0', '5.5.5.5');
  await raw('Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)', '20.1.1.1');
  await raw(BROWSER_UA, '7.7.7.7', { 'sec-fetch-mode': 'navigate', 'accept-language': 'en-US' });   // browser-like, no JS -> uncertain
  for (let i = 0; i < 24; i++) await raw(BROWSER_UA, '9.9.9.9', { 'sec-fetch-mode': 'navigate', 'accept-language': 'en' });   // burst, no JS -> bot
  await sleep(1500);
  const s = await (await fetch(BASE + '/.netlify/functions/tg-stats?range=today', { headers: { 'x-tg-key': 'testkey' } })).json();
  console.log(JSON.stringify({ totals: s.totals, visitors: s.visitors, online: s.online, avgTimeSec: s.avgTimeSec, games: s.games, pages: s.pages, botCats: s.botCats, devices: s.devices }, null, 1));
  console.log(s.reasons.map(r => `${r.v}  ${r.k}`).join('\n'));
  const expect = { human: 4, bot: 1 + 4 + 24, uncertain: 1 };   // 1 webdriver browser + 4 known bots/scripts + 24-request burst
  const okAll = s.totals.human === expect.human && s.totals.bot === expect.bot && s.totals.uncertain === expect.uncertain && s.visitors.returning === 1;
  console.log(okAll ? 'PASS: classification matches the expected human/bot/uncertain split' : `FAIL: expected ${JSON.stringify(expect)}`);
  await browser.close(); process.exit(okAll ? 0 : 1);
})();
