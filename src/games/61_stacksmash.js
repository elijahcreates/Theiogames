/* =====================================================================
   STACK SMASH 3D  (smash down through a spinning tower of platforms)
   ===================================================================== */
registerGame({
  id: 'stacksmash', title: 'Stack Smash 3D', emoji: '🔴', c1: '#7c3aed', c2: '#f43f5e', cats: ['Arcade', 'Endless', 'Popular'], featured: true, hot: true, pop: true, isNew: true, tags: 'stack ball helix tower smash',
  desc: 'HOLD to smash your bouncy ball down through a spinning tower of colorful rings – but never hit the dark segments! Smash enough in a row to become an unstoppable fireball.',
  controls: 'Hold mouse / touch / Space', scoreLabel: 'SCORE',
  hint: 'HOLD the mouse / SPACE to smash down, release to bounce. Avoid the BLACK segments! Smash 8 rings in a row for FIRE mode.', hintTouch: 'HOLD to smash down, let go to bounce. Avoid BLACK segments – build up FIRE mode!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), SEGS = 12, GAP = 46;
    let level = E.data('level', 1), rings, rot = 0, rotSp, ball, holding = false, score = 0, combo = 0, fire = 0, heat = 0, t = 0, camY = 0, shards = [], msg = '', msgT = 0, over = false, done = 0, hue0;
    function build() {
      const n = 22 + level * 5; rings = []; hue0 = (level * 47) % 360; rotSp = 0.9 + level * 0.08;
      for (let k = 0; k < n; k++) {
        const r = rng(level * 1000 + k), bad = Math.min(SEGS - 3, Math.floor(1 + level * 0.35 + k / n * 2.5 + r() * 2)), types = Array(SEGS).fill(0);
        let start = Math.floor(r() * SEGS); for (let j = 0; j < bad; j++) types[(start + j * (r() < 0.5 ? 1 : 2)) % SEGS] = 1;
        if (k < 2) types.fill(0); const gapSeg = r() < 0.15 && k > 2 ? Math.floor(r() * SEGS) : -1; if (gapSeg >= 0) types[gapSeg] = 2;
        rings.push({ y: 120 + k * GAP, types, off: r() * TAU, wob: r() < 0.25 ? 1 : 0, alive: true });
      }
      ball = { y: 60, vy: 0 }; camY = 0; combo = 0; fire = 0; heat = 0; shards = []; done = 0;
      msg = 'LEVEL ' + level; msgT = 1.6;
    }
    build();
    const ringRot = rg => rot + rg.off + (rg.wob ? Math.sin(t * 1.5) * 0.6 : 0);
    function segUnder(rg) { const a = ((Math.PI / 2 - ringRot(rg)) % TAU + TAU) % TAU; return Math.floor(a / (TAU / SEGS)); }
    function nextRing() { return rings.find(r => r.alive && r.y >= ball.y - 2); }
    function smashRing(rg) {
      rg.alive = false; combo++; score += combo > 3 ? 2 : 1; heat = Math.min(1, heat + 0.13);
      if (heat >= 1 && !fire) { fire = 2.5; msg = '🔥 FIRE MODE!'; msgT = 1.2; E.sound('power'); }
      E.note(300 + Math.min(combo, 20) * 30, 0.08, 'square', 0.05);
      for (let s = 0; s < SEGS; s++) { if (rg.types[s] === 2) continue; const a = ringRot(rg) + (s + 0.5) * TAU / SEGS; shards.push({ a, r: 70, y: rg.y, vr: rand(160, 320), vy: rand(-160, 40), spin: rand(-8, 8), rot: 0, type: rg.types[s], hue: hue0 + (rings.indexOf(rg) * 9), life: 1 }); }
      fx.burst(E.W / 2, E.H * 0.42, 6, { col: [hsl(hue0, 90, 65), '#fff'], spd: 200, size: 4 });
    }
    function lose() { if (over) return; over = true; E.sound('crash'); E.shake(12); fx.burst(E.W / 2, E.H * 0.42, 40, { col: ['#f97316', '#fde047', '#fff'], spd: 320 }); E.gameOver({ score, title: 'Smashed into the dark!', lines: ['Level ' + level, 'Rings smashed: ' + score], delay: 1000 }); }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; rot += rotSp * dt;
        for (const s of shards) { s.r += s.vr * dt; s.y += s.vy * dt; s.vy += 900 * dt; s.rot += s.spin * dt; s.life -= dt * 1.3; } shards = shards.filter(s => s.life > 0);
        if (over) return;
        if (done) { done -= dt; if (done <= 0) { level++; E.save('level', level); E.coins(5 + level); build(); } return; }
        fire = Math.max(0, fire - dt); if (!holding) heat = Math.max(0, heat - dt * 0.35);
        const nr = nextRing(), floorY = nr ? nr.y : rings[rings.length - 1].y + GAP;
        if (holding) {
          ball.vy = 620; const ny = ball.y + ball.vy * dt;
          if (nr && ny + 12 >= nr.y) { const s = segUnder(nr), tp = nr.types[s]; if (tp === 1 && fire <= 0) { ball.y = nr.y - 12; lose(); return; } smashRing(nr); }
          ball.y = ny;
        } else {
          combo = 0; ball.vy += 1500 * dt; ball.y += ball.vy * dt;
          if (nr && ball.y + 12 >= nr.y && ball.vy > 0) { const s = segUnder(nr); if (nr.types[s] === 2) { /* falls through a gap */ smashRing(nr); } else { ball.y = nr.y - 12; ball.vy = -430; E.sound('bounce', 60); fx.burst(E.W / 2, E.H * 0.42 + 14, 6, { col: hsl(hue0 + 30, 80, 70), spd: 90, size: 3 }); } }
        }
        if (!rings.some(r => r.alive)) { done = 1.4; E.sound('win'); msg = '🏆 LEVEL ' + level + ' COMPLETE!'; msgT = 1.4; fx.burst(E.W / 2, E.H / 2, 60, { col: ['#fde047', '#f472b6', '#22d3ee'], spd: 400, shape: 'star', size: 7 }); E.submitBest(score); }
        camY += (ball.y - camY) * Math.min(1, dt * 8);
      },
      draw() {
        const W = E.W, H = E.H, s = Math.min(1.25, Math.min(W, H) / 560), cx = W / 2, by = H * 0.42, R = 120 * s, ry = 0.32;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(hue0 + 200, 55, 22), hsl(hue0 + 260, 60, 38)]); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.12; circle(ctx, (i * 173) % W, ((i * 97 - camY * 0.2) % H + H) % H, 10 + (i % 4) * 8, '#fff'); } ctx.globalAlpha = 1;
        const Y = y => by + (y - camY) * s;
        // pole
        ctx.fillStyle = lgrad(ctx, cx - 18 * s, 0, cx + 18 * s, 0, ['#cbd5e1', '#f8fafc', '#94a3b8']); ctx.fillRect(cx - 18 * s, 0, 36 * s, H);
        const vis = rings.filter(r => r.alive && Y(r.y) > -60 && Y(r.y) < H + 60).sort((a, b) => b.y - a.y);
        for (const rg of vis) {
          const y = Y(rg.y), th = 16 * s, ro = ringRot(rg), idx = rings.indexOf(rg), hue = hue0 + idx * 9;
          for (let pass = 0; pass < 2; pass++) for (let k = 0; k < SEGS; k++) {
            const tp = rg.types[k]; if (tp === 2) continue; const a0 = ro + k * TAU / SEGS + 0.02, a1 = ro + (k + 1) * TAU / SEGS - 0.02;
            const col = tp === 1 ? '#111827' : hsl(hue, 80, 58 - (k % 2) * 7), side = tp === 1 ? '#000' : hsl(hue, 70, 36);
            if (pass === 0) { // side band (front half only)
              const s0 = Math.max(a0, 0), s1 = Math.min(a1, Math.PI); const n0 = ((a0 % TAU) + TAU) % TAU, n1 = n0 + (a1 - a0); const lo = Math.max(n0, 0), hi = Math.min(n1, Math.PI);
              if (hi > lo) { ctx.beginPath(); ctx.ellipse(cx, y, R, R * ry, 0, lo, hi); ctx.ellipse(cx, y + th, R, R * ry, 0, hi, lo, true); ctx.closePath(); ctx.fillStyle = side; ctx.fill(); }
            } else { ctx.beginPath(); ctx.moveTo(cx, y); ctx.ellipse(cx, y, R, R * ry, 0, a0, a1); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); if (tp === 1) { ctx.strokeStyle = 'rgba(244,63,94,.35)'; ctx.lineWidth = 1.5; ctx.stroke(); } }
          }
          circle(ctx, cx, y, 18 * s, '#e2e8f0');
        }
        // shards
        for (const sh of shards) { const x = cx + Math.cos(sh.a) * sh.r * s, y = Y(sh.y) + Math.sin(sh.a) * sh.r * s * ry; ctx.globalAlpha = Math.max(0, sh.life); ctx.save(); ctx.translate(x, y); ctx.rotate(sh.rot); ctx.fillStyle = sh.type === 1 ? '#111827' : hsl(sh.hue, 80, 60); ctx.fillRect(-14 * s, -6 * s, 28 * s, 12 * s); ctx.restore(); } ctx.globalAlpha = 1;
        // ball (front, on the near side of the tower)
        if (!over || Math.floor(t * 10) % 2) {
          const bx = cx, byy = Y(ball.y) + R * ry * 0.75, r = 13 * s * (holding ? 1.05 : 1), sq = !holding && ball.vy < -300 ? 0.85 : 1;
          if (fire > 0) { ctx.drawImage(E.glow(25), bx - r * 3, byy - r * 3 - 10, r * 6, r * 6); for (let i = 0; i < 3; i++) fx.burst(bx, byy - 10, 1, { col: ['#f97316', '#fde047'], spd: 60, ang: -Math.PI / 2, spread: 0.6, life: 0.4, size: 5, glow: true }); }
          ctx.save(); ctx.translate(bx, byy); ctx.scale(1 / sq, sq); circle(ctx, 0, 0, r, rgrad(ctx, -r * 0.35, -r * 0.4, r * 0.1, r * 1.2, fire > 0 ? ['#fff', '#fbbf24', '#dc2626'] : ['#fff', '#fb7185', '#be123c'])); ctx.restore();
          if (holding) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, byy - r - 6); ctx.lineTo(bx, byy - r - 40); ctx.stroke(); }
        }
        fx.draw(ctx);
        // heat bar
        const hb = Math.min(220, W * 0.4); rr(ctx, W / 2 - hb / 2, H - 46, hb, 12, 6); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(ctx, W / 2 - hb / 2, H - 46, hb * (fire > 0 ? fire / 2.5 : heat), 12, 6); ctx.fillStyle = lgrad(ctx, W / 2 - hb / 2, 0, W / 2 + hb / 2, 0, ['#fde047', '#f97316', '#dc2626']); ctx.fill(); label(ctx, fire > 0 ? '🔥 FIRE!' : '🔥 HEAT', W / 2, H - 62, 13, '#fff');
        // level progress
        const left = rings.filter(r => r.alive).length, prog = 1 - left / rings.length, pb = Math.min(300, W * 0.55);
        label(ctx, String(level), W / 2 - pb / 2 - 22, 30, 18, '#fff'); label(ctx, String(level + 1), W / 2 + pb / 2 + 22, 30, 18, '#fff');
        rr(ctx, W / 2 - pb / 2, 22, pb, 14, 7); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(ctx, W / 2 - pb / 2, 22, pb * prog, 14, 7); ctx.fillStyle = '#fde047'; ctx.fill();
        label(ctx, String(score), W / 2, 72, 40, '#fff');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.2, 30, '#fde047');
        if (t < 3 && !holding) label(ctx, E.touch ? 'HOLD to smash!' : 'HOLD mouse / SPACE to smash!', W / 2, H * 0.84, 20, '#fff');
      },
      down() { holding = true; },
      up() { holding = false; },
      onKey(c) { if (c === 'Space' || c === 'ArrowDown' || c === 'KeyS') holding = true; },
      onKeyUp(c) { if (c === 'Space' || c === 'ArrowDown' || c === 'KeyS') holding = false; },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
  }
});
