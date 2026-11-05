/* =====================================================================
   REACTION TEST  (1P + local 2P)
   ===================================================================== */
registerGame({
  id: 'reaction', title: 'Reaction Test', emoji: '⚡', c1: '#0f9b0f', c2: '#00d2ff', cats: ['Brain Games', 'Multiplayer'], twoP: true, pop: true,
  desc: 'Wait for the screen to turn green, then tap as fast as you can. Measure your reflexes in milliseconds – or duel a friend!',
  controls: 'Tap / Space • 2P: S vs ↓', lowerBetter: true, scoreLabel: 'AVERAGE (ms)', fmtScore: v => Math.round(v) + ' ms',
  hint: 'Wait for GREEN, then click or press SPACE. 5 rounds – lowest average wins.', hintTouch: 'Wait for GREEN, then tap! 5 rounds.',
  hint2: 'P1 presses S (left) • P2 presses ↓ (right). Wait for GREEN! Early press = 1000 ms penalty.', hint2Touch: 'P1 taps the LEFT half, P2 taps the RIGHT half. Wait for GREEN!',
  p2info: 'Player 1: S key or left half of screen • Player 2: ↓ key or right half',
  create(E) {
    const ROUNDS = 5, two = E.mode === 2, ctx = E.ctx, fx = Fx();
    let state = 'ready', timer = 0, goAt = 0, round = 0, t = 0, flash = 0, msg = '';
    const res = [[], []]; // per player arrays of ms
    let pressed = [false, false], cur = [0, 0];
    function begin() { state = 'wait'; timer = rand(1.4, 4.2); pressed = [false, false]; cur = [0, 0]; msg = ''; }
    function press(p) {
      if (state === 'ready') { begin(); E.sound('click'); return; }
      if (state === 'result') { if (round >= ROUNDS) return; begin(); E.sound('click'); return; }
      if (pressed[p]) return;
      if (state === 'wait') {
        if (!two) { state = 'early'; timer = 1.2; E.sound('error'); E.shake(8); return; }
        pressed[p] = true; cur[p] = 1000; E.sound('error'); fx.text(E.W * (p ? 0.75 : 0.25), E.H * 0.5, 'TOO SOON! +1000', '#ff6b6b', 28);
        if (pressed[0] && pressed[1]) finishRound();
        return;
      }
      if (state === 'go') {
        const ms = Math.round((performance.now() - goAt)); pressed[p] = true; cur[p] = ms; E.sound('score');
        fx.burst(two ? E.W * (p ? 0.75 : 0.25) : E.W / 2, E.H / 2, 30, { col: ['#fff', '#b9ffb0', '#6ee7b7'], spd: 400, size: 5 });
        if (!two || (pressed[0] && pressed[1])) finishRound();
      }
    }
    function finishRound() {
      res[0].push(cur[0]); if (two) res[1].push(cur[1]); round++; state = 'result';
      if (two) msg = cur[0] === cur[1] ? 'TIE!' : (cur[0] < cur[1] ? 'PLAYER 1 WINS THE ROUND' : 'PLAYER 2 WINS THE ROUND');
      if (round >= ROUNDS) setTimeout(() => { if (E.g !== api) return; done(); }, 900);
    }
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    function done() {
      if (!two) { const a = avg(res[0]); E.gameOver({ score: Math.round(a), scoreText: Math.round(a) + ' ms', win: a < 300, title: a < 220 ? 'Lightning Fast!' : a < 300 ? 'Great Reflexes!' : 'Keep Practicing!', lines: ['Rounds: ' + res[0].map(v => v + ' ms').join(', '), 'Fastest: ' + Math.min(...res[0]) + ' ms'] }); }
      else {
        const a = avg(res[0]), b = avg(res[1]), w = a === b ? 0 : a < b ? 1 : 2;
        E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: w ? 'PLAYER ' + w : 'DRAW', label: 'WINNER', title: '🏁 Match Leaderboard',
          lines: [`🥇 ${w === 2 ? 'Player 2' : 'Player 1'} – avg ${Math.round(w === 2 ? b : a)} ms`, `🥈 ${w === 2 ? 'Player 1' : 'Player 2'} – avg ${Math.round(w === 2 ? a : b)} ms`, '', 'P1: ' + res[0].join(' / '), 'P2: ' + res[1].join(' / ')] });
      }
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); flash = Math.max(0, flash - dt * 3);
        if (state === 'wait') { timer -= dt; if (timer <= 0) { state = 'go'; goAt = performance.now(); flash = 1; E.sound('ding'); } }
        else if (state === 'early') { timer -= dt; if (timer <= 0) begin(); }
        else if (state === 'go' && two && performance.now() - goAt > 2500) { for (const p of [0, 1]) if (!pressed[p]) { pressed[p] = true; cur[p] = 1000; } finishRound(); }
      },
      draw() {
        const W = E.W, H = E.H;
        const col = state === 'go' ? ['#16a34a', '#4ade80'] : state === 'wait' ? ['#991b1b', '#ef4444'] : state === 'early' ? ['#7c2d12', '#f97316'] : ['#1e3a8a', '#3b82f6'];
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, col); ctx.fillRect(0, 0, W, H);
        // animated rings
        ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) { const r = ((t * 60 + i * 90) % 540); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); }
        ctx.restore();
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
        const s = Math.min(W, H) / 700;
        if (two) {
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(W / 2 - 2, 0, 4, H);
          for (const p of [0, 1]) {
            const cx = W * (p ? 0.75 : 0.25);
            ctx.fillStyle = p ? 'rgba(244,63,94,.18)' : 'rgba(59,130,246,.18)'; ctx.fillRect(p ? W / 2 : 0, 0, W / 2, H);
            label(ctx, 'PLAYER ' + (p + 1), cx, H * 0.18, 30 * s, p ? '#fecdd3' : '#bfdbfe');
            label(ctx, E.touch ? 'TAP THIS SIDE' : (p ? 'Press ↓' : 'Press S'), cx, H * 0.18 + 36 * s, 18 * s, '#fff');
            if (state === 'result' || pressed[p]) label(ctx, cur[p] >= 1000 ? 'X' : cur[p] + ' ms', cx, H * 0.45, 60 * s, '#fff');
            // round history
            res[p].forEach((v, i) => label(ctx, (i + 1) + ': ' + (v >= 1000 ? 'foul' : v + ' ms'), cx, H * 0.62 + i * 26 * s, 17 * s, '#e0e7ff'));
            if (res[p].length) label(ctx, 'AVG ' + Math.round(avg(res[p])) + ' ms', cx, H * 0.62 + 5.6 * 26 * s, 20 * s, '#ffe36e');
          }
        }
        const big = state === 'ready' ? 'TAP TO START' : state === 'wait' ? 'WAIT…' : state === 'go' ? 'GO!' : state === 'early' ? 'TOO SOON!' : (two ? msg : res[0][res[0].length - 1] + ' ms');
        label(ctx, big, W / 2, two ? H * 0.32 : H * 0.42, (state === 'go' ? 92 : 58) * s * (two ? 0.7 : 1), '#fff');
        const sub = state === 'ready' ? (two ? 'Both players get ready – first press starts the round' : 'Click or press SPACE when the screen turns green') : state === 'result' ? (round >= ROUNDS ? 'Match complete!' : 'Round ' + round + ' / ' + ROUNDS + ' – tap for next round') : state === 'wait' ? 'Round ' + (round + 1) + ' / ' + ROUNDS : '';
        label(ctx, sub, W / 2, two ? H * 0.32 + 52 * s : H * 0.42 + 70 * s, 20 * s, '#e0f2fe');
        if (!two && res[0].length) {
          const bw = Math.min(70, W / 8), x0 = W / 2 - (ROUNDS * bw) / 2;
          for (let i = 0; i < ROUNDS; i++) {
            const v = res[0][i], x = x0 + i * bw;
            rr(ctx, x + 6, H * 0.72, bw - 12, 80 * s, 10); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill();
            if (v) { const hgt = clamp(1 - (v - 150) / 500, 0.08, 1) * 80 * s; rr(ctx, x + 6, H * 0.72 + 80 * s - hgt, bw - 12, hgt, 10); ctx.fillStyle = v < 250 ? '#a3e635' : v < 350 ? '#fde047' : '#fb923c'; ctx.fill(); label(ctx, v + '', x + bw / 2, H * 0.72 + 96 * s, 14 * s, '#fff'); }
          }
        }
        fx.draw(ctx);
      },
      down(x) { if (!two) press(0); else if (state === 'ready' || state === 'result') press(0); else press(x < E.W / 2 ? 0 : 1); },
      onKey(c) {
        if (!two) { if (c === 'Space' || c === 'Enter') press(0); return; }
        if (c === 'KeyS' || c === 'KeyW' || c === 'KeyA' || c === 'KeyD') press(0);
        if (c === 'ArrowDown' || c === 'ArrowUp' || c === 'ArrowLeft' || c === 'ArrowRight') press(1);
        if (c === 'Space' && (state === 'ready' || state === 'result')) press(0);
      },
      hud() { return { stats: [['Round', Math.min(round + (state === 'result' ? 0 : 1), ROUNDS) + '/' + ROUNDS]].concat(two ? [] : [['Best', E.best() ? Math.round(E.best()) + ' ms' : '—']]) }; }
    };
    return api;
  }
});
