/* =====================================================================
   BLOCK PUZZLE
   ===================================================================== */
registerGame({
  id: 'blockpuzzle', title: 'Block Puzzle', emoji: '🟦', c1: '#3a1c71', c2: '#d76d77', cats: ['Puzzle', 'Brain Games'], pop: true,
  desc: 'Drag colorful shapes onto the 8×8 board. Fill complete rows or columns to clear them – chain clears for big combos!',
  controls: 'Drag & drop', scoreLabel: 'SCORE',
  hint: 'Drag pieces onto the board. Complete rows or columns to clear them. Game ends when nothing fits.', hintTouch: 'Drag pieces onto the board. Fill rows or columns to clear!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), N = 8;
    const SHAPES = [[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[1, 0], [1, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]];
    const HUES = [0, 30, 50, 140, 190, 220, 270, 320];
    const board = Array.from({ length: N }, () => Array(N).fill(null));
    let tray = [], drag = null, score = 0, combo = 0, t = 0, clearing = [], over = false;
    function refill() { tray = [0, 1, 2].map(() => ({ s: pick(SHAPES), hue: pick(HUES) })); }
    refill();
    function fits(s, gx, gy) { return s.every(([x, y]) => gx + x >= 0 && gy + y >= 0 && gx + x < N && gy + y < N && !board[gy + y][gx + x]); }
    function anyFit(s) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fits(s, x, y)) return true; return false; }
    function layout() { const W = E.W, H = E.H, S = Math.min(W - 30, H * 0.62, 540), gx = (W - S) / 2, gy = Math.max(70, H * 0.08); return { S, gx, gy, cs: S / N, ty: gy + S + 24, th: Math.min(H - (gy + S + 24) - 10, S * 0.36) }; }
    function place(i, gx, gy) {
      const p = tray[i]; p.s.forEach(([x, y]) => board[gy + y][gx + x] = { hue: p.hue, pop: 1 }); score += p.s.length; tray[i] = null; E.sound('land', 20);
      const rows = [], cols = []; for (let k = 0; k < N; k++) { if (board[k].every(c => c)) rows.push(k); if (board.every(r => r[k])) cols.push(k); }
      const n = rows.length + cols.length;
      if (n) { combo++; const pts = n * 10 * n * combo; score += pts; const L = layout(); rows.forEach(r => board[r].forEach((c, x) => clearing.push({ x, y: r, hue: c.hue, t: 0 }))); cols.forEach(c => board.forEach((r, y) => clearing.push({ x: c, y, hue: r[c].hue, t: 0 }))); rows.forEach(r => board[r].fill(null)); cols.forEach(c => board.forEach(r => r[c] = null)); clearing.forEach(cl => { if (cl.t === 0) fx.burst(L.gx + (cl.x + 0.5) * L.cs, L.gy + (cl.y + 0.5) * L.cs, 4, { col: hsl(cl.hue, 85, 60), spd: 200, shape: 's', size: 8, grav: 500 }); }); fx.text(E.W / 2, L.gy + L.S / 2, (n > 1 ? n + ' LINES! ' : '') + '+' + pts + (combo > 1 ? '  COMBO x' + combo : ''), '#fde047', 32); E.sound(n > 1 ? 'cheer' : 'score'); E.shake(n * 3); }
      else combo = 0;
      if (tray.every(p => !p)) refill();
      if (!tray.some(p => p && anyFit(p.s))) { over = true; E.gameOver({ score, title: 'No Moves Left', lines: ['Score: ' + score], delay: 900 }); }
    }
    function block(x, y, s, hue, a) { ctx.globalAlpha = a === undefined ? 1 : a; rr(ctx, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.18); ctx.fillStyle = lgrad(ctx, x, y, x, y + s, [hsl(hue, 85, 66), hsl(hue, 80, 48)]); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, x + s * 0.15, y + s * 0.12, s * 0.7, s * 0.18, s * 0.09); ctx.fill(); ctx.globalAlpha = 1; }
    function trayPos(i, L) { const w = E.W / 3; return { cx: w * (i + 0.5), cy: L.ty + L.th / 2, s: Math.min(L.cs * 0.6, L.th / 5.2, w / 5.5) }; }
    return {
      update(dt) { t += dt; fx.update(dt); clearing.forEach(c => c.t += dt); clearing = clearing.filter(c => c.t < 0.4); board.forEach(r => r.forEach(c => { if (c && c.pop > 0) c.pop = Math.max(0, c.pop - dt * 5); })); },
      draw() {
        const W = E.W, H = E.H, L = layout();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#1e1036', '#3a1c71', '#5a2a6e']); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 10; i++) block((i * 173 + t * 10) % W, (i * 97) % H, 40, HUES[i % 8], 0.08);
        shadowOn(ctx, 'rgba(0,0,0,.5)', 24, 0, 10); rr(ctx, L.gx - 8, L.gy - 8, L.S + 16, L.S + 16, 16); ctx.fillStyle = '#1a1033'; ctx.fill(); shadowOff(ctx);
        let ghost = null;
        if (drag) { const gx = Math.round((drag.x - L.gx) / L.cs - drag.ox - 0.5), gy = Math.round((drag.y - L.gy) / L.cs - drag.oy - 0.5); if (fits(drag.p.s, gx, gy)) ghost = { gx, gy }; drag.ghost = ghost; }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const c = board[y][x], px = L.gx + x * L.cs, py = L.gy + y * L.cs;
          if (c) { const k = 1 + c.pop * 0.12; block(px + L.cs * (1 - k) / 2, py + L.cs * (1 - k) / 2, L.cs * k, c.hue); }
          else { rr(ctx, px + 2, py + 2, L.cs - 4, L.cs - 4, 6); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill(); }
        }
        if (ghost) drag.p.s.forEach(([x, y]) => block(L.gx + (ghost.gx + x) * L.cs, L.gy + (ghost.gy + y) * L.cs, L.cs, drag.p.hue, 0.4));
        for (const c of clearing) { const k = 1 - c.t / 0.4; ctx.globalAlpha = k; rr(ctx, L.gx + c.x * L.cs, L.gy + c.y * L.cs, L.cs, L.cs, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; }
        tray.forEach((p, i) => {
          if (!p || (drag && drag.i === i)) return; const tp = trayPos(i, L); const w = Math.max(...p.s.map(q => q[0])) + 1, h = Math.max(...p.s.map(q => q[1])) + 1;
          const ok = anyFit(p.s); p.s.forEach(([x, y]) => block(tp.cx + (x - w / 2) * tp.s, tp.cy + (y - h / 2) * tp.s, tp.s, ok ? p.hue : 0, ok ? 1 : 0.35));
        });
        if (drag) { drag.p.s.forEach(([x, y]) => block(drag.x + (x - drag.ox) * L.cs - L.cs / 2, drag.y + (y - drag.oy) * L.cs - L.cs / 2, L.cs, drag.p.hue, 0.95)); }
        fx.draw(ctx);
        label(ctx, fmt(score), W / 2, Math.max(36, L.gy - 34), 34, '#fff');
      },
      down(x, y) {
        if (over) return; const L = layout();
        tray.forEach((p, i) => { if (!p) return; const tp = trayPos(i, L); if (Math.abs(x - tp.cx) < E.W / 6 && Math.abs(y - tp.cy) < L.th / 2 + 20) { const w = Math.max(...p.s.map(q => q[0])) + 1, h = Math.max(...p.s.map(q => q[1])) + 1; drag = { i, p, x, y: y - L.cs * 1.6, ox: (w - 1) / 2, oy: h - 1 + 0.5, lift: L.cs * 1.6 }; E.sound('tick'); } });
      },
      move(x, y) { if (drag) { drag.x = x; drag.y = y - drag.lift; } },
      up() { if (!drag) return; const g = drag.ghost; if (g) place(drag.i, g.gx, g.gy); drag = null; },
      hud() { return { stats: [['Best', fmt(E.best())]].concat(combo > 1 ? [['Combo', 'x' + combo]] : []) }; }
    };
  }
});
