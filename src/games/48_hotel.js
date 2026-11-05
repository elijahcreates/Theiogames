/* =====================================================================
   HOTEL SIMULATOR
   ===================================================================== */
registerGame({
  id: 'hotel', title: 'Hotel Simulator', emoji: '🏨', c1: '#c79081', c2: '#dfa579', cats: ['Simulation', 'Creative'], featured: true, isNew: true,
  desc: 'Run your own hotel! Build and furnish rooms, check in guests, keep rooms spotless, hire staff, add a restaurant and pool, and grow a 5-star tower. Saves automatically.',
  controls: 'Tap guests, rooms & buttons', scoreLabel: 'HOTEL VALUE ($)', fmtScore: v => '$' + fmtBig(v),
  hint: 'Tap a waiting guest to check them in • tap dirty rooms to clean • tap empty slots to build • 👥 Staff & ⭐ Upgrades buttons at the bottom. Drag to scroll.', hintTouch: 'Tap guests to check in • tap rooms to clean/build/upgrade • drag to scroll.',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI(), FH = 130, BWID = 960, SHAFT = 110, RW = (BWID - SHAFT) / 3, LOBBY = 170;
    const LV = [{ n: 'Cozy', price: 40, sat: 0.0, cost: 150 }, { n: 'Deluxe', price: 90, sat: 0.12, cost: 600 }, { n: 'Suite', price: 200, sat: 0.25, cost: 2500 }, { n: 'Royal', price: 450, sat: 0.4, cost: 9000 }];
    const S = Object.assign({ money: 400, floors: 1, rooms: [{ lv: 0, st: 'clean' }, null, null], staff: { rec: 0, maid: 0, bell: 0 }, fac: { lobby: 0, rest: 0, pool: 0, lift: 0 }, day: 1, rating: 3.5, served: 0, earned: 0 }, E.data('save', {}));
    S.rooms = S.rooms.map(r => r ? { lv: r.lv, st: r.st === 'occupied' ? 'dirty' : r.st } : null);
    let guests = [], queueT = 2, t = 0, dayT = 0, camY = 0, drag = null, saveT = 0, cleaning = {}, maidT = 0, recT = 0, ratings = [], sel = null;
    const STAFF = [['rec', '💁 Receptionist', 'Checks guests in automatically', 300], ['maid', '🧹 Housekeeper', 'Cleans dirty rooms automatically', 250], ['bell', '🛎️ Bellhop', 'Guests move 30% faster (per hire)', 400]];
    const FAC = [['lobby', '🪴 Lobby Décor', '+satisfaction for every guest', 500], ['rest', '🍽️ Restaurant', '+$ per guest from meals', 1200], ['pool', '🏊 Rooftop Pool', '+satisfaction & +15% room prices', 4000], ['lift', '🛗 Faster Elevator', 'guests reach rooms faster', 800]];
    const hire = k => Math.floor(STAFF.find(s => s[0] === k)[3] * Math.pow(2.2, S.staff[k]));
    const facCost = k => Math.floor(FAC.find(s => s[0] === k)[3] * Math.pow(3, S.fac[k]));
    const floorCost = () => Math.floor(800 * Math.pow(2.6, S.floors - 1));
    const satBase = () => 0.5 + S.fac.lobby * 0.06 + S.fac.pool * 0.08 + Math.min(0.15, S.staff.bell * 0.03);
    function save() { E.save('save', S); E.submitBest(Math.floor(S.money + S.rooms.reduce((s, r) => s + (r ? LV[r.lv].cost + 150 : 0), 0) + S.floors * 500)); }
    function roomRect(i) { const f = Math.floor(i / 3), k = i % 3; return { x: SHAFT + k * RW, y: -LOBBY - (f + 1) * FH, w: RW, h: FH, f }; }
    function spawnGuest() { const look = { skin: pick(['#f1c27d', '#c68642', '#8d5524', '#ffdbac', '#e0ac69']), shirt: hsl(irand(0, 359), 60, 55), hair: pick(['#111', '#5b3a1c', '#d97706', '#9ca3af', '#7c2d12']), bag: hsl(irand(0, 359), 50, 40) }; guests.push({ st: 'queue', x: BWID + 30, y: -20, tx: 0, wait: 0, look, room: -1, stay: 0, sat: satBase(), patience: rand(25, 40), id: Math.random() }); }
    function queueX(i) { return 450 + i * 50; }
    function checkIn(g) {
      const free = S.rooms.findIndex((r, i) => r && r.st === 'clean' && !guests.some(o => o.room === i));
      if (free < 0) { E.toast('🛏️ No clean room available!'); E.sound('error'); return false; }
      g.room = free; g.st = 'toLift'; E.sound('ding'); g.sat -= Math.min(0.3, g.wait / 120); S.rooms[free].st = 'reserved';
      fx.text(g.x, g.y - 60, 'Room ' + (free + 101 + Math.floor(free / 3) * 97), '#fde047', 18); return true;
    }
    function payout(g) {
      const r = S.rooms[g.room], lvl = r ? LV[r.lv] : LV[0], mult = 1 + S.fac.pool * 0.15, sat = clamp(g.sat + lvl.sat, 0, 1);
      const pay = Math.round(lvl.price * mult * (0.8 + sat * 0.6) + S.fac.rest * 15); S.money += pay; S.earned += pay; S.served++;
      const stars = clamp(Math.round(1 + sat * 4), 1, 5); ratings.push(stars); if (ratings.length > 20) ratings.shift(); S.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      fx.text(g.x, g.y - 70, '+$' + pay + '  ' + '⭐'.repeat(stars), '#86efac', 18); E.sound('coin');
    }
    function roomTap(i) {
      const r = S.rooms[i];
      if (!r) { const c = 300 + Math.floor(i / 3) * 150; confirmBox('🔨 Build a room here?', 'Cost $' + fmtBig(c), () => { if (S.money < c) return E.sound('error'); S.money -= c; S.rooms[i] = { lv: 0, st: 'clean' }; E.sound('buy'); save(); }); return; }
      if (r.st === 'dirty') { if (!cleaning[i]) { cleaning[i] = 0.01; E.sound('swish'); } return; }
      if (r.st === 'clean' && r.lv < LV.length - 1) { const c = LV[r.lv + 1].cost; confirmBox('✨ Upgrade to ' + LV[r.lv + 1].n + '?', '$' + LV[r.lv].price + ' → $' + LV[r.lv + 1].price + ' per night • cost $' + fmtBig(c), () => { if (S.money < c) return E.sound('error'); S.money -= c; r.lv++; E.sound('buy'); save(); }); }
    }
    function confirmBox(title, sub, ok) { const d = document.createElement('div'); d.innerHTML = `<p style="color:#e2e8f0;margin-bottom:12px">${esc(sub)}</p>`; const b = document.createElement('button'); b.className = 'btn primary'; b.style.width = '100%'; b.textContent = 'Confirm'; b.onclick = () => { ok(); E.panel.close(); }; d.appendChild(b); E.panel.open(title, d); }
    function openStaff() { const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid'; STAFF.forEach(([k, n, d]) => { const c = hire(k), el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4>${n}<span class="lv">${S.staff[k]} hired</span></h4><small>${d}</small>`; const b = document.createElement('button'); b.textContent = 'Hire $' + fmtBig(c); b.disabled = S.money < c || S.staff[k] >= 6; b.onclick = () => { if (S.money < c) return; S.money -= c; S.staff[k]++; E.sound('buy'); save(); openStaff(); }; el.appendChild(b); grid.appendChild(el); }); g.appendChild(grid); E.panel.open('👥 Hire Staff', g); }
    function openUp() { const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span><span>⭐ ${S.rating.toFixed(1)}</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid';
      const fl = document.createElement('div'); fl.className = 'up'; fl.innerHTML = `<h4>🏗️ Build New Floor<span class="lv">${S.floors} floors</span></h4><small>Adds 3 room slots</small>`; const fb = document.createElement('button'); fb.textContent = '$' + fmtBig(floorCost()); fb.disabled = S.money < floorCost() || S.floors >= 10; fb.onclick = () => { if (S.money < floorCost()) return; S.money -= floorCost(); S.floors++; S.rooms.push(null, null, null); E.sound('buy'); save(); openUp(); }; fl.appendChild(fb); grid.appendChild(fl);
      FAC.forEach(([k, n, d]) => { const c = facCost(k), el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4>${n}<span class="lv">Lv ${S.fac[k]}</span></h4><small>${d}</small>`; const b = document.createElement('button'); b.textContent = S.fac[k] >= 5 ? 'MAX' : '$' + fmtBig(c); b.disabled = S.money < c || S.fac[k] >= 5; b.onclick = () => { if (S.money < c) return; S.money -= c; S.fac[k]++; E.sound('buy'); save(); openUp(); }; el.appendChild(b); grid.appendChild(el); });
      g.appendChild(grid); E.panel.open('⭐ Hotel Upgrades', g); }
    const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:8px';
    [['👥 Staff', openStaff], ['⭐ Upgrades', openUp]].forEach(([l, f]) => { const b = document.createElement('button'); b.className = 'btn primary'; b.style.cssText = 'padding:10px 16px;font-size:.95rem'; b.textContent = l; b.onclick = e => { e.stopPropagation(); f(); }; bar.appendChild(b); });
    E.layer.appendChild(bar);
    function drawPerson(x, y, lk, s, walk, extra) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const st = walk ? Math.sin(t * 10 + x) * 4 : 0;
      ctx.fillStyle = '#1f2937'; ctx.fillRect(-7, -16 + (st > 0 ? -2 : 0), 6, 16); ctx.fillRect(1, -16 + (st < 0 ? -2 : 0), 6, 16);
      ctx.fillStyle = lk.shirt; rr(ctx, -11, -40, 22, 26, 7); ctx.fill(); circle(ctx, 0, -50, 10, lk.skin); ctx.fillStyle = lk.hair; ctx.beginPath(); ctx.arc(0, -53, 10.5, Math.PI, 0); ctx.fill();
      if (extra === 'bag') { ctx.fillStyle = lk.bag; rr(ctx, 10, -22, 14, 18, 3); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(13, -22); ctx.lineTo(13, -27); ctx.lineTo(21, -27); ctx.lineTo(21, -22); ctx.stroke(); }
      if (extra === 'maid') { ctx.fillStyle = '#fff'; ctx.fillRect(-11, -30, 22, 8); ctx.fillStyle = '#60a5fa'; rr(ctx, 14, -26, 18, 22, 3); ctx.fill(); }
      ctx.restore();
    }
    function drawRoom(i) {
      const R = roomRect(i), r = S.rooms[i], x = R.x, y = R.y;
      ctx.fillStyle = r ? ['#fde68a', '#bae6fd', '#e9d5ff', '#fecaca'][r.lv] : 'rgba(255,255,255,.08)'; ctx.fillRect(x + 4, y + 4, R.w - 8, R.h - 8);
      if (!r) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeRect(x + 10, y + 10, R.w - 20, R.h - 20); ctx.setLineDash([]); label(ctx, '+ Build $' + fmtBig(300 + Math.floor(i / 3) * 150), x + R.w / 2, y + R.h / 2, 15, '#e2e8f0'); ui.zone('r' + i, x, y, R.w, R.h); return; }
      // wallpaper stripes
      ctx.fillStyle = 'rgba(0,0,0,.04)'; for (let k = 0; k < R.w; k += 22) ctx.fillRect(x + k, y + 4, 11, R.h - 8);
      // furniture by level
      const fy = y + R.h - 6; ctx.fillStyle = '#92400e'; ctx.fillRect(x + 4, fy - 6, R.w - 8, 6);
      ctx.fillStyle = ['#fff', '#f8fafc', '#fdf4ff', '#fef9c3'][r.lv]; rr(ctx, x + 30, fy - 34, 110, 26, 6); ctx.fill(); ctx.fillStyle = ['#ef4444', '#3b82f6', '#a855f7', '#f59e0b'][r.lv]; rr(ctx, x + 60, fy - 32, 80, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; rr(ctx, x + 34, fy - 44, 26, 14, 5); ctx.fill(); ctx.fillStyle = '#7c2d12'; ctx.fillRect(x + 26, fy - 52, 6, 46);
      ctx.fillStyle = '#78350f'; ctx.fillRect(x + 150, fy - 30, 30, 24); circle(ctx, x + 165, fy - 44, 8, '#fde047');
      if (r.lv >= 1) { ctx.fillStyle = '#111827'; rr(ctx, x + 196, fy - 80, 50, 32, 4); ctx.fill(); ctx.fillStyle = '#38bdf8'; ctx.fillRect(x + 200, fy - 76, 42, 24); }
      if (r.lv >= 2) { ctx.fillStyle = '#166534'; circle(ctx, x + R.w - 22, fy - 40, 14); ctx.fill(); ctx.fillStyle = '#92400e'; ctx.fillRect(x + R.w - 30, fy - 26, 16, 20); }
      if (r.lv >= 3) { for (let k = 0; k < 3; k++) { ctx.fillStyle = '#fde047'; star(ctx, x + 40 + k * 20, y + 22, 6, 2.5, 5); ctx.fill(); } }
      // window
      ctx.fillStyle = '#7dd3fc'; ctx.fillRect(x + 90, y + 18, 60, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x + 90, y + 18, 60, 40);
      if (r.st === 'dirty') { ctx.fillStyle = 'rgba(120,80,40,.35)'; ctx.fillRect(x + 4, y + 4, R.w - 8, R.h - 8); for (let k = 0; k < 5; k++) circle(ctx, x + 40 + k * 40, fy - 8, 6, 'rgba(90,60,30,.7)'); for (let k = 0; k < 3; k++) { const fxp = x + 60 + k * 50 + Math.sin(t * 6 + k) * 10, fyp = y + 50 + Math.cos(t * 7 + k) * 8; circle(ctx, fxp, fyp, 2, '#111'); } label(ctx, cleaning[i] ? '🧹 ' + Math.round(cleaning[i] * 100) + '%' : '🧹 TAP TO CLEAN', x + R.w / 2, y + 28, 14, '#fff'); }
      if (cleaning[i]) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 20, y + R.h - 20, R.w - 40, 8); ctx.fillStyle = '#4ade80'; ctx.fillRect(x + 20, y + R.h - 20, (R.w - 40) * cleaning[i], 8); }
      if (r.st === 'occupied') { ctx.fillStyle = 'rgba(15,23,42,.3)'; ctx.fillRect(x + 4, y + 4, R.w - 8, R.h - 8); txt(ctx, '💤', x + 70, fy - 50, 22); }
      ctx.fillStyle = '#7c2d12'; rr(ctx, x + R.w - 46, y + 8, 40, 18, 4); ctx.fill(); txt(ctx, String(101 + i + Math.floor(i / 3) * 97), x + R.w - 26, y + 18, 11, '#fde68a', 'center', 800);
      txt(ctx, LV[r.lv].n, x + 10, y + R.h - 64, 11, 'rgba(0,0,0,.5)', 'left', 800);
      ui.zone('r' + i, x, y, R.w, R.h);
    }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        dayT += dt; if (dayT > 60) { dayT = 0; S.day++; const wages = (S.staff.rec * 25 + S.staff.maid * 20 + S.staff.bell * 30); S.money -= wages; if (wages) E.toast('📅 Day ' + S.day + ' – staff wages $' + wages); save(); }
        const rate = 7 - Math.min(5, S.rating - 2.5) * 0.9 - S.floors * 0.25; queueT -= dt; if (queueT <= 0) { queueT = rand(rate * 0.7, rate * 1.2); if (guests.filter(g => g.st === 'queue').length < 6) spawnGuest(); }
        const sp = 110 * (1 + S.staff.bell * 0.3), lift = 160 * (1 + S.fac.lift * 0.4);
        let qi = 0;
        for (const g of guests) {
          if (g.st === 'queue') { g.tx = queueX(qi++); g.x += clamp(g.tx - g.x, -sp * dt, sp * dt); g.y = -20; g.wait += dt; if (g.wait > g.patience) { g.st = 'leave'; g.sat = 0; ratings.push(1); if (ratings.length > 20) ratings.shift(); S.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length; fx.text(g.x, g.y - 60, '😤 Too slow!', '#f87171', 18); E.sound('bad'); } }
          else if (g.st === 'toLift') { g.x += clamp(SHAFT / 2 - g.x, -sp * 1.4 * dt, sp * 1.4 * dt); if (Math.abs(g.x - SHAFT / 2) < 2) g.st = 'up'; }
          else if (g.st === 'up') { const R = roomRect(g.room), ty = R.y + R.h - 8; g.y += clamp(ty - g.y, -lift * dt, lift * dt); if (Math.abs(g.y - ty) < 1) g.st = 'toRoom'; }
          else if (g.st === 'toRoom') { const R = roomRect(g.room), tx = R.x + R.w * 0.5; g.x += clamp(tx - g.x, -sp * dt, sp * dt); if (Math.abs(g.x - tx) < 2) { g.st = 'stay'; g.stay = rand(14, 22); S.rooms[g.room].st = 'occupied'; } }
          else if (g.st === 'stay') { g.stay -= dt; if (g.stay <= 0) { payout(g); S.rooms[g.room].st = 'dirty'; g.st = 'outLift'; } }
          else if (g.st === 'outLift') { g.x += clamp(SHAFT / 2 - g.x, -sp * dt, sp * dt); if (Math.abs(g.x - SHAFT / 2) < 2) g.st = 'down'; }
          else if (g.st === 'down') { g.y += clamp(-8 - g.y, -lift * dt, lift * dt); if (Math.abs(g.y + 8) < 1) g.st = 'leave'; }
          else if (g.st === 'leave') { g.y = -20; g.x += sp * dt; if (g.x > BWID + 60) g.gone = true; }
        }
        guests = guests.filter(g => !g.gone);
        // receptionist
        if (S.staff.rec > 0) { recT -= dt; if (recT <= 0) { recT = 4 / S.staff.rec; const g = guests.find(q => q.st === 'queue'); if (g && S.rooms.some((r, i) => r && r.st === 'clean' && !guests.some(o => o.room === i))) checkIn(g); } }
        // housekeepers
        if (S.staff.maid > 0) { maidT -= dt; if (maidT <= 0) { maidT = 1; let n = S.staff.maid; S.rooms.forEach((r, i) => { if (n > 0 && r && r.st === 'dirty' && !cleaning[i]) { cleaning[i] = 0.01; n--; } }); } }
        for (const k in cleaning) { cleaning[k] += dt / 3; if (cleaning[k] >= 1) { delete cleaning[k]; const r = S.rooms[k]; if (r) { r.st = 'clean'; fx.burst(roomRect(+k).x + RW / 2, roomRect(+k).y + FH / 2, 14, { col: ['#fff', '#bae6fd'], spd: 140, shape: 'star' }); E.sound('ding', 100); } } }
        saveT += dt; if (saveT > 6) { saveT = 0; save(); }
      },
      draw() {
        const W = E.W, H = E.H; ui.clear();
        const s = Math.min(W / (BWID + 80), 1.25), topY = -LOBBY - S.floors * FH - 90, maxCam = Math.max(0, -topY * s - H + 120);
        camY = clamp(camY, 0, maxCam);
        ctx.fillStyle = lgrad(ctx, 0, 0, 0, H, ['#38bdf8', '#e0f2fe']); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) { const cx = ((i * 260 + t * 10) % (W + 200)) - 100, cy = 60 + i * 50 + camY * 0.2; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.arc(cx + 24, cy - 8, 26, 0, TAU); ctx.arc(cx + 52, cy, 18, 0, TAU); ctx.fill(); }
        const ox = (W - BWID * s) / 2, oy = H - 70 + camY;
        ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
        ctx.fillStyle = '#65a30d'; ctx.fillRect(-2000, 0, 5000, 400); ctx.fillStyle = '#9ca3af'; ctx.fillRect(-2000, 0, 5000, 20);
        // building shell
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(-12, topY + 60, BWID + 24, -topY - 60);
        ctx.fillStyle = '#f5f5f4'; ctx.fillRect(0, -LOBBY - S.floors * FH, BWID, S.floors * FH + LOBBY);
        // roof + sign + pool
        ctx.fillStyle = '#44403c'; ctx.fillRect(-20, -LOBBY - S.floors * FH - 16, BWID + 40, 16);
        if (S.fac.pool) { ctx.fillStyle = '#38bdf8'; rr(ctx, BWID - 300, -LOBBY - S.floors * FH - 40, 260, 26, 8); ctx.fill(); txt(ctx, '🏊', BWID - 330, -LOBBY - S.floors * FH - 28, 20); }
        rr(ctx, BWID / 2 - 150, -LOBBY - S.floors * FH - 76, 300, 50, 10); ctx.fillStyle = '#7f1d1d'; ctx.fill(); txt(ctx, 'THE IO GRAND HOTEL', BWID / 2, -LOBBY - S.floors * FH - 51, 22, '#fde68a', 'center', 900);
        for (let k = 0; k < Math.round(S.rating); k++) { star(ctx, BWID / 2 - 48 + k * 24, -LOBBY - S.floors * FH - 92, 9, 4, 5); ctx.fillStyle = '#facc15'; ctx.fill(); }
        // elevator shaft
        ctx.fillStyle = '#334155'; ctx.fillRect(0, -LOBBY - S.floors * FH, SHAFT, S.floors * FH + LOBBY); ctx.fillStyle = '#64748b'; ctx.fillRect(SHAFT / 2 - 3, -LOBBY - S.floors * FH, 6, S.floors * FH + LOBBY);
        // floors
        for (let f = 0; f < S.floors; f++) { ctx.fillStyle = '#a8a29e'; ctx.fillRect(0, -LOBBY - f * FH - 4, BWID, 6); }
        S.rooms.forEach((r, i) => drawRoom(i));
        // lobby
        ctx.fillStyle = S.fac.lobby ? '#fef3c7' : '#e7e5e4'; ctx.fillRect(SHAFT, -LOBBY, BWID - SHAFT, LOBBY);
        ctx.fillStyle = S.fac.lobby >= 2 ? '#991b1b' : '#a8a29e'; ctx.fillRect(SHAFT, -10, BWID - SHAFT, 10);
        ctx.fillStyle = '#7c2d12'; rr(ctx, 200, -70, 200, 60, 8); ctx.fill(); ctx.fillStyle = '#92400e'; ctx.fillRect(196, -74, 208, 10); txt(ctx, 'RECEPTION', 300, -40, 14, '#fde68a', 'center', 900); circle(ctx, 380, -78, 6, '#fbbf24');
        if (S.staff.rec) drawPerson(300, -72, { skin: '#f1c27d', shirt: '#1e3a8a', hair: '#111' }, 1, false);
        for (let k = 0; k < S.fac.lobby; k++) { ctx.fillStyle = '#166534'; circle(ctx, 460 + k * 70, -50, 16); ctx.fill(); ctx.fillStyle = '#92400e'; ctx.fillRect(452 + k * 70, -36, 16, 26); }
        if (S.fac.lobby >= 1) { for (let k = 0; k < 2; k++) { const cx = 300 + k * 300; ctx.strokeStyle = '#a16207'; ctx.beginPath(); ctx.moveTo(cx, -LOBBY + 4); ctx.lineTo(cx, -LOBBY + 26); ctx.stroke(); ctx.drawImage(E.glow(45), cx - 26, -LOBBY + 6, 52, 52); circle(ctx, cx, -LOBBY + 32, 9, '#fde047'); } }
        if (S.fac.rest) { ctx.fillStyle = '#fff'; rr(ctx, BWID - 250, -LOBBY + 20, 220, 60, 8); ctx.fill(); txt(ctx, '🍽️ RESTAURANT', BWID - 140, -LOBBY + 50, 16, '#7c2d12', 'center', 900); }
        ctx.fillStyle = '#0f172a'; ctx.fillRect(BWID - 6, -110, 12, 110);
        // elevator car(s)
        for (const g of guests) if (g.st === 'up' || g.st === 'down') { ctx.fillStyle = '#facc15'; rr(ctx, 10, g.y - 74, SHAFT - 20, 78, 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(14, g.y - 70, SHAFT - 28, 70); }
        // maids
        for (let k = 0; k < S.staff.maid; k++) { const ci = Object.keys(cleaning)[k]; if (ci !== undefined) { const R = roomRect(+ci); drawPerson(R.x + R.w * 0.7, R.y + R.h - 8, { skin: '#c68642', shirt: '#0ea5e9', hair: '#111' }, 0.9, true, 'maid'); } }
        // guests
        for (const g of guests) {
          drawPerson(g.x, g.y, g.look, 1, g.st !== 'stay' && g.st !== 'queue', g.st === 'queue' || g.st === 'toLift' || g.st === 'leave' ? 'bag' : null);
          if (g.st === 'stay') continue;
          if (g.st === 'queue') { const p = g.wait / g.patience; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(g.x - 16, g.y - 78, 32, 5); ctx.fillStyle = p < 0.5 ? '#4ade80' : p < 0.8 ? '#facc15' : '#ef4444'; ctx.fillRect(g.x - 16, g.y - 78, 32 * (1 - p), 5); txt(ctx, p < 0.5 ? '🙂' : p < 0.8 ? '😐' : '😠', g.x, g.y - 92, 16); ui.zone('g' + guests.indexOf(g), g.x - 22, g.y - 100, 44, 100); }
        }
        fx.draw(ctx);
        ctx.restore();
        // map zones to screen coords
        const zs = ui; // zones are in world coords; we convert pointer instead
        // HUD
        rr(ctx, W / 2 - 190, 10, 380, 56, 16); ctx.fillStyle = 'rgba(15,23,42,.75)'; ctx.fill();
        label(ctx, '$' + fmtBig(S.money), W / 2 - 90, 38, 24, '#86efac'); label(ctx, '⭐ ' + S.rating.toFixed(1), W / 2 + 30, 38, 20, '#fde047'); label(ctx, 'Day ' + S.day, W / 2 + 130, 38, 18, '#e2e8f0');
        const waiting = guests.filter(g => g.st === 'queue').length; if (waiting) label(ctx, '🛎️ ' + waiting + ' guest' + (waiting > 1 ? 's' : '') + ' waiting – tap them to check in!', W / 2, 86, 15, '#fff');
        this._xf = { ox, oy, s };
      },
      down(x, y) { drag = { y, cy: camY, moved: false }; },
      move(x, y) { if (drag && E.ptrDown) { if (Math.abs(y - drag.y) > 8) drag.moved = true; if (drag.moved) camY = drag.cy + (y - drag.y); } },
      up(x, y) { if (!drag) return; const moved = drag.moved; drag = null; if (moved || !this._xf) return; const { ox, oy, s } = this._xf; const wx = (x - ox) / s, wy = (y - oy) / s; const id = ui.hit(wx, wy); if (!id) return; if (id[0] === 'g') { const g = guests[+id.slice(1)]; if (g && g.st === 'queue') checkIn(g); } else if (id[0] === 'r') roomTap(+id.slice(1)); },
      wheel(d) { camY -= d; },
      destroy() { save(); },
      hud() { return { stats: [['Rooms', S.rooms.filter(Boolean).length + '/' + S.rooms.length], ['Guests served', S.served]] }; }
    };
  }
});
