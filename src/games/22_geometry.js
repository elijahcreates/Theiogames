/* =====================================================================
   GEOMETRY RUSH
   ===================================================================== */
registerGame({
  id: 'geometry', title: 'Geometry Rush', emoji: '🔷', c1: '#4e54c8', c2: '#8f94fb', cats: ['Arcade', 'Endless'], hot: true,
  desc: 'Your cube races forward on its own – time your jumps over spikes, pits and stairs. Each level is faster than the last!',
  controls: 'Tap / Space / ↑ (hold = auto-jump)', scoreLabel: 'BEST PROGRESS',
  fmtScore: v => 'Lv ' + Math.floor(v / 100) + ' • ' + (v % 100) + '%',
  hint: 'Click / SPACE / ↑ to jump. Hold to keep jumping. Yellow pads launch you high!', hintTouch: 'Tap to jump – hold to keep jumping. Yellow pads launch you high!',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    let level = E.data('level', 1), attempt = 1, objs, pits, length, P, t = 0, dead = 0, done = 0, holding = false, hue = 0, prog = 0, flash = 0;
    function build() {
      const r = rng(level * 7777 + 13); objs = []; pits = []; length = 140 + level * 25; hue = (level * 67 + 200) % 360;
      let x = 14;
      const lv = Math.min(level, 8);
      while (x < length - 12) {
        const k = r();
        if (k < 0.22) { const n = 1 + Math.floor(r() * Math.min(3, 1 + lv / 2)); for (let i = 0; i < n; i++) objs.push({ t: 's', x: x + i, y: 0 }); x += n + 5 + Math.floor(r() * 3); }
        else if (k < 0.4) { const w = 2 + Math.floor(r() * 3), h = 1; objs.push({ t: 'b', x, y: 0, w, h }); if (r() < 0.5 && lv > 1) objs.push({ t: 's', x: x + w, y: 0 }); x += w + 5; }
        else if (k < 0.55) { objs.push({ t: 'b', x, y: 0, w: 2, h: 1 }, { t: 'b', x: x + 2, y: 0, w: 2, h: 2 }); if (lv > 2 && r() < 0.6) objs.push({ t: 'b', x: x + 4, y: 0, w: 2, h: 3 }); x += 11; }
        else if (k < 0.72) { const w = 2 + Math.floor(r() * Math.min(3, 1 + lv / 2)); pits.push([x, x + w]); x += w + 5; }
        else if (k < 0.84 && lv > 1) { objs.push({ t: 'p', x, y: 0 }); objs.push({ t: 'b', x: x + 5, y: 3, w: 4, h: 1 }); pits.push([x + 3, x + 11]); x += 15; }
        else { objs.push({ t: 'b', x, y: 0, w: 1, h: 1 }); objs.push({ t: 's', x: x + 3, y: 0 }); if (lv > 3) objs.push({ t: 's', x: x + 4, y: 0 }); x += 9; }
      }
      P = { x: 0, y: 0, vy: 0, rot: 0, ground: true };
    }
    build();
    const speed = () => 8.6 + Math.min(level, 10) * 0.45;
    function inPit(x) { return pits.some(p => x > p[0] + 0.1 && x + 0.8 < p[1] + 0.1 + 0.7); }
    function overPit(cx) { return pits.some(p => cx > p[0] && cx < p[1]); }
    function die() {
      if (dead) return; dead = 1; E.sound('crash'); E.shake(10);
      fx.burst(P.x + 0.5, P.y + 0.5, 40, { col: [hsl(hue, 90, 65), '#fff', hsl(hue + 60, 90, 60)], spd: 9, size: 0.18, drag: 1 });
      const sc = level * 100 + Math.floor(prog * 99); E.submitBest(sc);
    }
    function jump() { if (P.ground && !dead && !done) { P.vy = 17.5; P.ground = false; E.sound('jump', 30); } }
    return {
      update(dt) {
        t += dt; fx.update(dt); flash = Math.max(0, flash - dt * 2);
        if (dead) { dead += dt; if (dead > 1) { dead = 0; attempt++; P = { x: 0, y: 0, vy: 0, rot: 0, ground: true }; fx.clear(); } return; }
        if (done) { done += dt; if (done > 2) { done = 0; level++; E.save('level', level); attempt = 1; build(); } return; }
        const sp = speed(); const px0 = P.x, py0 = P.y;
        P.x += sp * dt; prog = clamp(P.x / length, 0, 1);
        if (holding || E.key('Space') || E.key('ArrowUp') || E.key('KeyW')) jump();
        P.vy -= 62 * dt; P.y += P.vy * dt;
        // ground
        const cx = P.x + 0.5; let supported = false;
        if (P.y <= 0 && py0 >= -0.05 && !overPit(cx)) { P.y = 0; P.vy = 0; supported = true; }
        // blocks
        for (const o of objs) {
          if (o.t !== 'b') continue;
          if (P.x + 0.92 > o.x && P.x + 0.08 < o.x + o.w) {
            const top = o.y + o.h;
            if (P.y < top && P.y + 0.9 > o.y) {
              if (py0 >= top - 0.25 && P.vy <= 0) { P.y = top; P.vy = 0; supported = true; }
              else return die();
            }
          }
        }
        // spikes / pads
        for (const o of objs) {
          if (o.t === 's' && P.x + 0.8 > o.x + 0.25 && P.x + 0.2 < o.x + 0.75 && P.y < o.y + 0.55 && P.y + 0.9 > o.y) return die();
          if (o.t === 'p' && P.x + 0.9 > o.x && P.x + 0.1 < o.x + 1 && P.y < 0.3 && P.vy <= 0) { P.vy = 25; P.ground = false; E.sound('power', 100); fx.burst(o.x + 0.5, 0.2, 14, { col: '#fde047', spd: 6, size: 0.12, ang: -Math.PI / 2, spread: 0.6 }); }
        }
        if (supported) { if (!P.ground) { P.rot = Math.round(P.rot / (Math.PI / 2)) * (Math.PI / 2); fx.burst(P.x + 0.2, P.y, 4, { col: '#fff', spd: 3, size: 0.08 }); } P.ground = true; }
        else { P.ground = false; P.rot += dt * 7.2; }
        if (P.y < -4) return die();
        if (P.ground && Math.random() < 0.5) fx.burst(P.x, P.y + 0.1, 1, { col: hsl(hue, 90, 70), spd: 2, size: 0.08, life: 0.4, ang: Math.PI, spread: 0.4 });
        if (P.x >= length) { done = 1; flash = 1; E.sound('win'); E.submitBest((level + 1) * 100); E.coins(10 + level * 2); }
      },
      draw() {
        const W = E.W, H = E.H, s = Math.min(H / 10, W / 13), camX = (dead ? P.x : P.x) - W * 0.28 / s, gy = H * 0.72;
        const X = x => (x - camX) * s, Y = y => gy - y * s;
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, [hsl(hue, 70, 18), hsl(hue + 30, 70, 32)]); ctx.fillRect(0, 0, W, H);
        // bg squares parallax
        ctx.strokeStyle = hsl(hue + 30, 80, 60, 0.12); ctx.lineWidth = 2;
        for (let i = 0; i < 14; i++) { const bx = ((i * 190 - camX * s * 0.2) % (W + 200) + W + 200) % (W + 200) - 100, by = (i * 97) % (gy - 60), sz = 40 + (i % 4) * 25; ctx.save(); ctx.translate(bx, by + 30); ctx.rotate(t * 0.2 + i); ctx.strokeRect(-sz / 2, -sz / 2, sz, sz); ctx.restore(); }
        // ground
        ctx.fillStyle = lgrad(ctx, 0, gy, 0, H, [hsl(hue, 70, 30), hsl(hue, 70, 12)]); ctx.fillRect(0, gy, W, H - gy);
        ctx.strokeStyle = hsl(hue, 90, 70, 0.25); ctx.lineWidth = 1; for (let x = Math.floor(camX); x < camX + W / s + 1; x++) { ctx.beginPath(); ctx.moveTo(X(x), gy); ctx.lineTo(X(x), H); ctx.stroke(); }
        ctx.fillStyle = hsl(hue, 100, 80); shadowOn(ctx, hsl(hue, 100, 70), 12); ctx.fillRect(0, gy - 2, W, 4); shadowOff(ctx);
        for (const p of pits) { if (X(p[1]) < 0 || X(p[0]) > W) continue; ctx.fillStyle = '#05010d'; ctx.fillRect(X(p[0]), gy - 3, (p[1] - p[0]) * s, H - gy + 3); }
        for (const o of objs) {
          const x = X(o.x); if (x > W + 20 || x < -6 * s) continue;
          if (o.t === 'b') { const y = Y(o.y + o.h); ctx.fillStyle = lgrad(ctx, 0, y, 0, y + o.h * s, [hsl(hue + 200, 60, 30), hsl(hue + 200, 70, 12)]); ctx.fillRect(x, y, o.w * s, o.h * s); ctx.strokeStyle = hsl(hue + 180, 100, 75); ctx.lineWidth = 2; shadowOn(ctx, hsl(hue + 180, 100, 60), 10); ctx.strokeRect(x + 1, y + 1, o.w * s - 2, o.h * s - 2); shadowOff(ctx); for (let i = 0; i < o.w; i++) for (let j = 0; j < o.h; j++) { ctx.strokeStyle = hsl(hue + 180, 100, 75, 0.25); ctx.strokeRect(x + i * s + 6, y + j * s + 6, s - 12, s - 12); } }
          else if (o.t === 's') { const y = Y(o.y); ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + s / 2, y - s * 0.9); ctx.lineTo(x + s - 2, y); ctx.closePath(); ctx.fillStyle = lgrad(ctx, 0, y - s, 0, y, ['#fff', '#94a3b8']); shadowOn(ctx, '#f43f5e', 12); ctx.fill(); shadowOff(ctx); ctx.strokeStyle = '#1e1b4b'; ctx.lineWidth = 2; ctx.stroke(); }
          else if (o.t === 'p') { const y = Y(0); ctx.fillStyle = '#fde047'; shadowOn(ctx, '#fde047', 16); ctx.beginPath(); ctx.ellipse(x + s / 2, y - 4, s * 0.45, s * 0.16, 0, Math.PI, 0); ctx.fill(); shadowOff(ctx); }
        }
        // finish gate
        const fxx = X(length); if (fxx < W + 50) { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(fxx, Y(8) + i * s, s * 0.4, s); } }
        if (!dead) {
          ctx.save(); ctx.translate(X(P.x + 0.5), Y(P.y + 0.5)); ctx.rotate(P.rot);
          const c = s * 0.46; shadowOn(ctx, hsl(hue + 60, 100, 60), 18); ctx.fillStyle = lgrad(ctx, -c, -c, c, c, ['#fde047', '#f97316']); ctx.fillRect(-c, -c, c * 2, c * 2); shadowOff(ctx);
          ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 3; ctx.strokeRect(-c, -c, c * 2, c * 2);
          ctx.fillStyle = '#22d3ee'; ctx.fillRect(-c * 0.6, -c * 0.6, c * 0.45, c * 0.45); ctx.fillRect(c * 0.15, -c * 0.6, c * 0.45, c * 0.45); ctx.fillStyle = '#1c1917'; ctx.fillRect(-c * 0.6, c * 0.25, c * 1.2, c * 0.22);
          ctx.restore();
        }
        ctx.save(); ctx.translate(-camX * s, gy); ctx.scale(s, -s); fx.draw(ctx); ctx.restore();
        // progress bar
        const bw = Math.min(420, W * 0.5); rr(ctx, W / 2 - bw / 2, 18, bw, 14, 7); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, 18, bw * prog, 14, 7); ctx.fillStyle = lgrad(ctx, W / 2 - bw / 2, 0, W / 2 + bw / 2, 0, ['#22d3ee', '#a3e635']); ctx.fill();
        label(ctx, Math.floor(prog * 100) + '%', W / 2 + bw / 2 + 30, 25, 16);
        label(ctx, 'LEVEL ' + level + '  •  ATTEMPT ' + attempt, W / 2, 50, 16, '#e0e7ff');
        if (done) label(ctx, 'LEVEL COMPLETE!', W / 2, H * 0.4, 52, '#fde047');
        if (flash) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.4})`; ctx.fillRect(0, 0, W, H); }
      },
      down() { holding = true; jump(); },
      up() { holding = false; },
      onKey(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') jump(); },
      hud() { return { stats: [['Level', level]] }; }
    };
  }
});
