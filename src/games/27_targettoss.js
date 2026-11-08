/* =====================================================================
   TARGET TOSS  (soft discs on a velcro board)
   ===================================================================== */
registerGame({
  id: 'targettoss', title: 'Target Toss', emoji: '🥏', c1: '#11998e', c2: '#38ef7d', cats: ['Arcade', 'Sports'],
  desc: 'Toss soft velcro discs at a spinning, sliding target. Hit bonus sectors, dodge the spinning blockers and beat each level’s score goal.',
  controls: 'Aim with mouse / drag • click / release', scoreLabel: 'SCORE',
  hint: 'Aim with the mouse and click to toss (the disc takes a moment to fly – lead moving targets!). Beat the goal with 5 discs.', hintTouch: 'Drag to aim, release to toss. Lead moving targets!',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    let level = 1, discs = 5, lvlScore = 0, total = 0, goal = 120, board, blades, flying = [], stuck = [], aim = { x: E.W / 2, y: E.H * 0.42 }, aiming = false, t = 0, msg = '', msgT = 0, wait = 0;
    function setup() {
      discs = 5; lvlScore = 0; goal = 100 + level * 30; stuck = []; flying = [];
      board = { x: 0, y: 0, r: 120, rot: 0, spin: level > 1 ? (0.4 + level * 0.12) * (level % 2 ? 1 : -1) : 0.2, move: level >= 4 ? Math.min(160, 50 + level * 12) : 0, vmove: level >= 6 ? 40 : 0, bonus: [] };
      const nb = Math.min(3, 1 + Math.floor(level / 3)); for (let i = 0; i < nb; i++) board.bonus.push({ a: rand(0, TAU), m: i === 0 && level >= 5 ? 3 : 2 });
      blades = level >= 3 ? { n: level >= 7 ? 3 : 2, a: 0, sp: 1 + level * 0.1, r: 165 } : null;
      msg = 'LEVEL ' + level + ' – GOAL ' + goal; msgT = 2;
    }
    setup();
    const center = () => ({ x: E.W / 2 + board.x, y: E.H * 0.42 + board.y });
    function toss() {
      if (discs <= 0 || wait > 0) return;
      discs--; flying.push({ sx: E.W / 2, sy: E.H - 70, tx: aim.x, ty: aim.y, t: 0, dur: 0.55, spin: rand(-8, 8), hue: [200, 340, 50, 140, 280][discs % 5] });
      E.sound('whoosh');
    }
    function resolve(f) {
      const c = center(), dx = f.tx - c.x, dy = f.ty - c.y, d = Math.hypot(dx, dy);
      // blocker check (blades sweep in front of the board)
      if (blades) { for (let i = 0; i < blades.n; i++) { const a = blades.a + i * TAU / blades.n, ex = c.x + Math.cos(a) * blades.r, ey = c.y + Math.sin(a) * blades.r; const sd = segDist(f.tx, f.ty, c.x, c.y, ex, ey); if (sd.d < 16) { E.sound('bonk'); fx.burst(f.tx, f.ty, 12, { col: '#94a3b8', spd: 200 }); fx.text(f.tx, f.ty - 30, 'BLOCKED!', '#f87171', 24); return; } } }
      if (d > board.r) { E.sound('thud'); fx.text(f.tx, f.ty - 30, 'MISS', '#cbd5e1', 22); return; }
      const ringPts = d < board.r * 0.12 ? 100 : d < board.r * 0.3 ? 50 : d < board.r * 0.5 ? 30 : d < board.r * 0.75 ? 20 : 10;
      const la = Math.atan2(dy, dx) - board.rot; let mult = 1;
      for (const b of board.bonus) if (Math.abs(angDiff(la, b.a)) < 0.4 && d > board.r * 0.3) mult = Math.max(mult, b.m);
      const pts = ringPts * mult; lvlScore += pts; total += pts;
      stuck.push({ la, d, hue: f.hue, spin: f.spin });
      E.sound(ringPts === 100 ? 'cheer' : 'hit'); fx.burst(f.tx, f.ty, 14, { col: ['#fff', '#fde047'], spd: 160, shape: 'star' });
      fx.text(f.tx, f.ty - 34, (ringPts === 100 ? 'BULLSEYE! ' : '') + '+' + pts + (mult > 1 ? ' (x' + mult + ')' : ''), mult > 1 ? '#fde047' : '#fff', 26);
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        board.rot += board.spin * dt; if (board.move) board.x = Math.sin(t * 0.9) * board.move * Math.min(1, E.W / 700); if (board.vmove) board.y = Math.sin(t * 1.3) * board.vmove;
        if (blades) blades.a += blades.sp * dt;
        for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t += dt; if (f.t >= f.dur) { flying.splice(i, 1); resolve(f); } }
        if (wait > 0) { wait -= dt; if (wait <= 0) { if (lvlScore >= goal) { level++; E.coins(5); setup(); } else E.gameOver({ score: total, title: 'Goal Missed', lines: ['Reached level ' + level, 'Level score ' + lvlScore + ' / ' + goal] }); } return; }
        if (discs <= 0 && !flying.length) { wait = 1.2; if (lvlScore >= goal) { msg = 'LEVEL CLEAR!'; msgT = 1.4; E.sound('win'); } else { msg = 'NOT ENOUGH…'; msgT = 1.4; } }
      },
      draw() {
        const W = E.W, H = E.H, c = center(), s = Math.min(1.2, Math.min(W, H) / 560); board.r = 120 * s; if (blades) blades.r = 165 * s;
        // backyard scene
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, ['#7dd3fc', '#e0f2fe']); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#a16207'; for (let x = 0; x < W; x += 34) { ctx.fillRect(x, H * 0.18, 28, H * 0.5); ctx.beginPath(); ctx.moveTo(x, H * 0.18); ctx.lineTo(x + 14, H * 0.14); ctx.lineTo(x + 28, H * 0.18); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 34) ctx.fillRect(x + 22, H * 0.18, 6, H * 0.5);
        ctx.fillStyle = '#854d0e'; ctx.fillRect(0, H * 0.3, W, 10); ctx.fillRect(0, H * 0.55, W, 10);
        ctx.fillStyle = lgrad(ctx, 0, H * 0.66, 0, H, ['#65a30d', '#3f6212']); ctx.fillRect(0, H * 0.66, W, H);
        for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect((i * 97) % W, H * 0.7 + (i * 53) % (H * 0.3), 2, 6); }
        // board shadow + stand
        ctx.fillStyle = '#57534e'; ctx.fillRect(c.x - 8, c.y + board.r * 0.8, 16, H * 0.66 - c.y - board.r * 0.8 + 30);
        ellipse(ctx, c.x + 10, c.y + 12, board.r * 1.02, board.r * 1.02, 'rgba(0,0,0,.25)');
        // board
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(board.rot);
        const rings = [[1, '#ef4444'], [0.75, '#fff'], [0.5, '#3b82f6'], [0.3, '#fff'], [0.12, '#facc15']];
        for (const [k, col] of rings) circle(ctx, 0, 0, board.r * k, col);
        for (let i = 0; i < 8; i++) { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 8) * board.r, Math.sin(i * TAU / 8) * board.r); ctx.stroke(); }
        for (const b of board.bonus) { ctx.save(); ctx.rotate(b.a); ctx.fillStyle = b.m === 3 ? 'rgba(168,85,247,.55)' : 'rgba(34,197,94,.5)'; ctx.beginPath(); ctx.moveTo(board.r * 0.3, 0); ctx.arc(0, 0, board.r, -0.4, 0.4); ctx.arc(0, 0, board.r * 0.3, 0.4, -0.4, true); ctx.fill(); txt(ctx, 'x' + b.m, board.r * 0.66, 0, 16 * s, '#fff', 'center', 900); ctx.restore(); }
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, board.r, 0, TAU); ctx.stroke();
        for (const d of stuck) { const x = Math.cos(d.la) * d.d, y = Math.sin(d.la) * d.d; circle(ctx, x + 2, y + 3, 15 * s, 'rgba(0,0,0,.25)'); circle(ctx, x, y, 15 * s, hsl(d.hue, 80, 55)); circle(ctx, x, y, 8 * s, hsl(d.hue, 80, 70)); circle(ctx, x - 4, y - 4, 3, 'rgba(255,255,255,.7)'); }
        ctx.restore();
        if (blades) { for (let i = 0; i < blades.n; i++) { const a = blades.a + i * TAU / blades.n; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(a); ctx.fillStyle = lgrad(ctx, 0, -10, 0, 10, ['#cbd5e1', '#475569']); rr(ctx, 0, -9, blades.r, 18, 9); ctx.fill(); ctx.restore(); } circle(ctx, c.x, c.y, 16, '#334155'); }
        // flying discs (perspective scaling)
        for (const f of flying) { const k = f.t / f.dur, e = 1 - Math.pow(1 - k, 2), x = lerp(f.sx, f.tx, e), y = lerp(f.sy, f.ty, e) - Math.sin(k * Math.PI) * 60, r = lerp(34, 15, e) * s; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(k * f.spin))); circle(ctx, 0, 0, r, hsl(f.hue, 80, 55)); circle(ctx, 0, 0, r * 0.55, hsl(f.hue, 80, 70)); ctx.restore(); }
        // reticle
        const rx = aim.x, ry = aim.y; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(rx, ry, 14, 0, TAU); ctx.moveTo(rx - 22, ry); ctx.lineTo(rx - 8, ry); ctx.moveTo(rx + 8, ry); ctx.lineTo(rx + 22, ry); ctx.moveTo(rx, ry - 22); ctx.lineTo(rx, ry - 8); ctx.moveTo(rx, ry + 8); ctx.lineTo(rx, ry + 22); ctx.stroke();
        // discs left
        for (let i = 0; i < 5; i++) { const x = W / 2 - 80 + i * 40, y = H - 40; circle(ctx, x, y, 15, i < discs ? hsl([200, 340, 50, 140, 280][i], 80, 55) : 'rgba(0,0,0,.25)'); }
        fx.draw(ctx);
        label(ctx, 'LEVEL ' + level + '   ' + lvlScore + ' / ' + goal, W / 2, 40, 24, lvlScore >= goal ? '#86efac' : '#fff');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.78, 30, '#fde047');
      },
      down(x, y) { aim.x = x; aim.y = y; aiming = true; if (!E.touch) toss(); },
      move(x, y) { if (!E.touch || aiming) { aim.x = x; aim.y = y - (E.touch ? 60 : 0); } },
      up() { if (E.touch && aiming) toss(); aiming = false; },
      onKey(c) { if (c === 'Space') toss(); },
      resize() { aim.x = E.W / 2; aim.y = E.H * 0.42; },
      hud() { return { stats: [['Total', fmt(total)], ['Best', fmt(E.best())]] }; }
    };
  }
});
