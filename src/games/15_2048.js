/* =====================================================================
   2048
   ===================================================================== */
registerGame({
  id: 'g2048', title: '2048', emoji: '🔢', c1: '#f59e0b', c2: '#ef4444', cats: ['Puzzle', 'Brain Games'], pop: true, tags: 'numbers merge',
  desc: 'Slide and merge matching numbered tiles to reach 2048 – and beyond. Includes undo and smooth animations.',
  controls: 'Arrows / WASD / swipe • U = undo', scoreLabel: 'SCORE',
  hint: 'Arrow keys / WASD to slide. U = undo. Merge equal tiles to reach 2048!', hintTouch: 'Swipe to slide tiles. Merge equal numbers to reach 2048!',
  create(E) {
    const ctx = E.ctx, N = 4, fx = Fx(); let grid, tiles = [], score = 0, undo = [], won = false, anim = 0, sw = null, over = false, id = 0;
    const COL = { 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };
    const saved = E.data('state', null);
    function reset() { grid = Array.from({ length: N }, () => Array(N).fill(null)); tiles = []; score = 0; add(); add(); }
    function add() { const e = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) e.push([x, y]); if (!e.length) return; const [x, y] = pick(e); const t = { id: id++, v: Math.random() < 0.9 ? 2 : 4, x, y, px: x, py: y, born: 1, pop: 0 }; grid[y][x] = t; tiles.push(t); }
    function snap() { return { s: score, g: grid.map(r => r.map(t => t ? t.v : 0)) }; }
    function load(st) { grid = Array.from({ length: N }, () => Array(N).fill(null)); tiles = []; score = st.s; st.g.forEach((r, y) => r.forEach((v, x) => { if (v) { const t = { id: id++, v, x, y, px: x, py: y, born: 0, pop: 0 }; grid[y][x] = t; tiles.push(t); } })); }
    if (saved && saved.g) load(saved); else reset();
    function move(dir) {
      if (over || anim > 0.02) return;
      const before = snap(); let moved = false; const dx = [0, 1, 0, -1][dir], dy = [-1, 0, 1, 0][dir];
      tiles.forEach(t => { t.px = t.x; t.py = t.y; t.merged = false; t.born = 0; t.pop = 0; });
      const xs = [...Array(N).keys()], ys = [...Array(N).keys()]; if (dx === 1) xs.reverse(); if (dy === 1) ys.reverse();
      const dead = [];
      for (const y of ys) for (const x of xs) {
        const t = grid[y][x]; if (!t) continue; let cx = x, cy = y;
        while (true) {
          const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
          const o = grid[ny][nx];
          if (!o) { grid[cy][cx] = null; grid[ny][nx] = t; cx = nx; cy = ny; moved = true; continue; }
          if (o.v === t.v && !o.merged && !t.merged) { grid[cy][cx] = null; o.v *= 2; o.merged = true; o.pop = 1; score += o.v; t.x = nx; t.y = ny; dead.push(t); moved = true; if (o.v >= 2048 && !won) { won = true; E.ach('t2048'); E.sound('win'); fx.text(E.W / 2, E.H / 2, '2048!!!', '#ffe36e', 60); } else E.sound('pop', 0); cx = -1; break; }
          break;
        }
        if (cx >= 0) { t.x = cx; t.y = cy; }
      }
      if (!moved) return;
      dead.forEach(d => { d.dying = true; });
      undo.push(before); if (undo.length > 3) undo.shift();
      anim = 1; E.sound('swish', 30);
      setTimeout(() => { tiles = tiles.filter(t => !t.dying); add(); E.save('state', snap()); if (!canMove()) { over = true; E.save('state', null); E.gameOver({ score, title: won ? 'Great Run!' : 'No More Moves', lines: ['Biggest tile: ' + Math.max(...tiles.map(t => t.v))], win: won }); } }, 110);
    }
    function canMove() { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const t = grid[y][x]; if (!t) return true; if (x < N - 1 && grid[y][x + 1] && grid[y][x + 1].v === t.v) return true; if (y < N - 1 && grid[y + 1][x] && grid[y + 1][x].v === t.v) return true; } return false; }
    function doUndo() { if (!undo.length || over) return; load(undo.pop()); E.sound('click'); E.save('state', snap()); }
    const ui = UI();
    return {
      extra: { label: '↶ Undo', action: doUndo },
      update(dt) { anim = Math.max(0, anim - dt * 9); fx.update(dt); tiles.forEach(t => { t.born = Math.max(0, t.born - dt * 6); t.pop = Math.max(0, t.pop - dt * 5); }); },
      draw() {
        const W = E.W, H = E.H; ui.clear();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#fdf6e3', '#f3e2c7']); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(237,194,46,.12)'; for (let i = 0; i < 8; i++) { circle(ctx, (i * 211) % W, (i * 137) % H, 60 + i * 10); ctx.fill(); }
        const S = Math.min(W * 0.92, H * 0.7, 520), gx = (W - S) / 2, gy = Math.max(110, (H - S) / 2 + 30), gap = S * 0.03, cs = (S - gap * (N + 1)) / N;
        txt(ctx, '2048', gx, gy - 54, Math.min(56, S * 0.13), '#776e65', 'left', 900);
        ['SCORE', 'BEST'].forEach((l, i) => { const bw = S * 0.22, bx = gx + S - bw * (2 - i) - (1 - i) * 8; rr(ctx, bx, gy - 80, bw, 56, 10); ctx.fillStyle = '#bbada0'; ctx.fill(); txt(ctx, l, bx + bw / 2, gy - 64, 12, '#eee4da', 'center', 800); txt(ctx, fmt(i ? Math.max(score, E.best()) : score), bx + bw / 2, gy - 40, 20, '#fff', 'center', 900); });
        shadowOn(ctx, 'rgba(0,0,0,.2)', 20, 0, 8); rr(ctx, gx, gy, S, S, 14); ctx.fillStyle = '#bbada0'; ctx.fill(); shadowOff(ctx);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { rr(ctx, gx + gap + x * (cs + gap), gy + gap + y * (cs + gap), cs, cs, 8); ctx.fillStyle = 'rgba(238,228,218,.35)'; ctx.fill(); }
        const k = 1 - anim;
        const ordered = tiles.slice().sort((a, b) => (a.dying ? 0 : 1) - (b.dying ? 0 : 1));
        for (const t of ordered) {
          const fx2 = lerp(t.px, t.x, k), fy = lerp(t.py, t.y, k), sc = (1 - t.born) * (1 + t.pop * 0.15);
          const cx = gx + gap + fx2 * (cs + gap) + cs / 2, cy = gy + gap + fy * (cs + gap) + cs / 2, s2 = cs * sc;
          const c = COL[t.v] || '#3c3a32';
          if (t.v >= 128) { shadowOn(ctx, 'rgba(237,194,46,.7)', 10 + Math.log2(t.v) * 2); }
          rr(ctx, cx - s2 / 2, cy - s2 / 2, s2, s2, 8); ctx.fillStyle = c; ctx.fill(); shadowOff(ctx);
          const fs = s2 * (t.v < 100 ? 0.45 : t.v < 1000 ? 0.36 : t.v < 10000 ? 0.28 : 0.22);
          txt(ctx, String(t.v), cx, cy + 2, fs, t.v <= 4 ? '#776e65' : '#f9f6f2', 'center', 900);
        }
        if (!E.touch) txt(ctx, 'Arrow keys / WASD • U = Undo', W / 2, gy + S + 26, 14, '#8f7a66');
        ui.btn(ctx, 'new', W / 2 - 70, Math.min(H - 54, gy + S + 42), 140, 40, '↻ New Game', { cols: ['#8f7a66', '#6d5c4d'], size: 16 });
        fx.draw(ctx);
      },
      down(x, y) { const b = ui.hit(x, y); if (b === 'new') { undo = []; won = false; over = false; reset(); E.save('state', null); E.sound('click'); return; } sw = { x, y }; },
      up(x, y) { if (!sw) return; const dx = x - sw.x, dy = y - sw.y; sw = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 3); else move(dy > 0 ? 2 : 0); },
      onKey(c) { const m = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 }[c]; if (m !== undefined) move(m); if (c === 'KeyU' || c === 'KeyZ') doUndo(); },
      hud() { return null; }
    };
  }
});
