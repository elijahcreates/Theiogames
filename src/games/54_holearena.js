/* =====================================================================
   HOLE ARENA  (grow, unlock new zones, out-eat AI holes)
   ===================================================================== */
registerGame({
  id: 'holearena', title: 'Hole Arena', emoji: '🌀', c1: '#0f0c29', c2: '#43cea2', cats: ['IO Arena', 'Arcade', 'Creative'], input: 'joy', isNew: true,
  desc: 'Start in a picnic park as a tiny hole. Swallow snacks, grow, break through the farm gates, then devour the town! Rival holes are hungry too – 2½ minute rounds.',
  controls: 'WASD / mouse / joystick', scoreLabel: 'FINAL SIZE',
  hint: 'Move with WASD or the mouse. Swallow things smaller than you. Fences open when you are big enough to enter the next zone!', hintTouch: 'Drag to move. Swallow smaller things – fences open as you grow!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), R1 = 650, R2 = 1250, R3 = 1700, GATE1 = 46, GATE2 = 92, ROUND = 150;
    const objs = [], holes = []; let t = 0, left = ROUND, over = false;
    const TYPES = {
      apple: { s: 9, h: 8, col: '#ef4444', shape: 'ball', v: 1 }, cup: { s: 8, h: 12, col: '#f8fafc', shape: 'cyl', v: 1 }, sandwich: { s: 12, h: 6, col: '#fde68a', shape: 'box', v: 1.5 }, ball: { s: 14, h: 14, col: '#3b82f6', shape: 'ball', v: 2 }, basket: { s: 20, h: 14, col: '#b45309', shape: 'box', v: 3 }, duck: { s: 16, h: 12, col: '#facc15', shape: 'ball', v: 2.5 }, bench: { s: 30, h: 10, col: '#92400e', shape: 'box', v: 5 }, bush: { s: 26, h: 20, col: '#16a34a', shape: 'ball', v: 4 },
      hay: { s: 34, h: 26, col: '#eab308', shape: 'cyl', v: 6 }, sheep: { s: 30, h: 20, col: '#f5f5f4', shape: 'ball', v: 6 }, pig: { s: 34, h: 20, col: '#f9a8d4', shape: 'ball', v: 7 }, cow: { s: 48, h: 28, col: '#f8fafc', shape: 'box', v: 11 }, tractor: { s: 60, h: 34, col: '#16a34a', shape: 'box', v: 15 }, silo: { s: 70, h: 90, col: '#94a3b8', shape: 'cyl', v: 20 }, barn: { s: 110, h: 70, col: '#b91c1c', shape: 'box', v: 35 },
      car: { s: 60, h: 26, col: '#3b82f6', shape: 'box', v: 14 }, bus: { s: 100, h: 40, col: '#f59e0b', shape: 'box', v: 26 }, house: { s: 120, h: 70, col: '#fca5a5', shape: 'box', v: 40 }, tree: { s: 50, h: 60, col: '#15803d', shape: 'ball', v: 10 }, tower: { s: 170, h: 220, col: '#64748b', shape: 'box', v: 80 }
    };
    function place(type, zMin, zMax) { const T = TYPES[type]; for (let k = 0; k < 30; k++) { const a = rand(0, TAU), r = rand(zMin + T.s, zMax - T.s), x = Math.cos(a) * r, y = Math.sin(a) * r; if (objs.every(o => dist(o.x, o.y, x, y) > (o.T.s + T.s) * 0.6)) { objs.push({ type, T, x, y, hue: rand(0, 360), fall: 0 }); return; } } }
    const Z1 = ['apple', 'apple', 'cup', 'cup', 'sandwich', 'ball', 'basket', 'duck', 'bench', 'bush'], Z2 = ['hay', 'sheep', 'sheep', 'pig', 'cow', 'tractor', 'silo', 'barn', 'bush'], Z3 = ['car', 'car', 'bus', 'house', 'tree', 'tree', 'tower', 'bench'];
    for (let i = 0; i < 260; i++) place(pick(Z1), 0, R1 - 20); for (let i = 0; i < 140; i++) place(pick(Z2), R1 + 20, R2 - 20); for (let i = 0; i < 110; i++) place(pick(Z3), R2 + 20, R3 - 20);
    const NAMES = ['VoidVera', 'GulpGus', 'Sinkhole Sid', 'Munchie', 'Black Bart'];
    function mkHole(name, me, hue) { const a = rand(0, TAU), r = rand(100, R1 - 120); const h = { name, me, hue, x: me ? 0 : Math.cos(a) * r, y: me ? 0 : Math.sin(a) * r, r: 24, score: 0, alive: true, t: 0, tx: 0, ty: 0 }; holes.push(h); return h; }
    const me = mkHole('You', true, 200); NAMES.forEach((n, i) => mkHole(n, false, i * 60 + 20));
    function zoneLimit(h) { return h.r >= GATE2 ? R3 - h.r * 0.3 : h.r >= GATE1 ? R2 - h.r * 0.6 : R1 - h.r * 0.6; }
    function aiThink(h, dt) {
      h.t -= dt; if (h.t > 0) return; h.t = rand(0.3, 0.7);
      const threat = holes.find(o => o !== h && o.alive && o.r > h.r * 1.15 && dist(o.x, o.y, h.x, h.y) < o.r + 220);
      if (threat) { h.tx = h.x + (h.x - threat.x); h.ty = h.y + (h.y - threat.y); return; }
      const prey = holes.find(o => o !== h && o.alive && h.r > o.r * 1.25 && dist(o.x, o.y, h.x, h.y) < 300); if (prey) { h.tx = prey.x; h.ty = prey.y; return; }
      let best = null, bs = -1e9; for (const o of objs) { if (o.fall || o.T.s >= h.r * 0.85) continue; const d = dist(o.x, o.y, h.x, h.y); if (d > 700) continue; const sc = o.T.v * 40 - d; if (sc > bs) { bs = sc; best = o; } } if (best) { h.tx = best.x; h.ty = best.y; } else { const a = rand(0, TAU); h.tx = Math.cos(a) * rand(0, zoneLimit(h)); h.ty = Math.sin(a) * rand(0, zoneLimit(h)); }
    }
    function grow(h, v) { const area = h.r * h.r + v * 26; h.r = Math.sqrt(area); h.score += v * 10; }
    function drawObj(o, k) {
      const T = o.T, s = T.s * k, hh = T.h * k; ctx.save(); ctx.translate(o.x, o.y);
      ellipse(ctx, s * 0.25, s * 0.25, s * 0.55, s * 0.4, 'rgba(0,0,0,.18)');
      if (T.shape === 'box') { const w = s, d = s * 0.7; ctx.fillStyle = hsl(0, 0, 0, 0); const top = o.type === 'house' || o.type === 'barn' ? '#7f1d1d' : o.type === 'car' || o.type === 'bus' ? hsl(o.hue, 60, 60) : T.col; ctx.fillStyle = shade(T.col, -18); ctx.fillRect(-w / 2, -d / 2 - hh * 0.5 + d, w, hh * 0.5); ctx.fillStyle = o.type === 'car' ? hsl(o.hue, 65, 50) : top; ctx.fillRect(-w / 2, -d / 2 - hh * 0.5, w, d); if (o.type === 'house' || o.type === 'tower') { ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(-w / 2 + w * 0.15 + i * w * 0.27, -d / 2 - hh * 0.5 + d * 0.2 + j * d * 0.4, w * 0.14, d * 0.2); } if (o.type === 'cow') { ctx.fillStyle = '#111'; circle(ctx, -w * 0.2, -hh * 0.4, w * 0.1); ctx.fill(); circle(ctx, w * 0.15, -hh * 0.3, w * 0.12); ctx.fill(); } }
      else if (T.shape === 'cyl') { const r = s / 2; ctx.fillStyle = shade(T.col, -15); ctx.fillRect(-r, -hh * 0.5, r * 2, hh * 0.5); ellipse(ctx, 0, 0, r, r * 0.5, shade(T.col, -15)); ellipse(ctx, 0, -hh * 0.5, r, r * 0.5, T.col); }
      else { circle(ctx, 0, -hh * 0.3, s / 2, rgrad(ctx, -s * 0.15, -hh * 0.3 - s * 0.15, 1, s * 0.6, ['#fff', T.col, shade(T.col, -25)])); if (o.type === 'duck') { circle(ctx, s * 0.3, -hh * 0.5, s * 0.22, T.col); ctx.fillStyle = '#f97316'; ctx.fillRect(s * 0.45, -hh * 0.55, s * 0.18, s * 0.08); } if (o.type === 'sheep' || o.type === 'pig') circle(ctx, s * 0.42, -hh * 0.3, s * 0.18, o.type === 'pig' ? '#f472b6' : '#334155'); }
      ctx.restore();
    }
    function shade(c, a) { const n = parseInt(c.slice(1), 16), r = clamp((n >> 16) + a * 2.55, 0, 255), g = clamp(((n >> 8) & 255) + a * 2.55, 0, 255), b = clamp((n & 255) + a * 2.55, 0, 255); return `rgb(${r | 0},${g | 0},${b | 0})`; }
    return {
      update(dt) {
        t += dt; fx.update(dt); if (over) return;
        left -= dt; if (left <= 0) { left = 0; over = true; const rank = holes.filter(h => h.alive).sort((a, b) => b.r - a.r); const pos = me.alive ? rank.indexOf(me) + 1 : rank.length + 1; E.gameOver({ score: Math.round(me.r), win: pos === 1, title: pos === 1 ? '🌀 Biggest Hole in the Arena!' : 'Time! ' + rank[0].name + ' was biggest', lines: ['Your size: ' + Math.round(me.r) + ' • Place #' + pos, 'Zones unlocked: ' + (me.r >= GATE2 ? 3 : me.r >= GATE1 ? 2 : 1) + '/3'] }); return; }
        for (const h of holes) {
          if (!h.alive) continue;
          let dx, dy, mag;
          if (h.me) { const d = E.dir(); dx = d.x; dy = d.y; mag = d.mag; } else { aiThink(h, dt); const ddx = h.tx - h.x, ddy = h.ty - h.y, dd = Math.hypot(ddx, ddy) || 1; dx = ddx / dd; dy = ddy / dd; mag = dd > 10 ? 1 : 0; }
          const sp = 240 - Math.min(110, h.r * 0.6); h.x += dx * mag * sp * dt; h.y += dy * mag * sp * dt;
          const lim = zoneLimit(h), rr2 = Math.hypot(h.x, h.y); if (rr2 > lim) { h.x *= lim / rr2; h.y *= lim / rr2; }
          if (h.me) { const z = h.r >= GATE2 ? 3 : h.r >= GATE1 ? 2 : 1; if (z !== h.zone) { if (h.zone) { E.toast(z === 2 ? '🚜 Farm gates open!' : '🏙️ The town is yours to eat!'); E.sound('power'); } h.zone = z; } }
          for (const o of objs) { if (o.fall || o.T.s >= h.r * 0.85) continue; if (Math.abs(o.x - h.x) < h.r && Math.abs(o.y - h.y) < h.r && dist(o.x, o.y, h.x, h.y) < h.r - o.T.s * 0.2) { o.fall = 0.01; o.by = h; } }
        }
        for (let i = objs.length - 1; i >= 0; i--) { const o = objs[i]; if (!o.fall) continue; o.fall += dt * 2.5; o.x += (o.by.x - o.x) * dt * 6; o.y += (o.by.y - o.y) * dt * 6; if (o.fall >= 1) { objs.splice(i, 1); grow(o.by, o.T.v); if (o.by.me) E.sound('swallow', 40); } }
        // hole vs hole
        for (const a of holes) for (const b of holes) { if (a === b || !a.alive || !b.alive) continue; if (a.r > b.r * 1.25 && dist(a.x, a.y, b.x, b.y) < a.r - b.r * 0.3) { b.alive = false; grow(a, b.r * 0.6); fx.burst(b.x, b.y, 30, { col: ['#111', '#7c3aed'], spd: 200 }); if (b.me) { over = true; E.sound('die'); E.gameOver({ score: Math.round(b.r), title: 'Swallowed by ' + a.name + '!', lines: ['Your size: ' + Math.round(b.r)] }); } else if (a.me) { E.sound('coin'); fx.text(a.x, a.y - a.r, 'Ate ' + b.name + '!', '#fde047', 24); setTimeout(() => { if (!over) { const nh = mkHole(b.name, false, b.hue); nh.r = 24; } }, 4000); } } }
        while (objs.filter(o => Math.hypot(o.x, o.y) < R1).length < 150) place(pick(Z1), 0, R1 - 20);
        E.follow(me.x, me.y, clamp(1.2 - me.r / 260, 0.35, 1.2) * Math.min(1.1, Math.min(E.W, E.H) / 700), dt);
      },
      draw() {
        const W = E.W, H = E.H; ctx.fillStyle = '#365314'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(200);
        circle(ctx, 0, 0, R3, '#71717a'); ctx.strokeStyle = '#a1a1aa'; ctx.lineWidth = 3; for (let r = R2 + 90; r < R3; r += 180) { ctx.setLineDash([30, 30]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); } ctx.setLineDash([]);
        circle(ctx, 0, 0, R2, '#a3e635'); for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? 'rgba(161,98,7,.25)' : 'rgba(132,204,22,.25)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R2, i * TAU / 24, (i + 1) * TAU / 24); ctx.fill(); }
        circle(ctx, 0, 0, R1, '#4ade80'); for (let i = 0; i < 40; i++) { const a = i * 2.4, r = (i * 97) % R1; circle(ctx, Math.cos(a) * r, Math.sin(a) * r, 6, hsl(i * 40, 80, 75)); }
        circle(ctx, 0, 0, 120, '#38bdf8'); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 90 + Math.sin(t * 2) * 6, 0, TAU); ctx.stroke();
        // fences
        for (const [R, need, col] of [[R1, GATE1, '#92400e'], [R2, GATE2, '#525252']]) { const open = me.r >= need; ctx.strokeStyle = open ? 'rgba(255,255,255,.35)' : col; ctx.lineWidth = open ? 4 : 10; ctx.setLineDash(open ? [12, 24] : [26, 8]); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]); if (!open) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + 0.3; label(ctx, '🔒 size ' + need, Math.cos(a) * R, Math.sin(a) * R, 18, '#fff'); } }
        // objects (not falling) then holes then falling objects clipped
        for (const h of holes) if (h.alive) { ctx.drawImage(E.glow(h.hue), h.x - h.r * 1.6, h.y - h.r * 1.6, h.r * 3.2, h.r * 3.2); circle(ctx, h.x, h.y, h.r, rgrad(ctx, h.x, h.y, h.r * 0.2, h.r, ['#000', '#0a0a0a', '#1f2937'])); ctx.strokeStyle = hsl(h.hue, 80, 60); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); }
        for (const o of objs) { if (o.x < v.x0 || o.x > v.x1 || o.y < v.y0 || o.y > v.y1) continue; if (o.fall) { ctx.save(); ctx.beginPath(); ctx.arc(o.by.x, o.by.y, o.by.r, 0, TAU); ctx.clip(); ctx.globalAlpha = 1 - o.fall * 0.6; drawObj(o, 1 - o.fall * 0.7); ctx.restore(); ctx.globalAlpha = 1; } else drawObj(o, 1); }
        for (const h of holes) if (h.alive) label(ctx, h.name + ' ' + Math.round(h.r), h.x, h.y - h.r - 14, 14, h.me ? '#fde047' : '#fff');
        fx.draw(ctx); E.endWorld();
        label(ctx, '⏱ ' + fmtTime(left), W / 2, 30, 24, left < 20 ? '#f87171' : '#fff');
        const z = me.r >= GATE2 ? 3 : me.r >= GATE1 ? 2 : 1, nxt = z === 1 ? GATE1 : z === 2 ? GATE2 : 0; label(ctx, ['', '🧺 Picnic Park', '🚜 Farm unlocked', '🏙️ Town unlocked'][z] + (nxt ? ' • next zone at size ' + nxt : ''), W / 2, 58, 14, '#e2e8f0');
      },
      hud() { const rows = holes.filter(h => h.alive).sort((a, b) => b.r - a.r).map(h => ({ n: h.name, s: Math.round(h.r), me: h.me })); return { stats: [['Size', Math.round(me.r)]], board: rows, boardTitle: '🌀 BIGGEST HOLES' }; }
    };
  }
});
