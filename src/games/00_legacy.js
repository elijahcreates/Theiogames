/* =====================================================================
   GAME 1 — HOLE  (swallow the city)
   ===================================================================== */
function createHole(E) {
  const HALF = 1560, ROAD = 140, PITCH = 520, B = 380, ROUND = 150;
  const objs = [], holes = [], fx = [], blocks = [];
  let time = 0, left = ROUND, over = false, player = null;
  const cam = E.cam;

  function mk(type, x, y, w, d, h, hue, sat, lit, val) {
    const size = Math.max(w, d) / 2;
    const o = { type, x, y, w, d, h, size, val: val !== undefined ? val : size * size / 50, fall: -1, fh: null, vx: 0, vy: 0, seed: Math.random(),
      top: hsl(hue, sat, Math.min(92, lit + 14)), front: hsl(hue, sat, Math.max(8, lit - 4)), hue, sat, lit };
    objs.push(o); return o;
  }
  const HOUSE = [[8, 70, 62], [40, 78, 62], [198, 60, 60], [150, 42, 56], [330, 55, 66], [28, 66, 58], [262, 45, 66]];
  const ROOF = [[8, 65, 40], [215, 35, 32], [28, 55, 36], [350, 55, 38]];
  function house(x, y) {
    const c = pick(HOUSE), r = pick(ROOF), w = rand(46, 62), d = rand(46, 62);
    const o = mk('house', x, y, w, d, rand(26, 44), c[0], c[1], c[2]); o.top = hsl(r[0], r[1], r[2]);
  }
  function shop(x, y) {
    const hue = pick([210, 200, 28, 275, 170, 350]), w = rand(96, 130), d = rand(96, 130);
    mk('shop', x, y, w, d, rand(56, 96), hue, 45, 52);
  }
  function tower(x, y) {
    const hue = pick([205, 215, 190, 240]), w = rand(130, 168), d = rand(130, 168);
    mk('tower', x, y, w, d, rand(150, 230), hue, 38, 44);
  }
  const tree = (x, y) => mk('tree', x, y, 14, 14, rand(22, 32), pick([112, 128, 98]), 55, 38);
  const bin = (x, y) => mk('bin', x, y, 10, 10, 14, pick([145, 200, 12]), 50, 42, 0.8);
  const bench = (x, y) => mk('bench', x, y, 26, 11, 9, 28, 55, 45, 1.4);
  const person = (x, y) => mk('person', x, y, 8, 8, 15, irand(0, 359), 70, 55, 0.3);
  function car(x, y, horiz) {
    const hue = pick([0, 210, 50, 120, 280, 25, 190, 0]), sat = pick([70, 70, 5, 70]), lit = sat < 20 ? pick([85, 20, 60]) : 50;
    const o = mk('car', x, y, horiz ? 38 : 21, horiz ? 21 : 38, 12, hue, sat, lit); o.horiz = horiz; return o;
  }
  function populate(cx, cy) {
    const dd = Math.hypot(cx, cy), roll = Math.random(); let kind;
    if (dd < 600) kind = roll < 0.55 ? 'res' : roll < 0.8 ? 'park' : 'lot';
    else if (dd < 1200) kind = roll < 0.25 ? 'res' : roll < 0.65 ? 'shop' : roll < 0.75 ? 'park' : roll < 0.87 ? 'lot' : 'tower';
    else kind = roll < 0.15 ? 'res' : roll < 0.45 ? 'shop' : roll < 0.85 ? 'tower' : 'park';
    blocks.push({ x: cx, y: cy, kind });
    const s = 88;
    if (kind === 'res') { for (const [ax, ay] of [[-s, -s], [s, -s], [-s, s], [s, s]]) house(cx + ax + rand(-8, 8), cy + ay + rand(-8, 8)); for (let i = 0; i < 3; i++) tree(cx + rand(-160, 160), cy + rand(-160, 160)); }
    else if (kind === 'shop') { for (const [ax, ay] of [[-s, -s], [s, -s], [-s, s], [s, s]]) shop(cx + ax, cy + ay); }
    else if (kind === 'tower') { tower(cx, cy); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; (Math.random() < .5 ? tree : bin)(cx + Math.cos(a) * 165, cy + Math.sin(a) * 165); } }
    else if (kind === 'park') { for (let i = 0; i < irand(7, 10); i++) tree(cx + rand(-165, 165), cy + rand(-165, 165)); bench(cx + rand(-60, 60), cy + rand(-60, 60)); bench(cx + rand(-60, 60), cy + rand(-60, 60)); for (let i = 0; i < 6; i++) person(cx + rand(-150, 150), cy + rand(-150, 150)); }
    else { for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) if (Math.random() < 0.85) car(cx - 120 + i * 60, cy - 55 + r * 110, true); }
    for (let i = 0; i < irand(3, 6); i++) { const side = irand(0, 3), t = rand(-175, 175); const px = side < 2 ? t : (side === 2 ? -178 : 178), py = side < 2 ? (side === 0 ? -178 : 178) : t; person(cx + px, cy + py); }
    for (let i = 0; i < 2; i++) { const side = irand(0, 3), t = rand(-175, 175); const px = side < 2 ? t : (side === 2 ? -180 : 180), py = side < 2 ? (side === 0 ? -180 : 180) : t; (Math.random() < .6 ? bin : tree)(cx + px, cy + py); }
  }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) populate((i - 2.5) * PITCH, (j - 2.5) * PITCH);
  for (let i = 0; i < 90; i++) {
    const horiz = Math.random() < 0.5, road = (irand(0, 6) - 3) * PITCH, lane = rand(-1, 1) < 0 ? -26 : 26, pos = rand(-HALF, HALF);
    const c = horiz ? car(pos, road + lane, true) : car(road + lane, pos, false);
    const sp = rand(60, 110) * (lane < 0 ? -1 : 1); if (horiz) c.vx = sp; else c.vy = sp;
  }

  /* ---- holes ---- */
  const NAMES = ['Voidzilla', 'Maw', 'Gulp', 'Abyss'], COLS = ['#f472b6', '#facc15', '#a78bfa', '#fb923c'];
  function hole(ai, name, color) { const h = { ai, name, color, x: 0, y: 0, vx: 0, vy: 0, mass: 0, r: 26, tr: 26, dir: { x: 0, y: 0, mag: 0 }, think: 0, dead: false, respawn: 0, prot: 2.5, tx: 0, ty: 0, wander: 0 }; holes.push(h); return h; }
  function placeHole(h) {
    let best = null, bd = -1;
    for (let i = 0; i < 8; i++) {
      const x = (irand(0, 4) - 2) * PITCH, y = (irand(0, 4) - 2) * PITCH; let md = 1e9;
      for (const o of holes) { if (o === h || o.dead) continue; md = Math.min(md, Math.hypot(o.x - x, o.y - y)); }
      if (md > bd) { bd = md; best = { x, y }; }
    }
    h.x = best.x; h.y = best.y; h.vx = h.vy = 0;
  }
  player = hole(false, 'You', '#22d3ee'); player.x = 0; player.y = 0;
  for (let i = 0; i < 3; i++) { const h = hole(true, NAMES[i], COLS[i]); placeHole(h); h.mass = rand(0, 6); h.r = h.tr = 26 + 3.4 * Math.sqrt(h.mass); h.prot = 1; }

  function thinkHole(h, dt) {
    h.think -= dt; if (h.think > 0) return; h.think = rand(0.3, 0.6);
    const r = h.r; let fxv = 0, fyv = 0, flee = false, prey = null, pd = 1e9;
    for (const o of holes) {
      if (o === h || o.dead) continue; const dx = o.x - h.x, dy = o.y - h.y, d = Math.hypot(dx, dy) || 1;
      if (o.r > r * 1.2 && d < r * 3 + o.r + 220) { flee = true; fxv -= dx / d; fyv -= dy / d; }
      else if (r > o.r * 1.3 && d < 520 && d < pd && o.prot <= 0) { prey = o; pd = d; }
    }
    let tx = null, ty = null, best = 1e18;
    if (!flee) {
      if (prey) { tx = prey.x; ty = prey.y; }
      else {
        for (const o of objs) {
          if (o.fall >= 0 || o.size > r * 0.8) continue;
          const dx = o.x - h.x, dy = o.y - h.y, d2 = dx * dx + dy * dy; if (d2 > 1000 * 1000) continue;
          const sc = d2 / (o.val + 1); if (sc < best) { best = sc; tx = o.x; ty = o.y; }
        }
      }
    }
    let dx, dy;
    if (flee) { dx = fxv; dy = fyv; }
    else if (tx !== null) { dx = tx - h.x; dy = ty - h.y; }
    else { h.wander += rand(-1, 1); dx = Math.cos(h.wander); dy = Math.sin(h.wander); }
    let m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const wl = 260; if (h.x > HALF - wl) dx -= 1.5; if (h.x < -HALF + wl) dx += 1.5; if (h.y > HALF - wl) dy -= 1.5; if (h.y < -HALF + wl) dy += 1.5;
    m = Math.hypot(dx, dy) || 1; h.dir = { x: dx / m, y: dy / m, mag: 1 };
  }
  function respawn(h) { placeHole(h); h.dead = false; h.prot = 2.5; h.mass = Math.max(h.mass, 2); h.r = h.tr = 26 + 3.4 * Math.sqrt(h.mass); }

  function update(dt) {
    time += dt;
    if (!over) { left -= dt; if (left <= 0) { left = 0; finish(); } }
    player.dir = over ? { x: 0, y: 0, mag: 0 } : E.dir();
    for (const h of holes) {
      if (h.dead) { h.respawn -= dt; if (h.respawn <= 0) respawn(h); continue; }
      h.prot -= dt; if (h.ai) thinkHole(h, dt);
      const sp = Math.min(340, 175 + h.r * 0.9), d = h.dir, k = Math.min(1, dt * 8);
      h.vx += (d.x * d.mag * sp - h.vx) * k; h.vy += (d.y * d.mag * sp - h.vy) * k;
      h.x = clamp(h.x + h.vx * dt, -HALF, HALF); h.y = clamp(h.y + h.vy * dt, -HALF, HALF);
      h.tr = 26 + 3.4 * Math.sqrt(h.mass); h.r += (h.tr - h.r) * Math.min(1, dt * 5);
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.fall >= 0) {
        o.fall += dt / 0.4; const h = o.fh, k = Math.min(1, dt * 9); o.x += (h.x - o.x) * k; o.y += (h.y - o.y) * k;
        if (o.fall >= 1) { objs[i] = objs[objs.length - 1]; objs.pop(); } continue;
      }
      if (o.vx || o.vy) {
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x > HALF + 60) o.x = -HALF - 60; else if (o.x < -HALF - 60) o.x = HALF + 60;
        if (o.y > HALF + 60) o.y = -HALF - 60; else if (o.y < -HALF - 60) o.y = HALF + 60;
      }
      for (const h of holes) {
        if (h.dead || o.size > h.r * 0.8) continue;
        const dx = o.x - h.x, dy = o.y - h.y, lim = h.r - o.size * 0.3;
        if (dx * dx + dy * dy < lim * lim) {
          o.fall = 0; o.fh = h; h.mass += o.val;
          if (h === player) { E.sound('swallow', 50); if (o.val >= 1) fx.push({ x: h.x, y: h.y - h.r, t: 0, text: '+' + Math.max(1, Math.round(o.val * 10)) }); }
          break;
        }
      }
    }
    for (const a of holes) for (const b of holes) {
      if (a === b || a.dead || b.dead || b.prot > 0) continue;
      if (a.r > b.r * 1.25 && Math.hypot(a.x - b.x, a.y - b.y) < a.r - b.r * 0.4) {
        a.mass += b.mass * 0.5; b.mass = Math.max(2, b.mass * 0.4); b.dead = true; b.respawn = 2.2;
        if (b === player) { E.sound('bad', 0); fx.push({ x: b.x, y: b.y, t: 0, text: 'Eaten by ' + a.name + '!', big: true }); }
        else if (a === player) { E.sound('grow', 0); fx.push({ x: a.x, y: a.y - a.r, t: 0, text: 'Swallowed ' + b.name + '!', big: true }); }
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; fx[i].y -= 40 * dt; if (fx[i].t > 1.3) fx.splice(i, 1); }
    const scr = E.screenScale();
    E.follow(player.x, player.y, clamp(Math.pow(42 / player.r, 0.55), 0.18, 1.5) * scr, dt, time < 0.05);
  }
  function finish() {
    over = true; const sorted = holes.slice().sort((a, b) => b.mass - a.mass), rank = sorted.indexOf(player) + 1;
    E.gameOver({ score: player.mass * 10, title: rank === 1 ? '🏆 You Won!' : "Time's Up!", win: rank === 1, lines: ['Rank #' + rank + ' of ' + holes.length, 'Hole size: ' + Math.round(player.r)] });
  }

  /* ---- drawing ---- */
  function drawBox(o) {
    const w = o.w, d = o.d, h = o.h, x0 = o.x - w / 2, y1 = o.y + d / 2;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x0 + h * 0.3, y1 - d + h * 0.1, w, d);
    ctx.fillStyle = o.front; ctx.fillRect(x0, y1 - h, w, h);
    ctx.fillStyle = o.top; ctx.fillRect(x0, y1 - h - d, w, d);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.4; ctx.strokeRect(x0, y1 - h - d, w, d + h);
    if ((o.type === 'shop' || o.type === 'tower') && E.cam.zoom > 0.3) {
      const cols = Math.max(2, Math.floor(w / 24)), rows = Math.max(2, Math.floor((h - 10) / 22)), cw = (w - 12) / cols, ch = (h - 12) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const lit = ((o.seed * 1000 + r * 7 + c * 13) % 5) < 2;
        ctx.fillStyle = lit ? 'rgba(255,238,150,.85)' : 'rgba(255,255,255,.28)';
        ctx.fillRect(x0 + 6 + c * cw + 2, y1 - h + 6 + r * ch + 2, cw - 4, ch - 5);
      }
    } else if (o.type === 'house') {
      ctx.fillStyle = 'rgba(80,45,20,.8)'; ctx.fillRect(o.x - 5, y1 - 13, 10, 13); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x0 + 6, y1 - h * 0.6, 8, 8); ctx.fillRect(x0 + w - 14, y1 - h * 0.6, 8, 8);
    } else if (o.type === 'car') {
      ctx.fillStyle = 'rgba(20,30,50,.75)';
      if (o.horiz) ctx.fillRect(o.x - w * 0.2, y1 - h - d + 3, w * 0.4, d - 6); else ctx.fillRect(o.x - w / 2 + 3, o.y - d * 0.2 - h, w - 6, d * 0.4);
    }
  }
  function drawObj(o) {
    ctx.save();
    if (o.fall >= 0) {
      const s = 1 - 0.85 * o.fall; ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.translate(-o.x, -o.y); ctx.globalAlpha = 1 - o.fall * 0.5;
    }
    if (o.type === 'person') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 2, 5, 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = hsl(o.hue, 70, 50); ctx.fillRect(o.x - 3, o.y - 10, 6, 11);
      ctx.fillStyle = '#f5c9a0'; ctx.beginPath(); ctx.arc(o.x, o.y - 13, 3.6, 0, TAU); ctx.fill();
    } else if (o.type === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(o.x + 5, o.y + 2, 11, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7a4b25'; ctx.fillRect(o.x - 2.5, o.y - 10, 5, 11);
      ctx.fillStyle = o.front; ctx.beginPath(); ctx.arc(o.x, o.y - o.h + 4, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = o.top; ctx.beginPath(); ctx.arc(o.x - 2, o.y - o.h + 1, 8.5, 0, TAU); ctx.fill();
    } else drawBox(o);
    ctx.restore();
  }
  function drawHole(h) {
    if (h.dead) return; const r = h.r;
    const g = ctx.createRadialGradient(h.x, h.y, r * 0.15, h.x, h.y, r * 1.18);
    g.addColorStop(0, '#000'); g.addColorStop(0.72, '#06020f'); g.addColorStop(1, 'rgba(30,10,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, r * 1.18, 0, TAU); ctx.fill();
    ctx.lineWidth = Math.max(3, r * 0.09); ctx.strokeStyle = h.color; ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.stroke();
  }
  function draw() {
    E.beginWorld(); const v = E.view(160);
    ctx.fillStyle = '#121a26'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    ctx.fillStyle = '#8fd18a'; ctx.fillRect(-HALF - 90, -HALF - 90, 2 * HALF + 180, 2 * HALF + 180);
    for (const b of blocks) {
      if (b.x + 200 < v.x0 || b.x - 200 > v.x1 || b.y + 200 < v.y0 || b.y - 200 > v.y1) continue;
      ctx.fillStyle = b.kind === 'park' ? '#6fbf6a' : '#cdd3dc'; rr(ctx, b.x - B / 2, b.y - B / 2, B, B, 18); ctx.fill();
      ctx.fillStyle = b.kind === 'park' ? '#7fce78' : '#bcc3ce'; rr(ctx, b.x - B / 2 + 14, b.y - B / 2 + 14, B - 28, B - 28, 12); ctx.fill();
    }
    ctx.fillStyle = '#3a404c';
    for (let k = -3; k <= 3; k++) { const p = k * PITCH; ctx.fillRect(p - ROAD / 2, -HALF - 90, ROAD, 2 * HALF + 180); ctx.fillRect(-HALF - 90, p - ROAD / 2, 2 * HALF + 180, ROAD); }
    ctx.strokeStyle = '#f2d95c'; ctx.lineWidth = 4; ctx.setLineDash([28, 26]);
    for (let k = -3; k <= 3; k++) { const p = k * PITCH; ctx.beginPath(); ctx.moveTo(p, -HALF - 90); ctx.lineTo(p, HALF + 90); ctx.moveTo(-HALF - 90, p); ctx.lineTo(HALF + 90, p); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const h of holes) drawHole(h);
    const vis = [];
    for (const o of objs) { if (o.x + 150 < v.x0 || o.x - 150 > v.x1 || o.y + 260 < v.y0 || o.y - 150 > v.y1) continue; vis.push(o); }
    vis.sort((a, b) => a.y - b.y);
    for (const o of vis) drawObj(o);
    for (const h of holes) {
      if (h.dead) continue;
      ctx.globalAlpha = h.prot > 0 ? 0.5 + 0.3 * Math.sin(time * 14) : 0.55; ctx.lineWidth = Math.max(2, h.r * 0.05); ctx.strokeStyle = h.color;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      label(ctx, h.name, h.x, h.y - h.r - 16, clamp(h.r * 0.28, 14, 34), h === player ? '#7df0ff' : '#fff');
    }
    for (const f of fx) { ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); label(ctx, f.text, f.x, f.y, f.big ? 28 : 20, f.big ? '#ffd86b' : '#9dffb0'); ctx.globalAlpha = 1; }
    E.endWorld();
    const bw = Math.min(E.W - 40, 360), pct = left / ROUND;
    ctx.fillStyle = 'rgba(10,12,30,.6)'; rr(ctx, E.W / 2 - bw / 2, E.H - 24 - (isTouchDevice() ? 0 : 0), bw, 8, 4); ctx.fill();
    ctx.fillStyle = pct < 0.2 ? '#fb7185' : '#22d3ee'; rr(ctx, E.W / 2 - bw / 2, E.H - 24, Math.max(8, bw * pct), 8, 4); ctx.fill();
  }
  function hud() {
    const sorted = holes.slice().sort((a, b) => b.mass - a.mass), rank = sorted.indexOf(player) + 1;
    const m = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0');
    return {
      stats: [['⏱ Time', m], ['Score', fmt(player.mass * 10)], ['Rank', '#' + rank], ['Best', fmt(Math.max(E.best(), player.mass * 10))]],
      board: sorted.map(h => ({ n: h.name, s: fmt(h.mass * 10), me: h === player })), boardTitle: 'SIZE RANKING'
    };
  }
  return { update, draw, hud };
}

