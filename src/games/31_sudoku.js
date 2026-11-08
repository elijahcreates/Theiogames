/* =====================================================================
   SUDOKU
   ===================================================================== */
registerGame({
  id: 'sudoku', title: 'Sudoku', emoji: '🧩', c1: '#2c3e50', c2: '#4ca1af', cats: ['Puzzle', 'Brain Games'], pop: true,
  desc: 'Freshly generated puzzles with a unique solution in Easy, Medium and Hard. Notes, error checking, hints and a completion timer.',
  controls: 'Tap cell + number • keys 1-9', scoreLabel: 'BEST TIME', lowerBetter: true, fmtScore: v => fmtTime(v),
  hint: 'Click a cell, then a number (or type 1–9). N toggles notes, H gives a hint, Backspace erases.', hintTouch: 'Tap a cell, then a number. ✎ toggles pencil notes, 💡 gives a hint.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    let sol, puz, grid, given, notes, sel = -1, diff = 0, time = 0, mistakes = 0, hints = 0, noteMode = false, done = false, ready = false, flashCell = {};
    function solve(g, count) { // backtracking solver; returns number of solutions up to `count`
      let n = 0; const rows = Array.from({ length: 9 }, () => new Set()), cols = Array.from({ length: 9 }, () => new Set()), box = Array.from({ length: 9 }, () => new Set());
      for (let i = 0; i < 81; i++) if (g[i]) { const r = i / 9 | 0, c = i % 9; rows[r].add(g[i]); cols[c].add(g[i]); box[(r / 3 | 0) * 3 + (c / 3 | 0)].add(g[i]); }
      function rec() {
        let best = -1, bestC = null;
        for (let i = 0; i < 81; i++) if (!g[i]) { const r = i / 9 | 0, c = i % 9, b = (r / 3 | 0) * 3 + (c / 3 | 0); const cand = []; for (let v = 1; v <= 9; v++) if (!rows[r].has(v) && !cols[c].has(v) && !box[b].has(v)) cand.push(v); if (!cand.length) return false; if (!bestC || cand.length < bestC.length) { best = i; bestC = cand; if (cand.length === 1) break; } }
        if (best < 0) { n++; return n >= count; }
        const r = best / 9 | 0, c = best % 9, b = (r / 3 | 0) * 3 + (c / 3 | 0);
        for (const v of (count === 1 ? shuffle(bestC) : bestC)) { g[best] = v; rows[r].add(v); cols[c].add(v); box[b].add(v); if (rec()) return true; rows[r].delete(v); cols[c].delete(v); box[b].delete(v); g[best] = 0; }
        return false;
      }
      rec(); return n;
    }
    function generate(d) {
      const g = Array(81).fill(0); solve(g, 1); sol = g.slice();
      const target = [38, 31, 26][d]; const p = sol.slice(); const order = shuffle([...Array(81).keys()]);
      let clues = 81;
      for (const i of order) { if (clues <= target) break; const v = p[i]; p[i] = 0; if (solve(p.slice(), 2) !== 1) p[i] = v; else clues--; }
      puz = p; grid = p.slice(); given = p.map(v => v !== 0); notes = Array.from({ length: 81 }, () => new Set());
      time = 0; mistakes = 0; hints = 0; done = false; sel = -1; ready = true;
    }
    E.choose('Sudoku', 'Choose difficulty', [{ label: '🟢 Easy', sub: '38 clues', value: 0 }, { label: '🟡 Medium', sub: '31 clues', value: 1 }, { label: '🔴 Hard', sub: '26 clues', value: 2 }], d => { diff = d; generate(d); });
    function conflicts(i) { const v = grid[i]; if (!v) return false; const r = i / 9 | 0, c = i % 9; for (let k = 0; k < 9; k++) { if (k !== c && grid[r * 9 + k] === v) return true; if (k !== r && grid[k * 9 + c] === v) return true; } const br = (r / 3 | 0) * 3, bc = (c / 3 | 0) * 3; for (let y = br; y < br + 3; y++) for (let x = bc; x < bc + 3; x++) if ((y * 9 + x) !== i && grid[y * 9 + x] === v) return true; return false; }
    function put(v) {
      if (!ready || done || sel < 0 || given[sel]) return;
      if (noteMode && v) { const s = notes[sel]; if (s.has(v)) s.delete(v); else s.add(v); E.sound('tick'); return; }
      grid[sel] = v; notes[sel].clear();
      if (v) {
        if (v !== sol[sel]) { mistakes++; E.sound('error'); flashCell[sel] = 1; }
        else { E.sound('click'); const r = sel / 9 | 0, c = sel % 9; for (let k = 0; k < 9; k++) { notes[r * 9 + k].delete(v); notes[k * 9 + c].delete(v); } }
      }
      if (grid.every((x, i) => x === sol[i])) win();
    }
    function hint() { if (!ready || done) return; const empties = grid.map((v, i) => v !== sol[i] ? i : -1).filter(i => i >= 0); if (!empties.length) return; const i = sel >= 0 && grid[sel] !== sol[sel] ? sel : pick(empties); grid[i] = sol[i]; given[i] = false; hints++; flashCell[i] = -1; sel = i; E.sound('power'); if (grid.every((x, k) => x === sol[k])) win(); }
    function win() { done = true; E.sound('win'); if (diff === 2) E.ach('sudokuh'); fx.burst(E.W / 2, E.H / 2, 80, { col: ['#fde047', '#4ca1af', '#fff'], spd: 400, shape: 'star', size: 7 }); const sc = Math.round(time + hints * 30); E.gameOver({ score: sc, scoreText: fmtTime(sc), label: 'TIME (+30s per hint)', win: true, title: ['Easy', 'Medium', 'Hard'][diff] + ' Solved!', lines: ['Mistakes: ' + mistakes + '  •  Hints: ' + hints], delay: 1400 }); }
    function layout() { const W = E.W, H = E.H, portrait = H > W * 1.1; const S = portrait ? Math.min(W - 24, H * 0.62) : Math.min(H - 140, W * 0.58); const gx = portrait ? (W - S) / 2 : Math.max(16, W / 2 - S / 2 - S * 0.28), gy = portrait ? 90 : (H - S) / 2 + 20; return { S, gx, gy, cs: S / 9, portrait }; }
    return {
      extra: { label: '💡 Hint', action: hint },
      update(dt) { if (ready && !done) time += dt; fx.update(dt); for (const k in flashCell) { flashCell[k] = flashCell[k] > 0 ? Math.max(0, flashCell[k] - dt * 1.5) : Math.min(0, flashCell[k] + dt * 1.5); if (!flashCell[k]) delete flashCell[k]; } },
      draw() {
        const W = E.W, H = E.H; ui.clear();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#0f2027', '#203a43', '#2c5364']); ctx.fillRect(0, 0, W, H);
        if (!ready) return;
        const { S, gx, gy, cs, portrait } = layout();
        shadowOn(ctx, 'rgba(0,0,0,.5)', 30, 0, 12); rr(ctx, gx - 6, gy - 6, S + 12, S + 12, 14); ctx.fillStyle = '#f8fafc'; ctx.fill(); shadowOff(ctx);
        const sr = sel >= 0 ? sel / 9 | 0 : -1, sc2 = sel >= 0 ? sel % 9 : -1, sv = sel >= 0 ? grid[sel] : 0;
        for (let i = 0; i < 81; i++) {
          const r = i / 9 | 0, c = i % 9, x = gx + c * cs, y = gy + r * cs;
          let bg = ((r / 3 | 0) + (c / 3 | 0)) % 2 ? '#eef2ff' : '#ffffff';
          if (sel >= 0 && (r === sr || c === sc2 || ((r / 3 | 0) === (sr / 3 | 0) && (c / 3 | 0) === (sc2 / 3 | 0)))) bg = '#dbeafe';
          if (sv && grid[i] === sv) bg = '#bfdbfe'; if (i === sel) bg = '#93c5fd';
          if (flashCell[i] > 0) bg = `rgba(248,113,113,${0.4 + flashCell[i] * 0.6})`; if (flashCell[i] < 0) bg = `rgba(134,239,172,${0.4 - flashCell[i] * 0.6})`;
          ctx.fillStyle = bg; ctx.fillRect(x, y, cs, cs);
          if (grid[i]) txt(ctx, String(grid[i]), x + cs / 2, y + cs / 2 + 1, cs * 0.6, given[i] ? '#0f172a' : conflicts(i) || grid[i] !== sol[i] ? '#dc2626' : '#2563eb', 'center', given[i] ? 800 : 600);
          else if (notes[i].size) for (const v of notes[i]) txt(ctx, String(v), x + ((v - 1) % 3 + 0.5) * cs / 3, y + (((v - 1) / 3 | 0) + 0.5) * cs / 3 + 1, cs * 0.24, '#64748b', 'center', 600);
          ui.zone('c' + i, x, y, cs, cs);
        }
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; for (let k = 1; k < 9; k++) { if (k % 3) { ctx.beginPath(); ctx.moveTo(gx + k * cs, gy); ctx.lineTo(gx + k * cs, gy + S); ctx.moveTo(gx, gy + k * cs); ctx.lineTo(gx + S, gy + k * cs); ctx.stroke(); } }
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; for (let k = 0; k <= 9; k += 3) { ctx.beginPath(); ctx.moveTo(gx + k * cs, gy); ctx.lineTo(gx + k * cs, gy + S); ctx.moveTo(gx, gy + k * cs); ctx.lineTo(gx + S, gy + k * cs); ctx.stroke(); }
        // number pad
        const counts = Array(10).fill(0); grid.forEach((v, i) => { if (v && v === sol[i]) counts[v]++; });
        let px, py, bw, bh, cols;
        if (portrait) { cols = 9; bw = Math.min(56, (W - 24) / 9 - 4); bh = bw * 1.15; px = (W - cols * (bw + 4)) / 2; py = gy + S + 20; }
        else { cols = 3; bw = Math.min(76, S * 0.17); bh = bw; px = gx + S + 36; py = gy + 10; }
        for (let v = 1; v <= 9; v++) { const k = v - 1, x = px + (k % cols) * (bw + 6), y = py + (k / cols | 0) * (bh + 6); ui.btn(ctx, 'n' + v, x, y, bw, bh, String(v), { cols: counts[v] >= 9 ? ['#475569', '#334155'] : ['#60a5fa', '#2563eb'], size: bh * 0.5 }); }
        const by = portrait ? py + bh + 14 : py + 3 * (bh + 6) + 8, bx = portrait ? (W - 3 * 110) / 2 : px, bw2 = portrait ? 104 : (bw * 3 + 12 - 12) / 3;
        ui.btn(ctx, 'note', bx, by, bw2, 46, noteMode ? '✎ ON' : '✎ Notes', { cols: noteMode ? ['#f59e0b', '#d97706'] : ['#64748b', '#475569'], size: 15 });
        ui.btn(ctx, 'erase', bx + bw2 + 6, by, bw2, 46, '⌫', { cols: ['#64748b', '#475569'], size: 18 });
        ui.btn(ctx, 'hint', bx + (bw2 + 6) * 2, by, bw2, 46, '💡', { cols: ['#22c55e', '#15803d'], size: 18 });
        const ix = portrait ? W / 2 : px + (bw * 3 + 12) / 2, iy = portrait ? 56 : by + 80;
        label(ctx, ['EASY', 'MEDIUM', 'HARD'][diff] + '  •  ⏱ ' + fmtTime(time) + '  •  ✖ ' + mistakes, ix, iy, 17, '#e2e8f0');
        fx.draw(ctx);
      },
      down(x, y) { const b = ui.hit(x, y); if (!b) return; if (b[0] === 'c') { sel = +b.slice(1); E.sound('tick'); } else if (b[0] === 'n') put(+b.slice(1)); else if (b === 'note') noteMode = !noteMode; else if (b === 'erase') put(0); else if (b === 'hint') hint(); },
      onKey(c) {
        const m = /^(Digit|Numpad)([0-9])$/.exec(c); if (m) { put(+m[2]); return; }
        if (c === 'Backspace' || c === 'Delete') put(0); if (c === 'KeyN') noteMode = !noteMode; if (c === 'KeyH') hint();
        if (sel < 0) sel = 40; const r = sel / 9 | 0, cc = sel % 9;
        if (c === 'ArrowUp') sel = ((r + 8) % 9) * 9 + cc; if (c === 'ArrowDown') sel = ((r + 1) % 9) * 9 + cc; if (c === 'ArrowLeft') sel = r * 9 + (cc + 8) % 9; if (c === 'ArrowRight') sel = r * 9 + (cc + 1) % 9;
      },
      hud() { return null; }
    };
  }
});
