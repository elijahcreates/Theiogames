/* =====================================================================
   WORD SCRAMBLE
   ===================================================================== */
registerGame({
  id: 'wordscramble', title: 'Word Scramble', emoji: '🔤', c1: '#ff512f', c2: '#dd2476', cats: ['Puzzle', 'Brain Games'],
  desc: 'Unscramble the letters before the clock runs out. Three difficulty levels, hints that reveal letters, and streak bonuses.',
  controls: 'Type or tap letters', scoreLabel: 'SCORE',
  hint: 'Type the word (Enter to submit, Backspace to erase) or click the letters. 💡 reveals a letter, ⏭ skips.', hintTouch: 'Tap the letters in the right order. 💡 reveals a letter, ⏭ skips.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    const WORDS = [
      'APPLE BEACH CHAIR DANCE EAGLE FROST GRAPE HONEY JUICE KOALA LEMON MANGO NOISE OCEAN PIANO QUEEN RIVER SNAKE TIGER UNCLE VOICE WHALE YOUTH ZEBRA CLOUD BREAD TRAIN PLANT SMILE STORM CANDY HORSE MOUSE PIZZA ROBOT SPACE SPOON STONE TOWER WATER LIGHT MAGIC MUSIC PAPER PARTY SHEEP SHIRT SPORT SUGAR TABLE TEETH TRUCK',
      'BANANA CASTLE DRAGON FLOWER GARDEN HAMMER ISLAND JUNGLE KITTEN LADDER MARBLE NAPKIN ORANGE PENCIL PLANET RABBIT ROCKET SCHOOL SPIDER TURTLE VIOLIN WINDOW YELLOW BUTTON CAMERA COOKIE DOCTOR FOREST GUITAR HELMET INSECT JACKET LIZARD MONKEY PEANUT PUZZLE SADDLE SUMMER TICKET TOMATO WALRUS WIZARD BALLOON BICYCLE CABBAGE CAPTAIN DOLPHIN FREEDOM GIRAFFE HOLIDAY KITCHEN LANTERN MONSTER PENGUIN PICTURE RAINBOW SCIENCE TEACHER VOLCANO WEATHER',
      'ADVENTURE AIRPLANE ASTRONAUT BLUEBERRY BUTTERFLY CHAMPION CHOCOLATE DINOSAUR DISCOVERY ELEPHANT EXPLORER FIREWORKS FRIENDSHIP GRASSHOPPER HAMBURGER HEDGEHOG IMAGINATION JELLYFISH KANGAROO LIGHTHOUSE MARSHMALLOW MOUNTAIN NOTEBOOK OCTOPUS PAINTBRUSH PINEAPPLE PLAYGROUND QUESTION SANDWICH SKATEBOARD SNOWFLAKE SPACESHIP STRAWBERRY SUBMARINE SUNFLOWER TELESCOPE THUNDERSTORM TREASURE UMBRELLA UNIVERSE VEGETABLE WATERMELON WONDERFUL'
    ].map(s => s.split(' '));
    let diff = 0, word = '', letters = [], used = [], answer = [], round = 0, ROUNDS = 10, score = 0, time = 0, maxT = 30, streak = 0, hintsUsed = 0, revealed = 0, ready = false, t = 0, feedback = 0, fbCol = '#fff', solved = 0, pool = [];
    function next() {
      if (round >= ROUNDS) { E.gameOver({ score, win: solved >= 7, title: 'Round Complete!', lines: ['Words solved: ' + solved + ' / ' + ROUNDS, 'Difficulty: ' + ['Easy', 'Medium', 'Hard'][diff]] }); ready = false; return; }
      round++; word = pool.pop(); let sc; do { sc = shuffle(word.split('')); } while (sc.join('') === word && word.length > 1);
      letters = sc; used = letters.map(() => false); answer = []; revealed = 0; time = maxT; hintsUsed = 0;
    }
    E.choose('Word Scramble', 'Choose difficulty', [{ label: '🟢 Easy', sub: '5-letter words • 30 s each', value: 0 }, { label: '🟡 Medium', sub: '6-7 letters • 40 s each', value: 1 }, { label: '🔴 Hard', sub: '8+ letters • 50 s each', value: 2 }], d => { diff = d; maxT = [30, 40, 50][d]; pool = shuffle(WORDS[d].slice()); ready = true; next(); });
    function typeLetter(ch) { const i = letters.findIndex((l, k) => l === ch && !used[k]); if (i < 0) { E.sound('tick'); return; } used[i] = true; answer.push(i); E.sound('click'); if (answer.length === word.length) check(); }
    function back() { if (answer.length <= revealed) return; const i = answer.pop(); used[i] = false; E.sound('tick'); }
    function check() {
      const guess = answer.map(i => letters[i]).join('');
      if (guess === word) { streak++; solved++; const pts = Math.round(time * 10) + word.length * 20 + streak * 15 - hintsUsed * 40; score += Math.max(10, pts); E.sound('win'); feedback = 1; fbCol = '#4ade80'; fx.burst(E.W / 2, E.H * 0.4, 40, { col: ['#fde047', '#4ade80', '#fff'], spd: 320, shape: 'star' }); fx.text(E.W / 2, E.H * 0.3, '+' + Math.max(10, pts) + (streak > 1 ? '  🔥x' + streak : ''), '#fde047', 32); setTimeout(() => { if (ready) next(); }, 700); }
      else { E.sound('error'); feedback = 1; fbCol = '#f87171'; E.shake(6); while (answer.length > revealed) used[answer.pop()] = false; }
    }
    function hint() {
      if (!ready || revealed >= word.length - 1) return;
      while (answer.length > revealed) used[answer.pop()] = false;
      const ch = word[revealed], i = letters.findIndex((l, k) => l === ch && !used[k]); used[i] = true; answer.push(i); revealed++; hintsUsed++; E.sound('power');
    }
    function skip() { if (!ready) return; streak = 0; fx.text(E.W / 2, E.H * 0.3, word, '#f87171', 30); E.sound('bad'); next(); }
    return {
      typing: true,
      update(dt) { t += dt; fx.update(dt); feedback = Math.max(0, feedback - dt * 2); if (!ready) return; time -= dt; if (time <= 0) { streak = 0; fx.text(E.W / 2, E.H * 0.3, "TIME! It was " + word, '#f87171', 28); E.sound('bad'); next(); } },
      draw() {
        const W = E.W, H = E.H; ui.clear();
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, ['#4a0e2e', '#7a1f4a', '#b33a3a']); ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.07; for (let i = 0; i < 30; i++) txt(ctx, String.fromCharCode(65 + (i * 7) % 26), (i * 137) % W, (i * 89 + t * 15) % H, 40 + (i % 3) * 20, '#fff', 'center', 900); ctx.globalAlpha = 1;
        if (!ready || !word) return;
        const n = word.length, ts = Math.min(64, (W - 40) / n - 8);
        label(ctx, 'WORD ' + round + ' / ' + ROUNDS + '   •   SCORE ' + fmt(score), W / 2, 34, 18, '#fde68a');
        // timer bar
        const bw = Math.min(500, W - 40); rr(ctx, W / 2 - bw / 2, 56, bw, 12, 6); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, 56, bw * time / maxT, 12, 6); ctx.fillStyle = time < 8 ? '#f87171' : '#4ade80'; ctx.fill();
        // answer slots
        const ay = H * 0.3, ax = W / 2 - (n * (ts + 8)) / 2;
        for (let k = 0; k < n; k++) { const x = ax + k * (ts + 8); rr(ctx, x, ay, ts, ts * 1.1, 10); ctx.fillStyle = feedback > 0 ? fbCol : 'rgba(255,255,255,.12)'; ctx.globalAlpha = feedback > 0 ? 0.4 + feedback * 0.6 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); if (answer[k] !== undefined) txt(ctx, letters[answer[k]], x + ts / 2, ay + ts * 0.58, ts * 0.6, k < revealed ? '#fde047' : '#fff', 'center', 900); }
        // letter tiles
        const ly = H * 0.52;
        letters.forEach((l, k) => { const x = ax + k * (ts + 8), bob = Math.sin(t * 3 + k) * 3; if (used[k]) { rr(ctx, x, ly, ts, ts * 1.1, 10); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); return; } ui.btn(ctx, 'L' + k, x, ly + bob, ts, ts * 1.1, l, { cols: ['#fef3c7', '#fbbf24'], color: '#7c2d12', size: ts * 0.55 }); });
        const by = H * 0.52 + ts * 1.1 + 30, bw2 = Math.min(130, (W - 60) / 4);
        [['back', '⌫ Undo'], ['shuf', '🔀 Shuffle'], ['hint', '💡 Hint'], ['skip', '⏭ Skip']].forEach(([id, l], k) => ui.btn(ctx, id, W / 2 - (bw2 * 4 + 30) / 2 + k * (bw2 + 10), by, bw2, 46, l, { cols: id === 'hint' ? ['#22c55e', '#15803d'] : id === 'skip' ? ['#64748b', '#475569'] : ['#a855f7', '#7e22ce'], size: 15 }));
        if (streak > 1) label(ctx, '🔥 STREAK x' + streak, W / 2, H * 0.22, 22, '#fdba74');
        fx.draw(ctx);
      },
      down(x, y) { const b = ui.hit(x, y); if (!b || !ready) return; if (b[0] === 'L') { const k = +b.slice(1); if (!used[k]) { used[k] = true; answer.push(k); E.sound('click'); if (answer.length === word.length) check(); } } else if (b === 'back') back(); else if (b === 'shuf') { const keep = answer.map(i => letters[i]); const free = letters.filter((l, k) => !used[k]); shuffle(free); letters = keep.concat(free); used = letters.map((l, k) => k < keep.length); answer = keep.map((l, k) => k); E.sound('swish'); } else if (b === 'hint') hint(); else if (b === 'skip') skip(); },
      onKey(c, key) { if (!ready) return; if (c === 'Backspace') back(); else if (c === 'Enter') { if (answer.length === word.length) check(); } else if (key && /^[a-z]$/i.test(key)) typeLetter(key.toUpperCase()); },
      hud() { return null; }
    };
  }
});
