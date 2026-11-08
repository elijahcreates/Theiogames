/* =====================================================================
   TWO PLAYER ADVENTURE  (co-op puzzle platformer: Bolt & Bloom)
   ===================================================================== */
registerGame({
  id: 'coop', title: 'Two Player Adventure', emoji: '🤖', c1: '#4facfe', c2: '#f093fb', cats: ['Puzzle', 'Multiplayer', 'Creative'], twoP: true, isNew: true, featured: true,
  desc: 'Bolt the robot and Bloom the flower sprite must work together! Hold switches, open doors, push crates, ride elevators and dodge hazards – both must reach the exit.',
  controls: 'P1: WASD • P2: arrows', scoreLabel: 'SCORE',
  hint: '1 player: move with WASD/arrows, jump with W/↑, TAB switches hero, S/↓ pulls levers.', hintTouch: 'Use the buttons to move & jump. ⇄ switches between Bolt and Bloom.',
  hint2: 'P1 Bolt: A/D move, W jump, S lever • P2 Bloom: ←/→ move, ↑ jump, ↓ lever. Bolt can push crates & walk on ⚡ – Bloom jumps higher & walks on thorns.', hint2Touch: 'P1 (Bolt) uses the LEFT buttons, P2 (Bloom) the RIGHT buttons. Work together!',
  p1sub: 'Control both heroes – switch with TAB', p2sub: 'P1 = Bolt (WASD) • P2 = Bloom (arrows)',
  create(E) {
    const ctx = E.ctx, fx = Fx(), two = E.mode === 2, T = 40;
    const LV = [
      { n: 'Teamwork', m: ["################################", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#...................R..........#", "#..................pR..........#", "#.......u...........R..........#", "#.1.2.......r.......R...r..A.B.#", "################################"] },
      { n: 'Sparks & Thorns', m: ["################################", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#.........p....................#", "#.......#####..................#", "#..........u.......HHHHH.......#", "#.1.2....eeee...h..ttttt...A.B.#", "################################"] },
      { n: 'Lift Off', m: ["################################", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#.....................p........#", "#..............................#", "#..............................#", "#...................A.B..g.....#", "#.................#########....#", "#..............................#", "#.............u................#", "#.1.2...C..................mm..#", "################################"] },
      { n: 'Lever Lab', m: ["################################", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..........................p...#", "#..............................#", "#...............u..............#", "#.........K...........R........#", "#.........K...........R........#", "#.........K...........R........#", "#.1.2.L...K..ee.tt..r.R..r.A.B.#", "################################"] },
      { n: 'Grand Finale', m: ["################################", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#..............................#", "#........p.....................#", "#......................R.......#", "#......................R.......#", "#......#####...........R.......#", "#.........u.....HHHHH..R.......#", "#.1.2..eeee..h..ttttt.rR.r.A.B.#", "################################"] }
    ];
    let li = 0, map, W, H, heroes, crates, elev, lever = false, t = 0, deaths = 0, gems = 0, totalGems = 0, active = 0, done = 0, view, msg = '', msgT = 0, gemList = [];
    const plates = { r: false, h: false, g: false };
    function load(i) {
      li = i; map = LV[i].m.map(r => r.split('')); H = map.length; W = map[0].length; crates = []; gemList = []; elev = { tiles: [], off: 0 }; lever = false; done = 0;
      heroes = [mkHero(0), mkHero(1)];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = map[y][x];
        if (c === '1' || c === '2') { const h = heroes[c === '1' ? 0 : 1]; h.x = h.sx = x * T + 8; h.y = h.sy = y * T + T - h.h; map[y][x] = '.'; }
        else if (c === 'C') { crates.push({ x: x * T + 1, y: y * T + 1, w: T - 2, h: T - 2, vy: 0, sx: x * T + 1, sy: y * T + 1 }); map[y][x] = '.'; }
        else if (c === 'm') { elev.tiles.push({ x, y }); map[y][x] = '.'; }
        else if (c === 'u' || c === 'p') { gemList.push({ x: x * T + T / 2, y: y * T + T / 2, who: c === 'u' ? 0 : 1, got: false }); map[y][x] = '.'; }
      }
      msg = 'LEVEL ' + (i + 1) + ': ' + LV[i].n; msgT = 2.4;
    }
    function mkHero(i) { return { i, x: 0, y: 0, w: 24, h: 34, vx: 0, vy: 0, ground: false, face: 1, sx: 0, sy: 0, onExit: false, blink: 0 }; }
    load(0);
    function tileSolid(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true; const c = map[ty][tx];
      return c === '#' || (c === 'R' && !plates.r) || (c === 'K' && !lever) || (c === 'H' && plates.h);
    }
    const elevRects = () => elev.tiles.map(e => ({ x: e.x * T, y: e.y * T + elev.off, w: T, h: T }));
    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    function solidRects(box, exclude) {
      const out = [], x0 = Math.floor(box.x / T) - 1, x1 = Math.floor((box.x + box.w) / T) + 1, y0 = Math.floor(box.y / T) - 1, y1 = Math.floor((box.y + box.h) / T) + 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileSolid(x, y)) out.push({ x: x * T, y: y * T, w: T, h: T });
      for (const r of elevRects()) out.push(r);
      for (const c of crates) if (c !== exclude) out.push(c);
      return out;
    }
    function moveBody(b, dx, dy, pusher) {
      b.x += dx;
      for (const r of solidRects(b, b)) if (overlap(b, r)) {
        if (pusher && crates.indexOf(r) >= 0 && dy === 0) { const c = r, pdx = dx > 0 ? (b.x + b.w) - c.x : (b.x) - (c.x + c.w); const before = c.x; moveBody(c, pdx, 0, false); if (Math.abs(c.x - before) > 0.01 && !overlap(b, c)) continue; }
        b.x = dx > 0 ? r.x - b.w : r.x + r.w; if (b.vx !== undefined) b.vx = 0;
      }
      b.y += dy; let landed = false;
      for (const r of solidRects(b, b)) if (overlap(b, r)) { if (dy > 0) { b.y = r.y - b.h; landed = true; } else b.y = r.y + r.h; b.vy = 0; }
      return landed;
    }
    function die(h) { deaths++; E.sound('die'); E.shake(8); fx.burst(h.x + h.w / 2, h.y + h.h / 2, 30, { col: h.i ? ['#f472b6', '#86efac'] : ['#60a5fa', '#fde047'], spd: 260 }); msg = (h.i ? 'Bloom' : 'Bolt') + (h.i ? ' got zapped!' : ' got tangled in thorns!'); msgT = 1.6; const keep = gemList.map(g => g.got); load(li); gemList.forEach((g, k) => g.got = keep[k]); }
    function control(h, L, R, J) {
      const sp = 210, acc = h.ground ? 2400 : 1500; const dir = (R ? 1 : 0) - (L ? 1 : 0);
      if (dir) { h.vx = clamp(h.vx + dir * acc * (1 / 60), -sp, sp); h.face = dir; } else h.vx *= h.ground ? 0.7 : 0.92;
      if (J && h.ground) { h.vy = h.i ? -730 : -630; h.ground = false; E.sound('jump', 40); }
    }
    function lev(h) { const tx = Math.floor((h.x + h.w / 2) / T), ty = Math.floor((h.y + h.h / 2) / T); if (map[ty] && map[ty][tx] === 'L') { lever = !lever; E.sound('click'); E.sound(lever ? 'power' : 'bad'); fx.text(h.x, h.y - 20, lever ? 'Lever ON' : 'Lever OFF', '#fde047', 18); } }
    if (E.touch) {
      if (two) E.pads([{ k: 'KeyA', label: '◀', left: 12, bottom: 16, size: 64, cls: 'p1' }, { k: 'KeyD', label: '▶', left: 84, bottom: 16, size: 64, cls: 'p1' }, { k: 'KeyW', label: '⤒', left: 48, bottom: 90, size: 60, cls: 'p1' }, { k: 'KeyS', label: '🔧', left: 120, bottom: 90, size: 48, cls: 'p1' },
        { k: 'ArrowLeft', label: '◀', right: 84, bottom: 16, size: 64, cls: 'p2' }, { k: 'ArrowRight', label: '▶', right: 12, bottom: 16, size: 64, cls: 'p2' }, { k: 'ArrowUp', label: '⤒', right: 48, bottom: 90, size: 60, cls: 'p2' }, { k: 'ArrowDown', label: '🔧', right: 120, bottom: 90, size: 48, cls: 'p2' }]);
      else E.pads([{ k: 'KeyA', label: '◀', left: 14, bottom: 18, size: 74 }, { k: 'KeyD', label: '▶', left: 98, bottom: 18, size: 74 }, { k: 'KeyW', label: '⤒', right: 20, bottom: 18, size: 80 }, { k: 'KeyS', label: '🔧', right: 110, bottom: 24, size: 56 }, { k: 'Tab', label: '⇄', right: 40, bottom: 110, size: 56 }]);
    }
    function drawHero(h) {
      const x = h.x, y = h.y, sel = !two && active === h.i; ctx.save(); ctx.translate(x + h.w / 2, y + h.h);
      if (sel) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-6, -h.h - 16); ctx.lineTo(6, -h.h - 16); ctx.lineTo(0, -h.h - 8); ctx.fill(); }
      ctx.scale(h.face, 1); const bob = h.ground && Math.abs(h.vx) > 20 ? Math.abs(Math.sin(t * 14)) * 2 : 0;
      if (h.i === 0) { // Bolt the robot
        ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-9, -8, 7, 8); ctx.fillRect(2, -8, 7, 8);
        ctx.fillStyle = lgrad(ctx, 0, -34, 0, -6, ['#93c5fd', '#2563eb']); rr(ctx, -13, -32 - bob, 26, 26, 6); ctx.fill(); ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#0f172a'; rr(ctx, -9, -27 - bob, 18, 9, 3); ctx.fill(); ctx.fillStyle = '#67e8f9'; ctx.fillRect(-6 + 2, -24 - bob, 4, 3); ctx.fillRect(3, -24 - bob, 4, 3);
        ctx.strokeStyle = '#1e3a8a'; ctx.beginPath(); ctx.moveTo(0, -32 - bob); ctx.lineTo(0, -40 - bob); ctx.stroke(); circle(ctx, 0, -41 - bob, 3, Math.sin(t * 6) > 0 ? '#fde047' : '#f97316');
      } else { // Bloom the flower sprite
        ctx.fillStyle = '#15803d'; ctx.fillRect(-7, -8, 5, 8); ctx.fillRect(2, -8, 5, 8);
        ellipse(ctx, 0, -14 - bob, 10, 10, '#4ade80'); ctx.strokeStyle = '#166534'; ctx.lineWidth = 2; ctx.stroke();
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 0.6; ellipse(ctx, Math.cos(a) * 9, -30 - bob + Math.sin(a) * 9, 6, 6, k % 2 ? '#f472b6' : '#f9a8d4'); }
        circle(ctx, 0, -30 - bob, 8, '#fde047'); circle(ctx, 3, -31 - bob, 1.8, '#111');
      }
      ctx.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        if (done) { done += dt; if (done > 1.8) { if (li + 1 < LV.length) { E.coins(10); load(li + 1); } else { E.ach('coop'); E.gameOver({ score: 500 + gems * 50 - deaths * 10, win: true, title: 'Adventure Complete!', lines: ['Gems: ' + gems + ' • Restarts: ' + deaths], twoP: two }); done = 0; } } return; }
        const K = E.key;
        // plates
        const bodies = heroes.concat(crates); plates.r = plates.h = plates.g = false;
        for (const b of bodies) { const tx = Math.floor((b.x + b.w / 2) / T), ty = Math.floor((b.y + b.h - 2) / T); const c = map[ty] && map[ty][tx]; if (c === 'r') plates.r = true; if (c === 'h') plates.h = true; if (c === 'g') plates.g = true; }
        // elevator
        const target = plates.g ? -3 * T : 0, dOff = clamp(target - elev.off, -90 * dt, 90 * dt);
        if (dOff) { const before = elevRects(); elev.off += dOff; const after = elevRects(); for (const b of bodies) for (let k = 0; k < after.length; k++) { const r0 = before[k]; if (Math.abs(b.y + b.h - r0.y) < 3 && b.x + b.w > r0.x && b.x < r0.x + r0.w) b.y += dOff; else if (overlap(b, after[k])) b.y = after[k].y - b.h; } }
        // input
        if (two) { control(heroes[0], K('KeyA'), K('KeyD'), K('KeyW')); control(heroes[1], K('ArrowLeft'), K('ArrowRight'), K('ArrowUp')); }
        else { control(heroes[active], K('KeyA') || K('ArrowLeft'), K('KeyD') || K('ArrowRight'), K('KeyW') || K('ArrowUp') || K('Space')); control(heroes[1 - active], false, false, false); }
        for (const h of heroes) {
          h.vy = Math.min(900, h.vy + 1800 * dt);
          const landed = moveBody(h, h.vx * dt, 0, h.i === 0); const l2 = moveBody(h, 0, h.vy * dt, false); h.ground = l2;
          // hazards
          const cx = Math.floor((h.x + h.w / 2) / T), cyb = Math.floor((h.y + h.h - 4) / T), c = map[cyb] && map[cyb][cx];
          if ((c === 'e' && h.i === 1) || (c === 't' && h.i === 0)) return die(h);
          for (const g of gemList) if (!g.got && g.who === h.i && Math.abs(g.x - (h.x + h.w / 2)) < 22 && Math.abs(g.y - (h.y + h.h / 2)) < 26) { g.got = true; gems++; E.sound('coin'); fx.burst(g.x, g.y, 14, { col: g.who ? '#f472b6' : '#60a5fa', spd: 160, shape: 'star' }); }
          const ex = map[Math.floor((h.y + h.h / 2) / T)] && map[Math.floor((h.y + h.h / 2) / T)][cx]; h.onExit = (h.i === 0 && ex === 'A') || (h.i === 1 && ex === 'B');
        }
        for (const c of crates) { c.vy = Math.min(900, (c.vy || 0) + 1800 * dt); moveBody(c, 0, c.vy * dt, false); }
        if (heroes[0].onExit && heroes[1].onExit && !done) { done = 0.01; E.sound('win'); fx.burst(E.W / 2, E.H / 2, 60, { col: ['#60a5fa', '#f472b6', '#fde047'], spd: 380, shape: 'star' }); msg = 'LEVEL COMPLETE!'; msgT = 2; }
      },
      draw() {
        view = E.fit(W * T, H * T, 4); ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        const hue = [210, 160, 270, 30, 330][li];
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H * T, [hsl(hue, 45, 22), hsl(hue + 30, 40, 12)]); ctx.fillRect(0, 0, W * T, H * T);
        for (let i = 0; i < 18; i++) { ctx.globalAlpha = 0.07; circle(ctx, (i * 197) % (W * T), (i * 83) % (H * T), 40 + (i % 4) * 25, hsl(hue + 40, 70, 70)); } ctx.globalAlpha = 1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const c = map[y][x], px = x * T, py = y * T;
          if (c === '#') { ctx.fillStyle = hsl(hue, 20, 30); ctx.fillRect(px, py, T, T); ctx.fillStyle = hsl(hue, 22, 38); ctx.fillRect(px + 2, py + 2, T - 4, 6); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1); if (y > 0 && map[y - 1][x] !== '#') { ctx.fillStyle = hsl(hue + 60, 50, 45); ctx.fillRect(px, py, T, 5); } }
          else if (c === 'R' || c === 'K') { const open = c === 'R' ? plates.r : lever, col = c === 'R' ? '#ef4444' : '#a855f7'; if (!open) { ctx.fillStyle = col; shadowOn(ctx, col, 14); ctx.fillRect(px + 10, py, T - 20, T); shadowOff(ctx); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(px + 14, py, 3, T); } else { ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.setLineDash([4, 4]); ctx.strokeRect(px + 10, py, T - 20, T); ctx.setLineDash([]); ctx.globalAlpha = 1; } }
          else if (c === 'H') { if (plates.h) { ctx.fillStyle = '#f59e0b'; ctx.fillRect(px, py, T, 12); ctx.fillStyle = '#92400e'; ctx.fillRect(px + 4, py + 12, 4, 8); ctx.fillRect(px + T - 8, py + 12, 4, 8); } else { ctx.strokeStyle = 'rgba(245,158,11,.4)'; ctx.setLineDash([5, 5]); ctx.strokeRect(px, py, T, 12); ctx.setLineDash([]); } }
          else if (c === 'e') { ctx.fillStyle = 'rgba(250,204,21,.25)'; ctx.fillRect(px, py + T * 0.55, T, T * 0.45); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 5; k++) ctx.lineTo(px + k * T / 5, py + T * 0.75 + (k % 2 ? -1 : 1) * 6 * Math.sin(t * 20 + x + k)); ctx.stroke(); }
          else if (c === 't') { ctx.fillStyle = '#14532d'; ctx.fillRect(px, py + T * 0.7, T, T * 0.3); ctx.fillStyle = '#22c55e'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px + k * 10, py + T); ctx.lineTo(px + k * 10 + 5, py + T * 0.35 + Math.sin(t * 2 + k) * 3); ctx.lineTo(px + k * 10 + 10, py + T); ctx.fill(); } }
          else if (c === 'r' || c === 'h' || c === 'g') { const on = plates[c], col = c === 'r' ? '#ef4444' : c === 'h' ? '#f59e0b' : '#22c55e'; ctx.fillStyle = '#334155'; ctx.fillRect(px + 4, py + T - 6, T - 8, 6); ctx.fillStyle = col; ctx.fillRect(px + 8, py + T - (on ? 8 : 12), T - 16, on ? 3 : 7); }
          else if (c === 'L') { ctx.fillStyle = '#475569'; ctx.fillRect(px + 12, py + T - 8, 16, 8); ctx.save(); ctx.translate(px + 20, py + T - 6); ctx.rotate(lever ? 0.7 : -0.7); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2, -24, 4, 24); circle(ctx, 0, -26, 5, lever ? '#4ade80' : '#a855f7'); ctx.restore(); }
          else if (c === 'A' || c === 'B') { const col = c === 'A' ? '#3b82f6' : '#ec4899'; ctx.fillStyle = col; rr(ctx, px + 4, py - T * 0.6, T - 8, T * 1.6, 12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(ctx, px + 9, py - T * 0.5, T - 18, T * 1.4, 9); ctx.fill(); E.emoji(ctx, c === 'A' ? '🤖' : '🌸', px + T / 2, py - 2, 20); }
        }
        for (const r of elevRects()) { ctx.fillStyle = lgrad(ctx, 0, r.y, 0, r.y + T, ['#86efac', '#16a34a']); ctx.fillRect(r.x, r.y, r.w, 12); ctx.fillStyle = 'rgba(22,163,74,.5)'; ctx.fillRect(r.x + 6, r.y + 12, r.w - 12, H * T - r.y); }
        for (const c of crates) { ctx.fillStyle = '#b45309'; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4); ctx.beginPath(); ctx.moveTo(c.x + 3, c.y + 3); ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3); ctx.moveTo(c.x + c.w - 3, c.y + 3); ctx.lineTo(c.x + 3, c.y + c.h - 3); ctx.stroke(); }
        for (const g of gemList) if (!g.got) { const b = Math.sin(t * 3 + g.x) * 3; ctx.drawImage(E.glow(g.who ? 320 : 210), g.x - 22, g.y - 22 + b, 44, 44); ctx.fillStyle = g.who ? '#f9a8d4' : '#93c5fd'; ctx.beginPath(); ctx.moveTo(g.x, g.y - 10 + b); ctx.lineTo(g.x + 8, g.y + b); ctx.lineTo(g.x, g.y + 10 + b); ctx.lineTo(g.x - 8, g.y + b); ctx.closePath(); ctx.fill(); }
        heroes.forEach(drawHero);
        fx.draw(ctx);
        label(ctx, 'LEVEL ' + (li + 1) + '/' + LV.length + ' – ' + LV[li].n + '   💎 ' + gems, W * T / 2, 22, 18, '#fff');
        if (!two) label(ctx, 'Controlling: ' + (active ? '🌸 Bloom' : '🤖 Bolt') + (E.touch ? '' : '  (TAB to switch)'), W * T / 2, 48, 14, '#e0e7ff');
        if (msgT > 0) label(ctx, msg, W * T / 2, H * T * 0.35, 30, '#fde047');
        E.endWorld();
      },
      onKey(c) {
        if (c === 'Tab' || c === 'KeyQ' || c === 'KeyE') { if (!two) { active = 1 - active; E.sound('click'); } }
        if (two) { if (c === 'KeyS') lev(heroes[0]); if (c === 'ArrowDown') lev(heroes[1]); }
        else if (c === 'KeyS' || c === 'ArrowDown') lev(heroes[active]);
      },
      destroy() { E.pads(null); },
      hud() { return null; }
    };
  }
});
