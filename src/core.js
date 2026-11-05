/* =====================================================================
   THEIOGAMES ENGINE
   HOW TO ADD A NEW GAME
   1. Write a function  createMyGame(E)  that returns
        { update(dt), draw(), hud()?, onKey?(code,key), onKeyUp?(code),
          down?(x,y,id), move?(x,y,id), up?(x,y,id), destroy?(), extra? }
      E gives you: E.ctx, E.W, E.H, E.cam, E.mode (1|2), E.key(code), E.dir(), E.boost(),
      E.beginWorld(), E.endWorld(), E.view(), E.sprite(emoji,size), E.sound(name),
      E.best(), E.gameOver({score,title,lines,win}), E.panel, E.choose(), E.pads(),
      E.toast(), E.data()/E.save(), E.ach(), E.layer (DOM layer)
   2. Call  registerGame({id,title,emoji,c1,c2,cats,desc,controls,hint,hintTouch,create,input,twoP})
   Gallery card, play screen, high score, pause, restart, mute, deep link (#id),
   1P/2P mode select, stats, coins and the 3-minute pet reward are handled for you.
   ===================================================================== */
(() => {
'use strict';

/* ------------------------------ utils ------------------------------ */
const TAU = Math.PI * 2;
const $ = (s, r) => (r || document).querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const hsl = (h, s, l, a) => a === undefined ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.floor(n).toLocaleString();
const fmtBig = n => { n = Math.floor(n); const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx']; let i = 0; let v = n; while (Math.abs(v) >= 1000 && i < u.length - 1) { v /= 1000; i++; } return i ? (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + u[i] : String(n); };
const fmtTime = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };
const store = {
  get(k, d) { try { const v = localStorage.getItem('tiog_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tiog_' + k, JSON.stringify(v)); } catch (e) {} }
};
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function label(ctx, text, x, y, size, fill, align) {
  ctx.font = `800 ${size}px system-ui,'Segoe UI',sans-serif`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.18); ctx.strokeStyle = 'rgba(0,0,0,.6)';
  ctx.strokeText(text, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(text, x, y);
}
function txt(ctx, text, x, y, size, fill, align, weight, base) {
  ctx.font = `${weight || 700} ${size}px system-ui,'Segoe UI',sans-serif`; ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'middle';
  ctx.fillStyle = fill || '#fff'; ctx.fillText(text, x, y);
}
function lgrad(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function rgrad(ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function shadowOn(ctx, c, b, ox, oy) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.shadowOffsetX = ox || 0; ctx.shadowOffsetY = oy || 0; }
function shadowOff(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
function star(ctx, x, y, r1, r2, n, rot) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = (rot || -Math.PI / 2) + i * Math.PI / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1); const cx = ax + dx * t, cy = ay + dy * t; return { d: Math.hypot(px - cx, py - cy), x: cx, y: cy, t }; }
// seeded rng
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* particles + floating text */
function Fx() {
  const P = [], T = [];
  return {
    burst(x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = o.ang !== undefined ? o.ang + rand(-(o.spread || 0.5), o.spread || 0.5) : rand(0, TAU), s = rand(0.3, 1) * (o.spd || 160);
        P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), life: rand(0.6, 1) * (o.life || 0.8), t: 0, size: rand(0.6, 1.2) * (o.size || 4),
          col: Array.isArray(o.col) ? pick(o.col) : (o.col || '#fff'), g: o.grav || 0, drag: o.drag === undefined ? 1.5 : o.drag, shape: o.shape || 'c', rot: rand(0, TAU), vr: rand(-8, 8), glow: o.glow });
      }
    },
    text(x, y, s, col, size, vy) { T.push({ x, y, s, col: col || '#fff', size: size || 22, t: 0, life: 1.1, vy: vy === undefined ? -50 : vy }); },
    update(dt) {
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; } const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
      for (let i = T.length - 1; i >= 0; i--) { const t = T[i]; t.t += dt; t.y += t.vy * dt; if (t.t > t.life) T.splice(i, 1); }
    },
    draw(ctx) {
      for (const p of P) {
        const a = 1 - p.t / p.life; ctx.globalAlpha = a; ctx.fillStyle = p.col;
        if (p.glow) ctx.globalCompositeOperation = 'lighter';
        if (p.shape === 's') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore(); }
        else if (p.shape === 'star') { star(ctx, p.x, p.y, p.size, p.size * 0.45, 5, p.rot); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.2, p.size * (0.4 + 0.6 * a)), 0, TAU); ctx.fill(); }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
      for (const t of T) { ctx.globalAlpha = Math.min(1, 2 * (1 - t.t / t.life)); label(ctx, t.s, t.x, t.y, t.size * (t.t < 0.12 ? 0.6 + t.t * 3.3 : 1), t.col); }
      ctx.globalAlpha = 1;
    },
    clear() { P.length = 0; T.length = 0; },
    get count() { return P.length; }
  };
}
/* in-canvas buttons */
function UI() {
  const R = [];
  return {
    clear() { R.length = 0; },
    btn(ctx, id, x, y, w, h, text, o) {
      o = o || {}; const hover = false;
      ctx.save(); shadowOn(ctx, 'rgba(0,0,0,.35)', 12, 0, 5);
      rr(ctx, x, y, w, h, o.r === undefined ? Math.min(14, h / 2) : o.r);
      ctx.fillStyle = o.disabled ? 'rgba(120,120,140,.5)' : (o.fill || lgrad(ctx, x, y, x, y + h, o.cols || ['#8b6cff', '#5b4ae0']));
      ctx.fill(); shadowOff(ctx);
      if (!o.flat) { ctx.strokeStyle = o.stroke || 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
      txt(ctx, text, x + w / 2, y + h / 2 + 1, o.size || Math.min(h * 0.42, 22), o.color || '#fff', 'center', 800);
      ctx.restore();
      if (!o.disabled) R.push({ id, x, y, w, h });
      return hover;
    },
    zone(id, x, y, w, h) { R.push({ id, x, y, w, h }); },
    hit(px, py) { for (let i = R.length - 1; i >= 0; i--) { const b = R[i]; if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.id; } return null; }
  };
}
/* letterbox a fixed-size world onto the screen */
function fitView(E, ww, wh, pad) {
  const p = pad === undefined ? 0 : pad;
  let s = Math.min((E.W - p * 2) / ww, (E.H - p * 2) / wh), ox = (E.W - ww * s) / 2, oy = (E.H - wh * s) / 2;
  // keep the top button bar from covering the play field when there is no side margin for it
  if (ox < 230 && oy < 50) { const top = 50; s = Math.min((E.W - p * 2) / ww, (E.H - top - p) / wh); ox = (E.W - ww * s) / 2; oy = top + (E.H - top - wh * s) / 2; }
  return { s, ox, oy, apply(ctx) { ctx.setTransform(E.dpr * s, 0, 0, E.dpr * s, E.dpr * ox, E.dpr * oy); }, toWorld(x, y) { return { x: (x - ox) / s, y: (y - oy) / s }; } };
}

/* ------------------------------ sound ------------------------------ */
const Sound = (() => {
  let ctx = null, muted = store.get('muted', false), master = null; const last = {};
  function init() {
    try {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); } }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  function tone(f, d, type, v, slide, delay) {
    if (muted || !ctx) return;
    try {
      const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(v || 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
    } catch (e) {}
  }
  let noiseBuf = null;
  function noise(d, v, freq, delay, type) {
    if (muted || !ctx) return;
    try {
      if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.value = freq || 1200;
      g.gain.setValueAtTime(v || 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + 0.05);
    } catch (e) {}
  }
  const defs = {
    eat: () => tone(430 + Math.random() * 200, 0.07, 'triangle', 0.08, 260),
    pop: () => { tone(240, 0.14, 'square', 0.07, -140); tone(120, 0.18, 'sawtooth', 0.06, -50, 0.05); },
    grow: () => { tone(392, 0.1, 'sine', 0.1); tone(523, 0.12, 'sine', 0.1, 0, 0.09); tone(659, 0.18, 'sine', 0.1, 0, 0.18); },
    coin: () => { tone(880, 0.08, 'square', 0.06); tone(1320, 0.14, 'square', 0.06, 0, 0.07); },
    harvest: () => tone(300 + Math.random() * 80, 0.09, 'triangle', 0.09, 220),
    chop: () => tone(150, 0.06, 'square', 0.05, -40),
    die: () => { tone(330, 0.25, 'sawtooth', 0.1, -250); tone(165, 0.4, 'sawtooth', 0.1, -100, 0.15); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.11, 0, i * 0.1)); },
    click: () => tone(600, 0.05, 'square', 0.05, 200),
    boost: () => tone(180, 0.05, 'sawtooth', 0.035, 60),
    swallow: () => tone(320, 0.2, 'sine', 0.13, -240),
    bad: () => tone(130, 0.16, 'square', 0.08, -30),
    jump: () => tone(300, 0.14, 'square', 0.06, 380),
    land: () => { noise(0.08, 0.12, 600); tone(110, 0.08, 'sine', 0.12, -40); },
    thud: () => { noise(0.12, 0.16, 300); tone(80, 0.12, 'sine', 0.15, -30); },
    hit: () => { noise(0.05, 0.14, 2500, 0, 'bandpass'); tone(520, 0.05, 'triangle', 0.06, -200); },
    bounce: () => tone(220 + Math.random() * 60, 0.08, 'sine', 0.1, 120),
    swish: () => noise(0.25, 0.1, 3200, 0, 'highpass'),
    score: () => { tone(660, 0.08, 'triangle', 0.1); tone(990, 0.16, 'triangle', 0.1, 0, 0.08); },
    tick: () => tone(1000, 0.03, 'square', 0.03),
    shoot: () => tone(900, 0.08, 'square', 0.04, -600),
    laser: () => tone(1400, 0.12, 'sawtooth', 0.04, -1100),
    boom: () => { noise(0.5, 0.25, 500); tone(70, 0.4, 'sine', 0.2, -30); },
    splash: () => noise(0.35, 0.14, 1400, 0, 'bandpass'),
    power: () => { [440, 554, 659, 880].forEach((f, i) => tone(f, 0.09, 'square', 0.05, 0, i * 0.05)); },
    error: () => { tone(200, 0.12, 'square', 0.07); tone(150, 0.16, 'square', 0.07, 0, 0.1); },
    whoosh: () => noise(0.3, 0.08, 900, 0, 'bandpass'),
    crash: () => { noise(0.4, 0.2, 1800); tone(90, 0.3, 'sawtooth', 0.08, -40); },
    cheer: () => { noise(0.9, 0.06, 2600, 0, 'bandpass'); [523, 659, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.07, 0, i * 0.08)); },
    buy: () => { tone(700, 0.06, 'square', 0.05); tone(1050, 0.06, 'square', 0.05, 0, 0.06); tone(1400, 0.1, 'square', 0.05, 0, 0.12); },
    reel: () => tone(800 + Math.random() * 200, 0.025, 'square', 0.025),
    rare: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.25, 'sine', 0.09, 0, i * 0.08)); },
    engine: () => tone(70 + Math.random() * 10, 0.08, 'sawtooth', 0.025, 15),
    bonk: () => { tone(500, 0.06, 'square', 0.07, -300); noise(0.05, 0.1, 1200); },
    flip: () => noise(0.08, 0.05, 2000, 0, 'highpass'),
    ding: () => tone(1568, 0.3, 'sine', 0.07)
  };
  return {
    init, tone, noise,
    note(f, d, type, v) { tone(f, d || 0.3, type || 'triangle', v || 0.1); },
    play(n, gap) {
      if (muted) return;
      const now = performance.now(); const g = gap === undefined ? 40 : gap;
      if (now - (last[n] || 0) < g) return; last[n] = now;
      if (defs[n]) defs[n]();
    },
    get muted() { return muted; },
    setMuted(v) { muted = !!v; store.set('muted', muted); }
  };
})();

