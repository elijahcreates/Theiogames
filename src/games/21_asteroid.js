/* =====================================================================
   ASTEROID FIELD
   ===================================================================== */
registerGame({
  id: 'asteroid', title: 'Asteroid Field', emoji: '☄️', c1: '#141e30', c2: '#243b55', cats: ['Arcade', 'Endless'],
  desc: 'Thread your scout ship through ever-denser asteroid storms. Collect energy crystals, shields and time-warps to survive each wave.',
  controls: 'Mouse / drag / WASD', scoreLabel: 'SCORE',
  hint: 'Fly with WASD / arrows or point with the mouse. Avoid rocks, collect 💎 crystals and power-ups!', hintTouch: 'Drag to fly. Avoid rocks, collect crystals and power-ups!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 1000, VH = 620;
    const S = { x: 180, y: VH / 2, vx: 0, vy: 0, tx: null, ty: null, shield: 0, hp: 3, inv: 0 };
    let view, rocks = [], items = [], stars = [], t = 0, wave = 1, waveT = 25, score = 0, crystals = 0, spawnT = 0, warp = 0, banner = 'WAVE 1', bannerT = 2, drag = null, nebula = rand(0, 360);
    for (let i = 0; i < 160; i++) stars.push({ x: rand(0, VW), y: rand(0, VH), z: rand(0.15, 1) });
    function mkRock() {
      const r = rand(16, 34 + wave * 4), n = irand(8, 12), pts = []; for (let i = 0; i < n; i++) pts.push(rand(0.72, 1.08));
      const sp = rand(160, 230) + wave * 28;
      rocks.push({ x: VW + r + 10, y: rand(r, VH - r), vx: -sp, vy: rand(-40, 40) * (wave > 2 ? 1 : 0.3), r, pts, rot: 0, vr: rand(-2, 2), hue: rand(15, 40), craters: [[rand(-0.4, 0.4), rand(-0.4, 0.4), rand(0.12, 0.25)], [rand(-0.4, 0.4), rand(-0.4, 0.4), rand(0.08, 0.18)]] });
    }
    function hurt() {
      if (S.inv > 0) return; if (S.shield > 0) { S.shield = 0; S.inv = 1; E.sound('pop'); fx.burst(S.x, S.y, 20, { col: '#22d3ee', spd: 240 }); return; }
      S.hp--; S.inv = 1.6; E.sound('crash'); E.shake(12); fx.burst(S.x, S.y, 30, { col: ['#fb923c', '#fde047', '#fff'], spd: 280 });
      if (S.hp <= 0) { fx.burst(S.x, S.y, 80, { col: ['#fb923c', '#fde047', '#fff'], spd: 420, size: 6 }); E.gameOver({ score, title: 'Hull Breached!', lines: ['Wave ' + wave + ' • ' + crystals + ' crystals'], delay: 1100 }); }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); bannerT -= dt; S.inv = Math.max(0, S.inv - dt); S.shield = Math.max(0, S.shield - dt);
        const tw = warp > 0 ? 0.45 : 1; warp = Math.max(0, warp - dt);
        for (const s of stars) { s.x -= (40 + s.z * 420) * dt * tw * (1 + wave * 0.1); if (s.x < 0) { s.x = VW; s.y = rand(0, VH); } }
        if (S.hp <= 0) return;
        score += dt * 10 * wave;
        waveT -= dt; if (waveT <= 0) { wave++; waveT = 25; banner = 'WAVE ' + wave; bannerT = 2; E.sound('power'); score += 500; }
        const d = E.dir();
        if (d.mag) { S.vx += d.x * 2200 * dt; S.vy += d.y * 2200 * dt; S.tx = null; }
        else if (S.tx !== null) { S.vx += (S.tx - S.x) * 18 * dt; S.vy += (S.ty - S.y) * 18 * dt; }
        S.vx *= Math.pow(0.02, dt); S.vy *= Math.pow(0.02, dt);
        S.x = clamp(S.x + S.vx * dt, 30, VW - 30); S.y = clamp(S.y + S.vy * dt, 24, VH - 24);
        if (Math.random() < 0.8) fx.burst(S.x - 26, S.y + rand(-3, 3), 1, { col: ['#38bdf8', '#a5f3fc'], spd: 60, ang: Math.PI, spread: 0.3, life: 0.35, size: 4 });
        spawnT -= dt * tw; if (spawnT <= 0) { mkRock(); spawnT = Math.max(0.12, 0.75 - wave * 0.08) * rand(0.6, 1.3); if (Math.random() < 0.18) items.push({ x: VW + 20, y: rand(40, VH - 40), k: Math.random() < 0.8 ? 'c' : pick(['s', 'w', 'h']), t: 0 }); }
        for (let i = rocks.length - 1; i >= 0; i--) {
          const r = rocks[i]; r.x += r.vx * dt * tw; r.y += r.vy * dt * tw; r.rot += r.vr * dt; if (r.y < r.r || r.y > VH - r.r) r.vy *= -1;
          if (r.x < -r.r - 20) { rocks.splice(i, 1); continue; }
          if (dist(r.x, r.y, S.x, S.y) < r.r * 0.85 + (S.shield > 0 ? 30 : 14)) { if (S.shield > 0 || S.inv <= 0) { rocks.splice(i, 1); fx.burst(r.x, r.y, 20, { col: ['#a8a29e', '#78716c', '#fb923c'], spd: 200, shape: 's' }); } hurt(); }
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i]; it.t += dt; it.x -= 200 * dt * tw;
          if (it.x < -20) { items.splice(i, 1); continue; }
          if (dist(it.x, it.y, S.x, S.y) < 34) {
            items.splice(i, 1);
            if (it.k === 'c') { crystals++; score += 100; E.sound('coin'); fx.text(it.x, it.y - 20, '+100', '#a5f3fc'); }
            else { E.sound('power'); if (it.k === 's') { S.shield = 8; fx.text(S.x, S.y - 40, 'SHIELD', '#22d3ee'); } else if (it.k === 'w') { warp = 5; fx.text(S.x, S.y - 40, 'TIME WARP', '#c084fc'); } else { S.hp = Math.min(5, S.hp + 1); fx.text(S.x, S.y - 40, '+1 HULL', '#f472b6'); } }
            fx.burst(it.x, it.y, 14, { col: ['#a5f3fc', '#fff'], spd: 180, shape: 'star' });
          }
        }
      },
      draw() {
        view = E.fit(VW, VH);
        ctx.fillStyle = '#020210'; ctx.fillRect(0, 0, E.W, E.H);
        view.apply(ctx);
        ctx.fillStyle = lgrad(ctx, 0, 0, VW, VH, ['#05051a', '#140a2e', '#03111f']); ctx.fillRect(0, 0, VW, VH);
        ctx.globalAlpha = 0.35; ctx.drawImage(E.glow(nebula + wave * 40), 500, -100, 600, 600); ctx.drawImage(E.glow(nebula + 140), -150, 250, 500, 500); ctx.globalAlpha = 1;
        for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${s.z * 0.9})`; ctx.fillRect(s.x, s.y, 1.5 + s.z * 6 * (warp > 0 ? 0.4 : 1), 1.5 * s.z + 0.5); }
        // planet
        const px = VW - 120 - (t * 4) % 2000; circle(ctx, px, 520, 90, lgrad(ctx, px - 90, 430, px + 90, 610, ['#f59e0b', '#7c2d12'])); ctx.strokeStyle = 'rgba(253,230,138,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(px, 520, 150, 26, -0.25, 0, TAU); ctx.stroke();
        for (const it of items) {
          const b = Math.sin(it.t * 5) * 4;
          if (it.k === 'c') { ctx.save(); ctx.translate(it.x, it.y + b); ctx.drawImage(E.glow(185), -24, -24, 48, 48); ctx.fillStyle = lgrad(ctx, 0, -14, 0, 14, ['#ecfeff', '#06b6d4']); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, -2); ctx.lineTo(0, 14); ctx.lineTo(-10, -2); ctx.closePath(); ctx.fill(); ctx.restore(); }
          else { const col = { s: '#06b6d4', w: '#a855f7', h: '#ec4899' }[it.k]; shadowOn(ctx, col, 16); circle(ctx, it.x, it.y + b, 16, col); shadowOff(ctx); label(ctx, { s: '🛡', w: '⏳', h: '♥' }[it.k], it.x, it.y + b, 15); }
        }
        for (const r of rocks) {
          ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
          ctx.beginPath(); r.pts.forEach((p, i) => { const a = i / r.pts.length * TAU; ctx.lineTo(Math.cos(a) * r.r * p, Math.sin(a) * r.r * p); }); ctx.closePath();
          ctx.fillStyle = rgrad(ctx, -r.r * 0.3, -r.r * 0.3, 2, r.r * 1.2, [hsl(r.hue, 20, 62), hsl(r.hue, 25, 32), hsl(r.hue, 30, 16)]); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.stroke();
          for (const [cx, cy, cr] of r.craters) { circle(ctx, cx * r.r, cy * r.r, cr * r.r, 'rgba(0,0,0,.25)'); }
          ctx.restore();
        }
        if (S.hp > 0 && !(S.inv > 0 && Math.floor(t * 16) % 2)) {
          ctx.save(); ctx.translate(S.x, S.y); ctx.rotate(clamp(S.vy / 900, -0.4, 0.4));
          ctx.fillStyle = lgrad(ctx, 0, -16, 0, 16, ['#e2e8f0', '#64748b']); ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-10, -16); ctx.lineTo(-24, -20); ctx.lineTo(-18, 0); ctx.lineTo(-24, 20); ctx.lineTo(-10, 16); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = lgrad(ctx, 0, -6, 0, 6, ['#a5f3fc', '#0369a1']); ctx.beginPath(); ctx.ellipse(6, 0, 10, 5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#ef4444'; ctx.fillRect(-14, -14, 8, 3); ctx.fillRect(-14, 11, 8, 3);
          ctx.restore();
          if (S.shield > 0) { ctx.strokeStyle = `rgba(34,211,238,${0.5 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(S.x, S.y, 34, 0, TAU); ctx.stroke(); }
        }
        fx.draw(ctx);
        if (warp > 0) { ctx.fillStyle = 'rgba(168,85,247,.08)'; ctx.fillRect(0, 0, VW, VH); }
        label(ctx, fmt(score), VW / 2, 30, 26); label(ctx, '♥'.repeat(Math.max(0, S.hp)), 20, 30, 22, '#f472b6', 'left'); label(ctx, '💎 ' + crystals, VW - 20, 30, 20, '#a5f3fc', 'right');
        ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(VW / 2 - 100, 52, 200, 5); ctx.fillStyle = '#a78bfa'; ctx.fillRect(VW / 2 - 100, 52, 200 * (1 - waveT / 25), 5);
        if (bannerT > 0) label(ctx, banner, VW / 2, VH * 0.4, 46, '#fde047');
        E.endWorld();
      },
      down(x, y) { if (!view) return; const p = view.toWorld(x, y); drag = { x: p.x, y: p.y, sx: S.x, sy: S.y }; },
      move(x, y) { if (!view) return; const p = view.toWorld(x, y); if (drag && E.ptrDown) { S.tx = drag.sx + (p.x - drag.x) * 1.3; S.ty = drag.sy + (p.y - drag.y) * 1.3; } else if (!E.touch) { S.tx = p.x; S.ty = p.y; } },
      up() { drag = null; },
      hud() { return { stats: [['Wave', wave], ['Best', fmt(E.best())]] }; }
    };
  }
});
