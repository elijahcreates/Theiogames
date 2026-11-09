/* =====================================================================
   HAMMER CLIMB CHALLENGE  (pot + hammer physics climbing)
   ===================================================================== */
registerGame({
  id: 'hammer', title: 'Hammer Climb Challenge', emoji: '🔨', c1: '#536976', c2: '#292e49', cats: ['Physics', 'Creative'], featured: true, isNew: true, hot: true, boost: '🔨 SMACK',
  desc: 'You are stuck in a pot with only a giant hammer! Hook, push and swing your way up 8 floors of crates, rocks, logs and ice to the golden summit. Every floor is a checkpoint, so a slip never costs more than one floor.',
  controls: 'Mouse moves the hammer • Click / Space to SMACK', scoreLabel: 'BEST HEIGHT (m)', fmtScore: v => v + ' m',
  hint: 'Move the mouse to swing the hammer. Point it at the floor or a wall and CLICK (or press SPACE) to SMACK – your pot hops the opposite way! Put the hammer down-left to hop up-right. Every floor is a ⛳ checkpoint.', hintTouch: 'Drag to move the hammer (like a trackpad). Touch the floor with it and tap 🔨 SMACK to hop the opposite way!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 1500, BR = 26, HR = 11, LMAX = 178, LMIN = 38;
    const polys = [], R = (x, y, w, h, k) => polys.push({ k: k || 'rock', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] }), Pg = (pts, k) => polys.push({ k: k || 'rock', pts });
    // ---------- level: zig-zag floors, a short staircase between each, worst fall = one floor ----------
    const WL = -600, WR = 900, FH = 420, NF = 8, TH = 30, OPEN = 740, RISE = FH / 5;
    R(WL - 400, 0, WR - WL + 800, 300, 'ground'); R(WL - 120, -FH * NF - 900, 120, FH * NF + 1200, 'wall'); R(WR, -FH * NF - 900, 120, FH * NF + 1200, 'wall');
    const SHELF = [], STY = ['crate', 'rock', 'trunk', 'ledge', 'crate', 'rock', 'ice', 'ledge'];
    for (let f = 1; f <= NF; f++) {
      const y0 = -(f - 1) * FH, y1 = -f * FH, left = f % 2 === 1, kind = STY[f - 1], pw = 180;
      // shelf f: attached to one wall, open on the other side
      const sx0 = left ? WL : WL + OPEN, sx1 = left ? WR - OPEN : WR;
      R(sx0, y1, sx1 - sx0, TH, f === NF ? 'summit' : 'plat'); SHELF.push({ y: y1, x0: sx0, x1: sx1, cx: left ? WL + 130 : WR - 130 });
      // staircase on the open side: two blocks against the wall, then two floating steps back towards the shelf
      const m = left ? 1 : -1, wallX = left ? WR : WL, X = d => wallX - m * d;   // X(d) = d pixels in from the open-side wall
      const blk = (d0, d1, top, k) => { const a = X(d1), b = X(d0); R(Math.min(a, b), top, Math.abs(b - a), y0 - top, k); };
      blk(220, 420, y0 - RISE, kind); blk(0, 220, y0 - RISE * 2, kind);
      const fl = (d0, w, top) => { const a = X(d0 + w), b = X(d0); R(Math.min(a, b), top, Math.abs(b - a), 22, kind === 'rock' || kind === 'crate' ? 'plat' : kind); };
      fl(310, pw, y0 - RISE * 3); fl(530, pw, y0 - RISE * 4);
    }
    const segs = []; polys.forEach(p => { for (let i = 0; i < p.pts.length; i++) { const a = p.pts[i], b = p.pts[(i + 1) % p.pts.length]; segs.push([a[0], a[1], b[0], b[1]]); } });
    const CPS = [{ x: 0, y: -BR - 2, h: 0 }].concat(SHELF.map((sh, i) => ({ x: sh.cx, y: sh.y - BR - 2, h: i + 1 })));
    const SUMMIT = -FH * NF, TOP = SHELF[NF - 1];
    // ---------- state ----------
    const sv = E.data('cp2', 0);
    let cp = Math.min(sv, CPS.length - 1);
    const body = { x: CPS[cp].x, y: CPS[cp].y, vx: 0, vy: 0 };
    let off = { x: 70, y: -20 }, head = { x: body.x + 70, y: body.y - 20 }, cam = { x: body.x, y: body.y }, t = 0, maxH = 0, msg = '', msgT = 0, won = false, contact = false, grounded = 0, smackCD = 0, ghost = 0, hopT = 0, hopVX = 0, touchT = 9, boostWas = false, ring = 0, lastDrag = null, falls = 0, peakY = body.y;
    function nearest(px, py, r) { let best = null; for (const s of segs) { if (Math.min(s[0], s[2]) - r > px || Math.max(s[0], s[2]) + r < px || Math.min(s[1], s[3]) - r > py || Math.max(s[1], s[3]) + r < py) continue; const q = segDist(px, py, s[0], s[1], s[2], s[3]); if (q.d < r && (!best || q.d < best.d)) best = q; } return best; }
    function pushOut(p, r) { let hit = false; for (let it = 0; it < 4; it++) { const q = nearest(p.x, p.y, r); if (!q) break; hit = true; let nx = p.x - q.x, ny = p.y - q.y; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d; p.x = q.x + nx * r; p.y = q.y + ny * r; p.nx = nx; p.ny = ny; } return hit; }
    function insideSolid(x, y) { for (const p of polys) { let c = false; const pts = p.pts; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; } if (c) return true; } return false; }
    function smack() {
      if (smackCD > 0 || won) return;
      if (touchT > 0.3 && grounded <= 0 && !nearest(head.x, head.y, HR + 14)) { msg = 'Touch something with the hammer first!'; msgT = 0.9; return; }
      let dx = -off.x, dy = -off.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;   // fly opposite to where you point the hammer
      const P = 700; body.vx = dx * P; body.vy = dy * P; grounded = 0; smackCD = 0.4; ghost = 0.25; hopT = 0.6; hopVX = body.vx; ring = 1;
      E.sound('thud', 90); E.shake(4); fx.burst(head.x, head.y, 14, { col: ['#fde047', '#fff', '#a8a29e'], spd: 220, grav: 300 });
    }
    function goCheckpoint() { const c = CPS[cp]; body.x = c.x; body.y = c.y; body.vx = body.vy = 0; head.x = body.x + off.x; head.y = body.y + off.y; E.sound('whoosh'); msg = '⛳ Checkpoint ' + cp; msgT = 1.2; }
    return {
      extra: { label: '⛳ Checkpoint', action: goCheckpoint },
      _dbg: { body, head, off, smack, get cp() { return cp; }, set(x, y) { body.x = x; body.y = y; body.vx = body.vy = 0; head.x = x + off.x; head.y = y + off.y; cam.x = x; cam.y = y; } },
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (won) return;
        smackCD -= dt; ghost -= dt; hopT -= dt; ring = Math.max(0, ring - dt * 3); const bz = E.boost(); if (bz && !boostWas) smack(); boostWas = bz;
        const steps = 4, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          const ox = body.x, oy = body.y;
          body.vy += G * h; body.x += body.vx * h; body.y += body.vy * h;
          const bp = { x: body.x, y: body.y }; const hitB = pushOut(bp, BR); if (!hitB && hopT > 0 && Math.abs(body.vx) < Math.abs(hopVX) * 0.5) body.vx = hopVX; if (hitB) { { const vn = body.vx * bp.nx + body.vy * bp.ny; if (vn < 0) { if (vn < -520) { E.sound('thud', 120); fx.burst(bp.x - bp.nx * BR, bp.y - bp.ny * BR, 10, { col: ['#d6d3d1', '#a8a29e'], spd: 140, grav: 400 }); E.shake(Math.min(10, -vn / 120)); } body.vx -= vn * bp.nx * 1.02; body.vy -= vn * bp.ny * 1.02; body.vx *= 0.9; body.vy *= 0.9; } if (bp.ny < -0.25) { grounded = 0.12; if (hopT < 0.45) hopT = 0; } } body.x = bp.x; body.y = bp.y; }
          // hammer head: try to move to desired spot; if it hits terrain, the body moves instead
          let L = Math.hypot(off.x, off.y); const ux = off.x / (L || 1), uy = off.y / (L || 1); L = clamp(L, LMIN, LMAX);
          const dx = body.x + ux * L, dy = body.y + uy * L;
          // sweep from current head to desired in small steps
          let sx = head.x, sy = head.y; if (insideSolid(sx, sy)) { let lx = body.x, ly = body.y; for (let k = 1; k <= 24; k++) { const tx = body.x + (sx - body.x) * k / 24, ty = body.y + (sy - body.y) * k / 24; if (insideSolid(tx, ty)) break; lx = tx; ly = ty; } sx = lx; sy = ly; contact = false; } { const p0 = { x: sx, y: sy }; if (pushOut(p0, HR)) { sx = p0.x; sy = p0.y; } }
          const mvx = dx - sx, mvy = dy - sy, n = Math.max(1, Math.ceil(Math.hypot(mvx, mvy) / 6)); let hx = sx, hy = sy, blocked = false;
          for (let i = 1; i <= n; i++) {
            const tx = sx + mvx * i / n, ty = sy + mvy * i / n, solid = insideSolid(tx, ty), q = solid ? null : nearest(tx, ty, HR);
            if ((solid || q) && ghost <= 0) { const p = { x: tx, y: ty }; pushOut(p, HR); if (!solid && mvx * (p.nx || 0) + mvy * (p.ny || 0) >= 0) { hx = tx; hy = ty; continue; } blocked = true; if (contact && Math.hypot(head.x - p.x, head.y - p.y) < 30 && (nearest(head.x, head.y, HR + 2))) { hx = head.x; hy = head.y; } else { hx = p.x; hy = p.y; } break; }
            hx = tx; hy = ty;
          }
          contact = blocked;
          if (blocked) {
            // move the body by the opposite of the head's blocked displacement
            let cx = hx - dx, cy = hy - dy; { const cl = Math.hypot(cx, cy), CM = 24; if (cl > CM) { cx *= CM / cl; cy *= CM / cl; } } const nbx = body.x + cx, nby = body.y + cy; const np = { x: nbx, y: nby }; pushOut(np, BR);
            const vx2 = (np.x - ox) / h * 0.3, vy2 = (np.y - oy) / h * 0.3, sp = Math.hypot(vx2, vy2), mx = 360; body.vx = sp > mx ? vx2 / sp * mx : vx2; body.vy = sp > mx ? vy2 / sp * mx : vy2; body.x = np.x; body.y = np.y;
          }
          head.x = hx; head.y = hy; touchT = (blocked || nearest(hx, hy, HR + 4)) ? 0 : touchT + h;
          // safety: the hammer can never sit on the far side of a floor/wall (snap it back to our side)
          if (ghost <= 0) { let lx = body.x, ly = body.y; for (let k = 1; k <= 12; k++) { const tx = body.x + (head.x - body.x) * k / 12, ty = body.y + (head.y - body.y) * k / 12; if (insideSolid(tx, ty)) { head.x = lx; head.y = ly; contact = false; break; } lx = tx; ly = ty; } }
          // safety: if the pot ever ends up inside a block, lift it out on top
          if (insideSolid(body.x, body.y)) { let up = 0; while (up < 400 && insideSolid(body.x, body.y - up)) up += 4; body.y -= up + BR + 2; body.vx = 0; body.vy = 0; head.x = body.x + 40; head.y = body.y - 20; }
          if (grounded > 0 && !blocked) { body.vx *= Math.exp(-7 * h); } grounded -= h;
          // keep the head within reach after the body moved
          const ddx = head.x - body.x, ddy = head.y - body.y, dd = Math.hypot(ddx, ddy); if (dd > LMAX + 4) { head.x = body.x + ddx / dd * LMAX; head.y = body.y + ddy / dd * LMAX; }
        }
        // heights / checkpoints
        const hgt = Math.max(0, Math.round(-body.y / 10)); if (hgt > maxH) maxH = hgt;
        if (body.y < peakY) peakY = body.y; if (body.y - peakY > 900) { falls++; peakY = body.y; msg = pick(['Oof! Big fall…', 'Ouch. Keep going!', 'The pot believes in you.']); msgT = 2; }
        for (let i = cp + 1; i < CPS.length; i++) if (grounded > 0 && Math.abs(body.y - CPS[i].y) < 12 && body.x > SHELF[i - 1].x0 && body.x < SHELF[i - 1].x1) { cp = i; E.save('cp2', cp); E.sound('win'); msg = '⛳ CHECKPOINT ' + i + ' reached!'; msgT = 2; fx.burst(CPS[i].x, CPS[i].y - 40, 30, { col: ['#fde047', '#22c55e', '#fff'], spd: 260, shape: 'star' }); }
        if (cp === NF && !won) { won = true; E.ach('summit'); E.save('cp2', 0); E.gameOver({ score: maxH, scoreText: maxH + ' m', win: true, title: '🏔️ YOU REACHED THE SUMMIT!', lines: ['Big falls: ' + falls, 'Time: ' + fmtTime(t)], delay: 1500 }); fx.burst(body.x, body.y, 80, { col: ['#fde047', '#f472b6', '#22d3ee'], spd: 420, shape: 'star', size: 8 }); }
        E.submitBest(maxH);
        cam.x += (body.x - cam.x) * Math.min(1, dt * 4); cam.y += (body.y - 60 - cam.y) * Math.min(1, dt * 4);
      },
      draw() {
        const W = E.W, H = E.H, z = Math.min(1.1, Math.min(W, H) / 640);
        const hgt = clamp(-cam.y / -SUMMIT, 0, 1);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(220 - hgt * 40, 60, 25 + hgt * 10 - 10), hsl(30 + hgt * 200, 60, 70 - hgt * 30)]); ctx.fillRect(0, 0, W, H);
        // parallax mountains & clouds
        for (let l = 0; l < 3; l++) { const par = 0.15 + l * 0.12; ctx.fillStyle = hsl(225, 25, 30 + l * 10, 0.8); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 40; x += 40) { const wx = x + cam.x * par; ctx.lineTo(x, H * (0.55 + l * 0.12) + cam.y * par * 0.08 - Math.abs(Math.sin(wx * 0.004 + l)) * 140 - Math.sin(wx * 0.013) * 20); } ctx.lineTo(W, H); ctx.fill(); }
        for (let i = 0; i < 8; i++) { const cx = ((i * 330 - cam.x * 0.3) % (W + 300) + W + 300) % (W + 300) - 150, cy = ((i * 170 - cam.y * 0.3) % (H + 200) + H + 200) % (H + 200) - 100; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, TAU); ctx.arc(cx + 30, cy - 10, 30, 0, TAU); ctx.arc(cx + 62, cy, 22, 0, TAU); ctx.fill(); }
        ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
        // terrain
        for (const p of polys) {
          ctx.beginPath(); p.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
          const ys = p.pts.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
          const col = { ground: ['#65a30d', '#3f6212'], wall: ['#44403c', '#292524'], rock: ['#a8a29e', '#57534e'], crate: ['#d97706', '#92400e'], trunk: ['#92400e', '#78350f'], branch: ['#a16207', '#713f12'], plat: ['#94a3b8', '#475569'], cliff: ['#78716c', '#44403c'], ledge: ['#cbd5e1', '#64748b'], ice: ['#e0f2fe', '#7dd3fc'], anvil: ['#475569', '#1e293b'], summit: ['#fde68a', '#d97706'] }[p.k];
          ctx.fillStyle = lgrad(ctx, 0, y0, 0, Math.max(y1, y0 + 1), col); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.stroke();
          if (p.k === 'ground' || p.k === 'plat' || p.k === 'summit') { ctx.fillStyle = p.k === 'summit' ? '#fef3c7' : '#4ade80'; ctx.fillRect(p.pts[0][0], p.pts[0][1] - 4, p.pts[1][0] - p.pts[0][0], 7); }
          if (p.k === 'crate') { ctx.strokeStyle = 'rgba(69,26,3,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.pts[0][0] + 6, p.pts[0][1] + 6); ctx.lineTo(p.pts[2][0] - 6, p.pts[2][1] - 6); ctx.stroke(); }
        }
        // tree canopy
        // checkpoints
        CPS.forEach((c, i) => { if (!i) return; ctx.fillStyle = '#e5e7eb'; ctx.fillRect(c.x - 2, c.y - 70, 4, 70); ctx.fillStyle = i <= cp ? '#22c55e' : '#ef4444'; ctx.beginPath(); ctx.moveTo(c.x + 2, c.y - 70); ctx.lineTo(c.x + 36 + Math.sin(t * 4) * 3, c.y - 60); ctx.lineTo(c.x + 2, c.y - 50); ctx.fill(); });
        // summit flag
        { const fx0 = TOP.cx; ctx.fillStyle = '#e5e7eb'; ctx.fillRect(fx0 - 3, SUMMIT - 130, 6, 130); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(fx0 + 3, SUMMIT - 130); ctx.lineTo(fx0 + 62 + Math.sin(t * 3) * 4, SUMMIT - 112); ctx.lineTo(fx0 + 3, SUMMIT - 94); ctx.fill(); label(ctx, '🏆 SUMMIT', fx0, SUMMIT - 150, 22, '#fde047'); }
        // height markers
        for (let m = 42; m <= 336; m += 42) { const y = -m * 10; ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(WL - 380, y); ctx.lineTo(WL - 200, y); ctx.stroke(); ctx.setLineDash([]); txt(ctx, m + ' m', WL - 290, y - 12, 16, 'rgba(255,255,255,.4)', 'center', 800); }
        // hammer
        const hx = head.x, hy = head.y, ang = Math.atan2(hy - body.y, hx - body.x);
        ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(body.x + Math.cos(ang) * 10, body.y - 14 + Math.sin(ang) * 10); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang + Math.PI / 2); ctx.fillStyle = lgrad(ctx, -24, 0, 24, 0, ['#475569', '#cbd5e1', '#334155']); rr(ctx, -24, -11, 48, 22, 5); ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        if (ring > 0) { ctx.strokeStyle = 'rgba(255,255,255,' + ring + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, hy, 20 + (1 - ring) * 40, 0, TAU); ctx.stroke(); }
        if (!contact && smackCD <= 0 && (touchT < 0.3 || grounded > 0)) { ctx.strokeStyle = 'rgba(134,239,172,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 18, 0, TAU); ctx.stroke(); }
        if (contact) { ctx.strokeStyle = 'rgba(253,224,71,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 18 + Math.sin(t * 20) * 2, 0, TAU); ctx.stroke(); }
        // person + pot
        ctx.save(); ctx.translate(body.x, body.y);
        ctx.fillStyle = '#2563eb'; rr(ctx, -12, -46, 24, 28, 8); ctx.fill(); circle(ctx, 0, -56, 12, '#f1c27d'); ctx.fillStyle = '#3f2a1d'; ctx.beginPath(); ctx.arc(0, -59, 12.5, Math.PI, 0); ctx.fill(); circle(ctx, Math.cos(ang) * 4 - 3, -56, 1.8, '#111'); circle(ctx, Math.cos(ang) * 4 + 3, -56, 1.8, '#111');
        ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(Math.cos(ang) * 16, -30 + Math.sin(ang) * 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-BR - 2, -26); ctx.quadraticCurveTo(-BR - 4, BR + 4, 0, BR); ctx.quadraticCurveTo(BR + 4, BR + 4, BR + 2, -26); ctx.closePath(); ctx.fillStyle = lgrad(ctx, -BR, 0, BR, 0, ['#7c2d12', '#c2410c', '#7c2d12']); ctx.fill(); ctx.strokeStyle = '#431407'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#9a3412'; rr(ctx, -BR - 5, -30, BR * 2 + 10, 8, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-BR + 6, -16, 6, 28);
        ctx.restore();
        fx.draw(ctx);
        ctx.restore();
        // height meter
        const mh = Math.min(300, H * 0.5), mx = W - 34, my = H / 2 - mh / 2; rr(ctx, mx, my, 14, mh, 7); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
        const pf = clamp(-body.y / -SUMMIT, 0, 1), pm = clamp(maxH * 10 / -SUMMIT, 0, 1); rr(ctx, mx, my + mh * (1 - pf), 14, mh * pf, 7); ctx.fillStyle = '#22c55e'; ctx.fill(); ctx.fillStyle = '#fde047'; ctx.fillRect(mx - 4, my + mh * (1 - pm) - 1, 22, 3);
        label(ctx, Math.max(0, Math.round(-body.y / 10)) + ' m', W / 2, 32, 26); label(ctx, 'Best ' + maxH + ' m • Checkpoint ' + cp + '/' + (CPS.length - 1), W / 2, 58, 14, '#e2e8f0');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.22, 28, '#fde047');
      },
      move(x, y, id, e) {
        const z = Math.min(1.1, Math.min(E.W, E.H) / 640);
        if (E.touch || (e && e.pointerType !== 'mouse')) { if (lastDrag && E.ptrDown) { off.x += (x - lastDrag.x) * 1.6 / z; off.y += (y - lastDrag.y) * 1.6 / z; const L = Math.hypot(off.x, off.y); if (L > LMAX * 1.2) { off.x *= LMAX * 1.2 / L; off.y *= LMAX * 1.2 / L; } } lastDrag = { x, y }; return; }
        const bx = E.W / 2 + (body.x - cam.x) * z, by = E.H * 0.55 + (body.y - cam.y) * z; off.x = (x - bx) / z; off.y = (y - by) / z;
      },
      down(x, y, id, e) { lastDrag = { x, y }; if (!E.touch && (!e || e.pointerType === 'mouse')) smack(); },
      onKey(code) { if (code === 'KeyF') smack(); },
      up() { lastDrag = null; },
      hud() { return null; }
    };
  }
});