/* ------------------------------ profile / progression ------------------------------ */
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const Prof = {
  d: Object.assign({ coins: 0, earned: 0, plays: {}, time: {}, recent: [], favs: [], ach: {}, pets: [], petTime: 0, owned: ['default'], theme: 'default', daily: null, bests: 0, twoP: 0, sessions: 0 }, store.get('profile', {})),
  save() { store.set('profile', this.d); },
  addCoins(n, silent) { n = Math.floor(n); if (n <= 0) return; this.d.coins += n; this.d.earned += n; this.daily().coins += n; this.save(); if (!silent) toast('🪙 +' + n + ' coins'); checkAch(); updateCoinBtn(); },
  daily() {
    const t = today();
    if (!this.d.daily || this.d.daily.day !== t) this.d.daily = { day: t, games: [], secs: 0, coins: 0, bests: 0, twoP: 0, done: [] };
    return this.d.daily;
  }
};
const ACH = [
  ['first', '🎮', 'First Steps', 'Play your first game'],
  ['play10', '🔟', 'Regular', 'Start 10 game sessions'],
  ['play50', '🎖️', 'Arcade Addict', 'Start 50 game sessions'],
  ['try10', '🧭', 'Explorer', 'Try 10 different games'],
  ['try25', '🗺️', 'Adventurer', 'Try 25 different games'],
  ['tryall', '🌍', 'Completionist', 'Try every game on TheIOGames'],
  ['time30', '⏱️', 'Warmed Up', 'Play for 30 minutes in total'],
  ['time120', '⌛', 'Marathon', 'Play for 2 hours in total'],
  ['c500', '🪙', 'Pocket Money', 'Earn 500 coins'],
  ['c5000', '💰', 'Treasure Chest', 'Earn 5,000 coins'],
  ['pet1', '🐾', 'Pet Friend', 'Unlock your first pet'],
  ['pet5', '🐶', 'Pet Pack', 'Unlock 5 pets'],
  ['pet15', '🦄', 'Pet Collector', 'Unlock 15 pets'],
  ['petall', '👑', 'Pet Legend', 'Unlock every pet'],
  ['best', '🏆', 'Personal Best', 'Set a new high score'],
  ['best10', '🥇', 'Record Breaker', 'Set 10 new high scores'],
  ['twoP', '🤝', 'Couch Buddies', 'Finish a local 2-player match'],
  ['fav', '❤️', 'Favorite', 'Add a game to your favorites'],
  ['daily', '📅', 'Daily Hero', 'Complete a daily challenge'],
  ['shop', '🎨', 'Stylish', 'Buy a cosmetic from the Rewards shop'],
  ['bottle10', '🍶', 'Flip Master', 'Land 10 bottle flips in one run'],
  ['stack30', '🧱', 'Sky Stacker', 'Stack 30 blocks in Perfect Stack'],
  ['t2048', '🔢', '2048!', 'Reach the 2048 tile'],
  ['hio', '⛳', 'Hole in One', 'Sink a hole in one in Mini Golf'],
  ['strike', '🎳', 'Strike!', 'Bowl a strike'],
  ['pool', '🎱', 'Pool Shark', 'Win a game of 8-Ball'],
  ['sudokuh', '🧩', 'Sudoku Sage', 'Solve a Hard Sudoku'],
  ['million', '🏙️', 'Millionaire', 'Reach $1,000,000 in Clicker Empire'],
  ['rebirth', '🔁', 'Reborn', 'Rebirth in Brainrot Heist'],
  ['secret', '🤫', 'Secret Finder', 'Own a Secret creature in Brainrot Heist'],
  ['thief', '🦹', 'Master Thief', 'Steal a creature in Brainrot Heist'],
  ['summit', '🔨', 'Summit', 'Reach the top in Hammer Climb'],
  ['bridge', '🌉', 'Engineer', 'Complete 5 bridge levels'],
  ['rare', '🐟', 'Legendary Catch', 'Catch a legendary fish'],
  ['kart', '🏎️', 'Kart Champion', 'Win a Kart Clash match'],
  ['royale', '🏴‍☠️', 'Pirate King', 'Win Pirate Royale'],
  ['fashion', '👗', 'Trendsetter', 'Win a Style Studio challenge'],
  ['coop', '🧩', 'Teamwork', 'Finish all Two Player Adventure levels']
];
function hasAch(id) { return !!Prof.d.ach[id]; }
function unlockAch(id) {
  if (Prof.d.ach[id]) return; const a = ACH.find(x => x[0] === id); if (!a) return;
  Prof.d.ach[id] = Date.now(); Prof.save(); toast(a[1] + ' Achievement: ' + a[2]); Sound.play('rare', 0);
  Prof.addCoins(25, true); checkAch();
}
function checkAch() {
  const d = Prof.d, played = Object.keys(d.plays).length, total = Object.values(d.time).reduce((a, b) => a + b, 0);
  const sess = Object.values(d.plays).reduce((a, b) => a + b, 0);
  const c = (id, ok) => { if (ok && !d.ach[id]) unlockAch(id); };
  c('first', sess >= 1); c('play10', sess >= 10); c('play50', sess >= 50);
  c('try10', played >= 10); c('try25', played >= 25); c('tryall', GAMES.length && GAMES.every(g => d.plays[g.id]));
  c('time30', total >= 1800); c('time120', total >= 7200);
  c('c500', d.earned >= 500); c('c5000', d.earned >= 5000);
  c('pet1', d.pets.length >= 1); c('pet5', d.pets.length >= 5); c('pet15', d.pets.length >= 15); c('petall', d.pets.length >= PETS.length);
  c('best', d.bests >= 1); c('best10', d.bests >= 10); c('twoP', d.twoP >= 1); c('fav', d.favs.length >= 1);
}
/* daily challenges */
function dailyList() {
  const t = today(); const r = rng(t.split('-').reduce((a, b) => a * 37 + +b, 7));
  const gs = GAMES.filter(g => !g.legacy || true); const g1 = gs[Math.floor(r() * gs.length)], g2 = gs[Math.floor(r() * gs.length)];
  const pool = [
    { id: 'g3', ic: '🎲', t: 'Play 3 different games', goal: 3, val: d => d.games.length, rw: 40 },
    { id: 'g6', ic: '🧭', t: 'Play 6 different games', goal: 6, val: d => d.games.length, rw: 80 },
    { id: 'm10', ic: '⏱️', t: 'Play for 10 minutes', goal: 600, val: d => d.secs, rw: 60, time: 1 },
    { id: 'm20', ic: '⌛', t: 'Play for 20 minutes', goal: 1200, val: d => d.secs, rw: 100, time: 1 },
    { id: 'best', ic: '🏆', t: 'Set a new personal best', goal: 1, val: d => d.bests, rw: 60 },
    { id: 'coin', ic: '🪙', t: 'Earn 150 coins from games', goal: 150, val: d => d.coins, rw: 50 },
    { id: 'tp', ic: '🤝', t: 'Finish a 2-player match', goal: 1, val: d => d.twoP, rw: 60 },
    { id: 'p_' + g1.id, ic: g1.emoji, t: 'Play ' + g1.title, goal: 1, val: d => d.games.indexOf(g1.id) >= 0 ? 1 : 0, rw: 40 },
    { id: 'p_' + g2.id, ic: g2.emoji, t: 'Play ' + g2.title, goal: 1, val: d => d.games.indexOf(g2.id) >= 0 ? 1 : 0, rw: 40 }
  ];
  const out = []; const p = pool.slice();
  while (out.length < 3 && p.length) { const i = Math.floor(r() * p.length); const c = p.splice(i, 1)[0]; if (out.some(o => (o.time && c.time) || (o.id[0] === 'g' && c.id[0] === 'g'))) continue; out.push(c); }
  return out;
}
function checkDaily() {
  const d = Prof.daily();
  dailyList().forEach(c => { if (d.done.indexOf(c.id) < 0 && c.val(d) >= c.goal) { d.done.push(c.id); Prof.save(); toast('📅 Daily challenge complete! +' + c.rw + ' 🪙'); Prof.addCoins(c.rw, true); unlockAch('daily'); } });
}

