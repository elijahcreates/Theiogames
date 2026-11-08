/* =====================================================================
   BRAINROT HEIST — THEIOGAMES ORIGINAL
   Collect silly creatures from the conveyor belt, earn cash, upgrade your
   base, steal from AI rivals (and stop them stealing from you!), rebirth.
   ===================================================================== */
registerGame({
  id: 'brainrot', title: 'Brainrot Heist', emoji: '🧠', c1: '#ff00cc', c2: '#333399', cats: ['Simulation', 'Creative', 'IO Arena', 'Popular'], featured: true, hot: true, pop: true, isNew: true, input: 'joy',
  desc: 'Buy hilarious original creatures off the conveyor belt, watch them earn cash in your base, sneak into rival bases to steal their best ones – and lock your gate before they rob you! Upgrades, rarities, rebirths and secrets.',
  controls: 'WASD / joystick • E action • L lock', scoreLabel: 'NET WORTH', fmtScore: v => '$' + fmtBig(v),
  hint: 'Move: WASD / mouse • E = buy / steal / grab • L = lock your base • Bring creatures home to earn money. Progress saves automatically!', hintTouch: 'Joystick to move • ✋ ACTION to buy / steal • 🔒 to lock your base. Progress saves automatically!',
  create(E) {
    const ctx = E.ctx, fx = Fx(), MW = 2700, MH = 1820;
    const RAR = { Common: { c: '#cbd5e1', w: 60, hue: 210 }, Rare: { c: '#60a5fa', w: 25, hue: 215 }, Epic: { c: '#c084fc', w: 10, hue: 275 }, Legendary: { c: '#fbbf24', w: 4, hue: 45 }, Mythic: { c: '#f472b6', w: 0.9, hue: 320 }, Secret: { c: '#f8fafc', w: 0.12, hue: 0 } };
    const ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'];
    const CR = [
      ['bread', 'Breadly Bonkers', 'Common', 25, 1], ['wobble', 'Sir Wobbleton', 'Common', 40, 1.6], ['pebble', 'Pebble Pete', 'Common', 60, 2.4], ['noodle', 'Noodle Noggin', 'Common', 85, 3.2], ['sock', 'Sockopus', 'Common', 110, 4], ['spud', 'Spudnik', 'Common', 140, 5],
      ['meow', 'Chairman Meow', 'Rare', 450, 12], ['banana', 'Banana Bandito', 'Rare', 700, 17], ['toaster', 'Toastronaut', 'Rare', 1000, 23], ['duck', 'Duckuccino', 'Rare', 1400, 30], ['cactus', 'Cactus Hugsalot', 'Rare', 1900, 38],
      ['pizza', 'Pizzasaurus Rex', 'Epic', 7000, 90], ['brocco', 'Brocco Bro', 'Epic', 10000, 120], ['fridge', 'Fridgezilla', 'Epic', 14000, 160], ['gummy', 'Gummy Gladiator', 'Epic', 19000, 210], ['waffle', 'Waffle Wizard', 'Epic', 25000, 260],
      ['pickle', 'Captain Pickle', 'Legendary', 90000, 700], ['donut', 'Donut Dragon', 'Legendary', 140000, 1000], ['burger', 'Burgertron 3000', 'Legendary', 200000, 1350], ['llama', 'Disco Llama', 'Legendary', 280000, 1800],
      ['kraken', 'Croissant Kraken', 'Mythic', 1.4e6, 6000], ['gnome', 'Galaxy Gnome', 'Mythic', 2.2e6, 9000], ['teapot', 'Thunder Teapot', 'Mythic', 3.4e6, 13000],
      ['grand', 'The Grand Wobble', 'Secret', 2.5e7, 50000], ['sneaker', 'Sneakerlord Supreme', 'Secret', 4.5e7, 80000], ['glitch', 'Mr. Glitch', 'Secret', 8e7, 130000]
    ].map(([k, n, r, p, inc]) => ({ k, n, r, p, inc }));
    const CBY = {}; CR.forEach(c => CBY[c.k] = c);
    const UNLOCK = { kraken: 'Rebirth once (or VIP belt)', gnome: 'Rebirth once (or VIP belt)', teapot: 'Rebirth once (or VIP belt)', grand: 'VIP belt only', sneaker: 'VIP belt only', glitch: 'VIP belt • 2+ rebirths' };
    // ---------- save ----------
    const S = Object.assign({ money: 60, mine: [], up: { slots: 0, lock: 0, speed: 0, income: 0, luck: 0 }, rebirths: 0, found: {}, vip: false, earned: 0, last: Date.now(), steals: 0 }, E.data('save', {}));
    S.up = Object.assign({ slots: 0, lock: 0, speed: 0, income: 0, luck: 0 }, S.up || {});
    const slotsN = () => 6 + S.up.slots * 2;
    const rebirthMult = () => 1 + S.rebirths * 0.75;
    const incomeMult = () => (1 + S.up.income * 0.25) * rebirthMult();
    const crIncome = m => CBY[m.k].inc * Math.pow(1.6, (m.lv || 1) - 1);
    // ---------- world ----------
    const BW = 560, BH = 400;
    const BASES = [[110, 120], [1070, 120], [2030, 120], [110, 1300], [1070, 1300], [2030, 1300]].map(([x, y], i) => ({ i, x, y, w: BW, h: BH, top: i < 3, slots: [], vault: 0, lockT: 0, lockCD: 0 }));
    const BELT = { x0: 160, x1: 2160, y: 900, h: 110 }, VIP = { x0: 2260, x1: 2620, y: 760, h: 380, gate: 2240 };
    const myBase = BASES[4];
    function slotPos(b, i) { const cols = 5, r = Math.floor(i / cols), c = i % cols; return { x: b.x + 70 + c * 105, y: b.top ? b.y + 70 + r * 95 : b.y + b.h - 70 - r * 95 }; }
    const entrance = b => ({ x: b.x + b.w / 2, y: b.top ? b.y + b.h : b.y });
    // ---------- actors ----------
    const BOTS = [['xX_GoblinKing_Xx', 'thief', '#ef4444'], ['NoodleQueen', 'collector', '#22c55e'], ['BigBrainBrad', 'gambler', '#3b82f6'], ['CaptainChaos', 'speedy', '#f59e0b'], ['LadyLocksmith', 'defender', '#a855f7']];
    const player = { me: true, name: 'You', x: myBase.x + BW / 2, y: myBase.y + 100, vx: 0, vy: 0, carry: null, base: myBase, col: '#f43f5e', face: 1, stun: 0, step: 0 };
    myBase.owner = player;
    const bots = BOTS.map(([n, st, col], i) => { const b = BASES[[0, 1, 2, 3, 5][i]]; const bot = { me: false, name: n, strat: st, col, x: b.x + BW / 2, y: b.y + BH / 2, vx: 0, vy: 0, carry: null, base: b, money: 0, state: 'think', t: rand(1, 3), target: null, face: 1, stun: 0, step: 0 }; b.owner = bot; return bot; });
    const actors = [player].concat(bots);
    // restore player creatures
    S.mine = (S.mine || []).filter(m => CBY[m.k]);
    function mkPlaced(k, lv) { return { k, lv: lv || 1, born: Math.random() * 10 }; }
    S.mine.slice(0, slotsN()).forEach((m, i) => myBase.slots[i] = mkPlaced(m.k, m.lv));
    // seed AI bases relative to player progress
    const prog = Math.max(0, S.mine.reduce((s, m) => s + CBY[m.k].p, 0) + S.money);
    bots.forEach((bot, i) => { const n = irand(2, 4); for (let k = 0; k < n; k++) { const pool = CR.filter(c => c.p <= Math.max(150, prog * 0.6) && c.r !== 'Secret'); bot.base.slots[k] = mkPlaced(pick(pool.slice(-6)).k, 1); } bot.money = Math.max(80, prog * rand(0.05, 0.25)); });
    const away = Math.min(7200, (Date.now() - (S.last || Date.now())) / 1000);
    let offline = 0; { const inc = myBase.slots.reduce((s, m) => s + (m ? crIncome(m) : 0), 0) * incomeMult(); if (away > 30 && inc > 0) { offline = inc * away * 0.3; S.money += offline; } }
    let belt = [], vipBelt = [], spawnT = 0, vipT = 0, t = 0, saveT = 0, msg = '', msgT = 0, nearAct = null, alarm = 0, events = [];
    // ---------- creature rolls ----------
    function rollRarity(vip) {
      const luck = Math.pow(1.3, S.up.luck) * (1 + S.rebirths * 0.25); let tot = 0; const w = {};
      ORDER.forEach((r, i) => { let v = RAR[r].w * (i ? Math.pow(luck, i * 0.6) : 1); if (vip) v = i < 2 ? 0 : v * 3; if (r === 'Mythic' && !vip && S.rebirths < 1) v = 0; if (r === 'Secret' && !vip) v = 0; w[r] = v; tot += v; });
      let x = Math.random() * tot; for (const r of ORDER) { x -= w[r]; if (x <= 0) return r; } return 'Common';
    }
    function rollCreature(vip) { const r = rollRarity(vip); let pool = CR.filter(c => c.r === r && (c.k !== 'glitch' || S.rebirths >= 2)); if (!pool.length) pool = CR.filter(c => c.r === 'Legendary'); return pick(pool); }
    function spawnBelt() { const c = rollCreature(false); belt.push({ k: c.k, x: BELT.x0, y: BELT.y + rand(-14, 14), born: Math.random() * 10 }); if (ORDER.indexOf(c.r) >= 3) { E.toast((c.r === 'Secret' ? '🤫 ' : '✨ ') + c.r + ' ' + c.n + ' is on the belt!'); E.sound('rare'); } }
    function spawnVip() { const c = rollCreature(true); vipBelt.push({ k: c.k, x: VIP.x0 + 180, y: VIP.y + 20, born: Math.random() * 10 }); }
    for (let i = 0; i < 9; i++) { spawnBelt(); belt[belt.length - 1].x = BELT.x0 + i * 220; }
    // ---------- collisions: base walls + locks ----------
    function baseWalls(b) { const gw = 140, ex = b.x + b.w / 2, eY = b.top ? b.y + b.h : b.y, wY = b.top ? b.y : b.y + b.h; const T = 16; return [[b.x, b.y, T, b.h], [b.x + b.w - T, b.y, T, b.h], [b.x, wY - (b.top ? 0 : T), b.w, T], [b.x, eY - (b.top ? T : 0), b.w / 2 - gw / 2, T], [ex + gw / 2, eY - (b.top ? T : 0), b.w / 2 - gw / 2, T]]; }
    const gateRect = b => { const gw = 140; return [b.x + b.w / 2 - gw / 2, (b.top ? b.y + b.h : b.y) - (b.top ? 16 : 0), gw, 16]; };
    function collide(a) {
      const r = 18;
      for (const b of BASES) {
        const rects = baseWalls(b); if (b.lockT > 0 && b.owner !== a) rects.push(gateRect(b));
        for (const w of rects) { const cx = clamp(a.x, w[0], w[0] + w[2]), cy = clamp(a.y, w[1], w[1] + w[3]), dx = a.x - cx, dy = a.y - cy, d = Math.hypot(dx, dy); if (d < r) { if (d === 0) { a.y += b.top ? r : -r; continue; } a.x = cx + dx / d * r; a.y = cy + dy / d * r; } }
      }
      if (!S.vip && a.me && a.x > VIP.gate - r && a.y > VIP.y - 40 && a.y < VIP.y + VIP.h + 40) a.x = VIP.gate - r;
      if (!a.me && a.x > VIP.gate - r) a.x = VIP.gate - r;
      a.x = clamp(a.x, 20, MW - 20); a.y = clamp(a.y, 20, MH - 20);
    }
    const inBase = (a, b) => a.x > b.x && a.x < b.x + b.w && a.y > b.y && a.y < b.y + b.h;
    // ---------- actions ----------
    function freeSlot(b) { for (let i = 0; i < slotsN(b); i++) if (!b.slots[i]) return i; return -1; }
    function slotsNFor(b) { return b === myBase ? slotsN() : 8; }
    function freeSlotOf(b) { const n = slotsNFor(b); for (let i = 0; i < n; i++) if (!b.slots[i]) return i; return -1; }
    function buy(a, item, list) {
      const c = CBY[item.k], money = a.me ? S.money : a.money; if (money < c.p || a.carry) return false;
      if (freeSlotOf(a.base) < 0) { if (a.me) { E.toast('🏠 Your base is full – upgrade slots or sell a creature'); E.sound('error'); } return false; }
      if (a.me) S.money -= c.p; else a.money -= c.p;
      list.splice(list.indexOf(item), 1); a.carry = { k: item.k, lv: 1, from: null };
      if (a.me) { E.sound('buy'); discover(item.k); fx.text(a.x, a.y - 60, '-$' + fmtBig(c.p), '#fca5a5', 22); } else events.push(a.name + ' bought ' + c.n);
      return true;
    }
    function discover(k) { if (!S.found[k]) { S.found[k] = 1; const c = CBY[k]; E.toast('📖 New discovery: ' + c.n + ' (' + c.r + ')'); if (c.r === 'Secret') E.ach('secret'); } }
    function steal(a, b, i) {
      const m = b.slots[i]; if (!m || a.carry) return false; b.slots[i] = null; a.carry = { k: m.k, lv: m.lv, from: b, slot: i };
      if (a.me) { E.sound('whoosh'); msg = '🦹 You grabbed ' + CBY[m.k].n + '! Run home!'; msgT = 2.5; discover(m.k); }
      if (b === myBase) { alarm = 3; E.sound('error'); E.toast('🚨 ' + a.name + ' is stealing your ' + CBY[m.k].n + '!'); }
      events.push(a.name + ' grabbed ' + CBY[m.k].n + ' from ' + b.owner.name);
      if (!b.owner.me) { b.owner.state = 'chase'; b.owner.target = a; }
      return true;
    }
    function deliver(a) {
      const i = freeSlotOf(a.base); if (i < 0) return; a.base.slots[i] = mkPlaced(a.carry.k, a.carry.lv);
      const stolen = !!a.carry.from; a.carry = null;
      if (a.me) { E.sound(stolen ? 'cheer' : 'score'); fx.burst(slotPos(a.base, i).x, slotPos(a.base, i).y, 30, { col: ['#fde047', '#f472b6', '#fff'], spd: 260, shape: 'star' }); if (stolen) { S.steals++; E.ach('thief'); msg = '💰 Heist complete!'; msgT = 2; } save(); }
    }
    function recover(thief, owner) { // owner tags thief -> creature returns
      const c = thief.carry; if (!c || !c.from) return; const i = freeSlotOf(c.from); if (i >= 0) c.from.slots[i] = mkPlaced(c.k, c.lv); thief.carry = null; thief.stun = 1.4;
      fx.burst(thief.x, thief.y, 20, { col: '#fff', spd: 200 });
      if (thief.me) { E.sound('bad'); E.shake(8); msg = '😵 Caught by ' + owner.name + '!'; msgT = 2; } else if (owner.me) { E.sound('score'); msg = '🛡️ You got it back!'; msgT = 2; }
    }
    function sellSlot(i) { const m = myBase.slots[i]; if (!m) return; const v = Math.floor(CBY[m.k].p * 0.5 * Math.pow(1.4, m.lv - 1)); S.money += v; myBase.slots[i] = null; E.sound('coin'); save(); }
    function upgradeSlot(i) { const m = myBase.slots[i]; if (!m || m.lv >= 5) return; const c = Math.floor(CBY[m.k].p * 0.6 * Math.pow(1.8, m.lv - 1)); if (S.money < c) { E.sound('error'); return; } S.money -= c; m.lv++; E.sound('power'); save(); }
    function lockBase() { if (myBase.lockT > 0 || myBase.lockCD > 0) { E.sound('error'); return; } myBase.lockT = 30 + S.up.lock * 15; myBase.lockCD = myBase.lockT + 25; E.sound('power'); msg = '🔒 Base locked for ' + myBase.lockT + 's'; msgT = 1.8; }
    const UPG = [['slots', '🏠 More Pedestals', '+2 creature slots', l => 500 * Math.pow(4, l), 4], ['income', '💸 Golden Pedestals', '+25% income', l => 300 * Math.pow(3.2, l), 10], ['lock', '🔒 Stronger Lasers', '+15s lock time', l => 400 * Math.pow(3, l), 5], ['speed', '👟 Turbo Sneakers', '+10% walk speed', l => 250 * Math.pow(3, l), 5], ['luck', '🍀 Belt Luck', 'rarer creatures on the belt', l => 1000 * Math.pow(4.5, l), 6]];
    const netWorth = () => S.money + myBase.slots.reduce((s, m) => s + (m ? CBY[m.k].p * Math.pow(1.4, m.lv - 1) : 0), 0);
    const rebirthCost = () => 1e6 * Math.pow(8, S.rebirths);
    function save() { S.mine = myBase.slots.filter(Boolean).map(m => ({ k: m.k, lv: m.lv })); S.last = Date.now(); E.save('save', S); E.submitBest(Math.floor(netWorth())); }
    // ---------- DOM menu buttons ----------
    const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:70vw';
    const mkB = (txt2, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.style.cssText = 'padding:9px 12px;font-size:.88rem;background:rgba(20,10,40,.8);border:1px solid rgba(255,255,255,.25)'; b.textContent = txt2; b.onclick = e => { e.stopPropagation(); Sound.init(); fn(); b.blur(); }; bar.appendChild(b); return b; };
    const lockBtn = mkB('🔒 Lock', lockBase); mkB('🏠 My Base', openBase); mkB('🛒 Upgrades', openShop); mkB('📖 Index', openIndex); mkB('🔁 Rebirth', openRebirth);
    if (E.touch) bar.style.bottom = 'calc(max(12px,env(safe-area-inset-bottom)) + 104px)';
    E.layer.appendChild(bar);
    if (E.touch) E.pads([{ k: 'KeyE', label: '✋<br><small>ACTION</small>', right: 22, bottom: 16, size: 86 }]);
    function card(title, sub, btn, fn, dis) { const d = document.createElement('div'); d.className = 'up'; d.innerHTML = `<h4>${title}</h4><small>${sub}</small>`; if (btn) { const b = document.createElement('button'); b.textContent = btn; b.disabled = !!dis; b.onclick = () => { fn(); }; d.appendChild(b); } return d; }
    function openShop() { const g = document.createElement('div'); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span><span>Income ×${incomeMult().toFixed(2)}</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid'; UPG.forEach(([k, n, d, cost, max]) => { const l = S.up[k], c = cost(l), maxed = l >= max; grid.appendChild(card(`<i>${n.split(' ')[0]}</i>${n.slice(n.indexOf(' ') + 1)} <span class="lv">Lv ${l}/${max}</span>`, d, maxed ? 'MAXED' : '$' + fmtBig(c), () => { if (S.money < c || maxed) return; S.money -= c; S.up[k]++; E.sound('buy'); save(); openShop(); }, maxed || S.money < c)); }); g.appendChild(grid); E.panel.open('🛒 Base Upgrades', g); }
    function openBase() { const g = document.createElement('div'); const inc = myIncome(); g.innerHTML = `<div class="shopres"><span>💵 $${fmtBig(S.money)}</span><span>📈 $${fmtBig(inc)}/s</span><span>🏠 ${myBase.slots.filter(Boolean).length}/${slotsN()} slots</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid';
      myBase.slots.forEach((m, i) => { if (!m) return; const c = CBY[m.k], uc = Math.floor(c.p * 0.6 * Math.pow(1.8, m.lv - 1)), sv = Math.floor(c.p * 0.5 * Math.pow(1.4, m.lv - 1)); const d = card(`<span style="color:${RAR[c.r].c}">${c.n}</span><span class="lv">Lv ${m.lv}</span>`, `${c.r} • $${fmtBig(crIncome(m) * incomeMult())}/s`, m.lv >= 5 ? 'MAX LEVEL' : '⬆ Upgrade $' + fmtBig(uc), () => { upgradeSlot(i); openBase(); }, m.lv >= 5 || S.money < uc); const sb = document.createElement('button'); sb.textContent = 'Sell for $' + fmtBig(sv); sb.style.background = 'linear-gradient(90deg,#b91c1c,#ef4444)'; sb.onclick = () => { sellSlot(i); openBase(); }; d.appendChild(sb); grid.appendChild(d); });
      if (!myBase.slots.some(Boolean)) grid.innerHTML = '<p style="color:#cbd5e1">No creatures yet – buy some from the conveyor belt!</p>'; g.appendChild(grid); E.panel.open('🏠 My Base', g); }
    function openIndex() { const g = document.createElement('div'); const n = Object.keys(S.found).length; g.innerHTML = `<div class="shopres"><span>📖 Discovered ${n}/${CR.length}</span></div>`; const grid = document.createElement('div'); grid.className = 'shopgrid'; CR.forEach(c => { const got = S.found[c.k]; const d = document.createElement('div'); d.className = 'up'; const cv = document.createElement('canvas'); cv.width = cv.height = 120; cv.style.cssText = 'width:60px;height:60px;align-self:center;' + (got ? '' : 'filter:brightness(0) opacity(.4)'); const x = cv.getContext('2d'); if (x) { x.translate(60, 75); drawCreature(x, c.k, 34, 1, true); } d.appendChild(cv); d.insertAdjacentHTML('beforeend', `<h4 style="justify-content:center"><span style="color:${RAR[c.r].c}">${got ? c.n : '???'}</span></h4><small style="text-align:center">${c.r} • $${fmtBig(c.inc)}/s${UNLOCK[c.k] ? '<br>🔓 ' + UNLOCK[c.k] : ''}</small>`); grid.appendChild(d); }); g.appendChild(grid); E.panel.open('📖 Creature Index', g); }
    function openRebirth() { const g = document.createElement('div'), cost = rebirthCost(), nw = netWorth(); g.innerHTML = `<p style="line-height:1.5;color:#e2e8f0">Rebirth resets your money, creatures and upgrades – but gives you a <b>permanent income multiplier</b> (now ×${rebirthMult().toFixed(2)} → ×${(rebirthMult() + 0.75).toFixed(2)}), better belt luck, unlocks <b>Mythic</b> creatures on the belt and opens the <b>VIP Belt</b> where Secret creatures appear.</p><div class="shopres" style="margin-top:10px"><span>Net worth $${fmtBig(nw)}</span><span>Needed $${fmtBig(cost)}</span><span>Rebirths: ${S.rebirths}</span></div>`; const b = document.createElement('button'); b.className = 'btn primary'; b.style.width = '100%'; b.textContent = nw >= cost ? '🔁 REBIRTH NOW' : '🔒 Need $' + fmtBig(cost - nw) + ' more'; b.disabled = nw < cost; b.onclick = () => { if (netWorth() < rebirthCost()) return; S.rebirths++; S.money = 100 * (1 + S.rebirths); S.up = { slots: 0, lock: 0, speed: 0, income: 0, luck: 0 }; myBase.slots = []; S.vip = true; E.ach('rebirth'); E.sound('rare'); save(); E.panel.close(); msg = '🔁 REBORN! Income ×' + rebirthMult().toFixed(2) + ' – VIP Belt unlocked!'; msgT = 3; fx.burst(player.x, player.y, 80, { col: ['#f472b6', '#fde047', '#22d3ee'], spd: 400, shape: 'star' }); }; g.appendChild(b); E.panel.open('🔁 Rebirth', g); }
    const myIncome = () => myBase.slots.reduce((s, m) => s + (m ? crIncome(m) : 0), 0) * incomeMult();
    // ---------- AI ----------
    function botThink(b, dt) {
      if (b.stun > 0) return { x: 0, y: 0 };
      b.t -= dt; const base = b.base;
      if (b.carry) { // go home
        const e = entrance(base); const inside = inBase(b, base); if (inside) { deliver(b); b.state = 'think'; b.t = rand(1, 3); return { x: 0, y: 0 }; }
        return seek(b, inBase(b, base) ? base.x + BW / 2 : e.x, inBase(b, base) ? base.y + BH / 2 : e.y + (base.top ? 60 : -60), true);
      }
      if (b.state === 'chase') { const th = b.target; if (!th || !th.carry || th.carry.from !== base) { b.state = 'think'; b.t = 0.5; } else { if (dist(th.x, th.y, b.x, b.y) < 40) { recover(th, b); b.state = 'think'; b.t = 1; } return seek(b, th.x, th.y); } }
      if (b.state === 'think' && b.t <= 0) {
        b.t = rand(1.5, 4);
        if ((b.strat === 'defender' || Math.random() < 0.15) && base.lockT <= 0 && base.lockCD <= 0 && Math.random() < 0.6) { base.lockT = 45; base.lockCD = 75; }
        const full = freeSlotOf(base) < 0;
        const stealP = { thief: 0.6, speedy: 0.35, gambler: 0.2, collector: 0.15, defender: 0.08 }[b.strat];
        if (Math.random() < stealP) { const targets = BASES.filter(x => x !== base && x.lockT <= 0 && x.slots.some(Boolean)); if (targets.length && !full) { const tb = targets.sort((a, c) => (a === myBase ? -0.5 : 0) - (c === myBase ? -0.5 : 0) + Math.random() - 0.5)[0]; b.state = 'steal'; b.target = tb; return { x: 0, y: 0 }; } }
        if (!full) { const opts = belt.filter(c => CBY[c.k].p <= b.money && (b.strat !== 'gambler' || ORDER.indexOf(CBY[c.k].r) >= 1)); if (opts.length) { opts.sort((a, c) => CBY[c.k].p - CBY[a.k].p); b.state = 'buy'; b.target = opts[0]; return { x: 0, y: 0 }; } }
        b.state = 'wander'; b.wx = rand(300, 2100); b.wy = BELT.y + rand(-200, 200);
      }
      if (b.state === 'buy') { const it = b.target; if (belt.indexOf(it) < 0 || CBY[it.k].p > b.money) { b.state = 'think'; return { x: 0, y: 0 }; } if (dist(it.x, it.y, b.x, b.y) < 60) { buy(b, it, belt); b.state = 'home'; return { x: 0, y: 0 }; } return seek(b, it.x + 40, it.y); }
      if (b.state === 'steal') { const tb = b.target; if (tb.lockT > 0 || !tb.slots.some(Boolean)) { b.state = 'think'; return { x: 0, y: 0 }; } if (!inBase(b, tb)) { const e = entrance(tb); return seek(b, e.x, e.y + (tb.top ? -60 : 60)); } let bi = -1, bv = -1; tb.slots.forEach((m, i) => { if (m && CBY[m.k].p > bv) { bv = CBY[m.k].p; bi = i; } }); if (bi < 0) { b.state = 'think'; return { x: 0, y: 0 }; } const p = slotPos(tb, bi); if (dist(p.x, p.y, b.x, b.y) < 50) { steal(b, tb, bi); return { x: 0, y: 0 }; } return seek(b, p.x, p.y); }
      if (b.state === 'wander') { if (dist(b.wx, b.wy, b.x, b.y) < 40) { b.state = 'think'; b.t = rand(0.5, 2); } return seek(b, b.wx, b.wy); }
      if (b.state === 'home') { b.state = 'think'; }
      return { x: 0, y: 0 };
    }
    function seek(b, tx, ty, homeBound) {
      // simple steering with base-entrance routing
      let gx = tx, gy = ty; const inside = BASES.find(x => inBase(b, x)), targetInside = BASES.find(x => tx > x.x && tx < x.x + x.w && ty > x.y && ty < x.y + x.h);
      if (inside && inside !== targetInside) { const e = entrance(inside); gx = e.x; gy = e.y + (inside.top ? 50 : -50); if (Math.abs(b.x - e.x) > 40) gy = inside.top ? inside.y + inside.h - 60 : inside.y + 60; }
      else if (targetInside && !inside) { const e = entrance(targetInside); if (Math.abs(b.x - e.x) > 50 || (targetInside.top ? b.y < e.y : b.y > e.y)) { gx = e.x; gy = e.y + (targetInside.top ? 60 : -60); } }
      const dx = gx - b.x, dy = gy - b.y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d };
    }
    // ---------- creature drawing (each creature unique) ----------
    function drawCreature(c, k, s, t2, still) {
      const cr = CBY[k], R = RAR[cr.r], bob = still ? 0 : Math.sin(t2 * 3) * s * 0.06; c.save(); c.translate(0, bob);
      const O = '#1f1d2b'; c.lineWidth = Math.max(1.5, s * 0.06); c.strokeStyle = O; c.lineJoin = 'round';
      const F = (col) => { c.fillStyle = col; c.fill(); c.stroke(); };
      const eyes = (x, y, r, gap, look) => { for (const sd of [-1, 1]) { c.beginPath(); c.arc(x + sd * gap, y, r, 0, TAU); F('#fff'); circle(c, x + sd * gap + (look || 0) * r * 0.3, y + r * 0.1, r * 0.5, '#111'); } };
      const mouth = (x, y, w, open) => { c.beginPath(); if (open) { c.ellipse(x, y, w, w * 0.6, 0, 0, Math.PI); F('#7f1d1d'); } else { c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 0.8, x + w, y); c.stroke(); } };
      const legs = (y, sp, col) => { const wob = still ? 0 : Math.sin(t2 * 8) * s * 0.08; c.strokeStyle = col || O; c.lineWidth = s * 0.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(-sp, y); c.lineTo(-sp - wob, y + s * 0.35); c.moveTo(sp, y); c.lineTo(sp + wob, y + s * 0.35); c.stroke(); c.lineWidth = Math.max(1.5, s * 0.06); c.strokeStyle = O; };
      switch (k) {
        case 'bread': legs(0, s * 0.3); c.beginPath(); c.moveTo(-s * 0.6, 0); c.lineTo(-s * 0.6, -s * 0.8); c.arc(-s * 0.3, -s * 0.85, s * 0.32, Math.PI, 0); c.arc(s * 0.3, -s * 0.85, s * 0.32, Math.PI, 0); c.lineTo(s * 0.6, 0); c.closePath(); F('#d97706'); c.beginPath(); c.rect(-s * 0.48, -s * 0.85, s * 0.96, s * 0.75); c.fillStyle = '#fde68a'; c.fill(); eyes(-0.05 * s, -s * 0.55, s * 0.13, s * 0.2, Math.sin(t2 * 5)); mouth(0, -s * 0.28, s * 0.12); break;
        case 'wobble': { const w = 1 + (still ? 0 : Math.sin(t2 * 6) * 0.06); c.beginPath(); c.ellipse(0, -s * 0.45, s * 0.62 * w, s * 0.5 / w, 0, 0, TAU); F('rgba(74,222,128,.85)'); ellipse(c, -s * 0.2, -s * 0.65, s * 0.12, s * 0.08, 'rgba(255,255,255,.6)'); eyes(0, -s * 0.5, s * 0.11, s * 0.2); c.beginPath(); c.arc(s * 0.2, -s * 0.5, s * 0.17, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(s * 0.37, -s * 0.5); c.lineTo(s * 0.45, -s * 0.2); c.stroke(); mouth(0, -s * 0.3, s * 0.1); break; }
        case 'pebble': c.beginPath(); c.moveTo(-s * 0.6, 0); c.quadraticCurveTo(-s * 0.7, -s * 0.7, -s * 0.1, -s * 0.8); c.quadraticCurveTo(s * 0.6, -s * 0.85, s * 0.62, -s * 0.2); c.quadraticCurveTo(s * 0.6, 0, -s * 0.6, 0); F('#9ca3af'); eyes(0, -s * 0.5, s * 0.1, s * 0.18); c.beginPath(); c.moveTo(-s * 0.3, -s * 0.3); c.quadraticCurveTo(-s * 0.15, -s * 0.4, 0, -s * 0.3); c.quadraticCurveTo(s * 0.15, -s * 0.4, s * 0.3, -s * 0.3); c.lineWidth = s * 0.08; c.stroke(); break;
        case 'noodle': c.beginPath(); c.moveTo(-s * 0.6, -s * 0.4); c.quadraticCurveTo(0, s * 0.3, s * 0.6, -s * 0.4); c.closePath(); F('#ef4444'); c.strokeStyle = '#fde68a'; c.lineWidth = s * 0.08; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * s * 0.12, -s * 0.4); c.quadraticCurveTo(i * s * 0.12 + s * 0.15, -s * 0.8, i * s * 0.1, -s * 1.0 - (still ? 0 : Math.sin(t2 * 4 + i) * s * 0.05)); c.stroke(); } c.strokeStyle = O; c.lineWidth = s * 0.06; eyes(0, -s * 0.15, s * 0.09, s * 0.22); break;
        case 'sock': for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-s * 0.4 + i * s * 0.2, -s * 0.15); c.quadraticCurveTo(-s * 0.4 + i * s * 0.2 + (still ? 0 : Math.sin(t2 * 6 + i) * s * 0.12), s * 0.15, -s * 0.45 + i * s * 0.22, s * 0.32); c.lineWidth = s * 0.1; c.strokeStyle = '#f472b6'; c.stroke(); } c.lineWidth = s * 0.06; c.strokeStyle = O; c.beginPath(); rr(c, -s * 0.42, -s * 1.0, s * 0.84, s * 0.95, s * 0.3); F('#f9a8d4'); c.fillStyle = '#ec4899'; for (let i = 0; i < 3; i++) c.fillRect(-s * 0.42, -s * 0.9 + i * s * 0.2, s * 0.84, s * 0.07); eyes(0, -s * 0.5, s * 0.11, s * 0.17); break;
        case 'spud': legs(-s * 0.1, s * 0.2); c.beginPath(); c.ellipse(0, -s * 0.5, s * 0.45, s * 0.55, 0.2, 0, TAU); F('#b45309'); for (const [x, y] of [[-0.2, -0.75], [0.2, -0.3], [-0.1, -0.2]]) circle(c, x * s, y * s, s * 0.04, '#78350f'); c.beginPath(); c.moveTo(0, -s * 1.05); c.lineTo(0, -s * 1.35); c.stroke(); circle(c, 0, -s * 1.38, s * 0.08, '#ef4444'); eyes(0, -s * 0.6, s * 0.1, s * 0.15); mouth(0, -s * 0.35, s * 0.1, true); break;
        case 'meow': c.beginPath(); rr(c, -s * 0.45, -s * 0.6, s * 0.9, s * 0.62, s * 0.12); F('#1e293b'); c.beginPath(); c.moveTo(0, -s * 0.6); c.lineTo(-s * 0.1, -s * 0.35); c.lineTo(0, -s * 0.1); c.lineTo(s * 0.1, -s * 0.35); c.closePath(); F('#dc2626'); c.beginPath(); c.arc(0, -s * 0.9, s * 0.38, 0, TAU); F('#fb923c'); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * 0.12, -s * 1.2); c.lineTo(sd * s * 0.34, -s * 1.38); c.lineTo(sd * s * 0.34, -s * 1.05); c.closePath(); F('#fb923c'); } eyes(0, -s * 0.95, s * 0.09, s * 0.15); c.beginPath(); c.moveTo(-s * 0.25, -s * 0.78); c.lineTo(-s * 0.5, -s * 0.82); c.moveTo(s * 0.25, -s * 0.78); c.lineTo(s * 0.5, -s * 0.82); c.stroke(); break;
        case 'banana': c.beginPath(); c.moveTo(-s * 0.15, 0); c.quadraticCurveTo(-s * 0.55, -s * 0.6, -s * 0.1, -s * 1.1); c.quadraticCurveTo(s * 0.1, -s * 0.6, s * 0.2, 0); c.closePath(); F('#facc15'); c.fillStyle = '#111'; c.fillRect(-s * 0.35, -s * 0.72, s * 0.5, s * 0.12); circle(c, -s * 0.22, -s * 0.66, s * 0.05, '#fff'); circle(c, 0, -s * 0.66, s * 0.05, '#fff'); c.beginPath(); c.ellipse(-s * 0.1, -s * 1.05, s * 0.55, s * 0.12, -0.2, 0, TAU); F('#16a34a'); c.beginPath(); c.ellipse(-s * 0.1, -s * 1.15, s * 0.22, s * 0.18, -0.2, Math.PI, 0); F('#16a34a'); break;
        case 'toaster': c.beginPath(); rr(c, -s * 0.5, -s * 0.8, s, s * 0.8, s * 0.18); F('#cbd5e1'); c.fillStyle = '#475569'; c.fillRect(-s * 0.35, -s * 0.8, s * 0.22, s * 0.08); c.fillRect(s * 0.1, -s * 0.8, s * 0.22, s * 0.08); c.beginPath(); c.arc(0, -s * 0.55, s * 0.62, 0, TAU); c.fillStyle = 'rgba(186,230,253,.35)'; c.fill(); c.stroke(); eyes(0, -s * 0.45, s * 0.1, s * 0.2); mouth(0, -s * 0.22, s * 0.12); c.beginPath(); c.moveTo(s * 0.5, -s * 0.4); c.lineTo(s * 0.68, -s * 0.4); c.stroke(); break;
        case 'duck': c.beginPath(); c.moveTo(-s * 0.45, -s * 0.5); c.lineTo(-s * 0.35, 0); c.lineTo(s * 0.35, 0); c.lineTo(s * 0.45, -s * 0.5); c.closePath(); F('#f8fafc'); c.fillStyle = '#7c2d12'; c.fillRect(-s * 0.42, -s * 0.5, s * 0.84, s * 0.08); c.beginPath(); c.arc(s * 0.55, -s * 0.28, s * 0.13, -1.2, 1.2); c.stroke(); c.beginPath(); c.arc(0, -s * 0.72, s * 0.3, 0, TAU); F('#fde047'); c.beginPath(); c.ellipse(s * 0.32, -s * 0.68, s * 0.16, s * 0.07, 0, 0, TAU); F('#f97316'); circle(c, s * 0.08, -s * 0.8, s * 0.05, '#111'); c.strokeStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-s * 0.2 + i * 0.2 * s, -s * 1.1); c.quadraticCurveTo(-s * 0.1 + i * 0.2 * s, -s * 1.25, -s * 0.2 + i * 0.2 * s, -s * 1.4); c.stroke(); } c.strokeStyle = O; break;
        case 'cactus': c.beginPath(); rr(c, -s * 0.38, -s * 0.25, s * 0.76, s * 0.25, s * 0.05); F('#c2410c'); c.beginPath(); rr(c, -s * 0.22, -s * 1.1, s * 0.44, s * 0.9, s * 0.22); F('#22c55e'); for (const sd of [-1, 1]) { const wv = still ? 0 : Math.sin(t2 * 4) * 0.3; c.save(); c.translate(sd * s * 0.22, -s * 0.65); c.rotate(sd * (0.4 + wv)); c.beginPath(); rr(c, 0, -s * 0.08, sd * s * 0.35, s * 0.16, s * 0.08); F('#16a34a'); c.restore(); } eyes(0, -s * 0.8, s * 0.07, s * 0.1); c.beginPath(); c.arc(0, -s * 0.62, s * 0.08, 0, Math.PI); c.stroke(); circle(c, s * 0.15, -s * 1.1, s * 0.1, '#f472b6'); break;
        case 'pizza': legs(-s * 0.05, s * 0.25, '#166534'); c.beginPath(); c.moveTo(-s * 0.55, -s * 0.3); c.lineTo(s * 0.55, -s * 0.3); c.lineTo(0, s * 0.05); c.closePath(); F('#fbbf24'); for (const [x, y] of [[-0.2, -0.22], [0.15, -0.2], [0, -0.08]]) circle(c, x * s, y * s, s * 0.06, '#dc2626'); c.beginPath(); c.ellipse(0, -s * 0.62, s * 0.4, s * 0.32, 0, 0, TAU); F('#22c55e'); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-s * 0.3 + i * s * 0.18, -s * 0.9); c.lineTo(-s * 0.22 + i * s * 0.18, -s * 1.05); c.lineTo(-s * 0.14 + i * s * 0.18, -s * 0.9); F('#15803d'); } eyes(s * 0.05, -s * 0.68, s * 0.08, s * 0.14); c.beginPath(); c.moveTo(-s * 0.2, -s * 0.48); for (let i = 0; i < 5; i++) c.lineTo(-s * 0.2 + i * s * 0.1, -s * 0.48 + (i % 2) * s * 0.06); c.stroke(); break;
        case 'brocco': c.beginPath(); rr(c, -s * 0.18, -s * 0.55, s * 0.36, s * 0.55, s * 0.08); F('#86efac'); for (const [x, y, r] of [[-0.3, -0.75, 0.25], [0.3, -0.75, 0.25], [0, -0.95, 0.3], [-0.15, -0.6, 0.2], [0.15, -0.6, 0.2]]) { c.beginPath(); c.arc(x * s, y * s, r * s, 0, TAU); F('#16a34a'); } c.fillStyle = '#111'; c.fillRect(-s * 0.3, -s * 0.8, s * 0.6, s * 0.12); c.beginPath(); c.arc(0, -s * 0.2, s * 0.22, 0.2, Math.PI - 0.2); c.strokeStyle = '#fbbf24'; c.lineWidth = s * 0.06; c.stroke(); c.strokeStyle = O; circle(c, 0, -s * 0.05, s * 0.07, '#fbbf24'); break;
        case 'fridge': c.beginPath(); rr(c, -s * 0.45, -s * 1.2, s * 0.9, s * 1.2, s * 0.12); F('#e2e8f0'); c.beginPath(); c.moveTo(-s * 0.45, -s * 0.7); c.lineTo(s * 0.45, -s * 0.7); c.stroke(); c.fillStyle = '#94a3b8'; c.fillRect(s * 0.3, -s * 1.05, s * 0.06, s * 0.25); c.fillRect(s * 0.3, -s * 0.6, s * 0.06, s * 0.3); eyes(-s * 0.05, -s * 0.95, s * 0.1, s * 0.16); c.beginPath(); c.rect(-s * 0.32, -s * 0.5, s * 0.5, s * 0.25); F('#7f1d1d'); c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-s * 0.32 + i * s * 0.125, -s * 0.5); c.lineTo(-s * 0.26 + i * s * 0.125, -s * 0.4); c.lineTo(-s * 0.2 + i * s * 0.125, -s * 0.5); c.fill(); } break;
        case 'gummy': c.beginPath(); c.ellipse(0, -s * 0.35, s * 0.38, s * 0.38, 0, 0, TAU); F('rgba(248,113,113,.9)'); c.beginPath(); c.arc(0, -s * 0.85, s * 0.28, 0, TAU); F('rgba(248,113,113,.9)'); for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * s * 0.22, -s * 1.08, s * 0.1, 0, TAU); F('rgba(248,113,113,.9)'); } c.beginPath(); c.arc(0, -s * 0.9, s * 0.3, Math.PI, 0); F('#94a3b8'); c.fillStyle = '#dc2626'; c.fillRect(-s * 0.04, -s * 1.3, s * 0.08, s * 0.12); eyes(0, -s * 0.82, s * 0.06, s * 0.1); c.save(); c.translate(s * 0.4, -s * 0.4); c.rotate(-0.6); c.fillStyle = '#e5e7eb'; c.fillRect(-s * 0.03, -s * 0.5, s * 0.06, s * 0.5); c.fillStyle = '#a16207'; c.fillRect(-s * 0.1, 0, s * 0.2, s * 0.05); c.restore(); break;
        case 'waffle': c.beginPath(); rr(c, -s * 0.45, -s * 0.85, s * 0.9, s * 0.85, s * 0.1); F('#f59e0b'); c.strokeStyle = 'rgba(120,53,15,.6)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-s * 0.45 + i * s * 0.225, -s * 0.85); c.lineTo(-s * 0.45 + i * s * 0.225, 0); c.moveTo(-s * 0.45, -s * 0.85 + i * s * 0.21); c.lineTo(s * 0.45, -s * 0.85 + i * s * 0.21); c.stroke(); } c.strokeStyle = O; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.85); c.lineTo(0, -s * 1.55); c.lineTo(s * 0.4, -s * 0.85); c.closePath(); F('#4c1d95'); star(c, 0, -s * 1.15, s * 0.1, s * 0.04, 5); c.fillStyle = '#fde047'; c.fill(); eyes(0, -s * 0.55, s * 0.09, s * 0.17); c.beginPath(); c.moveTo(-s * 0.15, -s * 0.3); c.lineTo(0, -s * 0.05); c.lineTo(s * 0.15, -s * 0.3); F('#f8fafc'); break;
        case 'pickle': c.beginPath(); c.moveTo(-s * 0.15, -s * 0.7); c.lineTo(-s * 0.55, -s * 0.05); c.lineTo(s * 0.55, -s * 0.05); c.lineTo(s * 0.15, -s * 0.7); c.closePath(); F('#dc2626'); c.beginPath(); c.ellipse(0, -s * 0.6, s * 0.25, s * 0.6, 0, 0, TAU); F('#65a30d'); for (const [x, y] of [[-0.1, -0.9], [0.12, -0.5], [-0.08, -0.3]]) circle(c, x * s, y * s, s * 0.04, '#365314'); c.fillStyle = '#1e3a8a'; c.fillRect(-s * 0.28, -s * 0.88, s * 0.56, s * 0.12); circle(c, -s * 0.1, -s * 0.82, s * 0.04, '#fff'); circle(c, s * 0.1, -s * 0.82, s * 0.04, '#fff'); mouth(0, -s * 0.62, s * 0.1); star(c, 0, -s * 0.35, s * 0.1, s * 0.045, 5); c.fillStyle = '#fde047'; c.fill(); break;
        case 'donut': for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * 0.3, -s * 0.6); c.quadraticCurveTo(sd * s * 1.0, -s * 1.1 - (still ? 0 : Math.sin(t2 * 5) * s * 0.15), sd * s * 0.9, -s * 0.4); c.closePath(); F('#a855f7'); } c.beginPath(); c.arc(0, -s * 0.5, s * 0.48, 0, TAU); c.arc(0, -s * 0.5, s * 0.16, 0, TAU, true); c.fillStyle = '#f9a8d4'; c.fill('evenodd'); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.8; c.fillStyle = ['#22d3ee', '#fde047', '#fff', '#22c55e'][i % 4]; c.fillRect(Math.cos(a) * s * 0.32 - 2, -s * 0.5 + Math.sin(a) * s * 0.32 - 1, 5, 2.5); } eyes(0, -s * 0.85, s * 0.08, s * 0.14); c.beginPath(); c.moveTo(-s * 0.1, -s * 1.05); c.lineTo(-s * 0.2, -s * 1.25); c.moveTo(s * 0.1, -s * 1.05); c.lineTo(s * 0.2, -s * 1.25); c.stroke(); break;
        case 'burger': legs(-s * 0.05, s * 0.25, '#64748b'); c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.55, s * 0.13, 0, 0, TAU); F('#d97706'); c.fillStyle = '#7c2d12'; c.fillRect(-s * 0.55, -s * 0.36, s * 1.1, s * 0.18); c.fillStyle = '#22c55e'; c.fillRect(-s * 0.6, -s * 0.42, s * 1.2, s * 0.07); c.fillStyle = '#fde047'; c.fillRect(-s * 0.5, -s * 0.47, s * 1.0, s * 0.06); c.beginPath(); c.ellipse(0, -s * 0.5, s * 0.55, s * 0.4, 0, Math.PI, 0); F('#f59e0b'); c.fillStyle = '#0f172a'; c.fillRect(-s * 0.35, -s * 0.72, s * 0.7, s * 0.14); c.fillStyle = '#ef4444'; c.fillRect(-s * 0.28, -s * 0.68, s * 0.14, s * 0.06); c.fillRect(s * 0.14, -s * 0.68, s * 0.14, s * 0.06); c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, -s * 1.15); c.stroke(); circle(c, 0, -s * 1.18, s * 0.06, Math.sin(t2 * 8) > 0 ? '#22d3ee' : '#f472b6'); break;
        case 'llama': legs(-s * 0.15, s * 0.25, '#f5f5f4'); c.beginPath(); c.ellipse(0, -s * 0.35, s * 0.4, s * 0.25, 0, 0, TAU); F('#f5f5f4'); c.beginPath(); rr(c, s * 0.1, -s * 1.05, s * 0.22, s * 0.7, s * 0.1); F('#f5f5f4'); c.beginPath(); c.ellipse(s * 0.25, -s * 1.05, s * 0.2, s * 0.14, 0, 0, TAU); F('#f5f5f4'); circle(c, s * 0.3, -s * 1.08, s * 0.035, '#111'); c.beginPath(); c.moveTo(s * 0.15, -s * 1.15); c.lineTo(s * 0.12, -s * 1.3); c.stroke(); c.beginPath(); c.arc(-s * 0.2, -s * 1.15, s * 0.2, 0, TAU); c.fillStyle = '#cbd5e1'; c.fill(); c.stroke(); for (let i = 0; i < 6; i++) { c.fillStyle = hsl((t2 * 200 + i * 60) % 360, 90, 65); c.fillRect(-s * 0.32 + (i % 3) * s * 0.08, -s * 1.25 + Math.floor(i / 3) * s * 0.12, s * 0.06, s * 0.06); } c.beginPath(); c.moveTo(-s * 0.2, -s * 1.35); c.lineTo(-s * 0.2, -s * 1.5); c.stroke(); break;
        case 'kraken': for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-s * 0.35 + i * s * 0.14, -s * 0.3); c.quadraticCurveTo(-s * 0.5 + i * s * 0.2 + (still ? 0 : Math.sin(t2 * 4 + i) * s * 0.15), s * 0.05, -s * 0.55 + i * s * 0.22, s * 0.25); c.lineWidth = s * 0.1; c.strokeStyle = '#a855f7'; c.stroke(); } c.lineWidth = s * 0.06; c.strokeStyle = O; c.beginPath(); c.moveTo(-s * 0.65, -s * 0.35); c.quadraticCurveTo(-s * 0.3, -s * 1.05, 0, -s * 1.0); c.quadraticCurveTo(s * 0.3, -s * 1.05, s * 0.65, -s * 0.35); c.quadraticCurveTo(0, -s * 0.1, -s * 0.65, -s * 0.35); F('#f59e0b'); c.strokeStyle = 'rgba(120,53,15,.6)'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.22, -s * 0.95); c.lineTo(i * s * 0.3, -s * 0.3); c.stroke(); } c.strokeStyle = O; eyes(0, -s * 0.6, s * 0.1, s * 0.2); break;
        case 'gnome': c.beginPath(); c.moveTo(-s * 0.4, 0); c.quadraticCurveTo(-s * 0.4, -s * 0.6, 0, -s * 0.6); c.quadraticCurveTo(s * 0.4, -s * 0.6, s * 0.4, 0); c.closePath(); F('#1e3a8a'); c.beginPath(); c.moveTo(-s * 0.35, -s * 0.5); c.quadraticCurveTo(0, -s * 0.05, s * 0.35, -s * 0.5); c.quadraticCurveTo(0, -s * 0.75, -s * 0.35, -s * 0.5); c.fillStyle = lgrad(c, 0, -s * 0.7, 0, -s * 0.1, ['#c084fc', '#22d3ee', '#1e1b4b']); c.fill(); for (let i = 0; i < 5; i++) circle(c, -s * 0.2 + i * s * 0.1, -s * 0.35 + (i % 2) * s * 0.08, s * 0.025, '#fff'); circle(c, 0, -s * 0.62, s * 0.08, '#fca5a5'); c.beginPath(); c.moveTo(-s * 0.32, -s * 0.66); c.lineTo(0, -s * 1.5); c.lineTo(s * 0.32, -s * 0.66); c.closePath(); F('#4c1d95'); star(c, 0, -s * 1.1, s * 0.08, s * 0.035, 5); c.fillStyle = '#fde047'; c.fill(); break;
        case 'teapot': c.beginPath(); c.moveTo(s * 0.4, -s * 0.5); c.quadraticCurveTo(s * 0.75, -s * 0.6, s * 0.8, -s * 0.85); c.lineWidth = s * 0.12; c.strokeStyle = '#e5e7eb'; c.stroke(); c.lineWidth = s * 0.06; c.strokeStyle = O; c.beginPath(); c.arc(-s * 0.48, -s * 0.45, s * 0.18, 1.6, 4.7); c.stroke(); c.beginPath(); c.ellipse(0, -s * 0.42, s * 0.45, s * 0.4, 0, 0, TAU); F('#e0f2fe'); c.beginPath(); c.ellipse(0, -s * 0.82, s * 0.25, s * 0.08, 0, 0, TAU); F('#bae6fd'); circle(c, 0, -s * 0.92, s * 0.06, '#38bdf8'); eyes(0, -s * 0.45, s * 0.09, s * 0.17); if (!still && Math.sin(t2 * 6) > 0.3) { c.strokeStyle = '#fde047'; c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(s * 0.8, -s * 0.9); c.lineTo(s * 0.95, -s * 1.1); c.lineTo(s * 0.85, -s * 1.1); c.lineTo(s * 1.0, -s * 1.35); c.stroke(); } break;
        case 'grand': { const w = 1 + (still ? 0 : Math.sin(t2 * 4) * 0.08); c.beginPath(); c.ellipse(0, -s * 0.55, s * 0.7 * w, s * 0.6 / w, 0, 0, TAU); c.fillStyle = lgrad(c, 0, -s * 1.1, 0, 0, ['#1e1b4b', '#7c3aed', '#ec4899']); c.fill(); c.stroke(); for (let i = 0; i < 9; i++) circle(c, Math.cos(i * 1.7) * s * 0.4, -s * 0.55 + Math.sin(i * 2.3) * s * 0.35, s * 0.025, '#fff'); c.beginPath(); c.moveTo(-s * 0.35, -s * 1.05); c.lineTo(-s * 0.35, -s * 1.35); c.lineTo(-s * 0.17, -s * 1.2); c.lineTo(0, -s * 1.42); c.lineTo(s * 0.17, -s * 1.2); c.lineTo(s * 0.35, -s * 1.35); c.lineTo(s * 0.35, -s * 1.05); c.closePath(); F('#fde047'); eyes(0, -s * 0.6, s * 0.13, s * 0.25); mouth(0, -s * 0.3, s * 0.15, true); break; }
        case 'sneaker': c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(-s * 0.7, -s * 0.45); c.quadraticCurveTo(-s * 0.4, -s * 0.8, -s * 0.05, -s * 0.6); c.lineTo(s * 0.3, -s * 0.35); c.quadraticCurveTo(s * 0.75, -s * 0.3, s * 0.75, 0); c.closePath(); c.fillStyle = lgrad(c, -s, -s, s, 0, ['#fde047', '#f59e0b', '#fde047']); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-s * 0.7, -s * 0.1, s * 1.45, s * 0.1); c.strokeStyle = '#fff'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-s * 0.3 + i * s * 0.12, -s * 0.62 + i * s * 0.06); c.lineTo(-s * 0.1 + i * s * 0.12, -s * 0.5 + i * s * 0.06); c.stroke(); } c.strokeStyle = O; eyes(-s * 0.4, -s * 0.4, s * 0.1, s * 0.15); c.beginPath(); c.moveTo(-s * 0.6, -s * 0.72); c.lineTo(-s * 0.6, -s * 0.95); c.lineTo(-s * 0.48, -s * 0.85); c.lineTo(-s * 0.38, -s * 1.0); c.lineTo(-s * 0.28, -s * 0.85); c.lineTo(-s * 0.16, -s * 0.95); c.lineTo(-s * 0.16, -s * 0.72); c.closePath(); F('#fde047'); break;
        case 'glitch': { const g = still ? 0 : (Math.random() < 0.15 ? rand(-s * 0.15, s * 0.15) : 0); for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { if ((i * 7 + j * 3) % 5 === 0) continue; c.fillStyle = (i + j) % 3 ? '#22d3ee' : '#f472b6'; c.fillRect(-s * 0.48 + i * s * 0.16 + (j === 2 ? g : 0), -s * 1.0 + j * s * 0.16, s * 0.15, s * 0.15); } c.fillStyle = '#111'; c.fillRect(-s * 0.25, -s * 0.72, s * 0.12, s * 0.12); c.fillRect(s * 0.12, -s * 0.72, s * 0.12, s * 0.12); c.fillRect(-s * 0.2, -s * 0.42, s * 0.4, s * 0.06); txt(c, 'ERR', 0, -s * 1.15, s * 0.22, '#f472b6', 'center', 900); break; }
      }
      c.restore();
    }
    function rarityFx(c, r, x, y, s, t2) {
      if (r === 'Common') return;
      if (r === 'Rare') { c.strokeStyle = 'rgba(96,165,250,.6)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, s * 0.9, s * 0.3, 0, 0, TAU); c.stroke(); return; }
      if (r === 'Secret') { c.save(); c.translate(x, y - s * 0.5); for (let i = 0; i < 5; i++) { const a = t2 * 2 + i * TAU / 5; star(c, Math.cos(a) * s * 1.1, Math.sin(a) * s * 0.5, s * 0.12, s * 0.05, 4); c.fillStyle = '#fff'; c.fill(); } c.restore(); c.globalAlpha = 0.6; c.drawImage(E.glow((t2 * 80) % 360), x - s * 1.6, y - s * 2, s * 3.2, s * 3.2); c.globalAlpha = 1; return; }
      const hue = r === 'Mythic' ? (t2 * 120) % 360 : RAR[r].hue; c.globalAlpha = r === 'Epic' ? 0.4 : 0.6; c.drawImage(E.glow(hue), x - s * 1.4, y - s * 1.8, s * 2.8, s * 2.8); c.globalAlpha = 1;
      if (r === 'Legendary' || r === 'Mythic') for (let i = 0; i < 3; i++) { const a = t2 * 3 + i * 2.1; star(c, x + Math.cos(a) * s * 0.8, y - s * 0.6 + Math.sin(a) * s * 0.6, s * 0.08, s * 0.035, 4); c.fillStyle = '#fff'; c.fill(); }
    }
    function drawActor(a) {
      const x = a.x, y = a.y, s = 1; ctx.save(); ctx.translate(x, y);
      ellipse(ctx, 0, 4, 20, 8, 'rgba(0,0,0,.3)');
      const st = Math.sin(a.step) * 5; ctx.fillStyle = '#1f2937'; ctx.fillRect(-9, -14 + (st > 0 ? -2 : 0), 7, 16); ctx.fillRect(2, -14 + (st < 0 ? -2 : 0), 7, 16);
      ctx.fillStyle = a.col; rr(ctx, -14, -40, 28, 30, 9); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke();
      circle(ctx, 0, -52, 14, '#f1c27d'); ctx.fillStyle = a.col; ctx.beginPath(); ctx.arc(0, -55, 14.5, Math.PI, 0); ctx.fill(); ctx.fillRect(a.face > 0 ? 0 : -20, -57, 20, 5);
      circle(ctx, a.face * 5 - 4, -50, 2, '#111'); circle(ctx, a.face * 5 + 4, -50, 2, '#111');
      if (a.stun > 0) for (let i = 0; i < 3; i++) { const an = t * 5 + i * 2.1; star(ctx, Math.cos(an) * 16, -72 + Math.sin(an) * 5, 5, 2, 5); ctx.fillStyle = '#fde047'; ctx.fill(); }
      ctx.restore();
      if (a.carry) { ctx.save(); ctx.translate(x, y - 74); const cr = CBY[a.carry.k]; rarityFx(ctx, cr.r, 0, 0, 22, t); drawCreature(ctx, a.carry.k, 26, t); ctx.restore(); }
      label(ctx, a.name, x, y - (a.carry ? 120 : 80), 13, a.me ? '#fde047' : '#fff');
    }
    function drawBase(b) {
      const own = b.owner; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(b.x + 10, b.y + 14, b.w, b.h);
      ctx.fillStyle = b === myBase ? '#fef3c7' : '#e2e8f0'; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(0,0,0,.04)'; for (let i = 0; i < b.w; i += 40) ctx.fillRect(b.x + i, b.y, 20, b.h);
      for (const w of baseWalls(b)) { ctx.fillStyle = own.col; ctx.fillRect(w[0], w[1], w[2], w[3]); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(w[0], w[1], w[2], 4); }
      // gate
      const g = gateRect(b); if (b.lockT > 0) { ctx.fillStyle = `rgba(239,68,68,${0.5 + 0.3 * Math.sin(t * 10)})`; shadowOn(ctx, '#ef4444', 18); ctx.fillRect(g[0], g[1], g[2], g[3]); shadowOff(ctx); for (let i = 0; i < 6; i++) { ctx.fillStyle = '#fecaca'; ctx.fillRect(g[0] + i * g[2] / 6, g[1] + 6, g[2] / 12, 3); } label(ctx, '🔒 ' + Math.ceil(b.lockT) + 's', g[0] + g[2] / 2, g[1] + (b.top ? 34 : -20), 14, '#fecaca'); }
      // sign
      const sy = b.top ? b.y - 22 : b.y + b.h + 24; rr(ctx, b.x + b.w / 2 - 110, sy - 15, 220, 30, 10); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill(); label(ctx, (b === myBase ? '⭐ YOUR BASE' : own.name + "'s base"), b.x + b.w / 2, sy, 14, b === myBase ? '#fde047' : '#fff');
      const n = slotsNFor(b);
      for (let i = 0; i < n; i++) {
        const p = slotPos(b, i), m = b.slots[i];
        ellipse(ctx, p.x, p.y + 6, 36, 13, 'rgba(0,0,0,.18)'); ctx.fillStyle = m ? lgrad(ctx, p.x - 34, 0, p.x + 34, 0, [RAR[CBY[m.k].r].c, '#fff', RAR[CBY[m.k].r].c]) : '#cbd5e1'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 34, 12, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();
        if (m) { const cr = CBY[m.k]; rarityFx(ctx, cr.r, p.x, p.y, 38, t + m.born); ctx.save(); ctx.translate(p.x, p.y); drawCreature(ctx, m.k, 38, t + m.born); ctx.restore(); if (m.lv > 1) label(ctx, '★'.repeat(m.lv - 1), p.x, p.y + 20, 10, '#fde047'); }
      }
    }
    function nearestAction() {
      if (player.stun > 0) return null;
      if (!player.carry) {
        for (const lst of [belt, vipBelt]) for (const it of lst) if (dist(it.x, it.y, player.x, player.y) < 75) { const c = CBY[it.k]; return { kind: 'buy', it, lst, label: 'BUY ' + c.n + ' $' + fmtBig(c.p), can: S.money >= c.p }; }
        for (const b of BASES) { if (b === myBase || !inBase(player, b)) continue; for (let i = 0; i < 8; i++) { const m = b.slots[i]; if (m && dist(slotPos(b, i).x, slotPos(b, i).y, player.x, player.y) < 70) return { kind: 'steal', b, i, label: 'STEAL ' + CBY[m.k].n + '!', can: true }; } }
        for (const a of bots) if (a.carry && a.carry.from === myBase && dist(a.x, a.y, player.x, player.y) < 60) return { kind: 'tag', a, label: 'TAKE IT BACK!', can: true };
      }
      return null;
    }
    function act() { const n = nearestAction(); if (!n) return; if (n.kind === 'buy') { if (!buy(player, n.it, n.lst) && S.money < CBY[n.it.k].p) { E.sound('error'); E.toast('💵 Not enough money!'); } } else if (n.kind === 'steal') steal(player, n.b, n.i); else if (n.kind === 'tag') recover(n.a, player); }
    return {
      update(dt) {
        t += dt; fx.update(dt); msgT -= dt; alarm = Math.max(0, alarm - dt);
        if (offline > 0 && t > 0.4) { E.toast('💤 Welcome back! Your creatures earned $' + fmtBig(offline)); offline = 0; }
        // belts
        spawnT -= dt; if (spawnT <= 0) { spawnBelt(); spawnT = 2.3; }
        for (const it of belt) it.x += 70 * dt; belt = belt.filter(it => it.x < BELT.x1);
        if (S.vip) { vipT -= dt; if (vipT <= 0 && vipBelt.length < 4) { spawnVip(); vipT = 6; } for (const it of vipBelt) { it.y += 40 * dt; } vipBelt = vipBelt.filter(it => it.y < VIP.y + VIP.h - 20); }
        // income
        for (const b of BASES) { b.lockT = Math.max(0, b.lockT - dt); b.lockCD = Math.max(0, b.lockCD - dt); const inc = b.slots.reduce((s, m) => s + (m ? crIncome(m) : 0), 0) * (b === myBase ? incomeMult() : 0.8); if (b === myBase) { S.money += inc * dt; S.earned += inc * dt; } else b.owner.money += inc * dt; }
        // movement
        const spd = 270 * (1 + S.up.speed * 0.1);
        for (const a of actors) {
          a.stun = Math.max(0, a.stun - dt);
          let d = { x: 0, y: 0 };
          if (a.me) { const j = E.dir(); d = { x: j.x * j.mag, y: j.y * j.mag }; } else d = botThink(a, dt);
          if (a.stun > 0) d = { x: 0, y: 0 };
          const sp = (a.me ? spd : { speedy: 260, thief: 240 }[a.strat] || 225) * (a.carry ? 0.72 : 1);
          a.vx += (d.x * sp - a.vx) * Math.min(1, dt * 10); a.vy += (d.y * sp - a.vy) * Math.min(1, dt * 10);
          a.x += a.vx * dt; a.y += a.vy * dt; collide(a);
          if (Math.abs(a.vx) > 5) a.face = a.vx > 0 ? 1 : -1; if (Math.hypot(a.vx, a.vy) > 20) a.step += dt * 12;
          if (a.carry && inBase(a, a.base)) deliver(a);
        }
        // AI owners defend: if a thief carrying from their base is near, chase handled in botThink; player defending is manual (tag)
        for (const b of bots) if (b.carry && b.carry.from === myBase && dist(b.x, b.y, player.x, player.y) < 46 && !player.carry) recover(b, player);
        nearAct = nearestAction();
        lockBtn.textContent = myBase.lockT > 0 ? '🔒 ' + Math.ceil(myBase.lockT) + 's' : myBase.lockCD > 0 ? '⏳ ' + Math.ceil(myBase.lockCD) + 's' : '🔒 Lock';
        saveT += dt; if (saveT > 5) { saveT = 0; save(); }
        E.follow(player.x, player.y, Math.min(1.05, Math.min(E.W, E.H) / 720), dt);
      },
      draw() {
        const W = E.W, H = E.H;
        ctx.fillStyle = '#4d7c0f'; ctx.fillRect(0, 0, W, H);
        E.beginWorld(); const v = E.view(100);
        ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 0, MW, MH);
        ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < MW; x += 120) for (let y = 0; y < MH; y += 120) if (((x + y) / 120) % 2 === 0) ctx.fillRect(x, y, 120, 120);
        for (let i = 0; i < 50; i++) { const fx2 = (i * 337) % MW, fy = (i * 211) % MH; circle(ctx, fx2, fy, 4, hsl((i * 47) % 360, 80, 70)); }
        // paths
        ctx.fillStyle = '#d6b98c'; ctx.fillRect(0, BELT.y - 220, MW, 440); for (const b of BASES) { const e = entrance(b); ctx.fillRect(e.x - 80, Math.min(e.y, BELT.y), 160, Math.abs(BELT.y - e.y)); }
        // belt
        ctx.fillStyle = '#334155'; rr(ctx, BELT.x0 - 30, BELT.y - BELT.h / 2 - 12, BELT.x1 - BELT.x0 + 60, BELT.h + 24, 20); ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.fillRect(BELT.x0, BELT.y - BELT.h / 2, BELT.x1 - BELT.x0, BELT.h);
        ctx.strokeStyle = 'rgba(250,204,21,.6)'; ctx.lineWidth = 4; const off = (t * 70) % 60; for (let x = BELT.x0 + off; x < BELT.x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, BELT.y - 20); ctx.lineTo(x + 14, BELT.y); ctx.lineTo(x, BELT.y + 20); ctx.stroke(); }
        label(ctx, '🧠 CREATURE CONVEYOR 🧠', (BELT.x0 + BELT.x1) / 2, BELT.y - BELT.h / 2 - 34, 22, '#fde047');
        // VIP
        ctx.fillStyle = S.vip ? '#4c1d95' : '#1f2937'; rr(ctx, VIP.x0, VIP.y, VIP.x1 - VIP.x0, VIP.h, 20); ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = S.vip ? 'rgba(250,204,21,.25)' : 'rgba(239,68,68,.7)'; ctx.fillRect(VIP.gate, VIP.y - 40, 16, VIP.h + 80);
        label(ctx, S.vip ? '👑 VIP BELT' : '🔒 VIP BELT – rebirth to unlock', (VIP.x0 + VIP.x1) / 2, VIP.y - 22, 16, '#fde047');
        ctx.fillStyle = '#111827'; ctx.fillRect(VIP.x0 + 140, VIP.y + 10, 80, VIP.h - 20);
        for (const b of BASES) drawBase(b);
        const dl = [];
        for (const it of belt.concat(vipBelt)) { if (it.x < v.x0 || it.x > v.x1 || it.y < v.y0 || it.y > v.y1) continue; dl.push({ y: it.y, f: () => { const c = CBY[it.k]; rarityFx(ctx, c.r, it.x, it.y, 40, t + it.born); ctx.save(); ctx.translate(it.x, it.y); drawCreature(ctx, it.k, 40, t + it.born); ctx.restore(); rr(ctx, it.x - 56, it.y + 12, 112, 34, 8); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fill(); txt(ctx, c.n, it.x, it.y + 22, 10, RAR[c.r].c, 'center', 800); txt(ctx, '$' + fmtBig(c.p) + ' • ' + fmtBig(c.inc) + '/s', it.x, it.y + 36, 10, S.money >= c.p ? '#86efac' : '#fca5a5', 'center', 700); } }); }
        for (const a of actors) dl.push({ y: a.y, f: () => drawActor(a) });
        dl.sort((a, b) => a.y - b.y).forEach(d => d.f());
        if (nearAct) { const p = nearAct.kind === 'buy' ? nearAct.it : nearAct.kind === 'steal' ? slotPos(nearAct.b, nearAct.i) : nearAct.a; ctx.strokeStyle = nearAct.can ? '#fde047' : '#f87171'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(p.x, p.y - 15, 46, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        fx.draw(ctx);
        E.endWorld();
        // HUD money
        rr(ctx, W / 2 - 170, 10, 340, 58, 16); ctx.fillStyle = 'rgba(15,10,30,.75)'; ctx.fill();
        label(ctx, '$' + fmtBig(S.money), W / 2, 32, 26, '#86efac'); label(ctx, '+$' + fmtBig(myIncome()) + '/s' + (S.rebirths ? '  •  🔁 ×' + rebirthMult().toFixed(2) : ''), W / 2, 55, 13, '#e2e8f0');
        if (nearAct) { rr(ctx, W / 2 - 170, H * 0.72, 340, 44, 14); ctx.fillStyle = nearAct.can ? 'rgba(22,163,74,.9)' : 'rgba(127,29,29,.9)'; ctx.fill(); label(ctx, (E.touch ? '✋ ' : '[E] ') + nearAct.label, W / 2, H * 0.72 + 22, 16, '#fff'); }
        if (player.carry) label(ctx, '🏃 Carry it to YOUR base!', W / 2, H * 0.72 - 24, 18, '#fde047');
        if (alarm > 0) { ctx.fillStyle = `rgba(239,68,68,${0.15 + 0.1 * Math.sin(t * 12)})`; ctx.fillRect(0, 0, W, H); }
        if (msgT > 0) label(ctx, msg, W / 2, H * 0.3, 26, '#fde047');
        // mini map
        const mw = Math.min(170, W * 0.3), mh = mw * MH / MW, mx = 12, my = H - mh - (E.touch ? 120 : 14); rr(ctx, mx, my, mw, mh, 8); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
        ctx.fillStyle = 'rgba(250,204,21,.6)'; ctx.fillRect(mx + BELT.x0 / MW * mw, my + BELT.y / MH * mh - 2, (BELT.x1 - BELT.x0) / MW * mw, 4);
        for (const b of BASES) { ctx.fillStyle = b.owner.col; ctx.globalAlpha = 0.6; ctx.fillRect(mx + b.x / MW * mw, my + b.y / MH * mh, b.w / MW * mw, b.h / MH * mh); ctx.globalAlpha = 1; }
        for (const a of actors) circle(ctx, mx + a.x / MW * mw, my + a.y / MH * mh, a.me ? 3.5 : 2.5, a.me ? '#fde047' : '#fff');
      },
      _dbg: () => ({ x: Math.round(player.x), y: Math.round(player.y), money: Math.round(S.money), carry: player.carry && player.carry.k, near: nearAct && nearAct.label }),
      onKey(c) { if (c === 'KeyE' || c === 'Space' || c === 'Enter') act(); if (c === 'KeyL') lockBase(); if (c === 'KeyB') openBase(); if (c === 'KeyU') openShop(); if (c === 'KeyI') openIndex(); },
      down() { if (!E.touch && nearAct) act(); },
      destroy() { save(); E.pads(null); },
      hud() { const rows = actors.map(a => ({ n: a.name, s: '$' + fmtBig(a.me ? S.money : a.money), v: a.me ? netWorth() : a.money + a.base.slots.reduce((s, m) => s + (m ? CBY[m.k].p : 0), 0), me: a.me })).sort((a, b) => b.v - a.v); return { stats: [['Creatures', myBase.slots.filter(Boolean).length + '/' + slotsN()], ['Index', Object.keys(S.found).length + '/' + CR.length]], board: rows.map(r => ({ n: r.n, s: '$' + fmtBig(r.v), me: r.me })), boardTitle: '🧠 RICHEST BASES' }; }
    };
  }
});
