/* =====================================================================
   BOTTLE JUMP 3D
   ===================================================================== */
registerGame({
  id: 'bottle', title: 'Bottle Jump 3D', emoji: '🍶', c1: '#43cea2', c2: '#185a9d', cats: ['Physics', 'Arcade'], featured: true, pop: true, hot: true, isNew: true,
  desc: 'Hold to charge, release to flip your bottle onto tables, shelves, couches and moving trays. Land it upright – or nail a cap landing for bonus points!',
  controls: 'Hold & release (mouse / touch / Space)', scoreLabel: 'FLIPS',
  hint: 'Hold the mouse / SPACE to charge, release to jump. Land the bottle upright! Upside-down cap landing = +3.', hintTouch: 'Hold to charge, release to flip. Land upright – cap landings score +3!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 1900, BH = 74, BW = 28;
    const BOTTLES = [
      { n: 'Aqua', need: 0, glass: '#7dd3fc', liq: '#38bdf8', cap: '#1d4ed8', lab: '#e0f2fe', txt: 'AQUA' },
      { n: 'Cola Fizz', need: 5, glass: '#7f1d1d', liq: '#3f0d0d', cap: '#dc2626', lab: '#ef4444', txt: 'FIZZ' },
      { n: 'Orange Zing', need: 10, glass: '#fdba74', liq: '#f97316', cap: '#16a34a', lab: '#fef3c7', txt: 'ZING' },
      { n: 'Lime Spark', need: 20, glass: '#bbf7d0', liq: '#4ade80', cap: '#a3e635', lab: '#14532d', txt: 'LIME' },
      { n: 'Milk Glass', need: 30, glass: '#f8fafc', liq: '#ffffff', cap: '#60a5fa', lab: '#1e3a8a', txt: 'MILK' },
      { n: 'Galaxy', need: 45, glass: '#312e81', liq: '#a855f7', cap: '#f472b6', lab: '#22d3ee', txt: '★★★' },
      { n: 'Golden', need: 60, glass: '#fde68a', liq: '#f59e0b', cap: '#92400e', lab: '#fff7ed', txt: 'GOLD' }
    ];
    const THEMES = [
      { n: 'Living Room', wall: ['#fde2c8', '#f5c9a4'], floor: ['#b07a4b', '#8a5a32'], acc: '#e07a5f' },
      { n: 'Kitchen', wall: ['#d9f99d', '#bef264'], floor: ['#e5e7eb', '#9ca3af'], acc: '#16a34a' },
      { n: 'Game Room', wall: ['#c7d2fe', '#a5b4fc'], floor: ['#475569', '#334155'], acc: '#6366f1' },
      { n: 'Garage', wall: ['#e7e5e4', '#a8a29e'], floor: ['#57534e', '#3f3f46'], acc: '#f59e0b' },
      { n: 'Space Lab', wall: ['#1e1b4b', '#0f172a'], floor: ['#334155', '#1e293b'], acc: '#22d3ee' }
    ];
    let sel = clamp(E.data('bottle', 0), 0, BOTTLES.length - 1), best = E.best();
    if (BOTTLES[sel].need > best) sel = 0;
    const plats = []; let lastX = 0;
    const B = { x: 0, y: 0, vx: 0, vy: 0, a: 0, w: 0, state: 'idle', on: null, wob: 0, wobV: 0, slosh: 0 };
    let charging = false, power = 0, score = 0, camX = 0, t = 0, streak = 0, msg = '', msgT = 0, deadT = 0, theme = 0, ideal = 0, wtarget = null;
    function addPlat() {
      const lvl = Math.min(1, plats.length / 40), kinds = ['table', 'shelf', 'couch', 'stool', 'box', 'table', 'couch'].concat(plats.length > 6 ? ['tray', 'tray'] : []);
      const k = plats.length < 2 ? 'table' : pick(kinds);
      const w = k === 'couch' ? rand(150, 200) - lvl * 30 : k === 'stool' ? rand(60, 80) - lvl * 10 : k === 'shelf' ? rand(90, 130) - lvl * 20 : k === 'tray' ? rand(80, 110) - lvl * 15 : rand(110, 170) - lvl * 30;
      const h = k === 'couch' ? rand(80, 110) : k === 'shelf' ? rand(170, 260) : k === 'stool' ? rand(100, 140) : k === 'box' ? rand(60, 120) : k === 'tray' ? rand(120, 220) : rand(110, 160);
      const gap = plats.length ? rand(110, 230) + lvl * 70 : 0, x = lastX + gap;
      const p = { k, x, w, h, baseH: h, ph: rand(0, TAU), hue: rand(0, 360), mv: k === 'tray' ? (Math.random() < 0.5 ? 'v' : 'h') : null, x0: x };
      plats.push(p); lastX = x + w;
    }
    for (let i = 0; i < 6; i++) addPlat();
    B.on = plats[0]; B.x = plats[0].x + plats[0].w * 0.45; B.y = -plats[0].h;
    function top(p) { return -p.h; }
    function launch() {
      if (B.state !== 'idle') return;
      const p = clamp(power, 0.05, 1); charging = false;
      B.vx = 260 + 620 * p; B.vy = -(560 + 520 * p);
      // spin rate: one full flip for the ideal jump to the next platform
      const i = plats.indexOf(B.on), nx = plats[i + 1] || plats[i];
      const tx = nx.x + nx.w / 2 - B.x; let pp = 0.5;
      for (let it = 0; it < 30; it++) { const vx = 260 + 620 * pp, vy = -(560 + 520 * pp), dh = top(nx) - B.y; const T = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * G * dh))) / G; const d = vx * T; pp = clamp(pp + (tx - d) / 900, 0.05, 1); }
      const vy0 = -(560 + 520 * pp), dh0 = top(nx) - B.y, T0 = (-vy0 + Math.sqrt(Math.max(0, vy0 * vy0 + 2 * G * dh0))) / G;
      ideal = pp; B.w = TAU / Math.max(0.45, T0);
      B.state = 'air'; B.on = null; B.cx = B.x; B.cy = B.y - BH / 2; E.sound('whoosh'); power = 0;
      fx.burst(B.x, B.y, 8, { col: '#fff', spd: 80, size: 3 });
    }
    function fail(reason) {
      if (B.state === 'dead') return; B.state = 'dead'; deadT = 0; E.sound('thud'); E.shake(6); streak = 0;
      E.gameOver({ score, title: reason, lines: ['Flips landed: ' + score, 'Bottle: ' + BOTTLES[sel].n], delay: 1300 });
    }
    function land(p, cap) {
      B.state = 'idle'; B.on = p; B.y = top(p); B.vx = B.vy = 0; const err = angDiff(B.a, cap ? Math.PI : 0); B.a = cap ? Math.PI : 0; B.wob = err * 0.6; B.wobV = 0; B.slosh = 1;
      const center = Math.abs(B.x - (p.x + p.w / 2)) < p.w * 0.12;
      const pts = (cap ? 3 : 1) + (center ? 1 : 0); score += pts; streak++;
      msg = cap ? 'CAP FLIP! +' + pts : center ? 'PERFECT! +' + pts : ['Nice!', 'Great!', 'Clean!', 'Smooth!'][irand(0, 3)]; msgT = 1.2;
      E.sound(cap ? 'rare' : 'land'); if (center || cap) E.sound('score');
      fx.burst(B.x, B.y, cap ? 40 : 16, { col: cap ? ['#fde047', '#fff', '#f472b6'] : ['#fff', '#bae6fd'], spd: cap ? 300 : 160, shape: cap ? 'star' : 'c', size: cap ? 7 : 4, up: 60 });
      fx.text(B.x, B.y - 120, '+' + pts, cap ? '#fde047' : '#fff', 30);
      if (score >= 10) E.ach('bottle10');
      const nt = Math.floor(score / 10) % THEMES.length; if (nt !== theme) { theme = nt; msg = '🏠 ' + THEMES[theme].n; msgT = 2; E.sound('power'); }
      BOTTLES.forEach(b => { if (b.need > best && score >= b.need) { E.toast('🍶 New bottle unlocked: ' + b.n); } }); best = Math.max(best, score);
      while (plats.length < plats.indexOf(p) + 6) addPlat();
    }
    function ends() { const c = Math.cos(B.a), s = Math.sin(B.a); return { base: [B.x - s * 0, B.y], cap: [B.x + s * BH, B.y - c * BH] }; }
    function openBottles() {
      const d = document.createElement('div'); d.className = 'shopgrid';
      BOTTLES.forEach((b, i) => { const ok = best >= b.need; const el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4><i>🍶</i>${b.n}<span class="lv">${i === sel ? 'EQUIPPED' : ok ? 'UNLOCKED' : '🔒 ' + b.need + ' flips'}</span></h4><div style="height:18px;border-radius:8px;background:linear-gradient(90deg,${b.glass},${b.liq},${b.cap})"></div><button ${ok ? '' : 'disabled'}>${i === sel ? '✓ Selected' : ok ? 'Use this bottle' : 'Locked'}</button>`; el.querySelector('button').onclick = () => { if (!ok) return; sel = i; E.save('bottle', i); E.panel.close(); }; d.appendChild(el); });
      E.panel.open('🍶 Bottle Collection – best: ' + best + ' flips', d);
    }
    function drawBottle(x, y, a, b) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + (B.state === 'idle' ? B.wob : 0));
      ellipse(ctx, 0, 0, BW * 0.5, 4, 'rgba(0,0,0,.0)');
      // body path (base at 0, up negative)
      const body = () => { ctx.beginPath(); ctx.moveTo(-BW / 2, -6); ctx.quadraticCurveTo(-BW / 2, 0, -BW / 2 + 6, 0); ctx.lineTo(BW / 2 - 6, 0); ctx.quadraticCurveTo(BW / 2, 0, BW / 2, -6); ctx.lineTo(BW / 2, -BH * 0.62); ctx.quadraticCurveTo(BW / 2, -BH * 0.78, 6, -BH * 0.86); ctx.lineTo(6, -BH + 8); ctx.lineTo(-6, -BH + 8); ctx.lineTo(-6, -BH * 0.86); ctx.quadraticCurveTo(-BW / 2, -BH * 0.78, -BW / 2, -BH * 0.62); ctx.closePath(); };
      body(); ctx.fillStyle = b.glass; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
      // liquid
      ctx.save(); body(); ctx.clip(); const lv = -BH * 0.5, sl = Math.sin(t * 9) * B.slosh * 6 + Math.sin(a) * 10;
      ctx.rotate(-(a + (B.state === 'idle' ? B.wob : 0))); ctx.fillStyle = b.liq; ctx.globalAlpha = 0.85;
      // liquid stays level in world space
      const ca = Math.cos(a), sa = Math.sin(a), cx = -sa * BH * 0.3, cy = -ca * BH * 0.3;
      ctx.beginPath(); ctx.moveTo(cx - 80, cy + sl * 0.3 + 6); ctx.quadraticCurveTo(cx, cy - sl + 6, cx + 80, cy + sl * 0.3 + 6); ctx.lineTo(cx + 80, cy + 200); ctx.lineTo(cx - 80, cy + 200); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = 'rgba(15,23,42,.55)'; ctx.lineWidth = 2; body(); ctx.stroke();
      ctx.fillStyle = b.lab; ctx.fillRect(-BW / 2 + 1, -BH * 0.5, BW - 2, BH * 0.22); ctx.fillStyle = b.cap; ctx.font = '900 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText(b.txt, 0, -BH * 0.38);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-BW / 2 + 4, -BH * 0.75, 4, BH * 0.68);
      ctx.fillStyle = b.cap; rr(ctx, -8, -BH, 16, 11, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
      ctx.restore();
    }
    function drawPlat(p, X) {
      const x = X(p.x), y = -p.h, w = p.w, d = 26, th = THEMES[theme];
      ctx.save(); ctx.translate(x, 0);
      // shadow on floor
      ellipse(ctx, w / 2 + 10, 6, w * 0.6, 10, 'rgba(0,0,0,.18)');
      if (p.k === 'table' || p.k === 'stool') {
        const legC = p.k === 'stool' ? '#7c2d12' : '#78350f';
        ctx.fillStyle = legC; ctx.fillRect(6, y + 10, 8, p.h - 10); ctx.fillRect(w - 14, y + 10, 8, p.h - 10); ctx.fillStyle = '#5b2a0e'; ctx.fillRect(16 + d * 0.4, y + 4, 6, p.h - 14); ctx.fillRect(w - 8 + d * 0.4, y + 4, 6, p.h - 14);
        ctx.fillStyle = p.k === 'stool' ? '#ea580c' : '#b45309'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w, y); ctx.fill();
        ctx.fillStyle = p.k === 'stool' ? '#c2410c' : '#92400e'; ctx.fillRect(0, y, w, 12);
      } else if (p.k === 'couch') {
        const c = hsl(p.hue, 45, 48), c2 = hsl(p.hue, 45, 38);
        ctx.fillStyle = c2; rr(ctx, -10, y - 30, w + 20 + d * 0.6, 34, 10); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w, y); ctx.fill();
        ctx.fillStyle = c2; rr(ctx, 0, y, w, p.h - 14, 6); ctx.fill(); ctx.fillStyle = hsl(p.hue, 45, 30); ctx.fillRect(6, -14, 8, 14); ctx.fillRect(w - 14, -14, 8, 14);
        ctx.fillStyle = c; rr(ctx, -16, y - 10, 18, p.h - 14, 7); ctx.fill(); rr(ctx, w - 2, y - 10, 18, p.h - 14, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.moveTo(w / 2, y + 2); ctx.lineTo(w / 2, y + p.h * 0.4); ctx.stroke();
      } else if (p.k === 'shelf') {
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(w * 0.2, y + 10, 6, 24); ctx.fillRect(w * 0.75, y + 10, 6, 24);
        ctx.fillStyle = '#d6d3d1'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w, y); ctx.fill(); ctx.fillStyle = '#a8a29e'; ctx.fillRect(0, y, w, 10);
        // books on shelf ends
        for (let i = 0; i < 3; i++) { ctx.fillStyle = hsl(p.hue + i * 50, 60, 50); ctx.fillRect(w - 6 - i * 7 + d * 0.3, y - 26 - (i % 2) * 4, 6, 26 + (i % 2) * 4); }
      } else if (p.k === 'box') {
        ctx.fillStyle = '#d4a373'; ctx.fillRect(0, y, w, p.h); ctx.fillStyle = '#e9c46a'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w, y); ctx.fill();
        ctx.fillStyle = '#b07a4b'; ctx.beginPath(); ctx.moveTo(w, y); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, -d * 0.4); ctx.lineTo(w, 0); ctx.fill();
        ctx.fillStyle = 'rgba(120,80,40,.5)'; ctx.fillRect(w / 2 - 8, y, 16, p.h); ctx.fillStyle = '#7c2d12'; ctx.font = '700 11px system-ui'; ctx.fillText('FRAGILE', 8, y + p.h / 2);
      } else if (p.k === 'tray') {
        ctx.fillStyle = 'rgba(148,163,184,.5)'; ctx.fillRect(w / 2 - 3, y + 8, 6, p.h - 8);
        ctx.fillStyle = th.acc; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d * 0.6, y - d * 0.4); ctx.lineTo(w + d * 0.6, y - d * 0.4); ctx.lineTo(w, y); ctx.fill(); ctx.fillStyle = '#1f2937'; ctx.fillRect(0, y, w, 9);
        ctx.fillStyle = '#fde047'; ctx.font = '900 10px system-ui'; ctx.fillText(p.mv === 'v' ? '⇕' : '⇔', w / 2 - 4, y + 22);
      }
      ctx.restore();
    }
    const ui = UI();
    return {
      extra: { label: '🍶 Bottles', action: openBottles },
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        for (const p of plats) if (p.mv) { if (p.mv === 'v') p.h = p.baseH + Math.sin(t * 1.4 + p.ph) * 50; else p.x = p.x0 + Math.sin(t * 1.1 + p.ph) * 50; }
        if (charging) power = Math.min(1, power + dt * 0.8);
        if (B.state === 'idle') {
          if (B.on && B.on.mv) { B.y = top(B.on); if (B.on.mv === 'h') { if (B._px !== undefined) B.x += B.on.x - B._px; } B._px = B.on.x; } else B._px = undefined;
          B.wobV += (-B.wob * 120 - B.wobV * 8) * dt; B.wob += B.wobV * dt; B.slosh = Math.max(0, B.slosh - dt * 1.5);
          if (B.on && (B.x < B.on.x - 4 || B.x > B.on.x + B.on.w + 4)) { B.state = 'air'; B.vx = 0; B.vy = 0; B.w = 3; B.cx = B.x; B.cy = B.y - BH / 2; }
        } else if (B.state === 'air') {
          B.vy += G * dt; B.cx += B.vx * dt; B.cy += B.vy * dt; B.a += B.w * dt; B.x = B.cx - BH / 2 * Math.sin(B.a); B.y = B.cy + BH / 2 * Math.cos(B.a);
          if (B.vy > 0) {
            for (const p of plats) {
              const ty = top(p), e = ends();
              const nrm = ((B.a % TAU) + TAU) % TAU, up = Math.abs(angDiff(nrm, 0)), dn = Math.abs(angDiff(nrm, Math.PI)), tol = Math.max(0.3, 0.5 - score * 0.004);
              const testEnd = (pt) => pt[1] >= ty && pt[1] - B.vy * dt * 1.5 <= ty + 2 && pt[0] >= p.x - 2 && pt[0] <= p.x + p.w + 2;
              if (up < tol && testEnd(e.base)) { land(p, false); break; }
              if (dn < tol * 0.8 && testEnd(e.cap)) { B.x = e.cap[0]; land(p, true); B.y = ty - BH; break; }
              if (testEnd(e.base) || testEnd(e.cap) || (B.y > ty && B.y < ty + 30 && B.x > p.x && B.x < p.x + p.w)) { fx.burst(B.x, ty, 10, { col: '#fff', spd: 120 }); return fail(up < 1.2 || dn < 1.2 ? 'Wobbled Over!' : 'Bad Landing!'); }
            }
            if (B.y > 0) { B.y = 0; return fail('Hit the Floor!'); }
          }
        } else if (B.state === 'dead') { deadT += dt; B.a += (B.a % TAU > Math.PI ? 1 : -1) * 0; B.vy += G * dt; B.y = Math.min(0, B.y + B.vy * dt * 0.4); B.a = lerp(B.a, Math.PI / 2 * (B.a % TAU > Math.PI ? 3 : 1), Math.min(1, dt * 5)); }
        const tx = B.x - E.W * 0.3 / Math.min(E.H / 680, E.W / 900); camX += (tx - camX) * Math.min(1, dt * 3);
      },
      draw() {
        const W = E.W, H = E.H, s = Math.min(H / 680, W / 900), th = THEMES[theme], fy = H * 0.86;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, fy, th.wall); ctx.fillRect(0, 0, W, fy);
        // wallpaper pattern
        ctx.fillStyle = 'rgba(255,255,255,.12)'; const off = -(camX * s * 0.4) % 60; for (let x = off; x < W; x += 60) for (let y = 20; y < fy; y += 60) { circle(ctx, x, y + ((x - off) / 60 % 2) * 30, 6); ctx.fill(); }
        // windows & frames (parallax)
        const per = Math.ceil((W + 520) / 520) * 520;
        for (let i = 0; i < per / 520; i++) {
          const wx = ((i * 520 - camX * s * 0.5) % per + per) % per - 260;
          if (theme === 4) { ctx.fillStyle = '#020617'; rr(ctx, wx, H * 0.12, 200, 160, 80); ctx.fill(); for (let k = 0; k < 12; k++) { ctx.fillStyle = '#fff'; ctx.fillRect(wx + (k * 37) % 180 + 10, H * 0.12 + (k * 53) % 140 + 10, 2, 2); } circle(ctx, wx + 140, H * 0.12 + 60, 22, '#60a5fa'); ctx.strokeStyle = th.acc; ctx.lineWidth = 6; rr(ctx, wx, H * 0.12, 200, 160, 80); ctx.stroke(); continue; }
          ctx.fillStyle = '#fff'; ctx.fillRect(wx - 8, H * 0.1 - 8, 196, 176); ctx.fillStyle = lgrad(ctx, 0, H * 0.1, 0, H * 0.1 + 160, ['#7dd3fc', '#e0f2fe']); ctx.fillRect(wx, H * 0.1, 180, 160);
          ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.ellipse(wx + 90, H * 0.1 + 170, 120, 50, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(wx + 86, H * 0.1, 8, 160); ctx.fillRect(wx, H * 0.1 + 76, 180, 8);
          ctx.fillStyle = th.acc; ctx.fillRect(wx - 20, H * 0.1 - 16, 22, 196); ctx.fillRect(wx + 178, H * 0.1 - 16, 22, 196);
          // picture frame
          ctx.fillStyle = '#7c2d12'; ctx.fillRect(wx + 270, H * 0.16, 90, 70); ctx.fillStyle = hsl(i * 70 + 20, 60, 65); ctx.fillRect(wx + 278, H * 0.16 + 8, 74, 54); circle(ctx, wx + 315, H * 0.16 + 35, 14, hsl(i * 70 + 200, 60, 60));
        }
        // floor
        ctx.fillStyle = lgrad(ctx, 0, fy, 0, H, th.floor); ctx.fillRect(0, fy, W, H - fy);
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; const bo = -(camX * s) % 90; for (let x = bo; x < W + 90; x += 90) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x - 60, H); ctx.stroke(); }
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, fy, W, 6);
        // world
        ctx.save(); ctx.translate(0, fy); ctx.scale(s, s);
        const X = x => x - camX;
        for (const p of plats) { if (X(p.x) > W / s + 50 || X(p.x + p.w) < -100) continue; drawPlat(p, X); }
        // aim preview arc
        if (B.state === 'idle' && charging) {
          const vx = 260 + 620 * power, vy = -(560 + 520 * power); ctx.fillStyle = 'rgba(255,255,255,.8)';
          for (let k = 1; k < 14; k++) { const tt = k * 0.05; const px = X(B.x) + vx * tt, py = B.y - BH / 2 + vy * tt + G * tt * tt / 2; circle(ctx, px, py, 3.5 - k * 0.15); ctx.fill(); }
        }
        // bottle shadow
        ctx.save(); ctx.translate(-camX, 0);
        drawBottle(B.x, B.y, B.a, BOTTLES[sel]);
        fx.draw(ctx);
        ctx.restore();
        ctx.restore();
        // power meter
        if (B.state === 'idle') {
          const bw = Math.min(280, W * 0.6), bx = W / 2 - bw / 2, by = H - 42;
          rr(ctx, bx, by, bw, 18, 9); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); rr(ctx, bx, by, bw * power, 18, 9); ctx.fillStyle = lgrad(ctx, bx, 0, bx + bw, 0, ['#4ade80', '#facc15', '#ef4444']); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rr(ctx, bx, by, bw, 18, 9); ctx.stroke();
          if (!charging && score === 0) label(ctx, E.touch ? 'HOLD to charge • RELEASE to flip' : 'HOLD mouse / SPACE • RELEASE to flip', W / 2, by - 22, 18);
        }
        label(ctx, String(score), W / 2, 60, 54, '#fff');
        label(ctx, THEMES[theme].n.toUpperCase(), W / 2, 98, 14, 'rgba(255,255,255,.85)');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.3, 34, '#fde047');
      },
      down() { if (B.state === 'idle') { charging = true; power = 0; } },
      up() { if (charging) launch(); },
      onKey(c) { if (c === 'Space' && B.state === 'idle' && !charging) { charging = true; power = 0; } },
      onKeyUp(c) { if (c === 'Space' && charging) launch(); },
      hud() { return { stats: [['Best', fmt(Math.max(best, score))], ['Streak', streak]] }; }
    };
  }
});
