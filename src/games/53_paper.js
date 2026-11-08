/* =====================================================================
   PAPER TERRITORY  (territory capture vs AI)
   ===================================================================== */
registerGame({
  id: 'paper', title: 'Paper Territory', emoji: '🟥', c1: '#f093fb', c2: '#f5576c', cats: ['IO Arena', 'Arcade', 'Popular'], pop: true, input: 'joy',
  desc: 'Leave the safety of your colour, draw a trail and loop back home to capture new land. Cut rivals’ trails to eliminate them – but never let anyone cross yours!',
  controls: 'Mouse / WASD / joystick', scoreLabel: 'BEST % OWNED', fmtScore: v => (v / 10).toFixed(1) + '%',
  hint: 'Steer with mouse or WASD. Leave your area to draw a trail, return to capture everything inside. Crossing an enemy trail eliminates them!', hintTouch: 'Drag to steer. Loop outside your land and come back to capture it. Cut enemy trails!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), N = 76, C = 22, WORLD = N * C;
    const own = new Int16Array(N * N).fill(-1), trail = new Int16Array(N * N).fill(-1);
    const NAMES = ['Origami Ollie', 'Crayon Cara', 'Scissor Sam', 'Glitter Gwen', 'Doodle Dan', 'Stencil Stu'];
    const COLS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
    let ps = [], t = 0, me, over = false;
    function mkPlayer(i, name, isMe) {
      let cx, cy, k = 0; do { cx = irand(7, N - 8); cy = irand(7, N - 8); k++; } while (k < 50 && ps.some(p => p.alive && Math.abs(p.cx - cx) < 14 && Math.abs(p.cy - cy) < 14));
      const p = { i, name, me: isMe, col: COLS[i % COLS.length], x: cx * C + C / 2, y: cy * C + C / 2, cx, cy, a: rand(0, TAU), ta: 0, alive: true, out: false, tcells: [], ai: { t: 0, plan: null, step: 0 }, kills: 0, area: 0 };
      p.ta = p.a; for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) own[y * N + x] = i;
      ps[i] = p; return p;
    }
    me = mkPlayer(0, 'You', true); NAMES.forEach((n, k) => mkPlayer(k + 1, n, false));
    function kill(p, by) {
      if (!p.alive) return; p.alive = false; for (const c of p.tcells) trail[c] = -1; p.tcells = []; for (let k = 0; k < N * N; k++) if (own[k] === p.i) own[k] = -1;
      fx.burst(p.x, p.y, 40, { col: [p.col, '#fff'], spd: 300 }); if (by && by !== p) { by.kills++; if (by.me) { E.sound('pop'); fx.text(p.x, p.y - 30, 'Cut ' + p.name + '!', '#fde047', 22); } }
      if (p.me) { over = true; E.sound('die'); const pct = area(me); E.gameOver({ score: Math.round(pct * 10), scoreText: pct.toFixed(1) + '%', label: 'LAND OWNED', title: by ? (by === p ? 'You crossed your own trail!' : 'Cut by ' + by.name + '!') : 'Out of bounds!', lines: ['Rivals eliminated: ' + me.kills] }); }
      else setTimeout(() => { if (E.g === api && !over) mkPlayer(p.i, p.name, false); }, 3000);
    }
    function capture(p) {
      for (const c of p.tcells) { trail[c] = -1; own[c] = p.i; } p.tcells = [];
      // flood fill from borders over cells not owned by p
      const outside = new Uint8Array(N * N), st = [];
      for (let k = 0; k < N; k++) { st.push(k, (N - 1) * N + k, k * N, k * N + N - 1); }
      while (st.length) { const c = st.pop(); if (outside[c] || own[c] === p.i) continue; outside[c] = 1; const x = c % N, y = (c / N) | 0; if (x > 0) st.push(c - 1); if (x < N - 1) st.push(c + 1); if (y > 0) st.push(c - N); if (y < N - 1) st.push(c + N); }
      let gained = 0; for (let c = 0; c < N * N; c++) if (!outside[c] && own[c] !== p.i) { const prev = own[c]; own[c] = p.i; gained++; if (trail[c] >= 0 && trail[c] !== p.i) { kill(ps[trail[c]], p); } }
      if (p.me && gained > 0) { E.sound('grow'); fx.text(p.x, p.y - 30, '+' + (gained / (N * N) * 100).toFixed(1) + '%', '#fff', 22); }
    }
    function area(p) { let n = 0; for (let k = 0; k < N * N; k++) if (own[k] === p.i) n++; return n / (N * N) * 100; }
    function aiSteer(p, dt) {
      const ai = p.ai; ai.t -= dt;
      if (!p.out) { if (ai.t <= 0) { ai.t = rand(0.6, 1.2); p.ta = p.a + rand(-1.2, 1.2); ai.loop = rand(1.2, 2.2 + Math.min(2, p.tcells.length / 40)); ai.turns = 0; } }
      else {
        ai.loop -= dt; if (ai.loop <= 0) { ai.loop = rand(0.8, 1.4); ai.turns++; p.ta = p.a + (Math.PI / 2) * (p.i % 2 ? 1 : -1); }
        if (ai.turns >= 3 || p.tcells.length > 60) { let best = null, bd = 1e9; for (let k = 0; k < N * N; k += 3) if (own[k] === p.i) { const x = (k % N) * C + C / 2, y = ((k / N) | 0) * C + C / 2, d = dist(x, y, p.x, p.y); if (d < bd) { bd = d; best = [x, y]; } } if (best) p.ta = Math.atan2(best[1] - p.y, best[0] - p.x); }
      }
      // avoid walls & own trail
      for (const off of [0, 0.6, -0.6, 1.2, -1.2, 2, -2]) { const a = p.ta + off, lx = p.x + Math.cos(a) * 60, ly = p.y + Math.sin(a) * 60, cx = Math.floor(lx / C), cy = Math.floor(ly / C); const bad = cx < 1 || cy < 1 || cx >= N - 1 || cy >= N - 1 || trail[cy * N + cx] === p.i; if (!bad) { p.ta = a; break; } }
      // chase player trail if near
      if (me.alive && me.tcells.length && dist(me.x, me.y, p.x, p.y) < 260 && Math.random() < 0.02) { const c = pick(me.tcells); p.ta = Math.atan2(((c / N) | 0) * C - p.y, (c % N) * C - p.x); }
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); if (over) return;
        const d = E.dir(); if (d.mag > 0.2) me.ta = Math.atan2(d.y, d.x);
        for (const p of ps) {
          if (!p.alive) continue; if (!p.me) aiSteer(p, dt);
          p.a += clamp(angDiff(p.ta, p.a), -5 * dt, 5 * dt);
          const sp = 150; p.x += Math.cos(p.a) * sp * dt; p.y += Math.sin(p.a) * sp * dt;
          const cx = Math.floor(p.x / C), cy = Math.floor(p.y / C);
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) { kill(p, null); continue; }
          const c = cy * N + cx;
          if (c !== p.lastC) {
            p.lastC = c;
            if (trail[c] >= 0) { const victim = ps[trail[c]]; if (victim && victim.alive) kill(victim, p); if (!p.alive) continue; }
            if (own[c] === p.i) { if (p.out) { p.out = false; capture(p); } }
            else { p.out = true; trail[c] = p.i; p.tcells.push(c); }
          }
        }
        // head-on collisions
        for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) { const A = ps[a], B = ps[b]; if (A.alive && B.alive && dist(A.x, A.y, B.x, B.y) < 16) { if (A.tcells.length >= B.tcells.length) kill(A, B); else kill(B, A); } }
        if (me.alive) { const pct = area(me); E.submitBest(Math.round(pct * 10)); if (pct >= 60 && !over) { over = true; E.gameOver({ score: Math.round(pct * 10), scoreText: pct.toFixed(1) + '%', label: 'LAND OWNED', win: true, title: '🏆 Paper Champion!', lines: ['You own over 60% of the map!', 'Rivals eliminated: ' + me.kills] }); } }
        E.follow(me.x, me.y, Math.min(1.1, Math.min(E.W, E.H) / 640), dt);
      },
      draw() {
        const W = E.W, H = E.H; ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(C);
        ctx.fillStyle = '#fafaf9'; ctx.fillRect(0, 0, WORLD, WORLD);
        const x0 = clamp(Math.floor(v.x0 / C), 0, N - 1), x1 = clamp(Math.ceil(v.x1 / C), 0, N - 1), y0 = clamp(Math.floor(v.y0 / C), 0, N - 1), y1 = clamp(Math.ceil(v.y1 / C), 0, N - 1);
        ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.lineWidth = 1; for (let x = x0; x <= x1 + 1; x++) { ctx.beginPath(); ctx.moveTo(x * C, y0 * C); ctx.lineTo(x * C, (y1 + 1) * C); ctx.stroke(); } for (let y = y0; y <= y1 + 1; y++) { ctx.beginPath(); ctx.moveTo(x0 * C, y * C); ctx.lineTo((x1 + 1) * C, y * C); ctx.stroke(); }
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const o = own[y * N + x], tr = trail[y * N + x];
          if (o >= 0) { ctx.fillStyle = ps[o].col; ctx.fillRect(x * C, y * C + 4, C, C); ctx.globalAlpha = 0.85; ctx.fillStyle = ps[o].col; ctx.fillRect(x * C, y * C, C, C); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x * C, y * C, C, 3); }
          if (tr >= 0) { ctx.globalAlpha = 0.55; ctx.fillStyle = ps[tr].col; ctx.fillRect(x * C + 3, y * C + 3, C - 6, C - 6); ctx.globalAlpha = 1; }
        }
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, WORLD, WORLD);
        for (const p of ps) { if (!p.alive) continue; ctx.save(); ctx.translate(p.x, p.y); ellipse(ctx, 3, 5, 15, 12, 'rgba(0,0,0,.25)'); ctx.rotate(p.a); ctx.fillStyle = p.col; rr(ctx, -14, -14, 28, 28, 6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, -12, -12, 24, 9, 4); ctx.fill(); circle(ctx, 6, -5, 3.5, '#fff'); circle(ctx, 6, 5, 3.5, '#fff'); circle(ctx, 7, -5, 1.8, '#111'); circle(ctx, 7, 5, 1.8, '#111'); ctx.restore(); label(ctx, p.name, p.x, p.y - 26, 12, p.me ? '#111' : '#334155'); }
        fx.draw(ctx);
        E.endWorld();
      },
      hud() { const rows = ps.filter(p => p.alive).map(p => ({ n: p.name, v: area(p), me: p.me })).sort((a, b) => b.v - a.v).map(r => ({ n: r.n, s: r.v.toFixed(1) + '%', me: r.me })); return { stats: [['Land', me.alive ? area(me).toFixed(1) + '%' : '—'], ['Eliminated', me.kills]], board: rows, boardTitle: '🗺️ TERRITORY' }; }
    };
    return api;
  }
});
