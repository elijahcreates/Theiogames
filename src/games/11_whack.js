/* =====================================================================
   WHACK-A-MOLE  (Whack-a-Bloop)
   ===================================================================== */
registerGame({
  id: 'whack', title: 'Whack-a-Mole', emoji: '🔨', c1: '#56ab2f', c2: '#a8e063', cats: ['Arcade'], pop: true,
  desc: 'Bonk the cheeky moles as they pop out of their burrows. Golden moles are worth extra – but don’t hit the spiky ones!',
  controls: 'Click / tap • keys 1-9', scoreLabel: 'SCORE',
  hint: 'Click the moles (or use number keys 1–9). Golden = +50, spiky = −30. 60 seconds!', hintTouch: 'Tap the moles! Golden = bonus, spiky = penalty. 60 seconds!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), holes = [];
    let score = 0, time = 60, hits = 0, misses = 0, spawnT = 0.6, t = 0, combo = 0, hammer = null, started = false, countdown = 3;
    for (let i = 0; i < 9; i++) holes.push({ i, up: 0, state: 'down', timer: 0, kind: 'normal', hit: 0, stay: 1 });
    function layout() {
      const W = E.W, H = E.H, gw = Math.min(W * 0.92, H * 1.15, 760), cw = gw / 3, top = H * 0.24 + Math.max(0, (H * 0.74 - gw * 0.78) / 2);
      return holes.map(h => ({ x: W / 2 + (h.i % 3 - 1) * cw, y: top + Math.floor(h.i / 3) * cw * 0.72 + cw * 0.36, r: cw * 0.34 }));
    }
    function spawn() {
      const free = holes.filter(h => h.state === 'down'); if (!free.length) return;
      const h = pick(free), prog = 1 - time / 60, r = Math.random();
      h.kind = r < 0.1 ? 'gold' : r < 0.1 + 0.08 + prog * 0.1 ? 'spike' : 'normal';
      h.state = 'rising'; h.stay = lerp(1.25, 0.55, prog) * (h.kind === 'gold' ? 0.7 : 1); h.timer = h.stay; h.hit = 0;
    }
    function whack(i, x, y) {
      const L = layout(), p = L[i], h = holes[i];
      hammer = { x: x === undefined ? p.x + p.r * 0.6 : x, y: y === undefined ? p.y - p.r * 0.8 : y, t: 0 };
      if (h.state !== 'down' && h.up > 0.35 && !h.hit) {
        h.hit = 1; h.state = 'falling';
        if (h.kind === 'spike') { score = Math.max(0, score - 30); combo = 0; E.sound('error'); E.shake(10); fx.text(p.x, p.y - p.r, '−30', '#ff6b6b', 30); fx.burst(p.x, p.y - p.r * .5, 16, { col: ['#a855f7', '#f0abfc'], spd: 260 }); }
        else {
          combo++; hits++; const pts = (h.kind === 'gold' ? 50 : 10) + Math.min(combo, 10) * 2; score += pts;
          E.sound(h.kind === 'gold' ? 'coin' : 'bonk'); E.shake(4);
          fx.text(p.x, p.y - p.r * 1.2, '+' + pts + (combo > 2 ? ' x' + combo : ''), h.kind === 'gold' ? '#ffe36e' : '#fff', 30);
          fx.burst(p.x, p.y - p.r * 0.5, 22, { col: h.kind === 'gold' ? ['#ffe36e', '#fff3b0', '#f59e0b'] : ['#fff', '#fde68a', '#a16207'], spd: 300, shape: 'star', size: 7 });
        }
      } else { misses++; combo = 0; E.sound('thud'); fx.burst(hammer.x, hammer.y + 20, 8, { col: ['#6b4f2a', '#8b6b3d'], spd: 140, grav: 400 }); }
    }
    function drawMole(c, x, y, r, h) {
      const k = h.kind;
      c.save(); c.translate(x, y);
      const body = k === 'gold' ? lgrad(c, 0, -r, 0, r, ['#fff3b0', '#f5b301']) : k === 'spike' ? lgrad(c, 0, -r, 0, r, ['#c084fc', '#6b21a8']) : lgrad(c, 0, -r, 0, r, ['#b07a4b', '#6b4423']);
      if (k === 'spike') { c.fillStyle = '#4c1d95'; for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8 - r * 0.1); c.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25 - r * 0.1); c.lineTo(Math.cos(a + 0.2) * r * 0.8, Math.sin(a + 0.2) * r * 0.8 - r * 0.1); c.fill(); } }
      c.beginPath(); c.ellipse(0, 0, r * 0.82, r, 0, 0, TAU); c.fillStyle = body; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(40,20,5,.6)'; c.stroke();
      ellipse(c, 0, r * 0.25, r * 0.5, r * 0.5, k === 'gold' ? '#fff8d6' : k === 'spike' ? '#e9d5ff' : '#e7c6a5');
      for (const s of [-1, 1]) {
        if (h.hit) { c.strokeStyle = '#1a1a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(s * r * 0.3 - 6, -r * 0.25 - 6); c.lineTo(s * r * 0.3 + 6, -r * 0.25 + 6); c.moveTo(s * r * 0.3 + 6, -r * 0.25 - 6); c.lineTo(s * r * 0.3 - 6, -r * 0.25 + 6); c.stroke(); }
        else { circle(c, s * r * 0.3, -r * 0.25, r * 0.15, '#fff'); circle(c, s * r * 0.3 + (k === 'spike' ? -s * 2 : 2), -r * 0.22, r * 0.08, '#111'); }
        if (k === 'spike') { c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.moveTo(s * r * 0.5, -r * 0.5); c.lineTo(s * r * 0.12, -r * 0.38); c.stroke(); }
      }
      ellipse(c, 0, r * 0.02, r * 0.16, r * 0.11, k === 'spike' ? '#701a75' : '#f472b6');
      c.fillStyle = '#fff'; c.fillRect(-r * 0.1, r * 0.18, r * 0.09, r * 0.14); c.fillRect(r * 0.01, r * 0.18, r * 0.09, r * 0.14);
      if (k === 'gold') { star(c, 0, -r * 0.95, r * 0.25, r * 0.1, 5); c.fillStyle = '#fff'; c.fill(); }
      if (k === 'normal') { c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(0, -r * 0.85, r * 0.5, r * 0.18, 0, Math.PI, 0); c.fill(); c.fillRect(-r * 0.32, -r * 1.1, r * 0.64, r * 0.25); }
      c.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        if (!started) { countdown -= dt; if (countdown <= 0) { started = true; E.sound('ding'); } else return; }
        time -= dt;
        if (time <= 0) { time = 0; const acc = hits + misses ? Math.round(hits / (hits + misses) * 100) : 0; E.gameOver({ score, win: score > 400, title: "Time's Up!", lines: ['Hits: ' + hits + '  •  Misses: ' + misses, 'Accuracy: ' + acc + '%'] }); return; }
        spawnT -= dt; if (spawnT <= 0) { spawn(); if (time < 40 && Math.random() < 0.4) spawn(); if (time < 20 && Math.random() < 0.4) spawn(); spawnT = lerp(0.8, 0.38, 1 - time / 60); }
        for (const h of holes) {
          if (h.state === 'rising') { h.up = Math.min(1, h.up + dt * 7); if (h.up >= 1) h.state = 'up'; }
          else if (h.state === 'up') { h.timer -= dt; if (h.timer <= 0) h.state = 'falling'; }
          else if (h.state === 'falling') { h.up = Math.max(0, h.up - dt * (h.hit ? 9 : 6)); if (h.up <= 0) { h.state = 'down'; if (!h.hit && h.kind !== 'spike') combo = 0; } }
        }
        if (hammer) { hammer.t += dt; if (hammer.t > 0.25) hammer = null; }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H * 0.3, ['#7dd3fc', '#e0f7ff']); ctx.fillRect(0, 0, W, H);
        // hills
        ctx.fillStyle = '#86c06c'; ctx.beginPath(); ctx.moveTo(0, H * 0.3); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * 0.22 + Math.sin(x * 0.006) * 24 + Math.sin(x * 0.017) * 10); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
        ctx.fillStyle = lgrad(ctx, 0, H * 0.25, 0, H, ['#5fae3e', '#3d8b2a']); ctx.fillRect(0, H * 0.27, W, H);
        // sun & clouds
        circle(ctx, W * 0.85, H * 0.08, 34, '#fff3a0');
        for (let i = 0; i < 4; i++) { const cx = ((t * 12 + i * 300) % (W + 200)) - 100, cy = H * (0.05 + 0.04 * (i % 2)); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, TAU); ctx.arc(cx + 22, cy - 8, 22, 0, TAU); ctx.arc(cx + 46, cy, 17, 0, TAU); ctx.fill(); }
        // grass tufts
        ctx.strokeStyle = 'rgba(30,90,20,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 70; i++) { const gx = (i * 97.3) % W, gy = H * 0.3 + ((i * 53.7) % (H * 0.7)); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 9); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 10); ctx.stroke(); }
        const L = layout();
        L.forEach((p, i) => {
          const h = holes[i];
          ellipse(ctx, p.x, p.y + 4, p.r * 1.12, p.r * 0.42, '#5b3a1c');
          ellipse(ctx, p.x, p.y, p.r, p.r * 0.36, '#1d0f05');
          // mole clipped to above hole rim
          if (h.up > 0) {
            ctx.save(); ctx.beginPath(); ctx.rect(p.x - p.r * 1.6, p.y - p.r * 3, p.r * 3.2, p.r * 3); ctx.ellipse(p.x, p.y, p.r, p.r * 0.36, 0, 0, Math.PI); ctx.clip();
            const ease = 1 - Math.pow(1 - h.up, 3); drawMole(ctx, p.x, p.y + p.r * 0.9 - ease * p.r * 1.55, p.r * 0.72, h); ctx.restore();
          }
          ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.04, p.r * 0.38, 0, 0, Math.PI); ctx.stroke();
          if (!E.touch) label(ctx, String(i + 1), p.x + p.r * 0.9, p.y + p.r * 0.35, 14, 'rgba(255,255,255,.7)');
        });
        if (hammer) {
          const a = hammer.t < 0.08 ? -0.9 + hammer.t / 0.08 * 1.4 : 0.5 - (hammer.t - 0.08) * 2;
          ctx.save(); ctx.translate(hammer.x + 30, hammer.y + 40); ctx.rotate(a);
          ctx.fillStyle = '#a16207'; rr(ctx, -6, -90, 12, 90, 5); ctx.fill();
          ctx.fillStyle = lgrad(ctx, -40, -120, 40, -80, ['#f87171', '#b91c1c']); rr(ctx, -42, -122, 84, 40, 12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(ctx, -36, -118, 72, 10, 5); ctx.fill();
          ctx.restore();
        }
        fx.draw(ctx);
        // top bar
        const s = Math.min(W, H) / 700;
        label(ctx, '⏱ ' + Math.ceil(time), W / 2, H * 0.1, 40 * s, time < 10 ? '#ff6b6b' : '#fff');
        if (combo > 2) label(ctx, 'COMBO x' + combo, W / 2, H * 0.17, 24 * s, '#ffe36e');
        if (!started) label(ctx, String(Math.ceil(countdown)), W / 2, H / 2, 140 * s, '#fff');
      },
      down(x, y) {
        if (!started) return;
        const L = layout(); let best = -1, bd = 1e9;
        L.forEach((p, i) => { const d = Math.hypot(x - p.x, (y - (p.y - p.r * 0.6)) * 0.8); if (d < p.r * 1.35 && d < bd) { bd = d; best = i; } });
        if (best >= 0) whack(best, x, y); else { hammer = { x, y, t: 0 }; }
      },
      onKey(c) { const m = /^(Digit|Numpad)([1-9])$/.exec(c); if (m && started) whack(+m[2] - 1); },
      hud() { return { stats: [['Score', fmt(score)], ['Accuracy', (hits + misses ? Math.round(hits / (hits + misses) * 100) : 100) + '%'], ['Best', fmt(E.best())]] }; }
    };
  }
});
