/* =====================================================================
   THE IMPOSSIBLE QUIZ  (original trick questions)
   ===================================================================== */
registerGame({
  id: 'quiz', title: 'The Impossible Quiz', emoji: '❓', c1: '#ee0979', c2: '#ff6a00', cats: ['Brain Games', 'Puzzle'], hot: true,
  desc: '30 sneaky, silly and surprising questions. Read carefully – hidden answers, moving buttons, ticking bombs and questions where doing nothing is the answer!',
  controls: 'Click / tap', scoreLabel: 'QUESTIONS',
  hint: 'Read every question carefully. You have 3 lives. Not every answer is a button…', hintTouch: 'Read carefully! 3 lives. Not every answer is a button…',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    const Q = [
      { q: 'What colour is the sky on a sunny day?', a: ['Blue', 'Green', 'Plaid', 'Banana'], c: 0 },
      { q: "How many letters are in 'the alphabet'?", a: ['26', '11', '8', '1'], c: 1 },
      { q: 'Click the biggest number.', a: ['7', '3', '9', '2'], c: 2, sizes: [1.1, 1.4, 0.55, 2.1] },
      { q: 'What do cows drink?', a: ['Milk', 'Water', 'Lemonade', 'Moo juice'], c: 1 },
      { q: 'Which is heavier: a kilo of feathers or a kilo of bricks?', a: ['Feathers', 'Bricks', 'They weigh the same', 'Bricks, obviously'], c: 2 },
      { q: 'Find the hidden answer to pass this question.', a: ['Here', 'There', 'Nowhere', 'Everywhere'], hidden: 'answer' },
      { q: 'You pass the person in 2nd place in a race. What place are you in now?', a: ['1st', '2nd', '3rd', 'Last'], c: 1 },
      { q: 'QUICK! Defuse the bomb – click the RED wire!', a: ['Blue wire', 'Red wire', 'Green wire', 'Yellow wire'], c: 2, colors: ['#3b82f6', '#22c55e', '#ef4444', '#eab308'], timer: 6 },
      { q: "Don't touch ANYTHING for 5 seconds.", a: ['Click me!', 'No, me!', 'Pick me!', "I'm the answer!"], wait: 5 },
      { q: 'What has keys but can’t open locks?', a: ['A piano', 'A janitor', 'A door', 'A lock-pick'], c: 0 },
      { q: 'Which letter comes right after Q?', a: ['P', 'R', 'S', 'Q'], c: 1 },
      { q: 'How many months have 28 days?', a: ['1', '2', '12', '6'], c: 2 },
      { q: 'Catch the right answer! Which planet do we live on?', a: ['Earth', 'Mars', 'Jupiter', 'Pluto'], c: 0, move: 0 },
      { q: 'What is 2 + 2 × 2?', a: ['8', '6', '4', '222'], c: 1 },
      { q: 'Click the dot.', a: ['The dot', 'A dot', 'Dot!', '• dot •'], tiny: true },
      { q: 'BONUS: You found a spare life! Which button gives it to you?', a: ['This one', 'This one', 'This one', 'This one'], c: 3, bonus: true },
      { q: 'Which word is spelled incorrectly in every dictionary?', a: ['Incorrectly', 'Wrong', 'Dictionary', 'Every'], c: 0 },
      { q: 'What goes up but never comes down?', a: ['A balloon', 'Your age', 'Rain', 'A rocket'], c: 1 },
      { q: 'How many sides does a circle have?', a: ['0', '1', '2 (inside & outside)', 'Infinite'], c: 2 },
      { q: 'Click the second word of this question to continue.', a: ['Second', 'Word', 'Continue', 'Click'], hidden: 'the' },
      { q: 'Which of these is NOT a fruit?', a: ['Tomato', 'Banana', 'Carrot', 'Apple'], c: 2 },
      { q: 'What can you catch but not throw?', a: ['A ball', 'A cold', 'A frisbee', 'A fish'], c: 1 },
      { q: "QUICK! What's 10 − 10 + 1?", a: ['0', '1', '10', '11'], c: 1, timer: 5 },
      { q: 'Where does Friday come before Thursday?', a: ['In a dictionary', 'On Mars', 'Never', 'In a calendar'], c: 0 },
      { q: "Click 'YES' to continue.", a: ['YES', 'NO', 'MAYBE', 'YES?'], c: 0, move: 0 },
      { q: 'What gets wetter the more it dries?', a: ['A towel', 'A sponge', 'The ocean', 'A fish'], c: 0 },
      { q: 'Click the word with the FEWEST letters.', a: ['ANT', 'hippopotamus', 'tiger', 'zebra'], c: 0, sizes: [0.6, 2.0, 1.2, 1.1] },
      { q: 'Patience is a virtue… the answer is coming…', a: ['Now?', 'Now!', 'NOW!!', 'Hurry up!'], wait: 6 },
      { q: 'What has a neck but no head?', a: ['A bottle', 'A giraffe', 'A snake', 'A turtle'], c: 0 },
      { q: 'Final question! What number is this question?', a: ['29', '30', '31', 'Final'], c: 1 }
    ];
    let qi = 0, lives = 3, t = 0, qt = 0, flash = 0, fcol = '#fff', mv = { x: 0, y: 0, tx: 0, ty: 0 }, dot = { x: 0, y: 0 }, wordZones = [], busy = 0, pointer = { x: -999, y: -999 };
    function setupQ() { qt = 0; const q = Q[qi]; dot.x = rand(0.15, 0.85); dot.y = rand(0.62, 0.92); mv.x = mv.tx = 0; mv.y = mv.ty = 0; }
    setupQ();
    function right() { flash = 1; fcol = '#4ade80'; E.sound('score'); fx.burst(E.W / 2, E.H * 0.35, 30, { col: ['#4ade80', '#fff', '#fde047'], spd: 260, shape: 'star' }); if (Q[qi].bonus) lives++; busy = 0.6; }
    function wrong() { flash = 1; fcol = '#ef4444'; lives--; E.sound('error'); E.shake(10); busy = 0.6; if (lives <= 0) E.gameOver({ score: qi, title: 'Out of Lives!', lines: ['You reached question ' + (qi + 1) + ' of ' + Q.length, '“' + Q[qi].q + '”'] }); else setupQ(); }
    function nextQ() { qi++; if (qi >= Q.length) { E.gameOver({ score: Q.length, win: true, title: 'You Beat the Impossible Quiz!', lines: ['Lives left: ' + lives] }); return; } setupQ(); }
    function boxes() { const W = E.W, H = E.H, bw = Math.min(330, (W - 50) / 2), bh = Math.min(84, H * 0.11), x0 = W / 2 - bw - 8, y0 = H * 0.5; return [0, 1, 2, 3].map(i => ({ x: x0 + (i % 2) * (bw + 16), y: y0 + Math.floor(i / 2) * (bh + 16), w: bw, h: bh })); }
    return {
      update(dt) {
        t += dt; qt += dt; fx.update(dt); flash = Math.max(0, flash - dt * 2);
        if (busy > 0) { busy -= dt; if (busy <= 0 && fcol === '#4ade80') nextQ(); return; }
        const q = Q[qi];
        if (q.timer && qt > q.timer) { fx.burst(E.W / 2, E.H * 0.3, 60, { col: ['#f97316', '#fde047', '#ef4444'], spd: 420 }); E.sound('boom'); wrong(); }
        if (q.wait && qt > q.wait) right();
        if (q.move !== undefined) {
          const B = boxes()[q.move], cx = B.x + B.w / 2 + mv.x, cy = B.y + B.h / 2 + mv.y;
          if (!E.touch) { if (Math.hypot(pointer.x - cx, pointer.y - cy) < 120 && qt < 7) { const a = Math.atan2(cy - pointer.y, cx - pointer.x); mv.tx = clamp(mv.tx + Math.cos(a) * 160, -E.W * 0.35, E.W * 0.35); mv.ty = clamp(mv.ty + Math.sin(a) * 120, -E.H * 0.35, E.H * 0.08); } }
          else if (Math.floor(qt / 0.9) !== Math.floor((qt - dt) / 0.9) && qt < 8) { mv.tx = rand(-E.W * 0.3, E.W * 0.3); mv.ty = rand(-E.H * 0.25, E.H * 0.05); }
          mv.x += (mv.tx - mv.x) * Math.min(1, dt * 10); mv.y += (mv.ty - mv.y) * Math.min(1, dt * 10);
        }
      },
      draw() {
        const W = E.W, H = E.H, q = Q[qi]; ui.clear(); wordZones = [];
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#2b0a3d', '#5b1647', '#93291e']); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 14; i++) { ctx.globalAlpha = 0.08; txt(ctx, '?', (i * 173 + Math.sin(t + i) * 20) % W, (i * 113) % H, 60 + (i % 4) * 30, '#fff', 'center', 900); } ctx.globalAlpha = 1;
        label(ctx, 'QUESTION ' + (qi + 1) + ' / ' + Q.length, W / 2, 36, 20, '#fde68a');
        label(ctx, '❤️'.repeat(Math.max(0, lives)), W / 2, 68, 22, '#fff');
        // question card with word wrapping
        const cw = Math.min(760, W - 30), cx0 = W / 2 - cw / 2, fs = Math.min(30, W / 22);
        shadowOn(ctx, 'rgba(0,0,0,.4)', 20, 0, 8); rr(ctx, cx0, H * 0.14, cw, H * 0.3, 22); ctx.fillStyle = '#fff7ed'; ctx.fill(); shadowOff(ctx);
        ctx.font = `800 ${fs}px system-ui`; const words = q.q.split(' '); const lines = [[]]; let lw = 0;
        for (const w of words) { const ww = ctx.measureText(w + ' ').width; if (lw + ww > cw - 50 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(w); lw += ww; }
        const ly0 = H * 0.29 - (lines.length - 1) * fs * 0.65;
        lines.forEach((ln, li) => { const total = ctx.measureText(ln.join(' ')).width; let x = W / 2 - total / 2; const y = ly0 + li * fs * 1.3; ln.forEach(w => { const ww = ctx.measureText(w).width; ctx.fillStyle = '#7c2d12'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(w, x, y); wordZones.push({ w: w.replace(/[^a-z]/gi, '').toLowerCase(), x, y: y - fs / 2, ww, h: fs }); x += ww + ctx.measureText(' ').width; }); });
        if (q.timer) { const left = Math.max(0, q.timer - qt); label(ctx, '💣 ' + left.toFixed(1), W / 2, H * 0.42, 26, left < 2 ? '#ef4444' : '#7c2d12'); }
        // answers
        boxes().forEach((b, i) => {
          let x = b.x, y = b.y; if (q.move === i) { x += mv.x; y += mv.y; }
          const cols = q.colors ? [q.colors[i], q.colors[i]] : [['#f472b6', '#db2777'], ['#60a5fa', '#2563eb'], ['#4ade80', '#16a34a'], ['#fbbf24', '#d97706']][i];
          ui.btn(ctx, 'a' + i, x, y, b.w, b.h, q.a[i], { cols, size: Math.min(26, b.h * 0.34) * (q.sizes ? q.sizes[i] : 1) });
        });
        if (q.tiny) { const x = dot.x * W, y = dot.y * H; circle(ctx, x, y, 2.4, '#fde68a'); ui.zone('dot', x - 12, y - 12, 24, 24); }
        if (flash) { ctx.fillStyle = fcol; ctx.globalAlpha = flash * 0.3; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; label(ctx, fcol === '#4ade80' ? (Q[qi] && Q[qi].bonus ? '+1 LIFE!' : 'CORRECT!') : 'WRONG!', W / 2, H * 0.47, 40, fcol); }
        fx.draw(ctx);
      },
      down(x, y) {
        if (busy > 0) return; const q = Q[qi];
        if (q.hidden) { const z = wordZones.find(z => x >= z.x && x <= z.x + z.ww && y >= z.y && y <= z.y + z.h); if (z) { const idx = wordZones.indexOf(z); if ((q.hidden === 'the' && idx === 1) || (q.hidden !== 'the' && z.w === q.hidden)) return right(); return; } }
        const b = ui.hit(x, y); if (!b) return;
        if (b === 'dot') return right();
        if (q.wait || q.tiny || q.hidden) return wrong();
        if (+b.slice(1) === q.c) right(); else wrong();
      },
      move(x, y) { pointer.x = x; pointer.y = y; },
      onKey(c) { const q = Q[qi]; if (busy > 0) return; if (qi === 10 && c === 'KeyR') right(); },
      hud() { return null; }
    };
  }
});
