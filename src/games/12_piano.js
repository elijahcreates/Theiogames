/* =====================================================================
   PIANO TILES
   ===================================================================== */
registerGame({
  id: 'piano', title: 'Piano Tiles', emoji: '🎹', c1: '#141e30', c2: '#8e2de2', cats: ['Arcade', 'Endless'], hot: true,
  desc: 'Tap the dark tiles as they glide down – never miss one and never touch the white keys. Every tile plays the next note!',
  controls: 'Tap • D F J K', scoreLabel: 'TILES',
  hint: 'Press D F J K (or click) on the dark tile in each lane. Speed keeps rising!', hintTouch: 'Tap the dark tiles – don’t miss and don’t tap white!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), LANES = 4, rows = [];
    // original melody (scale degrees), loops with variation
    const SC = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];
    const MEL = [0, 2, 4, 2, 5, 4, 2, 0, 1, 3, 5, 3, 6, 5, 4, 2, 4, 5, 7, 5, 4, 2, 3, 1, 0, 4, 7, 9, 7, 5, 4, 2];
    let speed = 3.0, offset = 0, score = 0, next = 0, dead = false, deadT = 0, started = false, t = 0, wrong = null, noteI = 0, lastLane = -1;
    function addRow() { let l; do { l = irand(0, 3); } while (l === lastLane && Math.random() < 0.6); lastLane = l; rows.push({ lane: l, hit: false, hitT: 0, id: next++, long: Math.random() < 0.08 && next > 10 }); }
    for (let i = 0; i < 8; i++) addRow();
    const rowH = () => E.H / 4;
    const laneW = () => Math.min(E.W, E.H * 0.9) / LANES;
    const left = () => (E.W - laneW() * LANES) / 2;
    // row i (index into rows) is at y = H - (i+1)*rowH + offset
    function rowY(i) { return E.H - (i + 1) * rowH() * 1 + offset * rowH() - rowH() * 0.0; }
    function firstUnhit() { for (let i = 0; i < rows.length; i++) if (!rows[i].hit) return i; return -1; }
    function tapLane(l) {
      if (dead) return;
      const i = firstUnhit(); if (i < 0) return;
      const r = rows[i];
      if (r.lane === l) {
        if (!started) started = true;
        r.hit = true; r.hitT = t; score++;
        const f = SC[MEL[noteI % MEL.length]] * (noteI % 64 >= 32 ? 1 : 1); noteI++;
        E.note(f, 0.45, 'triangle', 0.13); E.note(f * 2, 0.25, 'sine', 0.04);
        const y = rowY(i); fx.burst(left() + (l + 0.5) * laneW(), y + rowH() / 2, 10, { col: ['#a78bfa', '#22d3ee', '#fff'], spd: 160, size: 4, glow: true });
        if (score % 25 === 0) { fx.text(E.W / 2, E.H * 0.3, 'SPEED UP!', '#ffe36e', 34); E.sound('power'); }
      } else if (started) { die(l, i); } else { E.sound("tick"); }
    }
    function die(l, i) {
      dead = true; deadT = 0; wrong = { lane: l, row: i }; E.sound('error'); E.shake(10);
      E.gameOver({ score, title: 'Wrong Note!', lines: ['Tiles: ' + score, 'Top speed: ' + speed.toFixed(1) + ' tiles/s'], delay: 1100 });
    }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        if (dead || !started) return;
        speed = 3 + score * 0.04 + Math.min(4, score * 0.01);
        offset += speed * dt;
        while (offset >= 1) {
          // bottom row leaves screen
          const r = rows[0];
          if (!r.hit) { // missed
            offset = 0.98; dead = true; wrong = { lane: r.lane, row: 0, miss: true }; E.sound('error'); E.shake(8);
            E.gameOver({ score, title: 'Missed a Tile!', lines: ['Tiles: ' + score, 'Top speed: ' + speed.toFixed(1) + ' tiles/s'], delay: 1100 });
            return;
          }
          rows.shift(); addRow(); offset -= 1;
        }
      },
      draw() {
        const W = E.W, H = E.H, lw = laneW(), lx = left(), rh = rowH();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#0f0c29', '#302b63', '#24243e']); ctx.fillRect(0, 0, W, H);
        // glowing staff lines in bg
        ctx.strokeStyle = 'rgba(167,139,250,.12)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.3 + i * 18 + Math.sin(x * 0.01 + t + i) * 10); ctx.stroke(); }
        // white keys area
        ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fillRect(lx, 0, lw * LANES, H);
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (let l = 1; l < LANES; l++) { ctx.beginPath(); ctx.moveTo(lx + l * lw, 0); ctx.lineTo(lx + l * lw, H); ctx.stroke(); }
        rows.forEach((r, i) => {
          const y = rowY(i); if (y > H || y + rh < 0) return;
          const x = lx + r.lane * lw;
          if (r.hit) { const a = clamp(1 - (t - r.hitT) * 3, 0, 1); ctx.fillStyle = `rgba(160,140,255,${0.25 + a * 0.4})`; ctx.fillRect(x + 2, y + 2, lw - 4, rh - 4); }
          else {
            ctx.fillStyle = lgrad(ctx, x, y, x, y + rh, ['#1e1b4b', '#0b0a1f']); ctx.fillRect(x + 2, y + 2, lw - 4, rh - 4);
            ctx.fillStyle = 'rgba(124,92,255,.35)'; ctx.fillRect(x + 2, y + rh - 10, lw - 4, 8);
            if (i === firstUnhit() && !started) label(ctx, 'START', x + lw / 2, y + rh / 2, 22, '#fff');
          }
        });
        if (wrong) {
          const y = rowY(wrong.row), x = lx + wrong.lane * lw, a = 0.5 + 0.5 * Math.sin(t * 20);
          ctx.fillStyle = `rgba(239,68,68,${a})`; ctx.fillRect(x + 2, y + 2, lw - 4, rh - 4);
        }
        // lane key labels
        if (!E.touch) ['D', 'F', 'J', 'K'].forEach((k, l) => label(ctx, k, lx + (l + 0.5) * lw, H - 22, 18, 'rgba(120,120,160,.7)'));
        fx.draw(ctx);
        label(ctx, String(score), W / 2, 60, 56, '#ff5e8a');
      },
      down(x, y) { const l = Math.floor((x - left()) / laneW()); if (l >= 0 && l < LANES) tapLane(l); },
      onKey(c) { const m = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[c]; if (m !== undefined) tapLane(m); },
      hud() { return { stats: [['Speed', speed.toFixed(1)], ['Best', fmt(E.best())]] }; }
    };
  }
});
