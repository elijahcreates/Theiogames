/* =====================================================================
   SUBWAY ESCAPE  (3-lane endless runner)
   ===================================================================== */
registerGame({
  id: 'subway', title: 'Subway Escape', emoji: '🏃', c1: '#f7971e', c2: '#ffd200', cats: ['Arcade', 'Endless'], featured: true, pop: true, hot: true,
  desc: 'Dash along the rail yard! Switch lanes, jump barriers, slide under signs, grab coins and power-ups like magnets, shields and 2× multipliers.',
  controls: '←/→ lanes • ↑ jump • ↓ slide • swipe', scoreLabel: 'SCORE',
  hint: '←/→ or A/D switch lanes • ↑/W/Space jump • ↓/S slide. Collect coins and power-ups!', hintTouch: 'Swipe left/right to change lanes, up to jump, down to slide.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), LANE = 2.6;
    const R = { lane: 1, x: 0, y: 0, vy: 0, slide: 0, z: 0, run: 0 };
    let speed = 16, t = 0, objs = [], coins = 0, score = 0, mult = 1, nextZ = 30, dead = false, magnet = 0, shield = 0, x2 = 0, sw = null, deco = [];
    const camH = 4.2, camBack = 7;
    function P(x, y, z) { const dz = z - (R.z - camBack); if (dz < 0.3) return null; const f = E.H * 0.95, hz = E.H * 0.33; return [E.W / 2 + (x - R.x * 0.7) * f / dz, hz + (camH - y) * f / dz, f / dz]; }
    function gen() {
      const d = Math.min(1, R.z / 3000);
      while (nextZ < R.z + 160) {
        const z = nextZ, k = Math.random(), free = irand(0, 2);
        if (k < 0.32) { // trains in 1-2 lanes
          const n = Math.random() < 0.4 + d * 0.3 ? 2 : 1, ls = shuffle([0, 1, 2]).filter(l => l !== free).slice(0, n);
          ls.forEach(l => objs.push({ k: 'train', lane: l, z, len: rand(10, 18), col: pick(['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c']), moving: Math.random() < d * 0.5 }));
          for (let j = 0; j < 6; j++) objs.push({ k: 'coin', lane: free, z: z + j * 2, y: 0.8 });
          nextZ += rand(24, 30) - d * 6;
        } else if (k < 0.55) { const l = irand(0, 2); objs.push({ k: 'low', lane: l, z }); if (Math.random() < 0.5) objs.push({ k: 'low', lane: (l + irand(1, 2)) % 3, z }); for (let j = 0; j < 5; j++) objs.push({ k: 'coin', lane: l, z: z - 4 + j * 2, y: 0.8 + Math.sin(j / 4 * Math.PI) * 2 }); nextZ += rand(14, 20) - d * 4; }
        else if (k < 0.75) { const l = irand(0, 2); objs.push({ k: 'high', lane: l, z }); if (Math.random() < 0.6) objs.push({ k: 'high', lane: (l + 1) % 3, z }); nextZ += rand(14, 20) - d * 4; }
        else if (k < 0.9) { const l = irand(0, 2); for (let j = 0; j < 8; j++) objs.push({ k: 'coin', lane: l, z: z + j * 2, y: 0.8 }); nextZ += 20; }
        else { objs.push({ k: 'pow', lane: irand(0, 2), z, p: pick(['magnet', 'shield', 'x2']), y: 1 }); nextZ += 14; }
      }
    }
    for (let i = 0; i < 40; i++) deco.push({ z: i * 8, side: i % 2 ? 1 : -1, h: rand(6, 16), hue: pick([210, 25, 260, 190, 340]), w: rand(5, 9) });
    function crash() {
      if (shield > 0) { shield = 0; E.sound('pop'); fx.burst(E.W / 2, E.H * 0.7, 30, { col: '#22d3ee', spd: 300 }); return false; }
      dead = true; E.sound('crash'); E.shake(14);
      E.gameOver({ score: Math.floor(score), title: 'Caught!', lines: ['🪙 ' + coins + ' coins collected', 'Distance: ' + Math.floor(R.z) + ' m'], delay: 1100 });
      return true;
    }
    function act(a) {
      if (dead) return;
      if (a === 'L' && R.lane > 0) { R.lane--; E.sound('whoosh', 60); }
      if (a === 'R' && R.lane < 2) { R.lane++; E.sound('whoosh', 60); }
      if (a === 'U' && R.y <= 0.01) { R.vy = 11; R.slide = 0; E.sound('jump'); }
      if (a === 'D') { if (R.y > 0.01) R.vy = -18; R.slide = 0.7; E.sound('swish', 60); }
    }
    gen();
    function drawRunner(p) {
      const s = p[2] * 0.95, x = p[0], y = p[1], sl = R.slide > 0, ph = R.run;
      ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
      ellipse(ctx, 0, 0, 22, 7, 'rgba(0,0,0,.35)');
      if (sl) { ctx.fillStyle = '#1d4ed8'; rr(ctx, -20, -26, 40, 22, 10); ctx.fill(); circle(ctx, 0, -36, 13, '#f1c27d'); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -40, 14, Math.PI, 0); ctx.fill(); ctx.restore(); return; }
      const lift = -R.y * 0;
      // legs
      for (const s2 of [-1, 1]) { const a = Math.sin(ph + (s2 > 0 ? Math.PI : 0)) * 0.7; ctx.save(); ctx.translate(s2 * 7, -32 + lift); ctx.rotate(a * 0.5); ctx.fillStyle = '#1e3a8a'; rr(ctx, -5, 0, 10, 30, 4); ctx.fill(); ctx.fillStyle = '#f8fafc'; rr(ctx, -6, 26, 13, 7, 3); ctx.fill(); ctx.restore(); }
      // body (from behind)
      ctx.fillStyle = lgrad(ctx, 0, -64, 0, -30, ['#f97316', '#ea580c']); rr(ctx, -15, -66, 30, 38, 9); ctx.fill();
      ctx.fillStyle = '#16a34a'; rr(ctx, -11, -62, 22, 26, 6); ctx.fill(); // backpack
      for (const s2 of [-1, 1]) { const a = Math.sin(ph + (s2 > 0 ? 0 : Math.PI)) * 0.9; ctx.save(); ctx.translate(s2 * 16, -60); ctx.rotate(a * 0.6 * s2); ctx.fillStyle = '#f97316'; rr(ctx, -4, 0, 8, 24, 4); ctx.fill(); circle(ctx, 0, 26, 4.5, '#f1c27d'); ctx.restore(); }
      circle(ctx, 0, -78, 13, '#5b3a1c'); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -80, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(-14, -82, 28, 4);
      ctx.restore();
      if (shield > 0) { ctx.strokeStyle = `rgba(34,211,238,${0.5 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - s * 1, s * 0.9, s * 1.3, 0, 0, TAU); ctx.stroke(); }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); if (dead) return;
        speed = Math.min(40, 16 + R.z / 260);
        R.z += speed * dt; R.run += speed * dt * 0.75; score += speed * dt * mult * (x2 > 0 ? 2 : 1);
        if (Math.floor(R.z / 500) + 1 > mult) { mult = Math.floor(R.z / 500) + 1; fx.text(E.W / 2, E.H * 0.25, 'MULTIPLIER x' + mult, '#fde047', 30); E.sound('power'); }
        R.x += ((R.lane - 1) * LANE - R.x) * Math.min(1, dt * 14);
        R.vy -= 32 * dt; R.y = Math.max(0, R.y + R.vy * dt); if (R.y === 0) R.vy = 0;
        R.slide = Math.max(0, R.slide - dt); magnet = Math.max(0, magnet - dt); shield = Math.max(0, shield - dt); x2 = Math.max(0, x2 - dt);
        gen();
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          if (o.moving) o.z -= 8 * dt;
          const len = o.k === 'train' ? o.len : 0.6;
          if (o.z + len < R.z - 8) { objs.splice(i, 1); continue; }
          const ox = (o.lane - 1) * LANE, sameLane = Math.abs(ox - R.x) < 1.2;
          if (o.k === 'coin') {
            const near = magnet > 0 ? Math.abs(o.z - R.z) < 8 : (sameLane && Math.abs(o.z - R.z) < 1 && Math.abs((o.y || 0.8) - (R.y + 0.8)) < 1.4);
            if (magnet > 0 && near) { o.lane += ((R.x / LANE + 1) - o.lane) * Math.min(1, dt * 10); o.z += (R.z - o.z) * Math.min(1, dt * 10); o.y += (R.y + 0.8 - o.y) * dt * 10; }
            if (near && Math.abs(o.z - R.z) < 1 && Math.abs((o.lane - 1) * LANE - R.x) < 1.3) { objs.splice(i, 1); coins++; score += 10 * (x2 > 0 ? 2 : 1); E.sound('coin', 30); }
            continue;
          }
          if (o.k === 'pow') { if (sameLane && Math.abs(o.z - R.z) < 1.2) { objs.splice(i, 1); E.sound('power'); if (o.p === 'magnet') magnet = 10; else if (o.p === 'shield') shield = 12; else x2 = 12; fx.text(E.W / 2, E.H * 0.3, { magnet: '🧲 MAGNET', shield: '🛡 SHIELD', x2: '2× SCORE' }[o.p], '#fde047', 30); } continue; }
          if (!sameLane) continue;
          if (o.k === 'train' && R.z > o.z - 0.4 && R.z < o.z + o.len) { objs.splice(i, 1); if (crash()) return; }
          else if (o.k === 'low' && Math.abs(R.z - o.z) < 0.6 && R.y < 1.1) { objs.splice(i, 1); if (crash()) return; }
          else if (o.k === 'high' && Math.abs(R.z - o.z) < 0.6 && R.slide <= 0) { objs.splice(i, 1); if (crash()) return; }
        }
        for (const d of deco) if (d.z < R.z - 10) { d.z += 320; d.h = rand(6, 16); d.hue = pick([210, 25, 260, 190, 340]); }
      },
      draw() {
        const W = E.W, H = E.H, hz = H * 0.33;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, hz, ['#38bdf8', '#bae6fd']); ctx.fillRect(0, 0, W, hz + 2);
        // skyline
        ctx.fillStyle = '#94a3b8'; for (let i = 0; i < 24; i++) { const bx = (i * 97) % (W + 60) - 30, bh = 40 + (i * 53) % 90; ctx.fillRect(bx, hz - bh, 50, bh); }
        ctx.fillStyle = '#64748b'; for (let i = 0; i < 18; i++) { const bx = (i * 131 + 40) % (W + 60) - 30, bh = 20 + (i * 37) % 60; ctx.fillRect(bx, hz - bh, 60, bh); }
        ctx.fillStyle = lgrad(ctx, 0, hz, 0, H, ['#78716c', '#57534e']); ctx.fillRect(0, hz, W, H - hz);
        // ground track per lane
        const zN = R.z - camBack + 0.5, zF = R.z + 150;
        for (let l = 0; l < 3; l++) {
          const x0 = (l - 1) * LANE - 1.2, x1 = x0 + 2.4, a = P(x0, 0, zN), b = P(x1, 0, zN), c = P(x1, 0, zF), d = P(x0, 0, zF);
          if (a && b && c && d) { ctx.fillStyle = '#44403c'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.fill(); }
        }
        // sleepers
        for (let z = Math.ceil(zN / 1.5) * 1.5; z < R.z + 60; z += 1.5) { for (let l = 0; l < 3; l++) { const a = P((l - 1) * LANE - 1.1, 0.02, z), b = P((l - 1) * LANE + 1.1, 0.02, z); if (a && b) { ctx.strokeStyle = '#78350f'; ctx.lineWidth = Math.max(1, a[2] * 0.18); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } } }
        for (let l = 0; l < 3; l++) { const x0 = (l - 1) * LANE - 1.2, x1 = x0 + 2.4;
          for (const rx of [x0 + 0.5, x1 - 0.5]) { const p1 = P(rx - 0.07, 0.05, zN), p2 = P(rx + 0.07, 0.05, zN), p3 = P(rx + 0.07, 0.05, zF), p4 = P(rx - 0.07, 0.05, zF); if (p1 && p2 && p3 && p4) { ctx.fillStyle = '#a8a29e'; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.fill(); } }
        }
        // collect drawables
        const list = [];
        for (const d of deco) list.push({ z: d.z, f: () => { if (d.z - R.z < -2) return; const x = d.side * (6 + d.w / 2), a = P(x - d.w / 2, 0, d.z), b = P(x + d.w / 2, d.h, d.z); if (!a || !b) return; ctx.fillStyle = hsl(d.hue, 35, 55); ctx.fillRect(Math.min(a[0], b[0]), b[1], Math.abs(b[0] - a[0]), a[1] - b[1]); ctx.fillStyle = 'rgba(255,255,200,.7)'; const cols = 3, rows2 = Math.floor(d.h / 2); const ww = Math.abs(b[0] - a[0]), hh = a[1] - b[1]; for (let i = 0; i < cols; i++) for (let j = 0; j < rows2; j++) ctx.fillRect(Math.min(a[0], b[0]) + ww * (0.12 + i * 0.3), b[1] + hh * (0.08 + j / rows2 * 0.9), ww * 0.16, hh / rows2 * 0.45); } });
        for (const o of objs) list.push({ z: o.z, f: () => {
          const x = (o.lane - 1) * LANE;
          if (o.k === 'coin') { const p = P(x, o.y || 0.8, o.z); if (!p) return; const r = p[2] * 0.35, sq = Math.abs(Math.cos(t * 5 + o.z)); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(p[0], p[1], r * sq + 1, r, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.ellipse(p[0], p[1], (r * sq + 1) * 0.7, r * 0.7, 0, 0, TAU); ctx.fill(); return; }
          if (o.k === 'pow') { const p = P(x, 1 + Math.sin(t * 4) * 0.2, o.z); if (!p) return; ctx.drawImage(E.glow(50), p[0] - p[2], p[1] - p[2], p[2] * 2, p[2] * 2); E.emoji(ctx, { magnet: '🧲', shield: '🛡️', x2: '✖️' }[o.p], p[0], p[1], p[2] * 0.7); return; }
          if (o.k === 'train') {
            const x0 = x - 1.25, x1 = x + 1.25, h = 3.6, zf = o.z, zb = o.z + o.len;
            const f = [P(x0, 0, zf), P(x1, 0, zf), P(x1, h, zf), P(x0, h, zf)], tp = [P(x0, h, zf), P(x1, h, zf), P(x1, h, zb), P(x0, h, zb)];
            const sideL = [P(x0, 0, zf), P(x0, 0, zb), P(x0, h, zb), P(x0, h, zf)], sideR = [P(x1, 0, zf), P(x1, 0, zb), P(x1, h, zb), P(x1, h, zf)];
            const poly = (pts, col) => { if (pts.some(p => !p)) return; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
            if (x < R.x * 0.7 - 0.5) poly(sideR, '#334155'); if (x > R.x * 0.7 + 0.5) poly(sideL, '#334155');
            poly(tp, '#cbd5e1'); poly(f, o.col);
            if (!f.some(p => !p)) { const [a, b, c] = f; const w = b[0] - a[0], hh = a[1] - c[1]; ctx.fillStyle = '#bae6fd'; ctx.fillRect(a[0] + w * 0.15, c[1] + hh * 0.15, w * 0.7, hh * 0.3); ctx.fillStyle = '#fde047'; circle(ctx, a[0] + w * 0.2, a[1] - hh * 0.18, w * 0.07); ctx.fill(); circle(ctx, a[0] + w * 0.8, a[1] - hh * 0.18, w * 0.07); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(a[0] + w * 0.1, a[1] - hh * 0.42, w * 0.8, hh * 0.06); }
            return;
          }
          const isLow = o.k === 'low', y0 = isLow ? 0 : 1.6, y1 = isLow ? 1.1 : 3.4;
          const a = P(x - 1.2, y0, o.z), b = P(x + 1.2, y1, o.z); if (!a || !b) return;
          const w = b[0] - a[0], hh = a[1] - b[1];
          if (!isLow) { ctx.fillStyle = '#525252'; ctx.fillRect(a[0], P(x, 0, o.z)[1] - (P(x, 0, o.z)[1] - b[1]), w * 0.08, P(x, 0, o.z)[1] - b[1]); ctx.fillRect(b[0] - w * 0.08, b[1], w * 0.08, P(x, 0, o.z)[1] - b[1]); }
          ctx.fillStyle = '#fff'; ctx.fillRect(a[0], b[1], w, hh);
          ctx.save(); ctx.beginPath(); ctx.rect(a[0], b[1], w, hh); ctx.clip(); ctx.fillStyle = '#dc2626'; for (let k = -2; k < 8; k++) { ctx.beginPath(); ctx.moveTo(a[0] + k * w / 5, b[1]); ctx.lineTo(a[0] + k * w / 5 + w / 10, b[1]); ctx.lineTo(a[0] + k * w / 5 + w / 10 + hh, a[1]); ctx.lineTo(a[0] + k * w / 5 + hh, a[1]); ctx.fill(); } ctx.restore();
          ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.strokeRect(a[0], b[1], w, hh);
        } });
        list.push({ z: R.z, f: () => { const p = P(R.x, R.y, R.z); if (p) drawRunner(p); } });
        list.sort((a, b) => b.z - a.z).forEach(d => d.f());
        fx.draw(ctx);
        label(ctx, fmt(score), W / 2, 34, 30); label(ctx, '🪙 ' + coins, W - 20, 70, 20, '#fde047', 'right');
        let y = 100; [[magnet, '🧲'], [shield, '🛡'], [x2, '2×']].forEach(([v, ic]) => { if (v > 0) { label(ctx, ic + ' ' + Math.ceil(v) + 's', W - 20, y, 16, '#fff', 'right'); y += 24; } });
        if (mult > 1) label(ctx, 'x' + mult, W / 2, 62, 18, '#fde047');
      },
      down(x, y) { sw = { x, y }; },
      up(x, y) { if (!sw) return; const dx = x - sw.x, dy = y - sw.y; sw = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) { act('U'); return; } if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'R' : 'L'); else act(dy > 0 ? 'D' : 'U'); },
      onKey(c) { const m = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'U', KeyW: 'U', Space: 'U', ArrowDown: 'D', KeyS: 'D' }[c]; if (m) act(m); },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
  }
});
