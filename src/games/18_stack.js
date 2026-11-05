/* =====================================================================
   PERFECT STACK  (isometric 3D)
   ===================================================================== */
registerGame({
  id: 'stack', title: 'Perfect Stack', emoji: '🧱', c1: '#ff9a9e', c2: '#fad0c4', cats: ['Arcade', 'Physics', 'Endless'], featured: true, pop: true,
  desc: 'Drop sliding 3D blocks onto your tower. Perfect drops keep the block whole – misses slice it smaller. How high can you go?',
  controls: 'Tap / Space', scoreLabel: 'HEIGHT',
  hint: 'Click or press SPACE to drop the block. Line it up perfectly for combos!', hintTouch: 'Tap to drop the block. Perfect drops build combos!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), BH = 22, BASE = 180;
    const layers = [{ x: -BASE / 2, z: -BASE / 2, w: BASE, d: BASE, hue: 200 }];
    let cur = null, falling = [], score = 0, combo = 0, dead = false, camY = 0, t = 0, hue0 = rand(0, 360), ripples = [];
    function spawn() {
      const top = layers[layers.length - 1], axis = layers.length % 2 ? 'x' : 'z';
      const sp = Math.min(380, 140 + score * 6);
      cur = { x: top.x, z: top.z, w: top.w, d: top.d, axis, dir: 1, sp, hue: hue0 + layers.length * 7, off: -260 };
      if (axis === 'x') cur.x = top.x - 260; else cur.z = top.z - 260;
    }
    spawn();
    function drop() {
      if (dead || !cur) return;
      const top = layers[layers.length - 1], ax = cur.axis, pos = ax === 'x' ? 'x' : 'z', size = ax === 'x' ? 'w' : 'd';
      const delta = cur[pos] - top[pos], ov = top[size] - Math.abs(delta);
      if (ov <= 0) {
        falling.push(Object.assign({}, cur, { y: layers.length * BH, vy: 0, rot: 0 })); cur = null; dead = true; E.sound('crash'); E.shake(8);
        E.gameOver({ score, title: 'Tower Complete!', lines: ['Height: ' + score + ' blocks'], delay: 1200 }); return;
      }
      const y = layers.length * BH;
      if (Math.abs(delta) < 5) {
        cur[pos] = top[pos]; combo++; E.note(392 * Math.pow(1.0595, Math.min(combo, 16) * 2), 0.35, 'sine', 0.12);
        ripples.push({ l: Object.assign({}, cur), y, t: 0 });
        if (combo >= 4 && cur[size] < BASE) { const g = Math.min(BASE - cur[size], 10); cur[size] += g; cur[pos] -= g / 2; fx.text(E.W / 2, E.H * 0.3, 'GROW!', '#fff'); }
        fx.text(E.W / 2, E.H * 0.25, combo > 1 ? 'PERFECT x' + combo : 'PERFECT!', '#fff', 30);
      } else {
        combo = 0; E.sound('chop');
        const cut = Math.abs(delta), piece = Object.assign({}, cur, { y, vy: 0, rot: 0 });
        if (delta > 0) { piece[pos] = top[pos] + top[size]; piece[size] = cut; cur[size] = ov; }
        else { piece[pos] = cur[pos]; piece[size] = cut; cur[pos] = top[pos]; cur[size] = ov; }
        falling.push(piece);
      }
      layers.push({ x: cur.x, z: cur.z, w: cur.w, d: cur.d, hue: cur.hue }); score++;
      if (score === 30) E.ach('stack30');
      spawn();
    }
    function proj(x, y, z, s, cx, cy) { return [cx + (x - z) * 0.866 * s, cy + (x + z) * 0.5 * s - y * s]; }
    function box(b, y0, h, s, cx, cy, alpha) {
      const x0 = b.x, x1 = b.x + b.w, z0 = b.z, z1 = b.z + b.d, y1 = y0 + h, P = (x, y, z) => proj(x, y, z, s, cx, cy);
      const face = (pts, col) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      face([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], hsl(b.hue, 55, 42));
      face([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], hsl(b.hue, 60, 52));
      face([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], hsl(b.hue, 70, 66));
      ctx.globalAlpha = 1;
    }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        if (cur) { const pos = cur.axis === 'x' ? 'x' : 'z', top = layers[layers.length - 1]; cur[pos] += cur.dir * cur.sp * dt; if (cur[pos] > top[pos] + 260) cur.dir = -1; if (cur[pos] < top[pos] - 260) cur.dir = 1; }
        for (const p of falling) { p.vy -= 900 * dt; p.y += p.vy * dt; p.rot += dt; }
        falling = falling.filter(p => p.y > camY - 900);
        ripples.forEach(r => r.t += dt); ripples = ripples.filter(r => r.t < 0.6);
        const target = Math.max(0, layers.length * BH - 160); camY += (target - camY) * Math.min(1, dt * 4);
      },
      draw() {
        const W = E.W, H = E.H, hb = hue0 + layers.length * 7;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(hb + 40, 60, 78), hsl(hb + 10, 55, 55)]); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 12; i++) { circle(ctx, (i * 173 + t * 8) % (W + 100) - 50, (i * 89) % H, 2 + i % 3); ctx.fill(); }
        const s = Math.min(W, H) / 560, cx = W / 2, cy = H * 0.62 + camY * s;
        // base pillar
        box({ x: -BASE / 2, z: -BASE / 2, w: BASE, d: BASE, hue: hb - 30 }, -600, 600, s, cx, cy);
        const start = Math.max(0, layers.length - 40);
        for (let i = start; i < layers.length; i++) box(layers[i], i * BH, BH, s, cx, cy);
        for (const r of ripples) { const k = r.t / 0.6, b = { x: r.l.x - k * 30, z: r.l.z - k * 30, w: r.l.w + k * 60, d: r.l.d + k * 60, hue: r.l.hue }; ctx.globalAlpha = 0.5 * (1 - k); const P = (x, z) => proj(x, r.y, z, s, cx, cy); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); [P(b.x, b.z), P(b.x + b.w, b.z), P(b.x + b.w, b.z + b.d), P(b.x, b.z + b.d)].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
        if (cur) box(cur, layers.length * BH, BH, s, cx, cy);
        for (const p of falling) box(p, p.y, BH, s, cx, cy, clamp(1 + (p.y - camY) / 600, 0, 1));
        fx.draw(ctx);
        label(ctx, String(score), W / 2, H * 0.12, 64, '#fff');
        if (score === 0 && !dead) label(ctx, E.touch ? 'TAP TO DROP' : 'CLICK / SPACE TO DROP', W / 2, H * 0.88, 22, '#fff');
      },
      down() { drop(); },
      onKey(c) { if (c === 'Space' || c === 'Enter' || c === 'ArrowDown' || c === 'KeyS') drop(); },
      hud() { return { stats: [['Combo', combo], ['Best', fmt(E.best())]] }; }
    };
  }
});
