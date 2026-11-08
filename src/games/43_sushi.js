/* =====================================================================
   SUSHI SNAKE  (multiplayer-style snake vs named AI)
   ===================================================================== */
registerGame({
  id: 'sushi', title: 'Sushi Snake', emoji: '🍣', c1: '#ff9a8b', c2: '#ff6a88', cats: ['IO Arena', 'Arcade', 'Popular'], pop: true, hot: true, isNew: true, input: 'joy', boost: '⚡ DASH',
  desc: 'Slither through a sushi bar as a hungry maki-roll snake! Gobble nigiri, rolls and golden sushi, outsmart cheeky rival snakes and top the leaderboard.',
  controls: 'Mouse / WASD / joystick • Space dash', scoreLabel: 'LENGTH',
  hint: 'Steer with the mouse or WASD. Hold SPACE to dash. 🌟 golden sushi = big bonus, 🌈 rainbow roll = magnet, 🟢 wasabi = speed!', hintTouch: 'Drag to steer • hold ⚡ DASH to speed up • grab golden & rainbow sushi!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), R = 1700, SEG = 9;
    const NAMES = [['SalmonSam', 'greedy'], ['TunaTina', 'hunter'], ['WasabiWill', 'coward'], ['EbiEmi', 'wanderer'], ['UniUma', 'greedy'], ['NoriNick', 'hunter'], ['TamagoTeo', 'wanderer'], ['GingerGigi', 'coward'], ['KappaKai', 'greedy'], ['UnagiUri', 'hunter']];
    const SUSHI = [{ k: 'maki', v: 1, c: '#22c55e' }, { k: 'nigiri', v: 2, c: '#fb923c' }, { k: 'tuna', v: 2, c: '#ef4444' }, { k: 'tamago', v: 2, c: '#facc15' }, { k: 'roe', v: 3, c: '#f97316' }];
    let snakes = [], food = [], t = 0, dead = false, specialT = 3;
    function mk(name, beh, hue, isMe) { const a = rand(0, TAU); let x, y; do { x = rand(-R * 0.8, R * 0.8); y = rand(-R * 0.8, R * 0.8); } while (isMe ? false : Math.hypot(x, y) > R * 0.85); if (isMe) { x = 0; y = 0; } const s = { name, beh, hue, me: isMe, x, y, a, ta: a, len: isMe ? 22 : irand(18, 80), pts: [], dead: false, kills: 0, think: 0, boost: false, magnet: 0, speed: 0 }; for (let i = 0; i < s.len; i++) s.pts.push({ x: x - Math.cos(a) * i * SEG, y: y - Math.sin(a) * i * SEG }); snakes.push(s); return s; }
    function addFood(x, y, type, v) { if (x === undefined) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * (R - 40); x = Math.cos(a) * r; y = Math.sin(a) * r; } const s = type || pick(SUSHI); food.push({ x, y, s, v: v || s.v, ph: rand(0, TAU), rot: rand(0, TAU) }); }
    const me = mk('You', 'me', 0, true);
    NAMES.forEach(([n, b], i) => mk(n, b, i * 36 + 20, false));
    for (let i = 0; i < 420; i++) addFood();
    const rad = s => 9 + Math.min(16, s.len / 14);
    function kill(s, by) {
      if (s.dead) return; s.dead = true;
      for (let i = 0; i < s.pts.length; i += 2) addFood(s.pts[i].x + rand(-8, 8), s.pts[i].y + rand(-8, 8), SUSHI[1], 2);
      if (by) { by.kills++; if (by.me) { E.sound('coin'); fx.text(by.x, by.y - 40, 'ATE ' + s.name + '!', '#fde047', 24); } }
      fx.burst(s.x, s.y, 30, { col: ['#fff', '#fca5a5', '#86efac'], spd: 260, shape: 's' });
      if (s.me) { dead = true; E.sound('die'); E.gameOver({ score: s.len, title: by ? 'Eaten by ' + by.name + '!' : 'Bumped the counter!', lines: ['Length: ' + s.len, 'Snakes gobbled: ' + s.kills] }); }
      else setTimeout(() => { if (E.g === api) { snakes = snakes.filter(q => q !== s); const nm = NAMES.find(n => n[0] === s.name); mk(s.name, s.beh, s.hue, false); } }, 3000);
    }
    function think(s, dt) {
      s.think -= dt; if (s.think > 0) return; s.think = rand(0.12, 0.3);
      let ta = s.a; const near = snakes.filter(o => o !== s && !o.dead && dist(o.x, o.y, s.x, s.y) < 420);
      let best = null, bd = 1e9; for (const f of food) { const d = dist(f.x, f.y, s.x, s.y) / (f.v + (f.s.k === 'gold' ? 8 : 0)); if (d < bd) { bd = d; best = f; } }
      if (best) ta = Math.atan2(best.y - s.y, best.x - s.x);
      if (s.beh === 'hunter') { const prey = near.find(o => o.len < s.len * 1.2); if (prey) ta = Math.atan2(prey.y + Math.sin(prey.a) * 100 - s.y, prey.x + Math.cos(prey.a) * 100 - s.x); }
      if (s.beh === 'coward') { const big = near.find(o => o.len > s.len); if (big) ta = Math.atan2(s.y - big.y, s.x - big.x); }
      if (s.beh === 'wanderer' && Math.random() < 0.3) ta = s.a + rand(-1, 1);
      for (const off of [0, 0.5, -0.5, 1.1, -1.1, 1.8, -1.8, 2.6, -2.6]) {
        const a = ta + off, lx = s.x + Math.cos(a) * 80, ly = s.y + Math.sin(a) * 80; let bad = Math.hypot(lx, ly) > R - 50;
        if (!bad) for (const o of snakes) { if (o.dead) continue; for (let i = o === s ? 10 : 0; i < o.pts.length; i += 3) if (Math.abs(o.pts[i].x - lx) < 40 && Math.abs(o.pts[i].y - ly) < 40 && dist(lx, ly, o.pts[i].x, o.pts[i].y) < rad(o) + 22) { bad = true; break; } if (bad) break; }
        if (!bad) { ta = a; break; }
      }
      s.ta = ta; s.boost = (s.beh === 'hunter' && near.length && s.len > 30 && Math.random() < 0.35) || (s.beh === 'coward' && near.some(o => o.len > s.len) && s.len > 25);
    }
    function drawSeg(x, y, r, s, i, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      circle(ctx, 0, 0, r, '#14532d'); circle(ctx, 0, 0, r * 0.82, '#f8fafc');
      const fill = ['#f97316', '#ef4444', '#22c55e', '#facc15'][(Math.floor(i / 3) + (s.hue / 36 | 0)) % 4]; circle(ctx, 0, 0, r * 0.42, fill);
      for (let k = 0; k < 5; k++) { const aa = k / 5 * TAU; circle(ctx, Math.cos(aa) * r * 0.62, Math.sin(aa) * r * 0.62, r * 0.07, 'rgba(0,0,0,.08)'); }
      ctx.restore();
    }
    function drawFood(f) {
      const b = 1 + 0.08 * Math.sin(t * 4 + f.ph), x = f.x, y = f.y; ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot); ctx.scale(b, b);
      const k = f.s.k;
      if (k === 'gold' || k === 'rainbow' || k === 'wasabi') { ctx.drawImage(E.glow(k === 'gold' ? 50 : k === 'wasabi' ? 110 : (t * 120) % 360), -28, -28, 56, 56); }
      if (k === 'maki' || k === 'rainbow') { circle(ctx, 0, 0, 9, '#14532d'); circle(ctx, 0, 0, 7, '#fff'); circle(ctx, 0, 0, 3.5, k === 'rainbow' ? hsl((t * 200) % 360, 90, 60) : f.s.c); }
      else if (k === 'wasabi') { ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.quadraticCurveTo(0, -14, 9, 6); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = '#f8fafc'; rr(ctx, -10, -4, 20, 10, 5); ctx.fill(); ctx.fillStyle = k === 'gold' ? '#facc15' : f.s.c; rr(ctx, -11, -8, 22, 8, 4); ctx.fill(); if (k === 'tamago' || k === 'gold') { ctx.fillStyle = '#14532d'; ctx.fillRect(-2, -8, 4, 14); } if (k === 'roe') { for (let i = 0; i < 5; i++) circle(ctx, -8 + i * 4, -9, 2.2, '#fb923c'); } }
      ctx.restore();
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt);
        specialT -= dt; if (specialT <= 0) { specialT = rand(2.5, 5); const k = pick(['gold', 'rainbow', 'wasabi', 'gold']); addFood(undefined, undefined, { k, v: k === 'gold' ? 12 : 3, c: '#facc15' }, k === 'gold' ? 12 : 3); }
        if (!dead) { const d = E.dir(); if (d.mag > 0.1) me.ta = Math.atan2(d.y, d.x); me.boost = E.boost(); }
        for (const s of snakes) {
          if (s.dead) continue; if (!s.me) think(s, dt);
          s.a += clamp(angDiff(s.ta, s.a), -4 * dt, 4 * dt);
          s.magnet = Math.max(0, s.magnet - dt); s.speed = Math.max(0, s.speed - dt);
          const boosting = s.boost && s.len > 12; const sp = (boosting ? 300 : 170) * (s.speed > 0 ? 1.35 : 1);
          if (boosting) { s.bt = (s.bt || 0) + dt; if (s.bt > 0.14) { s.bt = 0; s.len--; const tl = s.pts[s.pts.length - 1]; addFood(tl.x, tl.y, SUSHI[0], 1); } if (s.me) E.sound('boost', 140); }
          s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt; s.pts[0] = { x: s.x, y: s.y };
          for (let i = 1; i < s.pts.length; i++) { const p = s.pts[i], q = s.pts[i - 1], d = dist(p.x, p.y, q.x, q.y); if (d > SEG) { p.x = q.x + (p.x - q.x) / d * SEG; p.y = q.y + (p.y - q.y) / d * SEG; } }
          while (s.pts.length < s.len) { const l = s.pts[s.pts.length - 1]; s.pts.push({ x: l.x, y: l.y }); } if (s.pts.length > s.len) s.pts.length = s.len;
          if (Math.hypot(s.x, s.y) > R - 10) { kill(s, null); continue; }
          const r = rad(s), reach = r + (s.magnet > 0 ? 90 : 10);
          for (let i = food.length - 1; i >= 0; i--) { const f = food[i]; if (Math.abs(f.x - s.x) > reach + 10 || Math.abs(f.y - s.y) > reach + 10) continue; const d = dist(f.x, f.y, s.x, s.y); if (s.magnet > 0 && d > r + 10) { f.x += (s.x - f.x) * dt * 6; f.y += (s.y - f.y) * dt * 6; continue; } if (d < r + 12) { food.splice(i, 1); s.len += f.v; if (f.s.k === 'rainbow') s.magnet = 8; if (f.s.k === 'wasabi') s.speed = 6; if (s.me) { E.sound(f.s.k === 'gold' ? 'coin' : 'eat', 30); if (f.s.k === 'gold' || f.s.k === 'rainbow' || f.s.k === 'wasabi') fx.text(s.x, s.y - 40, { gold: '+12 GOLDEN!', rainbow: '🌈 MAGNET!', wasabi: '🟢 WASABI RUSH!' }[f.s.k], '#fde047', 22); } } }
        }
        for (const s of snakes) {
          if (s.dead) continue;
          for (const o of snakes) { if (o === s || o.dead) continue; const ro = rad(o); if (Math.abs(o.x - s.x) > o.len * SEG + 80 || Math.abs(o.y - s.y) > o.len * SEG + 80) continue; for (let i = 1; i < o.pts.length; i++) { const p = o.pts[i]; if (Math.abs(p.x - s.x) < ro + 10 && Math.abs(p.y - s.y) < ro + 10 && dist(p.x, p.y, s.x, s.y) < ro + rad(s) * 0.55) { kill(s, o); break; } } if (s.dead) break; }
        }
        while (food.length < 420) addFood();
        if (!dead) { const z = clamp(1.05 - me.len / 700, 0.55, 1.05) * Math.min(1.2, Math.min(E.W, E.H) / 700); E.follow(me.x, me.y, z, dt); }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = '#3b1d14'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(40);
        // wooden sushi counter
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
        ctx.fillStyle = '#f2d2a9'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
        ctx.strokeStyle = 'rgba(160,110,60,.25)'; ctx.lineWidth = 3; for (let y = Math.floor(v.y0 / 46) * 46; y < v.y1; y += 46) { ctx.beginPath(); for (let x = v.x0; x < v.x1; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + y) * 4); ctx.stroke(); }
        // decorative plates
        for (let i = 0; i < 26; i++) { const a = i * 2.39, r = 300 + (i * 61) % (R - 400), px = Math.cos(a) * r, py = Math.sin(a) * r; if (px < v.x0 - 80 || px > v.x1 + 80 || py < v.y0 - 80 || py > v.y1 + 80) continue; ellipse(ctx, px, py, 70, 70, 'rgba(255,255,255,.35)'); ctx.strokeStyle = 'rgba(30,64,175,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, 60, 0, TAU); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, R + 13, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R + 2, 0, TAU); ctx.stroke();
        for (const f of food) { if (f.x < v.x0 || f.x > v.x1 || f.y < v.y0 || f.y > v.y1) continue; drawFood(f); }
        for (const s of snakes) {
          if (s.dead) continue; const r = rad(s);
          if (s.boost && s.len > 12) ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 20);
          for (let i = s.pts.length - 1; i > 0; i -= 1) { const p = s.pts[i]; if (p.x < v.x0 - 30 || p.x > v.x1 + 30 || p.y < v.y0 - 30 || p.y > v.y1 + 30) continue; const q = s.pts[i - 1]; drawSeg(p.x, p.y, r, s, i, Math.atan2(q.y - p.y, q.x - p.x)); }
          ctx.globalAlpha = 1;
          // head: salmon nigiri face
          ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
          if (s.magnet > 0) { ctx.strokeStyle = hsl((t * 200) % 360, 90, 60, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r + 14 + Math.sin(t * 8) * 3, 0, TAU); ctx.stroke(); }
          ellipse(ctx, 0, 0, r * 1.25, r * 1.05, '#f8fafc'); ctx.fillStyle = hsl(s.me ? 20 : s.hue, 85, 62); ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 1.15, r * 0.95, 0, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-r * 0.2, k * r * 0.45); ctx.lineTo(r * 0.7, k * r * 0.45 - r * 0.2); ctx.stroke(); }
          for (const sd of [-1, 1]) { circle(ctx, r * 0.55, sd * r * 0.42, r * 0.28, '#fff'); circle(ctx, r * 0.65, sd * r * 0.42, r * 0.14, '#111'); }
          ctx.restore();
          label(ctx, s.name, s.x, s.y - r - 16, 13, s.me ? '#7c2d12' : '#1f2937');
        }
        fx.draw(ctx);
        E.endWorld();
        // minimap
        const mm = Math.min(120, E.W * 0.22), mx = 14, my = E.H - mm - 14; circle(ctx, mx + mm / 2, my + mm / 2, mm / 2, 'rgba(0,0,0,.45)');
        for (const s of snakes) if (!s.dead) circle(ctx, mx + mm / 2 + s.x / R * mm / 2, my + mm / 2 + s.y / R * mm / 2, s.me ? 4 : 2.5, s.me ? '#fde047' : '#fca5a5');
      },
      hud() { const live = snakes.filter(s => !s.dead).sort((a, b) => b.len - a.len); const top = live.slice(0, 8).map(s => ({ n: s.name, s: s.len, me: s.me })); if (!me.dead && !top.some(r => r.me)) top.push({ n: 'You', s: me.len, me: true, rank: live.indexOf(me) + 1 }); return { stats: [['Length', me.len], ['Gobbled', me.kills]].concat(me.magnet > 0 ? [['🌈 Magnet', Math.ceil(me.magnet) + 's']] : []), board: top, boardTitle: '🍣 TOP ROLLERS' }; }
    };
    return api;
  }
});
