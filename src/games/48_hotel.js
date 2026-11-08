/* =====================================================================
   HOTEL SIMULATOR  (walk-around hotel tycoon)
   You ARE the manager: walk to the desk to check guests in, grab towels &
   food from the supply room, clean rooms, collect cash and stand on the
   green build pads to unlock rooms, staff and upgrades.
   ===================================================================== */
registerGame({
  id: 'hotel', title: 'Hotel Simulator', emoji: '🏨', c1: '#c79081', c2: '#dfa579', cats: ['Simulation', 'Creative'], featured: true, isNew: true, input: 'joy',
  desc: 'Walk around your own hotel as the manager! Check in guests at the front desk, deliver towels and room service, clean rooms, collect cash and build new rooms, staff and upgrades.',
  controls: 'WASD / joystick • just walk to things', scoreLabel: 'HOTEL VALUE ($)', fmtScore: v => '$' + fmtBig(v),
  hint: 'Move with WASD / arrows / mouse. Stand behind the desk to check guests in, step on 💵 to collect, stand in dirty rooms to clean, stand on green pads to build!', hintTouch: 'Drag to walk. Stand behind the desk to check guests in • walk over cash • stand in dirty rooms to clean • stand on green pads to build!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), MW = 1400, MH = 1040;
    const S = Object.assign({ money: 60, rooms: [true, false, false, false, false, false, false], beds: 0, decor: 0, shoes: 0, rec: 0, maid: 0, bell: 0, vend: 0, stars: 3, served: 0 }, E.data('save2', {}));
    // ---------- layout ----------
    const ROOMS = []; for (let i = 0; i < 6; i++) ROOMS.push({ x: 40 + i * 220, y: 200, w: 210, h: 290, door: 40 + i * 220 + 105, doorY: 490, top: true });
    ROOMS.push({ x: 1130, y: 680, w: 250, h: 300, door: 1255, doorY: 680, top: false });
    const CLOSET = { x: 20, y: 680, w: 250, h: 300, door: 145 }, DESK = { x: 590, y: 730, w: 220, h: 40 }, DESKSPOT = { x: 700, y: 700 }, CASH = { x: 700, y: 748 };
    const walls = [];
    const W = (x, y, w, h) => walls.push([x, y, w, h]);
    W(0, 160, MW, 20); W(0, 160, 20, MH - 160); W(MW - 20, 160, 20, MH - 160); W(0, MH - 20, 640, 20); W(760, MH - 20, MW - 760, 20);
    ROOMS.forEach(r => { if (r.top) { W(r.x + r.w, r.y, 10, r.h); W(r.x, r.y + r.h - 10, r.w / 2 - 40, 10); W(r.x + r.w / 2 + 40, r.y + r.h - 10, r.w / 2 - 40, 10); } else { W(r.x - 10, r.y, 10, r.h + 40); W(r.x, r.y, r.w / 2 - 40, 10); W(r.x + r.w / 2 + 40, r.y, r.w / 2 - 40, 10); } });
    W(CLOSET.x + CLOSET.w, CLOSET.y, 10, CLOSET.h + 40); W(CLOSET.x, CLOSET.y, CLOSET.w / 2 - 40, 10); W(CLOSET.x + CLOSET.w / 2 + 40, CLOSET.y, CLOSET.w / 2 - 40, 10);
    walls.push([DESK.x, DESK.y, DESK.w, DESK.h]);
    const roomWalls = i => { const r = ROOMS[i]; return r.top ? [r.x, r.y + r.h - 10, r.w, 10] : [r.x, r.y, r.w, 10]; };
    const SHELF = [{ x: 70, y: 760, item: 'towel', e: '🧺' }, { x: 200, y: 760, item: 'food', e: '🍔' }];
    // ---------- build pads ----------
    const PADS = [];
    ROOMS.forEach((r, i) => { if (i > 0) PADS.push({ id: 'room' + i, x: r.door, y: r.top ? r.doorY + 55 : r.doorY - 55, cost: 120 * Math.pow(1.9, i - 1), label: 'Room ' + (101 + i), ok: () => !S.rooms[i], buy: () => { S.rooms[i] = true; } }); });
    const UP = [['rec', '💁 Receptionist', 500, 1], ['maid', '🧹 Housekeeper', 400, 3], ['bell', '🛎️ Bellhop', 700, 2], ['beds', '🛏️ Luxury Beds', 350, 4], ['decor', '🪴 Lobby Décor', 300, 4], ['shoes', '👟 Fast Shoes', 200, 3], ['vend', '🥤 Vending Machine', 260, 1]];
    UP.forEach(([k, n, c, max], j) => PADS.push({ id: k, x: 380 + (j % 4) * 210, y: 880 + Math.floor(j / 4) * 80 - (j >= 4 ? 0 : 0), cost: () => c * Math.pow(2.2, S[k]), label: n, ok: () => S[k] < max, buy: () => { S[k]++; } }));
    PADS.forEach(p => { if (typeof p.cost === 'number') { const c = p.cost; p.cost = () => c; } p.paid = 0; });
    // reposition upgrade pads in two rows inside the lobby
    PADS.filter(p => !p.id.startsWith('room')).forEach((p, j) => { p.x = 360 + (j % 4) * 200; p.y = j < 4 ? 895 : 970; if (j >= 4) p.x = 460 + (j - 4) * 200; });
    // ---------- actors ----------
    const me = { x: 700, y: 640, vx: 0, vy: 0, carry: null, face: 1, step: 0 };
    let guests = [], cash = [], spawnT = 3, t = 0, saveT = 0, roomState = ROOMS.map(() => ({ st: 'clean', guest: null, clean: 0, trash: [] })), checkT = 0, staff = [], msg = '', msgT = 0, vendT = 0;
    const rs = i => roomState[i];
    function mkStaff() { staff = []; for (let i = 0; i < S.maid; i++) staff.push({ kind: 'maid', x: 600 + i * 40, y: 620, task: null, t: 0, col: '#0ea5e9' }); for (let i = 0; i < S.bell; i++) staff.push({ kind: 'bell', x: 800 + i * 40, y: 620, task: null, t: 0, carry: null, col: '#dc2626' }); }
    mkStaff();
    function save() { E.save('save2', S); E.submitBest(Math.floor(S.money + S.rooms.filter(Boolean).length * 300 + (S.rec + S.maid + S.bell) * 400)); }
    function collide(a, r) { for (const w of walls) { const cx = clamp(a.x, w[0], w[0] + w[2]), cy = clamp(a.y, w[1], w[1] + w[3]), dx = a.x - cx, dy = a.y - cy, d = Math.hypot(dx, dy); if (d < r && d > 0) { a.x = cx + dx / d * r; a.y = cy + dy / d * r; } } ROOMS.forEach((rm, i) => { if (S.rooms[i]) return; const w = roomWalls(i); if (rm.top) { if (a.y < w[1] + 10 + r && a.x > w[0] && a.x < w[0] + w[2]) a.y = w[1] + 10 + r; } else if (a.y > w[1] - r && a.x > w[0] && a.x < w[0] + w[2]) a.y = w[1] - r; }); a.x = clamp(a.x, 30, MW - 30); a.y = clamp(a.y, 190, MH - 10); }
    const inRoom = (a, i) => { const r = ROOMS[i]; return a.x > r.x && a.x < r.x + r.w && a.y > r.y && a.y < r.y + r.h; };
    const freeRoom = () => ROOMS.findIndex((r, i) => S.rooms[i] && rs(i).st === 'clean' && !rs(i).guest);
    // guest path helpers
    const queuePos = i => ({ x: 700, y: 830 + i * 0 + 0, qx: 700 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 50 });
    function route(g, pts) { g.path = pts; }
    function spawnGuest() {
      const look = { skin: pick(['#f1c27d', '#c68642', '#8d5524', '#ffdbac', '#e0ac69']), shirt: hsl(irand(0, 359), 60, 55), hair: pick(['#111', '#5b3a1c', '#d97706', '#9ca3af', '#7c2d12']), bag: hsl(irand(0, 359), 50, 40) };
      guests.push({ x: 700, y: MH + 20, look, st: 'queue', path: [], wait: 0, patience: 45, room: -1, stay: 0, req: null, reqT: 0, sat: 0.7 + S.decor * 0.05 });
    }
    function checkIn(g) { const i = freeRoom(); if (i < 0) return false; g.room = i; g.st = 'toRoom'; rs(i).guest = g; const r = ROOMS[i]; route(g, [{ x: g.x, y: 600 }, { x: r.door, y: 600 }, { x: r.door, y: r.top ? r.y + r.h - 60 : r.y + 60 }, { x: r.x + r.w / 2 + rand(-30, 30), y: r.y + r.h / 2 }]); g.sat -= Math.min(0.3, g.wait / 120); E.sound('ding'); fx.text(g.x, g.y - 60, 'Room ' + (101 + i), '#fde047', 18); return true; }
    function checkout(g) { const i = g.room, r = ROOMS[i], price = Math.round((40 + i * 12) * (1 + S.beds * 0.35) * (0.7 + clamp(g.sat, 0, 1) * 0.6)); g.st = 'leave'; rs(i).guest = null; rs(i).st = 'dirty'; rs(i).trash = [0, 1, 2].map(() => ({ x: r.x + rand(30, r.w - 30), y: r.y + rand(40, r.h - 40), e: pick(['🧦', '🍕', '🥤', '📰', '🍌']) })); route(g, [{ x: r.door, y: r.top ? r.doorY - 20 : r.doorY + 20 }, { x: r.door, y: 600 }, { x: 700, y: 600 }, { x: 640, y: 800 }, { x: 700, y: MH + 40 }]); cash.push({ x: CASH.x + rand(-40, 40), y: CASH.y + rand(-4, 4), v: price }); S.served++; const st = clamp(Math.round(1 + g.sat * 4), 1, 5); S.stars = S.stars * 0.85 + st * 0.15; fx.text(g.x, g.y - 70, '⭐'.repeat(st), '#fde047', 18); }
    function walkPath(a, sp, dt) { if (!a.path || !a.path.length) return true; const p = a.path[0], dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy); if (d < 4) { a.path.shift(); return !a.path.length; } a.x += dx / d * Math.min(d, sp * dt); a.y += dy / d * Math.min(d, sp * dt); a.face = dx > 0 ? 1 : -1; a.step = (a.step || 0) + dt * 10; return false; }
    if (E.touch) {}
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt;
        // player
        const d = E.dir(), sp = 260 * (1 + S.shoes * 0.15);
        me.vx += (d.x * d.mag * sp - me.vx) * Math.min(1, dt * 12); me.vy += (d.y * d.mag * sp - me.vy) * Math.min(1, dt * 12);
        me.x += me.vx * dt; me.y += me.vy * dt; collide(me, 18); if (Math.abs(me.vx) > 10) me.face = me.vx > 0 ? 1 : -1; if (Math.hypot(me.vx, me.vy) > 20) me.step += dt * 12;
        // guests
        spawnT -= dt; const nRooms = S.rooms.filter(Boolean).length;
        if (spawnT <= 0) { spawnT = Math.max(3, 11 - nRooms * 0.9 - (S.stars - 3) * 1.2); if (guests.filter(g => g.st === 'queue').length < 6) spawnGuest(); }
        const q = guests.filter(g => g.st === 'queue');
        q.forEach((g, i) => { const tx = 700 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 55, ty = 840; g.x += clamp(tx - g.x, -150 * dt, 150 * dt); g.y += clamp(ty - g.y, -150 * dt, 150 * dt); g.wait += dt; if (g.wait > g.patience) { g.st = 'leave'; route(g, [{ x: 700, y: MH + 40 }]); S.stars = Math.max(1, S.stars - 0.2); fx.text(g.x, g.y - 60, '😤', '#f87171', 26); E.sound('bad'); } });
        // check-in at desk (player or receptionist)
        const atDesk = dist(me.x, me.y, DESKSPOT.x, DESKSPOT.y) < 60;
        if ((atDesk || S.rec > 0) && q.length && freeRoom() >= 0) { checkT += dt * (atDesk ? 1.6 : 0.6); if (checkT >= 1) { checkT = 0; checkIn(q[0]); } } else checkT = 0;
        for (const g of guests) {
          if (g.st === 'toRoom') { if (walkPath(g, 140, dt)) { g.st = 'stay'; g.stay = rand(22, 34); } }
          else if (g.st === 'stay') { g.stay -= dt; if (!g.req && Math.random() < dt * 0.04) { g.req = pick(['towel', 'food']); g.reqT = 25; E.sound('ding'); } if (g.req) { g.reqT -= dt; if (g.reqT <= 0) { g.req = null; g.sat -= 0.25; } } if (g.stay <= 0) checkout(g); }
          else if (g.st === 'leave') { if (walkPath(g, 150, dt)) g.gone = true; }
        }
        guests = guests.filter(g => !g.gone);
        // supply closet + deliveries
        for (const s of SHELF) if (!me.carry && dist(me.x, me.y, s.x, s.y + 30) < 50) { me.carry = s.item; E.sound('pop'); fx.text(me.x, me.y - 70, 'Got ' + s.e, '#fff', 18); }
        if (me.carry) for (const g of guests) if (g.st === 'stay' && g.req === me.carry && inRoom(me, g.room)) { g.req = null; g.sat += 0.2; me.carry = null; const tip = 15 + S.beds * 5; cash.push({ x: me.x, y: me.y + 30, v: tip }); E.sound('coin'); fx.text(me.x, me.y - 70, 'Delivered! +tip', '#86efac', 18); }
        // cleaning (player stands in dirty room)
        ROOMS.forEach((r, i) => { const st = rs(i); if (st.st !== 'dirty') return; if (inRoom(me, i)) { st.clean += dt / 2.2; if (Math.random() < dt * 8) fx.burst(me.x, me.y, 2, { col: ['#bae6fd', '#fff'], spd: 80, shape: 'star' }); } if (st.clean >= 1) { st.st = 'clean'; st.clean = 0; st.trash = []; E.sound('ding'); fx.burst(r.x + r.w / 2, r.y + r.h / 2, 30, { col: ['#fff', '#bae6fd', '#fde047'], spd: 200, shape: 'star' }); } });
        // staff AI
        for (const s of staff) {
          s.step = (s.step || 0);
          if (s.kind === 'maid') { if (!s.task) { const i = ROOMS.findIndex((r, k) => rs(k).st === 'dirty' && !staff.some(o => o !== s && o.task === k)); if (i >= 0) { s.task = i; const r = ROOMS[i]; route(s, [{ x: s.x, y: 600 }, { x: r.door, y: 600 }, { x: r.door, y: r.top ? r.y + r.h - 60 : r.y + 60 }, { x: r.x + r.w / 2, y: r.y + r.h / 2 }]); } } else if (walkPath(s, 130, dt)) { const st = rs(s.task); if (st.st === 'dirty') { st.clean += dt / 4.5; } else { s.task = null; route(s, [{ x: s.x, y: 600 }]); } } }
          else { if (!s.task) { const g = guests.find(g => g.st === 'stay' && g.req && !staff.some(o => o.task === g)); if (g) { s.task = g; const sh = SHELF.find(x => x.item === g.req); route(s, [{ x: s.x, y: 600 }, { x: 145, y: 600 }, { x: sh.x, y: sh.y + 30 }]); s.phase = 0; } } else { const g = s.task; if (!guests.includes(g) || !g.req) { s.task = null; s.carry = null; route(s, [{ x: s.x, y: 600 }]); continue; } if (walkPath(s, 150, dt)) { if (s.phase === 0) { s.phase = 1; s.carry = g.req; const r = ROOMS[g.room]; route(s, [{ x: 145, y: 600 }, { x: r.door, y: 600 }, { x: r.door, y: r.top ? r.y + r.h - 60 : r.y + 60 }]); } else { g.req = null; g.sat += 0.15; s.carry = null; s.task = null; cash.push({ x: CASH.x + rand(-40, 40), y: CASH.y, v: 8 }); } } } }
        }
        // cash pickup
        for (let i = cash.length - 1; i >= 0; i--) { const c = cash[i]; if (dist(c.x, c.y, me.x, me.y) < 58) { S.money += c.v; cash.splice(i, 1); E.sound('coin', 30); fx.text(c.x, c.y - 30, '+$' + c.v, '#86efac', 18); } }
        if (S.vend) { vendT += dt; if (vendT > 6) { vendT = 0; cash.push({ x: 1000 + rand(-15, 15), y: 760, v: 6 * S.vend }); } }
        // build pads
        for (const p of PADS) { if (!p.ok()) continue; if (dist(me.x, me.y, p.x, p.y) < 42 && S.money > 0) { const need = p.cost() - p.paid, pay = Math.min(need, S.money, Math.max(5, p.cost() * 1.4 * dt)); p.paid += pay; S.money -= pay; if (Math.random() < 0.3) E.sound('tick', 60); if (p.paid >= p.cost() - 0.01) { p.paid = 0; p.buy(); E.sound('buy'); E.sound('rare'); msg = '✅ ' + p.label + ' unlocked!'; msgT = 2; fx.burst(p.x, p.y, 40, { col: ['#86efac', '#fde047', '#fff'], spd: 260, shape: 'star' }); mkStaff(); save(); } } }
        saveT += dt; if (saveT > 5) { saveT = 0; save(); }
        E.follow(me.x, me.y, Math.min(1.05, Math.min(E.W, E.H) / 720), dt);
      },
      draw() {
        const Wd = E.W, Hd = E.H; ctx.fillStyle = '#365314'; ctx.fillRect(0, 0, Wd, Hd);
        E.beginWorld();
        // outside
        ctx.fillStyle = '#4d7c0f'; ctx.fillRect(-600, -600, MW + 1200, MH + 1200); ctx.fillStyle = '#a8a29e'; ctx.fillRect(600, MH, 200, 600);
        for (let i = 0; i < 14; i++) { circle(ctx, -80 + (i % 2) * 40, 200 + i * 70, 30, '#166534'); circle(ctx, MW + 80 - (i % 2) * 40, 200 + i * 70, 30, '#166534'); }
        // floors
        ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, 160, MW, MH - 160);
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(20, 500, MW - 40, 160); ctx.fillStyle = 'rgba(253,224,71,.25)'; for (let x = 40; x < MW - 40; x += 80) ctx.fillRect(x, 575, 40, 6);
        for (let x = 280; x < 1120; x += 60) for (let y = 660; y < MH - 20; y += 60) { ctx.fillStyle = ((x + y) / 60) % 2 ? '#f5f5f4' : '#e7e5e4'; ctx.fillRect(x, y, 60, 60); }
        if (S.decor) { ctx.fillStyle = 'rgba(185,28,28,.85)'; rr(ctx, 560, 820, 280, 120, 20); ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; rr(ctx, 570, 830, 260, 100, 16); ctx.stroke(); }
        // rooms
        ROOMS.forEach((r, i) => {
          const open = S.rooms[i], st = rs(i);
          ctx.fillStyle = open ? '#d6a46a' : '#78716c'; ctx.fillRect(r.x, r.y, r.w, r.h);
          if (open) { ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let y = r.y; y < r.y + r.h; y += 18) ctx.fillRect(r.x, y, r.w, 2);
            const bx = r.x + 30, by = r.top ? r.y + 30 : r.y + r.h - 150; ctx.fillStyle = '#7c2d12'; rr(ctx, bx - 4, by - 4, 128, 128, 10); ctx.fill(); ctx.fillStyle = '#fff'; rr(ctx, bx, by, 120, 120, 8); ctx.fill(); ctx.fillStyle = ['#ef4444', '#3b82f6', '#a855f7', '#f59e0b', '#14b8a6'][S.beds]; rr(ctx, bx, by + 40, 120, 80, 8); ctx.fill(); ctx.fillStyle = '#f8fafc'; rr(ctx, bx + 10, by + 8, 45, 26, 8); ctx.fill(); rr(ctx, bx + 65, by + 8, 45, 26, 8); ctx.fill();
            ctx.fillStyle = '#78350f'; ctx.fillRect(r.x + r.w - 48, by, 30, 30); circle(ctx, r.x + r.w - 33, by + 15, 9, '#fde047'); ctx.fillStyle = '#166534'; circle(ctx, r.x + r.w - 30, by + 100, 14); ctx.fill();
            if (S.beds >= 2) { ctx.fillStyle = 'rgba(167,139,250,.5)'; ellipse(ctx, r.x + r.w / 2, r.y + r.h / 2 + (r.top ? 40 : -40), 60, 26); ctx.fill(); }
            for (const tr of st.trash) E.emoji(ctx, tr.e, tr.x, tr.y, 22);
            if (st.st === 'dirty') { label(ctx, st.clean > 0 ? '🧹 ' + Math.round(st.clean * 100) + '%' : '🧹 DIRTY', r.x + r.w / 2, r.y + r.h / 2, 16, '#fde047'); if (st.clean > 0) { ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 30, 18, -Math.PI / 2, -Math.PI / 2 + TAU * st.clean); ctx.stroke(); } }
          } else { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(r.x, r.y, r.w, r.h); label(ctx, '🔒', r.x + r.w / 2, r.y + r.h / 2, 30); }
          ctx.fillStyle = '#1f2937'; rr(ctx, r.door - 26, r.top ? r.doorY - 34 : r.doorY + 14, 52, 20, 5); ctx.fill(); txt(ctx, String(101 + i), r.door, r.top ? r.doorY - 24 : r.doorY + 24, 12, '#fde68a', 'center', 900);
        });
        // closet
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(CLOSET.x, CLOSET.y, CLOSET.w, CLOSET.h); label(ctx, 'SUPPLY ROOM', CLOSET.x + CLOSET.w / 2, CLOSET.y + CLOSET.h - 30, 14, '#334155');
        for (const s of SHELF) { ctx.fillStyle = '#92400e'; rr(ctx, s.x - 44, s.y - 30, 88, 60, 8); ctx.fill(); E.emoji(ctx, s.e, s.x, s.y - 2, 34); ctx.strokeStyle = 'rgba(34,197,94,.7)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y + 30, 34, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        // walls
        for (const w of walls) { ctx.fillStyle = '#57534e'; ctx.fillRect(w[0], w[1], w[2], w[3]); }
        ctx.fillStyle = '#44403c'; for (const w of walls) ctx.fillRect(w[0], w[1] + w[3] - 3, w[2], 3);
        // desk
        ctx.fillStyle = '#7c2d12'; rr(ctx, DESK.x, DESK.y, DESK.w, DESK.h, 8); ctx.fill(); txt(ctx, 'RECEPTION', DESK.x + DESK.w / 2, DESK.y + 21, 14, '#fde68a', 'center', 900); circle(ctx, DESK.x + DESK.w - 20, DESK.y + 10, 7, '#fbbf24');
        const atDesk = dist(me.x, me.y, DESKSPOT.x, DESKSPOT.y) < 60;
        ctx.strokeStyle = atDesk ? '#4ade80' : 'rgba(34,197,94,.6)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(DESKSPOT.x, DESKSPOT.y, 34, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        if (checkT > 0) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(DESKSPOT.x, DESKSPOT.y, 40, -Math.PI / 2, -Math.PI / 2 + TAU * checkT); ctx.stroke(); }
        if (S.vend) { ctx.fillStyle = '#dc2626'; rr(ctx, 975, 680, 50, 70, 6); ctx.fill(); ctx.fillStyle = '#bae6fd'; ctx.fillRect(982, 690, 36, 30); }
        for (let k = 0; k < S.decor; k++) { ctx.fillStyle = '#166534'; circle(ctx, 320 + k * 30, 690, 16); ctx.fill(); }
        // pads
        for (const p of PADS) { if (!p.ok()) continue; const c = p.cost(); ctx.fillStyle = 'rgba(220,252,231,.92)'; rr(ctx, p.x - 80, p.y - 32, 160, 64, 12); ctx.fill(); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(34,197,94,.7)'; rr(ctx, p.x - 80, p.y + 22, 160 * p.paid / c, 10, 5); ctx.fill(); txt(ctx, p.label, p.x, p.y - 10, 13, '#14532d', 'center', 900); txt(ctx, '$' + fmtBig(Math.ceil(c - p.paid)), p.x, p.y + 10, 13, S.money >= 1 ? '#166534' : '#7f1d1d', 'center', 800); }
        // cash
        for (const c of cash) { ctx.fillStyle = '#16a34a'; rr(ctx, c.x - 16, c.y - 9, 32, 18, 3); ctx.fill(); ctx.fillStyle = '#86efac'; ctx.fillRect(c.x - 12, c.y - 5, 24, 10); txt(ctx, '$', c.x, c.y + 1, 11, '#14532d', 'center', 900); }
        // people
        const drawP = (x, y, lk, face, step, extra) => { ctx.save(); ctx.translate(x, y); ellipse(ctx, 0, 4, 16, 6, 'rgba(0,0,0,.25)'); const sw = Math.sin(step || 0) * 4; ctx.fillStyle = '#1f2937'; ctx.fillRect(-8, -16 + sw * 0.3, 6, 16); ctx.fillRect(2, -16 - sw * 0.3, 6, 16); ctx.fillStyle = lk.shirt; rr(ctx, -12, -42, 24, 28, 8); ctx.fill(); circle(ctx, 0, -53, 11, lk.skin); ctx.fillStyle = lk.hair; ctx.beginPath(); ctx.arc(0, -56, 11.5, Math.PI, 0); ctx.fill(); circle(ctx, face * 4 - 3, -52, 1.6, '#111'); circle(ctx, face * 4 + 3, -52, 1.6, '#111'); if (extra === 'bag') { ctx.fillStyle = lk.bag; rr(ctx, 12, -24, 13, 17, 3); ctx.fill(); } ctx.restore(); };
        const list = guests.map(g => ({ y: g.y, f: () => { drawP(g.x, g.y, g.look, g.face || 1, g.step, g.st === 'queue' || g.st === 'toRoom' ? 'bag' : null); if (g.st === 'queue') { const p = g.wait / g.patience; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(g.x - 16, g.y - 80, 32, 5); ctx.fillStyle = p < 0.5 ? '#4ade80' : p < 0.8 ? '#facc15' : '#ef4444'; ctx.fillRect(g.x - 16, g.y - 80, 32 * (1 - p), 5); } if (g.st === 'stay' && g.req) { rr(ctx, g.x - 22, g.y - 98, 44, 32, 10); ctx.fillStyle = '#fff'; ctx.fill(); E.emoji(ctx, g.req === 'towel' ? '🧺' : '🍔', g.x, g.y - 82, 22); } } }));
        for (const s of staff) list.push({ y: s.y, f: () => { drawP(s.x, s.y, { skin: '#c68642', shirt: s.col, hair: '#111' }, s.face || 1, s.step); if (s.carry) E.emoji(ctx, s.carry === 'towel' ? '🧺' : '🍔', s.x, s.y - 78, 20); } });
        if (S.rec) list.push({ y: 690, f: () => drawP(640, 700, { skin: '#f1c27d', shirt: '#1e3a8a', hair: '#7c2d12' }, 1, 0) });
        list.push({ y: me.y, f: () => { drawP(me.x, me.y, { skin: '#f1c27d', shirt: '#111827', hair: '#3f2a1d' }, me.face, me.step); ctx.fillStyle = '#fde047'; ctx.fillRect(me.x - 3, me.y - 40, 6, 16); if (me.carry) E.emoji(ctx, me.carry === 'towel' ? '🧺' : '🍔', me.x, me.y - 80, 24); label(ctx, 'YOU', me.x, me.y - (me.carry ? 104 : 78), 12, '#fde047'); } });
        list.sort((a, b) => a.y - b.y).forEach(o => o.f());
        fx.draw(ctx); E.endWorld();
        rr(ctx, Wd / 2 - 170, 10, 340, 54, 16); ctx.fillStyle = 'rgba(15,23,42,.8)'; ctx.fill();
        label(ctx, '$' + fmt(S.money), Wd / 2 - 70, 37, 24, '#86efac'); label(ctx, '⭐ ' + S.stars.toFixed(1), Wd / 2 + 70, 37, 20, '#fde047');
        const q = guests.filter(g => g.st === 'queue').length, reqs = guests.filter(g => g.req).length, dirty = roomState.filter((s, i) => S.rooms[i] && s.st === 'dirty').length;
        const tip = q && freeRoom() >= 0 && !atDesk && !S.rec ? '🛎️ Guests waiting – stand behind the RECEPTION desk!' : q && freeRoom() < 0 ? (dirty ? '🧹 No clean rooms – go clean a dirty room!' : '🔨 All rooms full – build more rooms!') : reqs && !me.carry ? '🧺 A guest needs something – grab it from the SUPPLY ROOM' : me.carry ? '🚪 Take it to the guest\'s room' : cash.length ? '💵 Collect the cash at the desk' : '';
        if (tip) label(ctx, tip, Wd / 2, 86, 15, '#fff');
        if (msgT > 0) label(ctx, msg, Wd / 2, Hd * 0.28, 28, '#fde047');
      },
      _dbg: () => ({ x: Math.round(me.x), y: Math.round(me.y), money: Math.round(S.money), q: guests.filter(g => g.st === 'queue').length, stay: guests.filter(g => g.st === 'stay').length, cash: cash.length, dirty: roomState.filter(s => s.st === 'dirty').length }),
      destroy() { save(); },
      hud() { return { stats: [['Rooms', S.rooms.filter(Boolean).length + '/7'], ['Guests', S.served]] }; }
    };
  }
});
