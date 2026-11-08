/* =====================================================================
   TABLE TENNIS  (1P vs AI + local 2P)
   ===================================================================== */
registerGame({
  id: 'tabletennis', title: 'Table Tennis', emoji: '🏓', c1: '#1d976c', c2: '#93f9b9', cats: ['Sports', 'Multiplayer'], twoP: true, pop: true,
  desc: 'Fast side-view ping-pong with real bounce rules. Smash, chop and angle your returns – first to 11 wins. Battle the computer or a friend!',
  controls: 'Mouse / drag • WASD vs arrows', scoreLabel: 'POINTS WON',
  hint: 'Move your paddle (left) with the mouse or WASD. Swing through the ball for power. Click / SPACE to serve. First to 11!', hintTouch: 'Drag on the left half to move your paddle. Tap to serve. First to 11!',
  hint2: 'P1 (left): WASD + SPACE serve • P2 (right): arrows + ENTER serve. Move into the ball to hit harder!', hint2Touch: 'P1 drags on the LEFT half, P2 on the RIGHT half. Tap your half to serve!',
  p2info: 'Player 1 = left paddle (WASD), Player 2 = right paddle (arrow keys). First to 11 points, win by 2.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), two = E.mode === 2, VW = 1000, VH = 600, TOP = 400, TL = 200, TR = 800, NETX = 500, NETH = 34, G = 980, BR = 7, PR = 30;
    let diff = 1, ready = two, view;
    if (!two) E.choose('Table Tennis', 'Choose your opponent', [{ label: '🟢 Rookie', value: 0 }, { label: '🟡 Club Player', value: 1 }, { label: '🔴 Champion', value: 2 }], d => { diff = d; ready = true; });
    const P = [{ x: 120, y: 330, vx: 0, vy: 0, px: 120, py: 330, tx: null, ty: null, swing: 0 }, { x: 880, y: 330, vx: 0, vy: 0, px: 880, py: 330, tx: null, ty: null, swing: 0 }];
    const ZX = [[30, 330], [670, 970]];
    let ball = { x: 0, y: 0, vx: 0, vy: 0, live: false, spin: 0 }, score = [0, 0], server = 0, serves = 0, last = -1, bounces = [0, 0], state = 'serve', msg = '', msgT = 0, t = 0, wait = 0, rally = 0, touchMap = {}, trail = [];
    function placeServe() { const s = P[server]; ball.x = s.x + (server ? -20 : 20); ball.y = s.y - 40; ball.vx = ball.vy = 0; ball.live = false; state = 'serve'; last = -1; bounces = [0, 0]; rally = 0; }
    placeServe();
    function launch(pi, power, aimY) {
      const dir = pi === 0 ? 1 : -1, pd = P[pi];
      const tgt = pi === 0 ? lerp(560, 770, clamp(0.5 + aimY, 0, 1)) : lerp(440, 230, clamp(0.5 + aimY, 0, 1));
      const speed = clamp(480 + power, 420, 1000), vx = dir * speed, tt = (tgt - ball.x) / vx;
      let vy = (TOP - BR - ball.y - 0.5 * G * tt * tt) / tt;
      // ensure the arc clears the net
      const tn = (NETX - ball.x) / vx; if (tn > 0) { const yn = ball.y + vy * tn + 0.5 * G * tn * tn; if (yn > TOP - NETH - 12) vy -= (yn - (TOP - NETH - 12)) / tn; }
      ball.vx = vx; ball.vy = vy; ball.spin = pd.vy * 0.002; last = pi; bounces = [0, 0]; ball.live = true; state = 'rally'; rally++;
      E.note(pi ? 520 : 440, 0.06, 'square', 0.07); E.sound('hit', 20); fx.burst(ball.x, ball.y, 6, { col: '#fff', spd: 120, size: 3 });
    }
    function serve(pi) { if (state !== 'serve' || pi !== server || !ready) return; launch(pi, 60, rand(-0.3, 0.3)); }
    function point(w, why) {
      if (state === 'point') return; score[w]++; state = 'point'; wait = 1.2; msg = (two ? 'PLAYER ' + (w + 1) : w ? 'CPU' : 'YOUR') + ' POINT' + (why ? ' – ' + why : ''); msgT = 1.2;
      E.sound(w === 0 || two ? 'score' : 'bad'); serves++;
      const deuce = score[0] >= 10 && score[1] >= 10; if (serves >= (deuce ? 1 : 2)) { serves = 0; server = 1 - server; }
      if ((score[0] >= 11 || score[1] >= 11) && Math.abs(score[0] - score[1]) >= 2) {
        state = 'over'; const win = score[0] > score[1] ? 0 : 1;
        if (two) E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: 'PLAYER ' + (win + 1) + ' WINS', label: score[0] + ' – ' + score[1], title: '🏓 Match Point!', lines: ['Final score ' + score[0] + ' – ' + score[1]] });
        else E.gameOver({ score: score[0], win: win === 0, title: win === 0 ? 'You Win the Match!' : 'CPU Wins the Match', label: score[0] + ' – ' + score[1], lines: ['Opponent: ' + ['Rookie', 'Club Player', 'Champion'][diff]] });
      }
    }
    function ai(dt) {
      const p = P[1], sp = [380, 560, 760][diff];
      let ty = 330, tx = 860;
      if (state === 'serve' && server === 1) { wait -= dt; if (wait < -0.6) launch(1, 60 + diff * 40, rand(-0.4, 0.4)); }
      if (ball.live && ball.vx > 0) {
        // predict where the ball will be when it reaches x≈ paddle zone after bouncing
        let bx = ball.x, by = ball.y, bvx = ball.vx, bvy = ball.vy; for (let i = 0; i < 160; i++) { bvy += G * 0.008; bx += bvx * 0.008; by += bvy * 0.008; if (by > TOP - BR && bx > TL && bx < TR) { by = TOP - BR; bvy *= -0.86; } if (bx > 840 + diff * 20 && bvy > -200) break; }
        ty = by + [rand(-30, 30), rand(-14, 14), 0][diff]; tx = clamp(bx + 10, 700, 960);
      }
      p.tx = tx; p.ty = ty;
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy); if (d > 1) { const m = Math.min(d, sp * dt); p.x += dx / d * m; p.y += dy / d * m; }
    }
    function physics(dt) {
      if (!ball.live) return;
      ball.vy += G * dt + ball.spin * 400 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift();
      // net
      if (Math.abs(ball.x - NETX) < BR + 2 && ball.y > TOP - NETH && ball.y < TOP) { ball.vx *= -0.25; ball.x = NETX + (ball.vx > 0 ? BR + 3 : -BR - 3); E.sound('thud'); }
      // table bounce
      if (ball.vy > 0 && ball.y > TOP - BR && ball.y < TOP + 12 && ball.x > TL && ball.x < TR) {
        ball.y = TOP - BR; ball.vy *= -0.88; E.note(900, 0.03, 'sine', 0.06);
        const side = ball.x < NETX ? 0 : 1; bounces[side]++; fx.burst(ball.x, TOP, 4, { col: '#fff', spd: 60, size: 2 });
        if (last >= 0 && side === last) return point(1 - last, 'own side'); // hit into own side
        if (bounces[side] >= 2) return point(1 - side, 'double bounce');
      }
      // paddle hits
      for (let pi = 0; pi < 2; pi++) {
        const p = P[pi]; if (last === pi && state === 'rally') continue;
        if (Math.hypot(ball.x - p.x, ball.y - p.y) < PR + BR) {
          const recvSide = pi; if (last >= 0 && bounces[recvSide] === 0) return point(1 - pi, 'volley'); // must bounce first
          const toward = pi === 0 ? Math.max(0, p.vx) : Math.max(0, -p.vx); const power = toward * 0.6 + Math.abs(p.vy) * 0.15;
          const aimY = clamp((p.y - ball.y) / PR * 0.4 + (pi === 0 ? -p.vy : p.vy) * 0.0006, -0.6, 0.6);
          p.swing = 1; launch(pi, power, aimY); if (power > 380) { msg = 'SMASH!'; msgT = 0.8; E.shake(5); }
          return;
        }
      }
      // out
      if (ball.y > VH + 20 || ball.x < -40 || ball.x > VW + 40) {
        const recv = last === 0 ? 1 : 0;
        if (last < 0) return;
        if (bounces[recv] > 0) point(last, 'missed return'); else point(recv, 'out');
      }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        if (!ready || state === 'over') return;
        // input
        const K = E.key;
        const keyMove = (pi, k) => { const dx = (K(k[3]) ? 1 : 0) - (K(k[2]) ? 1 : 0), dy = (K(k[1]) ? 1 : 0) - (K(k[0]) ? 1 : 0); if (dx || dy) { P[pi].tx = null; P[pi].x += dx * 520 * dt; P[pi].y += dy * 520 * dt; } };
        keyMove(0, ['KeyW', 'KeyS', 'KeyA', 'KeyD']);
        if (two) keyMove(1, ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']); else { keyMove(0, ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']); ai(dt); }
        for (let pi = 0; pi < (two ? 2 : 1); pi++) { const p = P[pi]; if (p.tx !== null) { p.x += (p.tx - p.x) * Math.min(1, dt * 22); p.y += (p.ty - p.y) * Math.min(1, dt * 22); } }
        for (let pi = 0; pi < 2; pi++) { const p = P[pi]; p.x = clamp(p.x, ZX[pi][0], ZX[pi][1]); p.y = clamp(p.y, 140, 560); p.vx = (p.x - p.px) / dt; p.vy = (p.y - p.py) / dt; p.px = p.x; p.py = p.y; p.swing = Math.max(0, p.swing - dt * 5); }
        if (state === 'serve') { const s = P[server]; ball.x = s.x + (server ? -22 : 22); ball.y = s.y - 34 + Math.sin(t * 6) * 6; }
        if (state === 'rally') for (let k = 0; k < 4; k++) physics(dt / 4);
        if (state === 'point') { wait -= dt; physics(dt); if (wait <= 0) { placeServe(); wait = 0; } }
      },
      draw() {
        view = E.fit(VW, VH); ctx.fillStyle = '#0b1120'; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, VH, ['#1e293b', '#334155', '#0f172a']); ctx.fillRect(0, 0, VW, VH);
        // arena lights + banners
        for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.25; ctx.drawImage(E.glow(200), 100 + i * 250, -100, 200, 240); } ctx.globalAlpha = 1;
        ctx.fillStyle = '#1d4ed8'; ctx.fillRect(0, 470, VW, 130); ctx.fillStyle = '#1e40af'; for (let x = 0; x < VW; x += 120) ctx.fillRect(x, 480, 100, 50); txt(ctx, 'THEIOGAMES OPEN', VW / 2, 505, 22, 'rgba(255,255,255,.5)', 'center', 900);
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 560, VW, 40);
        // table
        ellipse(ctx, 500, 548, 330, 12, 'rgba(0,0,0,.4)');
        ctx.fillStyle = '#1f2937'; ctx.fillRect(TL + 40, TOP + 14, 12, 140); ctx.fillRect(TR - 52, TOP + 14, 12, 140);
        ctx.fillStyle = lgrad(ctx, 0, TOP, 0, TOP + 14, ['#1d4ed8', '#1e3a8a']); ctx.fillRect(TL, TOP, TR - TL, 14);
        ctx.fillStyle = '#fff'; ctx.fillRect(TL, TOP - 2, TR - TL, 3);
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(NETX - 2, TOP - NETH, 4, NETH); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let y = TOP - NETH; y < TOP; y += 5) ctx.fillRect(NETX - 6, y, 12, 1);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(NETX - 7, TOP - NETH - 3, 14, 4);
        // paddles + players
        const drawPaddle = (p, pi) => {
          const col = pi === 0 ? '#ef4444' : two ? '#2563eb' : '#111827', dir = pi === 0 ? 1 : -1;
          // arm/player silhouette
          const sx = pi === 0 ? p.x - 70 : p.x + 70; ctx.strokeStyle = pi === 0 ? '#fca5a5' : '#93c5fd'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, Math.max(p.y - 30, 250)); ctx.quadraticCurveTo((sx + p.x) / 2, p.y + 10, p.x - dir * 18, p.y + 8); ctx.stroke();
          ctx.fillStyle = pi === 0 ? '#dc2626' : '#1d4ed8'; rr(ctx, sx - 26, Math.max(p.y - 70, 210), 52, 120, 20); ctx.fill(); circle(ctx, sx, Math.max(p.y - 92, 188), 22, '#f1c27d');
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dir * (-0.4 - p.swing * 0.8));
          ctx.fillStyle = '#a16207'; rr(ctx, -5, 18, 10, 26, 4); ctx.fill();
          shadowOn(ctx, 'rgba(0,0,0,.4)', 8, 2, 4); ellipse(ctx, 0, 0, PR * 0.75, PR, col); shadowOff(ctx); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, PR * 0.75, PR, 0, 0, TAU); ctx.stroke();
          ctx.restore();
        };
        drawPaddle(P[0], 0); drawPaddle(P[1], 1);
        // ball
        trail.forEach((p, i) => { ctx.globalAlpha = i / trail.length * 0.3; circle(ctx, p.x, p.y, BR * i / trail.length, '#fde68a'); }); ctx.globalAlpha = 1;
        ellipse(ctx, ball.x, ball.x > TL && ball.x < TR ? TOP : 560, BR, 2.5, 'rgba(0,0,0,.35)');
        circle(ctx, ball.x, ball.y, BR, '#fff7ed'); circle(ctx, ball.x - 2, ball.y - 2, 2, '#fff');
        fx.draw(ctx);
        // scoreboard
        rr(ctx, VW / 2 - 160, 14, 320, 66, 14); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill();
        label(ctx, String(score[0]), VW / 2 - 70, 47, 38, '#fca5a5'); label(ctx, String(score[1]), VW / 2 + 70, 47, 38, two ? '#93c5fd' : '#e5e7eb'); label(ctx, '–', VW / 2, 47, 30);
        txt(ctx, two ? 'P1' : 'YOU', VW / 2 - 140, 47, 13, '#fca5a5', 'center', 800); txt(ctx, two ? 'P2' : 'CPU', VW / 2 + 140, 47, 13, '#93c5fd', 'center', 800);
        circle(ctx, server === 0 ? VW / 2 - 110 : VW / 2 + 110, 47, 5, '#fde047');
        if (state === 'serve' && ready && (two || server === 0)) label(ctx, (two ? 'PLAYER ' + (server + 1) + ' – ' : '') + (E.touch ? 'TAP TO SERVE' : (server === 0 ? 'SPACE / CLICK' : 'ENTER') + ' TO SERVE'), VW / 2, 130, 20, '#fde047');
        if (msgT > 0) label(ctx, msg, VW / 2, 180, 28, '#fff');
        if (rally > 4 && state === 'rally') label(ctx, 'RALLY ' + rally, VW / 2, 105, 16, '#a5f3fc');
        E.endWorld();
      },
      down(x, y, id) {
        if (!view) return; const p = view.toWorld(x, y); const pi = two ? (p.x < VW / 2 ? 0 : 1) : 0;
        if (state === 'serve' && server === pi) serve(pi);
        touchMap[id] = { pi, ox: P[pi].x - p.x, oy: P[pi].y - p.y };
      },
      move(x, y, id) {
        if (!view) return; const p = view.toWorld(x, y), m = touchMap[id];
        if (m && E.ptrDown) { P[m.pi].tx = p.x + (E.touch ? m.ox : 0); P[m.pi].ty = p.y + (E.touch ? m.oy : 0); }
        else if (!E.touch && !two) { P[0].tx = p.x; P[0].ty = p.y; }
      },
      up(x, y, id) { delete touchMap[id]; },
      onKey(c) { if (c === 'Space' || c === 'KeyF') serve(0); if (c === 'Enter') serve(two ? 1 : 0); },
      hud() { return null; }
    };
  }
});
