/* =====================================================================
   COLOR SWITCH
   ===================================================================== */
registerGame({
  id: 'colorswitch', title: 'Color Switch', emoji: '🌈', c1: '#1a1a2e', c2: '#e94560', cats: ['Arcade', 'Endless'], hot: true,
  desc: 'Tap to bounce your ball through spinning obstacles – you can only pass through the parts that match your color!',
  controls: 'Tap / Space', scoreLabel: 'STARS',
  hint: 'Click or press SPACE to jump. Only pass through your own color. Grab ⭐ for points and orbs to change color.', hintTouch: 'Tap to jump. Only pass through your own color!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), C = ['#22d3ee', '#f43f5e', '#facc15', '#a855f7'];
    const ball = { y: 0, vy: 0, c: 0, r: 11 }; let camY = 0, obs = [], nextY = -300, score = 0, started = false, dead = false, t = 0, trail = [];
    const G = 1500, JUMP = -520;
    function addObstacle() {
      const lvl = Math.min(1, score / 30), kind = pick(score < 3 ? ['ring', 'ring', 'bar'] : ['ring', 'bar', 'cross', 'double', 'squares', 'ring']);
      const sp = (rand(0.9, 1.4) + lvl) * (Math.random() < 0.5 ? 1 : -1);
      const o = { kind, y: nextY, sp, a: rand(0, TAU), r: 105, star: true };
      obs.push(o);
      obs.push({ kind: 'switch', y: nextY - (kind === 'double' ? 210 : 170), used: false });
      nextY -= kind === 'double' ? 480 : 400;
    }
    for (let i = 0; i < 4; i++) addObstacle();
    function cx() { return E.W / 2; }
    // collision: test whether ball overlaps an arc segment of a different color
    function hitRing(o, R, th, a0, speed) {
      const dy = ball.y - o.y, d = Math.abs(dy);
      if (d > R + th / 2 + ball.r || d < R - th / 2 - ball.r) return false;
      // angle of ball relative to center (ball always at x=cx)
      const ang = dy < 0 ? -Math.PI / 2 : Math.PI / 2;
      const rel = ((ang - a0) % TAU + TAU) % TAU, seg = Math.floor(rel / (TAU / 4));
      return seg !== ball.c;
    }
    function die() { if (dead) return; dead = true; E.sound('pop'); E.shake(10); fx.burst(cx(), ball.y, 50, { col: C, spd: 380, size: 6, grav: 600 }); E.gameOver({ score, title: 'Wrong Color!', lines: ['Stars collected: ' + score] }); }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        if (!started || dead) return;
        ball.vy += G * dt; ball.y += ball.vy * dt;
        trail.push(ball.y); if (trail.length > 10) trail.shift();
        const target = ball.y - E.H * 0.1; if (target < camY) camY += (target - camY) * Math.min(1, dt * 8);
        if (ball.y - camY > E.H * 0.5 + 40) return die();
        for (const o of obs) {
          if (o.kind === 'switch') { if (!o.used && Math.abs(ball.y - o.y) < 22) { o.used = true; let n; do { n = irand(0, 3); } while (n === ball.c); ball.c = n; E.sound('power'); fx.burst(cx(), o.y, 20, { col: C, spd: 200 }); } continue; }
          o.a += o.sp * dt;
          if (o.star && Math.abs(ball.y - o.y) < 22) { o.star = false; score++; E.sound('coin'); fx.text(cx(), o.y - 30, '+1', '#fff'); fx.burst(cx(), o.y, 14, { col: '#fff', shape: 'star', size: 6, spd: 160 }); }
          let hit = false;
          if (o.kind === 'ring') hit = hitRing(o, o.r, 18, o.a);
          else if (o.kind === 'double') hit = hitRing(o, o.r, 16, o.a) || hitRing(o, o.r + 34, 16, -o.a + Math.PI);
          else if (o.kind === 'bar') { // horizontal moving bar of 4 segments
            if (Math.abs(ball.y - o.y) < 9 + ball.r) { const W = E.W, segW = W / 2, off = ((o.a * 80) % (segW * 4) + segW * 4) % (segW * 4), rel = ((cx() - off) % (segW * 4) + segW * 4) % (segW * 4), seg = Math.floor(rel / segW); if (seg !== ball.c) hit = true; }
          } else if (o.kind === 'cross') { // rotating cross offset to the left
            const px = cx() - 70, dx = cx() - px, dy = ball.y - o.y;
            for (let k = 0; k < 4; k++) { const a = o.a + k * Math.PI / 2, ex = Math.cos(a) * 110, ey = Math.sin(a) * 110; const s = segDist(dx, dy, 0, 0, ex, ey); if (s.d < 8 + ball.r && k !== ball.c) hit = true; }
          } else if (o.kind === 'squares') { // rotating square
            const half = 95, dy = ball.y - o.y; const c = Math.cos(o.a), s = Math.sin(o.a);
            const corners = [[-half, -half], [half, -half], [half, half], [-half, half]].map(([x, y]) => [x * c - y * s, x * s + y * c]);
            for (let k = 0; k < 4; k++) { const [ax, ay] = corners[k], [bx, by] = corners[(k + 1) % 4]; const sd = segDist(0, dy, ax, ay, bx, by); if (sd.d < 9 + ball.r && k !== ball.c) hit = true; }
          }
          if (hit) return die();
        }
        while (nextY > camY - E.H * 1.5) addObstacle();
        obs = obs.filter(o => o.y - camY < E.H);
      },
      draw() {
        const W = E.W, H = E.H, X = cx();
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, ['#1a1033', '#0b0b18']); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 40; i++) { const sy = ((i * 97 - camY * 0.2) % H + H) % H; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect((i * 173) % W, sy, 2, 2); }
        ctx.save(); ctx.translate(0, H * 0.5 - camY);
        // camera: world y -> screen y = y - camY + H/2
        for (const o of obs) {
          const y = o.y;
          if (o.kind === 'switch') { if (!o.used) { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(X, y); ctx.arc(X, y, 13, k * Math.PI / 2 + t * 2, (k + 1) * Math.PI / 2 + t * 2); ctx.closePath(); ctx.fillStyle = C[k]; ctx.fill(); } } continue; }
          ctx.lineCap = 'butt';
          const ring = (R, th, a0) => { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(X, y, R, a0 + k * Math.PI / 2 + 0.03, a0 + (k + 1) * Math.PI / 2 - 0.03); ctx.strokeStyle = C[k]; ctx.lineWidth = th; shadowOn(ctx, C[k], 12); ctx.stroke(); } shadowOff(ctx); };
          if (o.kind === 'ring') ring(o.r, 18, o.a);
          else if (o.kind === 'double') { ring(o.r, 16, o.a); ring(o.r + 34, 16, -o.a + Math.PI); }
          else if (o.kind === 'bar') { const segW = W / 2, off = ((o.a * 80) % (segW * 4) + segW * 4) % (segW * 4); for (let k = -1; k < 5; k++) { const x0 = off + k * segW - segW * 4; for (let j = 0; j < 3; j++) { const xx = x0 + j * segW * 4; const ci = ((k % 4) + 4) % 4; ctx.fillStyle = C[ci]; rr(ctx, xx, y - 9, segW - 4, 18, 9); ctx.fill(); } } }
          else if (o.kind === 'cross') { ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { const a = o.a + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(X - 70, y); ctx.lineTo(X - 70 + Math.cos(a) * 110, y + Math.sin(a) * 110); ctx.strokeStyle = C[k]; ctx.lineWidth = 16; ctx.stroke(); } circle(ctx, X - 70, y, 10, '#fff'); }
          else if (o.kind === 'squares') { const half = 95, c = Math.cos(o.a), s = Math.sin(o.a); const P = [[-half, -half], [half, -half], [half, half], [-half, half]].map(([a, b]) => [X + a * c - b * s, y + a * s + b * c]); ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(P[k][0], P[k][1]); ctx.lineTo(P[(k + 1) % 4][0], P[(k + 1) % 4][1]); ctx.strokeStyle = C[k]; ctx.lineWidth = 18; ctx.stroke(); } }
          if (o.star) { const p = 1 + 0.1 * Math.sin(t * 5); star(ctx, X, y, 14 * p, 6 * p, 5); ctx.fillStyle = '#fff'; shadowOn(ctx, '#fff', 14); ctx.fill(); shadowOff(ctx); }
        }
        if (!dead) {
          trail.forEach((ty, i) => { ctx.globalAlpha = i / trail.length * 0.35; circle(ctx, X, ty, ball.r * (i / trail.length), C[ball.c]); }); ctx.globalAlpha = 1;
          shadowOn(ctx, C[ball.c], 18); circle(ctx, X, ball.y, ball.r, C[ball.c]); shadowOff(ctx); circle(ctx, X - 3, ball.y - 3, 3.5, 'rgba(255,255,255,.7)');
        }
        fx.draw(ctx);
        ctx.restore();
        label(ctx, String(score), W / 2, 50, 46);
        if (!started) label(ctx, E.touch ? 'TAP TO START' : 'CLICK / SPACE TO START', W / 2, H * 0.7, 26, '#fff');
      },
      down() { if (dead) return; if (!started) { started = true; ball.y = 0; } ball.vy = JUMP; E.sound('jump', 20); },
      onKey(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') this.down(); },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
  }
});
