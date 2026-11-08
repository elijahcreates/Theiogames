/* =====================================================================
   FISHING FRENZY
   ===================================================================== */
registerGame({
  id: 'fishing', title: 'Fishing Frenzy', emoji: '🎣', c1: '#2193b0', c2: '#6dd5ed', cats: ['Simulation', 'Arcade', 'Creative'], isNew: true,
  desc: 'Cast your line in a calm lake, the open ocean, frozen arctic waters and the mysterious abyss. Reel in 32 kinds of fish, upgrade your gear and hunt the legendary catches!',
  controls: 'Hold & release to cast • hold to reel', scoreLabel: 'BEST CATCH ($)', fmtScore: v => '$' + fmtBig(v),
  hint: 'Hold & release to cast. Tap to start reeling up. When a fish bites: HOLD to reel, release when tension gets too high!', hintTouch: 'Hold & release to cast • tap to reel up • when hooked: hold to reel, let go when the line gets tight!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI();
    const LOC = [
      { n: 'Willow Lake', cost: 0, sky: ['#7dd3fc', '#e0f2fe'], water: ['#0ea5e9', '#075985', '#082f49'], fish: [['Minnow', 1, 8, '#94a3b8', 0.7], ['Perch', 1, 15, '#84cc16', 0.85], ['Bluegill', 1, 20, '#3b82f6', 0.9], ['Trout', 2, 45, '#f97316', 1.1], ['Bass', 2, 60, '#15803d', 1.3], ['Catfish', 3, 140, '#78716c', 1.6], ['Pike', 3, 220, '#65a30d', 1.8], ['Golden Koi', 4, 900, '#fbbf24', 1.5]] },
      { n: 'Sunny Ocean', cost: 1500, sky: ['#38bdf8', '#fef9c3'], water: ['#06b6d4', '#0e7490', '#164e63'], fish: [['Sardine', 1, 25, '#cbd5e1', 0.7], ['Clownfish', 1, 40, '#f97316', 0.8], ['Mackerel', 2, 90, '#2563eb', 1.1], ['Snapper', 2, 140, '#ef4444', 1.2], ['Tuna', 3, 380, '#1e3a8a', 1.9], ['Swordfish', 3, 600, '#475569', 2.1], ['Manta Ray', 3, 700, '#334155', 2.0], ['Rainbow Marlin', 4, 3000, '#ec4899', 2.2]] },
      { n: 'Arctic Ice', cost: 8000, sky: ['#cbd5e1', '#f8fafc'], water: ['#67e8f9', '#0891b2', '#083344'], fish: [['Ice Cod', 1, 120, '#e2e8f0', 1.0], ['Char', 1, 160, '#fb7185', 1.0], ['Halibut', 2, 400, '#a8a29e', 1.4], ['Snow Crab', 2, 500, '#f97316', 1.1], ['Narwhal Pup', 3, 1500, '#94a3b8', 2.0], ['Frost Eel', 3, 2000, '#38bdf8', 1.8], ['Walrus Fish', 3, 2600, '#78350f', 2.3], ['Aurora Fish', 4, 12000, '#a855f7', 1.9]] },
      { n: 'The Abyss', cost: 40000, sky: ['#1e1b4b', '#4c1d95'], water: ['#312e81', '#1e1b4b', '#020617'], fish: [['Lanternfish', 1, 600, '#facc15', 1.0], ['Gulper', 2, 1500, '#111827', 1.4], ['Viperfish', 2, 2200, '#334155', 1.5], ['Anglerfish', 3, 6000, '#4b5563', 1.8], ['Giant Squid', 3, 9000, '#be123c', 2.4], ['Ghost Shark', 3, 14000, '#cbd5e1', 2.5], ['Crystal Jelly', 3, 11000, '#c4b5fd', 1.6], ['Leviathan', 4, 80000, '#22d3ee', 2.8]] }
    ];
    const RARN = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'], RARC = ['', '#cbd5e1', '#4ade80', '#60a5fa', '#fbbf24'];
    const S = Object.assign({ money: 0, loc: 0, owned: [0], rod: 0, line: 0, lure: 0, book: {}, best: 0, catches: 0 }, E.data('save', {}));
    let fish = [], state = 'idle', power = 0, charging = false, hook = { x: 0, y: 0, vx: 0, vy: 0 }, hooked = null, tension = 0.3, prog = 0, t = 0, msg = '', msgT = 0, holding = false, catchShow = null, bubbles = [];
    const maxDepth = () => 300 + S.rod * 170, lineStr = () => 1 + S.line * 0.25;
    const loc = () => LOC[S.loc];
    function save() { E.save('save', S); }
    function spawnFish() {
      const L = loc(), luck = S.lure;
      let tot = 0; const w = L.fish.map(f => { const v = f[1] === 1 ? 50 : f[1] === 2 ? 25 + luck * 3 : f[1] === 3 ? 9 + luck * 3 : 1.2 + luck * 0.8; tot += v; return v; });
      let r = Math.random() * tot, i = 0; for (; i < w.length; i++) { r -= w[i]; if (r <= 0) break; } i = Math.min(i, w.length - 1);
      const f = L.fish[i], depth = 80 + (f[1] - 1) * 140 + rand(0, 160), dir = Math.random() < 0.5 ? 1 : -1;
      fish.push({ def: f, idx: i, x: dir > 0 ? -60 : E.W / sc() + 60, y: depth, dir, sp: rand(30, 60) + f[1] * 8, size: 14 + f[4] * 10, ph: rand(0, TAU) });
    }
    const sc = () => Math.min(1.2, E.W / 900);
    const surf = () => E.H * 0.3;
    function cast() { state = 'cast'; const p = clamp(power, 0.15, 1); hook.x = boatX() + 40; hook.y = -40; hook.vx = 120 + p * 380; hook.vy = -220; E.sound('whoosh'); power = 0; }
    const boatX = () => (E.W / sc()) * 0.18;
    function bite(f) { hooked = f; f.d0 = Math.max(40, hook.y); state = 'fight'; tension = 0.35; prog = 0.15; E.sound('bounce'); msg = '🐟 FISH ON! Hold to reel!'; msgT = 1.5; E.shake(5); }
    function landFish() {
      const f = hooked.def, val = Math.round(f[2] * rand(0.85, 1.25)); S.money += val; S.catches++; const key = S.loc + ':' + hooked.idx, isNew = !S.book[key]; S.book[key] = (S.book[key] || 0) + 1;
      if (val > S.best) { S.best = val; E.submitBest(val); }
      if (f[1] === 4) { E.ach('rare'); E.sound('rare'); } else E.sound('win');
      catchShow = { f, val, isNew, t: 0 }; fish.splice(fish.indexOf(hooked), 1); hooked = null; state = 'idle'; save();
      fx.burst(boatX() * sc(), surf(), 30, { col: ['#fde047', '#fff', f[3]], spd: 260, shape: 'star' });
    }
    function lose(why) { msg = why; msgT = 2; E.sound('bad'); if (hooked) { hooked.dir *= -1; hooked.sp *= 2; hooked.flee = 3; } hooked = null; state = 'reel'; }
    function openShop() {
      const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span><span>🐟 ${Object.keys(S.book).length}/32 species</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid';
      const mk = (title, sub, btn, dis, fn) => { const el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4>${title}</h4><small>${sub}</small>`; const b = document.createElement('button'); b.textContent = btn; b.disabled = dis; b.onclick = () => { fn(); save(); openShop(); }; el.appendChild(b); grid.appendChild(el); };
      const rc = 100 * Math.pow(3, S.rod), lc = 80 * Math.pow(3, S.line), uc = 150 * Math.pow(3.2, S.lure);
      mk('🎣 Longer Rod <span class="lv">Lv ' + S.rod + '</span>', 'Fish deeper: ' + maxDepth() + 'm → ' + (maxDepth() + 170) + 'm', S.rod >= 5 ? 'MAX' : '$' + fmtBig(rc), S.money < rc || S.rod >= 5, () => { S.money -= rc; S.rod++; E.sound('buy'); });
      mk('🧵 Stronger Line <span class="lv">Lv ' + S.line + '</span>', 'Wider safe tension zone', S.line >= 5 ? 'MAX' : '$' + fmtBig(lc), S.money < lc || S.line >= 5, () => { S.money -= lc; S.line++; E.sound('buy'); });
      mk('✨ Shiny Lure <span class="lv">Lv ' + S.lure + '</span>', 'Rarer fish bite more often', S.lure >= 5 ? 'MAX' : '$' + fmtBig(uc), S.money < uc || S.lure >= 5, () => { S.money -= uc; S.lure++; E.sound('buy'); });
      LOC.forEach((L, i) => { const own = S.owned.includes(i); mk('🗺️ ' + L.n + (S.loc === i ? ' <span class="lv">HERE</span>' : ''), L.fish.map(f => f[0]).slice(0, 3).join(', ') + '…', own ? (S.loc === i ? 'Fishing here' : 'Travel') : 'Unlock $' + fmtBig(L.cost), own ? S.loc === i : S.money < L.cost, () => { if (!own) { S.money -= L.cost; S.owned.push(i); E.sound('rare'); } S.loc = i; fish = []; E.panel.close(); }); });
      g.appendChild(grid);
      const bk = document.createElement('div'); bk.innerHTML = '<h3 style="margin:12px 0 6px">📖 Fish Book</h3>' + LOC.map((L, li) => `<div style="margin-bottom:6px"><b>${L.n}</b><br>${L.fish.map((f, fi) => S.book[li + ':' + fi] ? `<span style="color:${RARC[f[1]]};font-size:.85rem">${f[0]} ×${S.book[li + ':' + fi]}</span>` : '<span style="color:#64748b;font-size:.85rem">???</span>').join(' • ')}</div>`).join(''); g.appendChild(bk);
      E.panel.open('🎣 Tackle Shop & Map', g);
    }
    const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))';
    const sb = document.createElement('button'); sb.className = 'btn primary'; sb.style.padding = '10px 16px'; sb.textContent = '🛒 Shop & Map'; sb.onclick = e => { e.stopPropagation(); openShop(); }; bar.appendChild(sb); E.layer.appendChild(bar);
    for (let i = 0; i < 6; i++) spawnFish();
    function drawFish(f, x, y, s, dir, tt) {
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); const w = s, wag = Math.sin(tt * 10 + f.ph) * 0.25, col = f.def[3], name = f.def[0];
      if (f.def[1] === 4) { ctx.globalAlpha = 0.5; ctx.drawImage(E.glow((tt * 60) % 360), -w * 2, -w * 2, w * 4, w * 4); ctx.globalAlpha = 1; }
      if (name.indexOf('Squid') >= 0 || name.indexOf('Jelly') >= 0) { for (let i = 0; i < 5; i++) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.3 + i * w * 0.15, w * 0.2); ctx.quadraticCurveTo(-w * 0.6 + i * w * 0.2, w * 0.8 + Math.sin(tt * 4 + i) * 5, -w * 0.8 + i * w * 0.25, w * 1.2); ctx.stroke(); } ellipse(ctx, 0, 0, w * 0.7, w * 0.5, col); }
      else if (name.indexOf('Ray') >= 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(w, 0); ctx.quadraticCurveTo(0, -w * 1.2 + wag * 10, -w * 0.6, 0); ctx.quadraticCurveTo(0, w * 1.2 - wag * 10, w, 0); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.6, 0); ctx.lineTo(-w * 1.5, wag * 10); ctx.stroke(); }
      else if (name.indexOf('Crab') >= 0) { ellipse(ctx, 0, 0, w * 0.7, w * 0.45, col); for (const sd of [-1, 1]) { circle(ctx, sd * w * 0.8, -w * 0.3, w * 0.25, col); } }
      else {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w * 0.8, 0); ctx.lineTo(-w * 1.35, -w * 0.45 + wag * w * 0.4); ctx.lineTo(-w * 1.3, w * 0.45 + wag * w * 0.4); ctx.closePath(); ctx.fill();
        const elong = name.match(/Eel|Pike|Sword|Marlin|Viper|Narwhal/) ? 1.6 : 1;
        ctx.beginPath(); ctx.ellipse(0, 0, w * elong, w * 0.55, 0, 0, TAU); ctx.fillStyle = lgrad(ctx, 0, -w * 0.5, 0, w * 0.5, ['#fff', col, col]); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.moveTo(-w * 0.2, -w * 0.5); ctx.quadraticCurveTo(w * 0.1, -w * 0.95, w * 0.4, -w * 0.45); ctx.fill();
        if (name.match(/Sword|Marlin|Narwhal/)) { ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * elong, 0); ctx.lineTo(w * elong + w, -w * 0.1); ctx.stroke(); }
        if (name.match(/Clown/)) { ctx.fillStyle = '#fff'; ctx.fillRect(-w * 0.2, -w * 0.5, w * 0.18, w); ctx.fillRect(w * 0.4, -w * 0.45, w * 0.15, w * 0.9); }
        if (name.match(/Angler|Lantern/)) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.6, -w * 0.4); ctx.quadraticCurveTo(w * 1.2, -w * 1.2, w * 1.3, -w * 0.6); ctx.stroke(); ctx.drawImage(E.glow(55), w * 1.3 - 12, -w * 0.6 - 12, 24, 24); }
        circle(ctx, w * elong * 0.55, -w * 0.12, w * 0.14, '#fff'); circle(ctx, w * elong * 0.58, -w * 0.12, w * 0.07, '#111');
      }
      ctx.restore();
    }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; if (catchShow) { catchShow.t += dt; if (catchShow.t > 2.6) catchShow = null; }
        if (charging) power = Math.min(1, power + dt * 0.9);
        const W = E.W / sc();
        if (fish.length < 7 && Math.random() < dt * 0.8) spawnFish();
        for (const f of fish) { if (f === hooked) continue; f.x += f.dir * f.sp * dt; f.y += Math.sin(t * 1.5 + f.ph) * 8 * dt; if (f.flee) { f.flee -= dt; } if (f.x < -120 || f.x > W + 120) f.gone = true; }
        fish = fish.filter(f => !f.gone);
        if (state === 'cast') { hook.vy += 600 * dt; hook.x += hook.vx * dt; hook.y += hook.vy * dt; if (hook.y > 0) { hook.y = 0; state = 'sink'; E.sound('splash'); fx.burst(hook.x * sc(), surf(), 12, { col: ['#bae6fd', '#fff'], spd: 120, up: 80 }); } }
        else if (state === 'sink' || state === 'reel') {
          hook.y += (state === 'sink' ? 70 : -120 * (holding ? 1.6 : 1)) * dt; if (state === 'sink' && hook.y >= maxDepth()) { hook.y = maxDepth(); state = 'reel'; }
          hook.x += ((boatX() + 40) - hook.x) * dt * (state === 'reel' ? 0.6 : 0.05);
          if (hook.y <= 0) { state = 'idle'; }
          for (const f of fish) { if (f.flee > 0) continue; if (Math.abs(f.x - hook.x) < f.size + 14 && Math.abs(f.y - hook.y) < f.size * 0.6 + 14) { const chance = 0.6 + S.lure * 0.06 - (f.def[1] - 1) * 0.12; if (Math.random() < chance * dt * 6) { bite(f); break; } } }
        } else if (state === 'fight') {
          const f = hooked, power2 = f.def[4], safe = 0.28 * lineStr();
          const pull = (0.25 + Math.sin(t * (2 + power2) + f.ph) * 0.5 + (Math.random() < dt * 1.5 ? 1.2 : 0)) * power2 * 0.35;
          tension += ((holding ? 0.9 : -0.8) + pull * (holding ? 1 : 0.4)) * dt; tension = clamp(tension, 0, 1);
          const lo = 0.5 - safe / 2 - 0.05, hi = 0.5 + safe / 2 + 0.1;
          if (tension > lo && tension < hi) prog += dt * (holding ? 0.28 : 0.06) / Math.sqrt(power2); else prog -= dt * 0.08;
          if (holding) { E.sound('reel', 60); }
          hook.y = f.d0 * (1 - clamp(prog, 0, 1)) + 10; f.x = hook.x + Math.sin(t * 6) * 8; f.y = hook.y;
          if (tension >= 1) lose('💥 The line snapped!'); else if (prog <= 0) lose('The fish got away…'); else if (prog >= 1) landFish();
        }
      },
      draw() {
        const W = E.W, H = E.H, s = sc(), L = loc(), sy = surf();
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, sy, L.sky); ctx.fillRect(0, 0, W, sy + 2);
        if (S.loc === 3) { for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect((i * 137) % W, (i * 71) % sy, 2, 2); } } else { ctx.drawImage(E.glow(50), W * 0.75 - 70, sy * 0.3 - 70, 140, 140); circle(ctx, W * 0.75, sy * 0.3, 30, '#fef08a'); }
        if (S.loc === 2) { ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(W * 0.5, sy); ctx.lineTo(W * 0.62, sy * 0.45); ctx.lineTo(W * 0.7, sy * 0.7); ctx.lineTo(W * 0.85, sy * 0.35); ctx.lineTo(W, sy); ctx.fill(); }
        else if (S.loc < 2) { ctx.fillStyle = S.loc ? '#fde68a' : '#4d7c0f'; ctx.beginPath(); ctx.moveTo(W * 0.55, sy); ctx.quadraticCurveTo(W * 0.8, sy * 0.55, W, sy * 0.7); ctx.lineTo(W, sy); ctx.fill(); if (!S.loc) { for (let i = 0; i < 4; i++) { ctx.fillStyle = '#166534'; circle(ctx, W * (0.68 + i * 0.08), sy * 0.68 - i * 4, 22); ctx.fill(); } } else { ctx.strokeStyle = '#92400e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(W * 0.85, sy * 0.85); ctx.quadraticCurveTo(W * 0.86, sy * 0.6, W * 0.82, sy * 0.45); ctx.stroke(); ctx.fillStyle = '#16a34a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(W * 0.82 + Math.cos(k * 1.3) * 24, sy * 0.45 + Math.sin(k * 1.3) * 8, 28, 8, k * 1.3, 0, TAU); ctx.fill(); } } }
        ctx.fillStyle = lgrad(ctx, 0, sy, 0, H, L.water); ctx.fillRect(0, sy, W, H - sy);
        // light rays
        ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); const x0 = (i * 230 + t * 10) % (W + 200) - 100; ctx.moveTo(x0, sy); ctx.lineTo(x0 + 60, sy); ctx.lineTo(x0 + 200, H); ctx.lineTo(x0 + 80, H); ctx.fill(); } ctx.globalAlpha = 1;
        // seabed
        ctx.fillStyle = S.loc === 3 ? '#1e1b4b' : '#a16207'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - 30 - Math.sin(x * 0.02) * 10); ctx.lineTo(W, H); ctx.fill();
        for (let i = 0; i < 9; i++) { const x = (i * 157) % W; ctx.strokeStyle = S.loc === 3 ? '#7c3aed' : '#15803d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, H - 30); for (let k = 1; k < 6; k++) ctx.lineTo(x + Math.sin(t * 1.5 + k + i) * 8, H - 30 - k * 18); ctx.stroke(); }
        ctx.save(); ctx.translate(0, sy); ctx.scale(s, s);
        // depth markers
        for (let d = 100; d <= maxDepth(); d += 100) { if (d * s + sy > H - 20) break; ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(W / s - 60, d, 50, 2); txt(ctx, d + 'm', W / s - 35, d - 10, 11, 'rgba(255,255,255,.6)', 'center', 700); }
        for (const f of fish) drawFish(f, f.x, f.y, f.size, f.dir, t);
        // boat
        const bx = boatX(), bob = Math.sin(t * 1.5) * 3;
        ctx.save(); ctx.translate(bx, bob); ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(-90, -24); ctx.lineTo(90, -24); ctx.lineTo(66, 10); ctx.lineTo(-70, 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b45309'; ctx.fillRect(-90, -28, 180, 8); ctx.fillStyle = '#fef3c7'; ctx.fillRect(-60, -20, 120, 6);
        ctx.fillStyle = '#2563eb'; rr(ctx, -16, -70, 30, 46, 8); ctx.fill(); circle(ctx, 0, -82, 13, '#f1c27d'); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.ellipse(0, -90, 22, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -92, 12, Math.PI, 0); ctx.fill();
        const tipX = 40 + (charging ? -power * 20 : 0), tipY = -120 + (charging ? power * 25 : 0);
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -56); ctx.lineTo(tipX, tipY); ctx.stroke(); ctx.restore();
        // line + hook
        if (state !== 'idle') { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx + 40, -120 + bob); ctx.quadraticCurveTo((bx + 40 + hook.x) / 2, Math.min(-60, hook.y * 0.3), hook.x, hook.y); ctx.stroke(); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hook.x - 4, hook.y + 4, 6, -0.5, Math.PI); ctx.stroke(); circle(ctx, hook.x, hook.y - 8, 5, '#ef4444'); }
        ctx.restore();
        // waves
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, sy); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, sy + Math.sin(x * 0.03 + t * 2) * 4); ctx.lineTo(W, sy + 10); ctx.lineTo(0, sy + 10); ctx.fill();
        fx.draw(ctx);
        // HUD
        ui.clear();
        label(ctx, '💵 $' + fmtBig(S.money), W / 2, 32, 26, '#86efac'); label(ctx, L.n + ' • depth ' + maxDepth() + 'm', W / 2, 58, 14, '#fff');
        if (state === 'idle') { if (charging) { const bw = 200; rr(ctx, W / 2 - bw / 2, sy - 40, bw, 14, 7); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); rr(ctx, W / 2 - bw / 2, sy - 40, bw * power, 14, 7); ctx.fillStyle = '#fde047'; ctx.fill(); } else label(ctx, E.touch ? 'HOLD & RELEASE TO CAST' : 'HOLD MOUSE / SPACE & RELEASE TO CAST', W / 2, sy - 34, 16, '#fff'); }
        if (state === 'sink') label(ctx, 'Tap to reel up early', W / 2, H - 70, 15, '#e0f2fe');
        if (state === 'fight') {
          const bw = Math.min(360, W * 0.7), bx = W / 2 - bw / 2, by = H - 90, safe = 0.28 * lineStr(), lo = 0.5 - safe / 2 - 0.05, hi = 0.5 + safe / 2 + 0.1;
          rr(ctx, bx, by, bw, 22, 11); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); ctx.fillStyle = 'rgba(74,222,128,.6)'; ctx.fillRect(bx + bw * lo, by, bw * (hi - lo), 22); ctx.fillStyle = 'rgba(239,68,68,.6)'; ctx.fillRect(bx + bw * 0.88, by, bw * 0.12, 22);
          ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw * tension - 3, by - 4, 6, 30); label(ctx, 'TENSION', bx - 50, by + 11, 12);
          rr(ctx, bx, by + 32, bw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); rr(ctx, bx, by + 32, bw * clamp(prog, 0, 1), 10, 5); ctx.fillStyle = '#fde047'; ctx.fill();
          label(ctx, holding ? 'REELING…' : 'HOLD TO REEL', W / 2, by - 18, 18, tension > 0.85 ? '#f87171' : '#fff');
        }
        if (catchShow) { const c = catchShow, k = Math.min(1, c.t * 3); rr(ctx, W / 2 - 170, H * 0.36, 340, 150, 20); ctx.fillStyle = 'rgba(15,23,42,.88)'; ctx.fill(); ctx.strokeStyle = RARC[c.f[1]]; ctx.lineWidth = 3; ctx.stroke(); drawFish({ def: c.f, ph: 0 }, W / 2, H * 0.36 + 55, 22 * k + 6, 1, t); label(ctx, (c.isNew ? '🆕 ' : '') + c.f[0], W / 2, H * 0.36 + 100, 22, RARC[c.f[1]]); label(ctx, RARN[c.f[1]] + ' • +$' + fmtBig(c.val), W / 2, H * 0.36 + 128, 16, '#86efac'); }
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.22, 24, '#fde047');
      },
      down() { holding = true; if (state === 'idle' && !catchShow) { charging = true; power = 0; } else if (state === 'sink') state = 'reel'; },
      up() { holding = false; if (charging) { charging = false; cast(); } },
      onKey(c) { if (c === 'Space') this.down(); },
      onKeyUp(c) { if (c === 'Space') this.up(); },
      destroy() { save(); },
      hud() { return { stats: [['Catches', S.catches], ['Species', Object.keys(S.book).length + '/32']] }; }
    };
  }
});
