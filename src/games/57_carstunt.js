/* =====================================================================
   CAR STUNT CHALLENGE  (side-view physics car, ramps, loops, upgrades)
   ===================================================================== */
registerGame({
  id: 'carstunt', title: 'Car Stunt Challenge', emoji: '🚙', c1: '#f7971e', c2: '#ffd200', cats: ['Physics', 'Arcade'], isNew: true, hot: true,
  desc: 'Floor it over ramps, bumps and a giant loop! Balance your stunt car in the air, land flips for bonus points, collect coins and buy engine, tire and nitro upgrades across 3 tracks.',
  controls: '→ gas • ← brake/reverse • tilt in air • Space nitro', scoreLabel: 'STUNT POINTS',
  hint: 'D / → = gas, A / ← = brake & reverse. In the air, use ← / → to rotate. SPACE = nitro. Land on your wheels!', hintTouch: 'Hold ▶ to drive, ◀ to brake. In the air they rotate the car. ⚡ = nitro!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 980, WR = 17;
    const S = Object.assign({ eng: 0, tire: 0, nitro: 0, track: 0, unlocked: 1, bank: 0 }, E.data('save', {}));
    const TRACKS = [{ n: 'Desert Dunes', sky: ['#fbbf24', '#fde68a'], ground: ['#d97706', '#92400e'], len: 6000 }, { n: 'Neon Loop City', sky: ['#1e1b4b', '#7c3aed'], ground: ['#334155', '#0f172a'], len: 7000 }, { n: 'Mountain Mayhem', sky: ['#38bdf8', '#e0f2fe'], ground: ['#4d7c0f', '#365314'], len: 8000 }];
    let tr, pts, loop, coins, car, t = 0, cam = { x: 0, y: 0 }, score = 0, air = 0, rotAcc = 0, flips = 0, cp = { x: 100 }, crashT = 0, finished = false, nitro = 0, msg = '', msgT = 0, timeT = 0;
    function build(ti) {
      tr = TRACKS[ti]; const r = rng(ti * 991 + 5); pts = []; let x = -400, y = 0; pts.push([x, y]); x = 300; pts.push([x, y]);
      coins = []; loop = null;
      const add = (dx, dy) => { x += dx; y += dy; pts.push([x, y]); };
      const features = ti === 0 ? ['bump', 'ramp', 'flat', 'dunes', 'ramp', 'gap', 'bump', 'ramp', 'dunes', 'bigramp'] : ti === 1 ? ['flat', 'ramp', 'loop', 'flat', 'bump', 'ramp', 'gap', 'loop', 'stairs', 'bigramp'] : ['hill', 'ramp', 'gap', 'hill', 'stairs', 'bigramp', 'loop', 'hill', 'gap', 'bigramp'];
      for (const f of features) {
        if (f === 'flat') { add(300, 0); }
        else if (f === 'bump') { for (let i = 0; i < 6; i++) add(60, (i % 2 ? 1 : -1) * 30); add(100, 0); }
        else if (f === 'ramp') { add(100, 0); for (let i = 0; i < 5; i++) add(42, -12 - i * 4.5); add(40, 0); for (let i = 0; i < 4; i++) coins.push({ x: x + 80 + i * 70, y: y - 150 - Math.sin(i / 3 * Math.PI) * 60 }); add(260, 0); for (let i = 0; i < 6; i++) add(50, 26); add(200, 0); }
        else if (f === 'bigramp') { add(150, 0); for (let i = 0; i < 8; i++) add(50, -14 - i * 4.5); for (let i = 0; i < 6; i++) coins.push({ x: x + 100 + i * 90, y: y - 260 - Math.sin(i / 5 * Math.PI) * 120 }); add(700, 360); add(300, 0); }
        else if (f === 'dunes') { for (let i = 0; i < 12; i++) add(70, Math.sin(i * 0.9) * 50); }
        else if (f === 'hill') { for (let i = 0; i < 10; i++) add(60, -Math.cos(i / 9 * Math.PI) * 40 - 10); for (let i = 0; i < 10; i++) add(60, Math.cos(i / 9 * Math.PI) * 40 + 10); }
        else if (f === 'gap') { add(80, 0); add(60, -40); add(40, -30); pts.push(null); x += 230; y += 40; pts.push([x, y]); coins.push({ x: x - 115, y: y - 170 }); add(300, 0); }
        else if (f === 'stairs') { for (let i = 0; i < 5; i++) { add(80, 0); add(4, 40); } add(200, 0); }
        else if (f === 'loop') { add(400, 0); const R = 170, cx = x, cy = y - R; loop = loop || []; const arc = []; for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 - i / 40 * TAU; arc.push([cx + Math.cos(a) * R + i * 2.2, cy + Math.sin(a) * R]); } loop.push({ arc, cx, cy, R, x0: cx - 40, x1: cx + 120 }); coins.push({ x: cx, y: cy - R + 40 }); x += 120; add(300, 0); }
      }
      add(400, 0); tr.finish = x; add(800, 0);
      car = mkCar(100, -40); cp = { x: 100, y: -40 }; finished = false; timeT = 0; nitro = 3 + S.nitro * 2;
    }
    function mkCar(x, y) { const P = (px, py) => ({ x: px, y: py, px, py }); return { r: P(x - 40, y), f: P(x + 40, y), h: P(x, y - 46), loopA: null, loopDone: false }; }
    build(S.track);
    if (E.touch) E.pads([{ k: 'ArrowLeft', label: '◀', left: 16, bottom: 20, size: 84 }, { k: 'ArrowRight', label: '▶', right: 20, bottom: 20, size: 92 }, { k: 'Space', label: '⚡', right: 124, bottom: 30, size: 66 }]);
    function segs(near) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (!a || !b) continue; if (Math.max(a[0], b[0]) < near - 120 || Math.min(a[0], b[0]) > near + 120) continue; out.push([a[0], a[1], b[0], b[1]]); } if (loop) for (const L of loop) { if (near < L.x0 - 200 || near > L.x1 + 200) continue; if (car.activeLoop !== L) continue; const mi = Math.min(L.arc.length - 1, (car.loopIdx || 0) + 7); for (let i = 0; i < mi; i++) out.push([L.arc[i][0], L.arc[i][1], L.arc[i + 1][0], L.arc[i + 1][1]]); } return out; }
    const groundAt = (x) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (a && b && x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return 9999; };
    function crash(why) { if (crashT > 0) return; crashT = 1.4; E.sound('crash'); E.shake(10); fx.burst(car.h.x, car.h.y, 30, { col: ['#f97316', '#fde047', '#94a3b8'], spd: 260 }); msg = why || 'CRASH!'; msgT = 1.4; score = Math.max(0, score - 100); }
    function respawn() { car = mkCar(cp.x, groundAt(cp.x) - 40); }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (finished) return;
        if (crashT > 0) { crashT -= dt; if (crashT <= 0) respawn(); return; }
        timeT += dt;
        const steps = 4, h = dt / steps, K = E.key, gas = K('KeyD') || K('ArrowRight'), brk = K('KeyA') || K('ArrowLeft'), useN = (K('Space') || K('KeyW') || K('ArrowUp')) && nitro > 0;
        const power = 520 + S.eng * 110, grip = 0.35 + S.tire * 0.08;
        for (let s = 0; s < steps; s++) {
          const W = [car.r, car.f, car.h];
          for (const p of W) { const vx = (p.x - p.px) * 0.999, vy = (p.y - p.py) * 0.999; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + G * h * h; }
          // loop activation
          if (loop) for (const L of loop) { const cx = (car.r.x + car.f.x) / 2; if (!car.activeLoop && cx > L.cx - 60 && cx < L.cx + 10 && !L.used) { car.activeLoop = L; car.loopIdx = 0; } if (car.activeLoop === L) { const cy = (car.r.y + car.f.y) / 2; let bi = 0, bd = 1e9; L.arc.forEach((p, i) => { const d = dist(p[0], p[1], cx, cy); if (d < bd) { bd = d; bi = i; } }); if (bd < 90 && bi <= (car.loopIdx || 0) + 5) car.loopIdx = Math.max(car.loopIdx || 0, bi); if (cx > L.cx + 60 && cy > L.cy + L.R * 0.6) { car.activeLoop = null; L.used = true; score += 500; msg = 'LOOP! +500'; msgT = 1.5; E.sound('cheer'); } } }
          const near = car.r.x, S2 = segs(near);
          for (let it = 0; it < 6; it++) {
            const rig = (a, b, L0) => { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, df = (d - L0) / d / 2; a.x += dx * df; a.y += dy * df; b.x -= dx * df; b.y -= dy * df; };
            rig(car.r, car.f, 80); rig(car.r, car.h, Math.hypot(40, 46)); rig(car.f, car.h, Math.hypot(40, 46));
            for (const w of [car.r, car.f]) { w.touch = false; for (const g of S2) { const q = segDist(w.x, w.y, g[0], g[1], g[2], g[3]); if (q.d < WR + 0.5) { const pen = Math.max(0, WR - q.d), nx = (w.x - q.x) / (q.d || 1), ny = (w.y - q.y) / (q.d || 1); w.x += nx * pen; w.y += ny * pen; w.touch = true; w.tx = -ny; w.ty = nx; } } }
            for (const g of S2) { const q = segDist(car.h.x, car.h.y, g[0], g[1], g[2], g[3]); if (q.d < 10) { car.lastSeg = g.map(Math.round); crash('ROOF CRASH!'); return; } }
          }
          // drive & air control
          const grounded = car.r.touch || car.f.touch;
          for (const w of [car.r, car.f]) if (w.touch) { const vx = w.x - w.px, vy = w.y - w.py, tx = w.tx, ty = w.ty; const dir = tx * ((car.f.x - car.r.x)) + ty * ((car.f.y - car.r.y)) >= 0 ? 1 : -1; const vt = (vx * tx + vy * ty) * dir; let target = vt; if (gas) target = Math.min(vt + power * h * h * 4.5, (900 + S.eng * 120) * h); else if (brk) target = Math.max(vt - power * h * h * 3, -260 * h); else target = vt * 0.995; const dv = (target - vt) * grip; w.px -= tx * dv * dir; w.py -= ty * dv * dir; }
          if (!grounded) { const cx = (car.r.x + car.f.x) / 2, cy = (car.r.y + car.f.y) / 2, rot = (gas ? 1 : 0) - (brk ? 1 : 0); if (rot) { for (const p of [car.r, car.f, car.h]) { const dx = p.x - cx, dy = p.y - cy; p.px -= -dy * rot * 4 * h * h; p.py -= dx * rot * 4 * h * h; } } }
          if (useN) { const ax = car.f.x - car.r.x, ay = car.f.y - car.r.y, l = Math.hypot(ax, ay); for (const p of [car.r, car.f, car.h]) { p.px -= ax / l * 1400 * h * h; p.py -= ay / l * 1400 * h * h; } }
        }
        if (useN) { nitro = Math.max(0, nitro - dt); fx.burst(car.r.x - 20, car.r.y - 14, 2, { col: ['#60a5fa', '#fde047'], spd: 120, ang: Math.atan2(car.r.y - car.f.y, car.r.x - car.f.x), spread: 0.3, life: 0.3 }); }
        // airtime & flips
        const grounded = car.r.touch || car.f.touch, ang = Math.atan2(car.f.y - car.r.y, car.f.x - car.r.x);
        if (!grounded) { air += dt; if (car.lastA !== undefined) rotAcc += angDiff(ang, car.lastA); }
        else { if (air > 0.6) { const fl = Math.floor(Math.abs(rotAcc) / (TAU * 0.85)); const pts2 = Math.round(air * 60) + fl * 400; score += pts2; if (fl) { flips += fl; msg = (rotAcc > 0 ? 'FRONT' : 'BACK') + 'FLIP' + (fl > 1 ? ' x' + fl : '') + '! +' + pts2; E.sound('cheer'); } else { msg = 'AIR ' + air.toFixed(1) + 's +' + pts2; E.sound('score'); } msgT = 1.6; fx.burst(car.r.x, car.r.y + WR, 12, { col: '#fff', spd: 140 }); } air = 0; rotAcc = 0; }
        car.lastA = ang;
        // checkpoints, coins, fall, finish
        const cx = (car.r.x + car.f.x) / 2; if (grounded && cx > cp.x + 900) cp = { x: cx };
        for (const c of coins) if (!c.got && dist(c.x, c.y, cx, (car.r.y + car.f.y) / 2 - 20) < 50) { c.got = true; score += 50; S.bank += 5; E.sound('coin', 30); }
        if (car.r.y > groundAt(car.r.x) + 600 && car.r.y > 900) { crash('Fell off!'); }
        if (cx > tr.finish && !finished) { finished = true; const bonus = Math.max(0, Math.round(3000 - timeT * 30)); score += bonus + 1000; if (S.unlocked <= S.track + 1) S.unlocked = Math.min(TRACKS.length, S.track + 2); S.bank += 50; E.data && E.save('save', S); E.sound('win'); E.gameOver({ score, win: true, title: '🏁 ' + tr.n + ' complete!', lines: ['Time: ' + timeT.toFixed(1) + 's (bonus ' + bonus + ')', 'Flips: ' + flips + ' • Garage cash: $' + S.bank, S.track + 1 < TRACKS.length ? 'Next track unlocked in the 🔧 Garage!' : 'All tracks beaten!'] }); }
        cam.x += (cx + 200 - cam.x) * Math.min(1, dt * 4); cam.y += ((car.r.y + car.f.y) / 2 - 60 - cam.y) * Math.min(1, dt * 3);
        if ((gas || useN) && Math.random() < dt * 10) E.sound('engine', 60);
      },
      draw() {
        const W = E.W, H = E.H, z = Math.min(1.1, Math.min(W, H) / 620);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, tr.sky); ctx.fillRect(0, 0, W, H);
        if (S.track === 1) for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect((i * 137) % W, (i * 71) % (H * 0.6), 2, 2); } else { ctx.drawImage(E.glow(45), W * 0.8 - 80, 20, 160, 160); circle(ctx, W * 0.8, 100, 38, '#fef9c3'); }
        for (let l = 0; l < 2; l++) { const par = 0.2 + l * 0.2; ctx.fillStyle = S.track === 1 ? hsl(270 - l * 20, 50, 20 + l * 8) : hsl(S.track ? 140 : 30, 30, 50 - l * 10, 0.6); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 40; x += 40) { const wx = x + cam.x * par; ctx.lineTo(x, H * (0.55 + l * 0.1) - (S.track === 1 ? (Math.floor(wx / 80) % 3 + 1) * 40 : Math.abs(Math.sin(wx * 0.004 + l)) * 120)); } ctx.lineTo(W, H); ctx.fill(); }
        ctx.save(); ctx.translate(W * 0.4, H * 0.58); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
        // ground fill
        ctx.beginPath(); let started = false; for (const p of pts) { if (!p) { if (started) { ctx.lineTo(ctx._lx, 3000); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, cam.y, 0, cam.y + 900, tr.ground); ctx.fill(); ctx.beginPath(); started = false; } continue; } if (!started) { ctx.moveTo(p[0], 3000); ctx.lineTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); ctx._lx = p[0]; }
        ctx.lineTo(ctx._lx, 3000); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, cam.y, 0, cam.y + 900, tr.ground); ctx.fill();
        ctx.strokeStyle = S.track === 1 ? '#22d3ee' : '#fef3c7'; ctx.lineWidth = 6; ctx.beginPath(); started = false; for (const p of pts) { if (!p) { started = false; continue; } if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); } ctx.stroke();
        if (loop) for (const L of loop) { ctx.strokeStyle = S.track === 1 ? '#f472b6' : '#f97316'; ctx.lineWidth = 12; ctx.beginPath(); L.arc.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.stroke(); }
        // finish
        for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.fillRect(tr.finish + j * 14, groundAt(tr.finish) - 200 + i * 20, 14, 20); }
        for (const c of coins) if (!c.got) { const sq = Math.abs(Math.cos(t * 3 + c.x)); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 14 * sq + 1, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 9 * sq + 0.5, 9, 0, 0, TAU); ctx.fill(); }
        // car
        if (crashT <= 0 || Math.floor(t * 10) % 2) {
          const a = Math.atan2(car.f.y - car.r.y, car.f.x - car.r.x), cx = (car.r.x + car.f.x) / 2, cy = (car.r.y + car.f.y) / 2;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
          ctx.fillStyle = lgrad(ctx, 0, -50, 0, 0, ['#fca5a5', '#dc2626']); ctx.beginPath(); ctx.moveTo(-58, -6); ctx.lineTo(-56, -30); ctx.lineTo(-24, -34); ctx.lineTo(-8, -54); ctx.lineTo(26, -54); ctx.lineTo(42, -32); ctx.lineTo(60, -26); ctx.lineTo(62, -6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = '#bae6fd'; ctx.beginPath(); ctx.moveTo(-4, -50); ctx.lineTo(22, -50); ctx.lineTo(34, -34); ctx.lineTo(-14, -34); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fde047'; ctx.fillRect(56, -24, 6, 8); ctx.fillStyle = '#111'; ctx.fillRect(-60, -20, 8, 10);
          ctx.restore();
          for (const w of [car.r, car.f]) { ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.x / WR); circle(ctx, 0, 0, WR, '#111827'); circle(ctx, 0, 0, WR * 0.55, '#9ca3af'); ctx.fillStyle = '#4b5563'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-2, 0, 4, WR * 0.5); } ctx.restore(); }
        }
        fx.draw(ctx); ctx.restore();
        const prog = clamp((car.r.x) / tr.finish, 0, 1), bw = Math.min(360, W * 0.5); rr(ctx, W / 2 - bw / 2, 16, bw, 12, 6); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, 16, bw * prog, 12, 6); ctx.fillStyle = '#22c55e'; ctx.fill();
        label(ctx, tr.n + '  •  ' + fmt(score) + ' pts  •  ⏱ ' + timeT.toFixed(1), W / 2, 46, 16, '#fff');
        label(ctx, '⚡ ' + nitro.toFixed(1) + 's', W - 70, H - 40, 18, '#93c5fd');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.25, 30, '#fde047');
      },
      _dbg: () => ({ seg: car.lastSeg, hx: Math.round(car.h.x), hy: Math.round(car.h.y), x: Math.round(car.r.x), y: Math.round(car.r.y), score, crashT, finished, g: !!(car.r.touch || car.f.touch), a: +Math.atan2(car.f.y - car.r.y, car.f.x - car.r.x).toFixed(2) }),
      hud() { return null; },
      extra: { label: '🔧 Garage', action: () => {
        const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 Garage cash $${S.bank}</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid';
        const mk = (title, sub, btn, dis, fn) => { const el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4>${title}</h4><small>${sub}</small>`; const b = document.createElement('button'); b.textContent = btn; b.disabled = dis; b.onclick = fn; el.appendChild(b); grid.appendChild(el); };
        [['eng', '🔥 Engine', 'More power & top speed'], ['tire', '🛞 Tires', 'Better grip'], ['nitro', '⚡ Nitro Tank', '+2s nitro per run']].forEach(([k, n, d]) => { const c = 60 * Math.pow(2, S[k]); mk(n + ' <span class="lv">Lv ' + S[k] + '</span>', d, S[k] >= 5 ? 'MAX' : '$' + c, S.bank < c || S[k] >= 5, () => { S.bank -= c; S[k]++; E.save('save', S); E.sound('buy'); E.panel.close(); build(S.track); }); });
        TRACKS.forEach((T, i) => mk('🏁 ' + T.n + (S.track === i ? ' <span class="lv">ACTIVE</span>' : ''), i < S.unlocked ? 'Unlocked' : 'Finish the previous track to unlock', i < S.unlocked ? 'Race here' : '🔒', i >= S.unlocked || S.track === i, () => { S.track = i; E.save('save', S); E.panel.close(); build(i); score = 0; flips = 0; }));
        g.appendChild(grid); E.panel.open('🔧 Garage & Tracks', g); } },
      destroy() { E.save('save', S); E.pads(null); }
    };
  }
});
