/* =====================================================================
   ROLL RUSH 3D  (rolling-ball obstacle course on a floating track)
   ===================================================================== */
registerGame({
  id: 'rollrush', title: 'Roll Rush 3D', emoji: '⚽', c1: '#f472b6', c2: '#7dd3fc', cats: ['Arcade', 'Endless', 'Physics', 'Popular'], featured: true, hot: true, pop: true, isNew: true, tags: 'going balls rolling ball 3d',
  desc: 'Roll a shiny ball along a twisting floating track in the sky! Dodge sliders and swinging hammers, ride moving platforms, launch off ramps over gaps and grab every coin.',
  controls: 'A/D or ←/→ • swipe / drag', scoreLabel: 'SCORE',
  hint: 'Steer with A / D or ← / →. Stay on the track, dodge obstacles, collect coins! Ramps launch you over gaps.', hintTouch: 'Drag left / right anywhere to steer the ball. Stay on the track and grab the coins!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ROW = 3;
    const B = { x: 0, y: 0, vx: 0, vy: 0, z: 2, roll: 0, fall: false, dead: false };
    let rows = {}, t = 0, speed = 13, coins = 0, score = 0, camX = 0, camZ = -4, drag = null, msg = '', msgT = 0, level = 1, trail = [], over = false, shake = 0, lastLevel = 1;
    const PAL = [['#f9a8d4', '#fbcfe8', '#9d174d'], ['#a5f3fc', '#cffafe', '#0e7490'], ['#fde68a', '#fef3c7', '#a16207'], ['#c4b5fd', '#ede9fe', '#5b21b6'], ['#86efac', '#dcfce7', '#15803d']];
    const SKY = [['#7dd3fc', '#f0abfc'], ['#fda4af', '#fef3c7'], ['#a5b4fc', '#f5d0fe'], ['#5eead4', '#e0f2fe'], ['#1e1b4b', '#7c3aed']];
    // track centre path: smooth curves that grow with distance
    const cxAt = i => { const d = Math.min(1, i / 300); return Math.sin(i * 0.045) * 6 * d + Math.sin(i * 0.013 + 1) * 9 * d; };
    let gen = 0;
    function row(i) { while (gen <= i) build(gen++); return rows[i] || { cx: cxAt(i), w: 6, gap: false, mv: 0, ph: 0, block: null, coin: null, ramp: false, pal: 0 }; }
    function build(i) {
      const r = rng(i * 7919 + 17), d = Math.min(1, i / 500), seg = Math.floor(i / 12), k = r();
      const rw = { cx: cxAt(i), w: 6 - d * 1.6, gap: false, mv: 0, ph: 0, block: null, coin: null, ramp: false, pal: Math.floor(i / 100) % PAL.length };
      if (i > 14 && i % 12 === 0) rows._feat = { k: r(), start: i };
      const f = rows._feat;
      if (f && i >= f.start && i < f.start + 8 && i > 14) {
        const o = i - f.start;
        if (f.k < 0.18 + d * 0.06) { if (o === 1) rw.ramp = true; if (o >= 3 && o <= 4 + Math.floor(d * 2)) rw.gap = true; }
        else if (f.k < 0.38) { if (o >= 1 && o <= 6) { rw.mv = 1.6 + d * 2.2; rw.ph = f.start * 0.7; rw.w = 3.4 - d * 0.6; } }
        else if (f.k < 0.58) { if (o === 3 || (o === 6 && d > 0.4)) rw.block = { kind: 'slide', sp: 1.2 + d * 1.6 + r(), ph: r() * TAU, w: 1.6 + d * 0.6 }; }
        else if (f.k < 0.72) { if (o === 3) rw.block = { kind: 'hammer', sp: 1.6 + d * 1.4, ph: r() * TAU, w: 1.3 }; }
        else if (f.k < 0.86) { if (o >= 1 && o <= 6) rw.w = 2.6 - d * 0.5; }
        else { if (o === 2 || o === 5) rw.block = { kind: 'wall', side: o === 2 ? -1 : 1, w: rw.w * 0.55 }; }
      }
      if (!rw.gap && r() < 0.28 && i > 6) rw.coin = { x: (r() - 0.5) * (rw.w - 1.4), got: false };
      rows[i] = rw; return rw;
    }
    const rowX = (rw, i) => rw.cx + (rw.mv ? Math.sin(t * 1.4 + rw.ph) * rw.mv : 0);
    function blockX(rw, i) { const b = rw.block; if (!b) return null; if (b.kind === 'slide') return rowX(rw, i) + Math.sin(t * b.sp + b.ph) * (rw.w / 2 - b.w / 2); if (b.kind === 'hammer') return rowX(rw, i) + Math.sin(t * b.sp + b.ph) * (rw.w / 2); return rowX(rw, i) + b.side * (rw.w / 2 - b.w / 2); }
    function die(why) { if (over) return; over = true; E.sound('whoosh'); msg = why; msgT = 2; setTimeout(() => { if (E.g === api) E.gameOver({ score, title: why, lines: ['Distance: ' + Math.floor(B.z) + ' m', '🪙 Coins: ' + coins, 'Level ' + level] }); }, 900); }
    function P(x, y, z) { const dz = z - camZ; if (dz < 0.4) return null; const f = Math.min(E.W, E.H * 1.3) * 0.95; return [E.W / 2 + (x - camX) * f / dz, E.H * 0.38 + (3.1 - y + B.y * 0.45) * f / dz, f / dz]; }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        if (over) { B.vy -= 30 * dt; B.y += B.vy * dt; B.z += speed * dt * 0.4; return; }
        speed = Math.min(30, 13 + B.z / 160);
        const i = Math.floor(B.z / ROW), rw = row(i);
        // steering
        let dir = (E.key('KeyD') || E.key('ArrowRight') ? 1 : 0) - (E.key('KeyA') || E.key('ArrowLeft') ? 1 : 0);
        if (drag && drag.tx !== undefined) { B.vx += ((drag.tx - B.x) * 9 - B.vx) * Math.min(1, dt * 8); }
        else B.vx += (dir * 12 - B.vx) * Math.min(1, dt * 6);
        // moving platform carries the ball
        const prevOff = rw.mv ? Math.sin((t - dt) * 1.4 + rw.ph) * rw.mv : 0, nowOff = rw.mv ? Math.sin(t * 1.4 + rw.ph) * rw.mv : 0;
        if (B.y <= 0.01 && rw.mv) B.x += nowOff - prevOff;
        B.x += B.vx * dt; B.z += speed * dt; B.roll += speed * dt * 1.1;
        if (drag && drag.tx !== undefined) drag.tx += 0;
        // vertical
        if (B.y > 0 || B.vy > 0) { B.vy -= 30 * dt; B.y += B.vy * dt; if (B.y <= 0) { const ii = Math.floor(B.z / ROW), r2 = row(ii); if (!r2.gap && Math.abs(B.x - rowX(r2, ii)) < r2.w / 2 + 0.2) { B.y = 0; B.vy = 0; E.sound('land', 80); fx.burst(E.W / 2, E.H * 0.78, 10, { col: '#fff', spd: 120 }); } else if (B.y < -1.2) return die('Fell into the sky!'); } }
        if (B.y <= 0.01) {
          const off = Math.abs(B.x - rowX(rw, i)) > rw.w / 2 + 0.15;
          if (rw.gap || off) { B.y = -0.05; B.vy = -2; if (!over) { E.shake(4); return die(rw.gap ? 'Missed the jump!' : 'Rolled off the edge!'); } }
          if (rw.ramp && B.z - i * ROW > 1.2) { let ge = i + 1, seen = false; for (let k = i + 1; k < i + 10; k++) { if (row(k).gap) { seen = true; ge = k + 1; } else if (seen) break; } const need = Math.max(4, ge * ROW + 2.2 - B.z), T = need / speed; B.vy = Math.max(9, 30 * T / 2); B.y = 0.05; E.sound('jump'); fx.text(E.W / 2, E.H * 0.45, 'JUMP!', '#fde047', 26); }
        }
        // obstacles in current & next row
        for (const ii of [i, i + 1]) { const r2 = row(ii); if (!r2.block) continue; const zc = ii * ROW + 1.5; if (Math.abs(B.z - zc) < 0.9 && B.y < 1) { const bx = blockX(r2, ii); if (Math.abs(B.x - bx) < r2.block.w / 2 + 0.45) { const push = B.x >= bx ? 1 : -1; B.vx = push * 16; B.x = bx + push * (r2.block.w / 2 + 0.5); E.sound('bonk'); E.shake(8); fx.burst(E.W / 2, E.H * 0.7, 16, { col: ['#fff', '#fde047'], spd: 220 }); } } }
        for (const ii of [i, i + 1]) { const r2 = row(ii); if (r2.coin && !r2.coin.got && Math.abs(B.z - (ii * ROW + 1.5)) < 1 && Math.abs(B.x - (rowX(r2, ii) + r2.coin.x)) < 0.9 && B.y < 1.5) { r2.coin.got = true; coins++; score += 10; E.sound('coin', 30); fx.text(E.W / 2, E.H * 0.5, '+10', '#fde047', 20); } }
        score = Math.max(score, Math.floor(B.z) + coins * 10);
        level = 1 + Math.floor(B.z / 300); if (level !== lastLevel) { lastLevel = level; msg = '⭐ LEVEL ' + level + ' – faster!'; msgT = 2; E.sound('power'); }
        trail.push({ x: B.x, y: B.y, z: B.z }); if (trail.length > 14) trail.shift();
        camX += (B.x - camX) * Math.min(1, dt * 5); camZ = B.z - 7;
        for (const k in rows) if (k !== '_feat' && +k < i - 4) delete rows[k];
      },
      draw() {
        const W = E.W, H = E.H, sk = SKY[(level - 1) % SKY.length];
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, sk); ctx.fillRect(0, 0, W, H);
        ctx.drawImage(E.glow(50), W * 0.78 - 90, H * 0.08 - 50, 180, 180); circle(ctx, W * 0.78, H * 0.16, 34, 'rgba(255,255,240,.9)');
        // floating islands & clouds (parallax)
        for (let k = 0; k < 7; k++) { const x = ((k * 260 - camX * 6 - t * 6) % (W + 300) + W + 300) % (W + 300) - 150, y = H * (0.2 + (k % 3) * 0.12); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.arc(x + 30, y - 10, 34, 0, TAU); ctx.arc(x + 66, y, 24, 0, TAU); ctx.fill(); }
        for (let k = 0; k < 4; k++) { const x = ((k * 400 - camX * 3) % (W + 400) + W + 400) % (W + 400) - 200, y = H * 0.55 + (k % 2) * 40; ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.ellipse(x, y, 60, 14, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.moveTo(x - 60, y); ctx.lineTo(x, y + 50); ctx.lineTo(x + 60, y); ctx.fill(); }
        const i0 = Math.floor(B.z / ROW) - 2, N = 44;
        for (let i = i0 + N; i >= i0; i--) {
          const rw = row(i), z0 = i * ROW, z1 = z0 + ROW, far = clamp((i - i0) / N, 0, 1), alpha = 1 - far * far * 0.8, pal = PAL[rw.pal];
          if (!rw.gap) {
            const cx = rowX(rw, i), nx = rw.mv ? cx : (rowX(row(i + 1), i + 1) && row(i + 1).mv ? cx : rowX(row(i + 1), i + 1)), w2 = row(i + 1).mv || rw.mv || row(i + 1).gap ? rw.w : row(i + 1).w;
            const a = P(cx - rw.w / 2, 0, z0), b = P(cx + rw.w / 2, 0, z0), c = P(nx + w2 / 2, 0, z1), d = P(nx - w2 / 2, 0, z1);
            if (a && b && c && d) {
              ctx.globalAlpha = alpha;
              const ab = P(cx - rw.w / 2, -0.7, z0), bb = P(cx + rw.w / 2, -0.7, z0);
              ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(bb[0], bb[1]); ctx.lineTo(ab[0], ab[1]); ctx.fill();
              ctx.fillStyle = rw.mv ? '#fde047' : (i % 2 ? pal[0] : pal[1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
              ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, a[2] * 0.05); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(d[0], d[1]); ctx.moveTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
              if (rw.ramp) { const ra = P(cx - 1.4, 0, z0 + 0.3), rb = P(cx + 1.4, 0, z0 + 0.3), rc = P(cx + 1.4, 0.9, z1), rd = P(cx - 1.4, 0.9, z1); if (ra && rb && rc && rd) { ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.moveTo(ra[0], ra[1]); ctx.lineTo(rb[0], rb[1]); ctx.lineTo(rc[0], rc[1]); ctx.lineTo(rd[0], rd[1]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } }
              ctx.globalAlpha = 1;
            }
          }
          // obstacles
          if (rw.block) {
            const bx = blockX(rw, i), bw = rw.block.w, zc = z0 + 1.5, h = rw.block.kind === 'wall' ? 1.2 : 1.1;
            const f = [P(bx - bw / 2, 0, zc - 0.4), P(bx + bw / 2, 0, zc - 0.4), P(bx + bw / 2, h, zc - 0.4), P(bx - bw / 2, h, zc - 0.4)], tp = [P(bx - bw / 2, h, zc - 0.4), P(bx + bw / 2, h, zc - 0.4), P(bx + bw / 2, h, zc + 0.4), P(bx - bw / 2, h, zc + 0.4)];
            if (f.every(Boolean) && tp.every(Boolean)) {
              if (rw.block.kind === 'hammer') { const top = P(rowX(rw, i), 4.5, zc); ctx.strokeStyle = '#475569'; ctx.lineWidth = Math.max(2, f[0][2] * 0.12); ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo((f[2][0] + f[3][0]) / 2, f[2][1]); ctx.stroke(); }
              const col = rw.block.kind === 'wall' ? ['#f97316', '#c2410c'] : rw.block.kind === 'hammer' ? ['#94a3b8', '#475569'] : ['#ef4444', '#991b1b'];
              const poly = (p, c2) => { ctx.beginPath(); p.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = c2; ctx.fill(); };
              poly(tp, col[0]); poly(f, col[1]); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); f.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke();
            }
          }
          if (rw.coin && !rw.coin.got) { const p = P(rowX(rw, i) + rw.coin.x, 0.7 + Math.sin(t * 4 + i) * 0.12, z0 + 1.5); if (p) { const r = p[2] * 0.32, sq = Math.abs(Math.cos(t * 4 + i)); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(p[0], p[1], r * sq + 1, r, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.ellipse(p[0], p[1], (r * sq + 1) * 0.7, r * 0.7, 0, 0, TAU); ctx.fill(); } }
          // ball
          if (i === Math.floor(B.z / ROW)) {
            trail.forEach((q, k) => { const p = P(q.x, q.y + 0.55, q.z); if (p) { ctx.globalAlpha = k / trail.length * 0.25; circle(ctx, p[0], p[1], 0.5 * p[2] * k / trail.length, '#fff'); } }); ctx.globalAlpha = 1;
            const p = P(B.x, B.y + 0.55, B.z), sh = P(B.x, 0, B.z);
            if (p) { const r = 0.55 * p[2]; if (sh && B.y > -0.1 && !over) ellipse(ctx, sh[0], sh[1], r * 0.9, r * 0.3, 'rgba(0,0,0,.3)');
              circle(ctx, p[0], p[1], r, rgrad(ctx, p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, r * 1.15, ['#ffffff', '#38bdf8', '#1e40af']));
              ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(253,224,71,.9)'; ctx.lineWidth = r * 0.22; for (let k = 0; k < 3; k++) { const yy = p[1] + ((B.roll * 0.3 + k / 3) % 1 - 0.5) * r * 2.4; ctx.beginPath(); ctx.ellipse(p[0], yy, r * 1.05, r * 0.32, 0, 0, TAU); ctx.stroke(); } ctx.restore();
              circle(ctx, p[0] - r * 0.35, p[1] - r * 0.4, r * 0.22, 'rgba(255,255,255,.7)'); }
          }
        }
        fx.draw(ctx);
        label(ctx, fmt(score), W / 2, 36, 32, '#fff'); label(ctx, Math.floor(B.z) + ' m  •  🪙 ' + coins + '  •  LEVEL ' + level, W / 2, 66, 15, '#1e1b4b');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.26, 30, '#fde047');
        if (t < 3 && !over) label(ctx, E.touch ? '👆 Drag left / right to steer' : '← / → or A / D to steer', W / 2, H * 0.86, 20, '#fff');
      },
      down(x) { drag = { sx: x, bx: B.x }; },
      move(x) { if (drag && E.ptrDown) drag.tx = drag.bx + (x - drag.sx) / Math.min(E.W, 700) * 9; },
      up() { drag = null; },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
    return api;
  }
});
