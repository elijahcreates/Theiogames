/* =====================================================================
   AIM TRAINER
   ===================================================================== */
registerGame({
  id: 'aim', title: 'Aim Trainer', emoji: '🎯', c1: '#0f2027', c2: '#ef4444', cats: ['Arcade', 'Brain Games'],
  desc: 'Sharpen your aim with three training modes: Classic, Moving Targets and Precision. Tracks accuracy and reaction speed.',
  controls: 'Mouse / tap', scoreLabel: 'SCORE',
  hint: 'Click targets as fast as possible. Inner rings score more. Misses lower your accuracy.', hintTouch: 'Tap the targets fast – inner rings score more!',
  create(E) {
    const ctx = E.ctx, fx = Fx(); let mode = null, targets = [], score = 0, hits = 0, shots = 0, time = 30, reacts = [], t = 0, left = 0, cross = { x: E.W / 2, y: E.H / 2 }, ended = false, combo = 0;
    E.choose('Aim Trainer', 'Pick a training mode', [
      { label: '🎯 Classic', sub: '30 seconds – static targets appear and shrink', value: 'classic' },
      { label: '🏃 Moving Targets', sub: '30 seconds – targets drift and bounce', value: 'moving' },
      { label: '🔬 Precision', sub: 'Hit 25 small targets as fast as you can', value: 'precision' }
    ], m => { mode = m; if (m === 'precision') { left = 25; time = 0; } for (let i = 0; i < (m === 'classic' ? 3 : m === 'moving' ? 3 : 1); i++) spawn(); });
    function spawn() {
      const pad = 70, r = mode === 'precision' ? rand(14, 20) : rand(30, 44);
      const tg = { x: rand(pad, E.W - pad), y: rand(pad + 50, E.H - pad), r, maxR: r, born: t, vx: 0, vy: 0, life: mode === 'classic' ? 2.4 : 99 };
      if (mode === 'moving') { const a = rand(0, TAU), s = rand(90, 200); tg.vx = Math.cos(a) * s; tg.vy = Math.sin(a) * s; }
      targets.push(tg);
    }
    function shoot(x, y) {
      if (!mode || ended) return; shots++; cross.x = x; cross.y = y;
      for (let i = targets.length - 1; i >= 0; i--) {
        const g = targets[i], d = Math.hypot(x - g.x, y - g.y);
        if (d <= g.r) {
          const ring = d < g.r * 0.33 ? 3 : d < g.r * 0.66 ? 2 : 1, pts = ring * 10 + Math.min(combo, 10) * 2;
          score += pts; hits++; combo++; reacts.push(t - g.born); targets.splice(i, 1);
          E.sound(ring === 3 ? 'score' : 'hit'); fx.burst(g.x, g.y, 18, { col: ['#fff', '#fca5a5', '#ef4444'], spd: 260 }); fx.text(g.x, g.y - 20, (ring === 3 ? 'BULLSEYE +' : '+') + pts, ring === 3 ? '#ffe36e' : '#fff', 22);
          if (mode === 'precision') { left--; if (left <= 0) return finish(); }
          spawn(); return;
        }
      }
      combo = 0; E.sound('tick'); fx.burst(x, y, 5, { col: '#94a3b8', spd: 80, size: 2 });
    }
    function finish() {
      ended = true; const acc = shots ? Math.round(hits / shots * 100) : 0, avgR = reacts.length ? Math.round(reacts.reduce((a, b) => a + b, 0) / reacts.length * 1000) : 0;
      let final = mode === 'precision' ? Math.max(0, Math.round(3000 - time * 60 + acc * 10)) : Math.round(score * (0.5 + acc / 200));
      E.gameOver({ score: final, win: acc > 70, title: { classic: 'Classic', moving: 'Moving Targets', precision: 'Precision' }[mode] + ' complete!', lines: ['Accuracy: ' + acc + '%  (' + hits + '/' + shots + ')', 'Avg reaction: ' + avgR + ' ms', mode === 'precision' ? 'Time: ' + time.toFixed(2) + ' s' : 'Raw points: ' + score] });
    }
    return {
      update(dt) {
        if (!mode || ended) return; t += dt; fx.update(dt);
        if (mode === 'precision') time += dt; else { time -= dt; if (time <= 0) { time = 0; return finish(); } }
        for (let i = targets.length - 1; i >= 0; i--) {
          const g = targets[i];
          if (mode === 'classic') { const age = (t - g.born) / g.life; g.r = g.maxR * (age < 0.15 ? age / 0.15 : 1 - Math.max(0, age - 0.5) * 1.6); if (age >= 1 || g.r < 3) { targets.splice(i, 1); combo = 0; spawn(); } }
          else if (mode === 'moving') { g.x += g.vx * dt; g.y += g.vy * dt; if (g.x < g.r || g.x > E.W - g.r) g.vx *= -1; if (g.y < g.r + 50 || g.y > E.H - g.r) g.vy *= -1; g.x = clamp(g.x, g.r, E.W - g.r); g.y = clamp(g.y, g.r + 50, E.H - g.r); }
        }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = rgrad(ctx, W / 2, H / 2, 50, Math.max(W, H) * 0.7, ['#1f2937', '#0b1120']); ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(56,189,248,.08)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        for (const g of targets) {
          const r = Math.max(1, g.r);
          shadowOn(ctx, 'rgba(239,68,68,.6)', 18); circle(ctx, g.x, g.y, r, '#fff'); shadowOff(ctx);
          circle(ctx, g.x, g.y, r * 0.83, '#ef4444'); circle(ctx, g.x, g.y, r * 0.66, '#fff'); circle(ctx, g.x, g.y, r * 0.5, '#ef4444'); circle(ctx, g.x, g.y, r * 0.33, '#fff'); circle(ctx, g.x, g.y, r * 0.16, '#ef4444');
        }
        fx.draw(ctx);
        if (!E.touch && E.px !== undefined) { const x = E.px, y = E.py; ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.moveTo(x - 20, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 20, y); ctx.moveTo(x, y - 20); ctx.lineTo(x, y - 6); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 20); ctx.stroke(); }
        if (mode) label(ctx, mode === 'precision' ? time.toFixed(2) + 's' : Math.ceil(time) + 's', W / 2, 40, 32, mode !== 'precision' && time < 6 ? '#f87171' : '#fff');
      },
      down(x, y) { shoot(x, y); },
      move(x, y) { cross.x = x; cross.y = y; },
      hud() { return { stats: [['Score', fmt(score)], ['Accuracy', (shots ? Math.round(hits / shots * 100) : 100) + '%']].concat(mode === 'precision' ? [['Left', left]] : [['Combo', combo]]) }; }
    };
  }
});
