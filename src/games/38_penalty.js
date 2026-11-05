/* =====================================================================
   SOCCER PENALTIES  (1P vs AI keeper + local 2P shooter/keeper)
   ===================================================================== */
registerGame({
  id: 'penalty', title: 'Soccer Penalties', emoji: '⚽', c1: '#11998e', c2: '#38ef7d', cats: ['Sports', 'Multiplayer'], twoP: true, pop: true, hot: true,
  desc: 'Step up to the spot! Aim, set your power and curl it past the keeper. Play vs a computer keeper or take turns shooting and saving with a friend.',
  controls: 'Swipe / aim + power', scoreLabel: 'GOALS',
  hint: 'Swipe up towards the goal to shoot (longer swipe = harder) – or WASD to aim and hold SPACE for power.', hintTouch: 'Swipe up towards the goal to shoot! Longer swipe = harder shot.',
  hint2: 'Shooter: aim with your keys & hold your shoot key (P1: WASD + SPACE • P2: arrows + ENTER). Keeper dives with P1: A/W/D • P2: ←/↑/→.', hint2Touch: 'Shooter swipes up to shoot. Keeper taps the DIVE buttons to save!',
  p2info: 'P1 shoots and P2 keeps, then you swap. 5 rounds each – most goals wins (sudden death if tied).',
  create(E) {
    const ctx = E.ctx, fx = Fx(), two = E.mode === 2, GW = 7.32, GH = 2.44, DIST = 11;
    let diff = 1, shooter = 0, shots = [[], []], round = 0, state = 'aim', aim = { x: 0, y: 1.0 }, power = 0, charging = false, ball = null, keeper = { x: 0, y: 0, dive: 0, dir: 0, t: 0, react: 0 }, t = 0, msg = '', msgT = 0, wait = 0, swipe = null, ready = !two, total1P = 0, maxShots = 10, sudden = false;
    if (!two) E.choose('Choose the keeper', 'Difficulty of the computer goalkeeper', [{ label: '🟢 Easy keeper', value: 0 }, { label: '🟡 Pro keeper', value: 1 }, { label: '🔴 Legend keeper', value: 2 }], d => { diff = d; ready = true; });
    const keeperIdx = () => two ? 1 - shooter : -1;
    function setPads() {
      if (!two || !E.touch) { E.pads(null); return; }
      const k = keeperIdx(), base = k === 0 ? ['KeyA', 'KeyW', 'KeyD'] : ['ArrowLeft', 'ArrowUp', 'ArrowRight'], cls = k === 0 ? 'p1' : 'p2';
      E.pads([{ k: base[0], label: '⬅<br><small>DIVE</small>', left: 16, top: 120, size: 76, cls }, { k: base[1], label: '⬆<br><small>JUMP</small>', left: 100, top: 70, size: 76, cls }, { k: base[2], label: '➡<br><small>DIVE</small>', left: 184, top: 120, size: 76, cls }]);
    }
    setPads();
    function shoot(tx, ty, pw, curve) {
      if (state !== 'aim' || !ready) return;
      state = 'fly'; const speed = 18 + pw * 14; ball = { x: 0, y: 0.11, z: DIST, sx: 0, tx: clamp(tx, -5, 5), ty: clamp(ty, 0, 3.4), t: 0, dur: DIST / speed, curve: curve || 0, spin: 0 };
      E.sound('thud'); E.sound('whoosh');
      keeper.react = two ? 0 : [0.32, 0.2, 0.12][diff]; keeper.dir = 0; keeper.t = 0;
      if (!two) { const guess = Math.random() < [0.45, 0.65, 0.82][diff]; const gx = guess ? ball.tx : rand(-3, 3), gy = guess ? ball.ty : rand(0.3, 2); keeper.target = { x: clamp(gx, -3.6, 3.6), y: gy }; }
    }
    function dive(dir) { if (state !== 'fly' || keeper.dir) return; keeper.dir = dir; keeper.t = 0; keeper.target = { x: dir === 2 ? 0 : dir * 3.3, y: dir === 2 ? 2.1 : 1.1 }; E.sound('swish'); }
    function result(goal) {
      const rec = shots[shooter]; rec.push(goal);
      if (goal) { msg = pick(['GOOOAL!', 'GOAL!', 'TOP BINS!', 'WHAT A STRIKE!']); E.sound('cheer'); fx.burst(E.W / 2, E.H * 0.3, 60, { col: ['#fde047', '#fff', '#22c55e'], spd: 400, shape: 'star', size: 7 }); }
      else { msg = ball.missed ? 'MISSED!' : pick(['SAVED!', 'WHAT A SAVE!', 'DENIED!']); E.sound(ball.missed ? 'bad' : 'bonk'); }
      msgT = 1.6; state = 'result'; wait = 1.8;
    }
    function nextTurn() {
      if (!two) { if (shots[0].length >= maxShots) { const g = shots[0].filter(Boolean).length; E.gameOver({ score: g, win: g >= 6, title: 'Shootout Over', lines: ['Goals: ' + g + ' / ' + maxShots, 'Keeper: ' + ['Easy', 'Pro', 'Legend'][diff]] }); return; } }
      else {
        if (shooter === 1) round++;
        const a = shots[0].filter(Boolean).length, b = shots[1].filter(Boolean).length, n0 = shots[0].length, n1 = shots[1].length;
        if (round < 5 && !sudden) { const left0 = 5 - n0, left1 = 5 - n1; if (a + left0 < b || b + left1 < a) return finish(); }
        if ((round >= 5 && n0 === n1)) { if (a !== b) return finish(); sudden = true; if (round >= 8) return finish(); }
        shooter = 1 - shooter; setPads();
        msg = 'PLAYER ' + (shooter + 1) + ' SHOOTS'; msgT = 1.5;
      }
      state = 'aim'; ball = null; keeper.x = 0; keeper.y = 0; keeper.dir = 0; keeper.target = null; aim = { x: 0, y: 1 }; power = 0;
    }
    function finish() { const a = shots[0].filter(Boolean).length, b = shots[1].filter(Boolean).length, w = a === b ? 0 : a > b ? 1 : 2; state = 'over'; E.pads(null); E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: w ? 'PLAYER ' + w + ' WINS' : 'DRAW', label: a + ' – ' + b, title: '⚽ Shootout Result', lines: ['Player 1: ' + shots[0].map(g => g ? '⚽' : '❌').join(' '), 'Player 2: ' + shots[1].map(g => g ? '⚽' : '❌').join(' ')] }); }
    // projection: goal plane z=0, camera behind ball
    function P(x, y, z) { const cz = DIST + 6.5, f = Math.min(E.W * 0.95, E.H * 1.5), d = Math.max(0.5, cz - z), camH = 2.2; return [E.W / 2 + x * f / d, E.H * 0.3 + (camH - y) * f / d, f / d]; }
    function goalToScreen() { return { l: P(-GW / 2, 0, 0), r: P(GW / 2, GH, 0) }; }
    function screenToGoal(sx, sy) { const a = P(0, 0, 0), b = P(1, 1, 0); return { x: (sx - a[0]) / (b[0] - a[0]), y: (sy - a[1]) / (b[1] - a[1]) }; }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        if (!ready || state === 'over') return;
        const sh = shooter, K = E.key;
        if (state === 'aim') {
          const aimK = two ? (sh === 0 ? ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'] : ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter']) : null;
          const L = aimK ? K(aimK[0]) : K('KeyA') || K('ArrowLeft'), R = aimK ? K(aimK[1]) : K('KeyD') || K('ArrowRight'), U = aimK ? K(aimK[2]) : K('KeyW') || K('ArrowUp'), D = aimK ? K(aimK[3]) : K('KeyS') || K('ArrowDown');
          aim.x = clamp(aim.x + ((R ? 1 : 0) - (L ? 1 : 0)) * dt * 4, -4.6, 4.6); aim.y = clamp(aim.y + ((U ? 1 : 0) - (D ? 1 : 0)) * dt * 2.5, 0.1, 3.2);
          const hold = aimK ? K(aimK[4]) : K('Space') || K('Enter');
          if (hold) { charging = true; power = Math.min(1, power + dt * 1.1); } else if (charging) { charging = false; shoot(aim.x + rand(-0.3, 0.3) * power, aim.y + rand(-0.2, 0.35) * power, power, 0); }
        }
        if (state === 'fly') {
          const b = ball; b.t += dt; const k = Math.min(1, b.t / b.dur);
          b.z = DIST * (1 - k); b.x = lerp(0, b.tx, k) + Math.sin(k * Math.PI) * b.curve; b.y = lerp(0.11, b.ty, k) + Math.sin(k * Math.PI) * 0.6 * (1 - b.ty / 4); b.spin += dt * 20;
          // keeper
          keeper.t += dt;
          if (!two && keeper.t > keeper.react && keeper.target && !keeper.dir) keeper.dir = keeper.target.x < -0.6 ? -1 : keeper.target.x > 0.6 ? 1 : 2;
          if (two && !keeper.dir) { const kk = keeperIdx() === 0 ? ['KeyA', 'KeyW', 'KeyD'] : ['ArrowLeft', 'ArrowUp', 'ArrowRight']; if (K(kk[0])) dive(-1); else if (K(kk[2])) dive(1); else if (K(kk[1])) dive(2); }
          if (keeper.dir && keeper.target) { const sp = 7.5 + (two ? 1 : diff * 1.2); const dx = keeper.target.x - keeper.x, dy = keeper.target.y - keeper.y, d = Math.hypot(dx, dy); if (d > 0.05) { const m = Math.min(d, sp * dt); keeper.x += dx / d * m; keeper.y += dy / d * m; } }
          if (k >= 1) {
            const inGoal = Math.abs(b.x) < GW / 2 - 0.11 && b.y < GH - 0.08;
            const kw = keeper.dir === 2 ? 0.9 : keeper.dir ? 1.25 : 0.7, kh = keeper.dir === 2 ? 1.0 : 0.75, ky = keeper.y + (keeper.dir ? 0.6 : 1.0);
            const saved = Math.abs(b.x - keeper.x) < kw && Math.abs(b.y - ky) < kh + 0.3;
            if (!inGoal) { b.missed = true; result(false); } else if (saved) { result(false); fx.burst(E.W / 2, E.H * 0.4, 20, { col: '#fff', spd: 200 }); } else result(true);
          }
        }
        if (state === 'result') { if (ball) { ball.z -= dt * (ball.missed ? 8 : 2); } wait -= dt; if (wait <= 0) nextTurn(); }
      },
      draw() {
        const W = E.W, H = E.H;
        // stadium
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H * 0.4, ['#0f172a', '#1e3a8a']); ctx.fillRect(0, 0, W, H);
        for (let r = 0; r < 7; r++) for (let i = 0; i < W / 16; i++) { ctx.fillStyle = hsl((i * 47 + r * 31) % 360, 50, 45 + (r % 2) * 10, 0.75); ctx.fillRect(i * 16 + (r % 2) * 8, H * 0.06 + r * 18 + Math.sin(t * 5 + i) * (msgT > 0 && state === 'result' ? 3 : 0.5), 10, 12); }
        for (const lx of [0.15, 0.85]) { ctx.drawImage(E.glow(55), W * lx - 90, -60, 180, 180); }
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(0, H * 0.06 + 7 * 18, W, 20); txt(ctx, 'THEIOGAMES CUP • THEIOGAMES CUP • THEIOGAMES CUP', W / 2, H * 0.06 + 7 * 18 + 10, 12, '#fecaca', 'center', 900);
        const gl = P(-30, 0, 0); const horizon = gl[1] - 0;
        ctx.fillStyle = lgrad(ctx, 0, H * 0.06 + 7 * 18 + 20, 0, H, ['#15803d', '#22c55e']); ctx.fillRect(0, H * 0.06 + 7 * 18 + 20, W, H);
        for (let i = -6; i < 8; i++) { const a = P(i * 4, 0, 0), b = P(i * 4 + 2, 0, 0), c = P(i * 4 + 2, 0, DIST + 6), d = P(i * 4, 0, DIST + 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.fill(); }
        // box lines
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; const line = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], 0, p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke(); };
        line([[-20, 0], [20, 0]]); line([[-9.2, 0], [-9.2, 5.5], [9.2, 5.5], [9.2, 0]]); line([[-3.7, 0], [-3.7, 2], [3.7, 2], [3.7, 0]]);
        const spot = P(0, 0, DIST); circle(ctx, spot[0], spot[1], 4, '#fff');
        // goal
        const g0 = P(-GW / 2, 0, 0), g1 = P(GW / 2, GH, 0), gb0 = P(-GW / 2, 0, -2), gb1 = P(GW / 2, GH, -1.5);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(g0[0], g1[1], g1[0] - g0[0], g0[1] - g1[1]);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (let i = 0; i <= 24; i++) { const x = lerp(gb0[0], gb1[0], i / 24); ctx.beginPath(); ctx.moveTo(x, gb1[1]); ctx.lineTo(x, gb0[1]); ctx.stroke(); } for (let j = 0; j <= 10; j++) { const y = lerp(gb1[1], gb0[1], j / 10); ctx.beginPath(); ctx.moveTo(gb0[0], y); ctx.lineTo(gb1[0], y); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(g0[0], g1[1]); ctx.lineTo(gb0[0], gb1[1]); ctx.moveTo(g1[0], g1[1]); ctx.lineTo(gb1[0], gb1[1]); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(gb0[0], gb0[1]); ctx.moveTo(g1[0], g0[1]); ctx.lineTo(gb1[0], gb0[1]); ctx.stroke();
        // keeper
        const kp = P(keeper.x, keeper.y, 0.3), ks = kp[2] / 128, tilt = keeper.dir === -1 ? -1.1 : keeper.dir === 1 ? 1.1 : 0;
        ctx.save(); ctx.translate(kp[0], kp[1]); ctx.rotate(tilt * Math.min(1, keeper.t * 4)); ctx.scale(ks, ks);
        ellipse(ctx, 0, 4, 50, 10, 'rgba(0,0,0,.25)');
        const kc = two && keeperIdx() === 1 ? '#e11d48' : two ? '#2563eb' : '#f59e0b';
        ctx.fillStyle = '#111827'; rr(ctx, -30, -95, 24, 95, 10); ctx.fill(); rr(ctx, 6, -95, 24, 95, 10); ctx.fill();
        ctx.fillStyle = kc; rr(ctx, -40, -190, 80, 105, 22); ctx.fill(); txt(ctx, '1', 0, -140, 40, '#fff', 'center', 900);
        const armUp = keeper.dir ? -1 : 0; ctx.fillStyle = kc; for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 38, -175); ctx.rotate(s * (0.6 + (armUp ? 1.6 : 0.3))); rr(ctx, -10, 0, 20, 75, 10); ctx.fill(); circle(ctx, 0, 82, 16, '#fef3c7'); ctx.restore(); }
        circle(ctx, 0, -218, 30, '#f1c27d'); ctx.fillStyle = '#3f2a1d'; ctx.beginPath(); ctx.arc(0, -226, 31, Math.PI, 0); ctx.fill(); circle(ctx, -10, -216, 4, '#111'); circle(ctx, 10, -216, 4, '#111');
        ctx.restore();
        // ball
        const bp = ball ? P(ball.x, ball.y, ball.z) : P(0, 0.11, DIST);
        if (ball && ball.z > 0.2) { const sh = P(ball.x, 0, ball.z); ellipse(ctx, sh[0], sh[1], 0.11 * sh[2] * 1.2, 0.11 * sh[2] * 0.4, 'rgba(0,0,0,.35)'); }
        const br = 0.11 * bp[2] * 1.4; ctx.save(); ctx.translate(bp[0], bp[1] - br * 0.2); ctx.rotate(ball ? ball.spin : 0); circle(ctx, 0, 0, br, '#fff'); ctx.fillStyle = '#111'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.beginPath(); for (let j = 0; j < 5; j++) { const aa = a + j / 5 * TAU; ctx.lineTo(Math.cos(a) * br * 0.62 + Math.cos(aa) * br * 0.2, Math.sin(a) * br * 0.62 + Math.sin(aa) * br * 0.2); } ctx.fill(); } star(ctx, 0, 0, br * 0.28, br * 0.2, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, br, 0, TAU); ctx.stroke(); ctx.restore();
        // aim marker
        if (state === 'aim' && ready) {
          const ap = P(aim.x, aim.y, 0); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ap[0], ap[1], 16, 0, TAU); ctx.moveTo(ap[0] - 24, ap[1]); ctx.lineTo(ap[0] + 24, ap[1]); ctx.moveTo(ap[0], ap[1] - 24); ctx.lineTo(ap[0], ap[1] + 24); ctx.stroke();
          if (charging) { const bw = 200; rr(ctx, W / 2 - bw / 2, H - 50, bw, 16, 8); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, H - 50, bw * power, 16, 8); ctx.fillStyle = lgrad(ctx, W / 2 - bw / 2, 0, W / 2 + bw / 2, 0, ['#4ade80', '#facc15', '#ef4444']); ctx.fill(); }
        }
        if (swipe && swipe.pts.length > 1) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); swipe.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
        fx.draw(ctx);
        // scoreboard
        const sb = (i, x) => { const s = shots[i]; label(ctx, two ? 'P' + (i + 1) : 'YOU', x, H - 64, 16, i === shooter ? '#fde047' : '#fff'); const n = Math.max(two ? 5 : maxShots, s.length); for (let k = 0; k < n; k++) circle(ctx, x - (n - 1) * 9 + k * 18, H - 40, 7, s[k] === undefined ? 'rgba(255,255,255,.25)' : s[k] ? '#22c55e' : '#ef4444'); };
        if (two) { sb(0, W * 0.25); sb(1, W * 0.75); } else sb(0, W / 2);
        if (two && state === 'aim') label(ctx, 'PLAYER ' + (shooter + 1) + ' SHOOTS • PLAYER ' + (2 - shooter) + ' IN GOAL', W / 2, H * 0.06 + 7 * 18 + 44, 16, '#fff');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.32, 48, msg.indexOf('GO') >= 0 || msg.indexOf('BINS') >= 0 || msg.indexOf('STRIKE') >= 0 ? '#fde047' : '#fff');
      },
      down(x, y) { if (state === 'aim' && ready && y > E.H * 0.45) swipe = { pts: [{ x, y }], t0: performance.now() }; },
      move(x, y) { if (swipe) swipe.pts.push({ x, y }); },
      up(x, y) {
        if (!swipe) return; const s = swipe; swipe = null; const p0 = s.pts[0], dy = p0.y - y, dx = x - p0.x; if (dy < 40) return;
        const dur = Math.max(60, performance.now() - s.t0), len = Math.hypot(dx, dy), pw = clamp(len / dur * 0.9, 0.15, 1);
        const mid = s.pts[Math.floor(s.pts.length / 2)], curve = clamp(((mid.x - p0.x) - dx / 2) / 60, -1.2, 1.2);
        const tx = dx / E.W * 16, ty = clamp(dy / E.H * 5.5 - 0.4, 0, 3.6); shoot(tx, ty, pw, -curve);
      },
      destroy() { E.pads(null); },
      hud() { return two ? null : { stats: [['Goals', shots[0].filter(Boolean).length + ' / ' + shots[0].length]] }; }
    };
  }
});
