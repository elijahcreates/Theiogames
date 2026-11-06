/* =====================================================================
   SHARK.IO  (eat fish, grow, out-chomp rival sharks)
   ===================================================================== */
registerGame({
  id: 'shark', title: 'Shark.io', emoji: '🦈', c1: '#0ea5e9', c2: '#0c4a6e', cats: ['IO Arena', 'Arcade', 'Popular'], hot: true, pop: true, isNew: true, input: 'joy', boost: '⚡ DASH', tags: 'shark io ocean',
  desc: 'Rule the reef as a hungry shark! Gobble schools of fish to grow, dash to catch prey, avoid stinging jellyfish and eat any rival shark smaller than you.',
  controls: 'Mouse / WASD / joystick • Space dash', scoreLabel: 'SIZE',
  hint: 'Steer with the mouse or WASD. SPACE dashes (costs a little size). Eat fish & smaller sharks (green names), flee bigger ones (red)! Jellyfish sting.', hintTouch: 'Drag to swim • ⚡ to dash • eat fish and smaller sharks, flee bigger ones!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), M = 3200;
    const NAMES = ['Jaws Jr', 'Finny', 'Captain Chomp', 'Mako Mike', 'Hammerhead Hal', 'Reef Ruler', 'Bubbles', 'Toothy Tess', 'Nibbles'];
    let sharks = [], fish = [], jellies = [], t = 0, dead = false, kills = 0;
    function mkShark(name, me, sz) { const s = { name, me, x: me ? M / 2 : rand(200, M - 200), y: me ? M / 2 : rand(200, M - 200), a: rand(0, TAU), ta: 0, size: sz || 30, vx: 0, vy: 0, dash: 0, dcd: 0, stun: 0, hue: me ? 210 : irand(0, 359), ai: { t: 0 }, mouth: 0, alive: true, safe: me ? 4 : 0 }; if (!me) { let tries = 0; while (dist(s.x, s.y, M / 2, M / 2) < 800 && tries++ < 40) { s.x = rand(200, M - 200); s.y = rand(200, M - 200); } } s.ta = s.a; sharks.push(s); return s; }
    const me = mkShark('You', true, 30); NAMES.forEach((n, i) => mkShark(n, false, i < 4 ? rand(14, 24) : rand(30, 65)));
    function addFish() { const school = irand(3, 7), x = rand(100, M - 100), y = rand(100, M - 100), hue = pick([20, 45, 200, 320, 150, 260]), a = rand(0, TAU); for (let i = 0; i < school; i++) fish.push({ x: x + rand(-40, 40), y: y + rand(-40, 40), a, hue, s: rand(6, 11), ph: rand(0, TAU), gold: Math.random() < 0.03 }); }
    for (let i = 0; i < 90; i++) addFish(); for (let i = 0; i < 26; i++) jellies.push({ x: rand(100, M - 100), y: rand(100, M - 100), ph: rand(0, TAU), vx: rand(-20, 20), vy: rand(-20, 20) });
    const rocks = []; for (let i = 0; i < 60; i++) rocks.push({ x: rand(0, M), y: rand(0, M), r: rand(20, 60), hue: pick([10, 330, 280, 30]), kind: Math.random() < 0.5 ? 'coral' : 'kelp' });
    function eatShark(a, b) { b.alive = false; a.size += b.size * 0.5; fx.burst(b.x, b.y, 30, { col: ['#fca5a5', '#fff'], spd: 260 }); if (a.me) { kills++; E.sound('swallow'); fx.text(a.x, a.y - 40, 'Ate ' + b.name + '!', '#fde047', 22); } if (b.me) { dead = true; E.sound('die'); E.gameOver({ score: Math.round(me.size), title: 'Eaten by ' + a.name + '!', lines: ['Size: ' + Math.round(me.size), 'Sharks eaten: ' + kills] }); } else setTimeout(() => { if (E.g === api && !dead) { const n = mkShark(b.name, false, rand(22, Math.max(40, me.size * 0.9))); let k = 0; while (dist(n.x, n.y, me.x, me.y) < 700 && k++ < 40) { n.x = rand(200, M - 200); n.y = rand(200, M - 200); } } }, 4000); }
    function brain(s, dt) {
      s.ai.t -= dt; if (s.ai.t > 0) return; s.ai.t = rand(0.25, 0.6);
      const threat = sharks.find(o => o !== s && o.alive && o.size > s.size * 1.15 && dist(o.x, o.y, s.x, s.y) < 380);
      if (threat) { s.ta = Math.atan2(s.y - threat.y, s.x - threat.x); s.wantDash = true; return; }
      const prey = sharks.find(o => o !== s && o.alive && s.size > o.size * 1.25 && dist(o.x, o.y, s.x, s.y) < 420);
      if (prey) { s.ta = Math.atan2(prey.y - s.y, prey.x - s.x); s.wantDash = dist(prey.x, prey.y, s.x, s.y) < 200; return; }
      let best = null, bd = 1e9; for (const f of fish) { const d = dist(f.x, f.y, s.x, s.y); if (d < bd) { bd = d; best = f; } } if (best) s.ta = Math.atan2(best.y - s.y, best.x - s.x); s.wantDash = false;
      if (s.x < 150 || s.x > M - 150 || s.y < 150 || s.y > M - 150) s.ta = Math.atan2(M / 2 - s.y, M / 2 - s.x);
    }
    function drawShark(s) {
      const k = s.size / 30; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.scale(k, k);
      const wag = Math.sin(t * 10 + s.hue) * 0.25, body = s.me ? ['#93c5fd', '#475569'] : [hsl(s.hue, 25, 70), hsl(s.hue, 25, 38)];
      if (s.safe > 0) { ctx.globalAlpha = 0.6; ctx.drawImage(E.glow(200), -60, -60, 120, 120); ctx.globalAlpha = 1; } if (s.stun > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30);
      ctx.fillStyle = body[1]; ctx.save(); ctx.translate(-36, 0); ctx.rotate(wag); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-22, -20); ctx.lineTo(-14, 0); ctx.lineTo(-22, 20); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(-4, -26); ctx.lineTo(4, -10); ctx.fill(); ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-4, 26); ctx.lineTo(4, 10); ctx.fill();
      ctx.fillStyle = lgrad(ctx, 0, -16, 0, 16, [body[0], body[1]]); ctx.beginPath(); ctx.moveTo(40, 0); ctx.quadraticCurveTo(20, -18, -36, -6); ctx.lineTo(-36, 6); ctx.quadraticCurveTo(20, 18, 40, 0); ctx.fill();
      ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.moveTo(38, 2); ctx.quadraticCurveTo(15, 12, -30, 5); ctx.quadraticCurveTo(10, 6, 38, 2); ctx.fill();
      ctx.fillStyle = body[1]; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3, 0, 0, TAU); ctx.fill();
      const mo = s.mouth > 0 ? 6 : 1; ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(26, -mo); ctx.lineTo(26, mo); ctx.fill();
      for (const sd of [-1, 1]) { circle(ctx, 26, sd * 7, 2.6, '#111'); circle(ctx, 26.6, sd * 7 - 0.8, 0.8, '#fff'); }
      ctx.restore(); ctx.globalAlpha = 1;
      const rel = s.me ? '#fde047' : s.size < me.size / 1.25 ? '#86efac' : s.size > me.size * 1.15 ? '#fca5a5' : '#fff';
      label(ctx, s.name + ' ' + Math.round(s.size), s.x, s.y - 30 * k - 10, 13, rel);
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt);
        if (!dead) { const d = E.dir(); if (d.mag > 0.1) me.ta = Math.atan2(d.y, d.x); me.thr = d.mag; me.wantDash = E.boost(); }
        for (const s of sharks) {
          if (!s.alive) continue; if (!s.me) { brain(s, dt); s.thr = 1; }
          s.safe = Math.max(0, (s.safe || 0) - dt); s.stun = Math.max(0, s.stun - dt); s.dash = Math.max(0, s.dash - dt); s.dcd = Math.max(0, s.dcd - dt); s.mouth = Math.max(0, s.mouth - dt);
          if (s.wantDash && s.dcd <= 0 && s.size > 25) { s.dash = 0.35; s.dcd = s.me ? 1.2 : 2.5; s.size -= 1; if (s.me) E.sound('whoosh'); }
          s.a += clamp(angDiff(s.ta, s.a), -4 * dt, 4 * dt);
          const sp = (s.stun > 0 ? 60 : 250 - Math.min(140, s.size * 0.9)) * (s.dash > 0 ? 2.6 : 1) * (s.thr === undefined ? 1 : Math.max(0.15, s.thr));
          s.x = clamp(s.x + Math.cos(s.a) * sp * dt, 20, M - 20); s.y = clamp(s.y + Math.sin(s.a) * sp * dt, 20, M - 20);
          const mx = s.x + Math.cos(s.a) * s.size, my = s.y + Math.sin(s.a) * s.size, reach = s.size * 0.7 + 10;
          for (let i = fish.length - 1; i >= 0; i--) { const f = fish[i]; if (Math.abs(f.x - mx) < reach && Math.abs(f.y - my) < reach) { fish.splice(i, 1); s.size += f.gold ? 3 : 0.45; s.mouth = 0.15; if (s.me) { E.sound(f.gold ? 'coin' : 'eat', 30); if (f.gold) fx.text(s.x, s.y - 40, '+GOLD FISH', '#fde047', 18); } } }
          for (const j of jellies) if (dist(j.x, j.y, s.x, s.y) < s.size * 0.6 + 18 && s.stun <= 0) { s.stun = 1.2; s.size = Math.max(20, s.size - 3); if (s.me) { E.sound('error'); E.shake(6); fx.text(s.x, s.y - 40, '⚡ STUNG!', '#e879f9', 20); } }
          s.size = Math.min(260, s.size);
        }
        for (const a of sharks) for (const b of sharks) { if (a === b || !a.alive || !b.alive || b.safe > 0) continue; if (a.size > b.size * 1.25) { const mx = a.x + Math.cos(a.a) * a.size, my = a.y + Math.sin(a.a) * a.size; if (dist(mx, my, b.x, b.y) < a.size * 0.6 + b.size * 0.4) eatShark(a, b); } }
        sharks = sharks.filter(s => s.alive);
        for (const f of fish) { const thr = sharks.find(s => dist(s.x, s.y, f.x, f.y) < 140); if (thr) f.a = Math.atan2(f.y - thr.y, f.x - thr.x); else f.a += Math.sin(t + f.ph) * dt; const sp = thr ? 120 : 40; f.x = clamp(f.x + Math.cos(f.a) * sp * dt, 10, M - 10); f.y = clamp(f.y + Math.sin(f.a) * sp * dt, 10, M - 10); }
        while (fish.length < 420) addFish();
        for (const j of jellies) { j.x = clamp(j.x + j.vx * dt, 40, M - 40); j.y = clamp(j.y + j.vy * dt + Math.sin(t * 2 + j.ph) * 10 * dt, 40, M - 40); }
        if (!dead) { E.submitBest(Math.round(me.size)); E.follow(me.x, me.y, clamp(1.1 - me.size / 400, 0.45, 1.05) * Math.min(1.15, Math.min(E.W, E.H) / 700), dt); }
      },
      draw() {
        const W = E.W, H = E.H; ctx.fillStyle = '#082f49'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(120);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, M, ['#0369a1', '#0c4a6e', '#082f49']); ctx.fillRect(0, 0, M, M);
        ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { const x = i * 260 + Math.sin(t * 0.3 + i) * 40; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 260, M); ctx.lineTo(x + 180, M); ctx.fill(); } ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(253,230,138,.12)'; for (let x = Math.floor(v.x0 / 120) * 120; x < v.x1; x += 120) for (let y = Math.floor(v.y0 / 120) * 120; y < v.y1; y += 120) { circle(ctx, x + ((x * 7 + y) % 50), y + ((y * 3 + x) % 60), 3); ctx.fill(); }
        for (const r of rocks) { if (r.x < v.x0 - 80 || r.x > v.x1 + 80 || r.y < v.y0 - 80 || r.y > v.y1 + 80) continue; if (r.kind === 'coral') { for (let k = 0; k < 5; k++) { ctx.strokeStyle = hsl(r.hue, 70, 55); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + Math.cos(k * 1.2 - 1.8) * r.r, r.y + Math.sin(k * 1.2 - 1.8) * r.r); ctx.stroke(); } } else { ctx.strokeStyle = 'rgba(34,197,94,.6)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.r); for (let k = 1; k < 6; k++) ctx.lineTo(r.x + Math.sin(t * 1.5 + k + r.x) * 10, r.y + r.r - k * r.r * 0.4); ctx.stroke(); } }
        for (const f of fish) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); if (f.gold) ctx.drawImage(E.glow(50), -20, -20, 40, 40); ctx.fillStyle = f.gold ? '#fde047' : hsl(f.hue, 85, 60); ctx.beginPath(); ctx.ellipse(0, 0, f.s, f.s * 0.55, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-f.s * 0.8, 0); ctx.lineTo(-f.s * 1.5, -f.s * 0.5 + Math.sin(t * 12 + f.ph) * 2); ctx.lineTo(-f.s * 1.5, f.s * 0.5 + Math.sin(t * 12 + f.ph) * 2); ctx.fill(); circle(ctx, f.s * 0.45, -f.s * 0.1, 1.5, '#111'); ctx.restore(); }
        for (const j of jellies) { if (j.x < v.x0 - 50 || j.x > v.x1 + 50 || j.y < v.y0 - 50 || j.y > v.y1 + 50) continue; ctx.globalAlpha = 0.8; ctx.drawImage(E.glow(300), j.x - 34, j.y - 34, 68, 68); ctx.fillStyle = 'rgba(232,121,249,.8)'; ctx.beginPath(); ctx.arc(j.x, j.y, 18, Math.PI, 0); ctx.quadraticCurveTo(j.x, j.y + 8, j.x - 18, j.y); ctx.fill(); ctx.strokeStyle = 'rgba(232,121,249,.7)'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(j.x + k * 7, j.y); ctx.quadraticCurveTo(j.x + k * 7 + Math.sin(t * 4 + k) * 6, j.y + 18, j.x + k * 7, j.y + 34); ctx.stroke(); } ctx.globalAlpha = 1; }
        for (const s of sharks.slice().sort((a, b) => a.size - b.size)) drawShark(s);
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, M, M);
        fx.draw(ctx); E.endWorld();
        const mm = Math.min(120, W * 0.22), mx = 14, my = H - mm - 14; rr(ctx, mx, my, mm, mm, 10); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); for (const s of sharks) circle(ctx, mx + s.x / M * mm, my + s.y / M * mm, s.me ? 4 : 2.5, s.me ? '#fde047' : s.size > me.size ? '#fca5a5' : '#86efac');
      },
      hud() { const top = sharks.slice().sort((a, b) => b.size - a.size).slice(0, 8).map(s => ({ n: s.name, s: Math.round(s.size), me: s.me })); if (!top.some(r => r.me) && !dead) top.push({ n: 'You', s: Math.round(me.size), me: true }); return { stats: [['Size', Math.round(me.size)], ['Sharks eaten', kills]], board: top, boardTitle: '🦈 BIGGEST SHARKS' }; }
    };
    return api;
  }
});
