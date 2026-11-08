/* =====================================================================
   SLITHER ARENA  (1P vs AI snakes + local 2P human vs human)
   ===================================================================== */
registerGame({
  id: 'slither', title: 'Slither Arena', emoji: '🐉', c1: '#134e5e', c2: '#71b280', cats: ['IO Arena', 'Arcade', 'Multiplayer'], twoP: true, pop: true,
  desc: 'A glowing arena of hungry snakes! Eat orbs to grow, cut off rivals and make them crash into you. Battle AI snakes or a friend on the same device.',
  controls: 'Mouse / keys / touch • boost', scoreLabel: 'LENGTH', boost: '⚡ BOOST',
  hint: 'Steer with the mouse or A/D (or ←/→). Hold SPACE / click to boost. Don’t hit other snakes with your head!', hintTouch: 'Drag to steer. Hold ⚡ to boost. Don’t hit other snakes with your head!',
  hint2: 'P1 (green): A/D turn, W boost • P2 (pink): ←/→ turn, ↑ boost. Best of 3 rounds – survive or be longest!', hint2Touch: 'P1 uses the LEFT buttons, P2 the RIGHT buttons. Best of 3 rounds!',
  p2info: 'Two human snakes, no AI. P1: A/D + W boost • P2: ←/→ + ↑ boost. Best of 3 rounds.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), two = E.mode === 2, AW = two ? 1500 : 2400, AH = two ? 950 : 1500, SEG = 7;
    const NAMES = ['Noodle', 'Zigzag', 'Viper', 'Mango', 'Slinky', 'Comet', 'Pretzel', 'Neon', 'Twister', 'Biscuit', 'Glimmer', 'Rocket'];
    let snakes = [], food = [], t = 0, view, round = 1, wins = [0, 0], roundT = 90, state = 'play', wait = 0, msg = '', msgT = 0, mouse = null, drag = null;
    function mkSnake(x, y, a, hue, name, kind) { const s = { x, y, a, ta: a, hue, name, kind, len: 26, pts: [], dead: false, boost: false, score: 0, think: 0, pal: (hue + 40) % 360 }; for (let i = 0; i < s.len; i++) s.pts.push({ x: x - Math.cos(a) * i * SEG, y: y - Math.sin(a) * i * SEG }); snakes.push(s); return s; }
    function addFood(x, y, v, hue) { food.push({ x: x === undefined ? rand(30, AW - 30) : x, y: y === undefined ? rand(30, AH - 30) : y, v: v || 1, hue: hue === undefined ? irand(0, 359) : hue, r: 4 + (v || 1) * 1.5, ph: rand(0, TAU) }); }
    function setupRound() {
      snakes = []; food = []; for (let i = 0; i < (two ? 160 : 320); i++) addFood();
      if (two) { mkSnake(250, AH / 2, 0, 130, 'Player 1', 'p1'); mkSnake(AW - 250, AH / 2, Math.PI, 330, 'Player 2', 'p2'); roundT = 90; }
      else { mkSnake(AW / 2, AH / 2, rand(0, TAU), 150, 'You', 'p1'); for (let i = 0; i < 8; i++) spawnAI(); }
      state = 'play'; msg = two ? 'ROUND ' + round : 'EAT • GROW • SURVIVE'; msgT = 1.6;
    }
    function spawnAI() { const used = snakes.map(s => s.name); const nm = NAMES.find(n => used.indexOf(n) < 0) || 'Snek'; let x, y, k = 0; do { x = rand(150, AW - 150); y = rand(150, AH - 150); k++; } while (k < 20 && snakes.some(s => !s.dead && dist(x, y, s.x, s.y) < 300)); const s = mkSnake(x, y, rand(0, TAU), irand(0, 359), nm, 'ai'); s.len = irand(20, 70); s.style = pick(['greedy', 'hunter', 'cautious']); }
    setupRound();
    if (two) { const bb = document.getElementById('boostBtn'); if (bb) setTimeout(() => { bb.hidden = true; }, 0); }
    if (two && E.touch) E.pads([
      { k: 'KeyA', label: '⟲', left: 16, bottom: 20, size: 78, cls: 'p1' }, { k: 'KeyD', label: '⟳', left: 104, bottom: 20, size: 78, cls: 'p1' }, { k: 'KeyW', label: '⚡', left: 60, bottom: 108, size: 62, cls: 'p1' },
      { k: 'ArrowLeft', label: '⟲', right: 104, bottom: 20, size: 78, cls: 'p2' }, { k: 'ArrowRight', label: '⟳', right: 16, bottom: 20, size: 78, cls: 'p2' }, { k: 'ArrowUp', label: '⚡', right: 60, bottom: 108, size: 62, cls: 'p2' }]);
    const radius = s => 7 + Math.min(14, s.len / 18);
    function kill(s, by) {
      if (s.dead) return; s.dead = true; E.sound(s.kind === 'ai' ? 'pop' : 'die');
      for (let i = 0; i < s.pts.length; i += 2) addFood(s.pts[i].x + rand(-6, 6), s.pts[i].y + rand(-6, 6), 2, s.hue);
      if (by) by.score += Math.floor(s.len / 2);
      fx.burst(s.x, s.y, 30, { col: [hsl(s.hue, 90, 60), '#fff'], spd: 260, glow: true });
      if (s.kind === 'ai') setTimeout(() => { if (E.g === api && !two) { snakes = snakes.filter(q => q !== s); spawnAI(); } }, 2500);
    }
    function steer(s, dt) {
      if (s.kind === 'ai') {
        s.think -= dt;
        if (s.think <= 0) {
          s.think = rand(0.15, 0.35);
          let best = null, bd = 1e9; for (const f of food) { const d = dist(f.x, f.y, s.x, s.y) / f.v; if (d < bd) { bd = d; best = f; } }
          let ta = best ? Math.atan2(best.y - s.y, best.x - s.x) : s.a;
          if (s.style === 'hunter') { const me = snakes.find(q => q.kind === 'p1' && !q.dead); if (me && dist(me.x, me.y, s.x, s.y) < 350 && s.len > me.len * 0.7) ta = Math.atan2(me.y + Math.sin(me.a) * 90 - s.y, me.x + Math.cos(me.a) * 90 - s.x); }
          // avoid walls & bodies with look-ahead
          for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4]) {
            const a = ta + off, lx = s.x + Math.cos(a) * 70, ly = s.y + Math.sin(a) * 70; let bad = lx < 40 || ly < 40 || lx > AW - 40 || ly > AH - 40;
            if (!bad) for (const o of snakes) { if (o.dead) continue; for (let i = o === s ? 8 : 0; i < o.pts.length; i += 3) { if (dist(lx, ly, o.pts[i].x, o.pts[i].y) < radius(o) + 22) { bad = true; break; } } if (bad) break; }
            if (!bad) { ta = a; break; }
          }
          s.ta = ta; s.boost = s.style === 'hunter' && s.len > 40 && Math.random() < 0.15;
        }
        return;
      }
      const K = E.key;
      if (two) { const k = s.kind === 'p1' ? ['KeyA', 'KeyD', 'KeyW'] : ['ArrowLeft', 'ArrowRight', 'ArrowUp']; const turn = (K(k[1]) ? 1 : 0) - (K(k[0]) ? 1 : 0); s.ta = s.a + turn * 1.2; s.boost = K(k[2]); return; }
      const turn = ((K('KeyD') || K('ArrowRight')) ? 1 : 0) - ((K('KeyA') || K('ArrowLeft')) ? 1 : 0);
      if (turn) s.ta = s.a + turn * 1.2; else if (drag) s.ta = Math.atan2(drag.y, drag.x); else if (mouse) s.ta = Math.atan2(mouse.y - s.y, mouse.x - s.x);
      s.boost = K('Space') || K('KeyW') || K('ArrowUp') || E.boost() || (mouse && mouse.down);
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        if (state === 'roundover') { wait -= dt; if (wait <= 0) { round++; setupRound(); } return; }
        if (two) { roundT -= dt; }
        for (const s of snakes) {
          if (s.dead) continue; steer(s, dt);
          s.a += clamp(angDiff(s.ta, s.a), -3.6 * dt, 3.6 * dt);
          const boosting = s.boost && s.len > 15, sp = boosting ? 280 : 160;
          if (boosting) { s.bt = (s.bt || 0) + dt; if (s.bt > 0.12) { s.bt = 0; s.len--; const tl = s.pts[s.pts.length - 1]; addFood(tl.x, tl.y, 1, s.hue); } if (s.kind !== 'ai') E.sound('boost', 120); }
          s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt;
          // body follow
          s.pts[0] = { x: s.x, y: s.y };
          for (let i = 1; i < s.pts.length; i++) { const p = s.pts[i], q = s.pts[i - 1], d = dist(p.x, p.y, q.x, q.y); if (d > SEG) { p.x = q.x + (p.x - q.x) / d * SEG; p.y = q.y + (p.y - q.y) / d * SEG; } }
          while (s.pts.length < s.len) { const l = s.pts[s.pts.length - 1]; s.pts.push({ x: l.x, y: l.y }); } if (s.pts.length > s.len) s.pts.length = s.len;
          // walls
          if (s.x < 10 || s.y < 10 || s.x > AW - 10 || s.y > AH - 10) { kill(s, null); continue; }
          // eat
          const r = radius(s);
          for (let i = food.length - 1; i >= 0; i--) { const f = food[i]; if (Math.abs(f.x - s.x) < r + 14 && Math.abs(f.y - s.y) < r + 14 && dist(f.x, f.y, s.x, s.y) < r + f.r + 6) { food.splice(i, 1); s.len += f.v; s.score += f.v; if (s.kind !== 'ai') E.sound('eat', 30); } }
        }
        // collisions head vs other bodies
        for (const s of snakes) {
          if (s.dead) continue;
          for (const o of snakes) { if (o === s || o.dead) continue; const ro = radius(o); if (Math.abs(o.x - s.x) > o.len * SEG + 60 && Math.abs(o.y - s.y) > o.len * SEG + 60) continue;
            for (let i = 0; i < o.pts.length; i++) { const p = o.pts[i]; if (Math.abs(p.x - s.x) < ro + 6 && Math.abs(p.y - s.y) < ro + 6 && dist(p.x, p.y, s.x, s.y) < ro + radius(s) * 0.6) { if (i === 0 && o.len > s.len) continue; kill(s, o); break; } }
            if (s.dead) break; }
        }
        while (food.length < (two ? 160 : 320)) addFood();
        if (two) {
          const p1 = snakes[0], p2 = snakes[1];
          if (p1.dead || p2.dead || roundT <= 0) {
            let w = -1; if (p1.dead && !p2.dead) w = 1; else if (p2.dead && !p1.dead) w = 0; else if (p1.len !== p2.len) w = p1.len > p2.len ? 0 : 1;
            if (w >= 0) wins[w]++; msg = w < 0 ? 'DRAW ROUND' : 'PLAYER ' + (w + 1) + ' WINS ROUND ' + round; msgT = 2; state = 'roundover'; wait = 2.2; E.sound('win');
            if (wins[0] >= 2 || wins[1] >= 2 || round >= 3) { const W2 = wins[0] === wins[1] ? 0 : wins[0] > wins[1] ? 1 : 2; state = 'over'; E.pads(null); E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: W2 ? 'PLAYER ' + W2 + ' WINS' : 'DRAW', label: 'ROUNDS ' + wins[0] + ' – ' + wins[1], title: '🐉 Arena Champion', lines: ['Final lengths: P1 ' + p1.len + ' • P2 ' + p2.len], delay: 1600 }); }
          }
        } else {
          const me = snakes[0]; if (me.dead && state === 'play') { state = 'over'; E.gameOver({ score: me.len, title: 'You Crashed!', lines: ['Final length: ' + me.len, 'Snakes defeated: ' + Math.floor(me.score / 20)] }); }
          if (!me.dead) { E.cam.x = me.x; E.cam.y = me.y; }
        }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = '#030712'; ctx.fillRect(0, 0, W, H);
        let k, ox, oy;
        if (two) { view = E.fit(AW, AH, 6); view.apply(ctx); k = view.s; }
        else { const me = snakes[0]; const z = clamp(1.1 - me.len / 900, 0.55, 1.1) * Math.min(1.2, Math.min(W, H) / 700); E.cam.zoom += (z - E.cam.zoom) * 0.05; E.beginWorld(); }
        ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, AW, AH);
        ctx.strokeStyle = 'rgba(56,189,248,.06)'; ctx.lineWidth = 2; for (let x = 0; x < AW; x += 60) for (let y = 0; y < AH; y += 52) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(x + (Math.floor(y / 52) % 2) * 30 + Math.cos(a) * 30, y + Math.sin(a) * 30); } ctx.closePath(); ctx.stroke(); }
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 8; shadowOn(ctx, '#ef4444', 18); ctx.strokeRect(0, 0, AW, AH); shadowOff(ctx);
        for (const f of food) { const r = f.r * (1 + 0.15 * Math.sin(t * 4 + f.ph)); ctx.drawImage(E.glow(f.hue), f.x - r * 3, f.y - r * 3, r * 6, r * 6); circle(ctx, f.x, f.y, r, hsl(f.hue, 90, 70)); }
        for (const s of snakes) {
          if (s.dead) continue; const r = radius(s);
          if (s.boost && s.len > 15) for (let i = s.pts.length - 1; i >= 0; i -= 3) ctx.drawImage(E.glow(s.hue), s.pts[i].x - r * 2.2, s.pts[i].y - r * 2.2, r * 4.4, r * 4.4);
          for (let i = s.pts.length - 1; i >= 0; i--) { const p = s.pts[i]; const stripe = Math.floor(i / 4) % 2; circle(ctx, p.x, p.y, r, hsl(stripe ? s.pal : s.hue, 80, i === 0 ? 62 : 48 + (1 - i / s.pts.length) * 12)); }
          // head
          ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
          for (const sd of [-1, 1]) { circle(ctx, r * 0.35, sd * r * 0.5, r * 0.42, '#fff'); circle(ctx, r * 0.5, sd * r * 0.5, r * 0.2, '#111'); }
          ctx.restore();
          label(ctx, s.name, s.x, s.y - r - 14, 13, s.kind === 'p1' ? '#bbf7d0' : s.kind === 'p2' ? '#fbcfe8' : '#e2e8f0');
        }
        fx.draw(ctx);
        E.endWorld();
        if (two) { label(ctx, 'P1 ' + wins[0] + '  ⏱ ' + Math.ceil(Math.max(0, roundT)) + '  ' + wins[1] + ' P2', W / 2, 30, 22, '#fff'); label(ctx, 'Length  ' + snakes[0].len + '  vs  ' + snakes[1].len, W / 2, 58, 15, '#cbd5e1'); }
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.4, 36, '#fde047');
      },
      down(x, y) { if (two) return; if (E.touch) drag = { sx: x, sy: y, x: 0, y: 0 }; else if (mouse) mouse.down = true; },
      move(x, y) { if (two) return; if (drag && E.ptrDown) { drag.x = x - drag.sx; drag.y = y - drag.sy; if (Math.hypot(drag.x, drag.y) < 10) { drag.x = Math.cos(snakes[0].a); drag.y = Math.sin(snakes[0].a); } } else if (!E.touch) { const z = E.cam.zoom; mouse = { x: E.cam.x + (x - W2()) / z, y: E.cam.y + (y - H2()) / z, down: mouse && mouse.down }; } },
      up() { drag = null; if (mouse) mouse.down = false; },
      destroy() { E.pads(null); },
      hud() { if (two) return null; const live = snakes.filter(s => !s.dead).sort((a, b) => b.len - a.len); const me = snakes[0]; const top = live.slice(0, 6).map(s => ({ n: s.name, s: s.len, me: s === me })); if (!me.dead && top.every(r => !r.me)) top.push({ n: 'You', s: me.len, me: true, rank: live.indexOf(me) + 1 }); return { stats: [['Length', me.len]], board: top, boardTitle: 'LONGEST SNAKES' }; }
    };
    const W2 = () => E.W / 2, H2 = () => E.H / 2;
    return api;
  }
});
