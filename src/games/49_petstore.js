/* =====================================================================
   PET STORE SIMULATOR
   ===================================================================== */
registerGame({
  id: 'petstore', title: 'Pet Store Simulator', emoji: '🐶', c1: '#f6d365', c2: '#fda085', cats: ['Simulation', 'Creative'], featured: true, isNew: true,
  desc: 'Run a cozy pet shop: feed and clean your animals, keep them happy, sell supplies, help families adopt, hire helpers, unlock new animals and upgrade the store!',
  controls: 'Tap pens, shelves & customers', scoreLabel: 'STORE VALUE ($)', fmtScore: v => '$' + fmtBig(v),
  hint: 'Tap a pen to feed / clean / play. Tap customers at the counter to serve them. Restock shelves & unlock animals with the buttons below.', hintTouch: 'Tap pens to care for pets • tap customers at the counter to serve them!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), ui = UI(), VW = 1100, VH = 720;
    const ANI = [
      { k: 'puppy', n: 'Puppy', e: '🐶', price: 220, unlock: 0, hab: '#fcd34d', food: 'kibble' }, { k: 'kitten', n: 'Kitten', e: '🐱', price: 200, unlock: 0, hab: '#f9a8d4', food: 'kibble' },
      { k: 'bunny', n: 'Bunny', e: '🐰', price: 160, unlock: 300, hab: '#bbf7d0', food: 'veggies' }, { k: 'fish', n: 'Goldfish', e: '🐠', price: 90, unlock: 500, hab: '#7dd3fc', food: 'flakes' },
      { k: 'hamster', n: 'Hamster', e: '🐹', price: 120, unlock: 800, hab: '#fde68a', food: 'veggies' }, { k: 'parrot', n: 'Parrot', e: '🦜', price: 450, unlock: 2000, hab: '#a7f3d0', food: 'seeds' },
      { k: 'turtle', n: 'Turtle', e: '🐢', price: 380, unlock: 3500, hab: '#86efac', food: 'veggies' }, { k: 'lizard', n: 'Gecko', e: '🦎', price: 520, unlock: 6000, hab: '#fdba74', food: 'seeds' },
      { k: 'pony', n: 'Mini Pony', e: '🐴', price: 1600, unlock: 15000, hab: '#ddd6fe', food: 'veggies' }
    ];
    const ITEMS = [{ k: 'kibble', n: 'Kibble', e: '🦴', buy: 4, sell: 12 }, { k: 'veggies', n: 'Veggies', e: '🥕', buy: 3, sell: 9 }, { k: 'flakes', n: 'Fish Flakes', e: '🫙', buy: 2, sell: 7 }, { k: 'seeds', n: 'Seeds', e: '🌻', buy: 3, sell: 10 }, { k: 'toys', n: 'Toys', e: '🧸', buy: 6, sell: 18 }, { k: 'collar', n: 'Collars', e: '🎀', buy: 8, sell: 25 }];
    const S = Object.assign({ money: 350, unlocked: ['puppy', 'kitten'], pens: [{ k: 'puppy' }, { k: 'kitten' }], stock: { kibble: 10, veggies: 6, flakes: 4, seeds: 4, toys: 4, collar: 2 }, staff: { cashier: 0, keeper: 0 }, decor: 0, sold: 0, adopted: 0, rating: 4 }, E.data('save', {}));
    S.pens.forEach(p => { p.hunger = p.hunger === undefined ? 0.8 : p.hunger; p.clean = p.clean === undefined ? 0.8 : p.clean; p.joy = p.joy === undefined ? 0.8 : p.joy; p.has = p.has === undefined ? true : p.has; p.restock = p.restock || 0; });
    const penPos = i => ({ x: 70 + (i % 4) * 250, y: 120 + Math.floor(i / 4) * 200, w: 220, h: 160 });
    const SHELF = { x: 70, y: 520, w: 560, h: 70 }, COUNTER = { x: 760, y: 520, w: 260, h: 70 }, DOOR = { x: 1040, y: 640 };
    let customers = [], spawnT = 2, t = 0, selPen = -1, saveT = 0, keeperT = 0, cashT = 0, ratings = [];
    const ani = k => ANI.find(a => a.k === k);
    const penCost = () => Math.floor(400 * Math.pow(2.1, S.pens.length - 2));
    function save() { E.save('save', S); E.submitBest(Math.floor(S.money + S.pens.length * 400 + S.unlocked.length * 300)); }
    function spawn() {
      const wantAdopt = Math.random() < 0.35 && S.pens.some(p => p.has);
      const look = { skin: pick(['#f1c27d', '#c68642', '#8d5524', '#ffdbac']), shirt: hsl(irand(0, 359), 60, 55), hair: pick(['#111', '#5b3a1c', '#d97706', '#9ca3af']) };
      const c = { x: DOOR.x, y: DOOR.y, look, st: 'enter', patience: rand(30, 45), wait: 0, want: null, sat: 0.6 + S.decor * 0.06 };
      if (wantAdopt) { const opts = S.pens.map((p, i) => i).filter(i => S.pens[i].has); c.want = { type: 'pet', pen: pick(opts) }; }
      else { const it = pick(ITEMS.filter(i => i.k !== 'flakes' || S.unlocked.includes('fish'))); c.want = { type: 'item', k: it.k, n: irand(1, 3) }; }
      customers.push(c);
    }
    function target(c) {
      if (c.st === 'enter') { if (c.want.type === 'pet') { const p = penPos(c.want.pen); return { x: p.x + p.w / 2, y: p.y + p.h + 26 }; } const k = ITEMS.findIndex(i => i.k === c.want.k); return { x: SHELF.x + 40 + k * 90, y: SHELF.y - 24 }; }
      if (c.st === 'queue') { const q = customers.filter(o => o.st === 'queue').indexOf(c); return { x: COUNTER.x + 40 + q * 50, y: COUNTER.y + COUNTER.h + 40 }; }
      if (c.st === 'leave') return { x: DOOR.x + 60, y: DOOR.y + 40 };
      return { x: c.x, y: c.y };
    }
    function serve(c) {
      if (c.st !== 'queue') return;
      if (c.want.type === 'pet') {
        const p = S.pens[c.want.pen]; if (!p || !p.has) { leave(c, false, 'Pet gone 😢'); return; }
        const happy = (p.hunger + p.clean + p.joy) / 3; if (happy < 0.4) { leave(c, false, 'Pet looks unhappy 😟'); return; }
        const a = ani(p.k), pay = Math.round(a.price * (0.7 + happy * 0.6)); S.money += pay; S.adopted++; p.has = false; p.restock = 18;
        fx.text(c.x, c.y - 70, '🏡 Adopted! +$' + pay, '#86efac', 20); E.sound('cheer'); leave(c, true);
      } else {
        const it = ITEMS.find(i => i.k === c.want.k), have = S.stock[c.want.k] || 0; if (have <= 0) { leave(c, false, 'Out of stock!'); return; }
        const n = Math.min(have, c.want.n); S.stock[c.want.k] -= n; const pay = it.sell * n; S.money += pay; S.sold += n; fx.text(c.x, c.y - 70, '+$' + pay, '#86efac', 20); E.sound('coin'); leave(c, true);
      }
    }
    function leave(c, ok, why) {
      c.st = 'leave'; const avgHappy = S.pens.reduce((s, p) => s + (p.hunger + p.clean + p.joy) / 3, 0) / Math.max(1, S.pens.length);
      const st = ok ? clamp(Math.round(2 + c.sat * 2 + avgHappy * 1.5 - c.wait / 30), 1, 5) : 1; ratings.push(st); if (ratings.length > 20) ratings.shift(); S.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      if (!ok) { fx.text(c.x, c.y - 70, why || '😤', '#fca5a5', 18); E.sound('bad'); }
      save();
    }
    function care(i, act) {
      const p = S.pens[i]; if (!p || !p.has) return; const a = ani(p.k);
      if (act === 'feed') { if ((S.stock[a.food] || 0) <= 0) { E.toast('No ' + ITEMS.find(x => x.k === a.food).n + ' left – restock!'); E.sound('error'); return; } S.stock[a.food]--; p.hunger = 1; E.sound('eat'); fx.burst(penPos(i).x + 110, penPos(i).y + 80, 10, { col: ['#fde047', '#fb923c'], spd: 120 }); }
      if (act === 'clean') { p.clean = 1; E.sound('swish'); fx.burst(penPos(i).x + 110, penPos(i).y + 80, 14, { col: ['#bae6fd', '#fff'], spd: 160, shape: 'star' }); }
      if (act === 'play') { p.joy = 1; E.sound('pop'); fx.text(penPos(i).x + 110, penPos(i).y + 40, '💕', '#f472b6', 30); }
    }
    function openShop() {
      const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span><span>⭐ ${S.rating.toFixed(1)}</span></div>`;
      const sec = (title) => { const h = document.createElement('h3'); h.style.margin = '12px 0 8px'; h.textContent = title; g.appendChild(h); const d = document.createElement('div'); d.className = 'shopgrid'; g.appendChild(d); return d; };
      const mk = (grid, title, sub, btn, dis, fn) => { const el = document.createElement('div'); el.className = 'up'; el.innerHTML = `<h4>${title}</h4><small>${sub}</small>`; const b = document.createElement('button'); b.textContent = btn; b.disabled = dis; b.onclick = () => { fn(); openShop(); }; el.appendChild(b); grid.appendChild(el); };
      const g1 = sec('📦 Restock supplies (×10)'); ITEMS.forEach(it => { const c = it.buy * 10; mk(g1, it.e + ' ' + it.n + `<span class="lv">${S.stock[it.k] || 0} left</span>`, 'Sells for $' + it.sell + ' each', '$' + c, S.money < c, () => { S.money -= c; S.stock[it.k] = (S.stock[it.k] || 0) + 10; E.sound('buy'); save(); }); });
      const g2 = sec('🐾 Animals'); ANI.forEach(a => { const has = S.unlocked.includes(a.k); mk(g2, a.e + ' ' + a.n + (has ? '<span class="lv">unlocked</span>' : ''), 'Adoption ~$' + a.price, has ? (S.pens.length < 8 ? 'Add pen $' + fmtBig(penCost()) : 'Store full') : 'Unlock $' + fmtBig(a.unlock), has ? (S.money < penCost() || S.pens.length >= 8) : S.money < a.unlock, () => { if (!has) { S.money -= a.unlock; S.unlocked.push(a.k); E.sound('rare'); } else { S.money -= penCost(); S.pens.push({ k: a.k, hunger: 1, clean: 1, joy: 1, has: true, restock: 0 }); E.sound('buy'); } save(); }); });
      const g3 = sec('👥 Staff & store'); const cs = 500 * Math.pow(2.4, S.staff.cashier), ks = 450 * Math.pow(2.4, S.staff.keeper), ds = 300 * Math.pow(2.5, S.decor);
      mk(g3, '🧾 Cashier<span class="lv">' + S.staff.cashier + '</span>', 'Serves customers at the counter automatically', '$' + fmtBig(cs), S.money < cs || S.staff.cashier >= 4, () => { S.money -= cs; S.staff.cashier++; E.sound('buy'); save(); });
      mk(g3, '🧑‍🌾 Animal Keeper<span class="lv">' + S.staff.keeper + '</span>', 'Feeds, cleans and plays with pets automatically', '$' + fmtBig(ks), S.money < ks || S.staff.keeper >= 4, () => { S.money -= ks; S.staff.keeper++; E.sound('buy'); save(); });
      mk(g3, '🪴 Store Décor<span class="lv">Lv ' + S.decor + '</span>', 'Happier customers, better ratings', '$' + fmtBig(ds), S.money < ds || S.decor >= 6, () => { S.money -= ds; S.decor++; E.sound('buy'); save(); });
      E.panel.open('🛒 Pet Store Manager', g);
    }
    const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:8px';
    const b1 = document.createElement('button'); b1.className = 'btn primary'; b1.style.cssText = 'padding:10px 18px'; b1.textContent = '🛒 Manage Store'; b1.onclick = e => { e.stopPropagation(); openShop(); }; bar.appendChild(b1); E.layer.appendChild(bar);
    function drawPerson(x, y, lk, walk) { ctx.save(); ctx.translate(x, y); const st = walk ? Math.sin(t * 10 + x) * 3 : 0; ellipse(ctx, 0, 2, 14, 6, 'rgba(0,0,0,.2)'); ctx.fillStyle = '#1f2937'; ctx.fillRect(-7, -14 + st, 6, 14); ctx.fillRect(1, -14 - st, 6, 14); ctx.fillStyle = lk.shirt; rr(ctx, -11, -38, 22, 26, 7); ctx.fill(); circle(ctx, 0, -48, 10, lk.skin); ctx.fillStyle = lk.hair; ctx.beginPath(); ctx.arc(0, -51, 10.5, Math.PI, 0); ctx.fill(); ctx.restore(); }
    return {
      update(dt) {
        t += dt; fx.update(dt);
        for (const p of S.pens) { p.hunger = Math.max(0, p.hunger - dt * 0.012); p.clean = Math.max(0, p.clean - dt * 0.009); p.joy = Math.max(0, p.joy - dt * 0.011); if (!p.has) { p.restock -= dt; if (p.restock <= 0) { p.has = true; p.hunger = p.clean = p.joy = 0.9; } } }
        spawnT -= dt; if (spawnT <= 0) { spawnT = rand(4, 7) - Math.min(2.5, (S.rating - 3) * 0.8) - S.decor * 0.2; if (customers.length < 8) spawn(); }
        for (const c of customers) {
          const tg = target(c), dx = tg.x - c.x, dy = tg.y - c.y, d = Math.hypot(dx, dy), sp = 120;
          if (d > 2) { c.x += dx / d * Math.min(d, sp * dt); c.y += dy / d * Math.min(d, sp * dt); c.walk = true; } else { c.walk = false; if (c.st === 'enter') { c.browse = (c.browse || 0) + dt; if (c.browse > 1.5) c.st = 'queue'; } if (c.st === 'leave') c.gone = true; }
          if (c.st === 'queue') { c.wait += dt; if (c.wait > c.patience) leave(c, false, 'Waited too long! 😤'); }
        }
        customers = customers.filter(c => !c.gone);
        if (S.staff.cashier) { cashT -= dt; if (cashT <= 0) { cashT = 3.5 / S.staff.cashier; const c = customers.find(c => c.st === 'queue' && Math.hypot(target(c).x - c.x, target(c).y - c.y) < 4); if (c) serve(c); } }
        if (S.staff.keeper) { keeperT -= dt; if (keeperT <= 0) { keeperT = 4 / S.staff.keeper; let worst = -1, wv = 2; S.pens.forEach((p, i) => { if (!p.has) return; const v = Math.min(p.hunger, p.clean, p.joy); if (v < wv) { wv = v; worst = i; } }); if (worst >= 0 && wv < 0.6) { const p = S.pens[worst]; const m = Math.min(p.hunger, p.clean, p.joy); care(worst, m === p.hunger ? 'feed' : m === p.clean ? 'clean' : 'play'); } } }
        saveT += dt; if (saveT > 6) { saveT = 0; save(); }
      },
      draw() {
        const W = E.W, H = E.H; ui.clear(); const view = E.fit(VW, VH); this._v = view;
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 0, W, H); view.apply(ctx);
        // floor tiles
        for (let x = 0; x < VW; x += 50) for (let y = 0; y < VH; y += 50) { ctx.fillStyle = ((x + y) / 50) % 2 ? '#fef3c7' : '#fde68a'; ctx.fillRect(x, y, 50, 50); }
        ctx.fillStyle = '#fb923c'; ctx.fillRect(0, 0, VW, 70); txt(ctx, '🐾 HAPPY PAWS PET STORE 🐾', VW / 2, 36, 28, '#fff7ed', 'center', 900);
        for (let k = 0; k < S.decor; k++) { E.emoji(ctx, ['🪴', '🎈', '🖼️', '🌈', '✨', '🏆'][k], 30 + k * 0, 110 + k * 70, 26); }
        // pens
        S.pens.forEach((p, i) => {
          const r = penPos(i), a = ani(p.k), x = r.x, y = r.y;
          shadowOn(ctx, 'rgba(0,0,0,.25)', 12, 0, 6); rr(ctx, x, y, r.w, r.h, 16); ctx.fillStyle = a.hab; ctx.fill(); shadowOff(ctx);
          ctx.strokeStyle = i === selPen ? '#2563eb' : '#92400e'; ctx.lineWidth = i === selPen ? 5 : 4; ctx.stroke();
          if (p.k === 'fish') { rr(ctx, x + 14, y + 20, r.w - 28, r.h - 60, 10); ctx.fillStyle = 'rgba(14,165,233,.5)'; ctx.fill(); for (let k = 0; k < 4; k++) circle(ctx, x + 40 + k * 40, y + 30 + ((t * 30 + k * 20) % 60), 3, 'rgba(255,255,255,.6)'); }
          else { ctx.fillStyle = 'rgba(146,64,14,.25)'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 12 + k * 36, y + r.h - 46, 26, 4); }
          if (p.clean < 0.4) for (let k = 0; k < 4; k++) circle(ctx, x + 30 + k * 50, y + r.h - 54, 6, 'rgba(120,80,40,.6)');
          if (p.has) { const bob = Math.sin(t * 3 + i) * 4, hop = p.joy > 0.6 ? Math.abs(Math.sin(t * 5 + i)) * 10 : 0; E.emoji(ctx, a.e, x + r.w / 2 + Math.sin(t * 0.7 + i) * 40, y + r.h / 2 - 12 + bob - hop, 54); const mood = (p.hunger + p.clean + p.joy) / 3; txt(ctx, mood > 0.7 ? '💖' : mood > 0.4 ? '🙂' : '😢', x + r.w - 22, y + 22, 20); }
          else txt(ctx, '🏡 adopted! new ' + a.n.toLowerCase() + ' in ' + Math.ceil(p.restock) + 's', x + r.w / 2, y + r.h / 2 - 10, 13, '#7c2d12', 'center', 800);
          // need bars
          [['🍖', p.hunger, '#f97316'], ['🧼', p.clean, '#0ea5e9'], ['🎾', p.joy, '#ec4899']].forEach(([ic, v, col], k) => { const bx = x + 14 + k * 68, by = y + r.h - 30; txt(ctx, ic, bx + 8, by + 6, 12); rr(ctx, bx + 18, by, 44, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); rr(ctx, bx + 18, by, 44 * v, 10, 5); ctx.fillStyle = v < 0.3 ? '#ef4444' : col; ctx.fill(); });
          txt(ctx, a.n, x + 14, y + 16, 13, '#7c2d12', 'left', 900);
          ui.zone('p' + i, x, y, r.w, r.h);
          if (i === selPen && p.has) { const food = ITEMS.find(q => q.k === a.food); [['feed', '🍖 Feed (' + food.e + (S.stock[a.food] || 0) + ')'], ['clean', '🧼 Clean'], ['play', '🎾 Play']].forEach(([id, l], k) => ui.btn(ctx, id + i, x + 4 + k * 72, y - 46, 70, 38, l, { size: 10.5, cols: ['#60a5fa', '#2563eb'] })); }
        });
        for (let i = S.pens.length; i < 8; i++) { const r = penPos(i); ctx.strokeStyle = 'rgba(146,64,14,.35)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke(); ctx.setLineDash([]); txt(ctx, '＋ New pen', r.x + r.w / 2, r.y + r.h / 2 - 8, 16, 'rgba(146,64,14,.55)', 'center', 900); txt(ctx, '(Manage Store)', r.x + r.w / 2, r.y + r.h / 2 + 14, 12, 'rgba(146,64,14,.45)', 'center', 700); }
        // shelf + counter
        shadowOn(ctx, 'rgba(0,0,0,.25)', 10, 0, 5); rr(ctx, SHELF.x, SHELF.y, SHELF.w, SHELF.h, 10); ctx.fillStyle = '#92400e'; ctx.fill(); shadowOff(ctx);
        ITEMS.forEach((it, k) => { const x = SHELF.x + 40 + k * 90; E.emoji(ctx, it.e, x, SHELF.y + 28, 30); txt(ctx, (S.stock[it.k] || 0) + '', x, SHELF.y + 58, 12, (S.stock[it.k] || 0) ? '#fde68a' : '#fca5a5', 'center', 900); });
        shadowOn(ctx, 'rgba(0,0,0,.25)', 10, 0, 5); rr(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 10); ctx.fillStyle = '#1e3a8a'; ctx.fill(); shadowOff(ctx); E.emoji(ctx, '🧾', COUNTER.x + 40, COUNTER.y + 34, 28); txt(ctx, 'COUNTER', COUNTER.x + COUNTER.w / 2 + 20, COUNTER.y + 36, 16, '#bfdbfe', 'center', 900);
        if (S.staff.cashier) drawPerson(COUNTER.x + COUNTER.w - 40, COUNTER.y + 10, { skin: '#c68642', shirt: '#16a34a', hair: '#111' }, false);
        ctx.fillStyle = '#92400e'; ctx.fillRect(DOOR.x - 10, DOOR.y - 20, 70, 90); ctx.fillStyle = '#7dd3fc'; ctx.fillRect(DOOR.x, DOOR.y - 10, 50, 70);
        for (const c of customers) {
          drawPerson(c.x, c.y, c.look, c.walk);
          const w = c.want, bub = w.type === 'pet' ? ani(S.pens[w.pen] ? S.pens[w.pen].k : 'puppy').e : ITEMS.find(i => i.k === w.k).e + (w.n > 1 ? '×' + w.n : '');
          rr(ctx, c.x - 26, c.y - 90, 52, 28, 10); ctx.fillStyle = '#fff'; ctx.fill(); txt(ctx, bub, c.x, c.y - 76, 15, '#111', 'center', 800);
          if (c.st === 'queue') { const pr = 1 - c.wait / c.patience; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(c.x - 18, c.y - 58, 36, 5); ctx.fillStyle = pr > 0.5 ? '#4ade80' : pr > 0.25 ? '#facc15' : '#ef4444'; ctx.fillRect(c.x - 18, c.y - 58, 36 * pr, 5); ui.zone('c' + customers.indexOf(c), c.x - 26, c.y - 95, 52, 100); }
        }
        fx.draw(ctx);
        rr(ctx, VW / 2 - 200, 80, 400, 34, 12); ctx.fillStyle = 'rgba(15,23,42,.7)'; ctx.fill();
        label(ctx, '$' + fmtBig(S.money) + '   ⭐ ' + S.rating.toFixed(1) + '   🏡 ' + S.adopted + ' adopted', VW / 2, 97, 16, '#fff');
        const q = customers.filter(c => c.st === 'queue').length; if (q && !S.staff.cashier) label(ctx, '👆 Tap customers at the counter to serve them', COUNTER.x + COUNTER.w / 2, COUNTER.y - 18, 13, '#1e3a8a');
        E.endWorld();
      },
      down(x, y) {
        const v = this._v; if (!v) return; const p = v.toWorld(x, y), id = ui.hit(p.x, p.y);
        if (!id) { selPen = -1; return; }
        if (id[0] === 'p') { selPen = +id.slice(1) === selPen ? -1 : +id.slice(1); E.sound('tick'); return; }
        if (id[0] === 'c') { serve(customers[+id.slice(1)]); return; }
        const m = /^(feed|clean|play)(\d+)$/.exec(id); if (m) care(+m[2], m[1]);
      },
      destroy() { save(); },
      hud() { return { stats: [['Pets', S.pens.length], ['Sold', S.sold]] }; }
    };
  }
});
