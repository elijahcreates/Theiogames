/* =====================================================================
   STYLE STUDIO  (dress-up fashion challenges vs AI stylists)
   ===================================================================== */
registerGame({
  id: 'style', title: 'Style Studio', emoji: '👗', c1: '#ee9ca7', c2: '#ffdde1', cats: ['Creative', 'Simulation'], isNew: true, hot: true,
  desc: 'Design stunning outfits for themed fashion challenges! Mix hairstyles, tops, bottoms, shoes, accessories and colors, then strut the runway against AI stylists and win the judges over.',
  controls: 'Tap items & colors', scoreLabel: 'TOTAL STARS',
  hint: 'Pick a category, choose items and colors, then press ✨ SHOWTIME to compete on the runway. 3 challenges per show!', hintTouch: 'Pick items & colors, then tap ✨ SHOWTIME to hit the runway!',
  create(E) {
    const ctx = E.ctx, fx = Fx();
    const PAL = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f8fafc', '#111827', '#a16207', '#d4af37', '#94a3b8', '#fda4af', '#a7f3d0', '#c4b5fd'];
    const SKIN = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];
    const IT = {
      hair: [['bob', 'Bob', 'cute casual'], ['long', 'Long Waves', 'elegant formal'], ['pony', 'Ponytail', 'sporty casual'], ['curly', 'Curls', 'cute garden'], ['buns', 'Space Buns', 'cute space party'], ['spiky', 'Spiky', 'edgy rock'], ['braids', 'Braids', 'garden casual'], ['mohawk', 'Mohawk', 'edgy rock spooky']],
      top: [['tee', 'T-Shirt', 'casual summer'], ['hoodie', 'Hoodie', 'casual sporty winter'], ['blouse', 'Ruffle Blouse', 'elegant garden'], ['jacket', 'Leather Jacket', 'edgy rock'], ['sweater', 'Cozy Sweater', 'winter cozy'], ['tank', 'Tank Top', 'summer sporty'], ['gown', 'Ball Gown', 'formal elegant royal party'], ['suit', 'Space Suit', 'space futuristic'], ['cape', 'Cloak', 'spooky royal']],
      bottom: [['jeans', 'Jeans', 'casual rock'], ['shorts', 'Shorts', 'summer sporty'], ['skirt', 'Mini Skirt', 'cute party'], ['longskirt', 'Long Skirt', 'elegant formal garden'], ['leggings', 'Leggings', 'sporty space'], ['cargo', 'Cargo Pants', 'space winter edgy']],
      shoes: [['sneakers', 'Sneakers', 'sporty casual'], ['boots', 'Boots', 'winter edgy rock spooky'], ['heels', 'Heels', 'formal elegant royal party'], ['sandals', 'Sandals', 'summer garden'], ['moon', 'Moon Boots', 'space futuristic winter']],
      acc: [['none', 'None', ''], ['shades', 'Sunglasses', 'summer edgy'], ['crown', 'Crown', 'royal formal'], ['beanie', 'Beanie', 'winter cozy'], ['phones', 'Headphones', 'rock sporty'], ['flower', 'Flower Clip', 'garden cute summer'], ['witch', 'Witch Hat', 'spooky'], ['visor', 'Space Visor', 'space futuristic'], ['scarf', 'Scarf', 'winter cozy elegant'], ['pearls', 'Pearl Necklace', 'elegant formal royal'], ['cap', 'Sports Cap', 'sporty casual']]
    };
    const THEMES = [
      { n: '🏖️ Beach Day', tags: ['summer', 'casual'], cols: ['#facc15', '#06b6d4', '#f97316', '#22c55e', '#ec4899'], bg: ['#7dd3fc', '#fde68a'] },
      { n: '👑 Royal Ball', tags: ['royal', 'formal', 'elegant'], cols: ['#d4af37', '#8b5cf6', '#f8fafc', '#ec4899'], bg: ['#4c1d95', '#be185d'] },
      { n: '🚀 Space Explorer', tags: ['space', 'futuristic'], cols: ['#94a3b8', '#3b82f6', '#f8fafc', '#06b6d4'], bg: ['#020617', '#312e81'] },
      { n: '❄️ Winter Wonderland', tags: ['winter', 'cozy'], cols: ['#f8fafc', '#3b82f6', '#06b6d4', '#ef4444'], bg: ['#bfdbfe', '#f1f5f9'] },
      { n: '🎸 Rock Concert', tags: ['rock', 'edgy'], cols: ['#111827', '#ef4444', '#94a3b8', '#8b5cf6'], bg: ['#111827', '#7f1d1d'] },
      { n: '🏅 Sporty Champion', tags: ['sporty'], cols: ['#ef4444', '#3b82f6', '#f8fafc', '#22c55e', '#facc15'], bg: ['#16a34a', '#bbf7d0'] },
      { n: '🌸 Garden Party', tags: ['garden', 'cute'], cols: ['#fda4af', '#a7f3d0', '#c4b5fd', '#facc15', '#f8fafc'], bg: ['#86efac', '#fdf2f8'] },
      { n: '🎃 Spooky Night', tags: ['spooky'], cols: ['#111827', '#8b5cf6', '#f97316', '#22c55e'], bg: ['#1e1b4b', '#7c2d12'] },
      { n: '🎉 Party Time', tags: ['party', 'cute'], cols: ['#ec4899', '#facc15', '#8b5cf6', '#06b6d4', '#d4af37'], bg: ['#db2777', '#7c3aed'] }
    ];
    const RIVALS = [['Chloé Chic', '#e879f9'], ['Marco Moda', '#38bdf8'], ['Zara Glam', '#fb923c'], ['Kenji Kool', '#4ade80'], ['Luna Luxe', '#fde047']];
    let round = 0, totalStars = 0, theme, rivals, phase = 'design', time = 75, t = 0, results = null, revealT = 0, cat = 'hair';
    const look = { skin: '#f1c27d', hair: 'long', hairC: '#7c2d12', top: 'tee', topC: '#ec4899', bottom: 'jeans', bottomC: '#3b82f6', shoes: 'sneakers', shoesC: '#f8fafc', acc: 'none', accC: '#d4af37' };
    const tagsOf = (c, id) => { const r = IT[c].find(x => x[0] === id); return r ? r[2].split(' ').filter(Boolean) : []; };
    function score(L, th) {
      let s = 0; const parts = ['hair', 'top', 'bottom', 'shoes', 'acc'];
      parts.forEach(p => { tagsOf(p, L[p]).forEach(tg => { if (th.tags.includes(tg)) s += 2.2; }); });
      ['hairC', 'topC', 'bottomC', 'shoesC', 'accC'].forEach(k => { if (k === 'accC' && L.acc === 'none') return; if (th.cols.includes(L[k])) s += 1.1; });
      if (L.acc !== 'none') s += 0.8; if (L.top === 'gown' && L.bottom !== 'longskirt') s -= 0.5;
      const uniq = new Set([L.hairC, L.topC, L.bottomC, L.shoesC]).size; if (uniq >= 2 && uniq <= 3) s += 1; // color harmony
      return s;
    }
    function rivalLook(skill) {
      const L = { skin: pick(SKIN) }; const th = theme;
      ['hair', 'top', 'bottom', 'shoes', 'acc'].forEach(p => { const good = IT[p].filter(x => x[2].split(' ').some(tg => th.tags.includes(tg))); L[p] = (Math.random() < skill && good.length ? pick(good) : pick(IT[p]))[0]; });
      ['hairC', 'topC', 'bottomC', 'shoesC', 'accC'].forEach(k => L[k] = Math.random() < skill ? pick(th.cols) : pick(PAL));
      return L;
    }
    function newRound() {
      round++; theme = THEMES[(irand(0, THEMES.length - 1) + round) % THEMES.length]; phase = 'design'; time = 75; results = null;
      rivals = shuffle(RIVALS.slice()).slice(0, 3).map((r, i) => ({ n: r[0], c: r[1], L: rivalLook(0.35 + round * 0.12 + i * 0.08) }));
      buildPanel();
    }
    function judge() {
      phase = 'runway'; revealT = 0; E.sound('cheer');
      const entries = [{ n: 'You', L: Object.assign({}, look), me: true }].concat(rivals.map(r => ({ n: r.n, L: r.L, c: r.c })));
      entries.forEach(e => { const raw = score(e.L, theme); e.scores = [0, 1, 2].map(() => clamp(Math.round(2 + raw * 0.62 + rand(-1, 1)), 1, 10)); e.total = e.scores.reduce((a, b) => a + b, 0); });
      entries.sort((a, b) => b.total - a.total); results = entries; const pos = entries.findIndex(e => e.me) + 1, stars = [0, 3, 2, 1, 0][pos];
      totalStars += stars; if (pos === 1) E.ach('fashion'); panel.style.display = 'none';
      setTimeout(() => { if (E.g !== api) return; E.sound(pos === 1 ? 'win' : 'score'); if (pos === 1) fx.burst(E.W / 2, E.H * 0.4, 70, { col: PAL, spd: 420, shape: 's', size: 8, grav: 300 }); }, 2400);
    }
    // ---------- DOM wardrobe ----------
    const panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;background:rgba(255,255,255,.92);border-radius:20px;padding:10px;overflow:auto;-webkit-overflow-scrolling:touch;box-shadow:0 12px 40px rgba(0,0,0,.35);color:#1f2937';
    E.layer.appendChild(panel);
    function placePanel() { const wide = E.W > E.H * 1.05; if (wide) { panel.style.cssText += ';left:auto;right:12px;top:58px;bottom:12px;width:' + Math.min(420, E.W * 0.42) + 'px;height:auto'; } else { panel.style.cssText += ';left:10px;right:10px;width:auto;top:auto;bottom:10px;height:' + Math.round(E.H * 0.42) + 'px'; } }
    function buildPanel() {
      placePanel(); panel.style.display = 'block';
      const cats = [['hair', '💇 Hair'], ['top', '👚 Tops'], ['bottom', '👖 Bottoms'], ['shoes', '👟 Shoes'], ['acc', '🎀 Extras'], ['skin', '🎨 Skin']];
      let h = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${cats.map(([k, n]) => `<button data-cat="${k}" style="padding:7px 10px;border-radius:12px;font-weight:800;font-size:.82rem;background:${cat === k ? 'linear-gradient(90deg,#ec4899,#8b5cf6)' : '#f1f5f9'};color:${cat === k ? '#fff' : '#334155'}">${n}</button>`).join('')}</div>`;
      if (cat === 'skin') h += `<div style="display:flex;gap:8px;flex-wrap:wrap">${SKIN.map(c => `<button data-skin="${c}" style="width:44px;height:44px;border-radius:50%;background:${c};border:3px solid ${look.skin === c ? '#ec4899' : '#fff'};box-shadow:0 2px 6px rgba(0,0,0,.2)"></button>`).join('')}</div>`;
      else {
        h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px">${IT[cat].map(([id, n, tg]) => `<button data-item="${id}" style="padding:8px 6px;border-radius:12px;font-weight:800;font-size:.78rem;background:${look[cat] === id ? '#fce7f3' : '#fff'};border:2px solid ${look[cat] === id ? '#ec4899' : '#e2e8f0'};color:#334155">${n}<br><span style="font-weight:600;font-size:.66rem;color:#94a3b8">${tg}</span></button>`).join('')}</div>`;
        h += `<div style="margin:8px 0 4px;font-weight:800;font-size:.8rem;color:#64748b">COLOR</div><div style="display:flex;gap:6px;flex-wrap:wrap">${PAL.map(c => `<button data-col="${c}" style="width:32px;height:32px;border-radius:50%;background:${c};border:3px solid ${look[cat + 'C'] === c ? '#ec4899' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,.25)"></button>`).join('')}</div>`;
      }
      h += `<button data-go="1" style="margin-top:10px;width:100%;padding:12px;border-radius:14px;font-weight:900;font-size:1rem;color:#fff;background:linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)">✨ SHOWTIME – hit the runway!</button>`;
      panel.innerHTML = h;
      panel.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; E.sound('tick'); buildPanel(); });
      panel.querySelectorAll('[data-item]').forEach(b => b.onclick = () => { look[cat] = b.dataset.item; E.sound('click'); fx.burst(E.W * 0.3, E.H * 0.4, 8, { col: PAL, spd: 120, shape: 'star' }); buildPanel(); });
      panel.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { look[cat + 'C'] = b.dataset.col; E.sound('tick'); buildPanel(); });
      panel.querySelectorAll('[data-skin]').forEach(b => b.onclick = () => { look.skin = b.dataset.skin; E.sound('tick'); buildPanel(); });
      panel.querySelector('[data-go]').onclick = () => { if (phase === 'design') judge(); };
    }
    // ---------- model drawing ----------
    function drawModel(L, x, y, s, walk) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const sw = walk ? Math.sin(t * 6) * 0.12 : 0;
      ellipse(ctx, 0, 4, 46, 10, 'rgba(0,0,0,.25)');
      const O = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.strokeStyle = O; ctx.lineJoin = 'round';
      const hairBack = () => { ctx.fillStyle = L.hairC; if (L.hair === 'long' || L.hair === 'braids') { rr(ctx, -30, -232, 60, 110, 26); ctx.fill(); } if (L.hair === 'pony') { ctx.beginPath(); ctx.ellipse(24, -190, 12, 40, 0.3, 0, TAU); ctx.fill(); } if (L.hair === 'curly') for (let i = 0; i < 9; i++) circle(ctx, -28 + (i % 3) * 28, -236 + Math.floor(i / 3) * 28, 16, L.hairC); };
      hairBack();
      // legs
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 11, -100); ctx.rotate(sd * sw); ctx.fillStyle = L.skin; rr(ctx, -8, 0, 16, 92, 7); ctx.fill(); ctx.restore(); }
      // bottoms
      ctx.fillStyle = L.bottomC;
      if (L.bottom === 'jeans' || L.bottom === 'cargo' || L.bottom === 'leggings') { for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 11, -104); ctx.rotate(sd * sw); rr(ctx, -10, 0, 20, L.bottom === 'leggings' ? 88 : 84, 6); ctx.fill(); ctx.stroke(); if (L.bottom === 'cargo') { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-9, 30, 9, 14); ctx.fillStyle = L.bottomC; } ctx.restore(); } rr(ctx, -22, -112, 44, 22, 6); ctx.fill(); }
      else if (L.bottom === 'shorts') { rr(ctx, -22, -112, 44, 40, 8); ctx.fill(); ctx.stroke(); }
      else if (L.bottom === 'skirt') { ctx.beginPath(); ctx.moveTo(-20, -112); ctx.lineTo(20, -112); ctx.lineTo(34, -62); ctx.lineTo(-34, -62); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(-20, -112); ctx.lineTo(20, -112); ctx.lineTo(40, -14); ctx.lineTo(-40, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // shoes
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 11 + Math.sin(sd * sw) * 92, -10); ctx.fillStyle = L.shoesC;
        if (L.shoes === 'boots' || L.shoes === 'moon') { rr(ctx, -11, -28, 22, 34, 6); ctx.fill(); ctx.stroke(); if (L.shoes === 'moon') { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-11, -10, 22, 6); } }
        else if (L.shoes === 'heels') { ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(14, 4); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-9, -4, 4, 12); }
        else if (L.shoes === 'sandals') { ctx.fillRect(-10, 2, 22, 5); ctx.fillRect(-6, -6, 3, 9); ctx.fillRect(4, -6, 3, 9); }
        else { rr(ctx, -11, -8, 24, 14, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-11, 2, 24, 3); }
        ctx.restore(); }
      // torso + arms
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 30, -186); ctx.rotate(sd * (0.15 - sw * 0.6)); ctx.fillStyle = L.skin; rr(ctx, -7, 0, 14, 72, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = L.skin; rr(ctx, -24, -194, 48, 86, 12); ctx.fill();
      ctx.fillStyle = L.topC;
      if (L.top === 'gown') { ctx.beginPath(); ctx.moveTo(-22, -190); ctx.lineTo(22, -190); ctx.lineTo(26, -112); ctx.lineTo(48, -10); ctx.lineTo(-48, -10); ctx.lineTo(-26, -112); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 10, -100); ctx.lineTo(-30 + i * 20, -14); ctx.stroke(); } ctx.strokeStyle = O; }
      else if (L.top === 'cape') { ctx.beginPath(); ctx.moveTo(-26, -194); ctx.lineTo(26, -194); ctx.lineTo(44, -60); ctx.lineTo(-44, -60); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { const long = L.top === 'hoodie' || L.top === 'sweater' || L.top === 'jacket' || L.top === 'suit'; rr(ctx, -26, -196, 52, L.top === 'tank' ? 84 : 90, 12); ctx.fill(); ctx.stroke(); if (long) for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 30, -188); ctx.rotate(sd * (0.15 - sw * 0.6)); rr(ctx, -9, 0, 18, 60, 8); ctx.fill(); ctx.stroke(); ctx.restore(); } else if (L.top !== 'tank') for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 30, -188); ctx.rotate(sd * (0.15 - sw * 0.6)); rr(ctx, -9, 0, 18, 22, 6); ctx.fill(); ctx.restore(); }
        if (L.top === 'hoodie') { ctx.fillStyle = 'rgba(0,0,0,.15)'; rr(ctx, -14, -150, 28, 18, 6); ctx.fill(); }
        if (L.top === 'jacket') { ctx.strokeStyle = '#d1d5db'; ctx.beginPath(); ctx.moveTo(0, -194); ctx.lineTo(0, -108); ctx.stroke(); ctx.strokeStyle = O; }
        if (L.top === 'blouse') { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) circle(ctx, -12 + i * 8, -190, 6); }
        if (L.top === 'sweater') { ctx.strokeStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-24, -170 + i * 22); ctx.lineTo(24, -170 + i * 22); ctx.stroke(); } ctx.strokeStyle = O; }
        if (L.top === 'suit') { ctx.fillStyle = '#f8fafc'; rr(ctx, -12, -180, 24, 20, 4); ctx.fill(); circle(ctx, -6, -170, 3, '#ef4444'); circle(ctx, 4, -170, 3, '#22c55e'); }
        if (L.top === 'tee') { star(ctx, 0, -160, 10, 4.5, 5); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill(); } }
      // head
      ctx.fillStyle = L.skin; rr(ctx, -6, -206, 12, 14, 4); ctx.fill(); circle(ctx, 0, -228, 26, L.skin);
      circle(ctx, -9, -228, 3.4, '#111'); circle(ctx, 9, -228, 3.4, '#111'); circle(ctx, -8, -229, 1.2, '#fff'); circle(ctx, 10, -229, 1.2, '#fff');
      ellipse(ctx, -15, -219, 5, 3, 'rgba(244,114,182,.5)'); ellipse(ctx, 15, -219, 5, 3, 'rgba(244,114,182,.5)');
      ctx.strokeStyle = '#be123c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -218, 7, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = O;
      // front hair
      ctx.fillStyle = L.hairC;
      if (L.hair === 'bob' || L.hair === 'long' || L.hair === 'braids' || L.hair === 'pony') { ctx.beginPath(); ctx.arc(0, -232, 28, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(28, -214); ctx.lineTo(18, -238); ctx.lineTo(-18, -238); ctx.lineTo(-28, -214); ctx.closePath(); ctx.fill(); if (L.hair === 'bob') { rr(ctx, -30, -240, 12, 36, 6); ctx.fill(); rr(ctx, 18, -240, 12, 36, 6); ctx.fill(); } if (L.hair === 'braids') for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) circle(ctx, sd * 26, -200 + i * 14, 7, L.hairC); }
      if (L.hair === 'buns') { ctx.beginPath(); ctx.arc(0, -232, 28, Math.PI, 0); ctx.fill(); circle(ctx, -24, -258, 14, L.hairC); circle(ctx, 24, -258, 14, L.hairC); }
      if (L.hair === 'curly') { for (let i = 0; i < 6; i++) circle(ctx, -24 + i * 10, -252 + (i % 2) * 6, 11, L.hairC); }
      if (L.hair === 'spiky') { ctx.beginPath(); ctx.moveTo(-28, -232); for (let i = 0; i < 7; i++) { ctx.lineTo(-28 + i * 9.3, -268 - (i % 2) * 10); ctx.lineTo(-24 + i * 9.3 + 4, -240); } ctx.lineTo(28, -232); ctx.closePath(); ctx.fill(); }
      if (L.hair === 'mohawk') { ctx.beginPath(); ctx.moveTo(-8, -250); for (let i = 0; i < 5; i++) { ctx.lineTo(-8 + i * 4, -290 + (i % 2) * 8); } ctx.lineTo(8, -250); ctx.closePath(); ctx.fill(); }
      // accessories
      const A = L.acc, AC = L.accC;
      if (A === 'shades') { ctx.fillStyle = '#111'; rr(ctx, -22, -235, 18, 11, 4); ctx.fill(); rr(ctx, 4, -235, 18, 11, 4); ctx.fill(); ctx.fillRect(-4, -232, 8, 3); }
      if (A === 'crown') { ctx.fillStyle = AC; ctx.beginPath(); ctx.moveTo(-20, -252); ctx.lineTo(-22, -280); ctx.lineTo(-10, -266); ctx.lineTo(0, -286); ctx.lineTo(10, -266); ctx.lineTo(22, -280); ctx.lineTo(20, -252); ctx.closePath(); ctx.fill(); ctx.stroke(); circle(ctx, 0, -266, 4, '#ef4444'); }
      if (A === 'beanie') { ctx.fillStyle = AC; ctx.beginPath(); ctx.arc(0, -238, 29, Math.PI, 0); ctx.fill(); ctx.fillRect(-30, -244, 60, 10); circle(ctx, 0, -270, 8, '#f8fafc'); }
      if (A === 'phones') { ctx.strokeStyle = AC; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -234, 30, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = AC; rr(ctx, -36, -240, 12, 22, 5); ctx.fill(); rr(ctx, 24, -240, 12, 22, 5); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = O; }
      if (A === 'flower') { for (let i = 0; i < 5; i++) circle(ctx, 22 + Math.cos(i * 1.26) * 7, -248 + Math.sin(i * 1.26) * 7, 5, AC); circle(ctx, 22, -248, 4, '#facc15'); }
      if (A === 'witch') { ctx.fillStyle = AC; ctx.beginPath(); ctx.ellipse(0, -252, 44, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22, -254); ctx.lineTo(10, -320); ctx.lineTo(22, -254); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f97316'; ctx.fillRect(-20, -262, 40, 6); }
      if (A === 'visor') { ctx.fillStyle = 'rgba(56,189,248,.5)'; ctx.beginPath(); ctx.arc(0, -228, 34, 0, TAU); ctx.fill(); ctx.strokeStyle = AC; ctx.lineWidth = 4; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = O; }
      if (A === 'scarf') { ctx.fillStyle = AC; rr(ctx, -24, -200, 48, 14, 6); ctx.fill(); rr(ctx, 6, -194, 14, 40, 5); ctx.fill(); }
      if (A === 'pearls') { for (let i = 0; i < 9; i++) circle(ctx, -16 + i * 4, -192 + Math.sin(i / 8 * Math.PI) * 8, 3, '#f8fafc'); }
      if (A === 'cap') { ctx.fillStyle = AC; ctx.beginPath(); ctx.arc(0, -240, 28, Math.PI, 0); ctx.fill(); rr(ctx, 0, -246, 42, 9, 4); ctx.fill(); }
      ctx.restore();
    }
    newRound();
    const api = {
      update(dt) {
        t += dt; fx.update(dt);
        if (phase === 'design') { time -= dt; if (time <= 0) judge(); }
        else if (phase === 'runway') { revealT += dt; if (revealT > 7.5) { if (round >= 3) { phase = 'done'; E.gameOver({ score: totalStars, win: totalStars >= 6, title: '👗 Fashion Show Complete!', label: 'STARS (max 9)', lines: ['3 challenges • ' + totalStars + ' ⭐ earned'] }); } else newRound(); } }
      },
      draw() {
        const W = E.W, H = E.H, th = theme, wide = W > H * 1.05;
        ctx.fillStyle = lgrad(ctx, 0, 0, W, H, th.bg); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 16; i++) { ctx.globalAlpha = 0.15; star(ctx, (i * 173 + t * 10) % W, (i * 97) % H, 10 + (i % 3) * 6, 4, 5); ctx.fillStyle = '#fff'; ctx.fill(); } ctx.globalAlpha = 1;
        if (phase === 'design') {
          const cx = wide ? (W - Math.min(420, W * 0.42) - 24) / 2 : W / 2, cy = wide ? H * 0.9 : H * 0.54, s = wide ? Math.min(1.6, H / 380) : Math.min(1.3, H * 0.5 / 330);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(cx, cy, 120 * s, 22 * s, 0, 0, TAU); ctx.fill();
          ctx.drawImage(E.glow(320), cx - 160 * s, cy - 330 * s, 320 * s, 320 * s);
          drawModel(look, cx, cy, s, false);
          label(ctx, 'Challenge ' + round + '/3: ' + th.n, cx, wide ? 80 : 34, Math.min(26, W / 22), '#fff');
          label(ctx, 'Judges love: ' + th.tags.join(', ') + '  •  ⏱ ' + Math.ceil(time) + 's', cx, wide ? 110 : 62, 15, '#fef3c7');
          const sw = 22; th.cols.forEach((c, i) => { circle(ctx, cx - (th.cols.length - 1) * sw / 2 + i * sw, wide ? 134 : 84, 8, c); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
        } else if (results) {
          // runway
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(W * 0.35, H * 0.18); ctx.lineTo(W * 0.65, H * 0.18); ctx.lineTo(W * 0.95, H); ctx.lineTo(W * 0.05, H); ctx.fill();
          for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.3; ctx.drawImage(E.glow((i * 60 + t * 40) % 360), i * W / 5 - 80, -80, 200, 200); } ctx.globalAlpha = 1;
          label(ctx, th.n + ' – RESULTS', W / 2, 40, 26, '#fff');
          const n = results.length, sw = Math.min(W / n, 260), s = Math.min(0.9, H / 520, sw / 140);
          results.forEach((e, i) => {
            const show = revealT > 0.6 + (n - 1 - i) * 0.5, x = W / 2 + (i - (n - 1) / 2) * sw, y = H * 0.78;
            drawModel(e.L, x, y + (show ? 0 : 400), s, !show);
            if (show) { label(ctx, (i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '') + e.n, x, y + 26, 16, e.me ? '#fde047' : '#fff'); label(ctx, e.scores.join(' + ') + ' = ' + e.total, x, y + 48, 14, '#e2e8f0'); }
          });
          if (revealT > 2.6) { const pos = results.findIndex(e => e.me) + 1; label(ctx, pos === 1 ? '👑 YOU WIN THIS CHALLENGE! +3⭐' : pos === 2 ? '🥈 2nd place! +2⭐' : pos === 3 ? '🥉 3rd place! +1⭐' : 'Not this time…', W / 2, H * 0.16, 26, '#fde047'); }
        }
        fx.draw(ctx);
      },
      resize() { if (phase === 'design') placePanel(); },
      hud() { return { stats: [['Stars', totalStars + ' ⭐']] }; }
    };
    return api;
  }
});
