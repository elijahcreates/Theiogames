/* =====================================================================
   MINI GOLF  (9 holes, 1P + local 2P)
   ===================================================================== */
registerGame({
  id: 'minigolf', title: 'Mini Golf', emoji: '⛳', c1: '#134e5e', c2: '#71b280', cats: ['Sports', 'Physics', 'Multiplayer'], twoP: true, pop: true,
  desc: '9 creative holes with windmills, slopes, tunnels, water hazards, sand traps and moving blocks. Fewest strokes wins!',
  controls: 'Drag & release • arrows + Space', scoreLabel: 'STROKES', lowerBetter: true,
  hint: 'Pull back anywhere and release to putt (or ←/→ aim, ↑/↓ power, SPACE putt). Fewest strokes wins!', hintTouch: 'Pull back anywhere and release to putt. Fewest strokes wins!',
  hint2: 'Players alternate holes on the same course. P1: A/D aim, W/S power, SPACE • P2: ←/→, ↑/↓, ENTER – or drag.', hint2Touch: 'Take turns putting – pull back and release. Fewest total strokes wins!',
  p2info: 'Each hole: Player 1 putts out, then Player 2. Lowest total after 9 holes wins.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 1000, VH = 640, BR = 8, HR = 14, two = E.mode === 2;
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const HOLES = [
      { par: 2, th: 0, start: [180, 320], hole: [830, 320], bound: rect(110, 210, 790, 220), blocks: [rect(470, 270, 50, 100)] },
      { par: 3, th: 1, start: [170, 165], hole: [840, 505], bound: [[110, 110], [520, 110], [520, 440], [900, 440], [900, 570], [400, 570], [400, 230], [110, 230]], blocks: [], zones: [{ t: 'sand', x: 640, y: 450, w: 110, h: 60 }] },
      { par: 3, th: 2, start: [170, 320], hole: [840, 320], bound: rect(110, 170, 790, 300), blocks: [rect(480, 170, 40, 95), rect(480, 375, 40, 95)], mills: [{ x: 500, y: 320, len: 105, sp: 1.6 }] },
      { par: 3, th: 3, start: [170, 520], hole: [830, 150], bound: rect(110, 100, 790, 470), blocks: [[[300, 330], [700, 330], [700, 350], [300, 350]]], zones: [{ t: 'slope', x: 110, y: 100, w: 190, h: 470, fx: 0, fy: -1 }, { t: 'slope', x: 700, y: 100, w: 200, h: 250, fx: -0.6, fy: 0 }] },
      { par: 3, th: 4, start: [160, 320], hole: [850, 320], bound: rect(110, 140, 790, 360), blocks: [], zones: [{ t: 'water', x: 380, y: 230, w: 240, h: 180 }, { t: 'sand', x: 720, y: 260, w: 70, h: 120 }] },
      { par: 2, th: 5, start: [180, 320], hole: [820, 320], bound: rect(110, 150, 790, 340), blocks: [rect(480, 150, 40, 340)], tunnels: [[[400, 230], [600, 410]]] },
      { par: 3, th: 6, start: [160, 320], hole: [850, 320], bound: rect(110, 200, 790, 240), blocks: [], movers: [{ r: [330, 210, 40, 80], ay: 140, sp: 1.3 }, { r: [500, 350, 40, 80], ay: -140, sp: 1.7 }, { r: [670, 210, 40, 80], ay: 140, sp: 2.1 }] },
      { par: 3, th: 7, start: [170, 520], hole: [830, 130], bound: rect(110, 80, 790, 500), blocks: [], posts: [[300, 400], [380, 300], [460, 420], [540, 260], [620, 380], [700, 220], [300, 200], [760, 340], [420, 160]] },
      { par: 4, th: 8, start: [160, 540], hole: [500, 150], bound: rect(110, 90, 790, 500), blocks: [rect(300, 260, 400, 30)], zones: [{ t: 'water', x: 380, y: 400, w: 240, h: 100 }, { t: 'slope', x: 700, y: 290, w: 200, h: 300, fx: 0, fy: -0.8 }], mills: [{ x: 800, y: 200, len: 85, sp: -2 }] }
    ];
    const THEMES = [['#14532d', '#166534', '#a16207'], ['#713f12', '#854d0e', '#78350f'], ['#1e3a8a', '#1d4ed8', '#334155'], ['#365314', '#3f6212', '#57534e'], ['#0c4a6e', '#075985', '#7c2d12'], ['#4c1d95', '#5b21b6', '#1f2937'], ['#7f1d1d', '#991b1b', '#44403c'], ['#134e4a', '#115e59', '#713f12'], ['#1e1b4b', '#312e81', '#0f172a']];
    let hi = 0, player = 0, strokes = [Array(9).fill(0), Array(9).fill(0)], ball, last, aim = null, kAng = 0, kPow = 0.5, t = 0, msg = '', msgT = 0, wait = 0, view, segs = [], sunk = false;
    function segsFor(h) {
      const s = []; const poly = p => { for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s.push([a[0], a[1], b[0], b[1]]); } };
      poly(h.bound); (h.blocks || []).forEach(poly); return s;
    }
    function startHole() { const h = HOLES[hi]; segs = segsFor(h); ball = { x: h.start[0], y: h.start[1], vx: 0, vy: 0, moving: false, z: 1 }; last = { x: ball.x, y: ball.y }; sunk = false; kAng = Math.atan2(h.hole[1] - h.start[1], h.hole[0] - h.start[0]); msg = (two ? 'PLAYER ' + (player + 1) + ' • ' : '') + 'HOLE ' + (hi + 1) + ' • PAR ' + h.par; msgT = 2; }
    startHole();
    function putt(vx, vy) { if (ball.moving || wait > 0 || sunk) return; last = { x: ball.x, y: ball.y }; ball.vx = vx; ball.vy = vy; ball.moving = true; strokes[player][hi]++; E.sound('hit'); }
    function puttK() { const p = 120 + kPow * 900; putt(Math.cos(kAng) * p, Math.sin(kAng) * p); }
    function collideSeg(sg, vxb, vyb) {
      const r = segDist(ball.x, ball.y, sg[0], sg[1], sg[2], sg[3]);
      if (r.d < BR) {
        let nx = ball.x - r.x, ny = ball.y - r.y; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
        ball.x = r.x + nx * BR; ball.y = r.y + ny * BR;
        const rvx = ball.vx - (vxb || 0), rvy = ball.vy - (vyb || 0), vn = rvx * nx + rvy * ny;
        if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; if (Math.abs(vn) > 60) E.sound('bounce', 60); }
        ball.vx += (vxb || 0) * 0.5; ball.vy += (vyb || 0) * 0.5;
      }
    }
    function inZone(z) { return ball.x > z.x && ball.x < z.x + z.w && ball.y > z.y && ball.y < z.y + z.h; }
    function finishHole() {
      const h = HOLES[hi], n = strokes[player][hi];
      if (n === 1) { E.ach('hio'); msg = 'HOLE IN ONE!!!'; E.sound('cheer'); fx.burst(h.hole[0], h.hole[1], 60, { col: ['#fde047', '#f472b6', '#22d3ee', '#fff'], spd: 400, shape: 'star', size: 8 }); }
      else { const d = n - h.par; msg = d <= -2 ? 'EAGLE!' : d === -1 ? 'BIRDIE!' : d === 0 ? 'PAR' : d === 1 ? 'BOGEY' : '+' + d; E.sound(d <= 0 ? 'win' : 'score'); }
      msgT = 2; wait = 2;
    }
    function advance() {
      if (two && player === 0) { player = 1; startHole(); return; }
      player = 0; hi++;
      if (hi >= HOLES.length) {
        const a = strokes[0].reduce((x, y) => x + y, 0), b = strokes[1].reduce((x, y) => x + y, 0), par = HOLES.reduce((x, h) => x + h.par, 0);
        if (two) { const w = a === b ? 0 : a < b ? 1 : 2; E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: w ? 'PLAYER ' + w + ' WINS' : 'TIE GAME', label: 'RESULT', title: '⛳ Round Complete', lines: ['Player 1: ' + a + ' strokes', 'Player 2: ' + b + ' strokes', 'Course par: ' + par] }); }
        else E.gameOver({ score: a, win: a <= par, title: 'Round Complete', label: 'TOTAL STROKES', lines: ['Course par: ' + par, (a - par > 0 ? '+' : '') + (a - par) + ' vs par', 'Card: ' + strokes[0].join(' ')] });
        return;
      }
      startHole();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        const h = HOLES[hi];
        if (wait > 0) { wait -= dt; ball.z = Math.max(0, ball.z - dt * 3); if (wait <= 0) advance(); return; }
        // keyboard aim
        const p1 = !two || player === 0, p2 = !two || player === 1, K = E.key;
        if (!ball.moving) {
          if ((p1 && K('KeyA')) || (p2 && K('ArrowLeft'))) kAng -= dt * 2; if ((p1 && K('KeyD')) || (p2 && K('ArrowRight'))) kAng += dt * 2;
          if ((p1 && K('KeyW')) || (p2 && K('ArrowUp'))) kPow = Math.min(1, kPow + dt * 0.6); if ((p1 && K('KeyS')) || (p2 && K('ArrowDown'))) kPow = Math.max(0, kPow - dt * 0.6);
        }
        // movers / mills (move even when ball idle)
        const dynSegs = [];
        for (const m of h.movers || []) { const oy = Math.sin(t * m.sp) * m.ay * 0.5 + m.ay * 0.5, vy = Math.cos(t * m.sp) * m.ay * 0.5 * m.sp; const [x, y, w, hh] = m.r; m.cur = [x, y + oy, w, hh]; const p = rect(x, y + oy, w, hh); for (let i = 0; i < 4; i++) dynSegs.push([p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0, vy]); }
        for (const ml of h.mills || []) { ml.a = (ml.a || 0) + ml.sp * dt; for (let k = 0; k < 4; k++) { const a = ml.a + k * Math.PI / 2; dynSegs.push([ml.x, ml.y, ml.x + Math.cos(a) * ml.len, ml.y + Math.sin(a) * ml.len, -Math.sin(a) * ml.sp * ml.len * 0.6, Math.cos(a) * ml.sp * ml.len * 0.6]); } }
        if (!ball.moving) { for (const s of dynSegs) collideSeg(s, 0, 0); return; }
        const steps = 6;
        for (let k = 0; k < steps; k++) {
          const st = dt / steps; let fr = 230;
          for (const z of h.zones || []) if (inZone(z)) { if (z.t === 'sand') fr = 900; else if (z.t === 'slope') { ball.vx += z.fx * 260 * st; ball.vy += z.fy * 260 * st; } else if (z.t === 'water') { E.sound('splash'); fx.burst(ball.x, ball.y, 20, { col: ['#bae6fd', '#fff'], spd: 150 }); strokes[player][hi]++; ball.x = last.x; ball.y = last.y; ball.vx = ball.vy = 0; ball.moving = false; msg = 'SPLASH! +1 stroke'; msgT = 1.5; return; } }
          const sp = Math.hypot(ball.vx, ball.vy);
          if (sp > 0) { const ns = Math.max(0, sp - fr * st); ball.vx *= ns / sp; ball.vy *= ns / sp; }
          ball.x += ball.vx * st; ball.y += ball.vy * st;
          for (const s of segs) collideSeg(s);
          for (const s of dynSegs) collideSeg(s, s[4], s[5]);
          for (const p of h.posts || []) { const dx = ball.x - p[0], dy = ball.y - p[1], d = Math.hypot(dx, dy); if (d < BR + 12) { const nx = dx / d, ny = dy / d; ball.x = p[0] + nx * (BR + 12); ball.y = p[1] + ny * (BR + 12); const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; E.sound('bounce', 60); } } }
          for (const tn of h.tunnels || []) { const [a, b] = tn; if (dist(ball.x, ball.y, a[0], a[1]) < 16 && !ball.tun) { ball.x = b[0]; ball.y = b[1]; ball.tun = 0.5; E.sound('whoosh'); fx.burst(b[0], b[1], 14, { col: '#c084fc', spd: 140 }); } }
          // hole
          const hd = dist(ball.x, ball.y, h.hole[0], h.hole[1]), spd = Math.hypot(ball.vx, ball.vy);
          if (hd < HR) { if (spd < 420) { ball.x = h.hole[0]; ball.y = h.hole[1]; ball.moving = false; sunk = true; E.sound('ding'); finishHole(); return; } else { ball.vx += (h.hole[0] - ball.x) * 4; ball.vy += (h.hole[1] - ball.y) * 4; } }
        }
        if (ball.tun) { ball.tun -= dt; if (ball.tun <= 0) ball.tun = 0; }
        if (Math.hypot(ball.vx, ball.vy) < 6) { ball.vx = ball.vy = 0; ball.moving = false; if (strokes[player][hi] >= 8) { msg = 'Max strokes – picked up'; msgT = 1.5; wait = 1.5; sunk = true; } }
      },
      draw() {
        const h = HOLES[hi], th = THEMES[h.th];
        view = E.fit(VW, VH); ctx.fillStyle = th[0]; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        ctx.fillStyle = th[0]; ctx.fillRect(-500, -500, VW + 1000, VH + 1000);
        // decorations outside
        const r = rng(hi * 31 + 5);
        for (let i = 0; i < 40; i++) { const x = r() * VW, y = r() * VH; ctx.globalAlpha = 0.5; circle(ctx, x, y, 8 + r() * 22, th[1]); ctx.globalAlpha = 1; if (r() < 0.3) { circle(ctx, x, y, 3, hsl(r() * 360, 80, 70)); } }
        // course fill
        const poly = p => { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
        shadowOn(ctx, 'rgba(0,0,0,.45)', 22, 0, 10); poly(h.bound); ctx.fillStyle = '#4ade80'; ctx.fill(); shadowOff(ctx);
        ctx.save(); poly(h.bound); ctx.clip(); for (let x = 0; x < VW; x += 40) { ctx.fillStyle = (x / 40) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'; ctx.fillRect(x, 0, 40, VH); }
        for (const z of h.zones || []) {
          if (z.t === 'sand') { rr(ctx, z.x, z.y, z.w, z.h, 24); ctx.fillStyle = '#fde68a'; ctx.fill(); for (let i = 0; i < 20; i++) circle(ctx, z.x + (i * 37) % z.w, z.y + (i * 23) % z.h, 1.5, '#d97706'); }
          else if (z.t === 'water') { rr(ctx, z.x, z.y, z.w, z.h, 30); ctx.fillStyle = lgrad(ctx, 0, z.y, 0, z.y + z.h, ['#38bdf8', '#0369a1']); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); const yy = z.y + 25 + i * (z.h - 40) / 3; for (let x = z.x + 20; x < z.x + z.w - 20; x += 8) ctx.lineTo(x, yy + Math.sin(x * 0.08 + t * 3) * 3); ctx.stroke(); } }
          else if (z.t === 'slope') { ctx.fillStyle = 'rgba(21,128,61,.35)'; ctx.fillRect(z.x, z.y, z.w, z.h); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; const a = Math.atan2(z.fy, z.fx), o = (t * 30) % 50; for (let x = z.x + 25; x < z.x + z.w; x += 50) for (let y = z.y + 25; y < z.y + z.h; y += 50) { const cx = x + Math.cos(a) * (o - 25) * 0.5, cy = y + Math.sin(a) * (o - 25) * 0.5; ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 10 - Math.sin(a) * 8, cy - Math.sin(a) * 10 + Math.cos(a) * 8); ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.lineTo(cx - Math.cos(a) * 10 + Math.sin(a) * 8, cy - Math.sin(a) * 10 - Math.cos(a) * 8); ctx.stroke(); } }
        }
        ctx.restore();
        // walls
        ctx.lineJoin = 'round'; poly(h.bound); ctx.strokeStyle = th[2]; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.stroke();
        for (const b of h.blocks || []) { shadowOn(ctx, 'rgba(0,0,0,.35)', 8, 3, 4); poly(b); ctx.fillStyle = th[2]; ctx.fill(); shadowOff(ctx); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.stroke(); }
        for (const m of h.movers || []) if (m.cur) { shadowOn(ctx, 'rgba(0,0,0,.4)', 10, 3, 5); rr(ctx, m.cur[0], m.cur[1], m.cur[2], m.cur[3], 6); ctx.fillStyle = lgrad(ctx, m.cur[0], 0, m.cur[0] + m.cur[2], 0, ['#f97316', '#ea580c']); ctx.fill(); shadowOff(ctx); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(m.cur[0] + 8, m.cur[1] + m.cur[3] / 2 - 3, m.cur[2] - 16, 6); }
        for (const p of h.posts || []) { shadowOn(ctx, 'rgba(0,0,0,.4)', 8, 2, 4); circle(ctx, p[0], p[1], 12, '#a8a29e'); shadowOff(ctx); circle(ctx, p[0] - 3, p[1] - 3, 5, '#e7e5e4'); }
        for (const tn of h.tunnels || []) { const [a, b] = tn; for (const [p, c] of [[a, '#7c3aed'], [b, '#a855f7']]) { circle(ctx, p[0], p[1], 20, c); circle(ctx, p[0], p[1], 13, '#1e1b4b'); ctx.strokeStyle = '#e9d5ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 17, t * 3, t * 3 + 4); ctx.stroke(); } }
        // hole + flag
        circle(ctx, h.hole[0], h.hole[1], HR + 3, 'rgba(0,0,0,.2)'); circle(ctx, h.hole[0], h.hole[1], HR, '#0a0a0a');
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(h.hole[0] - 1.5, h.hole[1] - 60, 3, 60); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(h.hole[0] + 1.5, h.hole[1] - 60); ctx.lineTo(h.hole[0] + 30 + Math.sin(t * 4) * 3, h.hole[1] - 52); ctx.lineTo(h.hole[0] + 1.5, h.hole[1] - 44); ctx.fill();
        // ball + aim
        if (!ball.moving && !sunk && wait <= 0) {
          let pv = null;
          if (aim) { const dx = aim.sx - aim.x, dy = aim.sy - aim.y, d = Math.hypot(dx, dy); if (d > 6) { const p = Math.min(1, d / 200); pv = { a: Math.atan2(dy, dx), p }; } }
          else if (!E.touch) pv = { a: kAng, p: kPow };
          if (pv) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.setLineDash([8, 7]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(pv.a) * (40 + pv.p * 180), ball.y + Math.sin(pv.a) * (40 + pv.p * 180)); ctx.stroke(); ctx.setLineDash([]); rr(ctx, ball.x - 30, ball.y + 18, 60, 7, 3); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); rr(ctx, ball.x - 30, ball.y + 18, 60 * pv.p, 7, 3); ctx.fillStyle = pv.p > 0.75 ? '#ef4444' : pv.p > 0.4 ? '#facc15' : '#4ade80'; ctx.fill(); }
        }
        if (ball.z > 0.05) { ellipse(ctx, ball.x + 3, ball.y + 4, BR, BR * 0.7, 'rgba(0,0,0,.3)'); circle(ctx, ball.x, ball.y, BR * ball.z, two && player ? '#fda4af' : '#fff'); circle(ctx, ball.x - 2, ball.y - 2, 2.5 * ball.z, 'rgba(255,255,255,.9)'); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR * ball.z, 0, TAU); ctx.stroke(); }
        for (const ml of h.mills || []) { const a = ml.a || 0; ctx.save(); ctx.translate(ml.x, ml.y); for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(a + k * Math.PI / 2); shadowOn(ctx, 'rgba(0,0,0,.4)', 8, 3, 5); ctx.fillStyle = k % 2 ? '#f8fafc' : '#ef4444'; rr(ctx, 0, -7, ml.len, 14, 5); ctx.fill(); shadowOff(ctx); ctx.restore(); } circle(ctx, 0, 0, 16, '#7c2d12'); circle(ctx, 0, 0, 7, '#fde047'); ctx.restore(); }
        fx.draw(ctx);
        // scorecard strip
        rr(ctx, 20, 14, VW - 40, 58, 12); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
        label(ctx, 'HOLE ' + (hi + 1) + '/9  PAR ' + h.par, 120, 43, 18, '#fde047');
        for (let p = 0; p < (two ? 2 : 1); p++) { const tot = strokes[p].reduce((a, b) => a + b, 0); label(ctx, (two ? 'P' + (p + 1) + ': ' : 'Strokes: ') + strokes[p][hi] + '  (total ' + tot + ')', two ? 420 + p * 300 : 560, 43, 18, two ? (p === player ? (p ? '#fda4af' : '#93c5fd') : '#94a3b8') : '#fff'); }
        if (msgT > 0) label(ctx, msg, VW / 2, VH - 40, 32, '#fff');
        E.endWorld();
      },
      down(x, y) { if (!view) return; const p = view.toWorld(x, y); if (!ball.moving && wait <= 0) aim = { sx: p.x, sy: p.y, x: p.x, y: p.y }; },
      move(x, y) { if (!aim || !view) return; const p = view.toWorld(x, y); aim.x = p.x; aim.y = p.y; },
      up() { if (!aim) return; const dx = aim.sx - aim.x, dy = aim.sy - aim.y, d = Math.hypot(dx, dy); aim = null; if (d < 10) return; const pw = Math.min(1, d / 200); kAng = Math.atan2(dy, dx); kPow = pw; putt(Math.cos(kAng) * (120 + pw * 900), Math.sin(kAng) * (120 + pw * 900)); },
      onKey(c) { const p1 = !two || player === 0, p2 = !two || player === 1; if ((p1 && c === 'Space') || (p2 && c === 'Enter') || (!two && c === 'Enter')) puttK(); },
      hud() { return null; }
    };
  }
});
