/* =====================================================================
   BOWLING  (10 frames, 1P + local 2P)
   ===================================================================== */
registerGame({
  id: 'bowling', title: 'Bowling', emoji: '🎳', c1: '#8e2de2', c2: '#4a00e0', cats: ['Sports', 'Physics', 'Multiplayer'], twoP: true, pop: true,
  desc: 'A full 10-frame game with real pin physics, strikes, spares and a proper scorecard. Curve your ball and bowl in three different alleys!',
  controls: 'Drag / ←→ position • tap twice to aim & power', scoreLabel: 'SCORE',
  hint: '←/→ move • SPACE locks the aim arrow, SPACE again locks power. While rolling, hold ←/→ to curve!', hintTouch: 'Drag to position, tap to lock aim, tap to lock power. Hold left/right side to curve!',
  hint2: 'Frames alternate. P1: A/D + SPACE • P2: ←/→ + ENTER. Curve with your own keys while the ball rolls.', hint2Touch: 'Take turns! Drag to position, tap to aim, tap for power.',
  p2info: 'Players alternate frames over a full 10-frame game.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), two = E.mode === 2, LW = 0.53, LEN = 18.3, BR = 0.11, PRAD = 0.065;
    const ALLEYS = [{ n: 'Neon Lanes', wall: ['#1e1b4b', '#4c1d95'], lane: ['#fcd9a8', '#e8b375'], glow: '#f0abfc' }, { n: 'Classic Alley', wall: ['#3f2a1d', '#7c2d12'], lane: ['#f5deb3', '#deb887'], glow: '#fde68a' }, { n: 'Cosmic Bowl', wall: ['#020617', '#0f172a'], lane: ['#93c5fd', '#3b82f6'], glow: '#22d3ee' }];
    const alley = ALLEYS[irand(0, 2)];
    let pins, ball, state = 'pos', aimA = 0, aimDir = 1, pow = 0, powDir = 1, posX = 0, t = 0, rollT = 0, cur = 0, frame = 0, rolls = [[], []], msg = '', msgT = 0, settle = 0, standing0 = 10, curve = 0, touchCurve = 0, ended = false, dragging = false;
    const PIN_POS = []; (function () { const S = 0.3048 / 2 * 1.0; let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) PIN_POS.push([(i - r / 2) * 0.3048, LEN + r * 0.264]); })();
    function setPins(keep) { if (!keep) pins = PIN_POS.map(p => ({ x: p[0], z: p[1], vx: 0, vz: 0, down: false, tilt: 0, gone: false })); else pins.forEach(p => { if (p.down) p.gone = true; }); }
    function newBall() { ball = { x: posX, z: 0.3, vx: 0, vz: 0, rolling: false, gutter: false, rot: 0, spin: 0 }; state = 'pos'; aimA = 0; pow = 0; }
    setPins(false); newBall();
    function throwBall() { const sp = 6 + pow * 6; ball.vx = Math.sin(aimA) * sp; ball.vz = Math.cos(aimA) * sp; ball.rolling = true; state = 'roll'; rollT = 0; standing0 = pins.filter(p => !p.gone && !p.down).length; E.sound('whoosh'); }
    const curRolls = () => rolls[cur];
    function frameRolls(r, f) { // returns rolls in frame f for a roll list
      let i = 0; for (let k = 0; k < f; k++) { if (r[i] === 10) i += 1; else i += 2; } return i;
    }
    function scoreOf(r) {
      let s = 0, i = 0, out = []; for (let f = 0; f < 10; f++) {
        if (r[i] === undefined) break;
        if (r[i] === 10) { if (r[i + 1] === undefined || r[i + 2] === undefined) { out.push(null); break; } s += 10 + r[i + 1] + r[i + 2]; i += 1; }
        else { if (r[i + 1] === undefined) { out.push(null); break; } if (r[i] + r[i + 1] === 10) { if (r[i + 2] === undefined) { out.push(null); break; } s += 10 + r[i + 2]; } else s += r[i] + r[i + 1]; i += 2; }
        out.push(s);
      } return { total: s, frames: out };
    }
    function framesDone(r) { let i = 0, f = 0; while (f < 9 && r[i] !== undefined) { if (r[i] === 10) i++; else { if (r[i + 1] === undefined) return { f, i, inFrame: 1 }; i += 2; } f++; } return { f, i, inFrame: r.length - i }; }
    function tenthComplete(r) { const d = framesDone(r); if (d.f < 9) return false; const x = r.slice(d.i); if (x.length < 2) return false; if (x[0] === 10 || x[0] + x[1] === 10) return x.length >= 3; return true; }
    function afterRoll() {
      const knocked = standing0 - pins.filter(p => !p.gone && !p.down).length;
      const r = curRolls(); r.push(knocked);
      const st = frameState(r);
      if (st.strike) { msg = 'STRIKE!'; E.ach('strike'); E.sound('cheer'); fx.burst(E.W / 2, E.H * 0.35, 50, { col: ['#fde047', '#f472b6', '#22d3ee'], spd: 400, shape: 'star', size: 7 }); }
      else if (st.spare) { msg = 'SPARE!'; E.sound('cheer'); }
      else msg = knocked === 0 ? (ball.gutter ? 'Gutter ball' : 'Miss') : knocked + ' pin' + (knocked > 1 ? 's' : '');
      msgT = 1.6;
      if (st.done) {
        if (two && !tenthComplete(rolls[1 - cur])) cur = 1 - cur;
        if (tenthComplete(rolls[0]) && (!two || tenthComplete(rolls[1]))) return gameEnd();
        setPins(false);
      } else if (st.resetPins) setPins(false); else setPins(true);
      newBall();
    }
    function frameState(r) { // state of the frame containing the latest roll
      const d = framesDone(r.slice(0, -1));
      if (d.f < 9) {
        let i = 0; while (true) { const a = r[i]; if (a === 10) { if (i === r.length - 1) return { strike: true, done: true }; i++; continue; } if (i === r.length - 1) return { done: false, resetPins: false }; if (i + 1 === r.length - 1) return { spare: a + r[i + 1] === 10, done: true }; i += 2; }
      }
      const x = r.slice(d.i);
      if (x.length === 1) return { strike: x[0] === 10, done: false, resetPins: x[0] === 10 };
      if (x.length === 2) { if (x[0] === 10) return { strike: x[1] === 10, done: false, resetPins: x[1] === 10 }; if (x[0] + x[1] === 10) return { spare: true, done: false, resetPins: true }; return { done: true }; }
      return { strike: x[2] === 10, spare: x[0] === 10 && x[1] !== 10 && x[1] + x[2] === 10, done: true };
    }
    function gameEnd() {
      ended = true; const a = scoreOf(rolls[0]).total, b = scoreOf(rolls[1]).total;
      if (two) { const w = a === b ? 0 : a > b ? 1 : 2; E.gameOver({ twoP: true, noBest: true, win: true, score: 0, scoreText: w ? 'PLAYER ' + w + ' WINS' : 'TIE GAME', label: 'RESULT', title: '🎳 Final Frame!', lines: ['Player 1: ' + a, 'Player 2: ' + b] }); }
      else E.gameOver({ score: a, win: a >= 150, title: a === 300 ? 'PERFECT GAME!!' : 'Game Complete', lines: ['Final score: ' + a, alley.n] });
    }
    // perspective
    function P(x, z, y) { const zc = 5, f = Math.min(E.H * 2.2, E.W * 1.6), d = Math.max(0.5, z + zc), hz = E.H * 0.18; return [E.W / 2 + x * f / d * 0.95, hz + (1.25 - (y || 0)) * f / d * 0.75, f / d]; }
    function step(dt) {
      if (!ball.rolling) return;
      rollT += dt; const p1 = !two || cur === 0, p2 = !two || cur === 1;
      let c = (p1 && E.key('KeyD')) || (p2 && E.key('ArrowRight')) ? 1 : 0; c -= (p1 && E.key('KeyA')) || (p2 && E.key('ArrowLeft')) ? 1 : 0; if (!c) c = touchCurve;
      if (!ball.gutter && ball.z < LEN - 1) ball.vx += c * 0.9 * dt;
      ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.rot += ball.vz * dt * 3;
      if (!ball.gutter && Math.abs(ball.x) > LW - BR * 0.3) { ball.gutter = true; ball.x = Math.sign(ball.x) * (LW + 0.09); ball.vx = 0; E.sound('thud'); }
      for (const p of pins) {
        if (p.gone) continue;
        if (!ball.gutter) { const dx = p.x - ball.x, dz = p.z - ball.z, d = Math.hypot(dx, dz); if (d < BR + PRAD) { const nx = dx / d, nz = dz / d; const rv = (ball.vx - p.vx) * nx + (ball.vz - p.vz) * nz; if (rv > 0) { const j = rv * 1.7; p.vx += j * nx * 1.0; p.vz += j * nz * 1.0; ball.vx -= j * nx * 0.12; ball.vz -= j * nz * 0.12; } p.x = ball.x + nx * (BR + PRAD); p.z = ball.z + nz * (BR + PRAD); if (!p.down) { p.down = true; E.sound('hit', 20); } } }
      }
      for (let i = 0; i < pins.length; i++) { const a = pins[i]; if (a.gone) continue; for (let j = i + 1; j < pins.length; j++) { const b = pins[j]; if (b.gone) continue; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), rr2 = PRAD * 2 * (a.down || b.down ? 1.6 : 1); if (d < rr2 && d > 0) { const nx = dx / d, nz = dz / d, rv = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz; if (rv > 0) { const j2 = rv * 0.9; a.vx -= j2 * nx; a.vz -= j2 * nz; b.vx += j2 * nx; b.vz += j2 * nz; if (rv > 0.4) { if (!a.down) a.down = true; if (!b.down) b.down = true; E.sound('hit', 25); } } const ov = rr2 - d; a.x -= nx * ov / 2; a.z -= nz * ov / 2; b.x += nx * ov / 2; b.z += nz * ov / 2; } } }
      for (const p of pins) { if (p.gone) continue; p.x += p.vx * dt; p.z += p.vz * dt; const k = Math.pow(0.12, dt); p.vx *= k; p.vz *= k; if (p.down) p.tilt = Math.min(1, p.tilt + dt * 5); if (Math.hypot(p.vx, p.vz) > 0.25 && !p.down) p.down = true; if (Math.abs(p.x) > LW + 0.15) { p.down = true; } }
      if (ball.z > LEN + 1.6 || rollT > 6) { ball.rolling = false; state = 'settle'; settle = 1.4; }
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (ended) return;
        const p1 = !two || cur === 0, p2 = !two || cur === 1, K = E.key;
        if (state === 'pos') { if ((p1 && K('KeyA')) || (p2 && K('ArrowLeft'))) posX -= dt * 0.6; if ((p1 && K('KeyD')) || (p2 && K('ArrowRight'))) posX += dt * 0.6; posX = clamp(posX, -LW + 0.15, LW - 0.15); ball.x = posX; aimA = Math.sin(t * 1.6) * 0.07; }
        else if (state === 'pow') { pow += powDir * dt * 1.25; if (pow > 1) { pow = 1; powDir = -1; } if (pow < 0) { pow = 0; powDir = 1; } }
        else if (state === 'roll') { for (let k = 0; k < 6; k++) step(dt / 6); }
        else if (state === 'settle') { for (let k = 0; k < 4; k++) { for (const p of pins) { if (p.gone) continue; p.x += p.vx * dt / 4; p.z += p.vz * dt / 4; p.vx *= 0.97; p.vz *= 0.97; if (p.down) p.tilt = Math.min(1, p.tilt + dt); } } settle -= dt; if (settle <= 0) { state = 'wait'; afterRoll(); } }
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, alley.wall); ctx.fillRect(0, 0, W, H);
        // side lanes (decor) + glow strips
        for (const off of [-2.6, 2.6]) { const a = P(off - 0.9, -2.5), b = P(off + 0.9, -2.5), c = P(off + 0.9, LEN + 2), d = P(off - 0.9, LEN + 2); ctx.globalAlpha = 0.35; ctx.fillStyle = alley.lane[1]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.fill(); ctx.globalAlpha = 1; }
        // gutters + lane
        const quad = (x0, x1, z0, z1, col) => { const a = P(x0, z0), b = P(x1, z0), c = P(x1, z1), d = P(x0, z1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
        quad(-LW - 0.2, LW + 0.2, -2.5, LEN + 2.2, '#1f2937'); quad(-LW, LW, -2.5, LEN + 2.2, lgrad(ctx, 0, P(0, LEN)[1], 0, H, [alley.lane[1], alley.lane[0]]));
        for (let i = 1; i < 12; i++) { const x = -LW + i * LW * 2 / 12; const a = P(x, -2.5), b = P(x, LEN + 2.2); ctx.strokeStyle = 'rgba(120,70,20,.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.12, a = P(x, 4.6); ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 8); ctx.lineTo(a[0] - 5, a[1] + 4); ctx.lineTo(a[0] + 5, a[1] + 4); ctx.fill(); }
        const fl = P(0, 0.05); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(P(-LW, 0.05)[0], fl[1]); ctx.lineTo(P(LW, 0.05)[0], fl[1]); ctx.stroke();
        // pit backdrop
        const bk1 = P(-LW - 0.3, LEN + 2.2, 0), bk2 = P(LW + 0.3, LEN + 2.2, 1.1); ctx.fillStyle = '#0b0b10'; ctx.fillRect(bk1[0], bk2[1], bk2[0] - bk1[0], bk1[1] - bk2[1]);
        ctx.fillStyle = alley.glow; shadowOn(ctx, alley.glow, 20); ctx.fillRect(bk1[0], bk2[1] - 6, bk2[0] - bk1[0], 6); shadowOff(ctx);
        txt(ctx, alley.n.toUpperCase(), (bk1[0] + bk2[0]) / 2, bk2[1] - 22, Math.max(12, (bk2[0] - bk1[0]) * 0.08), alley.glow, 'center', 900);
        // draw pins + ball sorted by depth
        const items = [];
        for (const p of pins) if (!p.gone) items.push({ z: p.z, f: () => {
          const q = P(p.x, p.z), s = q[2] * 0.0125; if (!s) return;
          ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(p.tilt * (p.vx >= 0 ? 1.3 : -1.3)); const sc = s;
          ellipse(ctx, 0, 0, 9 * sc, 3 * sc, 'rgba(0,0,0,.3)');
          ctx.beginPath(); ctx.moveTo(-4 * sc, 0); ctx.bezierCurveTo(-9 * sc, -14 * sc, -2 * sc, -18 * sc, -3 * sc, -26 * sc); ctx.bezierCurveTo(-5 * sc, -32 * sc, 5 * sc, -32 * sc, 3 * sc, -26 * sc); ctx.bezierCurveTo(2 * sc, -18 * sc, 9 * sc, -14 * sc, 4 * sc, 0); ctx.closePath();
          ctx.fillStyle = lgrad(ctx, -8 * sc, 0, 8 * sc, 0, ['#d6d3d1', '#ffffff', '#e7e5e4']); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = '#dc2626'; ctx.fillRect(-2.6 * sc, -22 * sc, 5.2 * sc, 1.6 * sc); ctx.fillRect(-2.4 * sc, -19.5 * sc, 4.8 * sc, 1.4 * sc);
          ctx.restore();
        } });
        items.push({ z: ball.z, f: () => {
          const q = P(ball.x, ball.z, 0), r = BR * q[2] * 0.95; if (!r) return;
          ellipse(ctx, q[0], q[1], r, r * 0.3, 'rgba(0,0,0,.35)');
          const bx = q[0], by = q[1] - r; circle(ctx, bx, by, r, rgrad(ctx, bx - r * 0.4, by - r * 0.4, r * 0.1, r * 1.2, ['#c4b5fd', '#7c3aed', '#2e1065']));
          const hx = Math.sin(ball.rot) * r * 0.4; for (const [ox, oy] of [[-0.25, -0.2], [0.1, -0.35], [0.05, 0.05]]) if (Math.cos(ball.rot) > -0.3) circle(ctx, bx + ox * r + hx, by + oy * r, r * 0.09, '#1e1b4b');
          circle(ctx, bx - r * 0.35, by - r * 0.4, r * 0.25, 'rgba(255,255,255,.35)');
        } });
        items.sort((a, b) => b.z - a.z).forEach(i => i.f());
        // aim arrow
        if (state === 'pos' || state === 'pow') { const q0 = P(ball.x, 0.6), q1 = P(ball.x + Math.sin(aimA) * 6, 0.6 + Math.cos(aimA) * 6); ctx.strokeStyle = state === 'pos' ? '#facc15' : '#fef08a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); circle(ctx, q1[0], q1[1], 6, '#facc15'); }
        if (state === 'pow') { const bh = Math.min(260, H * 0.4), bx = W - 60, by = H / 2 - bh / 2; rr(ctx, bx, by, 26, bh, 12); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); rr(ctx, bx + 4, by + 4 + (bh - 8) * (1 - pow), 18, (bh - 8) * pow, 9); ctx.fillStyle = lgrad(ctx, 0, by + bh, 0, by, ['#4ade80', '#facc15', '#ef4444']); ctx.fill(); label(ctx, 'POWER', bx + 13, by - 14, 12); }
        // scorecard
        const nP = two ? 2 : 1, cw = Math.min(52, (W - 120) / 10.5), x0 = W / 2 - cw * 10.5 / 2 + 30;
        for (let p = 0; p < nP; p++) {
          const y0 = H - (nP - p) * 54 - 10, r = rolls[p], sc = scoreOf(r);
          rr(ctx, x0 - 70, y0, cw * 10.5 + 74, 50, 8); ctx.fillStyle = p === cur && !ended ? 'rgba(250,204,21,.25)' : 'rgba(0,0,0,.6)'; ctx.fill();
          txt(ctx, two ? 'P' + (p + 1) : 'YOU', x0 - 50, y0 + 25, 15, p === cur ? '#fde047' : '#fff', 'center', 900);
          let i = 0;
          for (let f = 0; f < 10; f++) {
            const fx0 = x0 + f * cw, w = f === 9 ? cw * 1.5 : cw; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.strokeRect(fx0, y0 + 2, w, 46);
            let marks = [];
            if (f < 9) { const a = r[i], b = r[i + 1]; if (a === 10) { marks = ['', 'X']; i += 1; } else if (a !== undefined) { marks = [a === 0 ? '-' : a, b === undefined ? '' : a + b === 10 ? '/' : b === 0 ? '-' : b]; i += 2; } }
            else { const x = r.slice(i); marks = x.map((v, k) => v === 10 ? 'X' : (k > 0 && x[k - 1] !== 10 && x[k - 1] + v === 10 && (k === 1 || (k === 2 && (x[0] === 10 || x[0] + x[1] === 10) && x[1] === 10 ? false : k === 1))) ? '/' : v === 0 ? '-' : v); if (x.length === 3 && x[0] === 10 && x[1] !== 10 && x[1] + x[2] === 10) marks[2] = '/'; }
            marks.forEach((m, k) => txt(ctx, String(m), fx0 + w - (marks.length - k) * (w / (f === 9 ? 3 : 2)) + w / (f === 9 ? 6 : 4), y0 + 14, 12, m === 'X' || m === '/' ? '#fde047' : '#fff', 'center', 800));
            if (sc.frames[f] !== undefined && sc.frames[f] !== null) txt(ctx, String(sc.frames[f]), fx0 + w / 2, y0 + 36, 14, '#fff', 'center', 900);
          }
        }
        fx.draw(ctx);
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.32, 44, msg === 'STRIKE!' ? '#fde047' : '#fff');
        if (state === 'pos' && !ended) label(ctx, (two ? 'PLAYER ' + (cur + 1) + ' • ' : '') + (E.touch ? 'Drag to position • TAP to aim' : (two && cur ? '←/→ position • ENTER' : (two ? 'A/D' : '←/→') + ' position • SPACE')), W / 2, 30, 18, '#fff');
        if (state === 'pow') label(ctx, E.touch ? 'TAP to set power!' : 'Press again to set power!', W / 2, 30, 18, '#fde047');
      },
      down(x) { if (ended) return; if (state === 'pos') { dragging = { x, px: posX, moved: false }; } else if (state === 'pow') throwBall(); else if (state === 'roll') touchCurve = x < E.W / 2 ? -1 : 1; },
      move(x) { if (dragging && state === 'pos' && E.ptrDown) { const dx = (x - dragging.x) / (E.W * 0.3); if (Math.abs(x - dragging.x) > 8) dragging.moved = true; posX = clamp(dragging.px + dx * LW, -LW + 0.15, LW - 0.15); ball.x = posX; } },
      up() { if (dragging && state === 'pos' && !dragging.moved) { state = 'pow'; pow = 0; powDir = 1; E.sound('click'); } dragging = false; touchCurve = 0; },
      onKey(c) {
        if (ended) return; const p1 = !two || cur === 0, p2 = !two || cur === 1;
        const go = (p1 && c === 'Space') || (p2 && c === 'Enter') || (!two && c === 'Enter');
        if (!go) return;
        if (state === 'pos') { state = 'pow'; pow = 0; powDir = 1; E.sound('click'); } else if (state === 'pow') throwBall();
      },
      hud() { return null; }
    };
  }
});
