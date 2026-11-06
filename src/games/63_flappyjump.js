/* =====================================================================
   FLAPPY JUMP  (tap-to-jump endless sky dash through candy obstacles)
   ===================================================================== */
registerGame({
  id: 'flappyjump', title: 'Flappy Jump', emoji: '🐥', c1: '#a78bfa', c2: '#f472b6', cats: ['Arcade', 'Endless', 'Popular'], featured: true, hot: true, pop: true, isNew: true, tags: 'flappy jump tap',
  desc: 'Tap to make Jelly Bop jump through candy-land gates, spinning saws and moving pillars. Grab stars, snag a bubble shield, and see how far you can go!',
  controls: 'Tap / click / Space / ↑', scoreLabel: 'SCORE',
  hint: 'Click, tap, SPACE or ↑ to jump. Fly through the gaps, dodge spinning saws, grab ⭐ stars and the 🫧 shield!', hintTouch: 'Tap to jump! Fly through the gaps and grab the stars.',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    const P = { x: 0, y: 0, vy: 0, rot: 0, squash: 1, shield: 0, blink: 0 };
    let obs = [], items = [], t = 0, score = 0, stars = 0, started = false, dead = false, scroll = 0, nextX = 0, speed = 210, theme = 0, trail = [];
    const THEMES = [{ sky: ['#c4b5fd', '#fbcfe8'], hill: ['#a7f3d0', '#6ee7b7'], ground: '#f9a8d4' }, { sky: ['#fde68a', '#fdba74'], hill: ['#fca5a5', '#f87171'], ground: '#fb923c' }, { sky: ['#1e1b4b', '#7c3aed'], hill: ['#4c1d95', '#6d28d9'], ground: '#a855f7' }, { sky: ['#99f6e4', '#bfdbfe'], hill: ['#86efac', '#4ade80'], ground: '#22c55e' }];
    const gy = () => E.H - 70;
    function reset() { P.x = E.W * 0.28; P.y = E.H * 0.45; nextX = E.W + 120; }
    reset();
    function add() {
      const d = Math.min(1, score / 45), k = Math.random(), gap = lerp(200, 145, d), top = rand(90, gy() - gap - 70);
      if (k < 0.62 - d * 0.2) obs.push({ k: 'gate', x: nextX, top, gap, move: score > 8 && Math.random() < 0.4 + d * 0.3 ? rand(30, 70) : 0, ph: rand(0, TAU), base: top, passed: false });
      else if (k < 0.82) obs.push({ k: 'saw', x: nextX, y: rand(130, gy() - 120), r: rand(30, 42), amp: rand(40, 110), ph: rand(0, TAU), passed: false });
      else obs.push({ k: 'twin', x: nextX, top, gap: gap + 20, passed: false, rot: 0 });
      if (Math.random() < 0.7) { const o = obs[obs.length - 1]; items.push({ x: nextX, y: o.k === 'saw' ? (o.y > E.H / 2 ? o.y - 120 : o.y + 120) : o.top + o.gap / 2, k: 'star' }); }
      if (Math.random() < 0.07) items.push({ x: nextX + 130, y: rand(120, gy() - 100), k: 'shield' });
      nextX += lerp(310, 250, d);
    }
    function hit() {
      if (P.shield > 0) { P.shield = 0; P.blink = 1.2; E.sound('pop'); fx.burst(P.x, P.y, 26, { col: ['#a5f3fc', '#fff'], spd: 240 }); return; }
      if (P.blink > 0 || dead) return; dead = true; E.sound('crash'); E.shake(10); fx.burst(P.x, P.y, 40, { col: ['#22d3ee', '#f472b6', '#fde047', '#fff'], spd: 300, size: 6 });
      E.gameOver({ score, title: 'Bop!', lines: ['Gates passed: ' + score, '⭐ Stars: ' + stars], delay: 900 });
    }
    function jump() { if (dead) return; if (!started) started = true; P.vy = -560; P.squash = 0.7; E.sound('jump', 30); fx.burst(P.x - 10, P.y + 18, 6, { col: '#fff', spd: 80, size: 3, ang: Math.PI / 2, spread: 0.8 }); }
    return {
      update(dt) {
        t += dt; fx.update(dt); P.squash += (1 - P.squash) * Math.min(1, dt * 10); P.blink = Math.max(0, P.blink - dt); P.shield = Math.max(0, P.shield - dt);
        if (!started) { P.y = E.H * 0.45 + Math.sin(t * 4) * 12; scroll += 80 * dt; return; }
        if (dead) { if (P.y < gy()) { P.vy += 1700 * dt; P.y += P.vy * dt; P.rot += dt * 8; } return; }
        speed = Math.min(380, 210 + score * 4); theme = Math.floor(score / 15) % THEMES.length;
        P.vy += 1700 * dt; P.y += P.vy * dt; P.rot = clamp(P.vy / 900, -0.5, 1);
        scroll += speed * dt; nextX -= speed * dt; while (nextX < E.W + 300) add();
        trail.push({ x: P.x, y: P.y }); if (trail.length > 10) trail.shift();
        for (const o of obs) {
          o.x -= speed * dt;
          if (o.k === 'gate') { if (o.move) o.top = o.base + Math.sin(t * 1.8 + o.ph) * o.move; if (P.x + 18 > o.x - 34 && P.x - 18 < o.x + 34 && (P.y - 16 < o.top || P.y + 16 > o.top + o.gap)) hit(); }
          else if (o.k === 'saw') { const sy = o.y + Math.sin(t * 2 + o.ph) * o.amp; o.cy = sy; if (dist(P.x, P.y, o.x, sy) < o.r + 14) hit(); }
          else if (o.k === 'twin') { o.rot += dt * 2; for (const s of [-1, 1]) { const ex = o.x + Math.cos(o.rot) * 70 * s, ey = o.top + o.gap / 2 + Math.sin(o.rot) * 70 * s; if (dist(P.x, P.y, ex, ey) < 30) hit(); } }
          if (!o.passed && o.x + 30 < P.x) { o.passed = true; score++; E.sound('score'); if (score % 15 === 0) { fx.text(E.W / 2, E.H * 0.3, '🌈 NEW WORLD!', '#fff', 30); E.sound('power'); } }
        }
        obs = obs.filter(o => o.x > -120);
        for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.x -= speed * dt; if (it.x < -40) { items.splice(i, 1); continue; } if (dist(it.x, it.y, P.x, P.y) < 34) { items.splice(i, 1); if (it.k === 'star') { stars++; score += 1; E.sound('coin'); fx.burst(it.x, it.y, 12, { col: '#fde047', spd: 160, shape: 'star' }); } else { P.shield = 8; E.sound('power'); fx.text(P.x, P.y - 40, 'SHIELD!', '#a5f3fc', 22); } } }
        if (P.y > gy() - 18) { P.y = gy() - 18; hit(); if (!dead) P.vy = -500; } if (P.y < 20) { P.y = 20; P.vy = 0; }
      },
      draw() {
        const W = E.W, H = E.H, th = THEMES[theme];
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, th.sky); ctx.fillRect(0, 0, W, H);
        if (theme === 2) for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect((i * 137) % W, (i * 71) % (H * 0.6), 2, 2); }
        for (let i = 0; i < 6; i++) { const x = ((i * 230 - scroll * 0.2) % (W + 230) + W + 230) % (W + 230) - 115, y = 60 + (i % 3) * 55; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.arc(x + 26, y - 10, 28, 0, TAU); ctx.arc(x + 54, y, 20, 0, TAU); ctx.fill(); }
        for (let l = 0; l < 2; l++) { ctx.fillStyle = th.hill[l]; ctx.beginPath(); ctx.moveTo(0, gy()); for (let x = 0; x <= W + 30; x += 30) { const wx = x + scroll * (0.3 + l * 0.25); ctx.lineTo(x, gy() - 50 - l * 0 - Math.abs(Math.sin(wx * 0.006 + l * 2)) * (90 - l * 40)); } ctx.lineTo(W, gy()); ctx.fill(); }
        // lollipop trees
        for (let i = 0; i < 6; i++) { const x = ((i * 190 - scroll * 0.55) % (W + 190) + W + 190) % (W + 190) - 95; ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, gy() - 70, 6, 70); circle(ctx, x, gy() - 80, 20, hsl(i * 60, 80, 65)); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, gy() - 80, 11, 0, 4.5); ctx.stroke(); }
        // obstacles
        for (const o of obs) {
          if (o.k === 'gate') { for (const [y0, y1, top] of [[-10, o.top, true], [o.top + o.gap, gy(), false]]) { ctx.fillStyle = lgrad(ctx, o.x - 34, 0, o.x + 34, 0, ['#f472b6', '#fdf2f8', '#ec4899']); ctx.fillRect(o.x - 34, y0, 68, y1 - y0); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let y = y0 + 10; y < y1; y += 26) { ctx.beginPath(); ctx.moveTo(o.x - 34, y); ctx.lineTo(o.x + 34, y + 12); ctx.lineTo(o.x + 34, y + 20); ctx.lineTo(o.x - 34, y + 8); ctx.fill(); } const cy = top ? y1 - 22 : y0; rr(ctx, o.x - 42, cy, 84, 22, 10); ctx.fillStyle = '#be185d'; ctx.fill(); ctx.fillStyle = '#fde047'; for (let k = 0; k < 4; k++) { ctx.beginPath(); if (top) { ctx.moveTo(o.x - 36 + k * 20, cy + 22); ctx.lineTo(o.x - 26 + k * 20, cy + 36); ctx.lineTo(o.x - 16 + k * 20, cy + 22); } else { ctx.moveTo(o.x - 36 + k * 20, cy); ctx.lineTo(o.x - 26 + k * 20, cy - 14); ctx.lineTo(o.x - 16 + k * 20, cy); } ctx.fill(); } } }
          else if (o.k === 'saw') { const sy = o.cy || o.y; ctx.strokeStyle = 'rgba(71,85,105,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.amp - 30); ctx.lineTo(o.x, o.y + o.amp + 30); ctx.stroke(); ctx.save(); ctx.translate(o.x, sy); ctx.rotate(t * 10); star(ctx, 0, 0, o.r, o.r * 0.72, 12); ctx.fillStyle = lgrad(ctx, -o.r, -o.r, o.r, o.r, ['#e2e8f0', '#64748b']); ctx.fill(); circle(ctx, 0, 0, o.r * 0.3, '#334155'); ctx.restore(); }
          else { circle(ctx, o.x, o.top + o.gap / 2, 10, '#7c3aed'); for (const s of [-1, 1]) { const ex = o.x + Math.cos(o.rot) * 70 * s, ey = o.top + o.gap / 2 + Math.sin(o.rot) * 70 * s; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(o.x, o.top + o.gap / 2); ctx.lineTo(ex, ey); ctx.stroke(); ctx.drawImage(E.glow(290), ex - 34, ey - 34, 68, 68); circle(ctx, ex, ey, 20, '#c084fc'); star(ctx, ex, ey, 22, 14, 8, t * 3); ctx.fillStyle = '#6d28d9'; ctx.fill(); } }
        }
        for (const it of items) { const b = Math.sin(t * 5 + it.x * 0.01) * 5; if (it.k === 'star') { ctx.drawImage(E.glow(50), it.x - 26, it.y - 26 + b, 52, 52); star(ctx, it.x, it.y + b, 16, 7, 5, t * 2); ctx.fillStyle = '#fde047'; ctx.fill(); } else { circle(ctx, it.x, it.y + b, 18, 'rgba(165,243,252,.6)'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } }
        // ground
        ctx.fillStyle = th.ground; ctx.fillRect(0, gy(), W, H - gy()); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = -(scroll % 40); x < W; x += 40) ctx.fillRect(x, gy(), 20, 10);
        // player: Jelly Bop
        trail.forEach((p, i) => { ctx.globalAlpha = i / trail.length * 0.25; circle(ctx, p.x, p.y, 16 * i / trail.length, '#22d3ee'); }); ctx.globalAlpha = 1;
        if (!(P.blink > 0 && Math.floor(t * 14) % 2)) { ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.rot); ctx.scale(1 / P.squash * 0.9 + 0.1, P.squash);
          ctx.beginPath(); ctx.moveTo(-24, 6); ctx.bezierCurveTo(-26, -30, 26, -30, 24, 6); ctx.quadraticCurveTo(0, 26, -24, 6); ctx.fillStyle = rgrad(ctx, -6, -12, 2, 30, ['#ecfeff', '#22d3ee', '#0e7490']); ctx.fill(); ctx.strokeStyle = '#155e75'; ctx.lineWidth = 2; ctx.stroke();
          ellipse(ctx, -8, -12, 6, 4, 'rgba(255,255,255,.7)'); circle(ctx, 8, -4, 7, '#fff'); circle(ctx, 10, -4, 3.5, '#111'); ellipse(ctx, 2, 8, 5, 3, '#f472b6');
          ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.ellipse(-16, 0, 10, 6, -0.6 + Math.sin(t * 25) * 0.5, 0, TAU); ctx.fill(); ctx.restore();
          if (P.shield > 0) { ctx.strokeStyle = `rgba(165,243,252,${0.6 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P.x, P.y, 34, 0, TAU); ctx.stroke(); } }
        fx.draw(ctx);
        label(ctx, String(score), W / 2, 64, 56, '#fff'); label(ctx, '⭐ ' + stars, W - 60, 30, 18, '#fde047');
        if (!started) { label(ctx, 'FLAPPY JUMP', W / 2, H * 0.22, 46, '#fff'); label(ctx, E.touch ? 'TAP TO JUMP' : 'CLICK / SPACE TO JUMP', W / 2, H * 0.66, 22, '#fff'); }
      },
      down() { jump(); },
      onKey(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW' || c === 'Enter') jump(); },
      resize() { if (!started) reset(); else P.x = E.W * 0.28; },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
  }
});
