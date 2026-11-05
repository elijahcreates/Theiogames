/* =====================================================================
   HAMMER CLIMB CHALLENGE  (pot + hammer physics climbing)
   ===================================================================== */
registerGame({
  id: 'hammer', title: 'Hammer Climb Challenge', emoji: '🔨', c1: '#536976', c2: '#292e49', cats: ['Physics', 'Creative'], featured: true, isNew: true, hot: true,
  desc: 'You are stuck in a pot with only a giant hammer. Hook, push and swing your way up boulders, trees, crates and floating islands to reach the summit. Checkpoints keep it fair!',
  controls: 'Mouse / drag moves the hammer', scoreLabel: 'BEST HEIGHT (m)', fmtScore: v => v + ' m',
  hint: 'Move the mouse around your pot to swing the hammer. Hook it on ledges and push off the ground to climb! ⛳ returns to your last checkpoint.', hintTouch: 'Drag anywhere to move the hammer around the pot (like a trackpad). Hook ledges and push to climb!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 1500, BR = 26, HR = 11, LMAX = 160, LMIN = 38;
    const polys = [], R = (x, y, w, h, k) => polys.push({ k: k || 'rock', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] }), Pg = (pts, k) => polys.push({ k: k || 'rock', pts });
    // ---------- level ----------
    R(-900, 0, 2600, 300, 'ground'); R(-1000, -6000, 120, 6300, 'wall'); R(1620, -6000, 120, 6300, 'wall');
    Pg([[200, 0], [235, -95], [320, -140], [410, -105], [450, 0]]);
    R(600, -80, 100, 80, 'crate'); R(700, -160, 100, 160, 'crate'); R(800, -240, 100, 240, 'crate');
    R(1000, -720, 60, 720, 'trunk'); R(880, -320, 120, 18, 'branch'); R(1060, -450, 140, 18, 'branch'); R(880, -580, 120, 18, 'branch'); R(1060, -700, 160, 18, 'branch');
    R(1150, -800, 330, 34, 'plat');
    R(980, -930, 150, 24, 'plat'); R(760, -1040, 150, 24, 'plat'); R(540, -1150, 150, 24, 'plat'); R(320, -1260, 150, 24, 'plat');
    Pg([[0, -1260], [220, -1260], [220, -1290], [0, -1330]]);
    R(-260, -2250, 260, 920, 'cliff'); for (let y = -1420; y > -2240; y -= 125) R(0, y, 64, 18, 'ledge');
    Pg([[-230, -2250], [-200, -2290], [-60, -2290], [-30, -2250]], 'anvil');
    R(150, -2370, 160, 22, 'plat'); R(420, -2490, 160, 22, 'plat'); R(700, -2610, 160, 22, 'plat'); R(980, -2730, 160, 22, 'plat'); R(1250, -2860, 220, 24, 'plat');
    Pg([[1330, -2860], [1370, -2940], [1450, -2960], [1480, -2860]]);
    R(1280, -3060, 120, 22, 'plat'); R(1060, -3180, 120, 22, 'plat'); R(840, -3300, 140, 22, 'plat'); R(600, -3420, 120, 22, 'plat'); R(330, -3540, 330, 44, 'summit');
    const segs = []; polys.forEach(p => { for (let i = 0; i < p.pts.length; i++) { const a = p.pts[i], b = p.pts[(i + 1) % p.pts.length]; segs.push([a[0], a[1], b[0], b[1]]); } });
    const CPS = [{ x: 60, y: -40, h: 0 }, { x: 1300, y: -840, h: 1 }, { x: -130, y: -2320, h: 2 }, { x: 1300, y: -2900, h: 3 }];
    const SUMMIT = -3540;
    // ---------- state ----------
    const sv = E.data('cp', 0);
    let cp = Math.min(sv, CPS.length - 1);
    const body = { x: CPS[cp].x, y: CPS[cp].y, vx: 0, vy: 0 };
    let off = { x: 60, y: 30 }, head = { x: body.x + 60, y: body.y + 30 }, cam = { x: body.x, y: body.y }, t = 0, maxH = 0, msg = '', msgT = 0, won = false, contact = false, lastDrag = null, falls = 0, peakY = body.y;
    function nearest(px, py, r) { let best = null; for (const s of segs) { if (Math.min(s[0], s[2]) - r > px || Math.max(s[0], s[2]) + r < px || Math.min(s[1], s[3]) - r > py || Math.max(s[1], s[3]) + r < py) continue; const q = segDist(px, py, s[0], s[1], s[2], s[3]); if (q.d < r && (!best || q.d < best.d)) best = q; } return best; }
    function pushOut(p, r) { let hit = false; for (let it = 0; it < 4; it++) { const q = nearest(p.x, p.y, r); if (!q) break; hit = true; let nx = p.x - q.x, ny = p.y - q.y; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d; p.x = q.x + nx * r; p.y = q.y + ny * r; p.nx = nx; p.ny = ny; } return hit; }
    function insideSolid(x, y) { for (const p of polys) { let c = false; const pts = p.pts; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; } if (c) return true; } return false; }
    function goCheckpoint() { const c = CPS[cp]; body.x = c.x; body.y = c.y; body.vx = body.vy = 0; head.x = body.x + off.x; head.y = body.y + off.y; E.sound('whoosh'); msg = '⛳ Checkpoint ' + cp; msgT = 1.2; }
    return {
      extra: { label: '⛳ Checkpoint', action: goCheckpoint },
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (won) return;
        const steps = 4, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          const ox = body.x, oy = body.y;
          body.vy += G * h; body.x += body.vx * h; body.y += body.vy * h;
          const bp = { x: body.x, y: body.y }; if (pushOut(bp, BR)) { const vn = body.vx * bp.nx + body.vy * bp.ny; if (vn < 0) { if (vn < -520) { E.sound('thud', 120); fx.burst(bp.x - bp.nx * BR, bp.y - bp.ny * BR, 10, { col: ['#d6d3d1', '#a8a29e'], spd: 140, grav: 400 }); E.shake(Math.min(10, -vn / 120)); } body.vx -= vn * bp.nx * 1.05; body.vy -= vn * bp.ny * 1.05; body.vx *= 0.96; body.vy *= 0.96; } body.x = bp.x; body.y = bp.y; }
          // hammer head: try to move to desired spot; if it hits terrain, the body moves instead
          let L = Math.hypot(off.x, off.y); const ux = off.x / (L || 1), uy = off.y / (L || 1); L = clamp(L, LMIN, LMAX);
          const dx = body.x + ux * L, dy = body.y + uy * L;
          // sweep from current head to desired in small steps
          const sx = head.x, sy = head.y, n = Math.max(1, Math.ceil(Math.hypot(dx - sx, dy - sy) / 6)); let hx = sx, hy = sy, blocked = false;
          for (let i = 1; i <= n; i++) { const tx = sx + (dx - sx) * i / n, ty = sy + (dy - sy) * i / n; const q = nearest(tx, ty, HR); if (q || insideSolid(tx, ty)) { blocked = true; const p = { x: tx, y: ty }; pushOut(p, HR); hx = p.x; hy = p.y; break; } hx = tx; hy = ty; }
          contact = blocked;
          if (blocked) {
            // move the body by the opposite of the head's blocked displacement
            const cx = hx - dx, cy = hy - dy; const nbx = body.x + cx, nby = body.y + cy; const np = { x: nbx, y: nby }; pushOut(np, BR);
            const vx2 = (np.x - ox) / h, vy2 = (np.y - oy) / h, sp = Math.hypot(vx2, vy2), mx = 1150; body.vx = sp > mx ? vx2 / sp * mx : vx2; body.vy = sp > mx ? vy2 / sp * mx : vy2; body.x = np.x; body.y = np.y;
          }
          head.x = hx; head.y = hy;
          // keep the head within reach after the body moved
          const ddx = head.x - body.x, ddy = head.y - body.y, dd = Math.hypot(ddx, ddy); if (dd > LMAX + 4) { head.x = body.x + ddx / dd * LMAX; head.y = body.y + ddy / dd * LMAX; }
        }
        // heights / checkpoints
        const hgt = Math.max(0, Math.round(-body.y / 10)); if (hgt > maxH) maxH = hgt;
        if (body.y < peakY) peakY = body.y; if (body.y - peakY > 900) { falls++; peakY = body.y; msg = pick(['Oof! Big fall…', 'Ouch. Keep going!', 'The pot believes in you.']); msgT = 2; }
        for (let i = cp + 1; i < CPS.length; i++) if (dist(body.x, body.y, CPS[i].x, CPS[i].y) < 120) { cp = i; E.save('cp', cp); E.sound('win'); msg = '⛳ CHECKPOINT ' + i + ' reached!'; msgT = 2; fx.burst(CPS[i].x, CPS[i].y - 40, 30, { col: ['#fde047', '#22c55e', '#fff'], spd: 260, shape: 'star' }); }
        if (body.y < SUMMIT - 10 && body.x > 330 && body.x < 660 && !won) { won = true; E.ach('summit'); E.save('cp', 0); E.gameOver({ score: maxH, scoreText: maxH + ' m', win: true, title: '🏔️ YOU REACHED THE SUMMIT!', lines: ['Big falls: ' + falls, 'Time: ' + fmtTime(t)], delay: 1500 }); fx.burst(body.x, body.y, 80, { col: ['#fde047', '#f472b6', '#22d3ee'], spd: 420, shape: 'star', size: 8 }); }
        E.submitBest(maxH);
        cam.x += (body.x - cam.x) * Math.min(1, dt * 4); cam.y += (body.y - 60 - cam.y) * Math.min(1, dt * 4);
      },
      draw() {
        const W = E.W, H = E.H, z = Math.min(1.1, Math.min(W, H) / 640);
        const hgt = clamp(-cam.y / 3600, 0, 1);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(220 - hgt * 40, 60, 25 + hgt * 10 - 10), hsl(30 + hgt * 200, 60, 70 - hgt * 30)]); ctx.fillRect(0, 0, W, H);
        // parallax mountains & clouds
        for (let l = 0; l < 3; l++) { const par = 0.15 + l * 0.12; ctx.fillStyle = hsl(225, 25, 30 + l * 10, 0.8); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 40; x += 40) { const wx = x + cam.x * par; ctx.lineTo(x, H * (0.55 + l * 0.12) + cam.y * par * 0.08 - Math.abs(Math.sin(wx * 0.004 + l)) * 140 - Math.sin(wx * 0.013) * 20); } ctx.lineTo(W, H); ctx.fill(); }
        for (let i = 0; i < 8; i++) { const cx = ((i * 330 - cam.x * 0.3) % (W + 300) + W + 300) % (W + 300) - 150, cy = ((i * 170 - cam.y * 0.3) % (H + 200) + H + 200) % (H + 200) - 100; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, TAU); ctx.arc(cx + 30, cy - 10, 30, 0, TAU); ctx.arc(cx + 62, cy, 22, 0, TAU); ctx.fill(); }
        ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
        // terrain
        for (const p of polys) {
          ctx.beginPath(); p.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
          const ys = p.pts.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
          const col = { ground: ['#65a30d', '#3f6212'], wall: ['#44403c', '#292524'], rock: ['#a8a29e', '#57534e'], crate: ['#d97706', '#92400e'], trunk: ['#92400e', '#78350f'], branch: ['#a16207', '#713f12'], plat: ['#94a3b8', '#475569'], cliff: ['#78716c', '#44403c'], ledge: ['#cbd5e1', '#64748b'], anvil: ['#475569', '#1e293b'], summit: ['#fde68a', '#d97706'] }[p.k];
          ctx.fillStyle = lgrad(ctx, 0, y0, 0, Math.max(y1, y0 + 1), col); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.stroke();
          if (p.k === 'ground' || p.k === 'plat' || p.k === 'summit') { ctx.fillStyle = p.k === 'summit' ? '#fef3c7' : '#4ade80'; ctx.fillRect(p.pts[0][0], p.pts[0][1] - 4, p.pts[1][0] - p.pts[0][0], 7); }
          if (p.k === 'crate') { ctx.strokeStyle = 'rgba(69,26,3,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.pts[0][0] + 6, p.pts[0][1] + 6); ctx.lineTo(p.pts[2][0] - 6, p.pts[2][1] - 6); ctx.stroke(); }
        }
        // tree canopy
        for (const [x, y, r] of [[1030, -760, 90], [960, -700, 60], [1110, -690, 60]]) circle(ctx, x, y, r, 'rgba(22,101,52,.75)');
        // checkpoints
        CPS.forEach((c, i) => { if (!i) return; ctx.fillStyle = '#e5e7eb'; ctx.fillRect(c.x - 2, c.y - 70, 4, 70); ctx.fillStyle = i <= cp ? '#22c55e' : '#ef4444'; ctx.beginPath(); ctx.moveTo(c.x + 2, c.y - 70); ctx.lineTo(c.x + 36 + Math.sin(t * 4) * 3, c.y - 60); ctx.lineTo(c.x + 2, c.y - 50); ctx.fill(); });
        // summit flag
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(495, SUMMIT - 130, 6, 130); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(501, SUMMIT - 130); ctx.lineTo(560 + Math.sin(t * 3) * 4, SUMMIT - 112); ctx.lineTo(501, SUMMIT - 94); ctx.fill(); label(ctx, '🏆 SUMMIT', 500, SUMMIT - 150, 22, '#fde047');
        // height markers
        for (let m = 50; m <= 350; m += 50) { const y = -m * 10; ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(-880, y); ctx.lineTo(-700, y); ctx.stroke(); ctx.setLineDash([]); txt(ctx, m + ' m', -790, y - 12, 16, 'rgba(255,255,255,.4)', 'center', 800); }
        // hammer
        const hx = head.x, hy = head.y, ang = Math.atan2(hy - body.y, hx - body.x);
        ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(body.x + Math.cos(ang) * 10, body.y - 14 + Math.sin(ang) * 10); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang + Math.PI / 2); ctx.fillStyle = lgrad(ctx, -24, 0, 24, 0, ['#475569', '#cbd5e1', '#334155']); rr(ctx, -24, -11, 48, 22, 5); ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
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
      down(x, y) { lastDrag = { x, y }; },
      up() { lastDrag = null; },
      hud() { return null; }
    };
  }
});
