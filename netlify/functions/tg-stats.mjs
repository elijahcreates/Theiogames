// Netlify Function: private statistics for the admin dashboard (admin.html).
// Requires the header  x-tg-key: <TIOG_ADMIN_KEY>.  Raw visit records are kept 90 days; daily
// summaries (which hold no personal data) are kept for long-term history.
import { getAnalyticsStore, pool } from '../lib/store.mjs';
import { dayKey, hourOf, safeEqual } from '../lib/util.mjs';
import { aggregateDay, AGG_VERSION } from '../lib/classify.mjs';

const RETAIN_DAYS = 90;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
const addMap = (a, b) => { for (const [k, v] of Object.entries(b || {})) a[k] = (a[k] || 0) + v; return a; };

function daysBack(n, tz) {
  const out = [], seen = new Set();
  for (let i = 0; out.length < n && i < n + 3; i++) { const d = dayKey(Date.now() - i * 86400000, tz); if (!seen.has(d)) { seen.add(d); out.push(d); } }
  return out.reverse();
}

async function loadRaw(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const items = await pool(blobs.map(b => b.key), 16, k => store.get(k, { type: 'json' }));
  return items.filter(Boolean);
}

async function dayAggregate(store, day, { live, tz }) {
  if (!live) {
    const c = await store.get(`a/${day}`, { type: 'json' });
    if (c && c.agg && c.agg.v === AGG_VERSION) return c;
  }
  const [requests, sessions] = await Promise.all([loadRaw(store, `r/${day}/`), loadRaw(store, `s/${day}/`)]);
  const res = aggregateDay(day, requests, sessions, { hourOf: t => hourOf(t, tz) });
  if (!live && (requests.length || sessions.length)) await store.setJSON(`a/${day}`, { agg: res.agg, recent: [] });
  return res;
}

async function housekeeping(store, tz) {
  try {
    // presence markers older than 10 minutes
    const cutoff = Math.floor(Date.now() / 60000) - 10;
    const { blobs } = await store.list({ prefix: 'p/' });
    await pool(blobs.filter(b => +b.key.split('/')[1] < cutoff).slice(0, 800).map(b => b.key), 16, k => store.delete(k));
    // raw records older than the retention window (summaries stay)
    for (let i = RETAIN_DAYS + 1; i <= RETAIN_DAYS + 7; i++) {
      const d = dayKey(Date.now() - i * 86400000, tz);
      for (const p of [`r/${d}/`, `s/${d}/`]) { const l = await store.list({ prefix: p }); await pool(l.blobs.map(b => b.key), 16, k => store.delete(k)); }
    }
  } catch (e) { /* best effort */ }
}

export default async (req, context) => {
  const secret = process.env.TIOG_ADMIN_KEY || '';
  if (!secret) return json({ error: 'not_configured', message: 'Set the TIOG_ADMIN_KEY environment variable in Netlify, then redeploy.' }, 503);
  if (!safeEqual(req.headers.get('x-tg-key'), secret)) { await new Promise(r => setTimeout(r, 400)); return json({ error: 'unauthorized' }, 401); }

  const tz = process.env.TIOG_TZ || undefined;
  const url = new URL(req.url);
  const range = ({ today: 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 })[url.searchParams.get('range')] || 7;
  const store = await getAnalyticsStore();
  const days = daysBack(range, tz), today = dayKey(Date.now(), tz), yesterday = dayKey(Date.now() - 86400000, tz);

  const results = await pool(days, 6, d => dayAggregate(store, d, { live: d === today || d === yesterday, tz }));

  const T = { visits: { human: 0, bot: 0, uncertain: 0 }, js: 0, noJs: 0, timeSec: 0, timeVisits: 0, games: {}, gameSec: {}, pages: {}, sources: {}, sourceTypes: {}, devices: {}, browsers: {}, countries: {}, botCats: {}, botNames: {}, reasons: {} };
  const V = { human: new Set(), bot: new Set(), uncertain: new Set() }, R = new Set();
  const series = [];
  results.forEach(({ agg: a }, i) => {
    series.push({ day: days[i], ...a.visits });
    for (const k of ['human', 'bot', 'uncertain']) { T.visits[k] += a.visits[k]; a.visitors[k].forEach(x => V[k].add(x)); }
    a.returning.forEach(x => R.add(x));
    T.js += a.js; T.noJs += a.noJs; T.timeSec += a.timeSec; T.timeVisits += a.timeVisits;
    for (const k of ['games', 'gameSec', 'pages', 'sources', 'sourceTypes', 'devices', 'browsers', 'countries', 'botCats', 'botNames', 'reasons']) addMap(T[k], a[k]);
  });
  const todayRes = results[days.indexOf(today)];
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, ...((todayRes && todayRes.agg.hours[h]) || { human: 0, bot: 0, uncertain: 0 }) }));
  const recent = [...(todayRes ? todayRes.recent : []), ...((results[days.indexOf(yesterday)] || {}).recent || [])].sort((a, b) => b.t - a.t).slice(0, 60);

  // online now = browsers that sent a heartbeat in the last 2 minutes
  const m = Math.floor(Date.now() / 60000), online = { human: 0, uncertain: 0, bot: 0 }, seen = new Set();
  for (const mm of [m, m - 1]) {
    const { blobs } = await store.list({ prefix: `p/${mm}/` });
    for (const b of blobs) { const [sid, c] = b.key.split('/')[2].split('.'); if (seen.has(sid)) continue; seen.add(sid); online[c === 'h' ? 'human' : c === 'b' ? 'bot' : 'uncertain']++; }
  }

  const total = T.visits.human + T.visits.bot + T.visits.uncertain;
  const pct = x => total ? Math.round(x / total * 1000) / 10 : 0;
  const allVisitors = new Set([...V.human, ...V.bot, ...V.uncertain]);
  const top = (o, n = 12) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ k, v }));

  const hk = housekeeping(store, tz); if (context && typeof context.waitUntil === 'function') context.waitUntil(hk);
  return json({
    generatedAt: Date.now(), range, days: series, hours: range === 1 ? hours : null, tz: tz || 'America/New_York',
    totals: { visits: total, ...T.visits, humanPct: pct(T.visits.human), botPct: pct(T.visits.bot), uncertainPct: pct(T.visits.uncertain), js: T.js, noJs: T.noJs },
    visitors: { unique: allVisitors.size, human: V.human.size, bot: V.bot.size, uncertain: V.uncertain.size, returning: R.size },
    avgTimeSec: T.timeVisits ? Math.round(T.timeSec / T.timeVisits) : 0, totalHumanSec: Math.round(T.timeSec),
    games: Object.keys(T.games).map(id => ({ id, plays: T.games[id], minutes: Math.round((T.gameSec[id] || 0) / 6) / 10 })).sort((a, b) => b.plays - a.plays).slice(0, 15),
    pages: top(T.pages, 15), sources: top(T.sources), sourceTypes: top(T.sourceTypes), devices: top(T.devices), browsers: top(T.browsers), countries: top(T.countries),
    botCats: top(T.botCats), botNames: top(T.botNames), reasons: top(T.reasons, 20), online, recent,
  });
};
