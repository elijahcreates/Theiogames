/* =====================================================================
   TENNIS CHALLENGE  (pseudo-3D, vs AI)
   ===================================================================== */
registerGame({
  id: 'tennis', title: 'Tennis Challenge', emoji: '🎾', c1: '#a8e063', c2: '#56ab2f', cats: ['Sports'],
  desc: 'Rally on a 3D-style hard court against computer opponents. Real tennis scoring with deuce and advantage – pick your difficulty!',
  controls: 'WASD / drag to move • ←/→ aim', scoreLabel: 'GAMES WON',
  hint: 'Move with WASD (or mouse). You swing automatically – hold ←/→ (or A/D) while hitting to aim. SPACE serves.', hintTouch: 'Drag to move – you swing automatically. Tap to serve. Swipe direction aims your shot!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), CL = 23.77, CW = 8.23, NZ = CL / 2, G = 9.8;
    let diff = 1, ready = false, target = 3;
    E.choose('Tennis Challenge', 'Choose your opponent', [{ label: '🟢 Easy – first to 2 games', value: [0, 2] }, { label: '🟡 Medium – first to 3 games', value: [1, 3] }, { label: '🔴 Hard – first to 4 games', value: [2, 4] }], v => { diff = v[0]; target = v[1]; ready = true; });
    const pl = { x: 0, z: -0.5, tx: null, swing: 0, aim: 0 }, ai = { x: 0, z: CL + 0.5, swing: 0 };
    let ball = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, live: false }, last = -1, bounces = 0, bounceSide = -1, pts = [0, 0], games = [0, 0], server = 0, state = 'serve', msg = '', msgT = 0, wait = 0, t = 0, drag = null, rally = 0, shadowTrail = [];
    function P(x, y, z) { const camZ = -8.5, camH = 4, f = Math.min(E.W * 0.9, E.H * 1.25), d = Math.max(0.3, z - camZ); return [E.W / 2 + x * f / d, E.H * 0.2 + (camH - y) * f / d, f / d]; }
    function hit(by, tx, tz, flight, high) {
      const sx = ball.x, sz = ball.z, sy = Math.max(0.6, ball.y); const T = flight;
      ball.vx = (tx - sx) / T; ball.vz = (tz - sz) / T; ball.vy = (0 - sy + 0.5 * G * T * T) / T;
      // net clearance
      const tn = (NZ - sz) / ball.vz; if (tn > 0 && tn < T) { const yn = sy + ball.vy * tn - 0.5 * G * tn * tn; if (yn < 1.2) ball.vy += (1.2 - yn) / tn; }
      if (high) ball.vy += 2;
      ball.y = sy; last = by; bounces = 0; ball.live = true; rally++;
      E.sound('hit'); E.note(by ? 330 : 440, 0.05, 'square', 0.06);
    }
    function serveBall() {
      if (state !== 'serve' || !ready) return; const s = server === 0 ? pl : ai; ball.x = s.x + 0.3; ball.z = s.z; ball.y = 2.6;
      const side = (pts[0] + pts[1]) % 2 ? -1 : 1, tz = server === 0 ? NZ + rand(3, 5.5) : NZ - rand(3, 5.5), tx = side * rand(0.6, 3.3) * (server === 0 ? 1 : -1);
      state = 'rally'; hit(server, tx, tz, server === 0 ? 0.85 : 0.9 - diff * 0.05); s.swing = 1; E.sound('whoosh');
    }
    const callPts = () => { const a = pts[0], b = pts[1], N = ['0', '15', '30', '40']; if (a >= 3 && b >= 3) return a === b ? 'DEUCE' : (a > b ? 'ADV YOU' : 'ADV CPU'); return N[Math.min(a, 3)] + ' – ' + N[Math.min(b, 3)]; };
    function point(w, why) {
      if (state !== 'rally') return; state = 'point'; wait = 1.4; pts[w]++; msg = (w === 0 ? 'Your point' : 'CPU point') + (why ? ' – ' + why : ''); msgT = 1.4; E.sound(w === 0 ? 'score' : 'bad');
      const a = pts[0], b = pts[1];
      if ((a >= 4 || b >= 4) && Math.abs(a - b) >= 2) {
        games[w]++; pts = [0, 0]; server = 1 - server; msg = (w === 0 ? 'GAME – YOU!' : 'GAME – CPU') + '   ' + games[0] + '–' + games[1]; msgT = 2; wait = 2; E.sound(w === 0 ? 'cheer' : 'bad');
        if (games[w] >= target) { state = 'over'; E.gameOver({ score: games[0], win: w === 0, title: w === 0 ? 'Game, Set & Match – You!' : 'CPU Wins the Match', label: 'GAMES ' + games[0] + ' – ' + games[1], lines: ['Opponent: ' + ['Easy', 'Medium', 'Hard'][diff]] }); }
      }
    }
    function reset() { pl.x = 0; pl.z = -0.5; ai.x = 0; ai.z = CL + 0.5; ball.live = false; state = 'serve'; rally = 0; last = -1; bounces = 0; wait = server === 1 ? 1.1 : 0; }
    function physics(dt) {
      if (!ball.live) return;
      ball.vy -= G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
      // net
      if (Math.abs(ball.z - NZ) < 0.15 && ball.y < 0.95 && Math.abs(ball.x) < CW / 2 + 1) { ball.vz *= -0.2; ball.vx *= 0.3; ball.z = NZ + (ball.vz > 0 ? 0.2 : -0.2); E.sound('thud'); }
      if (ball.y <= 0.035 && ball.vy < 0) {
        ball.y = 0.035; ball.vy *= -0.72; ball.vx *= 0.85; ball.vz *= 0.85; bounces++; E.note(700, 0.03, 'sine', 0.05);
        const side = ball.z < NZ ? 0 : 1; fx.burst(P(ball.x, 0, ball.z)[0], P(ball.x, 0, ball.z)[1], 3, { col: '#fff', spd: 40, size: 2 });
        if (bounces === 1) { const inX = Math.abs(ball.x) <= CW / 2 + 0.05, inZ = side === 1 ? ball.z <= CL + 0.05 : ball.z >= -0.05; if (side === last) return point(1 - last, 'net'); if (!inX || !inZ) return point(1 - last, 'out!'); }
        if (bounces >= 2) return point(last, '');
      }
      if (ball.z < -8 || ball.z > CL + 8 || Math.abs(ball.x) > 14) { if (bounces === 0) point(1 - last, 'out!'); else point(last, ''); }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; pl.swing = Math.max(0, pl.swing - dt * 3); ai.swing = Math.max(0, ai.swing - dt * 3);
        if (!ready || state === 'over') return;
        // player move
        const d = E.dir(); const sp = 7.5;
        if (d.mag) { pl.x += d.x * sp * dt; pl.z -= d.y * sp * dt * 0.8; pl.tx = null; }
        else if (pl.tx !== null) { pl.x += clamp(pl.tx - pl.x, -sp * dt, sp * dt); }
        pl.x = clamp(pl.x, -CW / 2 - 2.5, CW / 2 + 2.5); pl.z = clamp(pl.z, -3, NZ - 2);
        pl.aim = (E.key('ArrowLeft') || E.key('KeyA') ? -1 : 0) + (E.key('ArrowRight') || E.key('KeyD') ? 1 : 0) || (drag ? clamp(drag.dx / 80, -1, 1) : 0);
        // AI move: predict ball
        if (ball.live && ball.vz > 0) {
          let bx = ball.x, by = ball.y, bz = ball.z, vx = ball.vx, vy = ball.vy, vz = ball.vz, b = bounces;
          for (let i = 0; i < 200; i++) { vy -= G * 0.02; bx += vx * 0.02; by += vy * 0.02; bz += vz * 0.02; if (by < 0.035 && vy < 0) { vy *= -0.72; vx *= 0.85; vz *= 0.85; b++; } if (b >= 1 && by < 1.3 && vy < 0 && bz > NZ + 4) break; if (bz > CL + 3) break; }
          const spd = [4.5, 6.2, 8.2][diff], err = [1.4, 0.7, 0.25][diff];
          const tx = bx + Math.sin(t * 2) * err * 0.5, tz = clamp(bz + 0.4, NZ + 3, CL + 3);
          ai.x += clamp(tx - ai.x, -spd * dt, spd * dt); ai.z += clamp(tz - ai.z, -spd * dt * 0.6, spd * dt * 0.6);
        } else if (state !== 'serve' || server !== 1) { ai.x += clamp(0 - ai.x, -3 * dt, 3 * dt); ai.z += clamp(CL + 0.5 - ai.z, -3 * dt, 3 * dt); }
        if (state === 'serve' && server === 1) { wait -= dt; if (wait <= 0) serveBall(); }
        if (state === 'serve' && server === 0) { ball.x = pl.x + 0.3; ball.z = pl.z; ball.y = 1.1 + Math.abs(Math.sin(t * 3)) * 0.6; }
        if (state === 'rally') {
          for (let k = 0; k < 4; k++) physics(dt / 4);
          // player auto-swing
          if (state === 'rally' && last === 1 && bounces === 1 && ball.vz < 0) { const dx = ball.x - (pl.x + 0.4), dz = ball.z - pl.z; if (Math.abs(dx) < 1.5 && Math.abs(dz) < 1.0 && ball.y < 2.4) { pl.swing = 1; const tx = clamp(-pl.aim * 3.4 + (pl.aim ? 0 : rand(-2.5, 2.5)) + (dx * -0.8), -CW / 2 + 0.4, CW / 2 - 0.4) * -1; hit(0, tx, NZ + rand(6.5, 10.5), 1.05 - Math.min(0.25, rally * 0.01), false); } }
          if (state === 'rally' && last === 0 && bounces === 1 && ball.vz > 0) { const dx = ball.x - (ai.x - 0.4), dz = ball.z - ai.z; if (Math.abs(dx) < 1.4 && Math.abs(dz) < 1.0 && ball.y < 2.4) { if (Math.random() < [0.06, 0.03, 0.01][diff] * Math.min(3, 1 + rally * 0.1)) { /* whiff */ } else { ai.swing = 1; const aimX = [rand(-2.6, 2.6), (pl.x > 0 ? -1 : 1) * rand(1.5, 3.4), (pl.x > 0 ? -1 : 1) * rand(2.4, 3.6)][diff]; hit(1, aimX, rand(1.6, NZ - 3), [1.25, 1.05, 0.9][diff], false); } } }
        }
        if (state === 'point') { physics(dt); wait -= dt; if (wait <= 0) reset(); }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H * 0.4, ['#38bdf8', '#bae6fd']); ctx.fillRect(0, 0, W, H);
        const back = P(0, 0, CL + 9); ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, back[1] - 90, W, 90);
        for (let r = 0; r < 5; r++) for (let i = 0; i < W / 14; i++) { ctx.fillStyle = hsl((i * 53 + r * 17) % 360, 45, 55, 0.8); ctx.fillRect(i * 14 + (r % 2) * 7, back[1] - 86 + r * 16, 9, 10); }
        ctx.fillStyle = '#15803d'; ctx.fillRect(0, back[1], W, H);
        const quad = (x0, x1, z0, z1, col) => { const a = P(x0, 0, z0), b = P(x1, 0, z0), c = P(x1, 0, z1), d = P(x0, 0, z1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
        quad(-CW / 2 - 4, CW / 2 + 4, -7, CL + 8, '#16a34a'); quad(-CW / 2 - 1.37, CW / 2 + 1.37, 0, CL, '#2563eb');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; const ln = (x0, z0, x1, z1) => { const a = P(x0, 0, z0), b = P(x1, 0, z1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
        ln(-CW / 2, 0, CW / 2, 0); ln(-CW / 2, CL, CW / 2, CL); ln(-CW / 2, 0, -CW / 2, CL); ln(CW / 2, 0, CW / 2, CL); ln(-CW / 2 - 1.37, 0, -CW / 2 - 1.37, CL); ln(CW / 2 + 1.37, 0, CW / 2 + 1.37, CL);
        ln(-CW / 2, NZ - 6.4, CW / 2, NZ - 6.4); ln(-CW / 2, NZ + 6.4, CW / 2, NZ + 6.4); ln(0, NZ - 6.4, 0, NZ + 6.4);
        const drawPlayer = (p, far, col) => {
          const q = P(p.x, 0, p.z), s = q[2] / 55; ellipse(ctx, q[0], q[1], 22 * s, 6 * s, 'rgba(0,0,0,.3)');
          ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(s, s);
          ctx.fillStyle = '#f8fafc'; rr(ctx, -12, -40, 10, 40, 4); ctx.fill(); rr(ctx, 2, -40, 10, 40, 4); ctx.fill();
          ctx.fillStyle = col; rr(ctx, -16, -85, 32, 48, 10); ctx.fill(); circle(ctx, 0, -98, 13, '#f1c27d'); ctx.fillStyle = far ? '#111' : '#fde047'; ctx.beginPath(); ctx.arc(0, -101, 13.5, Math.PI, 0); ctx.fill();
          const sw = p.swing, a = (far ? -1 : 1) * (-0.6 + sw * 2.2); ctx.save(); ctx.translate(14, -72); ctx.rotate(a); ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.stroke(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, 44); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 56, 10, 14, 0, 0, TAU); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
          ctx.restore();
        };
        // draw order: far player, net, ball (if far), near player
        drawPlayer(ai, true, '#7c3aed');
        const ballBehindNet = ball.z > NZ;
        const drawBall = () => { const sh = P(ball.x, 0, ball.z), q = P(ball.x, ball.y, ball.z), r = Math.max(2, 0.07 * q[2] * 1.6); ellipse(ctx, sh[0], sh[1], r, r * 0.35, 'rgba(0,0,0,.35)'); circle(ctx, q[0], q[1], r, '#d9f99d'); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q[0] - r * 0.4, q[1], r * 0.8, -0.8, 0.8); ctx.stroke(); };
        if (ballBehindNet) drawBall();
        // net
        const n0 = P(-CW / 2 - 1.8, 0, NZ), n1 = P(CW / 2 + 1.8, 0, NZ), n0t = P(-CW / 2 - 1.8, 1.07, NZ), nm = P(0, 0.914, NZ), n1t = P(CW / 2 + 1.8, 1.07, NZ);
        ctx.fillStyle = 'rgba(15,23,42,.55)'; ctx.beginPath(); ctx.moveTo(n0[0], n0[1]); ctx.lineTo(n0t[0], n0t[1]); ctx.lineTo(nm[0], nm[1]); ctx.lineTo(n1t[0], n1t[1]); ctx.lineTo(n1[0], n1[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(n0t[0], n0t[1]); ctx.lineTo(nm[0], nm[1]); ctx.lineTo(n1t[0], n1t[1]); ctx.stroke(); ctx.fillStyle = '#334155'; ctx.fillRect(n0[0] - 3, n0t[1], 6, n0[1] - n0t[1]); ctx.fillRect(n1[0] - 3, n1t[1], 6, n1[1] - n1t[1]);
        if (!ballBehindNet) drawBall();
        drawPlayer(pl, false, '#ef4444');
        fx.draw(ctx);
        rr(ctx, W / 2 - 150, 12, 300, 58, 12); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill();
        label(ctx, 'GAMES  YOU ' + games[0] + ' – ' + games[1] + ' CPU', W / 2, 30, 15, '#fff'); label(ctx, callPts(), W / 2, 54, 20, '#fde047');
        if (state === 'serve' && server === 0 && ready) label(ctx, E.touch ? 'TAP TO SERVE' : 'PRESS SPACE / CLICK TO SERVE', W / 2, H * 0.4, 22, '#fff');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.32, 32, '#fde047');
      },
      down(x) { if (state === 'serve' && server === 0) serveBall(); drag = { x0: x, px: pl.x, dx: 0 }; },
      move(x) { if (drag && E.ptrDown) { drag.dx = x - drag.x0; pl.tx = drag.px + drag.dx / E.W * 14; } else if (!E.touch) { const q0 = P(-1, 0, pl.z), q1 = P(1, 0, pl.z); pl.tx = (x - (q0[0] + q1[0]) / 2) / ((q1[0] - q0[0]) / 2) - 0.4; } },
      up() { drag = null; },
      onKey(c) { if (c === 'Space' || c === 'Enter') serveBall(); },
      hud() { return null; }
    };
  }
});
