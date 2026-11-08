/* =====================================================================
   BASKETBALL CHALLENGE  (1P + local 2P)
   ===================================================================== */
registerGame({
  id: 'basketball', title: 'Basketball Challenge', emoji: '🏀', c1: '#f12711', c2: '#f5af19', cats: ['Sports', 'Physics', 'Multiplayer'], twoP: true, pop: true, featured: true,
  desc: 'Flick the ball into the hoop from different distances. Swishes and streaks multiply your score – the hoop starts moving as you heat up!',
  controls: 'Drag & release • W/S/A/D + Space', scoreLabel: 'POINTS',
  hint: 'Drag back from the ball and release to shoot (or W/S angle, A/D power, SPACE shoot). 60 seconds!', hintTouch: 'Pull back from the ball and release to shoot. 60 seconds!',
  hint2: 'Turns of 30 s. P1: drag or W/S angle • A/D power • SPACE. P2: drag or ↑/↓ angle • ←/→ power • ENTER.', hint2Touch: 'Take turns: pull back and release to shoot. 30-second turns!',
  p2info: 'Players alternate 30-second shooting turns (2 turns each). Highest total wins.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 1000, VH = 600, R = 17, G = 980, two = E.mode === 2;
    let view, ball, hoop = { x: 850, y: 250, hy: 0, hx: 0 }, net = 0, t = 0, time = two ? 30 : 60, score = [0, 0], streak = 0, mult = 1, shots = 0, makes = 0;
    let aim = null, kAng = 0.95, kPow = 0.62, turn = 0, turnsDone = 0, between = 0, msg = '', msgT = 0, spot, started = !two, swishOK = true, scored = false, ended = false;
    const SPOTS = [{ x: 430, y: 520, n: 'Close', b: 0 }, { x: 300, y: 520, n: 'Mid-range', b: 0 }, { x: 170, y: 520, n: '3-POINT', b: 1 }];
    function newBall() { spot = pick(SPOTS); ball = { x: spot.x, y: spot.y - 60, vx: 0, vy: 0, live: false, rot: 0, t: 0, done: false, touched: false }; scored = false; swishOK = true; }
    newBall();
    if (two) { msg = 'PLAYER 1 – GET READY!'; msgT = 2; between = 2; }
    const rimF = () => ({ x: hoop.x - 44 + hoop.hx, y: hoop.y + hoop.hy }), rimB = () => ({ x: hoop.x + 44 + hoop.hx, y: hoop.y + hoop.hy });
    function shoot(vx, vy) { if (ball.live || ended || between > 0 || time <= 0) return; ball.vx = vx; ball.vy = vy; ball.live = true; shots++; E.sound('swish'); }
    function shootK() { const a = kAng, p = 520 + kPow * 600; shoot(Math.cos(a) * p, -Math.sin(a) * p); }
    function bounceCirc(c, cr, e) {
      const dx = ball.x - c.x, dy = ball.y - c.y, d = Math.hypot(dx, dy);
      if (d < R + cr && d > 0) { const nx = dx / d, ny = dy / d; ball.x = c.x + nx * (R + cr); ball.y = c.y + ny * (R + cr); const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= (1 + e) * vn * nx; ball.vy -= (1 + e) * vn * ny; ball.vx *= 0.92; } ball.touched = true; swishOK = false; E.sound('bounce', 80); }
    }
    function endTurn() {
      if (!two) { ended = true; E.gameOver({ score: score[0], win: score[0] >= 30, title: "Time's Up!", lines: ['Shots made: ' + makes + ' / ' + shots, 'Accuracy: ' + (shots ? Math.round(makes / shots * 100) : 0) + '%'] }); return; }
      turnsDone++;
      if (turnsDone >= 4) { ended = true; const w = score[0] === score[1] ? 0 : score[0] > score[1] ? 1 : 2; E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: w ? 'PLAYER ' + w + ' WINS!' : 'DRAW!', label: 'RESULT', title: '🏀 Final Buzzer', lines: ['Player 1: ' + score[0] + ' pts', 'Player 2: ' + score[1] + ' pts'] }); return; }
      turn = 1 - turn; time = 30; streak = 0; mult = 1; between = 2.2; msg = 'PLAYER ' + (turn + 1) + "'S TURN"; msgT = 2.2; E.sound('ding'); newBall();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; net = Math.max(0, net - dt * 2);
        if (ended) return;
        if (between > 0) { between -= dt; return; }
        time -= dt; if (time <= 0 && !ball.live) { time = 0; endTurn(); return; }
        const lvl = two ? 0 : score[0];
        if (lvl >= 10) hoop.hy = Math.sin(t * 1.2) * Math.min(70, (lvl - 8) * 4); if (lvl >= 25) hoop.hx = Math.sin(t * 0.8) * 50;
        if (!ball.live) {
          const p1 = !two || turn === 0, p2 = !two || turn === 1, K = E.key;
          if ((p1 && K('KeyW')) || (p2 && K('ArrowUp'))) kAng = Math.min(1.45, kAng + dt * 0.8);
          if ((p1 && K('KeyS')) || (p2 && K('ArrowDown'))) kAng = Math.max(0.2, kAng - dt * 0.8);
          if ((p1 && K('KeyD')) || (p2 && K('ArrowRight'))) kPow = Math.min(1, kPow + dt * 0.5);
          if ((p1 && K('KeyA')) || (p2 && K('ArrowLeft'))) kPow = Math.max(0, kPow - dt * 0.5);
          return;
        }
        ball.t += dt;
        const steps = 4;
        for (let s = 0; s < steps; s++) {
          const h = dt / steps; const py = ball.y;
          ball.vy += G * h; ball.x += ball.vx * h; ball.y += ball.vy * h; ball.rot += ball.vx * h * 0.03;
          bounceCirc(rimF(), 5, 0.55); bounceCirc(rimB(), 5, 0.55);
          // backboard
          const bx = hoop.x + 58 + hoop.hx, by0 = hoop.y + hoop.hy - 115, by1 = hoop.y + hoop.hy + 30;
          if (ball.x + R > bx && ball.x < bx + 12 && ball.y > by0 && ball.y < by1 && ball.vx > 0) { ball.x = bx - R; ball.vx *= -0.6; ball.touched = true; E.sound('thud', 80); }
          if (ball.y > 560 - R) { ball.y = 560 - R; ball.vy *= -0.55; ball.vx *= 0.8; if (Math.abs(ball.vy) > 60) E.sound('bounce', 100); }
          const f = rimF(), b = rimB();
          if (!scored && py < f.y && ball.y >= f.y && ball.x > f.x + 4 && ball.x < b.x - 4 && ball.vy > 0) {
            scored = true; makes++; streak++; const base = 2 + spot.b, sw = swishOK ? 1 : 0; mult = Math.min(4, 1 + Math.floor(streak / 3));
            const pts = (base + sw) * mult; score[turn] += pts; net = 1;
            E.sound(sw ? 'cheer' : 'score'); fx.burst(ball.x, ball.y + 20, 24, { col: ['#fde047', '#fb923c', '#fff'], spd: 220, shape: 'star', size: 6 });
            msg = (sw ? 'SWISH! ' : '') + '+' + pts + (mult > 1 ? '  (x' + mult + ' streak)' : ''); msgT = 1.3;
          }
        }
        if (ball.t > 3.2 || ball.x < -50 || ball.x > VW + 60 || (ball.y > 520 && Math.abs(ball.vy) < 40 && ball.t > 1)) {
          if (!scored) { streak = 0; mult = 1; }
          newBall(); if (time <= 0) endTurn();
        }
      },
      draw() {
        view = E.fit(VW, VH);
        ctx.fillStyle = '#0b0b16'; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        // arena
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, 330, ['#1e1b4b', '#3b0764']); ctx.fillRect(0, 0, VW, 330);
        for (let r = 0; r < 6; r++) for (let i = 0; i < 46; i++) { const x = i * 22 + (r % 2) * 11, y = 120 + r * 34, j = Math.sin(t * 6 + i + r) * (net > 0 ? 4 : 1); ctx.fillStyle = hsl((i * 37 + r * 60) % 360, 55, 55, 0.8); circle(ctx, x, y + j, 7); ctx.fill(); ctx.fillRect(x - 7, y + 6 + j, 14, 14); }
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 300, VW, 40);
        for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.18; ctx.drawImage(E.glow(50), i * 230 - 40, -80, 200, 200); } ctx.globalAlpha = 1;
        // floor
        ctx.fillStyle = lgrad(ctx, 0, 330, 0, VH, ['#d97706', '#b45309']); ctx.fillRect(0, 330, VW, VH - 330);
        ctx.strokeStyle = 'rgba(120,53,15,.35)'; ctx.lineWidth = 2; for (let x = -200; x < VW + 200; x += 50) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + (x - 500) * 0.6, VH); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(860, 560, 600, 60, 0, Math.PI * 0.95, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 560); ctx.lineTo(VW, 560); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; SPOTS.forEach(s => { ellipse(ctx, s.x, 562, 22, 5); ctx.fill(); });
        // hoop: pole + backboard
        const hx = hoop.x + hoop.hx, hy = hoop.y + hoop.hy;
        ctx.fillStyle = '#334155'; ctx.fillRect(hx + 90, hy - 60, 14, 620 - hy); ctx.fillRect(hx + 58, hy - 20, 40, 10);
        ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(hx + 58, hy - 115, 12, 145); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.strokeRect(hx + 58, hy - 115, 12, 145);
        // net
        const sw = Math.sin(t * 20) * net * 6;
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6;
        for (let i = 0; i <= 6; i++) { const x0 = hx - 44 + i * 88 / 6, x1 = hx - 28 + i * 56 / 6 + sw; ctx.beginPath(); ctx.moveTo(x0, hy); ctx.lineTo(x1, hy + 58 + net * 10); ctx.stroke(); }
        for (let k = 1; k <= 3; k++) { const yy = hy + k * 18, w = 88 - k * 10; ctx.beginPath(); ctx.moveTo(hx - w / 2 + sw * k / 3, yy); ctx.lineTo(hx + w / 2 + sw * k / 3, yy); ctx.stroke(); }
        // ball (behind front rim)
        const drawBall = () => {
          if (!ball.live) { ellipse(ctx, ball.x, 560, 20, 5, 'rgba(0,0,0,.3)'); }
          ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.rot);
          circle(ctx, 0, 0, R, rgrad(ctx, -6, -6, 2, R * 1.2, ['#fdba74', '#ea580c', '#9a3412']));
          ctx.strokeStyle = '#431407'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
          ctx.beginPath(); ctx.arc(-R * 1.1, 0, R * 0.8, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(R * 1.1, 0, R * 0.8, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
          ctx.restore();
        };
        drawBall();
        // rim front
        ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(hx, hy, 46, 8, 0, 0, Math.PI); ctx.stroke(); ctx.strokeStyle = '#c2410c'; ctx.beginPath(); ctx.ellipse(hx, hy, 46, 8, 0, Math.PI, TAU); ctx.stroke();
        // aim preview
        let pv = null;
        if (aim && !ball.live) { const dx = aim.sx - aim.x, dy = aim.sy - aim.y; pv = { vx: clamp(dx * 4.2, -1200, 1200), vy: clamp(dy * 4.2, -1300, 600) }; }
        else if (!ball.live && !E.touch && between <= 0) { const p = 520 + kPow * 600; pv = { vx: Math.cos(kAng) * p, vy: -Math.sin(kAng) * p }; }
        if (pv) { for (let k = 1; k < 12; k++) { const tt = k * 0.045; ctx.globalAlpha = 1 - k / 12; circle(ctx, ball.x + pv.vx * tt, ball.y + pv.vy * tt + G * tt * tt / 2, 5, '#fff'); } ctx.globalAlpha = 1; }
        if (aim) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x - (aim.sx - aim.x), ball.y - (aim.sy - aim.y)); ctx.stroke(); ctx.setLineDash([]); }
        fx.draw(ctx);
        // scoreboard
        rr(ctx, VW / 2 - 170, 12, 340, 70, 14); ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
        if (two) { label(ctx, 'P1 ' + score[0], VW / 2 - 105, 46, 26, turn === 0 ? '#93c5fd' : '#64748b'); label(ctx, 'P2 ' + score[1], VW / 2 + 105, 46, 26, turn === 1 ? '#fda4af' : '#64748b'); }
        else label(ctx, String(score[0]), VW / 2 - 90, 46, 34, '#fde047');
        label(ctx, Math.ceil(Math.max(0, time)) + 's', VW / 2 + (two ? 0 : 70), 46, 30, time < 10 ? '#f87171' : '#fff');
        if (!ball.live && between <= 0) label(ctx, spot.n + (spot.b ? ' (+1)' : ''), ball.x, ball.y - 46, 16, '#fff');
        if (streak >= 3) label(ctx, '🔥 ON FIRE x' + mult, VW / 2, 104, 20, '#fb923c');
        if (msgT > 0) label(ctx, msg, VW / 2, 200, 34, '#fde047');
        E.endWorld();
      },
      down(x, y) { if (!view) return; const p = view.toWorld(x, y); if (ball.live || between > 0) return; aim = { sx: p.x, sy: p.y, x: p.x, y: p.y }; },
      move(x, y) { if (!aim || !view) return; const p = view.toWorld(x, y); aim.x = p.x; aim.y = p.y; },
      up() { if (!aim) return; const dx = aim.sx - aim.x, dy = aim.sy - aim.y; aim = null; if (Math.hypot(dx, dy) < 15) return; shoot(clamp(dx * 4.2, -1200, 1200), clamp(dy * 4.2, -1300, 600)); },
      onKey(c) {
        const p1 = !two || turn === 0, p2 = !two || turn === 1;
        if ((p1 && c === 'Space') || (p2 && c === 'Enter') || (!two && c === 'Enter')) shootK();
      },
      hud() { return { stats: two ? [['Turn', 'P' + (turn + 1) + ' (' + (turnsDone + 1) + '/4)']] : [['Made', makes + '/' + shots], ['Best', fmt(E.best())]] }; }
    };
  }
});
