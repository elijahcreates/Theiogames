/* =====================================================================
   CREATURE EVOLUTION
   ===================================================================== */
registerGame({
  id: 'evolution', title: 'Creature Evolution', emoji: '🦎', c1: '#11998e', c2: '#38ef7d', cats: ['Creative', 'IO Arena', 'Arcade'], isNew: true, input: 'joy',
  desc: 'Start as a tiny blob in a tide pool. Eat, grow and choose your evolution path through jungle and sky islands – 11 forms, from Spikefish to Sky Dragon!',
  controls: 'WASD / mouse / joystick • Space dash', scoreLabel: 'EVOLUTION SCORE',
  hint: 'Move with WASD / mouse. Eat food and smaller creatures (green outline), avoid bigger ones (red). SPACE dashes. Fill the DNA bar to evolve!', hintTouch: 'Drag to move • eat smaller creatures (green), avoid bigger ones (red) • ⚡ to dash • fill DNA to evolve!', boost: '⚡ DASH',
  create(E) {
    const ctx = E.ctx, fx = Fx(), MAP = 2600;
    const FORMS = {
      blob: { n: 'Blob', st: 0, col: '#4ade80', fins: 0, legs: 0, wings: 0, spikes: 0, sp: 190, size: 16, next: ['swimmer', 'crawler'], env: 0 },
      swimmer: { n: 'Swiftfin', st: 1, col: '#22d3ee', fins: 2, tail: 1, sp: 250, size: 22, next: ['spikefish', 'shellback'], env: 0, ab: 'speed' },
      crawler: { n: 'Pincher', st: 1, col: '#f97316', legs: 6, claws: 1, sp: 200, size: 24, next: ['shellback', 'spikefish'], env: 0, ab: 'bite' },
      spikefish: { n: 'Spikefish', st: 2, col: '#a855f7', fins: 2, tail: 1, spikes: 8, sp: 240, size: 30, next: ['froglet', 'raptor'], env: 1, ab: 'thorns' },
      shellback: { n: 'Shellback', st: 2, col: '#84cc16', legs: 4, shell: 1, sp: 190, size: 33, next: ['froglet', 'beast'], env: 1, ab: 'armor' },
      froglet: { n: 'Leapfrog', st: 3, col: '#16a34a', legs: 4, sp: 260, size: 38, next: ['raptor', 'skyglider'], env: 1, ab: 'speed' },
      raptor: { n: 'Razor Raptor', st: 3, col: '#dc2626', legs: 2, tail: 1, spikes: 4, sp: 280, size: 42, next: ['skyglider', 'dragon'], env: 1, ab: 'bite' },
      beast: { n: 'Mossback Beast', st: 3, col: '#78350f', legs: 4, horns: 1, shell: 1, sp: 210, size: 48, next: ['titan', 'dragon'], env: 2, ab: 'armor' },
      skyglider: { n: 'Sky Glider', st: 4, col: '#38bdf8', wings: 2, tail: 1, sp: 300, size: 50, next: ['dragon', 'titan'], env: 2, ab: 'speed' },
      dragon: { n: 'Sky Dragon', st: 5, col: '#f59e0b', wings: 2, legs: 4, tail: 1, horns: 1, spikes: 6, sp: 290, size: 62, next: [], env: 2, ab: 'bite' },
      titan: { n: 'Storm Titan', st: 5, col: '#6366f1', legs: 4, horns: 1, shell: 1, spikes: 10, sp: 230, size: 70, next: [], env: 2, ab: 'armor' }
    };
    const ENVS = [{ n: '🌊 Tide Pool', bg: ['#0e7490', '#155e75'], food: ['#86efac', '#fde047'] }, { n: '🌴 Jungle', bg: ['#166534', '#14532d'], food: ['#ef4444', '#f97316'] }, { n: '☁️ Sky Islands', bg: ['#7dd3fc', '#c4b5fd'], food: ['#f472b6', '#fde047'] }];
    const seen = E.data('seen', {});
    const P = { x: MAP / 2, y: MAP / 2, vx: 0, vy: 0, form: 'blob', hp: 100, dna: 0, size: 16, dash: 0, dcd: 0, inv: 2, face: 0 };
    let env = 0, food = [], crits = [], t = 0, score = 0, choosing = false, msg = '', msgT = 0, dead = false;
    seen.blob = 1;
    const F = () => FORMS[P.form];
    const need = () => 30 + F().st * 45;
    function spawnFood() { food.push({ x: rand(40, MAP - 40), y: rand(40, MAP - 40), v: Math.random() < 0.08 ? 4 : 1, ph: rand(0, TAU) }); }
    function spawnCrit(big) {
      const st = clamp(F().st + (big ? irand(0, 2) : irand(-2, 1)), 0, 5), pool = Object.keys(FORMS).filter(k => FORMS[k].st === st), k = pick(pool), f = FORMS[k];
      let x, y; do { x = rand(60, MAP - 60); y = rand(60, MAP - 60); } while (dist(x, y, P.x, P.y) < 500);
      crits.push({ x, y, vx: 0, vy: 0, form: k, size: f.size * rand(0.8, 1.2), a: rand(0, TAU), t: 0, hp: 1 });
    }
    function reset() { food = []; crits = []; for (let i = 0; i < 260; i++) spawnFood(); for (let i = 0; i < 24; i++) spawnCrit(i % 3 === 0); }
    reset();
    function evolve(k) {
      P.form = k; P.size = FORMS[k].size; P.dna = 0; P.hp = 100; P.inv = 2; choosing = false; seen[k] = 1; E.save('seen', seen); E.sound('rare'); score += 1000;
      fx.burst(P.x, P.y, 60, { col: [FORMS[k].col, '#fff', '#fde047'], spd: 380, shape: 'star', size: 7 });
      const ne = FORMS[k].env; if (ne !== env) { env = ne; msg = 'NEW HABITAT: ' + ENVS[env].n; reset(); } else msg = 'EVOLVED INTO ' + FORMS[k].n.toUpperCase() + '!'; msgT = 2.5;
      if (!FORMS[k].next.length) { msg = '👑 APEX FORM: ' + FORMS[k].n + '!'; }
    }
    function offerEvolution() {
      const opts = F().next; if (!opts.length) { P.dna = need(); return; }
      choosing = true; E.choose('🧬 Time to Evolve!', 'Choose your next form', opts.map(k => ({ label: FORMS[k].n, sub: { speed: '⚡ Fast & agile', bite: '🦷 Powerful bite', thorns: '🌵 Hurts attackers', armor: '🛡️ Tough armor' }[FORMS[k].ab] + ' • ' + ENVS[FORMS[k].env].n, value: k })), k => evolve(k));
    }
    function drawCreature(x, y, k, s, a, tt, rel) {
      const f = FORMS[k]; ctx.save(); ctx.translate(x, y); ctx.rotate(a); const sc2 = s / 19; ctx.scale(sc2, sc2);
      if (rel) { ctx.strokeStyle = rel > 0 ? 'rgba(74,222,128,.8)' : 'rgba(248,113,113,.9)'; ctx.lineWidth = 3 / sc2; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.stroke(); }
      const O = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.strokeStyle = O;
      if (f.wings) for (const sd of [-1, 1]) { const fl = Math.sin(tt * 8) * 0.4; ctx.save(); ctx.rotate(sd * (1.4 + fl)); ctx.fillStyle = hsl(200, 70, 80, 0.85); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, sd * 4, 34, 0); ctx.quadraticCurveTo(20, sd * -10, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (f.legs) for (let i = 0; i < f.legs; i++) { const sd = i % 2 ? 1 : -1, row = Math.floor(i / 2), sw = Math.sin(tt * 12 + i) * 0.4; ctx.strokeStyle = f.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8 - row * 10, 0); ctx.lineTo(8 - row * 10 + sw * 8, sd * 22); ctx.stroke(); }
      if (f.tail) { ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-34, Math.sin(tt * 8) * 10, -42, Math.sin(tt * 8) * 14); ctx.quadraticCurveTo(-30, 0, -14, 6); ctx.fill(); }
      if (f.fins) for (const sd of [-1, 1]) { ctx.fillStyle = hsl(190, 80, 70); ctx.beginPath(); ctx.moveTo(4, sd * 10); ctx.lineTo(-6, sd * (22 + Math.sin(tt * 10) * 3)); ctx.lineTo(-10, sd * 10); ctx.fill(); }
      if (f.spikes) for (let i = 0; i < f.spikes; i++) { const an = i / f.spikes * TAU; ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(Math.cos(an - 0.15) * 16, Math.sin(an - 0.15) * 14); ctx.lineTo(Math.cos(an) * 27, Math.sin(an) * 24); ctx.lineTo(Math.cos(an + 0.15) * 16, Math.sin(an + 0.15) * 14); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(0, 0, k === 'blob' ? 18 + Math.sin(tt * 5) * 1.5 : 20, k === 'blob' ? 17 - Math.sin(tt * 5) * 1.5 : 15, 0, 0, TAU); ctx.fillStyle = rgrad(ctx, -6, -6, 2, 24, ['#fff', f.col, f.col]); ctx.fill(); ctx.stroke();
      if (f.shell) { ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 8 - 2, 0, 6, 0, TAU); ctx.fill(); } }
      if (f.claws) for (const sd of [-1, 1]) { ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(24, sd * 12, 7, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (f.horns) for (const sd of [-1, 1]) { ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.moveTo(12, sd * 6); ctx.lineTo(28, sd * 16); ctx.lineTo(14, sd * 2); ctx.fill(); }
      for (const sd of [-1, 1]) { circle(ctx, 10, sd * 6, 4.5, '#fff'); circle(ctx, 12, sd * 6, 2.3, '#111'); }
      ctx.restore();
    }
    const api = {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (dead || choosing) return;
        const f = F(); P.inv = Math.max(0, P.inv - dt); P.dcd = Math.max(0, P.dcd - dt); P.dash = Math.max(0, P.dash - dt);
        if (E.boost() && P.dcd <= 0) { P.dash = 0.25; P.dcd = 2.5; E.sound('whoosh'); }
        const d = E.dir(), sp = f.sp * (P.dash > 0 ? 2.6 : 1);
        P.vx += (d.x * d.mag * sp - P.vx) * Math.min(1, dt * 6); P.vy += (d.y * d.mag * sp - P.vy) * Math.min(1, dt * 6);
        P.x = clamp(P.x + P.vx * dt, 20, MAP - 20); P.y = clamp(P.y + P.vy * dt, 20, MAP - 20); if (d.mag > 0.1) P.face = Math.atan2(d.y, d.x);
        for (let i = food.length - 1; i >= 0; i--) { const o = food[i]; if (Math.abs(o.x - P.x) < P.size + 10 && Math.abs(o.y - P.y) < P.size + 10) { food.splice(i, 1); P.dna += o.v; score += 10 * o.v; P.hp = Math.min(100, P.hp + 2); E.sound('eat', 40); if (o.v > 1) fx.text(o.x, o.y - 20, '+DNA', '#fde047', 18); } }
        while (food.length < 260) spawnFood();
        for (let i = crits.length - 1; i >= 0; i--) {
          const c = crits[i], cf = FORMS[c.form]; c.t -= dt;
          const dd = dist(c.x, c.y, P.x, P.y), bigger = c.size > P.size * 1.1;
          if (dd < 360 && bigger) { const a = Math.atan2(P.y - c.y, P.x - c.x); c.vx += (Math.cos(a) * cf.sp * 0.75 - c.vx) * dt * 2; c.vy += (Math.sin(a) * cf.sp * 0.75 - c.vy) * dt * 2; }
          else if (dd < 280 && c.size < P.size * 0.9) { const a = Math.atan2(c.y - P.y, c.x - P.x); c.vx += (Math.cos(a) * cf.sp * 0.7 - c.vx) * dt * 2; c.vy += (Math.sin(a) * cf.sp * 0.7 - c.vy) * dt * 2; }
          else { if (c.t <= 0) { c.t = rand(1, 3); c.a = rand(0, TAU); } c.vx += (Math.cos(c.a) * cf.sp * 0.35 - c.vx) * dt; c.vy += (Math.sin(c.a) * cf.sp * 0.35 - c.vy) * dt; }
          c.x = clamp(c.x + c.vx * dt, 20, MAP - 20); c.y = clamp(c.y + c.vy * dt, 20, MAP - 20);
          if (dd < (c.size + P.size) * 0.8) {
            if (c.size < P.size * 0.9) { crits.splice(i, 1); P.dna += Math.ceil(c.size / 6) + 2; score += Math.round(c.size * 10); P.hp = Math.min(100, P.hp + 10); E.sound('swallow'); fx.burst(c.x, c.y, 18, { col: [cf.col, '#fff'], spd: 200 }); setTimeout(() => { if (E.g === api) spawnCrit(Math.random() < 0.4); }, 1500); continue; }
            if (bigger && P.inv <= 0) { const dmg = (f.ab === 'armor' ? 14 : 24) * (c.size / P.size); P.hp -= dmg; P.inv = 1; E.sound('hit'); E.shake(8); const a = Math.atan2(P.y - c.y, P.x - c.x); P.vx += Math.cos(a) * 500; P.vy += Math.sin(a) * 500; if (f.ab === 'thorns') { c.size *= 0.85; fx.text(c.x, c.y, 'OUCH!', '#a855f7', 18); } if (P.hp <= 0) { dead = true; E.gameOver({ score, title: 'Eaten by a ' + cf.n + '!', lines: ['Final form: ' + f.n, 'Forms discovered: ' + Object.keys(seen).length + ' / 11'] }); return; } }
          }
        }
        if (P.dna >= need() && !choosing) { if (F().next.length) offerEvolution(); else { P.dna = 0; score += 500; P.size = Math.min(110, P.size + 4); fx.text(P.x, P.y - 60, 'APEX GROWTH!', '#fde047', 24); } }
        E.follow(P.x, P.y, clamp(1.1 - P.size / 160, 0.55, 1.05) * Math.min(1.15, Math.min(E.W, E.H) / 700), dt);
      },
      draw() {
        const W = E.W, H = E.H, en = ENVS[env];
        ctx.fillStyle = en.bg[1]; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(80);
        ctx.fillStyle = lgrad(ctx, 0, 0, MAP, MAP, en.bg); ctx.fillRect(0, 0, MAP, MAP);
        for (let i = 0; i < 70; i++) { const x = (i * 397) % MAP, y = (i * 613) % MAP; if (x < v.x0 - 100 || x > v.x1 + 100 || y < v.y0 - 100 || y > v.y1 + 100) continue; ctx.globalAlpha = 0.35;
          if (env === 0) { circle(ctx, x, y, 30 + (i % 4) * 12, 'rgba(255,255,255,.12)'); ctx.strokeStyle = '#86efac'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 1; k < 5; k++) ctx.lineTo(x + Math.sin(t + k + i) * 10, y - k * 18); ctx.stroke(); }
          else if (env === 1) { circle(ctx, x, y, 50 + (i % 3) * 20, '#15803d'); circle(ctx, x + 20, y - 10, 30, '#22c55e'); }
          else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 40, 0, TAU); ctx.arc(x + 40, y - 10, 50, 0, TAU); ctx.arc(x + 85, y, 36, 0, TAU); ctx.fill(); }
          ctx.globalAlpha = 1; }
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, MAP, MAP);
        for (const o of food) { if (o.x < v.x0 || o.x > v.x1 || o.y < v.y0 || o.y > v.y1) continue; const r = o.v > 1 ? 9 : 6, b = 1 + Math.sin(t * 4 + o.ph) * 0.15; if (o.v > 1) { ctx.drawImage(E.glow(50), o.x - 22, o.y - 22, 44, 44); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(t); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.fill(); ctx.restore(); } else circle(ctx, o.x, o.y, r * b, en.food[Math.floor(o.ph * 10) % 2]); }
        for (const c of crits) { if (c.x < v.x0 - 80 || c.x > v.x1 + 80 || c.y < v.y0 - 80 || c.y > v.y1 + 80) continue; const rel = c.size < P.size * 0.9 ? 1 : c.size > P.size * 1.1 ? -1 : 0; drawCreature(c.x, c.y, c.form, c.size, Math.atan2(c.vy, c.vx), t + c.x, rel); }
        if (!dead) { if (!(P.inv > 0 && Math.floor(t * 12) % 2)) drawCreature(P.x, P.y, P.form, P.size, P.face, t, 0); if (P.dash > 0) fx.burst(P.x, P.y, 2, { col: '#fff', spd: 60, life: 0.3 }); }
        fx.draw(ctx);
        E.endWorld();
        const bw = Math.min(360, W * 0.6); rr(ctx, W / 2 - bw / 2, 16, bw, 18, 9); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, 16, bw * clamp(P.dna / need(), 0, 1), 18, 9); ctx.fillStyle = lgrad(ctx, W / 2 - bw / 2, 0, W / 2 + bw / 2, 0, ['#22d3ee', '#a855f7', '#f472b6']); ctx.fill();
        label(ctx, '🧬 DNA → ' + (F().next.length ? 'EVOLVE' : 'APEX'), W / 2, 25, 12, '#fff');
        label(ctx, F().n + ' • ' + ENVS[env].n, W / 2, 52, 16, '#fff');
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.3, 28, '#fde047');
      },
      hud() { return { stats: [['HP', Math.max(0, Math.ceil(P.hp))], ['Score', fmt(score)], ['Forms', Object.keys(seen).length + '/11']] }; }
    };
    return api;
  }
});