/* ------------------------------ pets ------------------------------ */
const RAR = { Common: [40, '#cbd5e1'], Uncommon: [27, '#4ade80'], Rare: [17, '#60a5fa'], Epic: [10, '#c084fc'], Legendary: [4.5, '#fbbf24'], Mythic: [1.5, '#f472b6'] };
const PETS = [
  ['Mochi Pup', 'Common', 'dog', '#f4d6a8', '#c98a4b', ''], ['Pebble Cat', 'Common', 'cat', '#9aa3b5', '#5b6476', ''], ['Clover Bunny', 'Common', 'bunny', '#f6f1ea', '#f2a7b8', ''],
  ['Bean Frog', 'Common', 'frog', '#7bd389', '#3f9b55', ''], ['Puff Hamster', 'Common', 'hamster', '#f0b874', '#fff3e0', ''], ['Dewdrop Slime', 'Common', 'slime', '#7dd3fc', '#38bdf8', ''],
  ['Pip Chick', 'Common', 'bird', '#fde047', '#f59e0b', ''], ['Biscuit Bear', 'Common', 'bear', '#b07a4b', '#7a4f2c', ''],
  ['Ziggy Fox', 'Uncommon', 'fox', '#fb923c', '#fff7ed', 'scarf'], ['Snowball Pengu', 'Uncommon', 'penguin', '#334155', '#f8fafc', 'scarf'], ['Minty Axolotl', 'Uncommon', 'axolotl', '#f9a8d4', '#ec4899', ''],
  ['Hoot Owl', 'Uncommon', 'owl', '#a16207', '#fde68a', 'glasses'], ['Jellybean Jelly', 'Uncommon', 'jelly', '#c4b5fd', '#8b5cf6', ''], ['Cocoa Kitty', 'Uncommon', 'cat', '#7c4a2d', '#e7c6a5', 'bow'],
  ['Lucky Bunny', 'Uncommon', 'bunny', '#a7f3d0', '#34d399', 'bow'],
  ['Boo Buddy', 'Rare', 'ghost', '#eef2ff', '#a5b4fc', 'bow'], ['Bolt Bot', 'Rare', 'robot', '#94a3b8', '#22d3ee', ''], ['Ember Pup', 'Rare', 'dog', '#ef4444', '#fde047', 'scarf'],
  ['Coral Axolotl', 'Rare', 'axolotl', '#fda4af', '#fb7185', 'crown'], ['Sky Owl', 'Rare', 'owl', '#60a5fa', '#e0f2fe', ''], ['Berry Slime', 'Rare', 'slime', '#f472b6', '#be185d', 'bow'],
  ['Comet Fox', 'Epic', 'fox', '#6366f1', '#e0e7ff', 'star'], ['Glimmer Jelly', 'Epic', 'jelly', '#5eead4', '#14b8a6', 'star'], ['Mecha Bear', 'Epic', 'robot', '#f59e0b', '#ef4444', 'glasses'],
  ['Twilight Cat', 'Epic', 'cat', '#4c1d95', '#c4b5fd', 'star'], ['Frost Pengu', 'Epic', 'penguin', '#0ea5e9', '#e0f2fe', 'crown'],
  ['Sunny Dragon', 'Legendary', 'dragon', '#f97316', '#fde047', 'crown'], ['Aurora Unicorn', 'Legendary', 'unicorn', '#fdf4ff', '#a78bfa', 'star'], ['Golden Hamster', 'Legendary', 'hamster', '#facc15', '#fef9c3', 'crown'],
  ['Phantom Owl', 'Legendary', 'owl', '#1e1b4b', '#a78bfa', 'halo'],
  ['Galaxy Dragon', 'Mythic', 'dragon', '#312e81', '#f472b6', 'halo'], ['Prism Unicorn', 'Mythic', 'unicorn', '#ffffff', '#22d3ee', 'halo'], ['Cosmo Slime', 'Mythic', 'slime', '#1e1b4b', '#a855f7', 'crown']
].map((p, i) => ({ id: i, n: p[0], r: p[1], sp: p[2], c1: p[3], c2: p[4], acc: p[5] }));
function drawPet(c, pet, S, t) {
  t = t || 0; c.save(); c.translate(S / 2, S / 2); const k = S / 100; c.scale(k, k);
  const { c1, c2, sp } = pet, bob = Math.sin(t * 3) * 2;
  if (pet.r === 'Legendary' || pet.r === 'Mythic') { c.fillStyle = rgrad(c, 0, 0, 5, 50, [pet.r === 'Mythic' ? 'rgba(244,114,182,.55)' : 'rgba(251,191,36,.5)', 'rgba(0,0,0,0)']); c.fillRect(-50, -50, 100, 100); }
  ellipse(c, 0, 40, 26, 6, 'rgba(0,0,0,.25)');
  c.translate(0, bob);
  const out = '#1f1d2b'; c.lineWidth = 2.6; c.strokeStyle = out; c.lineJoin = 'round';
  const fillS = (f) => { c.fillStyle = f; c.fill(); c.stroke(); };
  // tails/wings behind
  if (sp === 'fox') { c.beginPath(); c.moveTo(14, 26); c.quadraticCurveTo(46, 20, 40, -6); c.quadraticCurveTo(30, 16, 10, 18); fillS(c1); c.beginPath(); c.moveTo(40, -6); c.quadraticCurveTo(36, 4, 32, 8); c.lineTo(42, 2); c.closePath(); c.fillStyle = c2; c.fill(); }
  if (sp === 'cat') { c.beginPath(); c.moveTo(16, 28); c.quadraticCurveTo(44, 26, 36, 0); c.lineWidth = 7; c.strokeStyle = out; c.stroke(); c.lineWidth = 4; c.strokeStyle = c1; c.stroke(); c.lineWidth = 2.6; c.strokeStyle = out; }
  if (sp === 'dragon' || sp === 'owl' || sp === 'bird') { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 18, 6); c.quadraticCurveTo(s * 46, -14, s * 40, 18); c.quadraticCurveTo(s * 30, 14, s * 18, 22); fillS(sp === 'dragon' ? c2 : c1); } }
  if (sp === 'dragon') { c.beginPath(); c.moveTo(14, 30); c.quadraticCurveTo(40, 36, 44, 22); c.lineTo(38, 26); c.quadraticCurveTo(30, 30, 14, 24); fillS(c1); }
  if (sp === 'axolotl') { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(s * (26 + i * 2), -16 + i * 7, 9, 3.5, s * (-0.5 + i * 0.4), 0, TAU); fillS(c2); } }
  if (sp === 'jelly') { for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 8, 18); c.quadraticCurveTo(i * 8 + Math.sin(t * 4 + i) * 6, 32, i * 8 + 2, 42); c.lineWidth = 4; c.strokeStyle = c2; c.stroke(); } c.lineWidth = 2.6; c.strokeStyle = out; }
  // body
  if (sp === 'slime' || sp === 'jelly' || sp === 'ghost') {
    c.beginPath();
    if (sp === 'ghost') { c.moveTo(-28, 34); c.lineTo(-28, -6); c.arc(0, -6, 28, Math.PI, 0); c.lineTo(28, 34); for (let i = 0; i < 4; i++) c.quadraticCurveTo(28 - i * 14 - 7, 26 + (i % 2 ? 8 : -2), 28 - (i + 1) * 14, 34); }
    else if (sp === 'jelly') { c.moveTo(-30, 18); c.bezierCurveTo(-32, -34, 32, -34, 30, 18); c.quadraticCurveTo(0, 26, -30, 18); }
    else { c.moveTo(-34, 32); c.bezierCurveTo(-38, -30, 38, -30, 34, 32); c.quadraticCurveTo(0, 38, -34, 32); }
    c.closePath(); c.fillStyle = lgrad(c, 0, -30, 0, 34, [c1, c2]); c.fill(); c.stroke();
    ellipse(c, -12, -10, 7, 4, 'rgba(255,255,255,.6)');
  } else {
    // body
    const bodyCol = sp === 'robot' ? lgrad(c, 0, 0, 0, 40, [c1, '#64748b']) : c1;
    c.beginPath(); if (sp === 'robot') rr(c, -22, 6, 44, 30, 8); else c.ellipse(0, 22, 24, 18, 0, 0, TAU); fillS(bodyCol);
    if (sp !== 'robot') { c.beginPath(); c.ellipse(0, 25, 13, 11, 0, 0, TAU); c.fillStyle = sp === 'penguin' ? c2 : 'rgba(255,255,255,.35)'; c.fill(); }
    // feet
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 12, 38, 8, 5, 0, 0, TAU); fillS(sp === 'bird' || sp === 'penguin' ? '#f59e0b' : (sp === 'frog' ? c2 : c1)); }
    // ears behind head
    if (sp === 'bunny') for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 11, -40, 7, 20, s * 0.15, 0, TAU); fillS(c1); c.beginPath(); c.ellipse(s * 11, -40, 3.5, 14, s * 0.15, 0, TAU); c.fillStyle = c2; c.fill(); }
    if (sp === 'cat' || sp === 'fox' || sp === 'dragon') for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 8, -28); c.lineTo(s * 24, -44); c.lineTo(s * 26, -16); c.closePath(); fillS(sp === 'dragon' ? c2 : c1); }
    if (sp === 'dog') for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 25, -12, 8, 15, s * -0.4, 0, TAU); fillS(c2); }
    if (sp === 'bear' || sp === 'hamster') for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 20, -28, 9, 0, TAU); fillS(sp === 'hamster' ? c1 : c2); }
    if (sp === 'unicorn') { c.beginPath(); c.moveTo(-5, -32); c.lineTo(0, -58); c.lineTo(5, -32); c.closePath(); fillS(lgrad(c, 0, -58, 0, -32, ['#fde047', '#f472b6'])); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -26); c.lineTo(s * 20, -40); c.lineTo(s * 24, -20); c.closePath(); fillS(c1); } }
    if (sp === 'robot') { c.beginPath(); c.moveTo(0, -30); c.lineTo(0, -44); c.stroke(); circle(c, 0, -46, 4, c2); c.stroke(); }
    if (sp === 'owl') for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -26); c.lineTo(s * 22, -38); c.lineTo(s * 24, -20); c.closePath(); fillS(c1); }
    // head
    c.beginPath(); if (sp === 'robot') rr(c, -26, -32, 52, 40, 12); else if (sp === 'frog') c.ellipse(0, -6, 30, 22, 0, 0, TAU); else c.ellipse(0, -8, 28, 25, 0, 0, TAU);
    fillS(sp === 'robot' ? lgrad(c, 0, -32, 0, 8, ['#e2e8f0', c1]) : c1);
    if (sp === 'penguin') { c.beginPath(); c.ellipse(0, -2, 20, 17, 0, 0, TAU); c.fillStyle = c2; c.fill(); }
    if (sp === 'fox') { c.beginPath(); c.moveTo(-24, 0); c.quadraticCurveTo(0, 26, 24, 0); c.quadraticCurveTo(0, 8, -24, 0); c.fillStyle = c2; c.fill(); }
    if (sp === 'frog') for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 14, -26, 10, 0, TAU); fillS(c1); }
    if (sp === 'robot') { rr(c, -18, -24, 36, 22, 6); c.fillStyle = '#0f172a'; c.fill(); }
    if (sp === 'owl') { for (const s of [-1, 1]) { circle(c, s * 11, -10, 10, c2); } }
    if (sp === 'dragon') { for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-4 + i * 0, -33 - i * 0); } }
  }
  // face
  const eyeY = sp === 'slime' ? 2 : sp === 'jelly' ? -6 : sp === 'ghost' ? -6 : sp === 'frog' ? -26 : -10, eyeX = sp === 'frog' ? 14 : 11;
  const blink = (Math.sin(t * 1.3 + pet.id) > 0.97);
  for (const s of [-1, 1]) {
    if (sp === 'robot') { c.fillStyle = c2; c.shadowColor = c2; c.shadowBlur = 8; rr(c, s * 10 - 5, -18, 10, 8, 3); c.fill(); c.shadowBlur = 0; continue; }
    if (blink) { c.beginPath(); c.moveTo(s * eyeX - 5, eyeY); c.lineTo(s * eyeX + 5, eyeY); c.stroke(); continue; }
    circle(c, s * eyeX, eyeY, 6, '#1f1d2b'); circle(c, s * eyeX + 2, eyeY - 2, 2.2, '#fff'); circle(c, s * eyeX - 2, eyeY + 2, 1, '#fff');
  }
  if (sp !== 'robot') { for (const s of [-1, 1]) ellipse(c, s * 19, eyeY + 9, 5, 3, 'rgba(255,110,150,.45)'); }
  c.lineWidth = 2.2; c.beginPath();
  if (sp === 'owl' || sp === 'bird' || sp === 'penguin') { c.moveTo(-4, eyeY + 6); c.lineTo(4, eyeY + 6); c.lineTo(0, eyeY + 12); c.closePath(); c.fillStyle = '#f59e0b'; c.fill(); c.stroke(); }
  else if (sp === 'robot') { c.moveTo(-8, -6); c.lineTo(8, -6); c.strokeStyle = c2; c.stroke(); c.strokeStyle = out; }
  else { c.moveTo(-5, eyeY + 9); c.quadraticCurveTo(0, eyeY + 14, 5, eyeY + 9); c.stroke(); }
  // accessory
  const topY = sp === 'slime' ? -22 : sp === 'jelly' ? -24 : sp === 'ghost' ? -34 : -34;
  if (pet.acc === 'crown') { c.beginPath(); c.moveTo(-14, topY + 2); c.lineTo(-14, topY - 12); c.lineTo(-7, topY - 5); c.lineTo(0, topY - 15); c.lineTo(7, topY - 5); c.lineTo(14, topY - 12); c.lineTo(14, topY + 2); c.closePath(); fillS('#facc15'); circle(c, 0, topY - 3, 2.5, '#ef4444'); }
  if (pet.acc === 'halo') { c.beginPath(); c.ellipse(0, topY - 10, 16, 5, 0, 0, TAU); c.lineWidth = 4; c.strokeStyle = '#fde047'; c.shadowColor = '#fde047'; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0; c.lineWidth = 2.6; c.strokeStyle = out; }
  if (pet.acc === 'bow') { c.beginPath(); c.moveTo(14, topY + 6); c.lineTo(4, topY); c.lineTo(4, topY + 12); c.closePath(); c.moveTo(14, topY + 6); c.lineTo(24, topY); c.lineTo(24, topY + 12); c.closePath(); fillS('#f43f5e'); circle(c, 14, topY + 6, 3, '#be123c'); }
  if (pet.acc === 'star') { star(c, -16, topY + 2, 8, 3.6, 5); fillS('#fde047'); }
  if (pet.acc === 'glasses') { c.lineWidth = 2.2; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 11, eyeY, 8, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(-3, eyeY); c.lineTo(3, eyeY); c.stroke(); }
  if (pet.acc === 'scarf') { c.beginPath(); rr(c, -20, 8, 40, 7, 3); fillS('#ef4444'); c.beginPath(); rr(c, 8, 10, 7, 16, 3); fillS('#dc2626'); }
  if (pet.r === 'Mythic' || pet.r === 'Legendary') { for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * TAU / 4; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); star(c, Math.cos(a) * 40, Math.sin(a) * 34 - 4, 4, 1.6, 4); c.fillStyle = '#fff'; c.fill(); } c.globalAlpha = 1; }
  c.restore();
}
function petCanvas(pet, size, anim) {
  const cvs = document.createElement('canvas'); const d = Math.min(window.devicePixelRatio || 1, 2); cvs.width = cvs.height = size * d; const c = cvs.getContext('2d');
  if (c) { c.scale(d, d); drawPet(c, pet, size, anim || 0); }
  return cvs;
}
let rewardOpen = false;
function awardPet() {
  const own = Prof.d.pets; const left = PETS.filter(p => own.indexOf(p.id) < 0);
  if (!left.length) { Prof.addCoins(150); toast('🐾 Collection complete! +150 coins instead'); return; }
  let tot = 0; left.forEach(p => tot += RAR[p.r][0]); let r = Math.random() * tot, pet = left[0];
  for (const p of left) { r -= RAR[p.r][0]; if (r <= 0) { pet = p; break; } }
  if (own.indexOf(pet.id) >= 0) return; // safety: never duplicate
  own.push(pet.id); Prof.save(); checkAch();
  rewardOpen = true; syncPaused();
  const el = $('#reward'), cv2 = $('#rwCv'), c = cv2.getContext('2d');
  $('#rwName').textContent = pet.n; $('#rwRar').textContent = pet.r.toUpperCase(); $('#rwRar').style.color = RAR[pet.r][1];
  $('#rwTxt').textContent = `Added to MY PET COLLECTION (${own.length}/${PETS.length}). Keep playing to unlock the next pet in 3 minutes!`;
  el.hidden = false; Sound.play('rare', 0);
  const t0 = performance.now();
  (function anim() { if (el.hidden) return; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 320, 320); drawPet(c, pet, 320, (performance.now() - t0) / 1000); requestAnimationFrame(anim); })();
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i'); p.className = 'confetti'; p.style.left = Math.random() * 100 + 'vw'; p.style.background = pick(['#ff5e8a', '#ffcf4a', '#34d399', '#22d3ee', '#a78bfa']);
    p.style.animationDuration = rand(1.8, 3.6) + 's'; p.style.animationDelay = rand(0, 0.6) + 's'; document.body.appendChild(p); setTimeout(() => p.remove(), 4500);
  }
}
$('#rwOk').addEventListener('click', () => { $('#reward').hidden = true; rewardOpen = false; syncPaused(); renderPetChip(); });

