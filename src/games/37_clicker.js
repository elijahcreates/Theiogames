/* =====================================================================
   CLICKER EMPIRE
   ===================================================================== */
registerGame({
  id: 'clicker', title: 'Clicker Empire', emoji: '🏙️', c1: '#00b09b', c2: '#96c93d', cats: ['Simulation', 'Creative'], pop: true,
  desc: 'Start with a lemonade stand and click your way to a galaxy-spanning business empire. Buy businesses, hire managers, earn while you’re away!',
  controls: 'Click / tap', scoreLabel: 'NET WORTH ($)', fmtScore: v => '$' + fmtBig(v),
  hint: 'Click the money button to earn. Buy businesses for automatic income. Progress is saved automatically.', hintTouch: 'Tap to earn. Buy businesses for automatic income. Progress saves automatically.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    const BIZ = [
      { n: 'Lemonade Stand', ic: '🍋', c: 15, r: 0.2 }, { n: 'Food Truck', ic: '🚚', c: 110, r: 1.2 }, { n: 'Coffee Shop', ic: '☕', c: 1200, r: 9 },
      { n: 'Bakery', ic: '🥐', c: 13000, r: 50 }, { n: 'Toy Store', ic: '🧸', c: 140000, r: 270 }, { n: 'Tech Startup', ic: '💻', c: 1.6e6, r: 1500 },
      { n: 'Car Factory', ic: '🏭', c: 2.2e7, r: 8200 }, { n: 'Theme Park', ic: '🎢', c: 3.3e8, r: 46000 }, { n: 'Space Agency', ic: '🚀', c: 5.1e9, r: 260000 }, { n: 'Moon Base', ic: '🌕', c: 7.5e10, r: 1.6e6 }
    ];
    const CLICKUP = [{ n: 'Better Lemons', c: 100, m: 2 }, { n: 'Golden Pitcher', c: 1500, m: 3 }, { n: 'Marketing Team', c: 25000, m: 3 }, { n: 'Viral Video', c: 400000, m: 4 }, { n: 'Global Brand', c: 8e6, m: 5 }, { n: 'Galactic Fame', c: 2e8, m: 6 }];
    const S = Object.assign({ money: 0, total: 0, owned: BIZ.map(() => 0), cl: 0, last: Date.now(), clicks: 0 }, E.data('save', {}));
    if (S.owned.length < BIZ.length) S.owned = BIZ.map((b, i) => S.owned[i] || 0);
    let t = 0, scroll = 0, dragY = null, pulse = 0, saveT = 0, offline = 0, tab = 0, bought = 0;
    const away = Math.min(7200, (Date.now() - (S.last || Date.now())) / 1000);
    const mult = i => { const o = S.owned[i]; return o >= 100 ? 8 : o >= 50 ? 4 : o >= 25 ? 2 : 1; };
    const income = () => BIZ.reduce((s, b, i) => s + b.r * S.owned[i] * mult(i), 0);
    const clickVal = () => { let v = 1; for (let i = 0; i < S.cl; i++) v *= CLICKUP[i].m; return v + income() * 0.02; };
    const cost = i => Math.ceil(BIZ[i].c * Math.pow(1.15, S.owned[i]));
    if (away > 30 && income() > 0) { offline = income() * away * 0.5; S.money += offline; S.total += offline; }
    function earn(v) { S.money += v; S.total += v; if (S.total >= 1e6) E.ach('million'); }
    function save() { S.last = Date.now(); E.save('save', S); E.submitBest(Math.floor(S.total)); }
    function clickMain(x, y) { const v = clickVal(); earn(v); S.clicks++; pulse = 1; E.sound('coin', 30); fx.text(x + rand(-20, 20), y - 30, '+$' + fmtBig(v), '#fde047', 22); fx.burst(x, y, 4, { col: ['#fde047', '#86efac'], spd: 200, shape: 's', grav: 600, size: 6 }); }
    function buy(i) { const c = cost(i); if (S.money < c) { E.sound('error'); return; } S.money -= c; S.owned[i]++; bought++; E.sound('buy'); if ([10, 25, 50, 100].indexOf(S.owned[i]) >= 0) { E.toast(BIZ[i].ic + ' ' + BIZ[i].n + ' managers hired – profits ×' + mult(i) + '!'); E.sound('rare'); } save(); }
    function buyClick() { const u = CLICKUP[S.cl]; if (!u || S.money < u.c) { E.sound('error'); return; } S.money -= u.c; S.cl++; E.sound('power'); save(); }
    function era() { const top = S.owned.reduce((m, o, i) => o ? i : m, -1); return top; }
    function layout() { const W = E.W, H = E.H, wide = W > H * 1.1; return wide ? { cx: W * 0.3, cy: H * 0.5, R: Math.min(W * 0.16, H * 0.22), lx: W * 0.56, ly: 70, lw: W * 0.42, lh: H - 90 } : { cx: W / 2, cy: H * 0.27, R: Math.min(W * 0.24, H * 0.13), lx: 12, ly: H * 0.47, lw: W - 24, lh: H * 0.53 - 10 }; }
    return {
      update(dt) {
        t += dt; fx.update(dt); pulse = Math.max(0, pulse - dt * 6); earn(income() * dt);
        saveT += dt; if (saveT > 5) { saveT = 0; save(); }
        if (offline > 0 && t > 0.3) { E.toast('💤 Welcome back! You earned $' + fmtBig(offline) + ' while away'); offline = 0; }
      },
      draw() {
        const W = E.W, H = E.H, L = layout(); ui.clear();
        const e = era();
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, e >= 8 ? ['#020617', '#1e1b4b'] : e >= 5 ? ['#0c4a6e', '#38bdf8'] : ['#7dd3fc', '#e0f2fe']); ctx.fillRect(0, 0, W, H);
        if (e >= 8) for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect((i * 137) % W, (i * 71) % H, 2, 2); }
        // skyline grows with owned businesses
        const gy = H * (W > H * 1.1 ? 0.92 : 0.44); let x = 0, k = 0;
        BIZ.forEach((b, i) => { const n = Math.min(6, Math.ceil(S.owned[i] / 5)); for (let j = 0; j < n; j++) { const bw = 30 + i * 4, bh = 30 + i * 22 + (j * 13) % 25; const bx = ((k * 53) % (W + 40)) - 20; k++; ctx.fillStyle = hsl(200 + i * 15, 20, 30 + (j % 3) * 6, 0.85); ctx.fillRect(bx, gy - bh, bw, bh); ctx.fillStyle = 'rgba(253,224,71,.6)'; for (let wy = gy - bh + 8; wy < gy - 8; wy += 12) for (let wx = bx + 5; wx < bx + bw - 6; wx += 9) if ((wx * wy) % 7 > 2) ctx.fillRect(wx, wy, 4, 5); } });
        ctx.fillStyle = '#334155'; ctx.fillRect(0, gy, W, 6);
        // money
        label(ctx, '$' + fmtBig(S.money), L.cx, Math.max(46, L.cy - L.R - 70), Math.min(48, W * 0.08), '#fde047');
        label(ctx, '$' + fmtBig(income()) + ' / sec   •   $' + fmtBig(clickVal()) + ' / click', L.cx, Math.max(84, L.cy - L.R - 30), 16, '#fff');
        // main button
        const R = L.R * (1 + pulse * 0.06);
        ctx.drawImage(E.glow(50), L.cx - R * 1.8, L.cy - R * 1.8, R * 3.6, R * 3.6);
        shadowOn(ctx, 'rgba(0,0,0,.4)', 24, 0, 10); circle(ctx, L.cx, L.cy, R, rgrad(ctx, L.cx - R * 0.3, L.cy - R * 0.3, R * 0.1, R, ['#fef9c3', '#facc15', '#a16207'])); shadowOff(ctx);
        ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(L.cx, L.cy, R * 0.86, 0, TAU); ctx.stroke();
        txt(ctx, '$', L.cx, L.cy + R * 0.05, R * 1.1, '#854d0e', 'center', 900);
        ui.zone('main', L.cx - R, L.cy - R, R * 2, R * 2);
        // panel
        rr(ctx, L.lx, L.ly, L.lw, L.lh, 18); ctx.fillStyle = 'rgba(15,23,42,.82)'; ctx.fill();
        ui.btn(ctx, 'tab0', L.lx + 10, L.ly + 10, L.lw / 2 - 15, 38, '🏢 Businesses', { cols: tab === 0 ? ['#22c55e', '#15803d'] : ['#475569', '#334155'], size: 15 });
        ui.btn(ctx, 'tab1', L.lx + L.lw / 2 + 5, L.ly + 10, L.lw / 2 - 15, 38, '👆 Click Upgrades', { cols: tab === 1 ? ['#22c55e', '#15803d'] : ['#475569', '#334155'], size: 15 });
        ctx.save(); ctx.beginPath(); ctx.rect(L.lx, L.ly + 56, L.lw, L.lh - 62); ctx.clip();
        const rh = 66, items = tab === 0 ? BIZ.length : CLICKUP.length; const maxS = Math.max(0, items * (rh + 8) - (L.lh - 70)); scroll = clamp(scroll, 0, maxS);
        for (let i = 0; i < items; i++) {
          const y = L.ly + 62 + i * (rh + 8) - scroll; if (y > L.ly + L.lh || y + rh < L.ly + 50) continue;
          if (tab === 0) {
            const b = BIZ[i], c = cost(i), can = S.money >= c, locked = i > 0 && S.owned[i - 1] === 0 && S.owned[i] === 0;
            rr(ctx, L.lx + 10, y, L.lw - 20, rh, 14); ctx.fillStyle = locked ? 'rgba(255,255,255,.04)' : can ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.08)'; ctx.fill();
            E.emoji(ctx, locked ? '🔒' : b.ic, L.lx + 42, y + rh / 2, 34);
            txt(ctx, locked ? '???' : b.n, L.lx + 70, y + 22, 16, '#fff', 'left', 800);
            txt(ctx, locked ? 'Buy the previous business first' : '$' + fmtBig(b.r * mult(i)) + '/s each' + (mult(i) > 1 ? ' (×' + mult(i) + ')' : '') + ' • owned ' + S.owned[i], L.lx + 70, y + 46, 12, '#cbd5e1', 'left', 600);
            if (!locked) ui.btn(ctx, 'b' + i, L.lx + L.lw - 130, y + 12, 110, rh - 24, '$' + fmtBig(c), { cols: can ? ['#facc15', '#ca8a04'] : ['#64748b', '#475569'], color: can ? '#422006' : '#e2e8f0', size: 15 });
          } else {
            const u = CLICKUP[i], done = i < S.cl, next = i === S.cl, can = next && S.money >= u.c;
            rr(ctx, L.lx + 10, y, L.lw - 20, rh, 14); ctx.fillStyle = done ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.08)'; ctx.fill();
            E.emoji(ctx, done ? '✅' : next ? '⭐' : '🔒', L.lx + 42, y + rh / 2, 30);
            txt(ctx, u.n, L.lx + 70, y + 22, 16, '#fff', 'left', 800); txt(ctx, 'Click power ×' + u.m, L.lx + 70, y + 46, 12, '#cbd5e1', 'left', 600);
            if (next) ui.btn(ctx, 'u', L.lx + L.lw - 130, y + 12, 110, rh - 24, '$' + fmtBig(u.c), { cols: can ? ['#facc15', '#ca8a04'] : ['#64748b', '#475569'], color: can ? '#422006' : '#e2e8f0', size: 15 });
          }
        }
        ctx.restore();
        fx.draw(ctx);
      },
      down(x, y) { const b = ui.hit(x, y); dragY = { y, s: scroll, moved: false, b }; },
      move(x, y) { if (dragY && E.ptrDown) { if (Math.abs(y - dragY.y) > 8) dragY.moved = true; if (dragY.moved && dragY.b !== 'main') scroll = dragY.s - (y - dragY.y); } },
      up(x, y) { if (!dragY) return; const b = dragY.b, moved = dragY.moved; dragY = null; if (moved && b !== 'main') return; if (b === 'main') clickMain(x, y); else if (b === 'tab0') tab = 0; else if (b === 'tab1') tab = 1; else if (b === 'u') buyClick(); else if (b && b[0] === 'b') buy(+b.slice(1)); },
      wheel(d) { scroll += d; },
      onKey(c) { if (c === 'Space') { const L = layout(); clickMain(L.cx, L.cy); } },
      destroy() { save(); },
      hud() { return null; }
    };
  }
});
