/* =====================================================================
   PARKING JAM  (sliding-car puzzle with BFS-verified levels)
   ===================================================================== */
registerGame({
  id: 'parking', title: 'Parking Jam', emoji: '🚗', c1: '#f7971e', c2: '#d50000', cats: ['Puzzle', 'Brain Games'], hot: true,
  desc: 'Slide cars and trucks around a crowded lot to clear a path for your red car. Every puzzle is generated and verified solvable – they get harder as you go!',
  controls: 'Drag vehicles', scoreLabel: 'LEVELS SOLVED',
  hint: 'Drag cars along their direction. Get the RED car out through the exit on the right!', hintTouch: 'Drag cars along their lane. Free the RED car through the exit!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), N = 6, EXIT_ROW = 2;
    let level = E.data('level', 1), cars = [], moves = 0, optimal = 0, drag = null, t = 0, winT = 0, history = [];
    const COLS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6', '#ec4899', '#64748b', '#84cc16', '#0ea5e9', '#f97316', '#8b5cf6', '#eab308'];
    function occ(cs, skip) { const g = Array(36).fill(-1); cs.forEach((c, i) => { if (i === skip) return; for (let k = 0; k < c.len; k++) { const x = c.h ? c.x + k : c.x, y = c.h ? c.y : c.y + k; g[y * 6 + x] = i; } }); return g; }
    function solve(cs, limit) {
      const key = s => s.join(','), start = cs.map(c => c.h ? c.x : c.y), seen = new Map([[key(start), 0]]); let q = [start], depth = 0;
      while (q.length && depth < 40) {
        const nq = [];
        for (const s of q) {
          if (s[0] === 4) return depth;
          const g = Array(36).fill(-1); cs.forEach((c, i) => { for (let k = 0; k < c.len; k++) { const x = c.h ? s[i] + k : c.x, y = c.h ? c.y : s[i] + k; g[y * 6 + x] = i; } });
          cs.forEach((c, i) => {
            for (const d of [-1, 1]) { let p = s[i]; while (true) { const np = p + d; if (np < 0 || np + c.len > 6) break; const cell = c.h ? c.y * 6 + (d > 0 ? np + c.len - 1 : np) : (d > 0 ? np + c.len - 1 : np) * 6 + c.x; if (g[cell] !== -1) break; p = np; const ns = s.slice(); ns[i] = p; const k = key(ns); if (!seen.has(k)) { seen.set(k, 1); nq.push(ns); } } }
          });
          if (seen.size > limit) return -1;
        }
        q = nq; depth++;
      }
      return -1;
    }
    function generate() {
      const want = Math.min(4 + level, 18), t0 = performance.now(); let best = null, bestD = -1;
      while (performance.now() - t0 < 350) {
        const cs = [{ x: irand(0, 2), y: EXIT_ROW, len: 2, h: true, col: '#ef4444', red: true }];
        const n = irand(Math.min(6 + level, 11), Math.min(8 + level, 13));
        for (let k = 0; k < n * 4 && cs.length < n; k++) {
          const len = Math.random() < 0.3 ? 3 : 2, h = Math.random() < 0.5, x = irand(0, h ? 6 - len : 5), y = irand(0, h ? 5 : 6 - len);
          if (h && y === EXIT_ROW) continue;
          const g = occ(cs, -1); let free = true; for (let j = 0; j < len; j++) if (g[(h ? y : y + j) * 6 + (h ? x + j : x)] !== -1) free = false;
          if (free) cs.push({ x, y, len, h, col: COLS[cs.length % COLS.length] });
        }
        const d = solve(cs, 60000);
        if (d > bestD) { bestD = d; best = cs; if (d >= want) break; }
      }
      cars = best; optimal = bestD; moves = 0; history = []; winT = 0;
    }
    generate();
    function layout() { const W = E.W, H = E.H, S = Math.min(W - 60, H - 170, 560), gx = (W - S) / 2 - S * 0.03, gy = Math.max(84, (H - S) / 2 + 10); return { S, gx, gy, cs: S / N }; }
    function drawCar(c, L, off) {
      const cs = L.cs, x = L.gx + (c.h ? c.x + (off || 0) : c.x) * cs, y = L.gy + (c.h ? c.y : c.y + (off || 0)) * cs, w = c.h ? c.len * cs : cs, h = c.h ? cs : c.len * cs, p = cs * 0.08;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); if (!c.h) ctx.rotate(Math.PI / 2); const lw = c.h ? w : h, lh = c.h ? h : w;
      shadowOn(ctx, 'rgba(0,0,0,.45)', 10, 3, 5); rr(ctx, -lw / 2 + p, -lh / 2 + p, lw - p * 2, lh - p * 2, cs * 0.18); ctx.fillStyle = lgrad(ctx, 0, -lh / 2, 0, lh / 2, [c.col, c.col]); ctx.fill(); shadowOff(ctx);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, -lw / 2 + p * 2, -lh / 2 + p * 1.6, lw - p * 4, lh * 0.18, 6); ctx.fill();
      ctx.fillStyle = 'rgba(15,23,42,.75)'; const ww = c.len === 3 ? lw * 0.18 : lw * 0.2; rr(ctx, lw / 2 - p * 2 - ww - lw * 0.08, -lh / 2 + p * 2.2, ww, lh - p * 4.4, 5); ctx.fill(); rr(ctx, -lw / 2 + p * 2 + lw * 0.06, -lh / 2 + p * 2.6, ww * 0.8, lh - p * 5.2, 5); ctx.fill();
      if (c.len === 3) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-lw / 2 + p * 2, -lh / 2 + p * 2, lw * 0.55, lh - p * 4); }
      ctx.fillStyle = '#fef08a'; ctx.fillRect(lw / 2 - p - 4, -lh / 2 + p * 2, 4, lh * 0.18); ctx.fillRect(lw / 2 - p - 4, lh / 2 - p * 2 - lh * 0.18, 4, lh * 0.18);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-lw / 2 + p, -lh / 2 + p * 2, 3, lh * 0.15); ctx.fillRect(-lw / 2 + p, lh / 2 - p * 2 - lh * 0.15, 3, lh * 0.15);
      if (c.red) { ctx.fillStyle = '#fff'; ctx.font = `900 ${cs * 0.22}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 0); }
      ctx.restore();
    }
    function curOffset(c) { return drag && drag.c === c ? drag.off : 0; }
    function limits(i) { const c = cars[i], g = occ(cars, i); let lo = c.h ? c.x : c.y, hi = lo; while (lo - 1 >= 0 && g[c.h ? c.y * 6 + lo - 1 : (lo - 1) * 6 + c.x] === -1) lo--; while (hi + c.len < 6 && g[c.h ? c.y * 6 + hi + c.len : (hi + c.len) * 6 + c.x] === -1) hi++; return [lo, hi]; }
    function undo() { if (!history.length || winT) return; const h = history.pop(); cars[h.i].x = h.x; cars[h.i].y = h.y; moves = Math.max(0, moves - 1); E.sound('click'); }
    return {
      extra: { label: '↶ Undo', action: undo },
      update(dt) { t += dt; fx.update(dt); if (winT) { winT += dt; const r = cars[0]; r.x += dt * 9; if (winT > 1.6) { E.coins(5 + level); level++; E.save('level', level); E.submitBest(level - 1); generate(); } } },
      draw() {
        const W = E.W, H = E.H, L = layout(), cs = L.cs;
        ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, ['#475569', '#1e293b']); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 40; i++) { circle(ctx, (i * 173) % W, (i * 97) % H, 2 + i % 3, 'rgba(255,255,255,.04)'); }
        // lot
        shadowOn(ctx, 'rgba(0,0,0,.5)', 24, 0, 10); rr(ctx, L.gx - 14, L.gy - 14, L.S + 28, L.S + 28, 18); ctx.fillStyle = '#a3a3a3'; ctx.fill(); shadowOff(ctx);
        ctx.fillStyle = '#3f3f46'; ctx.fillRect(L.gx, L.gy, L.S, L.S);
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.setLineDash([cs * 0.25, cs * 0.15]); for (let k = 1; k < N; k++) { ctx.beginPath(); ctx.moveTo(L.gx + k * cs, L.gy); ctx.lineTo(L.gx + k * cs, L.gy + L.S); ctx.moveTo(L.gx, L.gy + k * cs); ctx.lineTo(L.gx + L.S, L.gy + k * cs); ctx.stroke(); } ctx.setLineDash([]);
        // exit
        const ey = L.gy + EXIT_ROW * cs; ctx.fillStyle = '#3f3f46'; ctx.fillRect(L.gx + L.S, ey, 40, cs); ctx.fillStyle = '#fde047'; for (let k = 0; k < 4; k++) ctx.fillRect(L.gx + L.S + 4 + k * 9, ey + (k % 2 ? 0 : cs - 6), 6, 6);
        label(ctx, 'EXIT ➜', L.gx + L.S + 22, ey - 14, 14, '#fde047');
        ctx.save(); ctx.beginPath(); ctx.rect(L.gx - 4, L.gy - 4, L.S + (winT ? 400 : 8), L.S + 8); ctx.clip();
        cars.forEach(c => drawCar(c, L, curOffset(c)));
        ctx.restore();
        fx.draw(ctx);
        label(ctx, 'LEVEL ' + level, W / 2, Math.max(30, L.gy - 52), 26, '#fff');
        label(ctx, 'Moves: ' + moves + '   •   Best possible: ' + optimal, W / 2, Math.max(56, L.gy - 26), 15, '#cbd5e1');
        if (winT) label(ctx, moves <= optimal ? 'PERFECT SOLVE! ⭐⭐⭐' : moves <= optimal * 1.5 ? 'SOLVED! ⭐⭐' : 'SOLVED! ⭐', W / 2, L.gy + L.S + 36, 26, '#fde047');
      },
      down(x, y) {
        if (winT) return; const L = layout(); const gx = Math.floor((x - L.gx) / L.cs), gy = Math.floor((y - L.gy) / L.cs); if (gx < 0 || gy < 0 || gx >= 6 || gy >= 6) return;
        const g = occ(cars, -1), i = g[gy * 6 + gx]; if (i < 0) return; const c = cars[i];
        drag = { c, i, sx: x, sy: y, off: 0, lim: limits(i), base: c.h ? c.x : c.y }; E.sound('tick');
      },
      move(x, y) { if (!drag) return; const L = layout(), c = drag.c, d = (c.h ? x - drag.sx : y - drag.sy) / L.cs; drag.off = clamp(d, drag.lim[0] - drag.base, drag.lim[1] - drag.base); },
      up() {
        if (!drag) return; const c = drag.c, n = Math.round(drag.off);
        if (n) { history.push({ i: drag.i, x: c.x, y: c.y }); if (c.h) c.x += n; else c.y += n; moves++; E.sound('whoosh', 60); }
        drag = null;
        if (cars[0].x === 4) { winT = 0.01; E.sound('win'); fx.burst(E.W / 2, E.H / 2, 60, { col: ['#fde047', '#ef4444', '#fff'], spd: 380, shape: 'star' }); }
      },
      hud() { return null; }
    };
  }
});