/* ------------------------------ engine ------------------------------ */
const gameEl = $('#game'), cv = $('#cv'), ctx = cv.getContext('2d');
const hudL = $('#hudL'), hudR = $('#hudR'), hintEl = $('#hint'), layer = $('#layer'), padsEl = $('#pads');
const E = {
  cv, ctx, W: 800, H: 600, dpr: 1, cam: { x: 0, y: 0, zoom: 1 }, layer, mode: 1,
  running: false, paused: false, over: false, def: null, g: null, time: 0
};
const GAMES = [];
function registerGame(def) { if (!GAMES.some(g => g.id === def.id)) GAMES.push(def); }
const isTouchDevice = () => (window.matchMedia && matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
E.touch = isTouchDevice();

/* ---- input (keyboard + mouse + touch joystick + pointer) ---- */
const keys = {};
const Input = (() => {
  let boostKey = false, boostBtn = false, lastKeyT = 0, lastMouseT = 0;
  const ptr = { active: false, kind: 'mouse', x: 0, y: 0, sx: 0, sy: 0, id: null };
  const JR = 58, joy = $('#joy'), knob = $('#knob'), bb = $('#boostBtn');
  const joyMode = () => E.def && E.def.input === 'joy';
  function setKnob() {
    const dx = ptr.x - ptr.sx, dy = ptr.y - ptr.sy, d = Math.hypot(dx, dy) || 1, m = Math.min(d, JR);
    knob.style.transform = `translate(${dx / d * m}px,${dy / d * m}px)`;
  }
  window.addEventListener('keydown', e => {
    const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (typing) return;
    keys[e.code] = true; lastKeyT = performance.now();
    if (e.code === 'Space') boostKey = true;
    if (E.running && (e.code === 'Space' || e.code.indexOf('Arrow') === 0 || e.code === 'Tab' || e.code === 'Backspace')) e.preventDefault();
    if (!e.repeat) E.onKey(e.code, e.key);
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false; if (e.code === 'Space') { boostKey = false; if (E.running) e.preventDefault(); }
    if (E.running && E.g && E.g.onKeyUp && !E.paused) E.g.onKeyUp(e.code);
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; boostKey = false; boostBtn = false; });
  const gp = () => E.running && E.g && !E.paused && !E.over;
  cv.addEventListener('pointerdown', e => {
    Sound.init();
    if (!joyMode()) { try { cv.setPointerCapture(e.pointerId); } catch (err) {} if (gp() && E.g.down) E.g.down(e.clientX, e.clientY, e.pointerId, e); E.ptrDown = true; E.px = e.clientX; E.py = e.clientY; e.preventDefault(); return; }
    if (e.pointerType === 'mouse') { ptr.kind = 'mouse'; ptr.active = true; ptr.x = e.clientX; ptr.y = e.clientY; if (gp() && E.g.down) E.g.down(e.clientX, e.clientY, e.pointerId, e); return; }
    if (ptr.id !== null && ptr.active && ptr.kind === 'touch') { if (gp() && E.g.down) E.g.down(e.clientX, e.clientY, e.pointerId, e); return; }
    ptr.kind = 'touch'; ptr.active = true; ptr.id = e.pointerId;
    ptr.sx = ptr.x = e.clientX; ptr.sy = ptr.y = e.clientY;
    joy.style.left = (ptr.sx - 58) + 'px'; joy.style.top = (ptr.sy - 58) + 'px'; joy.style.display = 'block'; setKnob();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    E.px = e.clientX; E.py = e.clientY;
    if (!joyMode()) { if (gp() && E.g.move) E.g.move(e.clientX, e.clientY, e.pointerId, e); return; }
    if (e.pointerType === 'mouse') { ptr.kind = 'mouse'; ptr.active = true; ptr.x = e.clientX; ptr.y = e.clientY; lastMouseT = performance.now(); }
    else if (e.pointerId === ptr.id) { ptr.x = e.clientX; ptr.y = e.clientY; setKnob(); }
  });
  const up = e => {
    E.ptrDown = false;
    if (!joyMode()) { if (E.running && E.g && E.g.up && !E.over) E.g.up(e.clientX, e.clientY, e.pointerId, e); return; }
    if (e.pointerType !== 'mouse' && e.pointerId === ptr.id) { ptr.active = false; ptr.id = null; joy.style.display = 'none'; }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && joyMode()) ptr.active = false; });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => { if (gp() && E.g.wheel) { E.g.wheel(e.deltaY); e.preventDefault(); } }, { passive: false });
  const bon = e => { e.preventDefault(); boostBtn = true; bb.classList.add('on'); Sound.init(); };
  const boff = () => { boostBtn = false; bb.classList.remove('on'); };
  bb.addEventListener('pointerdown', bon);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => bb.addEventListener(n, boff));
  const ZERO = { x: 0, y: 0, mag: 0 };
  return {
    dir(set) {
      const L = set === 2 ? ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] : set === 1 ? ['KeyA', 'KeyD', 'KeyW', 'KeyS'] : null;
      const x = L ? (keys[L[1]] ? 1 : 0) - (keys[L[0]] ? 1 : 0) : ((keys.ArrowRight || keys.KeyD) ? 1 : 0) - ((keys.ArrowLeft || keys.KeyA) ? 1 : 0);
      const y = L ? (keys[L[3]] ? 1 : 0) - (keys[L[2]] ? 1 : 0) : ((keys.ArrowDown || keys.KeyS) ? 1 : 0) - ((keys.ArrowUp || keys.KeyW) ? 1 : 0);
      if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m, mag: 1 }; }
      if (set) return ZERO;
      if (ptr.active && (ptr.kind === 'touch' || lastMouseT > lastKeyT)) {
        if (ptr.kind === 'touch') {
          const dx = ptr.x - ptr.sx, dy = ptr.y - ptr.sy, d = Math.hypot(dx, dy);
          if (d < 8) return ZERO; return { x: dx / d, y: dy / d, mag: clamp(d / JR, 0, 1) };
        }
        const dx = ptr.x - E.W / 2, dy = ptr.y - E.H / 2, d = Math.hypot(dx, dy);
        if (d < 14) return ZERO; return { x: dx / d, y: dy / d, mag: clamp((d - 14) / (Math.min(E.W, E.H) * 0.2), 0, 1) };
      }
      return ZERO;
    },
    boost() { return boostKey || boostBtn; },
    reset() { for (const k in keys) keys[k] = false; boostKey = boostBtn = false; ptr.active = false; ptr.id = null; joy.style.display = 'none'; bb.classList.remove('on'); }
  };
})();

