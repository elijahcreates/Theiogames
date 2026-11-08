// Builds og-image.jpg (1200x630) – the link-preview picture for WhatsApp, Facebook, X, iMessage…
// Uses the arcade's own generated game thumbnails. Run after ./tools/build.sh:  node tools/make-og-image.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(2600); // let the intro splash finish and the honeycomb render
  // grab thumbnails (data URLs) from the game tiles, hottest games first
  const thumbs = await p.$$eval('.hottest .hx img, #allGames .hx img', a => [...new Set(a.map(i => i.src))].slice(0, 40));
  const W = 1200, H = 630;
  await p.setViewportSize({ width: W, height: H });
  await p.setContent(`<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="${W}" height="${H}"></canvas></body></html>`);
  await p.evaluate(async ({ thumbs, W, H }) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    const imgs = await Promise.all(thumbs.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; })));
    const hexPath = (cx, cy, w) => { const h = w * 1.1547; x.beginPath(); x.moveTo(cx, cy - h / 2); x.lineTo(cx + w / 2, cy - h / 4); x.lineTo(cx + w / 2, cy + h / 4); x.lineTo(cx, cy + h / 2); x.lineTo(cx - w / 2, cy + h / 4); x.lineTo(cx - w / 2, cy - h / 4); x.closePath(); };
    // background
    let g = x.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.5, W * 0.75);
    g.addColorStop(0, '#3b1d8f'); g.addColorStop(0.45, '#170f45'); g.addColorStop(1, '#04050f');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // faint hex grid
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2;
    for (let r = -1; r < 9; r++) for (let q = -1; q < 14; q++) { const w = 96, cx = q * w + (r % 2 ? w / 2 : 0), cy = r * w * 0.866; hexPath(cx, cy, w - 6); x.stroke(); }
    // honeycomb of game thumbnails on both sides
    const tw = 150, th = tw * 1.1547, stepY = th * 0.75 + 8, cols = 10, rows = 5;
    let k = 0;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const cx = q * (tw + 8) + (r % 2 ? (tw + 8) / 2 : 0) - 40, cy = r * stepY - 30;
      const dc = Math.abs(cx - W / 2) / (W / 2); // 0 centre … 1 edge
      if (dc < 0.36) continue;                    // keep the centre clear for the logo & text
      const img = imgs[k++ % imgs.length]; if (!img) continue;
      x.save(); hexPath(cx, cy, tw); x.clip(); x.drawImage(img, cx - tw / 2, cy - th / 2, tw, th); x.restore();
      x.save(); hexPath(cx, cy, tw); x.strokeStyle = `hsla(${(k * 47) % 360},90%,65%,.9)`; x.lineWidth = 4; x.shadowColor = x.strokeStyle; x.shadowBlur = 14; x.stroke(); x.restore();
    }
    // darken toward the centre so text pops
    g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(4,5,15,.15)'); g.addColorStop(0.3, 'rgba(10,8,35,.85)'); g.addColorStop(0.5, 'rgba(14,10,48,.95)'); g.addColorStop(0.7, 'rgba(10,8,35,.85)'); g.addColorStop(1, 'rgba(4,5,15,.15)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W / 2, 250, 10, W / 2, 250, 330); g.addColorStop(0, 'rgba(124,92,255,.45)'); g.addColorStop(1, 'rgba(124,92,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // logo hexagon with rainbow border
    const lw = 150, lcx = W / 2, lcy = 170;
    x.save(); x.shadowColor = 'rgba(0,212,255,.8)'; x.shadowBlur = 40; hexPath(lcx, lcy, lw);
    const cg = x.createConicGradient ? x.createConicGradient(0, lcx, lcy) : null;
    if (cg) { ['#7c5cff', '#00d4ff', '#22c55e', '#fde047', '#f97316', '#ec4899', '#7c5cff'].forEach((col, i, a) => cg.addColorStop(i / (a.length - 1), col)); x.fillStyle = cg; } else x.fillStyle = '#7c5cff';
    x.fill(); x.restore();
    hexPath(lcx, lcy, lw - 18); x.fillStyle = '#120d33'; x.fill();
    g = x.createLinearGradient(lcx - 50, 0, lcx + 50, 0); g.addColorStop(0, '#a78bfa'); g.addColorStop(1, '#22d3ee');
    x.fillStyle = g; x.font = '900 74px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('IO', lcx, lcy + 4);
    // title: "TheIOGames – Free Online Games"
    x.textBaseline = 'alphabetic'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 18;
    x.font = '900 92px Inter, sans-serif';
    const parts = [['The', '#ffffff'], ['IO', null], ['Games', '#ffffff']], widths = parts.map(([t]) => x.measureText(t).width), tot = widths.reduce((a, b) => a + b, 0);
    let tx = W / 2 - tot / 2; x.textAlign = 'left';
    parts.forEach(([t, col], i) => { if (col) x.fillStyle = col; else { const gg = x.createLinearGradient(tx, 0, tx + widths[i], 0); gg.addColorStop(0, '#7c5cff'); gg.addColorStop(1, '#00d4ff'); x.fillStyle = gg; } x.fillText(t, tx, 382); tx += widths[i]; });
    x.textAlign = 'center'; x.font = '800 52px Inter, sans-serif'; x.fillStyle = '#5eead4'; x.fillText('– Free Online Games', W / 2, 452);
    x.shadowBlur = 0;
    // pill
    const pill = '🎮  58 games  •  No downloads  •  Play instantly';
    x.font = '700 28px Inter, sans-serif'; const pw = x.measureText(pill).width + 56, px = W / 2 - pw / 2, py = 498;
    x.beginPath(); x.roundRect(px, py, pw, 56, 28); x.fillStyle = 'rgba(255,255,255,.1)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#e2e8f0'; x.textBaseline = 'middle'; x.fillText(pill, W / 2, py + 29);
  }, { thumbs, W, H });
  const el = await p.$('#c');
  await el.screenshot({ path: path.resolve(__dirname, '../og-image.jpg'), type: 'jpeg', quality: 86 });
  await b.close();
  console.log('wrote og-image.jpg from', thumbs.length, 'thumbnails');
})();