/* =====================================================================
   GAME 2 — FARMER  (plant, harvest, sell, upgrade)
   ===================================================================== */
function createFarm(E) {
  const WX = 1250, WY = 850, SEASON = 240, PS = 74, GAP = 86;
  const BARN = { x: -330, y: -20, w: 170, d: 100, h: 90 };
  const CROPS = [
    { e: '🌾', name: 'Wheat', g: 7, v: 3 }, { e: '🥕', name: 'Carrots', g: 9, v: 6 }, { e: '🌽', name: 'Corn', g: 11, v: 11 },
    { e: '🍅', name: 'Tomatoes', g: 13, v: 18 }, { e: '🎃', name: 'Pumpkins', g: 16, v: 32 }
  ];
  const UPG = [
    { id: 'boots', icon: '👟', name: 'Speedy Boots', desc: '+12% walking speed', max: 8, cost: l => ({ c: Math.round(35 * Math.pow(1.65, l)) }) },
    { id: 'bag', icon: '🎒', name: 'Big Backpack', desc: '+6 carrying capacity', max: 10, cost: l => ({ c: Math.round(30 * Math.pow(1.55, l)) }) },
    { id: 'hands', icon: '🧤', name: 'Fast Hands', desc: 'Harvest crops faster', max: 6, cost: l => ({ c: Math.round(45 * Math.pow(1.8, l)) }) },
    { id: 'reach', icon: '🧲', name: 'Long Reach', desc: '+14 plant & harvest range', max: 5, cost: l => ({ c: Math.round(55 * Math.pow(1.85, l)) }) },
    { id: 'axe', icon: '🪓', name: 'Sharp Tools', desc: 'Gather wood & stone faster', max: 5, cost: l => ({ c: Math.round(30 * Math.pow(1.7, l)) }) },
    { id: 'seeds', icon: '🌱', name: 'Better Seeds', desc: 'Unlock a more valuable crop', max: 4, cost: l => ({ c: [80, 260, 720, 2000][l], w: [0, 2, 4, 6][l] }) },
    { id: 'land', icon: '🚜', name: 'Expand Farm', desc: '+6 farm plots', max: 7, cost: l => ({ c: Math.round(60 * Math.pow(1.7, l)), w: 2 + l, s: 1 + l }) }
  ];
  const lv = {}; UPG.forEach(u => lv[u.id] = 0);
  let coins = 0, earned = 0, wood = 0, stone = 0, time = 0, left = SEASON, over = false, unlocked = 6;
  const P = { x: BARN.x + 120, y: BARN.y + 110, vx: 0, vy: 0, face: 1, walk: 0, carry: 0, carryN: 0, hT: 0, sT: 0, full: 0 };
  const plots = [], nodes = [], fx = [], tufts = [];
  for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) plots.push({ x: -50 + i * GAP, y: -215 + j * GAP, state: 0, t: 0, g: 8, crop: 0, on: false });
  plots.sort((a, b) => Math.hypot(a.x - 40, a.y) - Math.hypot(b.x - 40, b.y));
  plots.forEach((p, i) => p.on = i < unlocked);
  function nodeSpot() { for (let i = 0; i < 40; i++) { const x = rand(-WX + 80, WX - 80), y = rand(-WY + 80, WY - 80); if (x > -120 && x < 700 && y > -300 && y < 300) continue; if (Math.hypot(x - BARN.x, y - BARN.y) < 200) continue; return { x, y }; } return { x: -WX + 100, y: -WY + 100 }; }
  for (let i = 0; i < 16; i++) { const s = nodeSpot(); nodes.push({ type: 'tree', x: s.x, y: s.y, prog: 0, regrow: 0 }); }
  for (let i = 0; i < 12; i++) { const s = nodeSpot(); nodes.push({ type: 'rock', x: s.x, y: s.y, prog: 0, regrow: 0 }); }
  for (let i = 0; i < 260; i++) tufts.push({ x: rand(-WX, WX), y: rand(-WY, WY), s: rand(6, 16), a: rand(0, 3) });
  const speed = () => 190 * (1 + 0.12 * lv.boots), cap = () => 6 + 6 * lv.bag, reach = () => 48 + 14 * lv.reach;
  const harvestCd = () => 0.4 * Math.pow(0.8, lv.hands), gatherSpd = () => 0.66 * Math.pow(1.3, lv.axe);
  const barnDoor = () => ({ x: BARN.x, y: BARN.y + BARN.d / 2 + 30 });

  function text(x, y, s, color) { fx.push({ x, y, t: 0, s, color: color || '#fff' }); }
  function update(dt) {
    time += dt;
    if (!over) { left -= dt; if (left <= 0) { left = 0; finish(); } }
    const d = over ? { x: 0, y: 0, mag: 0 } : E.dir(), sp = speed(), k = Math.min(1, dt * 10);
    P.vx += (d.x * d.mag * sp - P.vx) * k; P.vy += (d.y * d.mag * sp - P.vy) * k;
    P.x = clamp(P.x + P.vx * dt, -WX + 30, WX - 30); P.y = clamp(P.y + P.vy * dt, -WY + 30, WY - 30);
    const mv = Math.hypot(P.vx, P.vy); if (mv > 20) { P.walk += dt * mv * 0.06; if (Math.abs(P.vx) > 15) P.face = P.vx > 0 ? 1 : -1; }
    for (const p of plots) if (p.on && p.state === 1) { p.t += dt; if (p.t >= p.g) { p.state = 2; p.t = 0; } }
    if (!over) {
      P.sT -= dt; P.hT -= dt; P.full = Math.max(0, P.full - dt);
      const rc = reach();
      if (P.sT <= 0) for (const p of plots) {
        if (p.on && p.state === 0 && Math.hypot(P.x - p.x, P.y - p.y) < rc * 0.9) { p.state = 1; p.t = 0; p.crop = lv.seeds; p.g = CROPS[p.crop].g; P.sT = 0.09; E.sound('chop', 60); break; }
      }
      let best = null, bd = 1e9;
      for (const p of plots) { if (!p.on || p.state !== 2) continue; const dd = Math.hypot(P.x - p.x, P.y - p.y); if (dd < rc + 6 && dd < bd) { bd = dd; best = p; } }
      if (best) {
        if (P.carryN >= cap()) { if (P.full <= 0) { text(P.x, P.y - 50, 'Backpack full! Go to the barn', '#ffb4b4'); E.sound('bad', 400); } P.full = 1.2; }
        else if (P.hT <= 0) {
          const c = CROPS[best.crop]; best.state = 0; best.t = 0; P.carry += c.v; P.carryN++; P.hT = harvestCd();
          text(best.x, best.y - 30, '+' + c.v, '#fff3a0'); E.sound('harvest', 30);
        }
      }
      const bd2 = barnDoor();
      if (P.carryN > 0 && Math.hypot(P.x - bd2.x, P.y - bd2.y) < 110) {
        coins += P.carry; earned += P.carry; text(P.x, P.y - 40, '+' + P.carry + ' 💰', '#ffe36e'); E.sound('coin', 0); P.carry = 0; P.carryN = 0;
      }
      for (const n of nodes) {
        if (n.regrow > 0) { n.regrow -= dt; if (n.regrow <= 0) { n.regrow = 0; n.prog = 0; } continue; }
        if (Math.hypot(P.x - n.x, P.y - n.y) < 66) {
          n.prog += dt * gatherSpd(); if (Math.random() < dt * 5) E.sound('chop', 120);
          if (n.prog >= 1) {
            n.prog = 0; n.regrow = 20;
            if (n.type === 'tree') { wood++; text(n.x, n.y - 50, '+1 🪵', '#e6c28f'); } else { stone++; text(n.x, n.y - 30, '+1 🪨', '#d6dbe6'); }
            E.sound('harvest', 0);
          }
        } else n.prog = Math.max(0, n.prog - dt * 0.6);
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; fx[i].y -= 36 * dt; if (fx[i].t > 1.2) fx.splice(i, 1); }
    E.follow(P.x, P.y, 1.05 * E.screenScale(), dt, time < 0.05);
  }
  function finish() {
    over = true; E.panel.close();
    E.gameOver({ score: earned, title: '🌾 Season Over!', win: true, scoreLabel: 'COINS EARNED', lines: [unlocked + ' plots farmed', 'Best crop: ' + CROPS[lv.seeds].e + ' ' + CROPS[lv.seeds].name, 'Total upgrades: ' + Object.values(lv).reduce((a, b) => a + b, 0)] });
  }

  /* ---- shop ---- */
  const shopEl = document.createElement('div');
  shopEl.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b && !b.disabled) buy(+b.dataset.i); });
  function costOf(u) { return u.cost(lv[u.id]); }
  function canBuy(u) { if (lv[u.id] >= u.max) return false; const c = costOf(u); return coins >= (c.c || 0) && wood >= (c.w || 0) && stone >= (c.s || 0); }
  function buy(i) {
    const u = UPG[i]; if (!canBuy(u)) { E.sound('bad', 0); return; }
    const c = costOf(u); coins -= c.c || 0; wood -= c.w || 0; stone -= c.s || 0; lv[u.id]++;
    if (u.id === 'land') { unlocked = Math.min(plots.length, unlocked + 6); plots.forEach((p, k) => p.on = k < unlocked); }
    E.sound('coin', 0); renderShop();
  }
  function renderShop() {
    let h = `<div class="shopres"><span>💰 ${fmt(coins)}</span><span>🪵 ${wood}</span><span>🪨 ${stone}</span><span>🎒 ${P.carryN}/${cap()}</span></div><div class="shopgrid">`;
    UPG.forEach((u, i) => {
      const l = lv[u.id], maxed = l >= u.max, c = costOf(u);
      let desc = u.desc; if (u.id === 'seeds' && !maxed) desc = 'Unlock ' + CROPS[l + 1].e + ' ' + CROPS[l + 1].name + ' (worth ' + CROPS[l + 1].v + ' each)';
      let costs = '';
      if (!maxed) { costs += `<span class="${coins >= (c.c || 0) ? '' : 'no'}">💰 ${fmt(c.c || 0)}</span>`; if (c.w) costs += `<span class="${wood >= c.w ? '' : 'no'}">🪵 ${c.w}</span>`; if (c.s) costs += `<span class="${stone >= c.s ? '' : 'no'}">🪨 ${c.s}</span>`; }
      h += `<div class="up"><h4><i>${u.icon}</i>${u.name}<span class="lv">${maxed ? 'MAX' : 'Lv ' + l + '/' + u.max}</span></h4><small>${desc}</small><div class="costs">${maxed ? '<span>Maxed out!</span>' : costs}</div><button data-i="${i}" ${canBuy(u) ? '' : 'disabled'}>${maxed ? 'Maxed' : 'Buy'}</button></div>`;
    });
    shopEl.innerHTML = h + '</div>';
  }
  function openShop() { if (over) return; renderShop(); E.panel.open('🛒 Farm Shop', shopEl); }

  /* ---- drawing ---- */
  function drawBarn() {
    const x0 = BARN.x - BARN.w / 2, y1 = BARN.y + BARN.d / 2, h = BARN.h;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x0 + 24, y1 - BARN.d + 8, BARN.w, BARN.d);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x0, y1 - h, BARN.w, h);
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(x0 - 6, y1 - h - BARN.d, BARN.w + 12, BARN.d);
    ctx.fillStyle = '#9b2c20'; ctx.fillRect(x0 - 6, y1 - h - BARN.d, BARN.w + 12, 10);
    ctx.fillStyle = '#f5e6c8'; ctx.fillRect(BARN.x - 30, y1 - 64, 60, 64);
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 5; ctx.strokeRect(BARN.x - 30, y1 - 64, 60, 64); ctx.beginPath(); ctx.moveTo(BARN.x - 30, y1 - 64); ctx.lineTo(BARN.x + 30, y1); ctx.moveTo(BARN.x + 30, y1 - 64); ctx.lineTo(BARN.x - 30, y1); ctx.stroke();
    label(ctx, 'SELL HERE', BARN.x, y1 - h - BARN.d / 2, 20, '#ffe9a8');
    const bd = barnDoor(); ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.strokeStyle = P.carryN > 0 ? 'rgba(255,230,110,.9)' : 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(bd.x, bd.y, 100 + (P.carryN > 0 ? Math.sin(time * 5) * 6 : 0), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawFarmer() {
    const bob = Math.sin(P.walk) * 2.2, f = P.face; ctx.save(); ctx.translate(P.x, P.y);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 16, 16, 6, 0, 0, TAU); ctx.fill(); ctx.translate(0, -Math.abs(bob));
    const fill = Math.min(1, P.carryN / cap());
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(-f * 12, 3, 8 + 5 * fill, 10 + 5 * fill, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.ellipse(0, 4, 11, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fcd7b0'; ctx.beginPath(); ctx.arc(0, -11, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.ellipse(0, -15, 17, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -17, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-8, -18, 16, 3);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(f * 3.5, -11, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function draw() {
    E.beginWorld(); const v = E.view(120);
    ctx.fillStyle = '#3f7d36'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    ctx.fillStyle = '#6fbf5a'; ctx.fillRect(-WX, -WY, 2 * WX, 2 * WY);
    for (const t of tufts) { if (t.x < v.x0 || t.x > v.x1 || t.y < v.y0 || t.y > v.y1) continue; ctx.fillStyle = t.a < 1.5 ? '#62b150' : '#7acb64'; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.s, t.s * 0.45, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 10; ctx.strokeRect(-WX, -WY, 2 * WX, 2 * WY);
    ctx.fillStyle = '#d8b878'; rr(ctx, BARN.x - 90, BARN.y + 20, 520, 70, 30); ctx.fill();
    for (const p of plots) {
      if (p.x < v.x0 - 60 || p.x > v.x1 + 60 || p.y < v.y0 - 60 || p.y > v.y1 + 60) continue;
      if (!p.on) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; rr(ctx, p.x - PS / 2, p.y - PS / 2, PS, PS, 10); ctx.stroke(); ctx.setLineDash([]); continue; }
      ctx.fillStyle = p.state === 0 ? '#9a6a3a' : '#7b4f2a'; rr(ctx, p.x - PS / 2, p.y - PS / 2, PS, PS, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,15,.55)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(50,28,10,.4)'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(p.x - PS / 2 + 8, p.y + i * 20); ctx.lineTo(p.x + PS / 2 - 8, p.y + i * 20); ctx.stroke(); }
      if (p.state >= 1) {
        const c = CROPS[p.crop], pr = p.state === 2 ? 1 : p.t / p.g, s = (22 + 40 * pr) * (p.state === 2 ? 1 + 0.06 * Math.sin(time * 6 + p.x) : 1);
        ctx.drawImage(E.sprite(c.e, 64), p.x - s / 2, p.y - s / 2 - (p.state === 2 ? 4 : 0), s, s);
        if (p.state === 2) { ctx.fillStyle = `rgba(255,255,200,${0.5 + 0.4 * Math.sin(time * 7 + p.y)})`; ctx.beginPath(); ctx.arc(p.x + 22, p.y - 22, 3.5, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(p.x - 22, p.y + 28, 44, 5); ctx.fillStyle = '#7dff7d'; ctx.fillRect(p.x - 22, p.y + 28, 44 * pr, 5); }
      }
    }
    drawBarn();
    const list = nodes.concat([P]); list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o === P) { drawFarmer(); continue; }
      if (o.x < v.x0 - 80 || o.x > v.x1 + 80 || o.y < v.y0 - 80 || o.y > v.y1 + 120) continue;
      const tree = o.type === 'tree', sz = tree ? 96 : 58;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + sz * 0.3, sz * 0.4, sz * 0.14, 0, 0, TAU); ctx.fill();
      if (o.regrow > 0) { ctx.globalAlpha = 0.6; ctx.drawImage(E.sprite(tree ? '🪵' : '⚪', 64), o.x - 18, o.y - 14, 36, 36); ctx.globalAlpha = 1; }
      else {
        ctx.drawImage(E.sprite(tree ? '🌳' : '🪨', 128), o.x - sz / 2, o.y - sz / 2 - (tree ? 20 : 0), sz, sz);
        if (o.prog > 0.02) { ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, o.x - 24, o.y - sz - 6, 48, 8, 4); ctx.fill(); ctx.fillStyle = '#ffd86b'; rr(ctx, o.x - 24, o.y - sz - 6, Math.max(6, 48 * o.prog), 8, 4); ctx.fill(); }
      }
    }
    for (const f of fx) { ctx.globalAlpha = clamp(1.2 - f.t, 0, 1); label(ctx, f.s, f.x, f.y, 20, f.color); ctx.globalAlpha = 1; }
    E.endWorld();
    const pr = 1 - left / SEASON; if (pr > 0.5) { ctx.fillStyle = `rgba(255,140,40,${(pr - 0.5) * 0.28})`; ctx.fillRect(0, 0, E.W, E.H); }
  }
  function hud() {
    const m = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0');
    return { stats: [['⏱ Time', m], ['💰 Coins', fmt(coins)], ['🎒 Bag', P.carryN + '/' + cap()], ['🪵 Wood', wood], ['🪨 Stone', stone], ['Earned', fmt(earned)], ['Best', fmt(Math.max(E.best(), earned))]] };
  }
  const g = {
    update, draw, hud, extra: { label: '🛒 Shop (U)', action: openShop },
    debug: () => ({ P, plots, nodes, barnDoor: barnDoor(), coins, earned, wood, stone, lv, cap: cap(), unlocked }),
    onKey(code) { if (code === 'KeyU' || code === 'KeyB') openShop(); }
  };
  return g;
}

