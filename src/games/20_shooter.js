/* =====================================================================
   SPACE SHOOTER
   ===================================================================== */
registerGame({
  id: 'shooter', title: 'Space Shooter', emoji: '🚀', c1: '#000428', c2: '#004e92', cats: ['Arcade'], hot: true, pop: true,
  desc: 'Pilot the Starhawk through waves of alien fighters. Collect weapon upgrades – spread, laser and homing missiles – and defeat giant bosses!',
  controls: 'Mouse / drag / WASD', scoreLabel: 'SCORE',
  hint: 'Move with mouse or WASD/arrows – firing is automatic. Grab P (power), W (weapon), S (shield), ♥ (repair).', hintTouch: 'Drag anywhere to fly – firing is automatic. Collect upgrades!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), VW = 600, VH = 900;
    const P = { x: 300, y: 780, hp: 3, inv: 0, lvl: 1, wpn: 0, shield: 0, fireT: 0, tx: null, ty: null };
    let view, bullets = [], eb = [], enemies = [], pups = [], wave = 0, score = 0, t = 0, waveT = 1.5, boss = null, stars = [], banner = '', bannerT = 0, drag = null;
    for (let i = 0; i < 120; i++) stars.push({ x: rand(0, VW), y: rand(0, VH), z: rand(0.2, 1) });
    const WPN = ['BLASTER', 'LASER', 'MISSILES'];
    function nextWave() {
      wave++; banner = wave % 5 === 0 ? '⚠ BOSS INCOMING ⚠' : 'WAVE ' + wave; bannerT = 2;
      if (wave % 5 === 0) { const hp = 260 + wave * 70; boss = { x: VW / 2, y: -140, ty: 170, hp, max: hp, t: 0, phase: 0, w: 230, h: 130 }; E.sound('boom'); return; }
      const n = 6 + wave * 2, kinds = ['drone', 'drone', 'diver'].concat(wave > 1 ? ['shooter'] : [], wave > 3 ? ['tank', 'shooter'] : []);
      for (let i = 0; i < n; i++) {
        const k = pick(kinds), hp = { drone: 2, diver: 2, shooter: 4, tank: 14 }[k] + Math.floor(wave / 3);
        enemies.push({ k, x: rand(50, VW - 50), y: -40 - i * 55, hp, max: hp, t: rand(0, TAU), bx: rand(80, VW - 80), shoot: rand(1, 3), r: k === 'tank' ? 34 : 20, stopY: rand(120, 340) });
      }
    }
    function fire() {
      const L = P.lvl;
      if (P.wpn === 0) { const n = Math.min(1 + (L - 1), 5); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.13; bullets.push({ x: P.x, y: P.y - 26, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, dmg: 1, k: 'b' }); } P.fireT = 0.13; E.sound('shoot', 70); }
      else if (P.wpn === 1) { bullets.push({ x: P.x, y: P.y - 30, vx: 0, vy: -1400, dmg: 0.6 + L * 0.35, k: 'l', pierce: true, w: 4 + L * 2 }); P.fireT = 0.07; E.sound('laser', 120); }
      else { const n = 1 + Math.floor(L / 2); for (let i = 0; i < n; i++) bullets.push({ x: P.x + (i % 2 ? 1 : -1) * 18, y: P.y - 10, vx: (i % 2 ? 1 : -1) * 150, vy: -350, dmg: 2 + L * 0.4, k: 'm', life: 3 }); P.fireT = 0.38; E.sound('whoosh', 120); }
    }
    function hurt() {
      if (P.inv > 0) return; if (P.shield > 0) { P.shield = 0; P.inv = 1; E.sound('pop'); return; }
      P.hp--; P.inv = 2; E.sound('crash'); E.shake(12); fx.burst(P.x, P.y, 30, { col: ['#f97316', '#fde047'], spd: 300 }); P.lvl = Math.max(1, P.lvl - 1);
      if (P.hp <= 0) { fx.burst(P.x, P.y, 80, { col: ['#f97316', '#fde047', '#fff'], spd: 450, size: 6 }); E.gameOver({ score, title: 'Ship Destroyed', lines: ['Reached wave ' + wave], delay: 1200 }); }
    }
    function kill(e, i) {
      enemies.splice(i, 1); score += { drone: 100, diver: 150, shooter: 250, tank: 600 }[e.k]; E.sound('boom', 50); fx.burst(e.x, e.y, 26, { col: ['#fb923c', '#fde047', '#f87171', '#fff'], spd: 280, glow: true });
      if (Math.random() < 0.13) pups.push({ x: e.x, y: e.y, k: pick(['P', 'P', 'W', 'S', 'H']) });
    }
    function drawShip(x, y) {
      ctx.save(); ctx.translate(x, y);
      const fl = 14 + Math.sin(t * 40) * 5; ctx.fillStyle = lgrad(ctx, 0, 18, 0, 18 + fl * 2, ['#fde047', 'rgba(249,115,22,0)']); ctx.beginPath(); ctx.moveTo(-8, 18); ctx.lineTo(0, 18 + fl * 2); ctx.lineTo(8, 18); ctx.fill();
      ctx.fillStyle = lgrad(ctx, -30, 0, 30, 0, ['#1e3a8a', '#60a5fa', '#1e3a8a']); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(10, -6); ctx.lineTo(32, 14); ctx.lineTo(30, 22); ctx.lineTo(10, 16); ctx.lineTo(0, 22); ctx.lineTo(-10, 16); ctx.lineTo(-30, 22); ctx.lineTo(-32, 14); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = lgrad(ctx, 0, -18, 0, 4, ['#e0f2fe', '#0ea5e9']); ctx.beginPath(); ctx.ellipse(0, -6, 6, 13, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-31, 10, 4, 10); ctx.fillRect(27, 10, 4, 10);
      ctx.restore();
    }
    function drawEnemy(e) {
      ctx.save(); ctx.translate(e.x, e.y);
      if (e.k === 'tank') { ctx.fillStyle = lgrad(ctx, -34, 0, 34, 0, ['#4c1d95', '#a855f7', '#4c1d95']); ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 30); } ctx.fill(); circle(ctx, 0, 0, 12, '#f0abfc'); ctx.fillStyle = '#1e1b4b'; ctx.fillRect(-20, 18, 8, 16); ctx.fillRect(12, 18, 8, 16); }
      else {
        const col = { drone: ['#065f46', '#34d399'], diver: ['#7f1d1d', '#f87171'], shooter: ['#78350f', '#fbbf24'] }[e.k];
        ctx.fillStyle = lgrad(ctx, 0, -20, 0, 20, [col[1], col[0]]); ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(20, -4); ctx.lineTo(14, -18); ctx.lineTo(0, -10); ctx.lineTo(-14, -18); ctx.lineTo(-20, -4); ctx.closePath(); ctx.fill();
        circle(ctx, 0, 0, 6, '#fff'); circle(ctx, 0, 1, 3, '#111');
      }
      if (e.hp < e.max) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-18, -e.r - 10, 36, 4); ctx.fillStyle = '#4ade80'; ctx.fillRect(-18, -e.r - 10, 36 * e.hp / e.max, 4); }
      ctx.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); bannerT -= dt; P.inv = Math.max(0, P.inv - dt); P.shield = Math.max(0, P.shield - dt);
        for (const s of stars) { s.y += (60 + s.z * 260) * dt; if (s.y > VH) { s.y = 0; s.x = rand(0, VW); } }
        if (P.hp <= 0) return;
        const d = E.dir();
        if (d.mag) { P.x += d.x * 420 * dt; P.y += d.y * 420 * dt; P.tx = null; }
        else if (P.tx !== null) { P.x += (P.tx - P.x) * Math.min(1, dt * 12); P.y += (P.ty - P.y) * Math.min(1, dt * 12); }
        P.x = clamp(P.x, 30, VW - 30); P.y = clamp(P.y, 80, VH - 40);
        P.fireT -= dt; if (P.fireT <= 0) fire();
        if (!enemies.length && !boss) { waveT -= dt; if (waveT <= 0) { nextWave(); waveT = 2; } }
        // bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          if (b.k === 'm') { b.life -= dt; let tg = null, bd = 1e9; for (const e of enemies) { const dd = dist(b.x, b.y, e.x, e.y); if (dd < bd) { bd = dd; tg = e; } } if (boss && dist(b.x, b.y, boss.x, boss.y) < bd) tg = boss; if (tg) { const a = Math.atan2(tg.y - b.y, tg.x - b.x), sp = 620; b.vx += (Math.cos(a) * sp - b.vx) * Math.min(1, dt * 4); b.vy += (Math.sin(a) * sp - b.vy) * Math.min(1, dt * 4); } if (Math.random() < 0.6) fx.burst(b.x, b.y, 1, { col: '#fdba74', spd: 30, life: 0.3, size: 3 }); }
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y < -30 || b.x < -30 || b.x > VW + 30 || (b.life !== undefined && b.life <= 0)) { bullets.splice(i, 1); continue; }
          let hit = false;
          for (let j = enemies.length - 1; j >= 0; j--) { const e = enemies[j]; if (Math.abs(b.x - e.x) < e.r + (b.w || 4) && Math.abs(b.y - e.y) < e.r) { e.hp -= b.dmg * (b.pierce ? dt * 14 : 1); fx.burst(b.x, b.y, 2, { col: '#fff', spd: 90, life: 0.2 }); if (e.hp <= 0) kill(e, j); hit = true; if (!b.pierce) break; } }
          if (boss && boss.y > 60 && Math.abs(b.x - boss.x) < boss.w / 2 && Math.abs(b.y - boss.y) < boss.h / 2) { boss.hp -= b.dmg * (b.pierce ? dt * 14 : 1); hit = true; fx.burst(b.x, b.y, 2, { col: '#fde047', spd: 100, life: 0.2 }); }
          if (hit && !b.pierce) bullets.splice(i, 1);
        }
        // enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i]; e.t += dt;
          if (e.k === 'drone') { e.y += 90 * dt; e.x = e.bx + Math.sin(e.t * 2) * 90; }
          else if (e.k === 'diver') { if (e.y < 160) e.y += 140 * dt; else { const a = Math.atan2(P.y - e.y, P.x - e.x); e.x += Math.cos(a) * 230 * dt; e.y += 280 * dt; } }
          else { if (e.y < e.stopY) e.y += 120 * dt; else e.x += Math.sin(e.t) * 60 * dt; e.shoot -= dt; if (e.shoot <= 0 && e.y > 0) { e.shoot = e.k === 'tank' ? 1.6 : rand(1.4, 2.6); const a = Math.atan2(P.y - e.y, P.x - e.x); if (e.k === 'tank') { for (let k = -2; k <= 2; k++) eb.push({ x: e.x, y: e.y + 20, vx: Math.cos(a + k * 0.2) * 230, vy: Math.sin(a + k * 0.2) * 230 }); } else eb.push({ x: e.x, y: e.y + 16, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280 }); } if (e.t > 18) e.y += 120 * dt; }
          if (e.y > VH + 50) { enemies.splice(i, 1); continue; }
          if (dist(e.x, e.y, P.x, P.y) < e.r + 18) { e.hp = 0; kill(e, i); hurt(); }
        }
        // boss
        if (boss) {
          boss.t += dt; boss.y += (boss.ty - boss.y) * Math.min(1, dt * 1.5); boss.x = VW / 2 + Math.sin(boss.t * 0.7) * 160;
          const ph = boss.hp < boss.max * 0.5 ? 1 : 0;
          if (boss.y > 100) {
            boss.phase -= dt;
            if (boss.phase <= 0) {
              if (ph === 0 || Math.random() < 0.5) { boss.phase = 1.2; const n = 14 + wave; for (let k = 0; k < n; k++) { const a = k / n * TAU + boss.t; eb.push({ x: boss.x, y: boss.y + 40, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170 }); } }
              else { boss.phase = 0.9; for (let k = 0; k < 5; k++) { const a = Math.atan2(P.y - boss.y, P.x - boss.x) + (k - 2) * 0.12; eb.push({ x: boss.x, y: boss.y + 50, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 }); } }
              E.sound('laser', 100);
            }
          }
          if (boss.hp <= 0) { score += 5000 + wave * 500; E.sound('win'); E.shake(18); for (let k = 0; k < 5; k++) fx.burst(boss.x + rand(-90, 90), boss.y + rand(-50, 50), 30, { col: ['#fb923c', '#fde047', '#fff', '#a855f7'], spd: 400, glow: true }); pups.push({ x: boss.x, y: boss.y, k: 'P' }, { x: boss.x - 40, y: boss.y, k: 'H' }); boss = null; banner = 'BOSS DEFEATED!'; bannerT = 2; eb = []; }
          else if (Math.abs(P.x - boss.x) < boss.w / 2 && Math.abs(P.y - boss.y) < boss.h / 2) hurt();
        }
        for (let i = eb.length - 1; i >= 0; i--) { const b = eb[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > VH + 20 || b.y < -40 || b.x < -20 || b.x > VW + 20) { eb.splice(i, 1); continue; } if (dist(b.x, b.y, P.x, P.y) < (P.shield > 0 ? 34 : 12)) { eb.splice(i, 1); hurt(); } }
        for (let i = pups.length - 1; i >= 0; i--) {
          const p = pups[i]; p.y += 120 * dt;
          if (dist(p.x, p.y, P.x, P.y) < 36) {
            pups.splice(i, 1); E.sound('power');
            if (p.k === 'P') { P.lvl = Math.min(5, P.lvl + 1); fx.text(P.x, P.y - 40, 'POWER ' + P.lvl, '#fde047'); }
            else if (p.k === 'W') { P.wpn = (P.wpn + 1) % 3; fx.text(P.x, P.y - 40, WPN[P.wpn], '#7dd3fc'); }
            else if (p.k === 'S') { P.shield = 12; fx.text(P.x, P.y - 40, 'SHIELD', '#22d3ee'); }
            else { P.hp = Math.min(5, P.hp + 1); fx.text(P.x, P.y - 40, 'REPAIR', '#f472b6'); }
          } else if (p.y > VH + 20) pups.splice(i, 1);
        }
      },
      draw() {
        view = E.fit(VW, VH);
        ctx.fillStyle = '#01020a'; ctx.fillRect(0, 0, E.W, E.H);
        view.apply(ctx);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, VH, ['#020617', '#0c1445', '#1e1b4b']); ctx.fillRect(0, 0, VW, VH);
        ctx.globalAlpha = 0.25; ctx.drawImage(E.glow(280), 380, 200, 360, 360); ctx.drawImage(E.glow(200), -120, 500, 320, 320); ctx.globalAlpha = 1;
        for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${s.z})`; ctx.fillRect(s.x, s.y, s.z * 2.4, s.z * 2.4 + s.z * 4); }
        for (const p of pups) { const col = { P: '#f59e0b', W: '#3b82f6', S: '#06b6d4', H: '#ec4899' }[p.k]; shadowOn(ctx, col, 16); circle(ctx, p.x, p.y, 16, col); shadowOff(ctx); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); label(ctx, p.k === 'H' ? '♥' : p.k, p.x, p.y + 1, 16); }
        for (const e of enemies) drawEnemy(e);
        if (boss) {
          ctx.save(); ctx.translate(boss.x, boss.y);
          ctx.fillStyle = lgrad(ctx, -115, 0, 115, 0, ['#450a0a', '#dc2626', '#fca5a5', '#dc2626', '#450a0a']); ctx.beginPath(); ctx.moveTo(-115, -20); ctx.lineTo(-60, -65); ctx.lineTo(60, -65); ctx.lineTo(115, -20); ctx.lineTo(90, 40); ctx.lineTo(40, 65); ctx.lineTo(-40, 65); ctx.lineTo(-90, 40); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#fecaca'; ctx.lineWidth = 2; ctx.stroke();
          const g = 0.6 + 0.4 * Math.sin(t * 6); ctx.globalAlpha = g; ctx.drawImage(E.glow(330), -40, -20, 80, 80); ctx.globalAlpha = 1; circle(ctx, 0, 18, 16, '#fdf4ff'); circle(ctx, 0, 18, 8, '#a21caf');
          for (const s of [-1, 1]) { ctx.fillStyle = '#7f1d1d'; ctx.fillRect(s * 70 - 8, 30, 16, 28); }
          ctx.restore();
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(100, 70, VW - 200, 12); ctx.fillStyle = lgrad(ctx, 100, 0, VW - 100, 0, ['#f43f5e', '#fde047']); ctx.fillRect(100, 70, (VW - 200) * Math.max(0, boss.hp / boss.max), 12); label(ctx, 'MOTHERSHIP', VW / 2, 58, 14, '#fecaca');
        }
        for (const b of bullets) {
          if (b.k === 'l') { shadowOn(ctx, '#22d3ee', 12); ctx.fillStyle = '#a5f3fc'; ctx.fillRect(b.x - b.w / 2, b.y - 26, b.w, 34); shadowOff(ctx); }
          else if (b.k === 'm') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-3, -9, 6, 16); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(0, -15); ctx.lineTo(3, -9); ctx.fill(); ctx.restore(); }
          else { ctx.fillStyle = '#fde68a'; shadowOn(ctx, '#f59e0b', 8); rr(ctx, b.x - 3, b.y - 10, 6, 16, 3); ctx.fill(); shadowOff(ctx); }
        }
        for (const b of eb) { ctx.drawImage(E.glow(320), b.x - 14, b.y - 14, 28, 28); circle(ctx, b.x, b.y, 5, '#fdf4ff'); }
        if (P.hp > 0) {
          if (!(P.inv > 0 && Math.floor(t * 16) % 2)) drawShip(P.x, P.y);
          if (P.shield > 0) { ctx.strokeStyle = `rgba(34,211,238,${0.5 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P.x, P.y, 36, 0, TAU); ctx.stroke(); }
        }
        fx.draw(ctx);
        label(ctx, fmt(score), 18, 28, 22, '#fff', 'left'); label(ctx, '♥'.repeat(Math.max(0, P.hp)), VW - 16, 28, 22, '#f472b6', 'right');
        label(ctx, WPN[P.wpn] + ' Lv' + P.lvl, VW - 16, 56, 14, '#7dd3fc', 'right');
        if (bannerT > 0) label(ctx, banner, VW / 2, VH * 0.42, 40, banner.indexOf('BOSS') >= 0 ? '#f87171' : '#fde047');
        E.endWorld();
      },
      down(x, y) { if (!view) return; const p = view.toWorld(x, y); drag = { x: p.x, y: p.y, px: P.x, py: P.y }; },
      move(x, y) { if (!view) return; const p = view.toWorld(x, y); if (drag && E.ptrDown) { P.tx = clamp(drag.px + (p.x - drag.x) * 1.4, 30, VW - 30); P.ty = clamp(drag.py + (p.y - drag.y) * 1.4, 80, VH - 40); } else if (!E.touch) { P.tx = p.x; P.ty = p.y - 30; } },
      up() { drag = null; },
      hud() { return { stats: [['Wave', wave], ['Best', fmt(E.best())]] }; }
    };
  }
});
