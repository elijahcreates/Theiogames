// Netlify Function: receives visit events.
//  • "req"  – one line per homepage request, sent by the edge function (signed with TIOG_ADMIN_KEY)
//  • "start" / "hb" / "game" / "end" – sent by the page's tiny analytics script while someone visits
// Stores only anonymous, coarse data. Always answers 204 quickly and never throws at the visitor.
import { getAnalyticsStore } from '../lib/store.mjs';
import { botFromUA, deviceOf, browserOf, sourceOf } from '../lib/bots.mjs';
import { dayKey, netKey, hmacHex, safeEqual } from '../lib/util.mjs';
import { humanInteraction } from '../lib/classify.mjs';

const ok = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
const ID = /^[a-z0-9]{8,32}$/;
const GAME = /^[a-z0-9_-]{1,24}$/;
const n = (v, max = 1e7) => Math.max(0, Math.min(max, Math.round(+v || 0)));
function counts(o, keyRe, maxKeys = 80, maxVal = 1e6) {
  const out = {}; if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o).slice(0, maxKeys)) if (keyRe.test(k)) out[k] = n(v, maxVal);
  return out;
}
const maxMerge = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v); return o; };

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const raw = await req.text();
    if (raw.length > 6000) return ok();
    const body = JSON.parse(raw);
    const store = await getAnalyticsStore();
    const secret = process.env.TIOG_ADMIN_KEY || '';
    const tz = process.env.TIOG_TZ || undefined;
    const now = Date.now();

    if (body.k === 'req') {
      if (secret && !safeEqual(req.headers.get('x-tg-sig'), await hmacHex(secret, raw))) return ok();   // not from our edge function
      if (!ID.test(body.rid || '') || Math.abs(now - (+body.t || 0)) > 120000) return ok();
      const r = { rid: body.rid, t: n(body.t, 4e12), nk: String(body.nk || '').slice(0, 16), bot: body.bot && body.bot.name ? { name: String(body.bot.name).slice(0, 40), cat: String(body.bot.cat || '').slice(0, 30) } : null,
        dev: String(body.dev || '').slice(0, 12), br: String(body.br || '').slice(0, 12), src: body.src ? { type: String(body.src.type || '').slice(0, 10), name: String(body.src.name || '').slice(0, 60) } : null,
        cc: String(body.cc || '').slice(0, 2), sf: !!body.sf, al: !!body.al, hd: !!body.hd };
      await store.setJSON(`r/${dayKey(r.t, tz)}/${r.rid}`, r);
      return ok();
    }

    if (!['start', 'hb', 'game', 'end'].includes(body.k) || !ID.test(body.sid || '')) return ok();
    // same-site only (the beacon is first-party); ignore obvious cross-site spam
    const origin = req.headers.get('origin'); const host = new URL(req.url).host;
    if (origin && new URL(origin).host !== host) return ok();
    const t0 = n(body.t0, 4e12); if (Math.abs(now - t0) > 2 * 86400000) return ok();
    const key = `s/${dayKey(t0, tz)}/${body.sid}`;
    const prev = (await store.get(key, { type: 'json' })) || null;
    const ua = req.headers.get('user-agent') || '';
    const int = { pm: n(body.int && body.int.pm, 1e6), dc: n(body.int && body.int.dc, 1e6), pd: n(body.int && body.int.pd, 1e5), kd: n(body.int && body.int.kd, 1e6), ts: n(body.int && body.int.ts, 1e5), sc: n(body.int && body.int.sc, 1e6) };
    const s = prev || {
      sid: body.sid, t0, vid: ID.test(body.vid || '') ? body.vid : null, ret: !!body.ret,
      bot: botFromUA(ua), dev: deviceOf(ua), br: browserOf(ua),
      cc: ((context && context.geo && context.geo.country && context.geo.country.code) || '').slice(0, 2),
      nk: await netKey(context && context.ip, secret, dayKey(t0, tz)),
      src: sourceOf(String(body.ref || '').slice(0, 300), host, body.utm ? String(body.utm).slice(0, 40) : ''),
      rid: null, wd: false, vis: 0, int: {}, games: {}, plays: {}, pages: {}, n: 0,
    };
    if (!s.rid && ID.test(body.rid || '')) s.rid = body.rid;
    s.wd = s.wd || body.wd === true;
    s.vis = Math.max(s.vis || 0, n(body.vis, 86400));
    s.int = maxMerge(s.int, int);
    s.games = maxMerge(s.games, counts(body.games, GAME, 80, 86400));
    s.plays = maxMerge(s.plays, counts(body.plays, GAME, 80, 1000));
    s.pages = maxMerge(s.pages, counts(body.pages, /^(\/|#[a-z0-9_-]{1,24})$/, 80, 1000));
    s.t1 = now; s.n = (s.n || 0) + 1; if (body.k === 'end') s.ended = true;
    await store.setJSON(key, s);
    const m = Math.floor(now / 60000);
    if (body.k !== 'end') {   // "online now": one tiny marker per active minute
      const c = s.bot || s.wd ? 'b' : humanInteraction(s.int) ? 'h' : 'u';
      await store.set(`p/${m}/${s.sid}.${c}`, '1');
    } else {                  // left the site: stop counting them as online
      await Promise.all([m, m - 1].flatMap(mm => ['h', 'u', 'b'].map(c => store.delete(`p/${mm}/${s.sid}.${c}`))));
    }
  } catch (e) { /* ignore bad input */ }
  return ok();
};
