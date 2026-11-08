/* =====================================================================
   POOL 8-BALL  (vs AI + local 2P)
   ===================================================================== */
registerGame({
  id: 'pool', title: 'Pool 8-Ball', emoji: '🎱', c1: '#0b6623', c2: '#1e3a1e', cats: ['Sports', 'Physics', 'Multiplayer'], twoP: true, pop: true, featured: true,
  desc: 'Classic 8-ball pool with real ball physics: break, claim solids or stripes, avoid fouls and sink the 8 to win. Play the computer or a friend.',
  controls: 'Aim with mouse/drag • power slider', scoreLabel: 'WINS',
  hint: 'Move the mouse to aim, drag the POWER slider (left) and release to shoot – or ←/→ aim, ↑/↓ power, SPACE shoot.', hintTouch: 'Drag on the table to aim, pull the POWER slider down and release to shoot.',
  p1sub: 'You vs the computer', p2sub: 'Two players, one device – take turns',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 1100, VH = 640, R = 11, two = E.mode === 2;
    const L = 110, T = 80, RT = 1030, B = 520, PR = 21;
    const pockets = [[L, T], [(L + RT) / 2, T - 4], [RT, T], [L, B], [(L + RT) / 2, B + 4], [RT, B]];
    const COL = ['#f5f5f4', '#facc15', '#2563eb', '#dc2626', '#7c3aed', '#f97316', '#16a34a', '#7f1d1d', '#111827', '#facc15', '#2563eb', '#dc2626', '#7c3aed', '#f97316', '#16a34a', '#7f1d1d'];
    let balls = [], cur = 0, groups = [null, null], state = 'aim', aimA = Math.PI, power = 0, slider = null, t = 0, msg = '', msgT = 0, view, firstHit = null, potted = [], shotBy = 0, aiT = 0, ended = false, wins = E.best(), guide = true, aiming = false;
    const cushions = [];
    (function () { const g = 26, gm = 20; cushions.push([L + g, T, (L + RT) / 2 - gm, T], [(L + RT) / 2 + gm, T, RT - g, T], [L + g, B, (L + RT) / 2 - gm, B], [(L + RT) / 2 + gm, B, RT - g, B], [L, T + g, L, B - g], [RT, T + g, RT, B - g]); })();
    function rack() {
      balls = []; balls.push({ n: 0, x: L + (RT - L) * 0.25, y: (T + B) / 2, vx: 0, vy: 0, in: false });
      const fx0 = L + (RT - L) * 0.72, cy = (T + B) / 2, sol = shuffle([1, 2, 3, 4, 5, 6, 7]), str = shuffle([9, 10, 11, 12, 13, 14, 15]);
      const c1 = sol.pop(), c2 = str.pop(), rest = shuffle(sol.concat(str));
      for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) {
        const n = row === 2 && i === 1 ? 8 : row === 4 && i === 0 ? c1 : row === 4 && i === 4 ? c2 : rest.pop();
        balls.push({ n, x: fx0 + row * R * 1.75, y: cy + (i - row / 2) * R * 2.02, vx: 0, vy: 0, in: false });
      }
    }
    rack();
    const cue = () => balls[0];
    const kind = n => n === 0 ? 'cue' : n === 8 ? 'eight' : n < 8 ? 'solids' : 'stripes';
    const left = g => balls.filter(b => !b.in && kind(b.n) === g).length;
    const isAI = () => !two && cur === 1;
    function shoot(a, p) {
      if (state !== 'aim') return; const sp = 120 + p * 1500; cue().vx = Math.cos(a) * sp; cue().vy = Math.sin(a) * sp;
      state = 'roll'; firstHit = null; potted = []; shotBy = cur; power = 0; E.sound('hit'); E.note(200 + p * 300, 0.06, 'square', 0.05);
    }
    function moving() { return balls.some(b => !b.in && (Math.abs(b.vx) > 0.5 || Math.abs(b.vy) > 0.5)); }
    function step(dt) {
      for (const b of balls) { if (b.in) continue; b.x += b.vx * dt; b.y += b.vy * dt; const sp = Math.hypot(b.vx, b.vy); if (sp > 0) { const ns = Math.max(0, sp - 140 * dt); b.vx *= ns / sp; b.vy *= ns / sp; if (ns < 3) b.vx = b.vy = 0; } }
      for (let i = 0; i < balls.length; i++) { const a = balls[i]; if (a.in) continue;
        for (let j = i + 1; j < balls.length; j++) { const b = balls[j]; if (b.in) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < R * 2 && d > 0) { const nx = dx / d, ny = dy / d, ov = R * 2 - d; a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const imp = -rv * 0.97; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; if (Math.abs(rv) > 30) E.sound('tick', 30); }
            if (firstHit === null && (a.n === 0 || b.n === 0)) firstHit = a.n === 0 ? b.n : a.n; } } }
      for (const b of balls) { if (b.in) continue;
        for (const s of cushions) { const r = segDist(b.x, b.y, s[0], s[1], s[2], s[3]); if (r.d < R) { let nx = b.x - r.x, ny = b.y - r.y; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d; b.x = r.x + nx * R; b.y = r.y + ny * R; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.75 * vn * nx; b.vy -= 1.75 * vn * ny; if (Math.abs(vn) > 40) E.sound('thud', 40); } } }
        for (const p of pockets) if (dist(b.x, b.y, p[0], p[1]) < PR) { b.in = true; b.vx = b.vy = 0; potted.push(b.n); E.sound('pop'); fx.burst(p[0], p[1], 10, { col: COL[b.n], spd: 80 }); break; }
        if (b.x < L - 30 || b.x > RT + 30 || b.y < T - 30 || b.y > B + 30) { b.in = true; potted.push(b.n); }
      }
    }
    function endShot() {
      const me = cur, opp = 1 - cur, g = groups[me]; let foul = false, keep = false, why = '';
      const scratch = potted.indexOf(0) >= 0, eight = potted.indexOf(8) >= 0;
      if (firstHit === null) { foul = true; why = 'No ball hit'; }
      else if (g && kind(firstHit) !== g && !(kind(firstHit) === 'eight' && left(g) === 0)) { foul = true; why = 'Wrong ball first'; }
      else if (!g && firstHit === 8) { foul = true; why = '8-ball hit first'; }
      if (scratch) { foul = true; why = 'Scratch!'; }
      if (eight) {
        const cleared = g && left(g) === 0;
        return finish(cleared && !scratch ? me : opp, cleared && !scratch ? 'sank the 8-ball!' : (scratch ? 'scratched on the 8' : 'sank the 8-ball too early'));
      }
      const own = potted.filter(n => n !== 0 && n !== 8);
      if (!g && own.length && !foul) { const k = kind(own[0]); groups[me] = k; groups[opp] = k === 'solids' ? 'stripes' : 'solids'; msg = (two ? 'Player ' + (me + 1) : me ? 'Computer' : 'You') + ': ' + k.toUpperCase(); msgT = 2; E.sound('power'); }
      const g2 = groups[me];
      if (!foul && own.some(n => !g2 || kind(n) === g2)) keep = true;
      if (scratch) { const c = cue(); c.in = false; c.x = L + (RT - L) * 0.25; c.y = (T + B) / 2; c.vx = c.vy = 0; }
      if (!keep) cur = opp;
      if (foul) { msg = 'FOUL: ' + why + ' – ball in hand'; msgT = 2.2; state = 'place'; E.sound('error'); placeOK(); }
      else { state = 'aim'; if (!keep) { msg = turnName() + "'s turn"; msgT = 1.2; } }
      aiT = 0.9;
    }
    function placeOK() { const c = cue(); for (const b of balls) if (b !== c && !b.in && dist(b.x, b.y, c.x, c.y) < R * 2.2) return false; return c.x > L + R && c.x < RT - R && c.y > T + R && c.y < B - R; }
    const turnName = () => two ? 'Player ' + (cur + 1) : cur ? 'Computer' : 'Your';
    function finish(w, how) {
      ended = true; state = 'over';
      const who = two ? 'Player ' + (w + 1) : w === 0 ? 'You' : 'Computer';
      if (!two && w === 0) { wins++; E.ach('pool'); }
      E.gameOver({ twoP: two, noBest: two, win: two || w === 0, score: two ? 0 : wins, scoreText: two ? 'PLAYER ' + (w + 1) : (w === 0 ? 'YOU WIN!' : 'YOU LOSE'), label: two ? 'WINS THE RACK' : 'TOTAL WINS: ' + wins, title: '🎱 ' + who + (w === 0 && !two ? ' win!' : ' wins!'), lines: [(w === 0 ? (two ? 'Player 1' : 'You') : (two ? 'Player 2' : 'Computer')) + ' ' + how].concat(two ? [] : ['']), again: '↻ Rematch' });
    }
    // ---- AI ----
    function pathClear(x0, y0, x1, y1, skip) { for (const b of balls) { if (b.in || skip.indexOf(b) >= 0) continue; if (segDist(b.x, b.y, x0, y0, x1, y1).d < R * 2 - 1) return false; } return true; }
    function bestShot(cx, cy) {
      const g = groups[1]; const targets = balls.filter(b => !b.in && b.n !== 0 && (g ? (left(g) ? kind(b.n) === g : b.n === 8) : b.n !== 8));
      let best = null;
      for (const b of targets) for (const p of pockets) {
        const dx = p[0] - b.x, dy = p[1] - b.y, d = Math.hypot(dx, dy), gx = b.x - dx / d * R * 2, gy = b.y - dy / d * R * 2;
        const ax = gx - cx, ay = gy - cy, ad = Math.hypot(ax, ay); const cut = Math.abs(angDiff(Math.atan2(ay, ax), Math.atan2(dy, dx)));
        if (cut > 1.3) continue;
        const c = { x: cx, y: cy }; if (!pathClear(cx, cy, gx, gy, [cue(), b]) || !pathClear(b.x, b.y, p[0], p[1], [b, cue()])) continue;
        const sc = cut * 2 + d / 400 + ad / 600; if (!best || sc < best.sc) best = { sc, a: Math.atan2(ay, ax), p: clamp((ad + d) / 900 + cut * 0.15 + 0.15, 0.2, 0.95) };
      }
      return best;
    }
    function aiMove() {
      if (state === 'place') { let bp = null, bs = 1e9; const c = cue(); for (let k = 0; k < 40; k++) { c.x = rand(L + 30, RT - 30); c.y = rand(T + 30, B - 30); if (!placeOK()) continue; const s = bestShot(c.x, c.y); if (s && s.sc < bs) { bs = s.sc; bp = [c.x, c.y]; } } if (bp) { c.x = bp[0]; c.y = bp[1]; } else { c.x = L + (RT - L) * 0.25; c.y = (T + B) / 2; } state = 'aim'; aiT = 0.8; return; }
      let s = bestShot(cue().x, cue().y);
      if (!s) { const g = groups[1]; const tg = balls.filter(b => !b.in && b.n && (g ? (left(g) ? kind(b.n) === g : b.n === 8) : b.n !== 8)).sort((a, b) => dist(a.x, a.y, cue().x, cue().y) - dist(b.x, b.y, cue().x, cue().y))[0]; s = tg ? { a: Math.atan2(tg.y - cue().y, tg.x - cue().x), p: 0.55 } : { a: 0, p: 0.5 }; }
      aimA = s.a + rand(-0.035, 0.035); shoot(aimA, s.p);
    }
    // ---- aim guide ----
    function rayHit(a) {
      const c = cue(), dx = Math.cos(a), dy = Math.sin(a); let best = null;
      for (const b of balls) { if (b.in || b === c) continue; const fx2 = b.x - c.x, fy = b.y - c.y, tproj = fx2 * dx + fy * dy; if (tproj < 0) continue; const perp = Math.abs(fx2 * dy - fy * dx); if (perp > R * 2) continue; const back = Math.sqrt(R * R * 4 - perp * perp), tt = tproj - back; if (!best || tt < best.t) best = { t: tt, b }; }
      let wall = 1e9; if (dx > 0) wall = Math.min(wall, (RT - R - c.x) / dx); if (dx < 0) wall = Math.min(wall, (L + R - c.x) / dx); if (dy > 0) wall = Math.min(wall, (B - R - c.y) / dy); if (dy < 0) wall = Math.min(wall, (T + R - c.y) / dy);
      if (best && best.t < wall) return { x: c.x + dx * best.t, y: c.y + dy * best.t, b: best.b }; return { x: c.x + dx * wall, y: c.y + dy * wall };
    }
    const sliderRect = () => ({ x: 22, y: T, w: 46, h: B - T });
    function drawBall(b) {
      const n = b.n; ctx.save(); ctx.translate(b.x, b.y);
      ellipse(ctx, 3, 4, R, R * 0.9, 'rgba(0,0,0,.35)');
      if (n > 8) { circle(ctx, 0, 0, R, '#f8fafc'); ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip(); ctx.fillStyle = COL[n]; ctx.fillRect(-R, -R * 0.55, R * 2, R * 1.1); ctx.restore(); }
      else circle(ctx, 0, 0, R, COL[n]);
      if (n > 0) { circle(ctx, 0, 0, R * 0.48, '#fff'); txt(ctx, String(n), 0, 0.5, 9, '#111', 'center', 900); }
      circle(ctx, -R * 0.35, -R * 0.4, R * 0.32, 'rgba(255,255,255,.55)');
      ctx.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (ended) return;
        if (state === 'roll') { for (let k = 0; k < 8; k++) step(dt / 8); if (!moving()) endShot(); return; }
        if (isAI() && (state === 'aim' || state === 'place')) { aiT -= dt; if (aiT <= 0) aiMove(); return; }
        if (state === 'aim') {
          const p1 = !two || cur === 0, p2 = !two || cur === 1, K = E.key, fine = K('ShiftLeft') || K('ShiftRight') ? 0.15 : 1;
          if ((p1 && K('KeyA')) || (p2 && K('ArrowLeft'))) aimA -= dt * 1.4 * fine; if ((p1 && K('KeyD')) || (p2 && K('ArrowRight'))) aimA += dt * 1.4 * fine;
          if ((p1 && K('KeyW')) || (p2 && K('ArrowUp'))) power = Math.min(1, power + dt * 0.7); if ((p1 && K('KeyS')) || (p2 && K('ArrowDown'))) power = Math.max(0, power - dt * 0.7);
        }
      },
      draw() {
        view = E.fit(VW, VH); ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, E.W, E.H); view.apply(ctx);
        ctx.fillStyle = rgrad(ctx, VW / 2, VH / 2, 50, 700, ['#3f2a1d', '#120c08']); ctx.fillRect(-300, -300, VW + 600, VH + 600);
        // rails
        shadowOn(ctx, 'rgba(0,0,0,.6)', 30, 0, 14); rr(ctx, L - 50, T - 50, RT - L + 100, B - T + 100, 30); ctx.fillStyle = lgrad(ctx, 0, T - 50, 0, B + 50, ['#92400e', '#5c2a0b', '#7c2d12']); ctx.fill(); shadowOff(ctx);
        ctx.strokeStyle = 'rgba(255,220,180,.25)'; ctx.lineWidth = 2; rr(ctx, L - 44, T - 44, RT - L + 88, B - T + 88, 26); ctx.stroke();
        ctx.fillStyle = '#0f5132'; ctx.fillRect(L - 14, T - 14, RT - L + 28, B - T + 28);
        ctx.fillStyle = rgrad(ctx, (L + RT) / 2, (T + B) / 2, 30, 560, ['#1aa35b', '#117a43', '#0b5a30']); ctx.fillRect(L, T, RT - L, B - T);
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(L + (RT - L) * 0.25, T, 2, B - T); circle(ctx, L + (RT - L) * 0.72, (T + B) / 2, 3, 'rgba(255,255,255,.3)');
        for (let i = 1; i < 8; i++) { if (i === 4) continue; const x = L + (RT - L) * i / 8; for (const y of [T - 30, B + 30]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#fde68a'; ctx.fillRect(-3, -3, 6, 6); ctx.restore(); } }
        for (let i = 1; i < 4; i++) { const y = T + (B - T) * i / 4; for (const x of [L - 30, RT + 30]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#fde68a'; ctx.fillRect(-3, -3, 6, 6); ctx.restore(); } }
        for (const p of pockets) { circle(ctx, p[0], p[1], PR + 6, '#292524'); circle(ctx, p[0], p[1], PR, '#000'); }
        // cue guide
        const c = cue();
        if (state === 'aim' && !isAI() && !c.in) {
          const h = rayHit(aimA); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(h.x, h.y, R, 0, TAU); ctx.stroke();
          if (h.b) { const a2 = Math.atan2(h.b.y - h.y, h.b.x - h.x); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(h.b.x, h.b.y); ctx.lineTo(h.b.x + Math.cos(a2) * 70, h.b.y + Math.sin(a2) * 70); ctx.stroke(); }
        }
        for (const b of balls) if (!b.in) drawBall(b);
        // cue stick
        if ((state === 'aim') && !c.in) {
          const pull = 18 + power * 90, ca = Math.cos(aimA), sa = Math.sin(aimA);
          ctx.save(); ctx.translate(c.x - ca * pull, c.y - sa * pull); ctx.rotate(aimA + Math.PI);
          shadowOn(ctx, 'rgba(0,0,0,.4)', 10, 4, 6); ctx.fillStyle = lgrad(ctx, 0, 0, 420, 0, ['#f5f5f4', '#e7c38f', '#b45309', '#3f1d0b']); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(420, -7); ctx.lineTo(420, 7); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); shadowOff(ctx);
          ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, -3, 6, 6); ctx.restore();
        }
        if (state === 'place') { ctx.strokeStyle = placeOK() ? '#86efac' : '#f87171'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(c.x, c.y, R + 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]); if (!isAI()) label(ctx, '✋ BALL IN HAND – drag the cue ball, then tap ✓', VW / 2, B + 72, 18, '#fde047'); }
        // power slider
        const s = sliderRect(); rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); rr(ctx, s.x + 6, s.y + 6, s.w - 12, (s.h - 12) * power, 10); ctx.fillStyle = lgrad(ctx, 0, s.y, 0, s.y + s.h, ['#4ade80', '#facc15', '#ef4444']); ctx.fill();
        label(ctx, 'POWER', s.x + s.w / 2, s.y - 14, 12, '#e7e5e4');
        if (state === 'place' && !isAI()) { rr(ctx, VW - 90, B + 50, 70, 44, 12); ctx.fillStyle = placeOK() ? '#16a34a' : '#57534e'; ctx.fill(); label(ctx, '✓', VW - 55, B + 72, 24); }
        // players panel
        const name = i => two ? 'Player ' + (i + 1) : i ? 'Computer' : 'You';
        for (let i = 0; i < 2; i++) {
          const x = i ? VW - 260 : 200, act = cur === i && !ended; rr(ctx, x - 150, 8, 300, 50, 12); ctx.fillStyle = act ? 'rgba(250,204,21,.25)' : 'rgba(0,0,0,.45)'; ctx.fill(); if (act) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.stroke(); }
          label(ctx, name(i) + (groups[i] ? ' • ' + groups[i] : ''), x, 24, 15, act ? '#fde047' : '#e5e7eb');
          const g = groups[i]; if (g) { const ns = balls.filter(b => !b.in && kind(b.n) === g).map(b => b.n); ns.forEach((n, k) => drawBall({ n, x: x - 60 + k * 22, y: 44 })); if (!ns.length) label(ctx, '→ sink the 8!', x, 44, 13, '#fde047'); }
        }
        fx.draw(ctx);
        if (msgT > 0) label(ctx, msg, VW / 2, (T + B) / 2, 30, '#fff');
        if (isAI() && state !== 'roll' && !ended) label(ctx, 'Computer is thinking…', VW / 2, B + 72, 16, '#cbd5e1');
        E.endWorld();
      },
      down(x, y) {
        if (!view || isAI() || ended) return; const p = view.toWorld(x, y), s = sliderRect();
        if (state === 'place' && p.x > VW - 90 && p.y > B + 50) { if (placeOK()) { state = 'aim'; E.sound('click'); } return; }
        if (state === 'aim' && p.x > s.x - 10 && p.x < s.x + s.w + 20 && p.y > s.y - 10 && p.y < s.y + s.h + 10) { slider = true; power = clamp((p.y - s.y) / s.h, 0, 1); return; }
        aiming = true; this.move(x, y);
      },
      move(x, y) {
        if (!view || isAI() || ended) return; const p = view.toWorld(x, y), s = sliderRect();
        if (slider) { power = clamp((p.y - s.y) / s.h, 0, 1); return; }
        if (state === 'place' && aiming) { const c = cue(); c.x = clamp(p.x, L + R, RT - R); c.y = clamp(p.y, T + R, B - R); return; }
        if (state === 'aim' && (aiming || !E.touch) && p.x > L - 60) aimA = Math.atan2(p.y - cue().y, p.x - cue().x);
      },
      up() { if (slider) { slider = false; if (power > 0.03) shoot(aimA, power); else power = 0; } aiming = false; },
      onKey(c) {
        if (isAI() || ended) return; const p1 = !two || cur === 0, p2 = !two || cur === 1;
        if (state === 'place' && (c === 'Enter' || c === 'Space')) { if (placeOK()) state = 'aim'; return; }
        if ((p1 && c === 'Space') || (p2 && c === 'Enter') || (!two && c === 'Enter')) { if (power < 0.05) power = 0.5; shoot(aimA, power); }
      },
      hud() { return null; }
    };
  }
});