/* =====================================================================
   Shared "blob arena" (powers Chicken + Cell games)
   ===================================================================== */
function blobArena(cfg) {
  return function create(E) {
    const S = cfg.size, H2 = S / 2, ctx = E.ctx;
    const blobs = [], foods = [], viruses = [], fx = [];
    let time = 0, over = false, player = null, shake = 0, killer = '';
    const names = cfg.names.slice().sort(() => Math.random() - 0.5);
    const rad = b => cfg.radius(b.m);
    function spawnBlob(b, m) {
      let best = null, bd = -1;
      for (let i = 0; i < 8; i++) {
        const p = { x: rand(-H2 * 0.92, H2 * 0.92), y: rand(-H2 * 0.92, H2 * 0.92) }; let md = 1e9;
        for (const o of blobs) { if (o === b || o.dead) continue; const d = Math.hypot(o.x - p.x, o.y - p.y) - rad(o); if (d < md) md = d; }
        if (md > bd) { bd = md; best = p; }
      }
      b.x = best.x; b.y = best.y; b.m = m; b.vx = b.vy = 0; b.dead = false; b.prot = b.ai ? 1 : 2.5; b.peak = m; b.think = 0; b.dash = false; b.dir = { x: 0, y: 0, mag: 0 }; b.wa = rand(0, TAU);
    }
    function makeBlob(ai, name) {
      const b = { ai, name, hue: irand(0, 359), ang: rand(0, TAU), aggr: rand(0.35, 1), respawn: 0, wob: rand(0, TAU), x: 0, y: 0, m: 1, vx: 0, vy: 0, dead: true, peak: 1, prot: 0 };
      if (cfg.initBlob) cfg.initBlob(b);
      blobs.push(b); return b;
    }
    player = makeBlob(false, 'You'); if (cfg.initPlayer) cfg.initPlayer(player); spawnBlob(player, cfg.startMass);
    for (let i = 0; i < cfg.aiCount; i++) { const b = makeBlob(true, names[i % names.length]); spawnBlob(b, cfg.startMass * (1 + Math.pow(Math.random(), 2.4) * cfg.aiSpread)); }
    for (let i = 0; i < cfg.foodCount; i++) { const f = {}; cfg.makeFood(f); foods.push(f); }
    for (let i = 0; i < cfg.viruses; i++) viruses.push({ x: rand(-H2 * 0.9, H2 * 0.9), y: rand(-H2 * 0.9, H2 * 0.9), r: cfg.virusR });
    E.follow(player.x, player.y, 1, 0, true);

    function burst(x, y, color, n, spd) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(0.3, 1) * (spd || 160); fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.35, 0.7), t: 0, c: color, s: rand(2.5, 6) }); } }

    function think(b, dt) {
      b.think -= dt; if (b.think > 0) return; b.think = rand(0.18, 0.4);
      const r = rad(b); let fxv = 0, fyv = 0, threat = false, prey = null, pd = 1e9, nt = 1e9;
      for (const o of blobs) {
        if (o === b || o.dead) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy) || 1, ro = rad(o);
        if (o.m > b.m * 1.15) { const range = r * 3 + ro + 300; if (d < range) { const w = (range - d) / range + 0.3; fxv -= dx / d * w; fyv -= dy / d * w; threat = true; if (d < nt) nt = d; } }
        else if (b.m > o.m * 1.25 && d < 650 + r * 2 && d < pd && o.prot <= 0) { prey = o; pd = d; }
      }
      if (cfg.virusR && r > cfg.virusR * 1.2) for (const v of viruses) { const dx = v.x - b.x, dy = v.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < v.r + r + 150) { fxv -= dx / d * 1.5; fyv -= dy / d * 1.5; threat = true; } }
      let dx = 0, dy = 0, dash = false;
      if (threat) { dx = fxv; dy = fyv; dash = cfg.dash && nt < r * 3 + 200; }
      else if (prey && Math.random() < 0.5 + 0.5 * b.aggr) { dx = prey.x + prey.vx * 0.4 - b.x; dy = prey.y + prey.vy * 0.4 - b.y; dash = cfg.dash && pd < r * 3.5 && b.aggr > 0.6; }
      else {
        let bd = 1e18, bf = null; const mr = 560;
        for (const f of foods) { const ax = f.x - b.x; if (ax > mr || ax < -mr) continue; const ay = f.y - b.y; if (ay > mr || ay < -mr) continue; const sc = (ax * ax + ay * ay) / (f.v * f.v); if (sc < bd) { bd = sc; bf = f; } }
        if (bf) { dx = bf.x - b.x; dy = bf.y - b.y; } else { b.wa += rand(-0.7, 0.7); dx = Math.cos(b.wa); dy = Math.sin(b.wa); }
      }
      let m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const wl = 320; if (b.x > H2 - wl) dx -= 1.6; if (b.x < -H2 + wl) dx += 1.6; if (b.y > H2 - wl) dy -= 1.6; if (b.y < -H2 + wl) dy += 1.6;
      m = Math.hypot(dx, dy) || 1; b.dir = { x: dx / m, y: dy / m, mag: 1 }; b.dash = dash;
    }
    function kill(a, c) {
      a.m += c.m * 0.9; c.dead = true; if (c.ai) c.respawn = rand(2, 5); else c.dir = { x: 0, y: 0, mag: 0 };
      burst(c.x, c.y, c.fxColor || hsl(c.hue, 80, 55), 22, 260);
      if (c === player) { over = true; killer = a.name; shake = 1; E.gameOver({ score: Math.floor(player.peak * cfg.scoreMul), title: 'You were eaten!', lines: ['Eaten by ' + a.name, 'Biggest size: ' + fmt(player.peak * cfg.scoreMul)] }); }
      else if (a === player) E.sound('grow', 0);
    }
    function update(dt) {
      time += dt; shake = Math.max(0, shake - dt * 2.5);
      if (!over) { player.dir = E.dir(); player.dash = cfg.dash && E.boost(); }
      const nb = blobs.length;
      for (let i = 0; i < nb; i++) {
        const b = blobs[i];
        if (b.dead) { if (b.ai) { b.respawn -= dt; if (b.respawn <= 0) spawnBlob(b, cfg.startMass * rand(1, 2.5)); } continue; }
        if (b.prot > 0) b.prot -= dt;
        if (b.ai) think(b, dt);
        const r = rad(b), d = b.dir; let sp = cfg.speed(b.m);
        const dashing = b.dash && b.m > cfg.minDashMass && d.mag > 0.05;
        if (dashing) {
          sp *= cfg.dashMul; b.m -= Math.max(0.2, b.m * cfg.dashCost * dt);
          if (Math.random() < dt * 16) burst(b.x - Math.cos(b.ang) * r, b.y - Math.sin(b.ang) * r, '#ffffff', 1, 70);
          if (b === player) E.sound('boost', 90);
        }
        const k = Math.min(1, dt * (dashing ? 9 : 5));
        b.vx += (d.x * d.mag * sp - b.vx) * k; b.vy += (d.y * d.mag * sp - b.vy) * k;
        b.x += b.vx * dt; b.y += b.vy * dt;
        const lim = H2 - r * 0.3; b.x = clamp(b.x, -lim, lim); b.y = clamp(b.y, -lim, lim);
        if (Math.abs(b.vx) + Math.abs(b.vy) > 12) b.ang += angDiff(Math.atan2(b.vy, b.vx), b.ang) * Math.min(1, dt * 10);
        if (b.m > cfg.decayAbove) b.m -= b.m * cfg.decay * dt;
        for (let j = 0; j < foods.length; j++) {
          const f = foods[j], dx = f.x - b.x; if (dx > r || dx < -r) continue; const dy = f.y - b.y; if (dy > r || dy < -r) continue;
          if (dx * dx + dy * dy < r * r) {
            b.m += f.v; if (b === player) { E.sound('eat', 45); if (Math.random() < 0.35) burst(f.x, f.y, f.col || '#fff', 2, 90); }
            cfg.makeFood(f);
          }
        }
        if (cfg.virusR && r > cfg.virusR * 1.2) for (const v of viruses) {
          if (Math.hypot(v.x - b.x, v.y - b.y) < r - v.r * 0.25) {
            b.m *= 0.62; burst(b.x, b.y, '#5dff7a', 20, 280); v.x = rand(-H2 * 0.9, H2 * 0.9); v.y = rand(-H2 * 0.9, H2 * 0.9);
            if (b === player) { E.sound('pop', 0); shake = 0.7; }
          }
        }
        if (b.m > b.peak) b.peak = b.m;
      }
      for (let i = 0; i < nb; i++) {
        const a = blobs[i]; if (a.dead) continue; const ra = rad(a);
        for (let j = 0; j < nb; j++) {
          if (i === j) continue; const c = blobs[j]; if (c.dead || c.prot > 0 || a.m < c.m * 1.2) continue;
          if (Math.hypot(a.x - c.x, a.y - c.y) < ra - rad(c) * 0.35) { kill(a, c); if (a.dead) break; }
        }
      }
      for (let i = fx.length - 1; i >= 0; i--) { const p = fx[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; if (p.t > p.life) fx.splice(i, 1); }
      E.follow(player.x, player.y, cfg.zoom(rad(player)) * E.screenScale(), dt, time < 0.05);
    }
    function draw() {
      const sx = shake > 0 ? rand(-1, 1) * shake * 10 : 0, sy = shake > 0 ? rand(-1, 1) * shake * 10 : 0;
      E.beginWorld(sx, sy); const v = E.view(60);
      cfg.bg(ctx, v, time, S);
      for (const f of foods) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; cfg.drawFood(ctx, f, time); }
      for (const vi of viruses) { if (vi.x < v.x0 - 80 || vi.x > v.x1 + 80 || vi.y < v.y0 - 80 || vi.y > v.y1 + 80) continue; drawVirus(ctx, vi, time); }
      const arr = []; for (const b of blobs) { if (b.dead) continue; const r = rad(b); if (b.x + r < v.x0 || b.x - r > v.x1 || b.y + r < v.y0 || b.y - r > v.y1) continue; arr.push(b); }
      arr.sort((a, b) => a.m - b.m);
      for (const b of arr) cfg.drawBlob(ctx, b, rad(b), time, b === player, b.prot > 0);
      for (const p of fx) { ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; E.endWorld();
    }
    function hud() {
      const alive = blobs.filter(b => !b.dead).sort((a, b) => b.m - a.m), mul = cfg.scoreMul;
      const board = alive.slice(0, 8).map(b => ({ n: b.name, s: fmt(b.m * mul), me: b === player }));
      const idx = alive.indexOf(player); if (idx >= 8) board.push({ rank: idx + 1, n: 'You', s: fmt(player.m * mul), me: true });
      return { stats: [[cfg.statLabel, fmt(player.m * mul)], ['Rank', idx >= 0 ? '#' + (idx + 1) : '—'], ['Best', fmt(Math.max(E.best(), player.peak * mul))]], board, boardTitle: 'LEADERBOARD' };
    }
    return { update, draw, hud };
  };
}
function drawVirus(ctx, v, t) {
  const n = 22, r = v.r; ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + t * 0.1, rr2 = i % 2 ? r * 0.86 : r * (1 + 0.02 * Math.sin(t * 3 + i)); ctx.lineTo(v.x + Math.cos(a) * rr2, v.y + Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fillStyle = '#39e05c'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1b9c38'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(v.x - r * 0.25, v.y - r * 0.25, r * 0.35, 0, TAU); ctx.fill();
}
const BOT_NAMES = ['Blobby', 'Nova', 'Pixel', 'Zippy', 'Mochi', 'Turbo', 'Echo', 'Fuzz', 'Rocket', 'Nugget', 'Glitch', 'Comet', 'Jelly', 'Pogo', 'Waffle', 'Bolt', 'Sprout', 'Orbit', 'Ziggy', 'Panda', 'Mango', 'Ninja', 'Cookie', 'Taco'];

/* =====================================================================
   GAME 3 — CHICKEN
   ===================================================================== */
const CH_PAL = [
  { body: '#fff7e6', wing: '#f1e2c3', tail: '#e8d4aa', line: '#c9b48a' }, { body: '#d9822b', wing: '#b8651a', tail: '#8a4a12', line: '#7a3f0e' },
  { body: '#4a4a5c', wing: '#33333f', tail: '#1c1c24', line: '#101016' }, { body: '#fde047', wing: '#facc15', tail: '#eab308', line: '#a16207' },
  { body: '#f9a8d4', wing: '#f472b6', tail: '#ec4899', line: '#9d174d' }, { body: '#a5f3fc', wing: '#67e8f9', tail: '#22d3ee', line: '#0e7490' }
];
const CH_FOOD = [['🌽', 1, 24, 40], ['🌾', 1, 20, 25], ['🍎', 2, 26, 12], ['🍓', 2, 24, 10], ['🐛', 3, 26, 8], ['🥚', 12, 30, 1.5]];
const chickenFlowers = Array.from({ length: 320 }, () => ({ x: rand(-2250, 2250), y: rand(-2250, 2250), c: pick(['#fff', '#ffd1e8', '#fff3a0', '#d6e8ff']), s: rand(3, 6) }));
registerGame({
  id: 'chicken', title: 'Chicken.io', emoji: '🐔', c1: '#ffb347', c2: '#ff5e62', scoreLabel: 'FINAL SIZE',
  desc: 'Peck corn, apples and worms to grow, dash past bigger birds and gobble up smaller chickens. Climb the farmyard leaderboard!',
  controls: 'WASD / mouse • Space = dash',
  hint: 'Move: WASD / Arrows / mouse  •  Hold SPACE to dash  •  Eat smaller chickens, avoid bigger ones!',
  hintTouch: 'Drag anywhere to steer  •  Hold ⚡ DASH to sprint  •  Eat smaller chickens!', boost: '⚡ DASH',
  create: blobArena({
    size: 4600, aiCount: 16, startMass: 14, aiSpread: 14, foodCount: 650, virusR: 0, viruses: 0, dash: true, minDashMass: 16, dashMul: 1.75, dashCost: 0.035,
    decay: 0.0012, decayAbove: 200, scoreMul: 1, statLabel: 'Size', names: BOT_NAMES,
    radius: m => 12 + 3.4 * Math.sqrt(m), speed: m => 300 * Math.pow(m, -0.1), zoom: r => clamp(Math.pow(52 / r, 0.5), 0.25, 1.3),
    initBlob(b) { b.pal = pick(CH_PAL); b.fxColor = b.pal.body; },
    initPlayer(b) { b.pal = CH_PAL[0]; },
    makeFood(f) {
      let t = Math.random() * 100, k = 0; for (let i = 0; i < CH_FOOD.length; i++) { t -= CH_FOOD[i][3]; if (t <= 0) { k = i; break; } }
      f.x = rand(-2250, 2250); f.y = rand(-2250, 2250); f.k = k; f.ch = CH_FOOD[k][0]; f.v = CH_FOOD[k][1]; f.r = CH_FOOD[k][2]; f.col = '#fff3a0';
    },
    bg(ctx, v) {
      ctx.fillStyle = '#4d7a33'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      ctx.fillStyle = '#7ec850'; ctx.fillRect(-2300, -2300, 4600, 4600);
      const T = 200, x0 = Math.max(-2300, Math.floor(v.x0 / T) * T), y0 = Math.max(-2300, Math.floor(v.y0 / T) * T);
      ctx.fillStyle = '#74be48';
      for (let x = x0; x < Math.min(2300, v.x1); x += T) for (let y = y0; y < Math.min(2300, v.y1); y += T) if (((x / T) + (y / T)) & 1) ctx.fillRect(x, y, T, T);
      for (const f of chickenFlowers) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, TAU); ctx.fill(); }
      ctx.lineWidth = 26; ctx.strokeStyle = '#8b5a2b'; ctx.strokeRect(-2312, -2312, 4624, 4624);
      ctx.lineWidth = 6; ctx.strokeStyle = '#c28a4c'; ctx.setLineDash([10, 70]); ctx.strokeRect(-2312, -2312, 4624, 4624); ctx.setLineDash([]);
    },
    drawFood(ctx, f, t) {
      const s = f.r * 2 * (1 + 0.07 * Math.sin(t * 3 + f.x * 0.05));
      if (f.k === 5) { ctx.fillStyle = 'rgba(255,220,80,.35)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.3, 0, TAU); ctx.fill(); }
      ctx.drawImage(E.sprite(f.ch, 64), f.x - s / 2, f.y - s / 2, s, s);
    },
    drawBlob(ctx, b, r, t, me, prot) {
      const s = r / 20; ctx.save(); ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 1.05, r * 0.85, 0, 0, TAU); ctx.fill();
      ctx.rotate(b.ang); if (prot) ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 14);
      ctx.rotate(Math.sin(t * (6 + Math.hypot(b.vx, b.vy) * 0.03) + b.wob) * 0.06); ctx.scale(s, s);
      const P = b.pal; ctx.lineWidth = 2.2; ctx.strokeStyle = P.line;
      ctx.fillStyle = P.tail; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(-20, i * 7, 10, 5, i * 0.35, 0, TAU); ctx.fill(); }
      ctx.fillStyle = P.body; ctx.beginPath(); ctx.ellipse(0, 0, 21, 17, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.wing; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-3, sd * 12, 12, 5.5, sd * -0.25, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = P.body; ctx.beginPath(); ctx.arc(14, 0, 9, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; for (const [cx, rr2] of [[13, 4.4], [9.5, 3.2], [16.5, 3]]) { ctx.beginPath(); ctx.arc(cx, 0, rr2, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(21, -3.5); ctx.lineTo(29, 0); ctx.lineTo(21, 3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#111'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(16.5, sd * 5.5, 1.9, 0, TAU); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      label(ctx, b.name, b.x, b.y - r * 1.25 - 6, clamp(r * 0.36, 13, 40), me ? '#ffe36e' : '#fff');
    }
  })
});

/* =====================================================================
   GAME 4 — SNAKE
   ===================================================================== */
function createSnake(E) {
  const ctx = E.ctx, ARENA = 2500, AI_N = 12, FOOD_N = 560, MAXF = 1300;
  const snakes = [], foods = []; let time = 0, player = null, over = false;
  const thick = m => 9 + Math.min(15, Math.sqrt(m) * 0.62), segs = m => Math.floor(16 + m * 0.7);
  function pickSpawn() {
    let best = null, bd = -1;
    for (let i = 0; i < 8; i++) {
      const a = rand(0, TAU), d = Math.sqrt(Math.random()) * (ARENA - 320), x = Math.cos(a) * d, y = Math.sin(a) * d; let md = 1e9;
      for (const s of snakes) { if (s.dead || !s.pts.length) continue; for (let k = 0; k < s.pts.length; k += 6) { const q = s.pts[k], dd = Math.hypot(q.x - x, q.y - y); if (dd < md) md = dd; } }
      if (md > bd) { bd = md; best = { x, y }; }
    }
    return best;
  }
  function init(s, m) {
    const p = pickSpawn(), ang = rand(0, TAU); s.m = m; s.peak = m; s.ang = ang; s.target = ang; s.dead = false; s.boost = false; s.prot = s.ai ? 0.8 : 2.2; s.think = 0; s.drop = 0; s.wander = ang; s.respawn = 0;
    const sp = thick(m) * 0.62; s.pts = []; const n = segs(m); for (let i = 0; i < n; i++) s.pts.push({ x: p.x - Math.cos(ang) * i * sp, y: p.y - Math.sin(ang) * i * sp });
  }
  function recolor(s, hue) { s.hue = hue; s.c1 = hsl(hue, 85, 54); s.c2 = hsl(hue, 85, 44); s.glow = E.glow(hue); }
  // every rival gets its own two-tone pattern so you can tell who's who (green is reserved for you)
  const SKINS = [['#ef4444', '#7f1d1d', 0], ['#f97316', '#fde68a', 25], ['#facc15', '#a16207', 50], ['#3b82f6', '#1e3a8a', 220], ['#22d3ee', '#ffffff', 190], ['#a855f7', '#3b0764', 275],
    ['#ec4899', '#fbcfe8', 320], ['#f1f5f9', '#94a3b8', 210], ['#374151', '#f97316', 25], ['#92400e', '#fbbf24', 35], ['#dc2626', '#ffffff', 355], ['#1d4ed8', '#fde047', 230]];
  function reskin(s) {
    const used = new Set(snakes.filter(o => o !== s && o.ai && o.skin !== undefined).map(o => o.skin));
    const free = SKINS.map((_, i) => i).filter(i => !used.has(i)), k = free.length ? pick(free) : irand(0, SKINS.length - 1), sk = SKINS[k];
    s.skin = k; s.c1 = sk[0]; s.c2 = sk[1]; s.hue = sk[2]; s.glow = E.glow(sk[2]);
  }
  function make(ai, name) { const s = { ai, name, aggr: Math.random(), pts: [], dead: true, m: 10, prot: 0 }; if (ai) reskin(s); else recolor(s, 150); snakes.push(s); return s; }
  function newFood(f) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * (ARENA - 70); f.x = Math.cos(a) * d; f.y = Math.sin(a) * d; f.hue = irand(0, 359); f.v = Math.random() < 0.08 ? 3 : 1; f.r = f.v === 3 ? 7.5 : 4.5; f.drop = false; return f; }
  player = make(false, 'You'); recolor(player, 140); player.c2 = '#bef264'; init(player, 10);
  const nm = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < AI_N; i++) { const s = make(true, nm[i]); init(s, 10 + Math.pow(Math.random(), 2) * 70); }
  for (let i = 0; i < FOOD_N; i++) foods.push(newFood({}));
  E.follow(player.pts[0].x, player.pts[0].y, 1, 0, true);

  function die(s, who) {
    if (s.dead) return; s.dead = true; s.respawn = rand(2.5, 4.5);
    const n = Math.min(100, Math.ceil(s.pts.length / 2)), val = Math.max(1, s.m * 0.8 / n);
    for (let i = 0; i < s.pts.length && foods.length < MAXF + 200; i += 2) { const p = s.pts[i]; foods.push({ x: p.x + rand(-6, 6), y: p.y + rand(-6, 6), hue: s.hue, v: val, r: Math.min(10, 4 + Math.sqrt(val) * 1.6), drop: true }); }
    if (s === player) { over = true; E.gameOver({ score: Math.floor(player.peak * 10), scoreLabel: 'SCORE', title: 'Game Over', lines: ['Crashed into ' + who, 'Longest length: ' + fmt(player.peak * 10)] }); }
    else if (who === player.name) E.sound('grow', 0);
  }
  function danger(s, h, a, L, r) {
    let cost = 0;
    for (let k = 1; k <= 3; k++) {
      const px = h.x + Math.cos(a) * L * k / 3, py = h.y + Math.sin(a) * L * k / 3, w = 4 - k;
      if (Math.hypot(px, py) > ARENA - r - 30) cost += 800 * w;
      for (const b of snakes) {
        if (b.dead) continue; const rb = thick(b.m), lim = r + rb + 10, pts = b.pts;
        for (let i = (b === s ? 8 : 0); i < pts.length; i += 2) { const q = pts[i], dx = q.x - px, dy = q.y - py; if (dx * dx + dy * dy < lim * lim) { cost += 400 * w; break; } }
        if (cost > 1500) return cost;
      }
    }
    return cost;
  }
  function think(s, dt) {
    s.think -= dt; if (s.think > 0) return; s.think = rand(0.08, 0.16);
    const h = s.pts[0], r = thick(s.m), L = 90 + r * 2.6 + (s.boost ? 60 : 0);
    let bf = null, bs = 1e18;
    for (const f of foods) { const ax = f.x - h.x; if (ax > 450 || ax < -450) continue; const ay = f.y - h.y; if (ay > 450 || ay < -450) continue; const sc = (ax * ax + ay * ay) / (f.v + 0.5); if (sc < bs) { bs = sc; bf = f; } }
    let desired; if (bf) desired = Math.atan2(bf.y - h.y, bf.x - h.x); else { s.wander += rand(-0.4, 0.4); desired = s.wander; }
    s.boost = false;
    if (s.aggr > 0.45) for (const o of snakes) {
      if (o === s || o.dead || o.m * 1.15 > s.m || o.prot > 0) continue; const oh = o.pts[0], d = Math.hypot(oh.x - h.x, oh.y - h.y);
      if (d < 420) { const lead = clamp(d / 200, 0.2, 1.2); desired = Math.atan2(oh.y + Math.sin(o.ang) * 170 * lead - h.y, oh.x + Math.cos(o.ang) * 170 * lead - h.x); if (d < 260 && s.m > 25) s.boost = true; break; }
    }
    const offs = [0, 0.35, -0.35, 0.8, -0.8, 1.3, -1.3, 1.9, -1.9, 2.6]; let bestA = desired, bestS = -1e9;
    for (const off of offs) { const c = danger(s, h, desired + off, L, r), sc = -c - Math.abs(off) * 8; if (sc > bestS) { bestS = sc; bestA = desired + off; } if (c === 0) break; }
    s.target = bestA;
  }
  function update(dt) {
    time += dt;
    for (const s of snakes) {
      if (s.dead) { if (s.ai) { s.respawn -= dt; if (s.respawn <= 0) { reskin(s); init(s, 10 + Math.random() * 25); } } continue; }
      if (s.prot > 0) s.prot -= dt;
      if (s === player) { if (!over) { const d = E.dir(); if (d.mag > 0.08) s.target = Math.atan2(d.y, d.x); s.boost = E.boost() && s.m > 14; } }
      else think(s, dt);
      const r = thick(s.m), sp = r * 0.62, pts = s.pts, head = pts[0], turn = Math.max(2.2, 4.4 - s.m * 0.004);
      s.ang += clamp(angDiff(s.target, s.ang), -turn * dt, turn * dt);
      if (s.boost && s.m > 14) {
        s.m -= 6 * dt; s.drop += dt; if (s.drop > 0.25 && foods.length < MAXF + 200) { s.drop = 0; const t = pts[pts.length - 1]; foods.push({ x: t.x, y: t.y, hue: s.hue, v: 1, r: 5, drop: true }); }
        if (s === player) E.sound('boost', 100);
      } else s.boost = false;
      const speed = s.boost ? 300 : 170;
      head.x += Math.cos(s.ang) * speed * dt; head.y += Math.sin(s.ang) * speed * dt;
      for (let i = 1; i < pts.length; i++) { const p = pts[i], q = pts[i - 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d > sp) { const k = (d - sp) / d; p.x += dx * k; p.y += dy * k; } }
      const want = segs(s.m); while (pts.length < want) { const l = pts[pts.length - 1]; pts.push({ x: l.x, y: l.y }); } while (pts.length > want && pts.length > 8) pts.pop();
      for (let j = foods.length - 1; j >= 0; j--) {
        const f = foods[j], dx = f.x - head.x, dy = f.y - head.y, lim = r + f.r + 14;
        if (dx * dx + dy * dy < lim * lim) { s.m += f.v; if (s === player) E.sound('eat', 45); if (f.drop) { foods[j] = foods[foods.length - 1]; foods.pop(); } else newFood(f); }
      }
      if (s.m > s.peak) s.peak = s.m;
    }
    const dying = [];
    for (const a of snakes) {
      if (a.dead || a.prot > 0) continue; const h = a.pts[0], ra = thick(a.m);
      if (Math.hypot(h.x, h.y) > ARENA - ra) { dying.push([a, 'the wall']); continue; }
      for (const b of snakes) {
        if (b === a || b.dead) continue; const rb = thick(b.m), lim = (ra + rb) * 0.85, bh = b.pts[0];
        if (Math.hypot(bh.x - h.x, bh.y - h.y) < (ra + rb) * 0.8) { if (a.m <= b.m) { dying.push([a, b.name]); break; } continue; }
        const pts = b.pts; let hit = false;
        for (let i = 2; i < pts.length; i++) { const q = pts[i], dx = q.x - h.x, dy = q.y - h.y; if (dx * dx + dy * dy < lim * lim) { hit = true; break; } }
        if (hit) { dying.push([a, b.name]); break; }
      }
    }
    for (const [s, who] of dying) die(s, who);
    const h = player.pts[0]; E.follow(h.x, h.y, clamp(Math.pow(18 / thick(player.m), 0.35), 0.45, 1.1) * E.screenScale(), dt, time < 0.05);
  }
  function drawSnake(s, v) {
    const pts = s.pts, r = thick(s.m), n = pts.length; ctx.globalAlpha = s.prot > 0 ? 0.55 + 0.3 * Math.sin(time * 14) : 1;
    if (s.boost) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i += 3) { const p = pts[i]; ctx.drawImage(s.glow, p.x - r * 2.2, p.y - r * 2.2, r * 4.4, r * 4.4); } ctx.globalCompositeOperation = 'source-over'; }
    for (let i = n - 1; i >= 0; i--) {
      const p = pts[i]; if (p.x < v.x0 - 30 || p.x > v.x1 + 30 || p.y < v.y0 - 30 || p.y > v.y1 + 30) continue;
      const rr2 = r * (1 - 0.4 * Math.max(0, (i - (n - 12)) / 12)); ctx.fillStyle = (i >> 2) & 1 ? s.c1 : s.c2; ctx.beginPath(); ctx.arc(p.x, p.y, rr2, 0, TAU); ctx.fill();
    }
    const h = pts[0]; ctx.fillStyle = s.c1; ctx.beginPath(); ctx.arc(h.x, h.y, r * 1.08, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(h.x - r * 0.25, h.y - r * 0.3, r * 0.5, 0, TAU); ctx.fill();
    for (const sd of [-1, 1]) {
      const ex = h.x + Math.cos(s.ang + sd * 0.85) * r * 0.62, ey = h.y + Math.sin(s.ang + sd * 0.85) * r * 0.62;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, r * 0.38, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + Math.cos(s.ang) * r * 0.14, ey + Math.sin(s.ang) * r * 0.14, r * 0.19, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; label(ctx, s.name, h.x, h.y - r * 1.9, clamp(r * 0.8, 13, 26), s === player ? '#ffe36e' : '#fff');
  }
  function draw() {
    E.beginWorld(); const v = E.view(80);
    ctx.fillStyle = '#04050c'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ARENA); g.addColorStop(0, '#1b2147'); g.addColorStop(1, '#0d1128');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ARENA, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, ARENA, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(120,140,255,.10)'; ctx.lineWidth = 2; const T = 130, gx = Math.floor(v.x0 / T) * T, gy = Math.floor(v.y0 / T) * T; ctx.beginPath();
    for (let x = gx; x < v.x1; x += T) { ctx.moveTo(x, v.y0); ctx.lineTo(x, v.y1); } for (let y = gy; y < v.y1; y += T) { ctx.moveTo(v.x0, y); ctx.lineTo(v.x1, y); } ctx.stroke(); ctx.restore();
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(255,60,100,.95)'; ctx.beginPath(); ctx.arc(0, 0, ARENA + 8, 0, TAU); ctx.stroke();
    ctx.lineWidth = 60; ctx.strokeStyle = 'rgba(255,60,100,.15)'; ctx.beginPath(); ctx.arc(0, 0, ARENA - 30, 0, TAU); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of foods) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; const s = f.r * 3.4 * (1 + 0.12 * Math.sin(time * 4 + f.x)); ctx.drawImage(E.glow(f.hue), f.x - s, f.y - s, s * 2, s * 2); }
    ctx.globalCompositeOperation = 'source-over';
    for (const f of foods) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.55, 0, TAU); ctx.fill(); }
    const order = snakes.filter(s => !s.dead).sort((a, b) => a.m - b.m); for (const s of order) drawSnake(s, v);
    E.endWorld();
  }
  function hud() {
    const alive = snakes.filter(s => !s.dead).sort((a, b) => b.m - a.m), idx = alive.indexOf(player);
    const board = alive.slice(0, 8).map(s => ({ n: s.name, s: fmt(s.m * 10), me: s === player, col: s.c1 })); if (idx >= 8) board.push({ rank: idx + 1, n: 'You', s: fmt(player.m * 10), me: true });
    return { stats: [['Length', fmt(player.m * 10)], ['Rank', idx >= 0 ? '#' + (idx + 1) : '—'], ['Best', fmt(Math.max(E.best(), player.peak * 10))]], board, boardTitle: 'LEADERBOARD' };
  }
  return { update, draw, hud };
}

