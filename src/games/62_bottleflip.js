/* =====================================================================
   BOTTLE FLIP  (swipe-to-flip water bottle with level challenges)
   ===================================================================== */
registerGame({
  id: 'bottleflip', title: 'Bottle Flip', emoji: '🧴', c1: '#38bdf8', c2: '#1d4ed8', cats: ['Physics', 'Arcade', 'Popular'], featured: true, hot: true, pop: true, isNew: true, tags: 'bottle flip water',
  desc: 'Swipe up to toss a realistic water bottle into a spinning flip and land it upright on the glowing target – tables, shelves, books and moving trays. 12 challenge levels, then endless!',
  controls: 'Swipe / drag up • or hold Space', scoreLabel: 'FLIPS',
  hint: 'Drag UP from the bottle and release – a longer, faster swipe = higher toss. Aim sideways to reach other surfaces. Or hold SPACE to charge. Land upright on the glowing target!', hintTouch: 'Swipe UP on the bottle to flip it (swipe sideways to aim). Land it upright on the glowing target!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), G = 2000, BH = 120, BW = 44, VW = 1000, VH = 640;
    // surfaces: x, w, y (top), kind, move
    const LEVELS = [
      { n: 'Kitchen Table', need: 3, s: [{ x: 300, w: 400, y: 470, k: 'table', target: true }] },
      { n: 'Hit the Coaster', need: 3, s: [{ x: 250, w: 500, y: 470, k: 'table' }, { x: 470, w: 70, y: 470, k: 'coaster', target: true }] },
      { n: 'Up to the Shelf', need: 2, s: [{ x: 150, w: 260, y: 470, k: 'table' }, { x: 600, w: 160, y: 330, k: 'shelf', target: true }], alt: true },
      { n: 'Book Stack', need: 3, s: [{ x: 120, w: 300, y: 470, k: 'table' }, { x: 600, w: 110, y: 400, k: 'books', target: true }], alt: true },
      { n: 'Double Flip!', need: 2, s: [{ x: 300, w: 400, y: 470, k: 'table', target: true }], double: true },
      { n: 'Moving Tray', need: 3, s: [{ x: 120, w: 240, y: 470, k: 'table' }, { x: 560, w: 110, y: 400, k: 'tray', target: true, move: 140 }], alt: true },
      { n: 'Cap Landing', need: 1, s: [{ x: 300, w: 400, y: 470, k: 'table', target: true }], cap: true },
      { n: 'Stairway', need: 3, s: [{ x: 100, w: 200, y: 500, k: 'table' }, { x: 420, w: 150, y: 400, k: 'shelf' }, { x: 700, w: 140, y: 300, k: 'shelf', target: true }], chain: true },
      { n: 'Tiny Target', need: 3, s: [{ x: 250, w: 500, y: 470, k: 'table' }, { x: 480, w: 46, y: 470, k: 'coaster', target: true }] },
      { n: 'Speedy Tray', need: 3, s: [{ x: 100, w: 220, y: 470, k: 'table' }, { x: 560, w: 100, y: 360, k: 'tray', target: true, move: 220, sp: 1.6 }], alt: true },
      { n: 'Fridge Top', need: 2, s: [{ x: 120, w: 260, y: 480, k: 'table' }, { x: 640, w: 140, y: 230, k: 'fridge', target: true }], alt: true },
      { n: 'Grand Finale', need: 4, s: [{ x: 100, w: 180, y: 480, k: 'table' }, { x: 400, w: 120, y: 380, k: 'books' }, { x: 680, w: 100, y: 300, k: 'tray', move: 120 }], chain: true, double: false }
    ];
    let li = Math.min(E.data('lvl', 0), LEVELS.length - 1), L, surf, B, lives = 3, prog = 0, score = 0, t = 0, swipe = null, charge = 0, charging = false, view, msg = '', msgT = 0, over = false, streak = 0, targetIdx = 0;
    function load(i) {
      li = i; const base = LEVELS[Math.min(i, LEVELS.length - 1)]; L = Object.assign({}, base);
      if (i >= LEVELS.length) { L = { n: 'Endless #' + (i - LEVELS.length + 1), need: 3, s: [{ x: 100, w: 200, y: 480, k: 'table' }, { x: rand(420, 760), w: rand(50, 110), y: rand(260, 440), k: pick(['tray', 'books', 'shelf']), move: Math.random() < 0.5 ? rand(80, 200) : 0, target: true }], alt: true }; }
      surf = L.s.map(s => Object.assign({ x0: s.x }, s)); prog = 0; lives = 3; targetIdx = surf.findIndex(s => s.target); if (L.chain) targetIdx = 1;
      const st = surf[0]; B = mk(st.x + st.w / 2 - (st.target ? 60 : 0), st.y); msg = 'LEVEL ' + (i + 1) + ': ' + L.n; msgT = 2.2;
    }
    function mk(x, y) { return { x, y, cx: x, cy: y - BH / 2, vx: 0, vy: 0, a: 0, w: 0, state: 'idle', on: null, wob: 0, wv: 0, slosh: 0, total: 0, liq: 0 }; }
    load(li);
    function onSurface() { for (const s of surf) if (B.x >= s.x - 4 && B.x <= s.x + s.w + 4 && Math.abs(B.y - s.y) < 3) return s; return null; }
    function toss(dx, dy) {
      if (B.state !== 'idle' || over) return; const p = clamp(Math.hypot(dx, dy) / 300, 0.25, 1.25);
      B.vy = -(700 + p * 650); B.vx = clamp(dx * 2.2, -650, 650);
      // spin so that one (or two) full flips complete as it comes down onto the glowing target's height
      const tg = surf[targetIdx], dh = tg.y - B.y, Tl = (-B.vy + Math.sqrt(Math.max(1, B.vy * B.vy + 2 * G * dh))) / G;
      B.w = (L.double ? 2 : 1) * TAU / Math.max(0.35, Tl) * (dx < 0 ? -1 : 1) * (L.cap ? 0.5 * 1 : 1) * rand(0.97, 1.03); if (L.cap) B.w = Math.PI / Math.max(0.35, Tl) * (dx < 0 ? -1 : 1); B.total = 0;
      B.state = 'air'; B.cx = B.x; B.cy = B.y - BH / 2; B.on = null; E.sound('whoosh'); B.slosh = 1;
    }
    function land(s, cap) {
      B.state = 'idle'; B.y = s.y; B.vx = B.vy = 0; const err = angDiff(B.a, cap ? Math.PI : 0); B.a = cap ? Math.PI : 0; B.wob = err * 0.7; B.wv = 0; B.on = s; B.slosh = 1;
      const isT = surf.indexOf(s) === targetIdx, centered = Math.abs(B.x - (s.x + s.w / 2)) < s.w * 0.18, doubled = Math.abs(B.total) > TAU * 1.6;
      let ok = isT && (!L.double || doubled) && (!L.cap || cap);
      if (ok) { prog++; streak++; const pts = 1 + (cap ? 4 : 0) + (centered ? 1 : 0) + (doubled ? 2 : 0) + Math.min(streak - 1, 5); score += pts; E.sound(cap ? 'rare' : 'score'); fx.burst(B.x, B.y, 30, { col: ['#fde047', '#7dd3fc', '#fff'], spd: 260, shape: 'star' }); fx.text(B.x, B.y - 170, (cap ? 'CAP FLIP! ' : doubled ? 'DOUBLE! ' : centered ? 'PERFECT! ' : 'NICE! ') + '+' + pts, '#fde047', 28); E.submitBest(score);
        if (L.alt) targetIdx = targetIdx === 0 ? surf.findIndex(q => q.target) : 0; if (L.chain) targetIdx = Math.min(surf.length - 1, targetIdx + 1) === targetIdx ? 0 : targetIdx + 1;
        if (prog >= L.need) { msg = '🏆 LEVEL COMPLETE!'; msgT = 1.6; E.sound('win'); E.coins(5 + li * 2); setTimeout(() => { if (E.g === api) { E.save('lvl', li + 1); load(li + 1); } }, 1600); } }
      else { E.sound('land'); fx.text(B.x, B.y - 170, !isT ? 'Wrong spot – aim for the glow!' : L.double ? 'Needs a DOUBLE flip!' : L.cap ? 'Land on the CAP!' : 'Upright!', '#fff', 20); }
    }
    function fail(why) { if (B.state === 'fall') return; B.state = 'fall'; B.fallT = 0; streak = 0; lives--; E.sound('thud'); E.shake(6); msg = why + (lives > 0 ? '  ❤️ ' + lives + ' left' : ''); msgT = 1.6;
      setTimeout(() => { if (E.g !== api) return; if (lives <= 0) { over = true; E.gameOver({ score, title: 'Out of bottles!', lines: ['Reached level ' + (li + 1) + ': ' + L.n, 'Flips landed: ' + score] }); } else { const st = surf[L.chain ? 0 : (targetIdx === 0 ? 0 : 0)]; B = mk(st.x + Math.min(st.w / 2, 100), st.y); } }, 1100); }
    function drawBottle(x, y, a, wob) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + wob);
      const body = () => { ctx.beginPath(); ctx.moveTo(-BW / 2, -8); ctx.quadraticCurveTo(-BW / 2, 0, -BW / 2 + 8, 0); ctx.lineTo(BW / 2 - 8, 0); ctx.quadraticCurveTo(BW / 2, 0, BW / 2, -8); ctx.lineTo(BW / 2, -BH * 0.58); ctx.bezierCurveTo(BW / 2, -BH * 0.74, 9, -BH * 0.8, 9, -BH * 0.88); ctx.lineTo(9, -BH + 12); ctx.lineTo(-9, -BH + 12); ctx.lineTo(-9, -BH * 0.88); ctx.bezierCurveTo(-9, -BH * 0.8, -BW / 2, -BH * 0.74, -BW / 2, -BH * 0.58); ctx.closePath(); };
      body(); ctx.fillStyle = 'rgba(186,230,253,.38)'; ctx.fill();
      // water stays level in world space
      ctx.save(); body(); ctx.clip(); ctx.rotate(-(a + wob)); const sl = Math.sin(t * 10) * B.slosh * 8; const lvl = BH * 0.36;
      const ca = Math.cos(a + wob), sa = Math.sin(a + wob), ox = -sa * -BH * 0.32 * -1, oy = ca * -BH * 0.32 * -1;
      ctx.fillStyle = lgrad(ctx, 0, -60, 0, 80, ['rgba(56,189,248,.8)', 'rgba(14,116,144,.9)']); ctx.beginPath(); const cy = -ca * (BH * 0.5 - lvl) * (Math.abs(ca) > 0.2 ? 1 : 0.5); ctx.moveTo(-200, cy + sl); ctx.quadraticCurveTo(0, cy - sl, 200, cy + sl * 0.5); ctx.lineTo(200, 300); ctx.lineTo(-200, 300); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let k = 0; k < 4; k++) circle(ctx, Math.sin(t * 3 + k) * 10, cy + 12 + k * 14 + ((t * 30 + k * 13) % 40), 2.2);
      ctx.restore();
      // ridges + label + highlight
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-BW / 2, -12 - k * 7); ctx.lineTo(BW / 2, -12 - k * 7); ctx.stroke(); }
      ctx.fillStyle = lgrad(ctx, -BW / 2, 0, BW / 2, 0, ['#1d4ed8', '#60a5fa', '#1d4ed8']); ctx.fillRect(-BW / 2, -BH * 0.52, BW, BH * 0.18); txt(ctx, 'PURE', 0, -BH * 0.43, 10, '#fff', 'center', 900);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, -BW / 2 + 5, -BH * 0.8, 5, BH * 0.72, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(14,116,144,.7)'; ctx.lineWidth = 2; body(); ctx.stroke();
      ctx.fillStyle = lgrad(ctx, -11, 0, 11, 0, ['#1e40af', '#3b82f6', '#1e40af']); rr(ctx, -11, -BH, 22, 14, 3); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; for (let k = -8; k <= 8; k += 4) { ctx.beginPath(); ctx.moveTo(k, -BH + 1); ctx.lineTo(k, -BH + 13); ctx.stroke(); }
      ctx.restore();
    }
    function drawSurface(s, isT) {
      const x = s.x, y = s.y, w = s.w;
      ellipse(ctx, x + w / 2 + 12, 590, w * 0.55, 12, 'rgba(0,0,0,.18)');
      if (s.k === 'table') { ctx.fillStyle = '#78350f'; ctx.fillRect(x + 14, y + 16, 14, 590 - y - 16); ctx.fillRect(x + w - 28, y + 16, 14, 590 - y - 16); ctx.fillStyle = lgrad(ctx, 0, y, 0, y + 22, ['#d97706', '#92400e']); rr(ctx, x - 8, y, w + 16, 22, 6); ctx.fill(); }
      else if (s.k === 'coaster') { ctx.fillStyle = '#e11d48'; rr(ctx, x, y - 4, w, 6, 3); ctx.fill(); }
      else if (s.k === 'shelf') { ctx.fillStyle = '#a8a29e'; rr(ctx, x, y, w, 14, 4); ctx.fill(); ctx.fillStyle = '#57534e'; ctx.fillRect(x + w * 0.2, y + 14, 6, 26); ctx.fillRect(x + w * 0.75, y + 14, 6, 26); }
      else if (s.k === 'books') { const cols = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7']; const n = Math.ceil((590 - y) / 26); for (let k = 0; k < n; k++) { ctx.fillStyle = cols[k % 5]; rr(ctx, x + (k % 2) * 6 - 3, y + k * 26, w, 24, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + (k % 2) * 6 + 8, y + k * 26 + 10, w - 22, 3); } }
      else if (s.k === 'tray') { ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, 0); ctx.stroke(); ctx.fillStyle = '#334155'; rr(ctx, x, y, w, 10, 4); ctx.fill(); }
      else if (s.k === 'fridge') { ctx.fillStyle = lgrad(ctx, x, 0, x + w, 0, ['#e2e8f0', '#f8fafc', '#cbd5e1']); rr(ctx, x, y, w, 590 - y, 10); ctx.fill(); ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + w - 22, y + 60, 6, 70); ctx.fillRect(x, y + 150, w, 3); }
      if (isT) { const g = 0.5 + 0.5 * Math.sin(t * 5); ctx.save(); ctx.globalAlpha = 0.35 + g * 0.4; ctx.fillStyle = '#4ade80'; rr(ctx, x - 4, y - 8, w + 8, 10, 5); ctx.fill(); ctx.restore(); label(ctx, '▼', x + w / 2, y - 60 - g * 8, 22, '#4ade80'); }
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; B.slosh = Math.max(0, B.slosh - dt * 1.2);
        for (const s of surf) if (s.move) { const nx = s.x0 + Math.sin(t * (s.sp || 1)) * s.move; if (B.on === s && B.state === 'idle') B.x += nx - s.x; s.x = nx; }
        if (charging) charge = Math.min(1, charge + dt * 0.9);
        if (B.state === 'idle') { B.wv += (-B.wob * 140 - B.wv * 9) * dt; B.wob += B.wv * dt; if (Math.abs(B.wob) > 0.9) fail('Tipped over!'); if (B.on && B.on.move && (B.x < B.on.x - 4 || B.x > B.on.x + B.on.w + 4)) fail('Slid off!'); }
        else if (B.state === 'air') {
          B.vy += G * dt; B.cx += B.vx * dt; B.cy += B.vy * dt;
          // water shifts to the bottom: spin slows as the bottle comes upright on the way down (realistic water-bottle damping)
          B.a += B.w * dt; B.total += B.w * dt;
          B.x = B.cx - BH / 2 * Math.sin(B.a); B.y = B.cy + BH / 2 * Math.cos(B.a);
          if (B.vy > 0) {
            const nrm = ((B.a % TAU) + TAU) % TAU, up = Math.abs(angDiff(nrm, 0)), dn = Math.abs(angDiff(nrm, Math.PI));
            const capX = B.x + BH * Math.sin(B.a), capY = B.y - BH * Math.cos(B.a);
            for (const s of surf) {
              const inX = x => x >= s.x - 2 && x <= s.x + s.w + 2;
              if (inX(B.x) && B.y >= s.y && B.y - B.vy * dt * 2 <= s.y + 4) { if (up < 0.42) { land(s, false); break; } fail(up < 1.1 ? 'Wobbled over!' : 'Bad landing!'); break; }
              if (inX(capX) && capY >= s.y && capY - B.vy * dt * 2 <= s.y + 4) { if (dn < 0.3) { B.x = capX; land(s, true); B.y = s.y; break; } fail('Bonk!'); break; }
            }
            if (B.y > 600 && B.state === 'air') fail('Hit the floor!');
          }
          if (B.cx < -100 || B.cx > VW + 100) fail('Flew away!');
        } else if (B.state === 'fall') { B.fallT += dt; B.a += (B.a % TAU > Math.PI ? 1 : -1) * 0; B.a = lerp(B.a, B.a + 0.4, dt * 3); B.y = Math.min(590, B.y + 300 * dt); }
      },
      draw() {
        view = E.fit(VW, VH); ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        // kitchen
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, 590, ['#fef3c7', '#fde68a']); ctx.fillRect(0, 0, VW, 590);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; for (let x = 0; x < VW; x += 50) for (let y = 300; y < 590; y += 50) if ((x + y) / 50 % 2) ctx.fillRect(x, y, 50, 50);
        ctx.fillStyle = '#7dd3fc'; rr(ctx, 60, 50, 220, 170, 10); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(60, 50, 220, 170); ctx.beginPath(); ctx.moveTo(170, 50); ctx.lineTo(170, 220); ctx.stroke(); ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.ellipse(170, 230, 140, 40, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#b45309'; ctx.fillRect(0, 590, VW, 50); ctx.fillStyle = '#92400e'; for (let x = 0; x < VW; x += 80) ctx.fillRect(x, 590, 3, 50);
        surf.forEach((s, i) => drawSurface(s, i === targetIdx));
        if (B.state !== 'fall' || Math.floor(t * 12) % 2) { if (B.state === 'idle') ellipse(ctx, B.x, B.y + 2, BW * 0.7, 6, 'rgba(0,0,0,.2)'); drawBottle(B.x, B.y, B.a, B.state === 'idle' ? B.wob : 0); }
        if (swipe && swipe.cur) { const dx = swipe.cur.x - swipe.x, dy = swipe.cur.y - swipe.y; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B.x, B.y - BH / 2); ctx.lineTo(B.x + dx, B.y - BH / 2 + dy); ctx.stroke(); }
        if (charging) { rr(ctx, B.x - 60, B.y + 18, 120, 12, 6); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill(); rr(ctx, B.x - 60, B.y + 18, 120 * charge, 12, 6); ctx.fillStyle = '#22c55e'; ctx.fill(); }
        fx.draw(ctx);
        rr(ctx, VW / 2 - 220, 14, 440, 54, 14); ctx.fillStyle = 'rgba(15,23,42,.75)'; ctx.fill();
        label(ctx, 'LEVEL ' + (li + 1) + ' – ' + L.n, VW / 2, 32, 17, '#fde047'); label(ctx, 'Landed ' + prog + '/' + L.need + '   •   Score ' + score + '   •   ' + '❤️'.repeat(Math.max(0, lives)), VW / 2, 54, 14, '#fff');
        if (L.double) label(ctx, 'Challenge: land a DOUBLE flip', VW / 2, 92, 16, '#7c2d12'); if (L.cap) label(ctx, 'Challenge: land it UPSIDE-DOWN on the cap!', VW / 2, 92, 16, '#7c2d12');
        if (msgT > 0) label(ctx, msg, VW / 2, 150, 28, '#fff');
        if (B.state === 'idle' && score === 0 && prog === 0) label(ctx, E.touch ? '👆 Swipe UP on the bottle' : 'Drag UP from the bottle & release (or hold SPACE)', VW / 2, 620, 18, '#fff');
        E.endWorld();
      },
      _dbg: () => ({ st: B.state, prog, score, lives, a: +B.a.toFixed(2), tot: +B.total.toFixed(2) }),
      down(x, y) { if (!view || B.state !== 'idle') return; const p = view.toWorld(x, y); swipe = { x: p.x, y: p.y, t: performance.now(), cur: p }; },
      move(x, y) { if (swipe && view) swipe.cur = view.toWorld(x, y); },
      up(x, y) { if (!swipe || !view) return; const p = view.toWorld(x, y), dx = p.x - swipe.x, dy = p.y - swipe.y, dtm = Math.max(80, performance.now() - swipe.t); swipe = null; if (dy > -30) return; const speedBoost = clamp(500 / dtm, 0.8, 1.6); toss(dx * speedBoost, dy * speedBoost); },
      onKey(c) { if (c === 'Space' && B.state === 'idle') { charging = true; charge = 0; } },
      onKeyUp(c) { if (c === 'Space' && charging) { charging = false; const tgt = surf[targetIdx], dx = (tgt.x + tgt.w / 2 - B.x) * 0.55; toss(dx, -(120 + charge * 260)); } },
      hud() { return null; }
    };
    return api;
  }
});
