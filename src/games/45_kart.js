/* =====================================================================
   KART CLASH  (arena kart battle vs AI, 3-minute matches)
   ===================================================================== */
registerGame({
  id: 'kart', title: 'Kart Clash', emoji: '🏎️', c1: '#f857a6', c2: '#ff5858', cats: ['Arcade', 'IO Arena', 'Popular'], featured: true, hot: true, pop: true, isNew: true, input: 'joy',
  desc: 'Drift around a battle arena in your custom kart! Grab item boxes for rockets, mines, bombs, shields and boosts, blast the AI racers and top the scoreboard in 3-minute matches.',
  controls: 'W/S drive • A/D steer • Space item', scoreLabel: 'HITS',
  hint: 'W / ↑ accelerate • S / ↓ brake & reverse • A/D steer • SPACE fires your item. Drive through ? boxes for items!', hintTouch: 'Drag the joystick to drive • tap 💥 to use your item • drive through ? boxes!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), AW = 2600, AH = 1800, MATCH = 180;
    const KARTS = [{ n: 'Blaze Racer', col: '#ef4444', col2: '#fca5a5', sp: 520, acc: 520, turn: 2.9, shape: 'racer' }, { n: 'Turbo Buggy', col: '#22c55e', col2: '#bbf7d0', sp: 490, acc: 600, turn: 3.3, shape: 'buggy' }, { n: 'Thunder Truck', col: '#3b82f6', col2: '#bfdbfe', sp: 470, acc: 470, turn: 2.6, shape: 'truck', tough: true }, { n: 'Star Glider', col: '#a855f7', col2: '#e9d5ff', sp: 560, acc: 480, turn: 2.7, shape: 'racer' }];
    const BOTS = ['Zoomer', 'Skidz', 'Nitro Nell', 'Turbo Tom', 'Drifty', 'Boomer', 'Vroom Vic'];
    const ITEMS = ['rocket', 'mine', 'bomb', 'shield', 'boost', 'rocket', 'bomb'];
    const ICON = { rocket: '🚀', mine: '💣', bomb: '🧨', shield: '🛡️', boost: '⚡' };
    let karts = [], boxes = [], shots = [], mines = [], walls = [], time = MATCH, t = 0, ready = false, over = false, me;
    // arena walls: border + inner blocks
    walls.push([0, 0, AW, 40], [0, AH - 40, AW, 40], [0, 0, 40, AH], [AW - 40, 0, 40, AH]);
    walls.push([AW / 2 - 220, AH / 2 - 60, 440, 120], [520, 380, 260, 70], [AW - 780, 380, 260, 70], [520, AH - 450, 260, 70], [AW - 780, AH - 450, 260, 70], [AW / 2 - 40, 260, 80, 260], [AW / 2 - 40, AH - 520, 80, 260]);
    const boxSpots = [[300, 300], [AW - 300, 300], [300, AH - 300], [AW - 300, AH - 300], [AW / 2, 160], [AW / 2, AH - 160], [180, AH / 2], [AW - 180, AH / 2], [AW / 2 - 420, AH / 2], [AW / 2 + 420, AH / 2], [900, AH / 2 - 330], [AW - 900, AH / 2 + 330], [900, AH / 2 + 330], [AW - 900, AH / 2 - 330]];
    boxSpots.forEach(([x, y]) => boxes.push({ x, y, t: 0, on: true }));
    function mkKart(def, name, isMe, x, y, a) { const k = { def, name, me: isMe, x, y, a, v: 0, vx: 0, vy: 0, item: null, hits: 0, spin: 0, shield: 0, boost: 0, inv: 2, ai: { t: 0, target: null, rev: 0 }, drift: 0, trail: [] }; karts.push(k); return k; }
    E.choose('Kart Clash', 'Choose your kart', KARTS.map((k, i) => ({ label: ['🔥', '🌿', '⛈️', '✨'][i] + ' ' + k.n, sub: (k.tough ? 'Heavy: shrugs off bumps • ' : '') + 'Speed ' + '★'.repeat(Math.round((k.sp - 440) / 30)) + ' • Handling ' + '★'.repeat(Math.round((k.turn - 2.3) / 0.25)), value: i })), i => {
      const spawns = [[200, 200, 0.7], [AW - 200, 200, 2.4], [200, AH - 200, -0.7], [AW - 200, AH - 200, -2.4], [AW / 2, 120, 1.57], [AW / 2, AH - 120, -1.57], [120, AH / 2, 0], [AW - 120, AH / 2, 3.14]];
      me = mkKart(KARTS[i], 'You', true, spawns[0][0], spawns[0][1], spawns[0][2]);
      BOTS.forEach((n, j) => { const d = Object.assign({}, KARTS[(i + j + 1) % 4]); d.col = hsl((j * 51 + 30) % 360, 75, 52); d.col2 = hsl((j * 51 + 30) % 360, 80, 80); mkKart(d, n, false, spawns[j + 1][0], spawns[j + 1][1], spawns[j + 1][2]); });
      ready = true; E.sound('power');
    });
    if (E.touch) E.pads([{ k: 'Space', label: '💥', right: 26, bottom: 34, size: 96 }]);
    function hitWall(x, y, r) { for (const w of walls) { const cx = clamp(x, w[0], w[0] + w[2]), cy = clamp(y, w[1], w[1] + w[3]); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return { cx, cy }; } return null; }
    function spinOut(k, by, why) {
      if (k.inv > 0 || k.spin > 0) return; if (k.shield > 0) { k.shield = 0; fx.burst(k.x, k.y, 20, { col: '#22d3ee', spd: 200 }); if (k.me || (by && by.me)) E.sound('pop'); return; }
      k.spin = k.def.tough ? 0.9 : 1.3; k.inv = 2.6; k.v *= 0.2; if (k.item && Math.random() < 0.5) k.item = null;
      if (by && by !== k) { by.hits++; if (by.me) { E.sound('score'); fx.text(k.x, k.y - 40, 'HIT ' + k.name + '! +1', '#fde047', 24); } }
      if (k.me) { E.sound('crash'); E.shake(10); }
      fx.burst(k.x, k.y, 26, { col: ['#f97316', '#fde047', '#fff'], spd: 280, glow: true });
    }
    function useItem(k) {
      if (!k.item || k.spin > 0 || !ready || over) return; const it = k.item; k.item = null; const ca = Math.cos(k.a), sa = Math.sin(k.a);
      if (it === 'rocket') { let tgt = null, bd = 1e9; for (const o of karts) { if (o === k) continue; const dx = o.x - k.x, dy = o.y - k.y, d = Math.hypot(dx, dy); if (d < 1100 && Math.abs(angDiff(Math.atan2(dy, dx), k.a)) < 1.2 && d < bd) { bd = d; tgt = o; } } shots.push({ k: 'rocket', x: k.x + ca * 30, y: k.y + sa * 30, a: k.a, v: 760, owner: k, tgt, life: 3 }); if (k.me) E.sound('laser'); }
      else if (it === 'bomb') { shots.push({ k: 'bomb', x: k.x, y: k.y, vx: ca * 620 + k.vx * 0.5, vy: sa * 620 + k.vy * 0.5, z: 0, vz: 380, owner: k, life: 2 }); if (k.me) E.sound('whoosh'); }
      else if (it === 'mine') { mines.push({ x: k.x - ca * 40, y: k.y - sa * 40, owner: k, arm: 0.6 }); if (k.me) E.sound('click'); }
      else if (it === 'shield') { k.shield = 8; if (k.me) E.sound('power'); }
      else if (it === 'boost') { k.boost = 2.2; if (k.me) E.sound('power'); }
    }
    function explode(x, y, owner, R) { E.sound('boom'); fx.burst(x, y, 40, { col: ['#f97316', '#fde047', '#ef4444', '#fff'], spd: 380, glow: true, size: 6 }); for (const k of karts) if (dist(k.x, k.y, x, y) < R) spinOut(k, owner); if (dist(me ? me.x : 0, me ? me.y : 0, x, y) < 600) E.shake(8); }
    function aiDrive(k, dt) {
      const ai = k.ai; ai.t -= dt;
      if (ai.t <= 0) {
        ai.t = rand(0.3, 0.6);
        if (!k.item) { let b = null, bd = 1e9; for (const bx of boxes) if (bx.on) { const d = dist(bx.x, bx.y, k.x, k.y); if (d < bd) { bd = d; b = bx; } } ai.target = b ? { x: b.x, y: b.y } : null; }
        else { let o = null, bd = 1e9; for (const q of karts) if (q !== k && q.spin <= 0) { const d = dist(q.x, q.y, k.x, k.y); if (d < bd) { bd = d; o = q; } } ai.target = o ? { x: o.x, y: o.y, kart: o } : null; }
        if (!ai.target) ai.target = { x: rand(200, AW - 200), y: rand(200, AH - 200) };
      }
      const tg = ai.target; let want = Math.atan2(tg.y - k.y, tg.x - k.x);
      // wall avoidance feelers
      for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) { const a = want + off; if (!hitWall(k.x + Math.cos(a) * 120, k.y + Math.sin(a) * 120, 30)) { want = a; break; } }
      const diff = angDiff(want, k.a); let thr = Math.abs(diff) > 2 ? 0.4 : 1; if (ai.rev > 0) { ai.rev -= dt; thr = -0.8; }
      if (Math.abs(k.v) < 30 && thr > 0) { ai.stuck = (ai.stuck || 0) + dt; if (ai.stuck > 1.2) { ai.rev = 0.8; ai.stuck = 0; } } else ai.stuck = 0;
      if (k.item) { const o = tg.kart; if (k.item === 'shield' || k.item === 'boost') { if (Math.random() < dt * 0.6) useItem(k); } else if (k.item === 'mine') { if (karts.some(q => q !== k && dist(q.x, q.y, k.x, k.y) < 300 && Math.abs(angDiff(Math.atan2(q.y - k.y, q.x - k.x), k.a + Math.PI)) < 0.8)) useItem(k); else if (Math.random() < dt * 0.15) useItem(k); } else if (o && dist(o.x, o.y, k.x, k.y) < 700 && Math.abs(angDiff(Math.atan2(o.y - k.y, o.x - k.x), k.a)) < 0.35) useItem(k); }
      return { thr, steer: clamp(diff * 2.2, -1, 1) * (ai.rev > 0 ? -1 : 1) };
    }
    function drawKart(k) {
      ctx.save(); ctx.translate(k.x, k.y);
      ellipse(ctx, 6, 8, 34, 24, 'rgba(0,0,0,.3)');
      ctx.rotate(k.a + (k.spin > 0 ? k.spin * 12 : 0));
      if (k.inv > 0 && k.spin <= 0 && Math.floor(t * 12) % 2) ctx.globalAlpha = 0.5;
      if (k.boost > 0) { ctx.fillStyle = lgrad(ctx, -60, 0, -28, 0, ['rgba(251,191,36,0)', '#f97316', '#fde047']); ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-62 - Math.random() * 16, 0); ctx.lineTo(-28, 8); ctx.fill(); }
      const d = k.def; ctx.fillStyle = '#111827';
      for (const [wx, wy] of [[-17, -17], [-17, 17], [17, -16], [17, 16]]) { ctx.save(); ctx.translate(wx, wy); if (wx > 0) ctx.rotate(k.steer * 0.4 || 0); rr(ctx, -8, -5, 16, 10, 3); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = lgrad(ctx, 0, -18, 0, 18, [d.col2, d.col, d.col]);
      if (d.shape === 'truck') { rr(ctx, -26, -16, 52, 32, 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-24, -14, 18, 28); }
      else if (d.shape === 'buggy') { ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(14, -15); ctx.lineTo(-22, -14); ctx.lineTo(-26, 0); ctx.lineTo(-22, 14); ctx.lineTo(14, 15); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 3; ctx.strokeRect(-14, -12, 18, 24); }
      else { ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(16, -13); ctx.lineTo(-24, -13); ctx.lineTo(-28, 0); ctx.lineTo(-24, 13); ctx.lineTo(16, 13); ctx.closePath(); ctx.fill(); ctx.fillStyle = d.col2; ctx.fillRect(-30, -16, 6, 32); }
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      circle(ctx, -4, 0, 9, k.me ? '#fde047' : '#f8fafc'); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, -6, 4, 12);
      ctx.globalAlpha = 1; ctx.restore();
      if (k.shield > 0) { ctx.strokeStyle = `rgba(34,211,238,${0.5 + 0.3 * Math.sin(t * 10)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(k.x, k.y, 40, 0, TAU); ctx.stroke(); }
      label(ctx, k.name + (k.item && !k.me ? ' ' + ICON[k.item] : ''), k.x, k.y - 44, 13, k.me ? '#fde047' : '#fff');
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); if (!ready || over) return;
        time -= dt; if (time <= 0) { time = 0; over = true; const rank = karts.slice().sort((a, b) => b.hits - a.hits); const pos = rank.indexOf(me) + 1; if (pos === 1) E.ach('kart'); E.gameOver({ score: me.hits, win: pos === 1, scoreText: '#' + pos, label: 'PLACE • ' + me.hits + ' HITS', title: pos === 1 ? '🏆 You Win the Clash!' : '🏁 Match Over – ' + rank[0].name + ' wins', lines: rank.slice(0, 5).map((k, i) => (i + 1) + '. ' + k.name + ' – ' + k.hits + ' hits') }); return; }
        for (const b of boxes) if (!b.on) { b.t -= dt; if (b.t <= 0) b.on = true; }
        for (const k of karts) {
          k.spin = Math.max(0, k.spin - dt); k.inv = Math.max(0, k.inv - dt); k.shield = Math.max(0, k.shield - dt); k.boost = Math.max(0, k.boost - dt);
          let thr = 0, steer = 0;
          if (k.me) {
            const K = E.key, up = K('KeyW') || K('ArrowUp'), dn = K('KeyS') || K('ArrowDown'), lf = K('KeyA') || K('ArrowLeft'), rt = K('KeyD') || K('ArrowRight');
            if (up || dn || lf || rt) { thr = (up ? 1 : 0) - (dn ? 1 : 0); steer = (rt ? 1 : 0) - (lf ? 1 : 0); }
            else { const d = E.dir(); if (d.mag > 0.15) { const want = Math.atan2(d.y, d.x), df = angDiff(want, k.a); steer = clamp(df * 2.5, -1, 1); thr = Math.abs(df) > 2.4 ? -0.5 : d.mag; } }
          } else { const c = aiDrive(k, dt); thr = c.thr; steer = c.steer; }
          if (k.spin > 0) { thr = 0; steer = 0; }
          k.steer = steer; const maxV = k.def.sp * (k.boost > 0 ? 1.6 : 1);
          if (thr > 0) k.v = Math.min(maxV, k.v + k.def.acc * thr * dt); else if (thr < 0) k.v = Math.max(-maxV * 0.45, k.v + k.def.acc * 1.6 * thr * dt); else k.v *= Math.pow(0.35, dt);
          if (k.boost > 0) k.v = Math.max(k.v, maxV * 0.9);
          k.a += steer * k.def.turn * dt * clamp(Math.abs(k.v) / 220, 0, 1) * Math.sign(k.v || 1);
          // velocity with slight drift
          const tvx = Math.cos(k.a) * k.v, tvy = Math.sin(k.a) * k.v, grip = Math.min(1, dt * 7);
          k.vx += (tvx - k.vx) * grip; k.vy += (tvy - k.vy) * grip; k.drift = Math.hypot(tvx - k.vx, tvy - k.vy);
          const nx = k.x + k.vx * dt, ny = k.y + k.vy * dt; const h = hitWall(nx, ny, 26);
          if (h) { const dx = nx - h.cx, dy = ny - h.cy, d = Math.hypot(dx, dy) || 1; k.x = h.cx + dx / d * 27; k.y = h.cy + dy / d * 27; const vn = k.vx * dx / d + k.vy * dy / d; k.vx -= 1.6 * vn * dx / d; k.vy -= 1.6 * vn * dy / d; k.v *= 0.4; if (k.me && Math.abs(vn) > 120) { E.sound('thud', 150); E.shake(3); } } else { k.x = nx; k.y = ny; }
          if (k.drift > 120 && Math.random() < 0.5) fx.burst(k.x - Math.cos(k.a) * 20, k.y - Math.sin(k.a) * 20, 1, { col: 'rgba(200,200,200,.6)', spd: 30, size: 6, life: 0.5 });
          for (const b of boxes) if (b.on && !k.item && dist(b.x, b.y, k.x, k.y) < 46) { b.on = false; b.t = 4; k.item = pick(ITEMS); if (k.me) { E.sound('coin'); fx.text(k.x, k.y - 60, ICON[k.item] + ' ' + k.item.toUpperCase(), '#fff', 22); } }
          if (k.me && Math.abs(k.v) > 50 && Math.random() < dt * 8) E.sound('engine', 70);
        }
        // kart-kart bumps
        for (let i = 0; i < karts.length; i++) for (let j = i + 1; j < karts.length; j++) { const a = karts[i], b = karts[j], d = dist(a.x, a.y, b.x, b.y); if (d < 50 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, o = (50 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rv > 0) { a.vx -= rv * nx * 0.8; a.vy -= rv * ny * 0.8; b.vx += rv * nx * 0.8; b.vy += rv * ny * 0.8; if ((a.me || b.me) && rv > 150) E.sound('thud', 100); if (a.boost > 0 && rv > 200) spinOut(b, a); if (b.boost > 0 && rv > 200) spinOut(a, b); } } }
        // projectiles
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i]; s.life -= dt;
          if (s.k === 'rocket') { if (s.tgt && s.tgt.spin <= 0) { const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x); s.a += clamp(angDiff(want, s.a), -3 * dt, 3 * dt); } s.x += Math.cos(s.a) * s.v * dt; s.y += Math.sin(s.a) * s.v * dt; if (Math.random() < 0.8) fx.burst(s.x, s.y, 1, { col: ['#fdba74', '#94a3b8'], spd: 40, life: 0.4, size: 5 }); const hk = karts.find(k => k !== s.owner && dist(k.x, k.y, s.x, s.y) < 34); if (hk || hitWall(s.x, s.y, 8) || s.life <= 0) { shots.splice(i, 1); explode(s.x, s.y, s.owner, 70); } }
          else { s.x += s.vx * dt; s.y += s.vy * dt; s.vz -= 900 * dt; s.z += s.vz * dt; if (hitWall(s.x, s.y, 10)) { s.vx *= -0.5; s.vy *= -0.5; } if (s.z <= 0 && s.vz < 0) { shots.splice(i, 1); explode(s.x, s.y, s.owner, 130); } }
        }
        for (let i = mines.length - 1; i >= 0; i--) { const m = mines[i]; m.arm = Math.max(0, m.arm - dt); if (m.arm > 0) continue; const hk = karts.find(k => dist(k.x, k.y, m.x, m.y) < 34 && (k !== m.owner || m.arm <= 0 && m.age > 1)); m.age = (m.age || 0) + dt; if (hk && (hk !== m.owner || m.age > 1.5)) { mines.splice(i, 1); explode(m.x, m.y, m.owner, 80); } }
        E.follow(me.x + me.vx * 0.25, me.y + me.vy * 0.25, Math.min(1.1, Math.min(E.W, E.H) / 760), dt);
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, W, H);
        if (!ready) return;
        E.beginWorld(); const v = E.view(80);
        ctx.fillStyle = '#3f3f46'; ctx.fillRect(0, 0, AW, AH);
        ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < AW; x += 80) for (let y = 0; y < AH; y += 80) if ((x + y) / 80 % 2 === 0) ctx.fillRect(x, y, 80, 80);
        // painted zones
        ctx.strokeStyle = 'rgba(250,204,21,.6)'; ctx.lineWidth = 6; ctx.setLineDash([30, 20]); ctx.beginPath(); ctx.ellipse(AW / 2, AH / 2, 700, 480, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(239,68,68,.25)'; circle(ctx, 300, 300, 120); ctx.fill(); ctx.fillStyle = 'rgba(59,130,246,.25)'; circle(ctx, AW - 300, AH - 300, 120); ctx.fill();
        txt(ctx, 'KART CLASH', AW / 2, AH / 2 + 4, 64, 'rgba(255,255,255,.12)', 'center', 900);
        // walls with tire barriers
        for (const w of walls) { ctx.fillStyle = '#7f1d1d'; ctx.fillRect(w[0], w[1], w[2], w[3]); ctx.fillStyle = '#fff'; const horiz = w[2] >= w[3]; const n = Math.floor((horiz ? w[2] : w[3]) / 40); for (let i = 0; i < n; i++) { if (i % 2) continue; if (horiz) ctx.fillRect(w[0] + i * 40, w[1], 40, w[3]); else ctx.fillRect(w[0], w[1] + i * 40, w[2], 40); } ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(w[0], w[1], w[2], w[3]); }
        for (const b of boxes) { if (!b.on) continue; ctx.save(); ctx.translate(b.x, b.y + Math.sin(t * 3 + b.x) * 4); ctx.rotate(t * 1.5); ctx.drawImage(E.glow((t * 90 + b.x) % 360), -40, -40, 80, 80); ctx.fillStyle = lgrad(ctx, -18, -18, 18, 18, ['#fde047', '#f97316']); rr(ctx, -18, -18, 36, 36, 8); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.rotate(-t * 1.5); txt(ctx, '?', 0, 2, 24, '#fff', 'center', 900); ctx.restore(); }
        for (const m of mines) { circle(ctx, m.x, m.y, 14, '#111827'); circle(ctx, m.x, m.y, 5, Math.sin(t * 12) > 0 ? '#ef4444' : '#7f1d1d'); }
        for (const k of karts) drawKart(k);
        for (const s of shots) { if (s.k === 'rocket') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.fillStyle = '#e5e7eb'; rr(ctx, -12, -5, 24, 10, 4); ctx.fill(); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(20, 0); ctx.lineTo(12, 5); ctx.fill(); ctx.restore(); } else { ellipse(ctx, s.x, s.y, 10, 5, 'rgba(0,0,0,.3)'); circle(ctx, s.x, s.y - s.z * 0.4, 12, '#111827'); circle(ctx, s.x + 4, s.y - s.z * 0.4 - 10, 3, '#fde047'); } }
        fx.draw(ctx);
        E.endWorld();
        label(ctx, '⏱ ' + fmtTime(time), W / 2, 30, 26, time < 20 ? '#f87171' : '#fff');
        // item slot
        const ix = W - 70, iy = E.touch ? H - 200 : H - 80; rr(ctx, ix - 34, iy - 34, 68, 68, 16); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.stroke();
        if (me.item) E.emoji(ctx, ICON[me.item], ix, iy, 40); else txt(ctx, 'ITEM', ix, iy, 13, '#94a3b8', 'center', 800);
        if (!E.touch && me.item) label(ctx, 'SPACE', ix, iy + 46, 12, '#fde047');
        // minimap
        const mw = 150, mh = mw * AH / AW, mx = 14, my = H - mh - 14; rr(ctx, mx, my, mw, mh, 8); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill();
        for (const w of walls) { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(mx + w[0] / AW * mw, my + w[1] / AH * mh, Math.max(1, w[2] / AW * mw), Math.max(1, w[3] / AH * mh)); }
        for (const k of karts) circle(ctx, mx + k.x / AW * mw, my + k.y / AH * mh, k.me ? 4 : 3, k.me ? '#fde047' : k.def.col);
      },
      onKey(c) { if (c === 'Space' || c === 'Enter' || c === 'KeyE') useItem(me); },
      down() { if (!E.touch && me) useItem(me); },
      destroy() { E.pads(null); },
      hud() { if (!ready) return null; const rank = karts.slice().sort((a, b) => b.hits - a.hits); return { stats: [['Hits', me.hits]], board: rank.map(k => ({ n: k.name, s: k.hits, me: k.me })), boardTitle: '🏁 SCOREBOARD' }; }
    };
  }
});