E.dir = set => (E.over ? { x: 0, y: 0, mag: 0 } : Input.dir(set));
E.boost = () => !E.over && Input.boost();
E.key = c => !!keys[c];
E.keys = keys;
E.sound = (n, g) => Sound.play(n, g);
E.note = (f, d, t, v) => Sound.note(f, d, t, v);
E.best = () => store.get('best_' + (E.def ? E.def.id : ''), 0);
E.data = (k, d) => store.get('g_' + E.def.id + '_' + k, d);
E.save = (k, v) => store.set('g_' + E.def.id + '_' + k, v);
E.ach = id => unlockAch(id);
E.coins = n => Prof.addCoins(n);
E.fx = Fx; E.ui = UI; E.fit = (w, h, p) => fitView(E, w, h, p);
E.shakeAmt = 0; E.shake = a => { E.shakeAmt = Math.max(E.shakeAmt, a); };
E.isTouch = () => E.touch;
E.submitBest = score => {
  if (!E.def) return false; const id = E.def.id, prev = store.get('best_' + id, 0), lb = E.def.lowerBetter;
  const isNew = lb ? (score > 0 && (prev === 0 || score < prev)) : score > prev;
  if (isNew) { store.set('best_' + id, score); Prof.d.bests++; Prof.daily().bests++; Prof.save(); checkAch(); checkDaily(); }
  return isNew;
};

