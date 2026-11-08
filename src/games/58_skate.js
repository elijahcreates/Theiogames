/* =====================================================================
   SKATEBOARD TRICKS
   ===================================================================== */
registerGame({
  id: 'skate', title: 'Skateboard Tricks', emoji: '🛹', c1: '#e96443', c2: '#904e95', cats: ['Sports', 'Arcade'], isNew: true,
  desc: 'Ollie off kickers, grind rails and ledges, and chain kickflips, heelflips, grabs and 360s into massive combos across Street, Skatepark and Mega Ramp courses.',
  controls: 'Space/↑ ollie • ←/→/↓ tricks', scoreLabel: 'BEST RUN',
  hint: 'SPACE / W / ↑ = ollie. In the air: ← kickflip, → heelflip, ↓ grab, ↑ 360. Land before the trick ends = bail! Land on rails to grind.', hintTouch: 'Tap to ollie. Swipe ← → ↓ ↑ in the air for tricks. Land clean to keep your combo!',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    const COURSES = [{ n: 'Downtown Street', sky: ['#fda4af', '#fef3c7'], len: 5200, time: 75 }, { n: 'Sunset Skatepark', sky: ['#f97316', '#7c3aed'], len: 6000, time: 85 }, { n: 'Mega Ramp', sky: ['#38bdf8', '#e0f2fe'], len: 7000, time: 95 }];
    let ci = 0, ground, rails, cones, kickers, sk, t = 0, time, score = 0, combo = [], comboMult = 1, msg = '', msgT = 0, cam = 0, done = false, ready = false, bails = 0, swipe = null;
    E.choose('Skateboard Tricks', 'Choose a course', COURSES.map((c, i) => ({ label: ['🏙️ ', '🌇 ', '🏔️ '][i] + c.n, sub: c.time + ' seconds • ' + ['Rails & stairs', 'Bowls & kickers', 'Huge air!'][i], value: i })), i => { ci = i; build(); ready = true; });
    function build() {
      const C = COURSES[ci], r = rng(ci * 77 + 3); ground = [[-500, 0], [400, 0]]; rails = []; cones = []; kickers = []; let x = 400, y = 0;
      const add = (dx, dy) => { x += dx; y += dy; ground.push([x, y]); };
      while (x < C.len) {
        const k = r(); const big = ci === 2;
        if (k < 0.22) { add(120, 0); kickers.push({ x0: x, x1: x + 80, h: big ? 90 : 50 }); add(80, -(big ? 90 : 50)); add(4, big ? 90 : 50); add(big ? 360 : 220, 0); }
        else if (k < 0.42) { add(150, 0); rails.push({ x0: x, x1: x + 260 + r() * 140, y: y - 46, kind: r() < 0.5 ? 'rail' : 'ledge' }); add(rails[rails.length - 1].x1 - x + 80, 0); }
        else if (k < 0.56) { add(150, 0); cones.push({ x: x + 40, y }); add(200, 0); }
        else if (k < 0.7) { add(120, 0); for (let i = 0; i < 4; i++) { add(46, 0); add(2, 22); } add(220, 0); }
        else if (k < 0.82 && ci > 0) { add(100, 0); for (let i = 0; i < 6; i++) add(30, -8 - i * 6); kickers.push({ x0: x - 30, x1: x, h: 0, lip: true }); add(4, 0); add(300, 0); for (let i = 0; i < 6; i++) add(30, 8 + (5 - i) * 6); add(200, 0); }
        else add(250, 0);
      }
      add(500, 0); COURSES[ci].finish = x - 300; add(600, 0);
      sk = { x: 0, y: 0, vy: 0, air: false, trick: null, trickT: 0, spin: 0, flip: 0, grab: false, grind: null, bail: 0, v: 340, airTime: 0 };
      time = C.time; score = 0; combo = []; comboMult = 1; done = false; bails = 0;
    }
    function gy(x) { for (let i = 0; i < ground.length - 1; i++) { const a = ground[i], b = ground[i + 1]; if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return 0; }
    function ollie() { if (!ready || done || sk.bail > 0) return; if (!sk.air || sk.grind) { sk.vy = -620 - (sk.grind ? 60 : 0); sk.air = true; sk.grind = null; E.sound('jump'); } }
    const TR = { kick: { n: 'Kickflip', p: 120, d: 0.42 }, heel: { n: 'Heelflip', p: 120, d: 0.42 }, grab: { n: 'Indy Grab', p: 60, d: 0.5 }, spin: { n: '360 Spin', p: 220, d: 0.6 } };
    function trick(k) { if (!sk.air || sk.grind || sk.trick || sk.bail > 0) return; sk.trick = k; sk.trickT = 0; E.sound('flip'); }
    function bail(why) { sk.bail = 1.1; sk.trick = null; combo = []; comboMult = 1; bails++; E.sound('crash'); E.shake(8); msg = why; msgT = 1.3; fx.burst(sk.x, sk.y - 20, 20, { col: ['#fde047', '#fff'], spd: 200 }); }
    function land() {
      sk.air = false; sk.vy = 0;
      if (sk.trick) { bail('BAIL! Trick not finished'); return; }
      if (combo.length) { const base = combo.reduce((s, c) => s + c.p, 0) + Math.round(sk.airTime * 40), pts = base * combo.length; score += pts; msg = combo.map(c => c.n).join(' + ') + '  ×' + combo.length + '  = +' + pts; msgT = 2; E.sound(combo.length > 2 ? 'cheer' : 'score'); fx.burst(sk.x, sk.y, 14, { col: ['#fde047', '#f472b6'], spd: 180, shape: 'star' }); }
      else E.sound('land', 60);
      combo = []; sk.airTime = 0;
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (!ready || done) return;
        time -= dt; if (time <= 0) { done = true; E.gameOver({ score, title: "Time's up!", lines: [COURSES[ci].n, 'Bails: ' + bails] }); return; }
        if (sk.bail > 0) { sk.bail -= dt; if (sk.bail <= 0) { sk.x += 120; sk.y = gy(sk.x); sk.air = false; sk.grind = null; } return; }
        const K = E.key;
        sk.x += sk.v * dt;
        if (sk.trick) { sk.trickT += dt; const T = TR[sk.trick]; if (sk.trickT >= T.d) { combo.push(T); fx.text(sk.x, sk.y - 90, T.n + '!', '#fde047', 20); sk.trick = null; } }
        if (sk.grind) { const R = sk.grind; sk.y = R.y; score += Math.round(150 * dt); if (sk.x > R.x1) { sk.grind = null; sk.air = true; sk.vy = -120; combo.push({ n: R.kind === 'rail' ? '50-50 Grind' : 'Ledge Slide', p: 150 }); } if (Math.random() < 0.6) fx.burst(sk.x, sk.y, 1, { col: '#fde047', spd: 120, life: 0.3, size: 2, ang: Math.PI, spread: 0.6, glow: true }); }
        else if (sk.air) {
          sk.vy += 1500 * dt; sk.y += sk.vy * dt; sk.airTime += dt;
          if (K('ArrowDown') || K('KeyS')) sk.grab = true; else sk.grab = false;
          for (const R of rails) if (sk.vy > 0 && sk.x > R.x0 && sk.x < R.x1 && sk.y >= R.y - 6 && sk.y - sk.vy * dt <= R.y + 4) { if (sk.trick) { bail('BAIL! Landed mid-trick'); return; } sk.grind = R; sk.y = R.y; sk.vy = 0; E.sound('hit'); if (combo.length) msg = 'COMBO GRIND!'; msgT = 0.8; break; }
          const g = gy(sk.x); if (sk.y >= g && sk.vy > 0) { sk.y = g; land(); }
          if (sk.y > g + 300) bail('Fell!');
        } else {
          const g = gy(sk.x), prev = sk.y; sk.y = g;
          for (const k of kickers) if (sk.x > k.x1 - 6 && sk.x < k.x1 + 8 && !sk.air) { sk.vy = k.lip ? -760 : -480 - k.h * 3; sk.air = true; E.sound('whoosh'); }
          if (g - prev > 14) { sk.air = true; sk.vy = 60; sk.y = prev; }
          for (const c of cones) if (Math.abs(sk.x - c.x) < 14 && !c.hit) { c.hit = true; bail('Hit a cone!'); return; }
        }
        sk.spin = sk.trick === 'spin' ? sk.trickT / TR.spin.d * TAU : 0; sk.flip = (sk.trick === 'kick' || sk.trick === 'heel') ? sk.trickT / TR.kick.d * TAU * (sk.trick === 'kick' ? 1 : -1) : 0;
        if (sk.x > COURSES[ci].finish && !done) { done = true; const bonus = Math.round(time * 20); score += bonus; E.sound('win'); E.gameOver({ score, win: true, title: '🛹 Course complete!', lines: [COURSES[ci].n, 'Time bonus +' + bonus, 'Bails: ' + bails] }); }
        cam += (sk.x + E.W * 0.15 - cam) * Math.min(1, dt * 5);
      },
      draw() {
        const W = E.W, H = E.H, C = COURSES[ci], z = Math.min(1.1, Math.min(W, H) / 600), gyS = H * 0.68;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, C.sky); ctx.fillRect(0, 0, W, H);
        if (!ready) return;
        // parallax city
        for (let l = 0; l < 2; l++) { const par = 0.2 + l * 0.25; ctx.fillStyle = l ? 'rgba(51,65,85,.55)' : 'rgba(30,41,59,.35)'; for (let i = -2; i < 30; i++) { const bx = i * 120 - (cam * par) % 120 - 120 + l * 40, bh = 80 + ((i * 53 + Math.floor(cam * par / 120) * 31 + l * 17) & 127); ctx.fillRect(bx, gyS - bh - 40 + l * 30, 90, bh + 300); } }
        ctx.save(); ctx.translate(W * 0.35, gyS); ctx.scale(z, z); ctx.translate(-cam + W * 0.15 / z, -Math.min(0, sk.y) * 0.5);
        // ground
        ctx.beginPath(); ctx.moveTo(ground[0][0], 2000); ground.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(ground[ground.length - 1][0], 2000); ctx.closePath(); ctx.fillStyle = ci === 0 ? '#9ca3af' : ci === 1 ? '#d6d3d1' : '#e2e8f0'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 5; ctx.beginPath(); ground.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = Math.floor((cam - 600) / 80) * 80; x < cam + 1600; x += 80) ctx.fillRect(x, gy(x) + 6, 4, 20);
        for (const k of kickers) if (!k.lip) { ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.moveTo(k.x0, gy(k.x0)); ctx.lineTo(k.x1, gy(k.x1)); ctx.lineTo(k.x1, gy(k.x1 + 5)); ctx.closePath(); ctx.fill(); }
        for (const R of rails) { if (R.kind === 'rail') { ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(R.x0, R.y); ctx.lineTo(R.x1, R.y); ctx.stroke(); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4; for (let x = R.x0 + 10; x < R.x1; x += 90) { ctx.beginPath(); ctx.moveTo(x, R.y); ctx.lineTo(x, gy(x)); ctx.stroke(); } } else { ctx.fillStyle = '#78716c'; ctx.fillRect(R.x0, R.y, R.x1 - R.x0, gy(R.x0) - R.y); ctx.fillStyle = '#a8a29e'; ctx.fillRect(R.x0, R.y, R.x1 - R.x0, 6); } }
        for (const c of cones) { ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(c.x - 12, c.y); ctx.lineTo(c.x, c.y - 34); ctx.lineTo(c.x + 12, c.y); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 6, c.y - 20, 12, 5); }
        const F = C.finish; for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.fillRect(F + j * 14, gy(F) - 160 + i * 20, 14, 20); }
        // skater
        const x = sk.x, y = sk.y; ctx.save(); ctx.translate(x, y);
        if (sk.bail > 0) { ctx.rotate(1.3); }
        ellipse(ctx, 0, (sk.air ? gy(x) - y : 0) + 2, 26, 5, 'rgba(0,0,0,.25)');
        // board
        ctx.save(); const slope = sk.air ? 0 : Math.atan2(gy(x + 10) - gy(x - 10), 20); ctx.rotate(slope); ctx.translate(0, -6); ctx.scale(1, Math.cos(sk.flip) || 0.05);
        ctx.fillStyle = '#7c3aed'; rr(ctx, -30, -4, 60, 8, 4); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.fillRect(-20, -4, 40, 3); ctx.restore();
        ctx.fillStyle = '#111'; circle(ctx, -20, 2, 4, '#111'); circle(ctx, 20, 2, 4, '#111');
        // body (rotates with spin)
        ctx.save(); ctx.translate(0, -10); ctx.scale(Math.cos(sk.spin) || 0.1, 1);
        const crouch = sk.grab || (sk.air && sk.vy < -200) ? 12 : 0;
        ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-6, -22 + crouch); ctx.lineTo(0, -40 + crouch); ctx.moveTo(10, 0); ctx.lineTo(6, -22 + crouch); ctx.lineTo(0, -40 + crouch); ctx.stroke();
        ctx.fillStyle = '#ef4444'; rr(ctx, -11, -70 + crouch, 22, 32, 8); ctx.fill();
        ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-8, -64 + crouch); ctx.lineTo(sk.grab ? -10 : -24, sk.grab ? -10 : -50 + crouch); ctx.moveTo(8, -64 + crouch); ctx.lineTo(24, -56 + crouch); ctx.stroke();
        circle(ctx, 0, -82 + crouch, 11, '#f1c27d'); ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(0, -85 + crouch, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -87 + crouch, 16, 4);
        ctx.restore(); ctx.restore();
        fx.draw(ctx); ctx.restore();
        const prog = clamp(sk.x / C.finish, 0, 1), bw = Math.min(340, W * 0.5); rr(ctx, W / 2 - bw / 2, 16, bw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, 16, bw * prog, 10, 5); ctx.fillStyle = '#22c55e'; ctx.fill();
        label(ctx, fmt(score) + ' pts  •  ⏱ ' + Math.ceil(time) + 's', W / 2, 44, 20, '#fff');
        if (combo.length && sk.air) label(ctx, combo.map(c => c.n).join(' + ') + '  ×' + combo.length, W / 2, 76, 18, '#fde047');
        if (sk.grind) label(ctx, 'GRINDING!', W / 2, 100, 18, '#fde047');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.24, 22, '#fff');
      },
      down(x, y) { swipe = { x, y, t: performance.now() }; },
      up(x, y) { if (!swipe) return; const dx = x - swipe.x, dy = y - swipe.y; swipe = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) { ollie(); return; } if (!sk.air) { ollie(); return; } if (Math.abs(dx) > Math.abs(dy)) trick(dx < 0 ? 'kick' : 'heel'); else trick(dy > 0 ? 'grab' : 'spin'); },
      onKey(c) { if (c === 'Space' || c === 'KeyW' || (c === 'ArrowUp' && (!sk.air || sk.grind))) { ollie(); return; } if (c === 'ArrowLeft' || c === 'KeyA') trick('kick'); if (c === 'ArrowRight' || c === 'KeyD') trick('heel'); if (c === 'ArrowDown' || c === 'KeyS') trick('grab'); if (c === 'ArrowUp' || c === 'KeyE') trick('spin'); },
      hud() { return null; }
    };
  }
});