/* =====================================================================
   GAME 5 — CELLS (Agar style)
   ===================================================================== */
registerGame({
  id: 'cells', title: 'Cells.io', emoji: '🦠', c1: '#7f5bff', c2: '#00c6ff', scoreLabel: 'FINAL MASS',
  desc: 'Eat glowing dots to grow, hunt smaller cells, dodge the giants and avoid the spiky green viruses. Become the biggest cell!',
  controls: 'Mouse / WASD / touch',
  hint: 'Move: mouse or WASD / Arrows  •  Eat dots & smaller cells  •  Avoid bigger cells and green viruses!',
  hintTouch: 'Drag anywhere to steer  •  Eat dots & smaller cells  •  Avoid bigger cells!', boost: null,
  create: blobArena({
    size: 5200, aiCount: 20, startMass: 36, aiSpread: 12, foodCount: 1100, virusR: 54, viruses: 16, dash: false, minDashMass: 0, dashMul: 1, dashCost: 0,
    decay: 0.0016, decayAbove: 120, scoreMul: 1, statLabel: 'Mass', names: BOT_NAMES,
    radius: m => 3.1 * Math.sqrt(m), speed: m => 340 * Math.pow(m, -0.13), zoom: r => clamp(Math.pow(58 / r, 0.52), 0.2, 1.2),
    initPlayer(b) { b.hue = 195; },
    makeFood(f) { f.x = rand(-2550, 2550); f.y = rand(-2550, 2550); f.v = 1; f.r = 5.5; const h = irand(0, 359); f.col = hsl(h, 85, 60); },
    bg(ctx, v) {
      ctx.fillStyle = '#080b12'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      ctx.fillStyle = '#10151f'; ctx.fillRect(-2600, -2600, 5200, 5200);
      ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.lineWidth = 2; const T = 90, gx = Math.max(-2600, Math.floor(v.x0 / T) * T), gy = Math.max(-2600, Math.floor(v.y0 / T) * T); ctx.beginPath();
      for (let x = gx; x <= Math.min(2600, v.x1); x += T) { ctx.moveTo(x, Math.max(-2600, v.y0)); ctx.lineTo(x, Math.min(2600, v.y1)); }
      for (let y = gy; y <= Math.min(2600, v.y1); y += T) { ctx.moveTo(Math.max(-2600, v.x0), y); ctx.lineTo(Math.min(2600, v.x1), y); } ctx.stroke();
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(150,110,255,.9)'; ctx.strokeRect(-2600, -2600, 5200, 5200);
    },
    drawFood(ctx, f) { ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); },
    drawBlob(ctx, b, r, t, me, prot) {
      const n = Math.max(20, Math.min(64, Math.floor(r / 2))); ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = i / n * TAU, w = 1 + 0.012 * Math.sin(t * 4 + i * 1.7 + b.wob) + 0.008 * Math.sin(t * 7 + i * 3.1); ctx.lineTo(b.x + Math.cos(a) * r * w, b.y + Math.sin(a) * r * w); }
      ctx.closePath(); if (prot) ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 14);
      ctx.fillStyle = hsl(b.hue, 78, 56); ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.07); ctx.strokeStyle = hsl(b.hue, 78, 38); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(b.x - r * 0.3, b.y - r * 0.32, r * 0.42, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      label(ctx, b.name, b.x, b.y, clamp(r * 0.4, 12, 64), me ? '#ffe36e' : '#fff');
      if (me && r > 24) label(ctx, String(Math.floor(b.m)), b.x, b.y + clamp(r * 0.42, 12, 64) * 0.95, clamp(r * 0.25, 9, 40), '#d7defc');
    }
  })
});

