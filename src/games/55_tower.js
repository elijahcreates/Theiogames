/* =====================================================================
   TOWER BALANCE  (rigid-body stacking physics)
   ===================================================================== */
registerGame({
  id: 'tower', title: 'Tower Balance', emoji: '🗼', c1: '#8360c3', c2: '#2ebf91', cats: ['Physics', 'Puzzle'], isNew: true,
  desc: 'Drop blocks, planks, wedges and odd-shaped pieces from the crane and build the tallest tower you can. Real physics – if anything falls off the base, it’s over!',
  controls: 'Tap / Space to drop • ←/→ rotate', scoreLabel: 'PIECES STACKED',
  hint: 'Click / SPACE drops the piece from the moving crane. Q/E or ←/→ rotate it first. Keep everything on the base!', hintTouch: 'Tap the left/right ⟲⟳ buttons to rotate, tap the screen to drop!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 900;
    // ---------- tiny rigid body engine ----------
    const bodies = []; let t = 0;
    const cross = (ax, ay, bx, by) => ax * by - ay * bx;
    function mkBody(verts, x, y, a, dens, isStatic, col) {
      // compute area, centroid, inertia
      let A = 0, cx = 0, cy = 0, I = 0; for (let i = 0; i < verts.length; i++) { const [x1, y1] = verts[i], [x2, y2] = verts[(i + 1) % verts.length], c = cross(x1, y1, x2, y2); A += c / 2; cx += (x1 + x2) * c / 6; cy += (y1 + y2) * c / 6; }
      cx /= A; cy /= A; const loc = verts.map(([vx, vy]) => [vx - cx, vy - cy]);
      for (let i = 0; i < loc.length; i++) { const [x1, y1] = loc[i], [x2, y2] = loc[(i + 1) % loc.length], c = cross(x1, y1, x2, y2); I += c * (x1 * x1 + x1 * x2 + x2 * x2 + y1 * y1 + y1 * y2 + y2 * y2) / 12; }
      const m = Math.abs(A) * dens; const b = { v: loc, x, y, a, vx: 0, vy: 0, w: 0, im: isStatic ? 0 : 1 / m, iI: isStatic ? 0 : 1 / (Math.abs(I) * dens), col, st: isStatic, wv: [], born: t };
      if (A < 0) b.v.reverse(); update(b); bodies.push(b); return b;
    }
    function update(b) { const c = Math.cos(b.a), s = Math.sin(b.a); b.wv = b.v.map(([x, y]) => [b.x + x * c - y * s, b.y + x * s + y * c]); b.nrm = b.wv.map((p, i) => { const q = b.wv[(i + 1) % b.wv.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [dy / l, -dx / l]; }); }
    function maxSep(A, B) { let best = -1e9, bi = 0; for (let i = 0; i < A.wv.length; i++) { const n = A.nrm[i], p = A.wv[i]; let mn = 1e9; for (const q of B.wv) mn = Math.min(mn, (q[0] - p[0]) * n[0] + (q[1] - p[1]) * n[1]); if (mn > best) { best = mn; bi = i; } } return [best, bi]; }
    function collide(A, B) {
      const [sa, ia] = maxSep(A, B); if (sa > 0) return null; const [sb, ib] = maxSep(B, A); if (sb > 0) return null;
      let R = A, I = B, ri = ia, flip = false; if (sb > sa * 0.95 + 0.01) { R = B; I = A; ri = ib; flip = true; }
      const n = R.nrm[ri], v1 = R.wv[ri], v2 = R.wv[(ri + 1) % R.wv.length];
      let ii = 0, md = 1e9; for (let i = 0; i < I.nrm.length; i++) { const d = I.nrm[i][0] * n[0] + I.nrm[i][1] * n[1]; if (d < md) { md = d; ii = i; } }
      let pts = [I.wv[ii], I.wv[(ii + 1) % I.wv.length]];
      const tx = v2[0] - v1[0], ty = v2[1] - v1[1], tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;
      const clip = (pts, nx, ny, off) => { const out = [], d0 = pts[0][0] * nx + pts[0][1] * ny - off, d1 = pts[1][0] * nx + pts[1][1] * ny - off; if (d0 <= 0) out.push(pts[0]); if (d1 <= 0) out.push(pts[1]); if (d0 * d1 < 0) { const k = d0 / (d0 - d1); out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * k, pts[0][1] + (pts[1][1] - pts[0][1]) * k]); } return out; };
      pts = clip(pts, -ux, -uy, -(v1[0] * ux + v1[1] * uy)); if (pts.length < 2) return null; pts = clip(pts, ux, uy, v2[0] * ux + v2[1] * uy); if (pts.length < 2) return null;
      const cs = []; for (const p of pts) { const sep = (p[0] - v1[0]) * n[0] + (p[1] - v1[1]) * n[1]; if (sep <= 0) cs.push({ x: p[0], y: p[1], d: -sep }); }
      if (!cs.length) return null; return { a: R, b: I, nx: n[0], ny: n[1], cs };
    }
    function stepWorld(dt) {
      for (const b of bodies) if (!b.st) { b.vy += G * dt; b.vx *= 0.999; b.w *= 0.995; }
      const ms = []; for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) { const A = bodies[i], B = bodies[j]; if (A.st && B.st) continue; const m = collide(A, B); if (m) { for (const c of m.cs) { c.pn = 0; c.pt = 0; } ms.push(m); } }
      for (let it = 0; it < 12; it++) for (const m of ms) {
        const a = m.a, b = m.b, nx = m.nx, ny = m.ny;
        for (const c of m.cs) {
          const rax = c.x - a.x, ray = c.y - a.y, rbx = c.x - b.x, rby = c.y - b.y;
          const dvx = (b.vx - b.w * rby) - (a.vx - a.w * ray), dvy = (b.vy + b.w * rbx) - (a.vy + a.w * rax);
          const vn = dvx * nx + dvy * ny, rna = cross(rax, ray, nx, ny), rnb = cross(rbx, rby, nx, ny);
          const kn = a.im + b.im + rna * rna * a.iI + rnb * rnb * b.iI; const bias = 0.25 / dt * Math.max(0, c.d - 0.5);
          let dP = (-vn + bias) / kn; const p0 = c.pn; c.pn = Math.max(0, p0 + dP); dP = c.pn - p0;
          let px = dP * nx, py = dP * ny; a.vx -= px * a.im; a.vy -= py * a.im; a.w -= cross(rax, ray, px, py) * a.iI; b.vx += px * b.im; b.vy += py * b.im; b.w += cross(rbx, rby, px, py) * b.iI;
          const tx = -ny, ty = nx; const dvx2 = (b.vx - b.w * rby) - (a.vx - a.w * ray), dvy2 = (b.vy + b.w * rbx) - (a.vy + a.w * rax); const vt = dvx2 * tx + dvy2 * ty;
          const rta = cross(rax, ray, tx, ty), rtb = cross(rbx, rby, tx, ty), kt = a.im + b.im + rta * rta * a.iI + rtb * rtb * b.iI;
          let dT = -vt / kt; const mx = 0.7 * c.pn, t0 = c.pt; c.pt = clamp(t0 + dT, -mx, mx); dT = c.pt - t0; px = dT * tx; py = dT * ty;
          a.vx -= px * a.im; a.vy -= py * a.im; a.w -= cross(rax, ray, px, py) * a.iI; b.vx += px * b.im; b.vy += py * b.im; b.w += cross(rbx, rby, px, py) * b.iI;
        }
      }
      for (const b of bodies) if (!b.st) { b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt; update(b); }
    }
    // ---------- game ----------
    const BASEW = 260, groundY = 0;
    mkBody([[-BASEW / 2, 0], [BASEW / 2, 0], [BASEW / 2, 40], [-BASEW / 2, 40]], 0, 20, 0, 1, true, '#475569');
    const SHAPES = [
      { n: 'Block', v: [[-35, -35], [35, -35], [35, 35], [-35, 35]] }, { n: 'Plank', v: [[-90, -14], [90, -14], [90, 14], [-90, 14]] }, { n: 'Brick', v: [[-55, -22], [55, -22], [55, 22], [-55, 22]] },
      { n: 'Wedge', v: [[-45, 30], [45, 30], [0, -40]] }, { n: 'Trapezoid', v: [[-55, 25], [55, 25], [30, -25], [-30, -25]] }, { n: 'Pillar', v: [[-16, -55], [16, -55], [16, 55], [-16, 55]] },
      { n: 'Hexagon', v: [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3) * 38, Math.sin(i * Math.PI / 3) * 38]) }, { n: 'Ramp', v: [[-60, 25], [60, 25], [60, -25]] }, { n: 'Gem', v: [[-40, 0], [-20, -28], [20, -28], [40, 0], [0, 34]] }
    ];
    let next = null, craneX = 0, craneDir = 1, score = 0, over = false, camY = -200, dropCD = 0, rot = 0, top = 0, msg = '', msgT = 0;
    function newPiece() { const lvl = Math.min(1, score / 25), pool = score < 3 ? SHAPES.slice(0, 3) : SHAPES; const sh = pick(pool); next = { sh, hue: irand(0, 359), scale: rand(0.85, 1.1) - lvl * 0.1 }; rot = 0; }
    newPiece();
    function towerTop() { let m = 0; for (const b of bodies) if (!b.st) for (const p of b.wv) m = Math.min(m, p[1]); return m; }
    function drop() {
      if (over || !next || dropCD > 0) return; const v = next.sh.v.map(([x, y]) => [x * next.scale, y * next.scale]);
      const b = mkBody(v, craneX, craneY() + 50, rot, 0.01, false, hsl(next.hue, 70, 58)); b.name = next.sh.n; b.vx = craneDir * craneSpeed() * 0.3;
      dropCD = 0.9; next = null; E.sound('whoosh'); setTimeout(() => { if (!over && E.g === api) newPiece(); }, 900);
    }
    const craneSpeed = () => 120 + Math.min(200, score * 7);
    const craneY = () => Math.min(-260, towerTop() - 260);
    if (E.touch) E.pads([{ k: 'KeyQ', label: '⟲', left: 16, bottom: 20, size: 70 }, { k: 'KeyE', label: '⟳', left: 96, bottom: 20, size: 70 }]);
    const api = {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; dropCD = Math.max(0, dropCD - dt);
        if (E.key('KeyQ') || E.key('ArrowLeft')) rot -= dt * 2.2; if (E.key('KeyE') || E.key('ArrowRight')) rot += dt * 2.2;
        const range = Math.min(320, E.W * 0.45); craneX += craneDir * craneSpeed() * dt; if (craneX > range) { craneX = range; craneDir = -1; } if (craneX < -range) { craneX = -range; craneDir = 1; }
        for (let k = 0; k < 3; k++) stepWorld(dt / 3);
        // count settled pieces / detect falls
        let settled = 0;
        for (const b of bodies) {
          if (b.st) continue;
          if (b.y > 200) { if (!over) { over = true; E.sound('crash'); E.shake(10); E.gameOver({ score, title: 'The tower toppled!', lines: ['Pieces stacked: ' + score, 'Height: ' + Math.round(-top / 10) + ' m'], delay: 1200 }); } continue; }
          if (!b.counted && t - b.born > 1.2 && Math.hypot(b.vx, b.vy) < 25 && Math.abs(b.w) < 0.5) { b.counted = true; score++; E.sound('land'); fx.burst(b.x, b.y, 10, { col: '#fff', spd: 80 }); if (score % 10 === 0) { msg = '🏗️ ' + score + ' pieces!'; msgT = 1.5; E.sound('power'); } }
        }
        top = towerTop(); camY += ((Math.min(-200, top - 80)) - camY) * Math.min(1, dt * 2);
      },
      draw() {
        const W = E.W, H = E.H, s = Math.min(1, Math.min(W, H) / 760);
        const hh = clamp(-camY / 3000, 0, 1);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(230 - hh * 30, 50, 30 + hh * 10 - hh * 20), hsl(200, 60, 70 - hh * 30)]); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,255,255,${hh * 0.6})`; ctx.fillRect((i * 137) % W, (i * 71) % H, 2, 2); }
        ctx.save(); ctx.translate(W / 2, H * 0.62); ctx.scale(s, s); ctx.translate(0, -camY - 200);
        // city backdrop
        ctx.fillStyle = 'rgba(30,41,59,.35)'; for (let i = -12; i < 12; i++) { const bh = 80 + ((i * 53) & 127); ctx.fillRect(i * 90, 40 - bh, 70, bh + 400); }
        ctx.fillStyle = '#334155'; ctx.fillRect(-2000, 40, 4000, 600);
        for (let m = 1; m <= 40; m++) { const y = -m * 100; if (y < camY - 700 || y > camY + 600) continue; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(500, y); ctx.stroke(); ctx.setLineDash([]); txt(ctx, (m * 10) + ' m', 440, y - 10, 14, 'rgba(255,255,255,.4)', 'center', 800); }
        for (const b of bodies) {
          ctx.beginPath(); b.wv.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
          if (b.st) { ctx.fillStyle = lgrad(ctx, 0, 0, 0, 40, ['#94a3b8', '#334155']); ctx.fill(); continue; }
          shadowOn(ctx, 'rgba(0,0,0,.35)', 8, 3, 5); ctx.fillStyle = b.col; ctx.fill(); shadowOff(ctx); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillRect(-200, -200, 400, 12); ctx.restore();
          if (!b.counted) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); }
        }
        // crane
        const cy = craneY(); ctx.fillStyle = '#facc15'; ctx.fillRect(-2000, cy - 60, 4000, 14); ctx.fillStyle = '#ca8a04'; for (let x = -2000; x < 2000; x += 40) ctx.fillRect(x, cy - 60, 20, 14);
        ctx.fillStyle = '#334155'; rr(ctx, craneX - 26, cy - 66, 52, 26, 6); ctx.fill(); ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(craneX, cy - 40); ctx.lineTo(craneX, cy + 10); ctx.stroke();
        if (next) { const v = next.sh.v.map(([x, y]) => [x * next.scale, y * next.scale]); ctx.save(); ctx.translate(craneX, cy + 50); ctx.rotate(rot); ctx.beginPath(); v.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = hsl(next.hue, 70, 58); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(craneX, cy + 90); ctx.lineTo(craneX, 0); ctx.stroke(); ctx.setLineDash([]); }
        fx.draw(ctx); ctx.restore();
        label(ctx, String(score), W / 2, 50, 46); label(ctx, 'Height ' + Math.round(-top / 10) + ' m' + (next ? '  •  next: ' + next.sh.n : ''), W / 2, 86, 15, '#e2e8f0');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.3, 28, '#fde047');
      },
      _dbg: () => ({ cx: craneX, n: bodies.length, score, over, ready: !!next && dropCD <= 0, ys: bodies.filter(b => !b.st).map(b => Math.round(b.y)) }),
      down() { drop(); },
      onKey(c) { if (c === 'Space' || c === 'Enter' || c === 'ArrowDown' || c === 'KeyS') drop(); },
      destroy() { E.pads(null); },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
    return api;
  }
});
