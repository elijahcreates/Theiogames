/* =====================================================================
   REFLEX CHALLENGE (dodge everything)
   ===================================================================== */
registerGame({
  id: 'reflex', title: 'Reflex Challenge', emoji: '💥', c1: '#200122', c2: '#6f0000', cats: ['Arcade', 'Endless'],
  desc: 'Dodge incoming meteors, lasers and bouncing orbs for as long as you can. The arena gets wilder every second.',
  controls: 'Drag / mouse / WASD', scoreLabel: 'SECONDS SURVIVED', fmtScore: v => v + 's',
  hint: 'Move with WASD / arrows or hold the mouse button and drag. Survive!', hintTouch: 'Drag anywhere to move (relative). Survive as long as you can!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), P = { x: E.W / 2, y: E.H / 2, r: 12, trail: [] }, obs = [];
    let t = 0, spawnT = 1, dead = false, drag = null, shield = 0, pickups = [], pickT = 8, stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: Math.random(), y: Math.random(), s: rand(0.5, 2) });
    function spawn() {
      const lvl = t / 15, r = Math.random(), W = E.W, H = E.H;
      if (r < 0.5) { // meteor from edge aimed near player
        const side = irand(0, 3), x = side === 0 ? -20 : side === 1 ? W + 20 : rand(0, W), y = side === 2 ? -20 : side === 3 ? H + 20 : rand(0, H);
        const a = Math.atan2(P.y - y + rand(-80, 80), P.x - x + rand(-80, 80)), s = rand(180, 260) + lvl * 40;
        obs.push({ k: 'met', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(10, 18), rot: 0 });
      } else if (r < 0.72 && t > 6) { // laser warning
        const horiz = Math.random() < 0.5; obs.push({ k: 'laser', horiz, p: horiz ? clamp(P.y + rand(-60, 60), 40, H - 40) : clamp(P.x + rand(-60, 60), 40, W - 40), warn: 1.0, fire: 0.45, w: 18 });
      } else if (r < 0.88 && t > 12) { const a = rand(0, TAU), s = 160 + lvl * 20; obs.push({ k: 'orb', x: rand(40, W - 40), y: -20, vx: Math.cos(a) * s, vy: Math.abs(Math.sin(a) * s) + 60, r: 14, life: 9 }); }
      else if (t > 18) { // ring burst
        const cx = rand(80, W - 80), cy = rand(80, H - 80); obs.push({ k: 'burst', x: cx, y: cy, warn: 0.9 });
      } else spawn();
    }
    function hitPlayer() {
      if (shield > 0) { shield = 0; E.sound('pop'); fx.burst(P.x, P.y, 30, { col: ['#22d3ee', '#fff'], spd: 300 }); return; }
      dead = true; E.sound('boom'); E.shake(14); fx.burst(P.x, P.y, 60, { col: ['#f97316', '#fde047', '#fff', '#ef4444'], spd: 420, size: 6 });
      E.gameOver({ score: Math.floor(t), scoreText: t.toFixed(1) + 's', title: 'Hit!', lines: ['You survived ' + t.toFixed(1) + ' seconds'] });
    }
    return {
      update(dt) {
        fx.update(dt); if (dead) return; t += dt;
        const d = E.dir(1), d2 = E.dir(2), sp = 330;
        const kx = d.x || d2.x, ky = d.y || d2.y; P.x += kx * sp * dt; P.y += ky * sp * dt;
        P.x = clamp(P.x, P.r, E.W - P.r); P.y = clamp(P.y, P.r + 40, E.H - P.r);
        P.trail.push({ x: P.x, y: P.y }); if (P.trail.length > 14) P.trail.shift();
        shield = Math.max(0, shield - dt);
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.18, 0.9 - t * 0.012); }
        pickT -= dt; if (pickT <= 0) { pickT = rand(8, 13); pickups.push({ x: rand(60, E.W - 60), y: rand(90, E.H - 60), t: 0 }); }
        for (let i = pickups.length - 1; i >= 0; i--) { const p = pickups[i]; p.t += dt; if (p.t > 7) pickups.splice(i, 1); else if (dist(p.x, p.y, P.x, P.y) < 26) { shield = 6; E.sound('power'); pickups.splice(i, 1); fx.text(P.x, P.y - 30, 'SHIELD!', '#22d3ee'); } }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i];
          if (o.k === 'met' || o.k === 'orb') {
            o.x += o.vx * dt; o.y += o.vy * dt; o.rot = (o.rot || 0) + dt * 3;
            if (o.k === 'orb') { o.life -= dt; if (o.x < o.r || o.x > E.W - o.r) o.vx *= -1; if (o.y > E.H - o.r) o.vy = -Math.abs(o.vy); if (o.y < o.r + 40 && o.vy < 0) o.vy *= -1; if (o.life <= 0) { obs.splice(i, 1); continue; } }
            else if (o.x < -60 || o.x > E.W + 60 || o.y < -60 || o.y > E.H + 60) { obs.splice(i, 1); continue; }
            if (dist(o.x, o.y, P.x, P.y) < o.r + P.r - 3) { obs.splice(i, 1); hitPlayer(); if (dead) return; }
          } else if (o.k === 'laser') {
            if (o.warn > 0) { o.warn -= dt; if (o.warn <= 0) E.sound('laser'); }
            else { o.fire -= dt; const dd = o.horiz ? Math.abs(P.y - o.p) : Math.abs(P.x - o.p); if (dd < o.w / 2 + P.r - 4) { obs.splice(i, 1); hitPlayer(); if (dead) return; continue; } if (o.fire <= 0) obs.splice(i, 1); }
          } else if (o.k === 'burst') {
            o.warn -= dt; if (o.warn <= 0) { obs.splice(i, 1); E.sound('pop'); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; obs.push({ k: 'met', x: o.x, y: o.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 9 }); } }
          }
        }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = rgrad(ctx, W / 2, H / 2, 10, Math.max(W, H) * 0.75, ['#2a0a3a', '#08020f']); ctx.fillRect(0, 0, W, H);
        for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + s.x * 40)})`; ctx.fillRect(s.x * W, s.y * H, s.s, s.s); }
        for (const p of pickups) { const a = p.t > 5 ? 0.5 + 0.5 * Math.sin(p.t * 20) : 1; ctx.globalAlpha = a; ctx.drawImage(E.glow(190), p.x - 30, p.y - 30, 60, 60); label(ctx, '🛡', p.x, p.y, 22); ctx.globalAlpha = 1; }
        for (const o of obs) {
          if (o.k === 'met') { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.drawImage(E.glow(20), -o.r * 2, -o.r * 2, o.r * 4, o.r * 4); ctx.fillStyle = lgrad(ctx, -o.r, -o.r, o.r, o.r, ['#fdba74', '#c2410c']); ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr2 = o.r * (k % 2 ? 0.8 : 1); ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.fill(); ctx.restore(); }
          else if (o.k === 'orb') { ctx.drawImage(E.glow(280), o.x - 34, o.y - 34, 68, 68); circle(ctx, o.x, o.y, o.r, '#e9d5ff'); circle(ctx, o.x, o.y, o.r * 0.6, '#a855f7'); }
          else if (o.k === 'laser') {
            if (o.warn > 0) { ctx.strokeStyle = `rgba(255,60,60,${0.3 + 0.3 * Math.sin(t * 30)})`; ctx.setLineDash([12, 10]); ctx.lineWidth = 2; ctx.beginPath(); if (o.horiz) { ctx.moveTo(0, o.p); ctx.lineTo(W, o.p); } else { ctx.moveTo(o.p, 0); ctx.lineTo(o.p, H); } ctx.stroke(); ctx.setLineDash([]); }
            else { shadowOn(ctx, '#ff2d55', 24); ctx.fillStyle = '#ff2d55'; if (o.horiz) ctx.fillRect(0, o.p - o.w / 2, W, o.w); else ctx.fillRect(o.p - o.w / 2, 0, o.w, H); ctx.fillStyle = '#fff'; if (o.horiz) ctx.fillRect(0, o.p - 3, W, 6); else ctx.fillRect(o.p - 3, 0, 6, H); shadowOff(ctx); }
          } else if (o.k === 'burst') { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, 30 * (1 - o.warn) + 6, 0, TAU); ctx.stroke(); }
        }
        if (!dead) {
          P.trail.forEach((p, i) => { ctx.globalAlpha = i / P.trail.length * 0.4; circle(ctx, p.x, p.y, P.r * i / P.trail.length, '#22d3ee'); }); ctx.globalAlpha = 1;
          ctx.drawImage(E.glow(185), P.x - 34, P.y - 34, 68, 68); circle(ctx, P.x, P.y, P.r, '#ecfeff'); circle(ctx, P.x, P.y, P.r * 0.55, '#06b6d4');
          if (shield > 0) { ctx.strokeStyle = `rgba(34,211,238,${shield < 1.5 ? 0.5 + 0.5 * Math.sin(t * 20) : 0.9})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P.x, P.y, P.r + 10, 0, TAU); ctx.stroke(); }
        }
        fx.draw(ctx);
        label(ctx, t.toFixed(1) + 's', W / 2, 36, 30);
      },
      down(x, y) { drag = { x, y, px: P.x, py: P.y }; },
      move(x, y) { if (drag && E.ptrDown) { P.x = clamp(drag.px + (x - drag.x) * 1.3, P.r, E.W - P.r); P.y = clamp(drag.py + (y - drag.y) * 1.3, P.r + 40, E.H - P.r); } },
      up() { drag = null; },
      hud() { return { stats: [['Best', E.best() + 's']] }; }
    };
  }
});
