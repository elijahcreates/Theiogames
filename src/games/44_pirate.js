/* =====================================================================
   PIRATE ROYALE  (shrinking island battle royale vs AI pirates)
   ===================================================================== */
registerGame({
  id: 'pirate', title: 'Pirate Royale', emoji: '🏴‍☠️', c1: '#2193b0', c2: '#6dd5ed', cats: ['IO Arena', 'Arcade', 'Popular'], hot: true, isNew: true, featured: true, input: 'joy',
  desc: 'Wash ashore on a treasure island with 11 rival pirates. Grab coins to grow bigger and stronger, swing your cutlass, dash out of trouble – and outlast the closing storm!',
  controls: 'WASD / mouse • Space attack • Shift dash', scoreLabel: 'PLACE SCORE',
  hint: 'Move with WASD / mouse. SPACE (or click) swings your cutlass, SHIFT dashes. Collect coins to grow. Stay inside the safe zone!', hintTouch: 'Drag to move • ⚔ to attack • 💨 to dash • stay inside the safe zone!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), IR = 1500;
    const NAMES = ['Capt. Barnacle', 'Salty Sue', 'Peg-Leg Pete', 'Mad Molly', 'Red Rory', 'One-Eye Olly', 'Bilge Bob', 'Coral Kate', 'Jolly Jack', 'Stormy Stan', 'Pearl Polly'];
    const HATS = ['#111827', '#7f1d1d', '#1e3a8a', '#14532d', '#581c87', '#78350f'];
    let pirates = [], coins = [], chests = [], t = 0, zone = { r: IR * 1.05, tr: IR * 1.05, x: 0, y: 0, phase: 0, timer: 25 }, over = false, place = 0, palms = [], rocks = [];
    for (let i = 0; i < 30; i++) { const a = rand(0, TAU), r = rand(100, IR - 120); palms.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, s: rand(0.6, 0.95) }); }
    for (let i = 0; i < 18; i++) { const a = rand(0, TAU), r = rand(150, IR - 150); rocks.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, r: rand(26, 46) }); }
    function mkPirate(name, me) { const a = rand(0, TAU), r = me ? 0 : rand(300, IR - 200); const p = { name, me, x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, face: 0, coins: me ? 0 : irand(0, 12), hp: 100, max: 100, atk: 0, cd: 0, dash: 0, dcd: 0, hit: 0, alive: true, hat: me ? '#dc2626' : pick(HATS), shirt: hsl(irand(0, 359), 60, 55), ai: { t: 0, tx: 0, ty: 0, brave: rand(0.3, 1) }, kills: 0, ability: me ? 'dash' : pick(['dash', 'tough', 'swift', 'heavy']) }; if (p.ability === 'tough') { p.max = p.hp = 140; } pirates.push(p); return p; }
    const me = mkPirate('You', true); NAMES.forEach(n => mkPirate(n, false));
    for (let i = 0; i < 160; i++) spawnCoin();
    function spawnCoin(x, y, v) { if (x === undefined) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * Math.min(zone.r, IR) * 0.95; x = Math.cos(a) * r; y = Math.sin(a) * r; } coins.push({ x, y, v: v || 1, ph: rand(0, TAU) }); }
    const size = p => 25 + Math.min(28, Math.sqrt(p.coins) * 2.8);
    const speed = p => (p.ability === 'swift' ? 250 : 220) - size(p) * 1.4 + (p.dash > 0 ? 420 : 0);
    function attack(p) { if (p.cd > 0 || !p.alive) return; p.atk = 0.28; p.cd = p.ability === 'heavy' ? 0.75 : 0.55; if (p.me) E.sound('swish');
      const reach = size(p) + 38 + size(p) * 0.6, dmg = 18 + size(p) * 0.6 + (p.ability === 'heavy' ? 10 : 0);
      for (const o of pirates) { if (o === p || !o.alive) continue; const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy); if (d < reach + size(o) && Math.abs(angDiff(Math.atan2(dy, dx), p.face)) < 1.2) { o.hp -= dmg; o.hit = 0.2; o.vx += dx / d * 380; o.vy += dy / d * 380; fx.burst(o.x, o.y, 8, { col: ['#fff', '#fca5a5'], spd: 160 }); if (o.me || p.me) { E.sound('hit'); E.shake(o.me ? 8 : 3); } if (o.hp <= 0) kill(o, p); } }
    }
    function kill(o, by) {
      if (!o.alive) return; o.alive = false; const alive = pirates.filter(q => q.alive).length; if (o.me) place = alive + 1;
      for (let i = 0; i < Math.max(3, Math.floor(o.coins * 0.6)); i++) spawnCoin(o.x + rand(-50, 50), o.y + rand(-50, 50), 1);
      chests.push({ x: o.x, y: o.y, t: 0 });
      fx.burst(o.x, o.y, 30, { col: ['#fde047', '#fff', '#94a3b8'], spd: 300 });
      if (by) { by.kills++; if (by.me) { E.sound('coin'); fx.text(by.x, by.y - 50, 'Defeated ' + o.name + '!', '#fde047', 22); } }
      if (o.me) { over = true; E.sound('die'); E.gameOver({ score: (12 - place) * 100 + me.coins + me.kills * 50, scoreText: '#' + place, label: 'PLACE', title: by ? 'Sunk by ' + by.name + '!' : 'Lost to the Storm!', lines: ['Coins: ' + me.coins + ' • Defeated: ' + me.kills] }); }
      else if (alive === 1 && me.alive) { over = true; E.ach('royale'); E.gameOver({ score: 1200 + me.coins + me.kills * 50, scoreText: '#1', label: 'PLACE', win: true, title: '🏴‍☠️ Pirate King!', lines: ['Last pirate standing!', 'Coins: ' + me.coins + ' • Defeated: ' + me.kills], delay: 1200 }); }
    }
    function brain(p, dt) {
      const ai = p.ai; ai.t -= dt;
      let tx = ai.tx, ty = ai.ty;
      const inZone = Math.hypot(p.x - zone.x, p.y - zone.y) < zone.tr * 0.85;
      if (ai.t <= 0) {
        ai.t = rand(0.3, 0.7);
        let target = null, bd = 1e9; for (const c of coins) { const d = dist(c.x, c.y, p.x, p.y); if (d < bd && Math.hypot(c.x - zone.x, c.y - zone.y) < zone.tr) { bd = d; target = c; } }
        const foe = pirates.filter(o => o !== p && o.alive && dist(o.x, o.y, p.x, p.y) < 420).sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))[0];
        if (foe && (size(p) >= size(foe) * 0.9 || ai.brave > 0.7) && p.hp > 35) { tx = foe.x; ty = foe.y; ai.fight = foe; }
        else if (foe && p.hp < 35) { tx = p.x - (foe.x - p.x); ty = p.y - (foe.y - p.y); ai.fight = null; }
        else if (target) { tx = target.x; ty = target.y; ai.fight = null; }
        if (!inZone) { tx = zone.x; ty = zone.y; }
        ai.tx = tx; ai.ty = ty;
      }
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1; p.mx = dx / d; p.my = dy / d;
      if (ai.fight && ai.fight.alive && dist(ai.fight.x, ai.fight.y, p.x, p.y) < size(p) + size(ai.fight) + 45) { p.face = Math.atan2(ai.fight.y - p.y, ai.fight.x - p.x); if (Math.random() < dt * 3.5) attack(p); }
      if (p.dcd <= 0 && (!inZone || (ai.fight && p.hp < 40)) && Math.random() < dt * 2) { p.dash = 0.22; p.dcd = 3; }
    }
    if (E.touch) E.pads([{ k: 'Space', label: '⚔️', right: 24, bottom: 30, size: 92 }, { k: 'ShiftLeft', label: '💨', right: 130, bottom: 40, size: 70 }]);
    return {
      update(dt) {
        t += dt; fx.update(dt);
        // zone shrinking
        zone.timer -= dt; if (zone.timer <= 0) { zone.phase++; zone.tr = Math.max(140, zone.tr * 0.68); zone.timer = 22; if (me.alive) E.toast('🌩️ The storm is closing in!'); }
        zone.r += (zone.tr - zone.r) * Math.min(1, dt * 0.25);
        if (!over && me.alive) { const d = E.dir(); me.mx = d.x * d.mag; me.my = d.y * d.mag; if (d.mag > 0.1) me.face = Math.atan2(d.y, d.x); if (E.key('ShiftLeft') || E.key('ShiftRight')) { if (me.dcd <= 0) { me.dash = 0.22; me.dcd = 2.2; E.sound('whoosh'); } } }
        for (const p of pirates) {
          if (!p.alive) continue; if (!p.me) brain(p, dt);
          p.cd = Math.max(0, p.cd - dt); p.atk = Math.max(0, p.atk - dt); p.dash = Math.max(0, p.dash - dt); p.dcd = Math.max(0, p.dcd - dt); p.hit = Math.max(0, p.hit - dt);
          const sp = speed(p); p.vx += ((p.mx || 0) * sp - p.vx) * Math.min(1, dt * 8); p.vy += ((p.my || 0) * sp - p.vy) * Math.min(1, dt * 8);
          if (!p.me && Math.hypot(p.mx || 0, p.my || 0) > 0.1 && !(p.ai.fight)) p.face = Math.atan2(p.my, p.mx);
          p.x += p.vx * dt; p.y += p.vy * dt;
          const rr2 = Math.hypot(p.x, p.y); if (rr2 > IR - 20) { p.x *= (IR - 20) / rr2; p.y *= (IR - 20) / rr2; }
          for (const r of rocks) { const d = dist(p.x, p.y, r.x, r.y), m = r.r + size(p) * 0.7; if (d < m) { p.x = r.x + (p.x - r.x) / d * m; p.y = r.y + (p.y - r.y) / d * m; } }
          if (Math.hypot(p.x - zone.x, p.y - zone.y) > zone.r) { p.hp -= dt * (8 + zone.phase * 4); if (p.me) E.shake(2); if (p.hp <= 0) kill(p, null); }
          else if (p.hp < p.max) p.hp = Math.min(p.max, p.hp + dt * 2);
          for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (Math.abs(c.x - p.x) < size(p) + 14 && Math.abs(c.y - p.y) < size(p) + 14) { coins.splice(i, 1); p.coins += c.v; p.max = (p.ability === 'tough' ? 140 : 100) + p.coins * 1.5; p.hp = Math.min(p.max, p.hp + 4); if (p.me) E.sound('coin', 40); } }
        }
        for (let i = 0; i < pirates.length; i++) for (let j = i + 1; j < pirates.length; j++) { const a = pirates[i], b = pirates[j]; if (!a.alive || !b.alive) continue; const d = dist(a.x, a.y, b.x, b.y), m = size(a) + size(b); if (d < m && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, o = (m - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; } }
        if (coins.length < 90 && Math.random() < dt * 4) spawnCoin();
        chests.forEach(c => c.t += dt); chests = chests.filter(c => c.t < 6);
        const target = me.alive ? me : pirates.find(p => p.alive) || me; E.follow(target.x, target.y, clamp(1.05 - size(me) / 120, 0.6, 1) * Math.min(1.15, Math.min(E.W, E.H) / 680), dt);
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = '#0e7490'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(60);
        // ocean waves
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; for (let y = Math.floor(v.y0 / 60) * 60; y < v.y1; y += 60) { ctx.beginPath(); for (let x = v.x0; x < v.x1; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.02 + t * 2 + y) * 6); ctx.stroke(); }
        // island
        circle(ctx, 0, 0, IR + 60, '#fde68a'); circle(ctx, 0, 0, IR, '#86c06c');
        ctx.fillStyle = 'rgba(20,83,45,.25)'; for (let i = 0; i < 60; i++) { const a = i * 2.4, r = (i * 97) % IR; circle(ctx, Math.cos(a) * r, Math.sin(a) * r, 40 + (i % 5) * 12); ctx.fill(); }
        for (const r of rocks) { ellipse(ctx, r.x + 6, r.y + 8, r.r, r.r * 0.7, 'rgba(0,0,0,.2)'); circle(ctx, r.x, r.y, r.r, rgrad(ctx, r.x - r.r * 0.3, r.y - r.r * 0.3, 2, r.r, ['#d6d3d1', '#78716c'])); }
        for (const c of chests) { ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = Math.min(1, 6 - c.t); ctx.fillStyle = '#92400e'; rr(ctx, -16, -10, 32, 20, 4); ctx.fill(); ctx.fillStyle = '#fbbf24'; ctx.fillRect(-16, -2, 32, 4); ctx.restore(); }
        for (const c of coins) { if (c.x < v.x0 || c.x > v.x1 || c.y < v.y0 || c.y > v.y1) continue; const sq = Math.abs(Math.cos(t * 3 + c.ph)); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 9 * sq + 1, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 6 * sq + 0.5, 6, 0, 0, TAU); ctx.fill(); }
        const draw = [];
        for (const p of pirates) if (p.alive) draw.push({ y: p.y, f: () => {
          const s = size(p); ctx.save(); ctx.translate(p.x, p.y);
          ellipse(ctx, 0, s * 0.7, s * 0.9, s * 0.35, 'rgba(0,0,0,.25)');
          if (p.dash > 0) { ctx.globalAlpha = 0.4; circle(ctx, -p.vx * 0.05, -p.vy * 0.05, s, '#fff'); ctx.globalAlpha = 1; }
          circle(ctx, 0, 0, s, p.hit > 0 ? '#fecaca' : p.shirt); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#fff'; for (let k = -1; k <= 1; k++) ctx.fillRect(-s * 0.7, k * s * 0.35 - 2, s * 1.4, 3);
          circle(ctx, 0, -s * 0.25, s * 0.62, '#f1c27d');
          // hat
          ctx.fillStyle = p.hat; ctx.beginPath(); ctx.ellipse(0, -s * 0.62, s * 0.95, s * 0.32, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -s * 0.78, s * 0.5, s * 0.36, 0, Math.PI, 0); ctx.fill(); circle(ctx, 0, -s * 0.72, s * 0.12, '#fff');
          const fx2 = Math.cos(p.face), fy2 = Math.sin(p.face); circle(ctx, fx2 * s * 0.22 - s * 0.16, -s * 0.25 + fy2 * s * 0.1, s * 0.08, '#111'); if (p.name.indexOf('Eye') >= 0) { ctx.fillStyle = '#111'; ctx.fillRect(fx2 * s * 0.22 + s * 0.06, -s * 0.33 + fy2 * s * 0.1, s * 0.2, s * 0.16); } else circle(ctx, fx2 * s * 0.22 + s * 0.16, -s * 0.25 + fy2 * s * 0.1, s * 0.08, '#111');
          // cutlass
          const swing = p.atk > 0 ? (1 - p.atk / 0.28) * 2.2 - 1.1 : 0.6; ctx.save(); ctx.rotate(p.face + swing); ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.8, 0); ctx.quadraticCurveTo(s * 1.4, -6, s * 1.9 + 10, 4); ctx.stroke(); ctx.fillStyle = '#ca8a04'; ctx.fillRect(s * 0.7, -6, 6, 12); ctx.restore();
          if (p.atk > 0) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, s * 1.9 + 14, p.face - 1.1, p.face - 1.1 + 2.2 * (1 - p.atk / 0.28)); ctx.stroke(); }
          ctx.restore();
          // hp + name
          const bw = s * 2; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(p.x - bw / 2, p.y - s - 22, bw, 5); ctx.fillStyle = p.hp / p.max > 0.4 ? '#4ade80' : '#ef4444'; ctx.fillRect(p.x - bw / 2, p.y - s - 22, bw * clamp(p.hp / p.max, 0, 1), 5);
          label(ctx, p.name + (p.ability !== 'dash' && !p.me ? ' ' + { tough: '🛡', swift: '⚡', heavy: '💪' }[p.ability] : ''), p.x, p.y - s - 32, 12, p.me ? '#fde047' : '#fff');
        } });
        for (const pm of palms) draw.push({ y: pm.y + 10, f: () => { if (pm.x < v.x0 - 80 || pm.x > v.x1 + 80 || pm.y < v.y0 - 100 || pm.y > v.y1 + 80) return; ctx.save(); ctx.translate(pm.x, pm.y); ctx.scale(pm.s, pm.s); ellipse(ctx, 10, 6, 34, 12, 'rgba(0,0,0,.2)'); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -30, 4, -60); ctx.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.sin(t + pm.x) * 0.05; ctx.fillStyle = k % 2 ? '#15803d' : '#16a34a'; ctx.beginPath(); ctx.ellipse(4 + Math.cos(a) * 26, -62 + Math.sin(a) * 16, 30, 9, a, 0, TAU); ctx.fill(); } circle(ctx, 4, -58, 6, '#78350f'); ctx.restore(); } });
        draw.sort((a, b) => a.y - b.y).forEach(d => d.f());
        // storm
        ctx.save(); ctx.beginPath(); ctx.rect(v.x0 - 100, v.y0 - 100, v.x1 - v.x0 + 200, v.y1 - v.y0 + 200); ctx.arc(zone.x, zone.y, zone.r, 0, TAU, true); ctx.fillStyle = 'rgba(76,29,149,.38)'; ctx.fill('evenodd'); ctx.restore();
        ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 6; ctx.setLineDash([20, 14]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        fx.draw(ctx);
        E.endWorld();
        const alive = pirates.filter(p => p.alive).length;
        label(ctx, '🏴‍☠️ ' + alive + ' pirates left   🌩️ storm in ' + Math.ceil(zone.timer) + 's', W / 2, 30, 18, '#fff');
        if (me.dcd > 0 && me.alive) label(ctx, 'Dash ' + me.dcd.toFixed(1) + 's', W / 2, H - 30, 14, '#cbd5e1');
      },
      down() { if (!E.touch) attack(me); },
      onKey(c) { if (c === 'Space' || c === 'KeyJ') attack(me); },
      destroy() { E.pads(null); },
      hud() { const top = pirates.filter(p => p.alive).sort((a, b) => b.coins - a.coins).slice(0, 7).map(p => ({ n: p.name, s: p.coins, me: p.me })); return { stats: [['Coins', me.coins], ['HP', Math.max(0, Math.ceil(me.hp))], ['Defeated', me.kills]], board: top, boardTitle: '💰 RICHEST PIRATES' }; }
    };
  }
});
