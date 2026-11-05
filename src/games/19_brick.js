/* =====================================================================
   BRICK BREAKER
   ===================================================================== */
registerGame({
  id: 'brick', title: 'Brick Breaker', emoji: '🧨', c1: '#00c6ff', c2: '#0072ff', cats: ['Arcade'], pop: true,
  desc: 'Smash neon brick formations with your paddle and ball. Explosive bricks, steel bricks, multi-ball, lasers and more!',
  controls: 'Mouse / drag / ← →', scoreLabel: 'SCORE',
  hint: 'Move the paddle with the mouse or ←/→. Click or SPACE to launch. Catch power-ups!', hintTouch: 'Drag to move the paddle. Tap to launch. Catch power-ups!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 800, VH = 1000;
    let view, level = 1, lives = 3, score = 0, balls = [], bricks = [], pups = [], lasers = [], pad = { x: 400, w: 130, wide: 0, laser: 0, laserT: 0 }, slow = 0, t = 0, msg = '', msgT = 0, targetX = null;
    const COLS = 10, BW = 72, BHt = 30, OX = (VW - COLS * (BW + 4)) / 2 + 2;
    function makeLevel(n) {
      bricks = []; const r = rng(n * 7919), pat = (n - 1) % 6, rows = Math.min(5 + Math.floor(n / 2), 9);
      for (let y = 0; y < rows; y++) for (let x = 0; x < COLS; x++) {
        let on = true;
        if (pat === 1) on = (x + y) % 2 === 0; else if (pat === 2) on = Math.abs(x - 4.5) < y + 1; else if (pat === 3) on = x !== 4 && x !== 5 || y % 3 === 0; else if (pat === 4) on = y % 2 === 0 || x % 3 === 0; else if (pat === 5) on = r() < 0.8;
        if (!on) continue;
        const rv = r(); let type = 'n', hp = 1;
        if (rv < 0.06 + n * 0.01 && y < rows - 1) { type = 'm'; hp = 999; } else if (rv < 0.14) { type = 'x'; } else if (rv < 0.3 + n * 0.02) { type = 's'; hp = 2 + (n > 4 ? 1 : 0); }
        bricks.push({ x: OX + x * (BW + 4), y: 110 + y * (BHt + 4), w: BW, h: BHt, type, hp, max: hp, hue: (y * 34 + n * 50) % 360, hit: 0 });
      }
      resetBall();
    }
    function resetBall() { balls = [{ x: pad.x, y: VH - 92, vx: 0, vy: 0, r: 10, stuck: true }]; }
    function launch() { for (const b of balls) if (b.stuck) { b.stuck = false; const a = rand(-0.4, 0.4) - Math.PI / 2, s = speed(); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; E.sound('bounce'); } }
    const speed = () => (480 + level * 25) * (slow > 0 ? 0.65 : 1);
    makeLevel(level);
    function breakBrick(b) {
      if (bricks.indexOf(b) < 0) return;
      if (b.type === 'm') { b.hit = 1; E.sound('tick'); return; }
      b.hp--; b.hit = 1;
      if (b.hp > 0) { E.sound('hit'); score += 5; return; }
      bricks.splice(bricks.indexOf(b), 1); score += 20 * (b.max); E.sound('pop', 20);
      fx.burst(b.x + b.w / 2, b.y + b.h / 2, 14, { col: [hsl(b.hue, 90, 65), '#fff'], spd: 220, shape: 's', size: 7, grav: 400 });
      if (b.type === 'x') { E.sound('boom'); E.shake(8); fx.burst(b.x + b.w / 2, b.y + b.h / 2, 30, { col: ['#f97316', '#fde047', '#ef4444'], spd: 350, glow: true }); const near = bricks.filter(o => o.type !== 'm' && Math.abs(o.x - b.x) < 80 && Math.abs(o.y - b.y) < 40); near.forEach(o => { o.hp = 1; breakBrick(o); }); }
      if (Math.random() < 0.16) pups.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, k: pick(['wide', 'multi', 'laser', 'slow', 'life', 'multi', 'wide']) });
    }
    function collideBall(b) {
      for (const k of bricks) {
        const cx = clamp(b.x, k.x, k.x + k.w), cy = clamp(b.y, k.y, k.y + k.h), dx = b.x - cx, dy = b.y - cy;
        if (dx * dx + dy * dy < b.r * b.r) {
          const ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r)), oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r));
          if (ox < oy) { b.vx = b.x < k.x + k.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); } else { b.vy = b.y < k.y + k.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); }
          breakBrick(k); return;
        }
      }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; slow = Math.max(0, slow - dt); pad.wide = Math.max(0, pad.wide - dt); pad.laser = Math.max(0, pad.laser - dt);
        const pw = 130 * (pad.wide > 0 ? 1.6 : 1); pad.w += (pw - pad.w) * Math.min(1, dt * 8);
        const d = E.dir(); if (d.x) pad.x += d.x * 760 * dt; else if (targetX !== null) pad.x += (targetX - pad.x) * Math.min(1, dt * 18);
        pad.x = clamp(pad.x, pad.w / 2, VW - pad.w / 2);
        if (pad.laser > 0) { pad.laserT -= dt; if (pad.laserT <= 0) { pad.laserT = 0.3; lasers.push({ x: pad.x - pad.w / 2 + 10, y: VH - 70 }, { x: pad.x + pad.w / 2 - 10, y: VH - 70 }); E.sound('laser', 60); } }
        for (let i = lasers.length - 1; i >= 0; i--) { const l = lasers[i]; l.y -= 900 * dt; const k = bricks.find(b => l.x > b.x && l.x < b.x + b.w && l.y > b.y && l.y < b.y + b.h); if (k) { breakBrick(k); lasers.splice(i, 1); } else if (l.y < 0) lasers.splice(i, 1); }
        const steps = 3;
        for (const b of balls) {
          if (b.stuck) { b.x = pad.x; b.y = VH - 92; continue; }
          const s = speed(), m = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / m * s; b.vy = b.vy / m * s;
          for (let k = 0; k < steps; k++) {
            b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); E.sound('bounce', 30); } if (b.x > VW - b.r) { b.x = VW - b.r; b.vx = -Math.abs(b.vx); E.sound('bounce', 30); }
            if (b.y < b.r + 60) { b.y = b.r + 60; b.vy = Math.abs(b.vy); E.sound('bounce', 30); }
            const py = VH - 80;
            if (b.vy > 0 && b.y + b.r > py && b.y < py + 18 && Math.abs(b.x - pad.x) < pad.w / 2 + b.r) { const off = (b.x - pad.x) / (pad.w / 2), a = -Math.PI / 2 + off * 1.05; b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; b.y = py - b.r; E.sound('bounce'); fx.burst(b.x, py, 6, { col: '#7dd3fc', spd: 120 }); }
            collideBall(b);
          }
        }
        balls = balls.filter(b => b.y < VH + 30);
        if (!balls.length) { lives--; E.sound('die'); E.shake(10); if (lives <= 0) { E.gameOver({ score, title: 'Out of Balls!', lines: ['Reached level ' + level] }); return; } resetBall(); msg = 'Lives: ' + lives; msgT = 1.5; }
        for (let i = pups.length - 1; i >= 0; i--) {
          const p = pups[i]; p.y += 210 * dt;
          if (p.y > VH - 90 && p.y < VH - 60 && Math.abs(p.x - pad.x) < pad.w / 2 + 16) {
            pups.splice(i, 1); E.sound('power'); fx.text(p.x, p.y - 20, { wide: 'WIDE!', multi: 'MULTI-BALL!', laser: 'LASERS!', slow: 'SLOW-MO', life: '+1 LIFE' }[p.k], '#ffe36e');
            if (p.k === 'wide') pad.wide = 15; else if (p.k === 'laser') pad.laser = 10; else if (p.k === 'slow') slow = 10; else if (p.k === 'life') lives++;
            else { const src = balls.find(b => !b.stuck) || balls[0]; if (src) for (let k = 0; k < 2; k++) { const a = Math.atan2(src.vy || -1, src.vx || 0) + (k ? 0.5 : -0.5); balls.push({ x: src.x, y: src.y, vx: Math.cos(a), vy: Math.sin(a), r: 10, stuck: false }); } }
          } else if (p.y > VH) pups.splice(i, 1);
        }
        bricks.forEach(b => b.hit = Math.max(0, b.hit - dt * 5));
        if (!bricks.some(b => b.type !== 'm')) { level++; score += 500; E.sound('win'); msg = 'LEVEL ' + level; msgT = 2; pups = []; lasers = []; makeLevel(level); }
      },
      draw() {
        view = E.fit(VW, VH);
        ctx.fillStyle = '#030616'; ctx.fillRect(0, 0, E.W, E.H);
        view.apply(ctx);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, VH, ['#0b1340', '#050816']); ctx.fillRect(0, 0, VW, VH);
        ctx.strokeStyle = 'rgba(56,189,248,.08)'; ctx.lineWidth = 1; for (let x = 0; x <= VW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, VH); ctx.stroke(); } for (let y = 60; y <= VH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; shadowOn(ctx, '#38bdf8', 14); ctx.strokeRect(2, 60, VW - 4, VH); shadowOff(ctx);
        for (const b of bricks) {
          const c = b.type === 'm' ? ['#cbd5e1', '#64748b'] : b.type === 'x' ? ['#fb923c', '#dc2626'] : [hsl(b.hue, 90, 66 - (b.max - b.hp) * 8), hsl(b.hue, 80, 42)];
          shadowOn(ctx, b.type === 'm' ? 'rgba(0,0,0,0)' : c[0], 8 + b.hit * 14); rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.fillStyle = lgrad(ctx, 0, b.y, 0, b.y + b.h, c); ctx.fill(); shadowOff(ctx);
          ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(ctx, b.x + 4, b.y + 3, b.w - 8, 6, 3); ctx.fill();
          if (b.type === 's') for (let k = 0; k < b.hp; k++) circle(ctx, b.x + b.w / 2 - (b.hp - 1) * 6 + k * 12, b.y + b.h / 2 + 3, 3, 'rgba(255,255,255,.8)');
          if (b.type === 'x') label(ctx, '✸', b.x + b.w / 2, b.y + b.h / 2 + 2, 18, '#fff7ed');
          if (b.type === 'm') { ctx.strokeStyle = 'rgba(30,41,59,.6)'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12); }
        }
        for (const p of pups) { const col = { wide: '#22c55e', multi: '#3b82f6', laser: '#ef4444', slow: '#a855f7', life: '#f472b6' }[p.k]; shadowOn(ctx, col, 12); rr(ctx, p.x - 22, p.y - 12, 44, 24, 12); ctx.fillStyle = col; ctx.fill(); shadowOff(ctx); label(ctx, { wide: '↔', multi: '●●', laser: '⚡', slow: '⏳', life: '♥' }[p.k], p.x, p.y + 1, 15); }
        ctx.fillStyle = '#fca5a5'; for (const l of lasers) { shadowOn(ctx, '#ef4444', 10); ctx.fillRect(l.x - 2, l.y - 12, 4, 18); } shadowOff(ctx);
        const py = VH - 80; shadowOn(ctx, '#22d3ee', 18); rr(ctx, pad.x - pad.w / 2, py, pad.w, 18, 9); ctx.fillStyle = lgrad(ctx, 0, py, 0, py + 18, ['#a5f3fc', '#0891b2']); ctx.fill(); shadowOff(ctx);
        if (pad.laser > 0) { ctx.fillStyle = '#ef4444'; ctx.fillRect(pad.x - pad.w / 2 + 6, py - 8, 8, 10); ctx.fillRect(pad.x + pad.w / 2 - 14, py - 8, 8, 10); }
        for (const b of balls) { ctx.drawImage(E.glow(190), b.x - 26, b.y - 26, 52, 52); circle(ctx, b.x, b.y, b.r, '#fff'); }
        fx.draw(ctx);
        label(ctx, 'SCORE ' + fmt(score), 20, 32, 22, '#fff', 'left'); label(ctx, 'LEVEL ' + level, VW / 2, 32, 22, '#7dd3fc'); label(ctx, '♥'.repeat(Math.max(0, lives)), VW - 20, 32, 22, '#f472b6', 'right');
        if (balls.some(b => b.stuck)) label(ctx, E.touch ? 'TAP TO LAUNCH' : 'CLICK / SPACE TO LAUNCH', VW / 2, VH * 0.7, 26);
        if (msgT > 0) label(ctx, msg, VW / 2, VH * 0.55, 48, '#ffe36e');
        E.endWorld();
      },
      down(x, y) { if (!view) return; const p = view.toWorld(x, y); targetX = p.x; this.dragging = true; launch(); },
      move(x, y) { if (!view) return; const p = view.toWorld(x, y); if (!E.touch || E.ptrDown) targetX = p.x; },
      onKey(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') launch(); if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'KeyA' || c === 'KeyD') targetX = null; },
      hud() { return null; }
    };
  }
});
