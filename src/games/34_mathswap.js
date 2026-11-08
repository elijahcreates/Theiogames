/* =====================================================================
   MATH SWAP
   ===================================================================== */
registerGame({
  id: 'mathswap', title: 'Math Swap', emoji: '➗', c1: '#11998e', c2: '#0575e6', cats: ['Puzzle', 'Brain Games'], isNew: true,
  desc: 'Swap numbered tiles between equations until every line is correct. Addition, subtraction, multiplication and division – against the clock!',
  controls: 'Tap two tiles to swap', scoreLabel: 'POINTS',
  hint: 'Click a number tile, then another to swap them. Make every equation true before time runs out!', hintTouch: 'Tap two number tiles to swap them. Make every equation true!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    let level = 1, rows = [], tiles = [], sel = -1, time = 60, score = 0, combo = 0, swaps = 0, t = 0, solvedRows = [], wait = 0, anim = {};
    function makeRow(ops) {
      const op = pick(ops); let a, b, c;
      const mx = 5 + level * 2;
      if (op === '+') { a = irand(1, mx); b = irand(1, mx); c = a + b; }
      else if (op === '−') { a = irand(2, mx + 5); b = irand(1, a - 1); c = a - b; }
      else if (op === '×') { a = irand(2, Math.min(12, 3 + level)); b = irand(2, Math.min(12, 3 + level)); c = a * b; }
      else { b = irand(2, Math.min(12, 2 + level)); c = irand(2, Math.min(12, 2 + level)); a = b * c; }
      return { op, v: [a, b, c] };
    }
    function setup() {
      const ops = level < 2 ? ['+'] : level < 4 ? ['+', '−'] : level < 6 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
      const n = Math.min(5, 2 + Math.floor((level - 1) / 2)); rows = []; for (let i = 0; i < n; i++) rows.push(makeRow(ops));
      tiles = []; rows.forEach((r, ri) => r.v.forEach((v, k) => tiles.push({ v, ri, k })));
      const vals = tiles.map(x => x.v); let tries = 0;
      do { shuffle(vals); tiles.forEach((x, i) => x.v = vals[i]); tries++; } while (rows.some((r, i) => ok(i)) && tries < 50 || tries < 2);
      time = Math.max(35, 75 - level * 3) + n * 8; sel = -1; swaps = 0; solvedRows = rows.map(() => false); wait = 0;
    }
    function val(ri, k) { return tiles.find(x => x.ri === ri && x.k === k).v; }
    function ok(ri) { const r = rows[ri], a = val(ri, 0), b = val(ri, 1), c = val(ri, 2); return r.op === '+' ? a + b === c : r.op === '−' ? a - b === c : r.op === '×' ? a * b === c : b !== 0 && a / b === c; }
    setup();
    function swap(i, j) {
      const a = tiles[i], b = tiles[j], v = a.v; a.v = b.v; b.v = v; swaps++; anim[i] = 1; anim[j] = 1; E.sound('swish');
      rows.forEach((r, ri) => { const now = ok(ri); if (now && !solvedRows[ri]) { combo++; const pts = 50 * combo; score += pts; E.sound('score'); fx.text(E.W / 2, E.H * 0.2, 'LINE! +' + pts + (combo > 1 ? '  COMBO x' + combo : ''), '#fde047', 26); } solvedRows[ri] = now; });
      if (rows.every((r, ri) => solvedRows[ri])) { const bonus = Math.round(time * 10) + level * 50; score += bonus; E.sound('win'); fx.burst(E.W / 2, E.H / 2, 60, { col: ['#fde047', '#22d3ee', '#4ade80'], spd: 380, shape: 'star' }); fx.text(E.W / 2, E.H * 0.85, 'LEVEL CLEAR! +' + bonus, '#4ade80', 30); wait = 1.6; }
    }
    function layout() { const W = E.W, H = E.H, n = rows.length, ts = Math.min(78, (W - 40) / 5.6, (H - 180) / (n * 1.25)), rh = ts * 1.22; return { ts, rh, x0: W / 2 - ts * 5.4 / 2, y0: Math.max(100, (H - n * rh) / 2) }; }
    return {
      update(dt) { t += dt; fx.update(dt); for (const k in anim) { anim[k] -= dt * 4; if (anim[k] <= 0) delete anim[k]; }
        if (wait > 0) { wait -= dt; if (wait <= 0) { level++; combo = Math.max(1, combo); setup(); } return; }
        time -= dt; if (time <= 0) { time = 0; E.gameOver({ score, title: "Time's Up!", lines: ['Reached level ' + level, 'Lines solved: ' + solvedRows.filter(Boolean).length + ' / ' + rows.length] }); } },
      draw() {
        const W = E.W, H = E.H; ui.clear();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#052e2b', '#0b3d6b', '#1e1b4b']); ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.07; ['+', '−', '×', '÷', '=', '7', '3', '9'].forEach((s, i) => { for (let k = 0; k < 4; k++) txt(ctx, s, (i * 151 + k * 337) % W, (k * 211 + i * 67 + t * 12) % H, 60, '#fff', 'center', 900); }); ctx.globalAlpha = 1;
        const L = layout();
        label(ctx, 'LEVEL ' + level + '  •  ⏱ ' + Math.ceil(time) + 's  •  ' + fmt(score) + ' pts', W / 2, 40, 20, time < 10 ? '#fca5a5' : '#e0f2fe');
        rows.forEach((r, ri) => {
          const y = L.y0 + ri * L.rh, good = solvedRows[ri];
          rr(ctx, L.x0 - 14, y - 8, L.ts * 5.4 + 28, L.ts + 16, 16); ctx.fillStyle = good ? 'rgba(74,222,128,.22)' : 'rgba(255,255,255,.06)'; ctx.fill(); if (good) { ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.stroke(); }
          const slots = [0, 'op', 1, '=', 2];
          slots.forEach((s, k) => {
            const x = L.x0 + k * L.ts * 1.1;
            if (s === 'op' || s === '=') { txt(ctx, s === 'op' ? r.op : '=', x + L.ts / 2, y + L.ts / 2 + 2, L.ts * 0.6, '#fde68a', 'center', 900); return; }
            const ti = tiles.findIndex(q => q.ri === ri && q.k === s), tile = tiles[ti], a = anim[ti] || 0, isSel = ti === sel;
            ui.btn(ctx, 'T' + ti, x, y - (isSel ? 6 : 0) - a * 6, L.ts, L.ts, String(tile.v), { cols: isSel ? ['#fde047', '#f59e0b'] : good ? ['#86efac', '#16a34a'] : ['#93c5fd', '#2563eb'], color: isSel ? '#422006' : '#fff', size: L.ts * (String(tile.v).length > 2 ? 0.38 : 0.48) });
          });
          if (good) label(ctx, '✓', L.x0 + L.ts * 5.6, y + L.ts / 2, L.ts * 0.4, '#4ade80');
        });
        fx.draw(ctx);
        label(ctx, 'Swaps: ' + swaps + (combo > 1 ? '   •   Combo x' + combo : ''), W / 2, H - 30, 16, '#cbd5e1');
      },
      down(x, y) { if (wait > 0) return; const b = ui.hit(x, y); if (!b) { sel = -1; return; } const i = +b.slice(1); if (sel < 0) { sel = i; E.sound('tick'); } else if (sel === i) sel = -1; else { swap(sel, i); sel = -1; } },
      hud() { return null; }
    };
  }
});
