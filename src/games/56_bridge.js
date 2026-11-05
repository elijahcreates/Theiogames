/* =====================================================================
   BUILD A BRIDGE  (truss builder + Verlet stress simulation)
   ===================================================================== */
registerGame({
  id: 'bridge', title: 'Build a Bridge', emoji: '🌉', c1: '#4b6cb7', c2: '#182848', cats: ['Physics', 'Puzzle', 'Creative'], isNew: true,
  desc: 'Engineer bridges from road, wood and steel within a budget, then hit TEST and watch real stress physics decide if the car (and later the truck!) makes it across.',
  controls: 'Drag between joints • buttons', scoreLabel: 'LEVELS BUILT',
  hint: 'Drag from a joint (or anchor) to place a beam. Road = drivable deck. Wood / steel = supports. Tap a beam in ✂ mode to remove it. Press ▶ TEST!', hintTouch: 'Drag from a joint to build beams. Road is the driving surface – support it with wood & steel, then ▶ TEST!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI(), GS = 50, VW = 1200, VH = 700;
    const MAT = { road: { n: 'Road', col: '#475569', cost: 30, max: 2.2, len: 151, w: 10 }, wood: { n: 'Wood', col: '#b45309', cost: 15, max: 1.6, len: 151, w: 7 }, steel: { n: 'Steel', col: '#94a3b8', cost: 45, max: 4.2, len: 213, w: 7 } };
    const LEVELS = [
      { gap: [350, 650], y: 400, budget: 900, veh: 'car', anchors: [] },
      { gap: [300, 750], y: 400, budget: 1300, veh: 'car', anchors: [] },
      { gap: [300, 900], y: 400, budget: 2000, veh: 'car', anchors: [[600, 600]] },
      { gap: [250, 900], y: 380, budget: 1800, veh: 'van', anchors: [] },
      { gap: [250, 950], y: 420, budget: 2600, veh: 'truck', anchors: [[600, 620]] },
      { gap: [200, 1000], y: 400, budget: 3200, veh: 'truck', anchors: [] }
    ];
    let li = Math.min(E.data('level', 0), LEVELS.length - 1), L, nodes, beams, mat = 'road', mode = 'build', drag = null, testing = false, car = null, result = null, t = 0, view, hist = [], spent = 0;
    function load(i) { li = i; L = LEVELS[i]; nodes = []; beams = []; hist = []; result = null; testing = false; car = null;
      const a = (x, y) => nodes.push({ x, y, px: x, py: y, fixed: true, ox: x, oy: y });
      a(L.gap[0], L.y); a(L.gap[1], L.y); a(L.gap[0], L.y + 100); a(L.gap[1], L.y + 100); L.anchors.forEach(([x, y]) => a(x, y)); }
    load(li);
    const cost = () => beams.reduce((s, b) => s + MAT[b.m].cost * Math.max(1, Math.round(b.rest / GS)), 0);
    function nodeAt(x, y, r) { let best = null, bd = r || 18; for (const n of nodes) { const d = dist(n.x, n.y, x, y); if (d < bd) { bd = d; best = n; } } return best; }
    function snap(v) { return Math.round(v / GS) * GS; }
    function addBeam(a, b, m) { if (a === b || beams.some(q => (q.a === a && q.b === b) || (q.a === b && q.b === a))) return false; const len = dist(a.x, a.y, b.x, b.y); if (len > MAT[m].len) return false; beams.push({ a, b, m, rest: len, stress: 0, broken: false }); return true; }
    function startTest() {
      if (testing) { stopTest(); return; } if (cost() > L.budget) { E.toast('💸 Over budget!'); E.sound('error'); return; }
      testing = true; result = null; for (const n of nodes) { n.ox = n.x; n.oy = n.y; n.px = n.x; n.py = n.y; } for (const b of beams) { b.broken = false; b.stress = 0; }
      const V = { car: { w: 70, m: 1, sp: 120 }, van: { w: 90, m: 1.8, sp: 110 }, truck: { w: 120, m: 3, sp: 100 } }[L.veh];
      const x0 = L.gap[0] - 160, y0 = L.y - 16; car = { V, w: [{ x: x0, y: y0, px: x0, py: y0 }, { x: x0 + V.w, y: y0, px: x0 + V.w, py: y0 }], r: 16, done: false }; E.sound('engine');
    }
    function stopTest() { testing = false; car = null; for (const n of nodes) { n.x = n.ox; n.y = n.oy; n.px = n.x; n.py = n.y; } for (const b of beams) { b.broken = false; b.stress = 0; } }
    function sim(dt) {
      const g = 900 * dt * dt;
      for (const n of nodes) { if (n.fixed) continue; const vx = (n.x - n.px) * 0.995, vy = (n.y - n.py) * 0.995; n.px = n.x; n.py = n.y; n.x += vx; n.y += vy + g; }
      for (const w of car.w) { const vx = (w.x - w.px), vy = (w.y - w.py); w.px = w.x; w.py = w.y; w.x += vx; w.y += vy + g; }
      for (let it = 0; it < 18; it++) {
        for (const b of beams) { if (b.broken) continue; const dx = b.b.x - b.a.x, dy = b.b.y - b.a.y, d = Math.hypot(dx, dy) || 1, diff = (d - b.rest) / d, ia = b.a.fixed ? 0 : 1, ib = b.b.fixed ? 0 : 1; if (ia + ib === 0) continue; const k = 0.9 / (ia + ib); b.a.x += dx * diff * k * ia; b.a.y += dy * diff * k * ia; b.b.x -= dx * diff * k * ib; b.b.y -= dy * diff * k * ib; }
        // vehicle chassis
        const [w1, w2] = car.w, dx = w2.x - w1.x, dy = w2.y - w1.y, d = Math.hypot(dx, dy) || 1, df = (d - car.V.w) / d / 2; w1.x += dx * df; w1.y += dy * df; w2.x -= dx * df; w2.y -= dy * df;
        // wheels vs road beams & cliffs
        for (const w of car.w) {
          w.touch = false;
          for (const b of beams) { if (b.broken || b.m !== 'road') continue; const q = segDist(w.x, w.y, b.a.x, b.a.y, b.b.x, b.b.y); if (q.d < car.r + 0.5) { const nx = (w.x - q.x) / (q.d || 1), ny = (w.y - q.y) / (q.d || 1), pen = Math.max(0, car.r - q.d), mw = 1 / car.V.m; const tot = mw + 1; w.x += nx * pen * (mw / tot) * 2; w.y += ny * pen * (mw / tot) * 2; const share = pen * (1 / tot); if (!b.a.fixed) { b.a.x -= nx * share * (1 - q.t); b.a.y -= ny * share * (1 - q.t); } if (!b.b.fixed) { b.b.x -= nx * share * q.t; b.b.y -= ny * share * q.t; } w.touch = true; } }
          if ((w.x < L.gap[0] || w.x > L.gap[1]) && w.y > L.y - car.r - 0.5) { w.y = Math.min(w.y, L.y - car.r); w.touch = true; }
        }
      }
      for (const w of car.w) if (w.touch) { const vx = w.x - w.px, tv = car.V.sp * dt; w.px = w.x - lerp(vx, tv, 0.5); }
      for (const b of beams) { if (b.broken) continue; const d = dist(b.a.x, b.a.y, b.b.x, b.b.y); b.stress = Math.abs(d - b.rest) / b.rest * 100; if (b.stress > MAT[b.m].max) { b.broken = true; E.sound('crash', 60); fx.burst((b.a.x + b.b.x) / 2, (b.a.y + b.b.y) / 2, 14, { col: [MAT[b.m].col, '#fde047'], spd: 180, shape: 's', grav: 500 }); } }
      if (!result) {
        if (car.w[0].x > L.gap[1] + 60 && car.w[0].y < L.y + 5) { result = 'win'; E.sound('win'); fx.burst(car.w[0].x, car.w[0].y - 40, 50, { col: ['#fde047', '#22c55e', '#fff'], spd: 320, shape: 'star' }); setTimeout(() => { if (E.g !== api) return; const nl = li + 1; E.save('level', Math.min(nl, LEVELS.length - 1)); E.submitBest(nl); E.coins(10 + li * 5); if (nl >= 5) E.ach('bridge'); if (nl >= LEVELS.length) { E.gameOver({ score: nl, win: true, title: '🌉 Master Engineer!', lines: ['All ' + LEVELS.length + ' bridges built!'] }); } else load(nl); }, 1800); }
        else if (car.w[0].y > VH + 100 || car.w[1].y > VH + 100) { result = 'fail'; E.sound('splash'); }
      }
    }
    function layout() { view = E.fit(VW, VH); }
    const api = {
      update(dt) { t += dt; fx.update(dt); if (testing && car) { for (let k = 0; k < 3; k++) sim(dt / 3); } },
      draw() {
        layout(); const W = E.W, H = E.H; ui.clear();
        ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 0, W, H); view.apply(ctx);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, VH, ['#7dd3fc', '#bae6fd', '#e0f2fe']); ctx.fillRect(0, 0, VW, VH);
        for (let i = 0; i < 5; i++) { const cx = (i * 300 + t * 8) % (VW + 200) - 100; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx, 90 + (i % 2) * 40, 26, 0, TAU); ctx.arc(cx + 30, 80 + (i % 2) * 40, 32, 0, TAU); ctx.arc(cx + 62, 90 + (i % 2) * 40, 22, 0, TAU); ctx.fill(); }
        // water
        ctx.fillStyle = lgrad(ctx, 0, VH - 140, 0, VH, ['#0284c7', '#075985']); ctx.fillRect(0, VH - 140, VW, 140); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= VW; x += 20) ctx.lineTo(x, VH - 130 + k * 30 + Math.sin(x * 0.03 + t * 2 + k) * 4); ctx.stroke(); }
        // cliffs
        ctx.fillStyle = lgrad(ctx, 0, L.y, 0, VH, ['#65a30d', '#78350f', '#451a03']); ctx.fillRect(0, L.y, L.gap[0], VH - L.y); ctx.fillRect(L.gap[1], L.y, VW - L.gap[1], VH - L.y);
        ctx.fillStyle = '#334155'; ctx.fillRect(0, L.y - 6, L.gap[0], 8); ctx.fillRect(L.gap[1], L.y - 6, VW - L.gap[1], 8);
        for (const [x, y] of L.anchors) { ctx.fillStyle = '#57534e'; ctx.fillRect(x - 24, y, 48, VH - y); }
        // grid in build mode
        if (!testing) { ctx.fillStyle = 'rgba(15,23,42,.18)'; for (let x = GS; x < VW; x += GS) for (let y = GS; y < VH - 100; y += GS) ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
        // beams
        for (const b of beams) { if (b.broken) continue; const M = MAT[b.m], st = clamp(b.stress / M.max, 0, 1); ctx.strokeStyle = testing ? hsl(120 - st * 120, 80, 45) : M.col; ctx.lineWidth = M.w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.a.x, b.a.y); ctx.lineTo(b.b.x, b.b.y); ctx.stroke(); if (b.m === 'road') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.setLineDash([]); } }
        for (const n of nodes) { circle(ctx, n.x, n.y, n.fixed ? 8 : 6, n.fixed ? '#dc2626' : '#f8fafc'); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.y, n.fixed ? 8 : 6, 0, TAU); ctx.stroke(); }
        if (drag && drag.to) { const M = MAT[mat], len = dist(drag.from.x, drag.from.y, drag.to.x, drag.to.y), ok = len <= M.len && len > 5; ctx.strokeStyle = ok ? M.col : '#ef4444'; ctx.globalAlpha = 0.7; ctx.lineWidth = M.w; ctx.beginPath(); ctx.moveTo(drag.from.x, drag.from.y); ctx.lineTo(drag.to.x, drag.to.y); ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(15,23,42,.25)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(drag.from.x, drag.from.y, M.len, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        // vehicle
        if (car) { const [w1, w2] = car.w, a = Math.atan2(w2.y - w1.y, w2.x - w1.x), cx = (w1.x + w2.x) / 2, cy = (w1.y + w2.y) / 2; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); const L2 = car.V.w; ctx.fillStyle = L.veh === 'truck' ? '#f59e0b' : L.veh === 'van' ? '#8b5cf6' : '#ef4444'; rr(ctx, -L2 / 2 - 22, -44, L2 + 44, 30, 8); ctx.fill(); if (L.veh === 'truck') { ctx.fillStyle = '#0ea5e9'; rr(ctx, L2 / 2 - 6, -66, 32, 26, 6); ctx.fill(); ctx.fillStyle = '#78716c'; ctx.fillRect(-L2 / 2 - 20, -74, L2 + 4, 32); } else { ctx.fillStyle = '#bae6fd'; rr(ctx, -L2 / 4, -62, L2 / 2 + 6, 20, 6); ctx.fill(); } ctx.restore(); for (const w of car.w) { circle(ctx, w.x, w.y, car.r, '#111827'); circle(ctx, w.x, w.y, car.r * 0.45, '#9ca3af'); } }
        fx.draw(ctx);
        // UI bar
        const c = cost(), bx = 20, by = 16;
        rr(ctx, VW / 2 - 200, by, 400, 46, 12); ctx.fillStyle = 'rgba(15,23,42,.75)'; ctx.fill(); label(ctx, 'LEVEL ' + (li + 1) + '/' + LEVELS.length + '  •  💰 $' + c + ' / $' + L.budget + '  •  🚗 ' + L.veh, VW / 2, by + 23, 16, c > L.budget ? '#fca5a5' : '#fff');
        const btns = [['road', '🛣️ Road'], ['wood', '🪵 Wood'], ['steel', '🔩 Steel'], ['erase', '✂ Erase'], ['undo', '↶ Undo'], ['clear', '🗑 Clear'], ['test', testing ? '■ Stop' : '▶ TEST']];
        btns.forEach(([id, l], i) => ui.btn(ctx, id, bx + i * 166, VH - 66, 156, 50, l, { cols: id === 'test' ? (testing ? ['#ef4444', '#b91c1c'] : ['#22c55e', '#15803d']) : (id === mat && mode === 'build') || (id === 'erase' && mode === 'erase') ? ['#f59e0b', '#d97706'] : ['#334155', '#1e293b'], size: 18 }));
        if (result === 'win') label(ctx, '✅ BRIDGE HOLDS! Next level…', VW / 2, 120, 34, '#16a34a');
        if (result === 'fail') label(ctx, '💦 SPLASH! Tap ■ Stop and reinforce your bridge', VW / 2, 120, 26, '#b91c1c');
        if (!testing && !beams.length) label(ctx, 'Drag from a red anchor to start your road →', VW / 2, 170, 20, '#0f172a');
        E.endWorld();
      },
      down(x, y) {
        const p = view.toWorld(x, y), id = ui.hit(p.x, p.y);
        if (id) { if (MAT[id]) { mat = id; mode = 'build'; } else if (id === 'erase') mode = mode === 'erase' ? 'build' : 'erase'; else if (id === 'undo' && !testing) { const h = hist.pop(); if (h) { beams = h.beams; nodes = h.nodes; } } else if (id === 'clear' && !testing) { hist.push({ beams: beams.slice(), nodes: nodes.slice() }); load(li); } else if (id === 'test') startTest(); E.sound('click'); return; }
        if (testing) return;
        if (mode === 'erase') { let best = null, bd = 14; for (const b of beams) { const q = segDist(p.x, p.y, b.a.x, b.a.y, b.b.x, b.b.y); if (q.d < bd) { bd = q.d; best = b; } } if (best) { hist.push({ beams: beams.slice(), nodes: nodes.slice() }); beams.splice(beams.indexOf(best), 1); nodes = nodes.filter(n => n.fixed || beams.some(b => b.a === n || b.b === n)); E.sound('pop'); } return; }
        const n = nodeAt(p.x, p.y, 22); if (n) drag = { from: n, to: null };
      },
      move(x, y) { if (!drag) return; const p = view.toWorld(x, y), n = nodeAt(p.x, p.y, 16); drag.to = n && n !== drag.from ? { x: n.x, y: n.y, node: n } : { x: snap(p.x), y: Math.min(snap(p.y), VH - 150) }; },
      up() {
        if (!drag) return; const d = drag; drag = null; if (!d.to) return;
        const len = dist(d.from.x, d.from.y, d.to.x, d.to.y); if (len > MAT[mat].len || len < 5) { E.sound('error'); return; }
        hist.push({ beams: beams.slice(), nodes: nodes.slice() });
        let tn = d.to.node || nodeAt(d.to.x, d.to.y, 4); if (!tn) { tn = { x: d.to.x, y: d.to.y, px: d.to.x, py: d.to.y, fixed: false, ox: d.to.x, oy: d.to.y }; nodes.push(tn); }
        if (addBeam(d.from, tn, mat)) E.sound('click'); else hist.pop();
      },
      onKey(c) { if (c === 'Space' || c === 'Enter') startTest(); if (c === 'Digit1') mat = 'road'; if (c === 'Digit2') mat = 'wood'; if (c === 'Digit3') mat = 'steel'; },
      _auto() { const A = nodes, mk = (x, y) => { let n = nodeAt(x, y, 4); if (!n) { n = { x, y, px: x, py: y, fixed: false, ox: x, oy: y }; nodes.push(n); } return n; }; const p = [mk(350, 400), mk(450, 400), mk(550, 400), mk(650, 400)], q = [mk(400, 450), mk(500, 450), mk(600, 450)]; for (let i = 0; i < 3; i++) addBeam(p[i], p[i + 1], 'road'); addBeam(mk(350, 500), q[0], 'wood'); addBeam(q[0], q[1], 'wood'); addBeam(q[1], q[2], 'wood'); addBeam(q[2], mk(650, 500), 'wood'); for (let i = 0; i < 3; i++) { addBeam(p[i], q[i], 'wood'); addBeam(p[i + 1], q[i], 'wood'); } return { cost: cost(), beams: beams.length }; },
      _state() { return { nodes: nodes.filter(n => !n.fixed).map(n => [+n.x.toFixed(2), +n.y.toFixed(2)]), w: car && car.w.map(w => [+w.x.toFixed(3), +w.y.toFixed(3), w.touch, +(w.x - w.px).toFixed(2)]), result, testing, wx: car && Math.round(car.w[0].x), wy: car && Math.round(car.w[0].y), broken: beams.filter(b => b.broken).length }; },
      hud() { return null; }
    };
    return api;
  }
});
