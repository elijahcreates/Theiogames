/* =====================================================================
   FLAPPY CHALLENGE
   ===================================================================== */
registerGame({
  id: 'flappy', title: 'Flappy Challenge', emoji: '🐤', c1: '#4facfe', c2: '#00f2fe', cats: ['Arcade', 'Endless'], pop: true,
  desc: 'Guide Pip the puffball through crystal pillars with simple taps. Day turns to night as the gaps get trickier!',
  controls: 'Tap / Space', scoreLabel: 'PILLARS',
  hint: 'Click or press SPACE to flap. Fly through the gaps!', hintTouch: 'Tap to flap. Fly through the gaps!',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    const bird = { x: 0, y: 0, vy: 0, rot: 0, flap: 0 };
    let pipes = [], score = 0, started = false, dead = false, t = 0, dist2 = 0, groundOff = 0, nextX = 0;
    const G = 1700, FLAP = -520;
    function H() { return E.H; }
    const gy = () => E.H - 90;
    function reset() { bird.x = E.W * 0.3; bird.y = E.H * 0.42; nextX = E.W + 100; }
    reset();
    function addPipe() {
      const lvl = Math.min(1, score / 40), gap = lerp(190, 135, lvl), minY = 110, maxY = gy() - gap - 60;
      const y = rand(minY, Math.max(minY + 10, maxY));
      pipes.push({ x: nextX, top: y, gap, passed: false, move: score > 15 && Math.random() < 0.35 ? rand(30, 60) : 0, ph: rand(0, TAU), base: y });
      nextX += lerp(270, 230, lvl);
    }
    function die() { if (dead) return; dead = true; E.sound('crash'); E.shake(10); fx.burst(bird.x, bird.y, 30, { col: ['#fde047', '#fb923c', '#fff'], spd: 260, shape: 's' });
      const medal = score >= 40 ? '💎 Diamond' : score >= 25 ? '🥇 Gold' : score >= 10 ? '🥈 Silver' : score >= 5 ? '🥉 Bronze' : 'None yet';
      E.gameOver({ score, title: 'Bonk!', lines: ['Medal: ' + medal], delay: 900 }); }
    function drawBird(x, y, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ellipse(ctx, 0, 0, 22, 19, lgrad(ctx, 0, -19, 0, 19, ['#fff59d', '#fbbf24']));
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 22, 19, 0, 0, TAU); ctx.stroke();
      ellipse(ctx, 4, 6, 12, 8, '#fffbeb');
      // wing
      const wf = Math.sin(bird.flap * 30) * 8;
      ctx.beginPath(); ctx.ellipse(-8, 2 + wf * 0.4, 11, 7 - Math.abs(wf) * 0.3, -0.4 + wf * 0.05, 0, TAU); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.stroke();
      circle(ctx, 9, -7, 7, '#fff'); ctx.stroke(); circle(ctx, 11, -7, 3.4, '#1f2937'); circle(ctx, 12, -8.5, 1.2, '#fff');
      ctx.beginPath(); ctx.moveTo(17, -1); ctx.quadraticCurveTo(30, 2, 18, 7); ctx.closePath(); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.stroke();
      ellipse(ctx, 4, 5, 4, 2.5, 'rgba(244,114,182,.6)');
      ctx.beginPath(); ctx.moveTo(-2, -18); ctx.quadraticCurveTo(2, -28, 6, -18); ctx.fillStyle = '#f59e0b'; ctx.fill();
      ctx.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); bird.flap = Math.max(0, bird.flap - dt);
        if (!started) { bird.y = E.H * 0.42 + Math.sin(t * 4) * 10; groundOff += 150 * dt; return; }
        if (dead) { if (bird.y < gy() - 18) { bird.vy += G * dt; bird.y += bird.vy * dt; bird.rot = Math.min(1.5, bird.rot + dt * 6); } return; }
        const sp = 170 + Math.min(70, score * 2);
        bird.vy += G * dt; bird.y += bird.vy * dt; bird.rot = clamp(bird.vy / 700, -0.5, 1.3);
        dist2 += sp * dt; groundOff += sp * dt; nextX -= sp * dt;
        while (nextX < E.W + 300) addPipe();
        for (const p of pipes) {
          p.x -= sp * dt; if (p.move) p.top = p.base + Math.sin(t * 1.6 + p.ph) * p.move;
          if (!p.passed && p.x + 40 < bird.x) { p.passed = true; score++; E.sound('score'); fx.burst(bird.x, bird.y, 8, { col: '#fff', shape: 'star', spd: 120 }); }
          if (bird.x + 16 > p.x - 38 && bird.x - 16 < p.x + 38 && (bird.y - 15 < p.top || bird.y + 15 > p.top + p.gap)) die();
        }
        pipes = pipes.filter(p => p.x > -100);
        if (bird.y > gy() - 18) { bird.y = gy() - 18; die(); }
        if (bird.y < -40) bird.y = -40;
      },
      draw() {
        const W = E.W, Hh = E.H, night = clamp((Math.sin(score / 12 * Math.PI - Math.PI / 2) + 1) / 2, 0, 1);
        const sky1 = night > 0.5 ? '#0b1d4d' : '#5ec8ff', sky2 = night > 0.5 ? '#3b2a6b' : '#c8f1ff';
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, Hh, [sky1, sky2]); ctx.fillRect(0, 0, W, Hh);
        if (night > 0.5) { for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 3 + i)})`; ctx.fillRect((i * 137) % W, (i * 71) % (Hh * 0.6), 2, 2); } circle(ctx, W * 0.8, 90, 34, '#f8fafc'); circle(ctx, W * 0.8 + 12, 82, 30, sky1); }
        else { ctx.drawImage(E.glow(50), W * 0.8 - 90, 0, 180, 180); circle(ctx, W * 0.8, 90, 40, '#fff7c2'); }
        // far mountains
        for (let layer = 0; layer < 2; layer++) {
          const par = layer ? 0.35 : 0.15, base = gy() - (layer ? 40 : 110), col = night > 0.5 ? (layer ? '#26315c' : '#1c2448') : (layer ? '#7cc8a4' : '#a8dcd1');
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, gy());
          for (let x = 0; x <= W + 40; x += 40) { const wx = x + groundOff * par; ctx.lineTo(x, base - Math.abs(Math.sin(wx * 0.006 + layer)) * (layer ? 60 : 110) - Math.sin(wx * 0.021) * 12); }
          ctx.lineTo(W, gy()); ctx.fill();
        }
        // clouds
        for (let i = 0; i < 6; i++) { const cx = ((i * 260 - groundOff * 0.25) % (W + 260) + W + 260) % (W + 260) - 130, cy = 60 + (i % 3) * 50; ctx.fillStyle = night > 0.5 ? 'rgba(200,200,255,.15)' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.arc(cx + 26, cy - 10, 28, 0, TAU); ctx.arc(cx + 56, cy, 20, 0, TAU); ctx.fill(); }
        // crystal pillars
        for (const p of pipes) {
          const x = p.x - 38, w = 76;
          for (const [y0, y1, top] of [[-20, p.top, true], [p.top + p.gap, gy(), false]]) {
            const g = lgrad(ctx, x, 0, x + w, 0, ['#7c3aed', '#c084fc', '#e9d5ff', '#a855f7', '#6d28d9']);
            ctx.fillStyle = g; ctx.fillRect(x, y0, w, y1 - y0);
            ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 12, y0, 8, y1 - y0);
            const capY = top ? y1 - 28 : y0; rr(ctx, x - 8, capY, w + 16, 28, 8); ctx.fillStyle = lgrad(ctx, x, 0, x + w, 0, ['#5b21b6', '#ddd6fe', '#7c3aed']); ctx.fill();
            ctx.strokeStyle = 'rgba(46,16,101,.6)'; ctx.lineWidth = 2; ctx.stroke();
            // crystal tips
            ctx.fillStyle = '#f5d0fe'; for (let k = 0; k < 3; k++) { const tx = x + 10 + k * 26; ctx.beginPath(); if (top) { ctx.moveTo(tx, capY + 28); ctx.lineTo(tx + 9, capY + 40); ctx.lineTo(tx + 18, capY + 28); } else { ctx.moveTo(tx, capY); ctx.lineTo(tx + 9, capY - 12); ctx.lineTo(tx + 18, capY); } ctx.fill(); }
          }
        }
        // ground
        ctx.fillStyle = '#6ab04c'; ctx.fillRect(0, gy(), W, 18); ctx.fillStyle = lgrad(ctx, 0, gy() + 18, 0, Hh, ['#d4a373', '#a47148']); ctx.fillRect(0, gy() + 18, W, Hh);
        ctx.fillStyle = '#4e8a36'; for (let x = -(groundOff % 30); x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, gy() + 18); ctx.lineTo(x + 15, gy()); ctx.lineTo(x + 30, gy() + 18); ctx.fill(); }
        drawBird(bird.x, bird.y, bird.rot);
        fx.draw(ctx);
        label(ctx, String(score), W / 2, 70, 60);
        if (!started) { label(ctx, 'Flappy Challenge', W / 2, Hh * 0.22, 40, '#fff59d'); label(ctx, E.touch ? 'TAP TO FLAP' : 'CLICK / SPACE TO FLAP', W / 2, Hh * 0.62, 24); }
      },
      down() { if (dead) return; if (!started) started = true; bird.vy = FLAP; bird.flap = 0.25; E.sound('jump', 30); fx.burst(bird.x - 14, bird.y + 6, 4, { col: '#fff', spd: 60, size: 3 }); },
      onKey(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') this.down(); },
      resize() { if (!started) reset(); else bird.x = E.W * 0.3; },
      hud() { return { stats: [['Best', fmt(E.best())]] }; }
    };
  }
});
