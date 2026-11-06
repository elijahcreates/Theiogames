/* =====================================================================
   SLOPE RUNNER  (pseudo-3D)
   ===================================================================== */
registerGame({
  id: 'slope', title: 'Slope Runner', emoji: '🟢', c1: '#000000', c2: '#00ff87', cats: ['Arcade', 'Endless'], featured: true, hot: true,
  desc: 'Roll a glowing ball down an endless neon slope that twists and bends at ever-rising speed. Fight the drift on curves, dodge red blocks, leap gaps with ramps and grab gems.',
  controls: 'A/D • ←/→ • drag / tilt-tap', scoreLabel: 'DISTANCE',
  hint: 'Steer with A/D or ←/→ (or move the mouse). Curves push you outward! Avoid red blocks, don’t fall off, grab 💎 gems. Green ramps launch you.', hintTouch: 'Hold the left / right side of the screen to steer. Avoid red blocks and gaps!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ROW = 4, LANES = 5, LW = 2, HALF = LANES * LW / 2;
    const B = { x: 0, y: 0, vy: 0, z: 0, vx: 0, roll: 0, dead: false, fall: 0 };
    let speed = 22, t = 0, gems = 0, trail = [], flash = 0, rows = {}, steer = 0, mouseX = null, hue = 140, score = 0, touchDir = 0;
    function row(i) {
      if (rows[i]) return rows[i];
      const r = rng(i * 9301 + 49297), d = Math.min(1, i / 400), rw = { tiles: Array(LANES).fill(true), blocks: [], ramp: -1, mover: null, tunnel: Math.floor(i / 30) % 3 === 1, y: 0 };
      if (i > 8) {
        const k = r();
        if (k < 0.18 + d * 0.15) { const n = 1 + Math.floor(r() * (1 + d * 2.5)); for (let j = 0; j < n; j++) rw.blocks.push(Math.floor(r() * LANES)); }
        else if (k < 0.28 + d * 0.12 && i % 3 === 0) { const c = Math.floor(r() * LANES); rw.tiles[c] = false; if (r() < 0.5 + d * 0.3) rw.tiles[(c + 1) % LANES] = false; }
        else if (k < 0.33 && i % 6 === 0) { rw.ramp = Math.floor(r() * LANES); for (let j = 1; j <= 3; j++) { rows[i + j] = { tiles: Array(LANES).fill(false), blocks: [], ramp: -1, mover: null, tunnel: false, y: 0 }; } }
        else if (k < 0.38 + d * 0.1) rw.mover = { ph: r() * TAU, sp: 1 + r() * 1.5 };
      }
      if (i > 12 && r() < 0.22) { const g = Math.floor(r() * LANES); if (rw.tiles[g] && !rw.blocks.includes(g) && rw.ramp < 0 && !rw.mover) rw.gem = g; }
      // never block all lanes
      if (rw.blocks.length >= LANES) rw.blocks.length = LANES - 1;
      rows[i] = rw; return rw;
    }
    function die(fall) {
      if (B.dead) return; B.dead = true; B.fall = fall ? 1 : 0; E.sound(fall ? 'whoosh' : 'crash'); if (!fall) { E.shake(12); fx.burst(E.W / 2, E.H * 0.7, 50, { col: [hsl(hue, 100, 60), '#fff'], spd: 400, size: 5 }); }
      E.gameOver({ score: Math.floor(score), title: fall ? 'Fell Off!' : 'Crashed!', lines: ['Distance: ' + Math.floor(score) + ' m', 'Gems: ' + gems + ' (+' + gems * 25 + ')', 'Top speed: ' + Math.floor(speed * 3.6) + ' km/h'], delay: 1100 });
    }
    // projection
    let camX = 0;
    const cv = z => { const a = clamp((z - 120) / 600, 0, 1); return a * (7 * Math.sin(z * 0.011) + 3.5 * Math.sin(z * 0.027 + 1.3)); };
    const camH = 3.2, camBack = 7.5;
    function P(x, y, z) {
      const dz = z - (B.z - camBack); if (dz < 0.2) return null;
      const f = E.H * 0.9, hz = E.H * 0.36;
      return [E.W / 2 + (x + cv(z) - camX) * f / dz, hz + (camH - y + B.y * 0.6) * f / dz, f / dz];
    }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        if (B.dead) { if (B.fall) { B.y -= 18 * dt * (1 + B.fall); B.fall += dt * 3; B.z += speed * dt * 0.5; } return; }
        speed = Math.min(78, 22 + t * 0.6); score = B.z + gems * 25; flash = Math.max(0, flash - dt * 3);
        let dir = (E.key('KeyD') || E.key('ArrowRight') ? 1 : 0) - (E.key('KeyA') || E.key('ArrowLeft') ? 1 : 0);
        if (!dir && touchDir) dir = touchDir;
        if (!dir && mouseX !== null && !E.touch) dir = clamp((mouseX - E.W / 2) / (E.W * 0.15), -1, 1);
        B.vx += (dir * 15 - B.vx) * Math.min(1, dt * 8);
        const bend = cv(B.z + 0.5) - cv(B.z - 0.5); B.x -= bend * speed * dt * 0.4;
        B.x += B.vx * dt; B.z += speed * dt; B.roll += speed * dt * 1.4;
        camX += (cv(B.z) + B.x * 0.85 - camX) * Math.min(1, dt * 8);
        trail.push({ x: B.x, y: B.y, z: B.z }); if (trail.length > 14) trail.shift();
        const i = Math.floor(B.z / ROW), rw = row(i), lane = Math.floor((B.x + HALF) / LW);
        // vertical
        if (B.y > 0 || B.vy > 0) { B.vy -= 30 * dt; B.y += B.vy * dt; if (B.y <= 0) { B.y = 0; B.vy = 0; fx.burst(E.W / 2, E.H * 0.75, 8, { col: hsl(hue, 100, 70), spd: 120 }); E.sound('land', 60); } }
        if (B.y <= 0.01) {
          if (B.x < -HALF - 0.3 || B.x > HALF + 0.3 || !rw.tiles[clamp(lane, 0, LANES - 1)]) return die(true);
          if (rw.ramp === lane) { B.vy = 13; B.y = 0.05; E.sound('jump'); }
        }
        if (B.y < 0.9) {
          const zf = B.z - i * ROW;
          if (zf > 1 && zf < 3) {
            for (const b of rw.blocks) if (Math.abs(B.x - (-HALF + (b + 0.5) * LW)) < LW / 2 + 0.3) return die(false);
            if (rw.gem !== undefined && !rw.got && lane === rw.gem) { rw.got = true; gems++; flash = 1; E.sound('coin'); fx.text(E.W / 2, E.H * 0.55, '+25 💎', '#67e8f9', 24); }
            if (rw.mover) { const mx = Math.sin(t * rw.mover.sp + rw.mover.ph) * (HALF - 1); if (Math.abs(B.x - mx) < 1.3) return die(false); }
          }
        }
        hue = (140 + Math.floor(B.z / 400) * 70) % 360;
        // cleanup
        for (const k in rows) if (+k < i - 5) delete rows[k];
      },
      draw() {
        const W = E.W, H = E.H, hz = H * 0.36;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, ['#020617', hsl(hue + 180, 70, 12), '#000']); ctx.fillRect(0, 0, W, H);
        // sun & grid horizon
        ctx.drawImage(E.glow(hue + 160), W / 2 - 200, hz - 200, 400, 400);
        ctx.fillStyle = lgrad(ctx, 0, hz - 120, 0, hz, [hsl(hue + 160, 90, 65), hsl(hue + 200, 90, 45)]); ctx.beginPath(); ctx.arc(W / 2 - camX * 6, hz, 110, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#020617'; for (let k = 0; k < 6; k++) ctx.fillRect(W / 2 - camX * 6 - 120, hz - 12 - k * 16, 240, 4 + k * 0.6);
        // mountains
        ctx.fillStyle = hsl(hue + 200, 50, 8); ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, hz - 30 - Math.abs(Math.sin((x + camX * 20) * 0.01)) * 60); ctx.lineTo(W, hz); ctx.fill();
        // stars
        ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 60; k++) { const sx = ((k * 137.5 - camX * 3) % W + W) % W, sy = (k * 61.3) % (hz * 0.9); ctx.fillRect(sx, sy, 1.6, 1.6); }
        const i0 = Math.floor(B.z / ROW) - 2, n = 52;
        for (let i = i0 + n; i >= i0; i--) {
          const rw = row(i), z0 = i * ROW, z1 = z0 + ROW;
          const far = clamp((i - i0) / n, 0, 1), fade = 1 - far * far;
          for (let l = 0; l < LANES; l++) {
            if (!rw.tiles[l]) continue;
            const x0 = -HALF + l * LW, x1 = x0 + LW;
            const a = P(x0, 0, z0), b = P(x1, 0, z0), c = P(x1, 0, z1), d = P(x0, 0, z1); if (!a || !b || !c || !d) continue;
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
            ctx.fillStyle = hsl(hue, 70, ((i + l) % 2 ? 9 : 13), fade); ctx.fill();
            ctx.strokeStyle = hsl(hue, 100, 60, fade * 0.9); ctx.lineWidth = Math.max(1, a[2] * 0.03); ctx.stroke();
            if (rw.ramp === l) { const ra = P(x0 + 0.2, 0, z0 + 0.5), rb = P(x1 - 0.2, 0, z0 + 0.5), rc = P(x1 - 0.2, 0.6, z1), rd = P(x0 + 0.2, 0.6, z1); if (ra && rb && rc && rd) { ctx.beginPath(); ctx.moveTo(ra[0], ra[1]); ctx.lineTo(rb[0], rb[1]); ctx.lineTo(rc[0], rc[1]); ctx.lineTo(rd[0], rd[1]); ctx.closePath(); ctx.fillStyle = hsl(120, 90, 50, fade * 0.8); ctx.fill(); } }
          }
          // side rails glow
          const lA = P(-HALF, 0, z0), lB = P(-HALF, 0, z1), rA = P(HALF, 0, z0), rB = P(HALF, 0, z1);
          if (lA && lB && rA && rB && rw.tiles[0]) { ctx.strokeStyle = hsl(hue + 40, 100, 70, fade); ctx.lineWidth = Math.max(1.5, lA[2] * 0.08); ctx.beginPath(); ctx.moveTo(lA[0], lA[1]); ctx.lineTo(lB[0], lB[1]); ctx.stroke(); }
          if (lA && lB && rA && rB && rw.tiles[LANES - 1]) { ctx.beginPath(); ctx.moveTo(rA[0], rA[1]); ctx.lineTo(rB[0], rB[1]); ctx.stroke(); }
          // tunnel arch
          if (rw.tunnel && i % 2 === 0) { const L0 = P(-HALF - 0.5, 0, z0), R0 = P(HALF + 0.5, 0, z0), T0 = P(0, 7, z0); if (L0 && R0 && T0) { ctx.strokeStyle = hsl(hue + 120, 100, 65, fade * 0.8); ctx.lineWidth = Math.max(1, L0[2] * 0.12); ctx.beginPath(); ctx.moveTo(L0[0], L0[1]); ctx.quadraticCurveTo(L0[0], T0[1], T0[0], T0[1]); ctx.quadraticCurveTo(R0[0], T0[1], R0[0], R0[1]); ctx.stroke(); } }
          // blocks
          const drawBlock = (cx, w) => {
            const zf = z0 + 1, zb = z0 + 3, h = 1.6, x0 = cx - w / 2, x1 = cx + w / 2;
            const f = [P(x0, 0, zf), P(x1, 0, zf), P(x1, h, zf), P(x0, h, zf)], tp = [P(x0, h, zf), P(x1, h, zf), P(x1, h, zb), P(x0, h, zb)];
            if (f.some(p => !p) || tp.some(p => !p)) return;
            const poly = (pts, col) => { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
            poly(tp, hsl(0, 90, 60, fade)); poly(f, hsl(0, 85, 42, fade));
            ctx.strokeStyle = hsl(0, 100, 80, fade); ctx.lineWidth = 1.5; ctx.beginPath(); f.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
          };
          if (rw.gem !== undefined && !rw.got) { const gx = -HALF + (rw.gem + 0.5) * LW, gp = P(gx, 0.9 + Math.sin(t * 4 + i) * 0.15, z0 + 2); if (gp) { const gs = gp[2] * 0.45; ctx.globalAlpha = fade; ctx.drawImage(E.glow(190), gp[0] - gs * 2, gp[1] - gs * 2, gs * 4, gs * 4); const w = gs * Math.abs(Math.cos(t * 3 + i)) + gs * 0.15; ctx.fillStyle = '#67e8f9'; ctx.beginPath(); ctx.moveTo(gp[0], gp[1] - gs); ctx.lineTo(gp[0] + w, gp[1]); ctx.lineTo(gp[0], gp[1] + gs); ctx.lineTo(gp[0] - w, gp[1]); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1; } }
          for (const b of rw.blocks) drawBlock(-HALF + (b + 0.5) * LW, LW * 0.9);
          if (rw.mover) drawBlock(Math.sin(t * rw.mover.sp + rw.mover.ph) * (HALF - 1), 1.6);
          // ball drawn at its row
          if (i === Math.floor(B.z / ROW)) {
            const p = P(B.x, B.y + 0.5, B.z); if (p) {
              const r = 0.5 * p[2];
              if (B.y < 1 && !B.fall) { const sh = P(B.x, 0, B.z); if (sh) ellipse(ctx, sh[0], sh[1], r * 1.1, r * 0.35, 'rgba(0,0,0,.5)'); }
              for (let k = 0; k < trail.length - 1; k++) { const tp = P(trail[k].x, trail[k].y + 0.5, trail[k].z); if (!tp) continue; const tr = 0.5 * tp[2] * (k / trail.length); ctx.globalAlpha = 0.35 * k / trail.length; circle(ctx, tp[0], tp[1], tr, hsl(hue, 100, 65)); } ctx.globalAlpha = 1;
              ctx.drawImage(E.glow(hue), p[0] - r * 2.6, p[1] - r * 2.6, r * 5.2, r * 5.2);
              circle(ctx, p[0], p[1], r, rgrad(ctx, p[0] - r * 0.3, p[1] - r * 0.4, r * 0.1, r * 1.1, ['#fff', hsl(hue, 100, 60), hsl(hue, 100, 25)]));
              ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.9, r * Math.abs(Math.cos(B.roll)) * 0.9, 0, 0, TAU); ctx.stroke();
            }
          }
        }
        // speed lines
        const sl = clamp((speed - 35) / 40, 0, 1); if (sl > 0 && !B.dead) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 * sl) + ')'; ctx.lineWidth = 2; for (let k = 0; k < 18; k++) { const a = k * 2.4 + Math.floor(t * 20) * 0.7, r0 = (Math.max(W, H) * (0.35 + ((k * 0.37 + t * 3) % 1) * 0.4)); ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, hz + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * (r0 + 120 * sl), hz + Math.sin(a) * (r0 + 120 * sl)); ctx.stroke(); } }
        if (flash > 0) { ctx.fillStyle = 'rgba(103,232,249,' + flash * 0.12 + ')'; ctx.fillRect(0, 0, W, H); }
        fx.draw(ctx);
        label(ctx, '💎 ' + gems, W - 60, 70, 18, '#67e8f9');
        label(ctx, Math.floor(score) + ' m', W / 2, 34, 30, hsl(hue, 100, 75));
        label(ctx, Math.floor(speed * 3.6) + ' km/h', W / 2, 64, 16, '#cbd5e1');
        if (E.touch && t < 4) { ctx.globalAlpha = 0.3; label(ctx, '◀', 50, H - 70, 50); label(ctx, '▶', W - 50, H - 70, 50); ctx.globalAlpha = 1; }
      },
      down(x) { touchDir = x < E.W / 2 ? -1 : 1; },
      move(x) { mouseX = x; if (E.touch && E.ptrDown) touchDir = x < E.W / 2 ? -1 : 1; },
      up() { touchDir = 0; },
      hud() { return { stats: [['Best', fmt(E.best()) + ' m']] }; }
    };
  }
});
