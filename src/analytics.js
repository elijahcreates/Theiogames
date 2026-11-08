/* =====================================================================
   ANONYMOUS VISIT ANALYTICS (human vs bot)
   Tiny, passive and privacy-friendly: no cookies for tracking, no fingerprinting, no names,
   no IP storage. Sends a few small events per visit to /.netlify/functions/tg on the same site.
   Honors Do Not Track / Global Privacy Control (then no returning-visitor id is kept).
   ===================================================================== */
(function tgAnalytics() {
  const host = location.hostname;
  if (!(location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1')) return;   // live site / local test only
  const EP = '/.netlify/functions/tg';
  const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
  const optOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const now = Date.now(), todayStr = new Date().toISOString().slice(0, 10);
  let vid = null, ret = false, sid = null, t0 = now;
  try {
    if (!optOut) {
      vid = localStorage.getItem('tg_vid'); const first = localStorage.getItem('tg_first');
      if (!vid) { vid = rnd(); localStorage.setItem('tg_vid', vid); localStorage.setItem('tg_first', todayStr); } else ret = !!first && first < todayStr;
    }
    // one session per tab, continued across reloads unless idle for 30 minutes
    const last = +sessionStorage.getItem('tg_last') || 0;
    sid = sessionStorage.getItem('tg_sid');
    if (!sid || now - last > 30 * 60000) { sid = rnd(); sessionStorage.setItem('tg_sid', sid); sessionStorage.setItem('tg_t0', String(now)); }
    t0 = +sessionStorage.getItem('tg_t0') || now;
  } catch (e) { sid = sid || rnd(); }
  let rid = null; try { const m = document.cookie.match(/(?:^|; )tg_rid=([a-z0-9]+)/); if (m) { rid = m[1]; document.cookie = 'tg_rid=; Max-Age=0; Path=/'; } } catch (e) {}
  if (!rid) return;   // no edge logger in front of this page (e.g. a manual drag-and-drop deploy) -> analytics stays off
  let utm = ''; try { utm = new URLSearchParams(location.search).get('utm_source') || ''; } catch (e) {}

  // passive interaction counters (pointer moves, direction changes, clicks, keys, touches, scrolls)
  const I = { pm: 0, dc: 0, pd: 0, kd: 0, ts: 0, sc: 0 }; let lx = 0, ly = 0, sx = 0, sy = 0;
  const opt = { passive: true, capture: true };
  addEventListener('pointermove', e => { I.pm++; const dx = Math.sign(e.clientX - lx), dy = Math.sign(e.clientY - ly); if ((dx && sx && dx !== sx) || (dy && sy && dy !== sy)) I.dc++; if (dx) sx = dx; if (dy) sy = dy; lx = e.clientX; ly = e.clientY; }, opt);
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') I.ts++; else I.pd++; }, opt);
  addEventListener('touchstart', () => { I.ts++; }, opt);
  addEventListener('keydown', () => { I.kd++; }, opt);
  addEventListener('wheel', () => { I.sc++; }, opt);
  addEventListener('scroll', () => { I.sc++; }, opt);

  // visible time, pages (home + #game routes), games played and minutes per game
  let vis = 0; const pages = {}, plays = {}, games = {}; let cur = null, curT = 0, dirty = true;
  const page = () => { const k = location.hash && /^#[a-z0-9_-]{1,24}$/.test(location.hash) ? location.hash : '/'; pages[k] = (pages[k] || 0) + 1; dirty = true; };
  page(); addEventListener('hashchange', page);
  setInterval(() => { if (!document.hidden) { vis++; if (cur) games[cur] = (games[cur] || 0) + 1; } }, 1000);
  addEventListener('tiog:game', e => {
    const id = e.detail && e.detail.id;
    if (id && id !== cur) { plays[id] = (plays[id] || 0) + 1; }
    cur = id || null; curT = Date.now(); dirty = true;
    clearTimeout(tgAnalytics.t); tgAnalytics.t = setTimeout(() => send('game'), 3000);
  });

  function send(k) {
    try {
      sessionStorage.setItem('tg_last', String(Date.now()));
      const body = JSON.stringify({ k, sid, vid, ret, rid, t0, vis, int: I, wd: navigator.webdriver === true, pages, plays, games, ref: document.referrer || '', utm });
      const blob = new Blob([body], { type: 'application/json' });
      if (!(navigator.sendBeacon && navigator.sendBeacon(EP, blob))) fetch(EP, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
      dirty = false;
    } catch (e) {}
  }
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1));
  setTimeout(() => idle(() => send('start')), 2500);                       // after the page has loaded
  setInterval(() => { if (!document.hidden) send('hb'); }, 60000);          // heartbeat ("online now", time on site)
  setTimeout(() => { if (dirty) send('hb'); }, 15000);                      // early update captures quick interactions
  addEventListener('visibilitychange', () => { if (document.hidden) send('end'); });
  addEventListener('pagehide', () => send('end'));
})();