/* ---- camera + drawing helpers ---- */
E.beginWorld = (sx, sy) => {
  const k = E.dpr * E.cam.zoom;
  ctx.setTransform(k, 0, 0, k, E.dpr * E.W / 2 - E.cam.x * k + (sx || 0) * E.dpr, E.dpr * E.H / 2 - E.cam.y * k + (sy || 0) * E.dpr);
};
E.endWorld = () => ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
E.view = m => {
  m = m || 0; const hw = E.W / (2 * E.cam.zoom) + m, hh = E.H / (2 * E.cam.zoom) + m;
  return { x0: E.cam.x - hw, y0: E.cam.y - hh, x1: E.cam.x + hw, y1: E.cam.y + hh };
};
E.follow = (x, y, zoom, dt, snap) => {
  const c = E.cam, k = snap ? 1 : Math.min(1, dt * 7);
  c.x += (x - c.x) * k; c.y += (y - c.y) * k; c.zoom += (zoom - c.zoom) * Math.min(1, dt * 3.5 + (snap ? 1 : 0));
};
E.screenScale = () => clamp(Math.min(E.W, E.H) / 720, 0.6, 1.15);
const spriteCache = {};
E.sprite = (ch, size) => {
  size = Math.max(8, Math.round(size)); const k = ch + size; let c = spriteCache[k];
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    if (x) {
      x.font = `${Math.floor(size * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, size / 2, size / 2 + size * 0.05);
    }
    spriteCache[k] = c;
  }
  return c;
};
E.emoji = (c, ch, x, y, size) => { const s = E.sprite(ch, size * 1.3 * Math.min(2, E.dpr)); c.drawImage(s, x - size * 0.65, y - size * 0.65, size * 1.3, size * 1.3); };
const glowCache = {};
E.glow = hue => {
  const h = Math.round(hue / 15) * 15; let c = glowCache[h];
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    if (x) {
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `hsla(${h},100%,80%,1)`); g.addColorStop(0.25, `hsla(${h},100%,62%,.7)`); g.addColorStop(1, `hsla(${h},100%,50%,0)`);
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    }
    glowCache[h] = c;
  }
  return c;
};

/* ---- on-screen touch pads (multi-touch, each mapped to a key code) ---- */
let padList = [];
E.pads = (list, force) => {
  padsEl.textContent = ''; padList = [];
  if (!list || !(E.touch || force)) return;
  list.forEach(p => {
    const b = document.createElement('div'); b.className = 'pad ' + (p.cls || ''); b.innerHTML = p.label;
    const s = p.size || 72; b.style.width = (p.w || s) + 'px'; b.style.height = (p.h || s) + 'px'; b.style.fontSize = (p.fs || Math.round(s * 0.32)) + 'px';
    ['left', 'right', 'top', 'bottom'].forEach(k => { if (p[k] !== undefined) b.style[k] = typeof p[k] === 'number' ? (k === 'left' ? `calc(${p[k]}px + env(safe-area-inset-left))` : k === 'right' ? `calc(${p[k]}px + env(safe-area-inset-right))` : k === 'bottom' ? `calc(${p[k]}px + env(safe-area-inset-bottom))` : p[k] + 'px') : p[k]; });
    const on = e => { e.preventDefault(); e.stopPropagation(); Sound.init(); try { b.setPointerCapture(e.pointerId); } catch (er) {} if (keys[p.k]) return; keys[p.k] = true; b.classList.add('on'); if (E.running && !E.paused && !E.over) E.onKey(p.k, ''); };
    const off = e => { if (!keys[p.k]) return; keys[p.k] = false; b.classList.remove('on'); if (E.running && E.g && E.g.onKeyUp && !E.paused) E.g.onKeyUp(p.k); };
    b.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => b.addEventListener(n, off));
    padsEl.appendChild(b); padList.push(b);
  });
};
E.toast = toast;
function toast(s) {
  const t = $('#toast'); const d = document.createElement('div'); d.textContent = s; t.appendChild(d); setTimeout(() => d.remove(), 2700);
  while (t.children.length > 4) t.firstChild.remove();
}

/* ---- generic panel ---- */
const panelEl = $('#panel'), panelBody = $('#panelBody');
let userPaused = false, panelOpen = false, choosing = false;
function syncPaused() { E.paused = userPaused || panelOpen || choosing || rewardOpen; }
E.panel = {
  open(title, node) { $('#panelTitle').textContent = title; panelBody.textContent = ''; panelBody.appendChild(node); panelEl.hidden = false; panelOpen = true; syncPaused(); Sound.play('click', 0); },
  close() { if (!panelOpen) return; panelEl.hidden = true; panelOpen = false; syncPaused(); if (E.g && E.g.panelClosed) E.g.panelClosed(); },
  get isOpen() { return panelOpen; }
};
$('#panelClose').addEventListener('click', () => E.panel.close());
panelEl.addEventListener('pointerdown', e => { if (e.target === panelEl) E.panel.close(); });

/* ---- chooser (mode / difficulty select) ---- */
E.choose = (title, sub, opts, cb) => {
  choosing = true; syncPaused(); Input.reset();
  $('#cTitle').textContent = title; $('#cSub').innerHTML = sub || '';
  const box = $('#cOpts'); box.textContent = '';
  opts.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'btn ' + (o.cls || (i === 0 ? 'primary' : ''));
    b.innerHTML = esc(o.label) + (o.sub ? `<small>${esc(o.sub)}</small>` : '');
    b.addEventListener('click', () => { $('#chooser').hidden = true; choosing = false; syncPaused(); Sound.play('click', 0); cb(o.value === undefined ? i : o.value); });
    box.appendChild(b);
  });
  $('#chooser').hidden = false;
};

/* ---- overlays: pause / game over ---- */
const overlay = $('#overlay');
let overlayMode = '', overTimer = 0;
function showOverlay(mode, info) {
  overlayMode = mode; overlay.hidden = false;
  $('#oResume').hidden = mode !== 'pause';
  $('#oAgain').textContent = mode === 'pause' ? '↻ Restart' : (info && info.again) || '↻ Play Again';
  $('#oAgain').classList.toggle('primary', mode !== 'pause');
  if (mode === 'pause') {
    $('#oTitle').textContent = 'Paused'; $('#oScore').textContent = ''; $('#oLabel').textContent = '';
    $('#oBest').textContent = ''; $('#oBest').className = 'obest'; $('#oLines').textContent = 'Press P or Esc to resume';
  } else {
    $('#oTitle').textContent = info.title || 'Game Over';
    $('#oScore').textContent = info.scoreText !== undefined ? info.scoreText : fmt(info.score); $('#oLabel').textContent = info.label || (E.def && E.def.scoreLabel) || 'SCORE';
    $('#oBest').textContent = info.noBest ? '' : info.isNew ? '🏆 NEW BEST!' : (info.best ? '🏆 Best: ' + (E.def.fmtScore ? E.def.fmtScore(info.best) : fmt(info.best)) : '');
    $('#oBest').className = 'obest' + (info.isNew ? ' new' : '');
    $('#oLines').innerHTML = (info.lines || []).map(esc).join('<br>') + (info.coins ? `<br><b style="color:#ffe36e">🪙 +${info.coins} coins</b>` : '');
  }
}
const hideOverlay = () => { overlay.hidden = true; overlayMode = ''; };
function setPause(v) {
  if (E.over || !E.running) return;
  userPaused = v; syncPaused(); Input.reset();
  if (v) showOverlay('pause'); else hideOverlay();
}
let sessionActive = 0;
E.gameOver = info => {
  if (E.over) return; E.over = true; Input.reset();
  const id = E.def.id, prev = store.get('best_' + id, 0), score = info.score === undefined ? 0 : (E.def.lowerBetter ? info.score : Math.floor(info.score));
  const isNew = info.noBest ? false : E.submitBest(score);
  if (info.twoP) { Prof.d.twoP++; Prof.daily().twoP++; Prof.save(); checkAch(); checkDaily(); }
  const coins = Math.min(120, 5 + Math.floor(sessionActive / 10) + (isNew ? 20 : 0) + (info.win ? 10 : 0)); sessionActive = 0;
  Prof.addCoins(coins, true); checkDaily();
  Sound.play(info.win ? 'win' : (info.sound || 'die'), 0);
  clearTimeout(overTimer);
  overTimer = setTimeout(() => { if (E.running && E.over) showOverlay('over', { title: info.title, score, scoreText: info.scoreText, label: info.label, best: E.def.lowerBetter ? (isNew ? score : prev) : Math.max(prev, score), isNew, lines: info.lines, noBest: info.noBest, coins, again: info.again }); }, info.delay === undefined ? 700 : info.delay);
};

/* ---- pet chip ---- */
const PET_SECS = 180;
function renderPetChip() {
  const left = PET_SECS - Prof.d.petTime, chip = $('#petChip');
  chip.querySelector('b').textContent = Prof.d.pets.length >= PETS.length ? '✓' : fmtTime(left);
  chip.querySelector('i').style.width = clamp(Prof.d.petTime / PET_SECS * 100, 0, 100) + '%';
  chip.style.opacity = E.paused || E.over ? 0.55 : 1;
}

/* ---- start / stop ---- */
let raf = 0, lastTs = 0, hudAcc = 0, lastL = '', lastR = '', hintTimer = 0, saveAcc = 0;
function resize() {
  const r = gameEl.getBoundingClientRect();
  E.dpr = Math.min(window.devicePixelRatio || 1, 2);
  E.W = Math.max(300, r.width || window.innerWidth || 800); E.H = Math.max(240, r.height || window.innerHeight || 600);
  cv.width = Math.floor(E.W * E.dpr); cv.height = Math.floor(E.H * E.dpr);
  if (E.g && E.g.resize) E.g.resize();
}
let rzT = 0;
const onRz = () => { if (!E.running) return; resize(); clearTimeout(rzT); rzT = setTimeout(resize, 300); };
['resize', 'orientationchange'].forEach(n => window.addEventListener(n, onRz));
if (window.visualViewport) window.visualViewport.addEventListener('resize', onRz);

function teardown() {
  if (E.g && E.g.destroy) { try { E.g.destroy(); } catch (e) { console.error(e); } }
  E.g = null; layer.textContent = ''; E.pads(null); hudL.innerHTML = ''; hudR.innerHTML = ''; lastL = lastR = '';
  $('#toast').textContent = ''; E.shakeAmt = 0;
}
function startGame(def, keepMode) {
  Sound.init(); clearTimeout(overTimer); clearTimeout(hintTimer);
  teardown();
  E.def = def; E.over = false; userPaused = false; panelOpen = false; choosing = false; E.paused = false; E.time = 0;
  hideOverlay(); panelEl.hidden = true; $('#chooser').hidden = true; Input.reset();
  document.body.classList.add('playing'); gameEl.classList.add('on'); $('#app').style.display = 'none';
  gameEl.style.background = def.bg || '#05060d';
  resize();
  E.cam.x = E.cam.y = 0; E.cam.zoom = 1;
  E.running = true;
  if (!raf) { lastTs = performance.now(); raf = requestAnimationFrame(frame); }
  const go = () => {
    if (!E.running || E.def !== def) return;
    E.g = def.create(E) || null;
    const bb = $('#boostBtn'); bb.hidden = !def.boost || !E.g; if (def.boost) bb.textContent = def.boost;
    const ex = $('#btnExtra');
    if (E.g && E.g.extra) { ex.hidden = false; ex.textContent = E.g.extra.label; ex.onclick = () => { if (E.g && E.g.extra) E.g.extra.action(); ex.blur(); }; } else { ex.hidden = true; ex.onclick = null; }
    let h = E.touch ? (def.hintTouch || def.hint) : def.hint; if (E.mode === 2 && def.hint2) h = E.touch ? (def.hint2Touch || def.hint2) : def.hint2;
    hintEl.style.opacity = h ? 1 : 0; hintEl.textContent = h || '';
    clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintEl.style.opacity = 0; }, 7000);
    lastTs = performance.now(); renderHud();
  };
  // stats
  Prof.d.plays[def.id] = (Prof.d.plays[def.id] || 0) + 1; Prof.d.sessions++;
  Prof.d.recent = [def.id].concat(Prof.d.recent.filter(x => x !== def.id)).slice(0, 12);
  const dd = Prof.daily(); if (dd.games.indexOf(def.id) < 0) dd.games.push(def.id);
  Prof.save(); checkAch(); checkDaily(); sessionActive = 0;
  if (def.twoP && !keepMode) {
    E.mode = 1;
    E.choose(def.title, 'Choose a mode' + (def.p2info ? `<br><small style="opacity:.8">${esc(def.p2info)}</small>` : ''),
      [{ label: '👤 1 PLAYER', sub: def.p1sub || 'Play solo', value: 1 }, { label: '👥 2 PLAYERS', sub: def.p2sub || 'Same device – local multiplayer', value: 2, cls: 'p2c' }],
      v => { E.mode = v; go(); });
  } else { if (!def.twoP) E.mode = 1; go(); }
}
function stopGame() {
  E.running = false; teardown(); clearTimeout(overTimer); clearTimeout(hintTimer);
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  Input.reset(); hideOverlay(); panelEl.hidden = true; $('#chooser').hidden = true; panelOpen = false; choosing = false; userPaused = false; E.paused = false;
  gameEl.classList.remove('on'); document.body.classList.remove('playing'); $('#app').style.display = '';
  Prof.save(); renderMenu();
}
function frame(ts) {
  raf = requestAnimationFrame(frame);
  if (!E.running) return;
  let dt = (ts - lastTs) / 1000; lastTs = ts; if (!(dt > 0)) dt = 0.016; if (dt > 0.05) dt = 0.05;
  if (!E.g) { ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0); ctx.fillStyle = '#05060d'; ctx.fillRect(0, 0, E.W, E.H); return; }
  const active = !E.paused && !E.over && !document.hidden;
  try {
    if (!E.paused) { E.time += dt; E.g.update(dt); }
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0); ctx.clearRect(0, 0, E.W, E.H);
    if (E.shakeAmt > 0.3) { ctx.translate(rand(-1, 1) * E.shakeAmt, rand(-1, 1) * E.shakeAmt); if (!E.paused) E.shakeAmt *= Math.pow(0.0005, dt); } else E.shakeAmt = 0;
    if (E.g) E.g.draw();
  } catch (err) { console.error(err); }
  if (active && E.g) {
    sessionActive += dt; const d = Prof.d; d.time[E.def.id] = (d.time[E.def.id] || 0) + dt; Prof.daily().secs += dt;
    if (d.pets.length < PETS.length) { d.petTime += dt; if (d.petTime >= PET_SECS) { d.petTime = 0; awardPet(); } }
    saveAcc += dt; if (saveAcc > 4) { saveAcc = 0; Prof.save(); checkAch(); checkDaily(); }
  }
  hudAcc += dt; if (hudAcc > 0.12) { hudAcc = 0; try { renderHud(); renderPetChip(); } catch (err) { console.error(err); } }
}
function renderHud() {
  if (!E.g || !E.g.hud) { if (lastL) { hudL.innerHTML = ''; lastL = ''; } if (lastR) { hudR.innerHTML = ''; lastR = ''; } return; }
  const h = E.g.hud(); if (!h) return;
  let s = ''; for (const [k, v] of (h.stats || [])) s += `<div class="chip"><span>${k}</span><b>${v}</b></div>`;
  if (s !== lastL) { hudL.innerHTML = s; lastL = s; }
  let b = '';
  if (h.board) {
    b = `<div class="bt">${esc(h.boardTitle || 'LEADERBOARD')}</div>`;
    h.board.forEach((r, i) => { b += `<div class="br${r.me ? ' me' : ''}"><i>${r.rank || i + 1}</i><span>${esc(r.n)}</span><b>${r.s}</b></div>`; });
  }
  if (b !== lastR) { hudR.innerHTML = b; lastR = b; }
}

/* ---- sound toggle ---- */
function syncMute() { const t = Sound.muted ? '🔇' : '🔊'; $('#btnMute').textContent = t; $('#muteMenu').textContent = t; }
function toggleMute() { Sound.init(); Sound.setMuted(!Sound.muted); syncMute(); if (!Sound.muted) Sound.play('click', 0); }
$('#btnMute').addEventListener('click', e => { toggleMute(); e.currentTarget.blur(); });
$('#muteMenu').addEventListener('click', toggleMute);
syncMute();

/* ---- buttons ---- */
$('#btnPause').addEventListener('click', e => { setPause(!userPaused); e.currentTarget.blur(); });
$('#btnRestart').addEventListener('click', e => { e.currentTarget.blur(); if (E.def && !choosing) startGame(E.def, true); });
$('#oResume').addEventListener('click', () => setPause(false));
$('#oAgain').addEventListener('click', () => { if (E.def) startGame(E.def, true); });
$('#oMenu').addEventListener('click', goMenu);
$('#btnMenu').addEventListener('click', goMenu);
document.addEventListener('visibilitychange', () => { if (document.hidden) { Prof.save(); if (E.running && !E.over && !userPaused && !choosing && E.g) setPause(true); } });
window.addEventListener('pagehide', () => Prof.save());
['pointerdown', 'keydown', 'touchstart'].forEach(n => window.addEventListener(n, () => Sound.init(), { passive: true }));

E.onKey = (code, key) => {
  if (!E.running) return;
  if (code === 'KeyM' && !(E.g && E.g.typing)) { toggleMute(); return; }
  if (choosing) return;
  if (E.over) { if (overlayMode === 'over' && code === 'Enter') startGame(E.def, true); return; }
  if (code === 'Escape' || (code === 'KeyP' && !(E.g && E.g.typing))) { if (panelOpen) E.panel.close(); else setPause(!userPaused); return; }
  if (code === 'Enter' && overlayMode === 'pause') { setPause(false); return; }
  if (E.g && E.g.onKey && !E.paused) E.g.onKey(code, key);
};

/* ------------------------------ homepage ------------------------------ */
const CATS = ['All', 'Popular', 'Multiplayer', 'Physics', 'Arcade', 'Endless', 'Puzzle', 'Brain Games', 'Sports', 'Simulation', 'Creative', 'IO Arena'];
let curCat = store.get('cat', 'All'), curQ = '', featIdx = 0, featTimer = 0, homeTab = 'pets';
const menuEl = $('#menu');
function updateCoinBtn() { $('#coinBtn').textContent = '🪙 ' + fmt(Prof.d.coins); }
function applyTheme() { document.body.className = document.body.className.replace(/\bth-\w+/g, '').trim(); if (Prof.d.theme !== 'default') document.body.classList.add('th-' + Prof.d.theme); }
const THEMES = [['default', 'Galaxy', 0, '#7c5cff,#22d3ee'], ['ocean', 'Ocean', 150, '#0ea5e9,#34d399'], ['sunset', 'Sunset', 250, '#ff6a3d,#ffcf4a'], ['forest', 'Forest', 300, '#22c55e,#a3e635'], ['candy', 'Candy', 400, '#ec4899,#a78bfa'], ['gold', 'Royal Gold', 1000, '#eab308,#fde047']];
function card(def) {
  const best = store.get('best_' + def.id, 0), fav = Prof.d.favs.indexOf(def.id) >= 0;
  const el = document.createElement('article'); el.className = 'card'; el.tabIndex = 0;
  el.style.setProperty('--c1', def.c1); el.style.setProperty('--c2', def.c2);
  const bd = (def.twoP ? '<span class="badge p2">👥 2P</span>' : '') + (def.isNew ? '<span class="badge new">NEW</span>' : '') + (def.hot ? '<span class="badge hot">🔥 HOT</span>' : '');
  const bestTxt = best ? (def.fmtScore ? def.fmtScore(best) : fmt(best)) : '—';
  el.innerHTML = `<div class="art"><div class="badges">${bd}</div><button class="fav" title="Favorite">${fav ? '❤️' : '🤍'}</button><span class="e">${def.emoji}</span></div>
    <div class="info"><h3>${esc(def.title)}</h3><p>${esc(def.desc)}</p><div class="meta"><span>${esc((def.cats || [])[0] || '')}</span><span>🏆 <b>${esc(bestTxt)}</b></span></div></div>`;
  el.querySelector('.fav').addEventListener('click', e => { e.stopPropagation(); toggleFav(def.id); });
  el.addEventListener('click', () => play(def)); el.addEventListener('keydown', e => { if (e.key === 'Enter') play(def); });
  return el;
}
function toggleFav(id) { const f = Prof.d.favs, i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else { f.unshift(id); Sound.play('ding', 0); } Prof.save(); checkAch(); renderMenu(); }
function section(title, sub, defs, opts) {
  opts = opts || {}; const s = document.createElement('section'); s.className = 'sec';
  s.innerHTML = `<h2>${title} ${sub ? `<small>${sub}</small>` : ''}</h2>`;
  const box = document.createElement('div'); box.className = opts.grid ? 'grid' : 'row';
  if (!defs.length) { box.className = 'empty'; box.textContent = opts.empty || 'Nothing here yet.'; }
  defs.forEach(d => box.appendChild(card(d))); s.appendChild(box); return s;
}
const gById = id => GAMES.find(g => g.id === id);
const matches = (g, q) => { q = q.toLowerCase(); return g.title.toLowerCase().indexOf(q) >= 0 || (g.cats || []).some(c => c.toLowerCase().indexOf(q) >= 0) || (g.desc || '').toLowerCase().indexOf(q) >= 0 || (g.tags || '').indexOf(q) >= 0; };
function renderMenu() {
  updateCoinBtn(); applyTheme(); clearInterval(featTimer);
  const scrollY = window.scrollY; menuEl.textContent = '';
  if (curQ) {
    const res = GAMES.filter(g => matches(g, curQ));
    menuEl.appendChild(section(`🔍 Results for “${esc(curQ)}”`, res.length + ' game' + (res.length === 1 ? '' : 's'), res, { grid: true, empty: 'No games found. Try “puzzle”, “sports”, “2 player” or a game name.' }));
    return;
  }
  // hero
  const hero = document.createElement('section'); hero.className = 'hero';
  const feats = GAMES.filter(g => g.featured);
  const feat = document.createElement('div'); feat.className = 'feat';
  const setFeat = () => {
    const g = feats[featIdx % feats.length]; if (!g) return;
    feat.style.setProperty('--c1', g.c1); feat.style.setProperty('--c2', g.c2);
    feat.innerHTML = `<span class="fe">${g.emoji}</span><div class="ft"><small>⭐ FEATURED${g.twoP ? ' • 👥 2 PLAYERS' : ''}</small><h2>${esc(g.title)}</h2><p>${esc(g.desc)}</p><span class="go">▶ Play Now</span></div><div class="dots">${feats.map((x, i) => `<b class="${i === featIdx % feats.length ? 'on' : ''}"></b>`).join('')}</div>`;
    feat.onclick = () => play(g);
  };
  setFeat(); featTimer = setInterval(() => { featIdx++; setFeat(); }, 6000);
  const side = document.createElement('div'); side.className = 'side';
  const d = Prof.d, totalT = Object.values(d.time).reduce((a, b) => a + b, 0);
  const dd = Prof.daily(), ch = dailyList();
  side.innerHTML = `<div class="box"><h3>🐾 Next pet reward <small>${d.pets.length}/${PETS.length} collected</small></h3>
      <div class="petbar"><i style="width:${clamp(d.petTime / PET_SECS * 100, 0, 100)}%"></i></div>
      <p style="font-size:.8rem;color:var(--muted);margin-top:6px">${d.pets.length >= PETS.length ? 'You collected every pet! 🎉' : `Play any game for <b style="color:#fff">${fmtTime(PET_SECS - d.petTime)}</b> more to unlock a new pet.`}</p></div>
    <div class="box"><h3>📅 Daily Challenges <small>resets at midnight</small></h3><div class="chal">${ch.map(c => { const v = Math.min(c.goal, c.val(dd)), done = dd.done.indexOf(c.id) >= 0; return `<div class="c ${done ? 'done' : ''}"><i>${c.ic}</i><div>${esc(c.t)}<div class="pb"><u style="width:${v / c.goal * 100}%"></u></div></div><em>${done ? '✓ Done' : '+' + c.rw + ' 🪙'}</em></div>`; }).join('')}</div></div>
    <div class="box"><div class="statrow"><div><b>${Object.keys(d.plays).length}</b><span>GAMES TRIED</span></div><div><b>${Math.floor(totalT / 60)}m</b><span>PLAY TIME</span></div><div><b>${Object.keys(d.ach).length}</b><span>ACHIEVEMENTS</span></div></div></div>`;
  hero.appendChild(feat); hero.appendChild(side); menuEl.appendChild(hero);
  // categories
  const cats = document.createElement('div'); cats.className = 'cats';
  CATS.forEach(c => { const b = document.createElement('button'); b.className = 'cat' + (c === curCat ? ' on' : ''); b.textContent = c === 'Multiplayer' ? '👥 Multiplayer' : c; b.onclick = () => { curCat = c; store.set('cat', c); renderMenu(); const a = $('#allGames'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; cats.appendChild(b); });
  menuEl.appendChild(cats);
  const rec = d.recent.map(gById).filter(Boolean), favs = d.favs.map(gById).filter(Boolean);
  if (rec.length) menuEl.appendChild(section('🕹️ Recently Played', '', rec));
  menuEl.appendChild(section('❤️ Favorite Games', '', favs, { empty: 'Tap the 🤍 on any game card to add it to your favorites.' }));
  menuEl.appendChild(section('⭐ Featured Games', 'hand-picked', GAMES.filter(g => g.featured)));
  menuEl.appendChild(section('🔥 Trending Games', 'hot right now', GAMES.filter(g => g.hot)));
  const pop = GAMES.filter(g => g.pop).sort((a, b) => (d.plays[b.id] || 0) - (d.plays[a.id] || 0));
  menuEl.appendChild(section('🏆 Most Popular', '', pop));
  menuEl.appendChild(section('🆕 New Games', '', GAMES.filter(g => g.isNew)));
  menuEl.appendChild(section('👥 2-Player Games', 'local multiplayer on one device', GAMES.filter(g => g.twoP)));
  const list = curCat === 'All' ? GAMES : curCat === 'Popular' ? GAMES.filter(g => g.pop) : curCat === 'Multiplayer' ? GAMES.filter(g => g.twoP || (g.cats || []).indexOf('Multiplayer') >= 0) : GAMES.filter(g => (g.cats || []).indexOf(curCat) >= 0);
  const all = section(`🎮 ${curCat === 'All' ? 'All Games' : curCat}`, list.length + ' games', list, { grid: true }); all.id = 'allGames'; menuEl.appendChild(all);
  // progression tabs
  const ps = document.createElement('section'); ps.className = 'sec'; ps.id = 'progress';
  ps.innerHTML = `<div class="tabs">${[['pets', '🐾 MY PET COLLECTION'], ['ach', '🏅 Achievements'], ['shop', '🎨 Rewards Shop'], ['stats', '📊 Statistics']].map(([k, n]) => `<button class="cat ${homeTab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div><div class="box" id="tabBody"></div>`;
  menuEl.appendChild(ps);
  ps.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { homeTab = b.dataset.t; renderMenu(); });
  const tb = ps.querySelector('#tabBody');
  if (homeTab === 'pets') {
    tb.innerHTML = `<h3>🐾 MY PET COLLECTION <small>${d.pets.length} / ${PETS.length} unlocked • a new pet every 3 minutes of play</small></h3><div class="petbar" style="margin-bottom:12px"><i style="width:${d.pets.length / PETS.length * 100}%"></i></div><div class="pets"></div>`;
    const pg = tb.querySelector('.pets');
    PETS.forEach(p => { const got = d.pets.indexOf(p.id) >= 0; const el = document.createElement('div'); el.className = 'pet ' + (got ? 'got rk-' + p.r : 'locked'); el.appendChild(petCanvas(p, 76, got ? 1 : 0)); el.insertAdjacentHTML('beforeend', `<b>${got ? esc(p.n) : '???'}</b><span class="r-${p.r}">${p.r}</span>`); pg.appendChild(el); });
  } else if (homeTab === 'ach') {
    tb.innerHTML = `<h3>🏅 Player Achievements <small>${Object.keys(d.ach).length} / ${ACH.length} • each one gives 25 🪙</small></h3><div class="achs">${ACH.map(a => `<div class="ach ${d.ach[a[0]] ? 'got' : ''}"><i>${a[1]}</i><div><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div></div>`).join('')}</div>`;
  } else if (homeTab === 'shop') {
    tb.innerHTML = `<h3>🎨 Rewards Shop <small>earn coins by playing, completing daily challenges and achievements</small></h3><div class="shop">${THEMES.map(([k, n, cost, cols]) => { const own = d.owned.indexOf(k) >= 0, on = d.theme === k; return `<div class="sitem"><div class="sw" style="background:linear-gradient(90deg,${cols})"></div><b>${n} Theme</b><button data-th="${k}" ${!own && d.coins < cost ? 'disabled' : ''}>${on ? '✓ Active' : own ? 'Use' : '🪙 ' + cost}</button></div>`; }).join('')}</div>`;
    tb.querySelectorAll('[data-th]').forEach(b => b.onclick = () => {
      const t = THEMES.find(x => x[0] === b.dataset.th); if (!t) return;
      if (d.owned.indexOf(t[0]) < 0) { if (d.coins < t[2]) return; d.coins -= t[2]; d.owned.push(t[0]); unlockAch('shop'); Sound.play('buy', 0); }
      d.theme = t[0]; Prof.save(); renderMenu();
    });
  } else {
    const rows = GAMES.filter(g => d.plays[g.id]).sort((a, b) => (d.time[b.id] || 0) - (d.time[a.id] || 0));
    tb.innerHTML = `<h3>📊 Game Statistics <small>${Object.values(d.plays).reduce((a, b) => a + b, 0)} sessions • ${Math.floor(totalT / 60)} min played • ${fmt(d.earned)} coins earned</small></h3>` +
      (rows.length ? `<div style="overflow:auto"><table class="statsTable"><tr><th>Game</th><th>Plays</th><th>Time</th><th>Best</th></tr>${rows.map(g => { const b = store.get('best_' + g.id, 0); return `<tr><td>${g.emoji} ${esc(g.title)}</td><td>${d.plays[g.id]}</td><td>${fmtTime(d.time[g.id] || 0)}</td><td>${b ? esc(g.fmtScore ? g.fmtScore(b) : fmt(b)) : '—'}</td></tr>`; }).join('')}</table></div>` : '<div class="empty">Play some games to see your statistics here.</div>') +
      `<p style="margin-top:12px"><button class="cat" id="resetAll">🗑️ Reset all progress on this device</button></p>`;
    tb.querySelector('#resetAll').onclick = () => { if (confirm('Delete ALL TheIOGames progress, scores, coins and pets saved on this device?')) { try { Object.keys(localStorage).filter(k => k.indexOf('tiog_') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {} location.reload(); } };
  }
  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = '💾 <b>About your progress:</b> high scores, coins, pets, achievements, favorites and game saves are stored <b>locally in this browser on this device</b> (localStorage). They are not uploaded anywhere and are <b>not automatically synchronized across devices</b> or browsers. Clearing your browser data will erase them.';
  menuEl.appendChild(note);
  window.scrollTo(0, scrollY);
}
$('#q').addEventListener('input', e => { curQ = e.target.value.trim(); renderMenu(); });
$('#logo').addEventListener('click', () => { $('#q').value = ''; curQ = ''; curCat = 'All'; renderMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('#coinBtn').addEventListener('click', () => { if (E.running) return; homeTab = 'shop'; curQ = ''; $('#q').value = ''; renderMenu(); const p = $('#progress'); if (p) p.scrollIntoView({ behavior: 'smooth' }); });

function play(def) { Sound.init(); if (location.hash === '#' + def.id) route(); else location.hash = def.id; }
function goMenu() {
  if (location.hash) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
  route();
}
function route() {
  const id = location.hash.replace('#', ''); const def = GAMES.find(g => g.id === id);
  if (def) { if (!(E.running && E.def === def)) startGame(def); }
  else if (E.running) stopGame();
}
window.addEventListener('hashchange', route); window.addEventListener('popstate', route);

/* shared helpers exposed to game modules */
const H = { TAU, rand, irand, clamp, lerp, pick, shuffle, dist, angDiff, hsl, esc, fmt, fmtBig, fmtTime, rr, label, txt, lgrad, rgrad, shadowOn, shadowOff, ellipse, circle, star, segDist, rng, Fx, UI, store };