/* ------------------------------ register the games in gallery order ------------------------------ */
registerGame({
  id: 'hole', title: 'Hole.io', emoji: '🕳️', c1: '#232a63', c2: '#7c5cff', scoreLabel: 'SCORE',
  desc: 'Roam a busy 3D-style city as a hungry black hole. Swallow people, cars and houses to grow — then bring down the skyscrapers!',
  controls: 'WASD / mouse / touch',
  hint: 'Move: WASD / Arrows / mouse  •  Swallow things smaller than your hole  •  Biggest hole after 2:30 wins!',
  hintTouch: 'Drag anywhere to steer  •  Swallow things smaller than your hole  •  Biggest hole wins!', boost: null, create: createHole
});
registerGame({
  id: 'farm', title: 'Farmer.io', emoji: '🧑‍🌾', c1: '#56ab2f', c2: '#a8e063', scoreLabel: 'COINS EARNED',
  desc: 'Plant and harvest crops, chop wood, mine stone, sell at the barn and buy upgrades to build the richest farm in one season.',
  controls: 'WASD / mouse / touch • U = shop',
  hint: 'Move: WASD / Arrows / mouse  •  Walk over soil to plant, stand near ripe crops to harvest  •  Sell at the barn  •  U = Shop',
  hintTouch: 'Drag to move  •  Walk over soil to plant & harvest  •  Sell at the barn  •  Tap 🛒 Shop to upgrade', boost: null, create: createFarm
});
registerGame({
  id: 'snake', title: 'Snake.io', emoji: '🐍', c1: '#0f2027', c2: '#00e5a0', scoreLabel: 'SCORE',
  desc: 'Glide through a neon arena, eat glowing orbs and trap rival snakes. Crash into another snake and you\'re out — boost to outsmart them!',
  controls: 'Mouse / WASD • Space = boost',
  hint: 'Steer: mouse or WASD / Arrows  •  Hold SPACE to boost (uses length)  •  Make others hit YOUR body!',
  hintTouch: 'Drag anywhere to steer  •  Hold ⚡ BOOST to speed up  •  Make others hit your body!', boost: '⚡ BOOST', create: createSnake
});
// gallery order
