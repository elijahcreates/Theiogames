// Human / bot / uncertain classification and daily aggregation.
// Kept separate and pure so the rules are easy to read, test and improve.

export const AGG_VERSION = 4;

/**
 * Did the visitor interact the way people do? Any touch, a couple of key presses, a click after
 * moving the pointer, or curvy pointer movement. Speed is NOT held against anyone – a fast visitor
 * who interacts is still a human.
 */
export function humanInteraction(i) {
  if (!i) return false;
  return (i.ts || 0) >= 1 || (i.kd || 0) >= 2 || ((i.pd || 0) >= 1 && (i.pm || 0) >= 3) || ((i.pm || 0) >= 15 && (i.dc || 0) >= 3) || ((i.sc || 0) >= 2 && (i.pm || 0) >= 3);
}

/**
 * Classify one visit. `s` = the browser session (null if JavaScript never reported back),
 * `r` = the server-side request record (null if the edge logger wasn't involved),
 * `net` = per-network stats for the day ({ reqs, burst, human }).
 * Returns { cls: 'human'|'bot'|'uncertain', why }.
 */
export function classifyVisit(s, r, net) {
  const bot = (s && s.bot) || (r && r.bot);
  if (bot) return { cls: 'bot', why: `Known bot: ${bot.name}`, cat: bot.cat, tag: bot.name };
  if ((s && s.wd) || (r && r.hd)) return { cls: 'bot', why: 'Automated browser (webdriver / headless)', cat: 'Automation', tag: 'Automated browser' };
  const burst = net && net.burst >= 20 && !net.human;
  if (!s) {
    if (r && !r.sf && !r.al) return { cls: 'bot', why: 'No JavaScript and non-browser request headers', cat: 'Suspicious behaviour', tag: 'Fake browser (no JS)' };
    if (burst) return { cls: 'bot', why: 'Very frequent repeated requests, no JavaScript', cat: 'Suspicious behaviour', tag: 'Request burst (no JS)' };
    return { cls: 'uncertain', why: 'Page requested but JavaScript never ran (bounced instantly, blocked, or a simple bot)' };
  }
  if (humanInteraction(s.int)) return { cls: 'human', why: 'Real interaction (touch, mouse or keyboard)' };
  if (burst) return { cls: 'bot', why: 'Repeated automated visits from one network, no interaction', cat: 'Suspicious behaviour', tag: 'Repeated automated visits' };
  if ((s.vis || 0) >= 20) return { cls: 'uncertain', why: 'Page open in a browser but no interaction' };
  return { cls: 'uncertain', why: 'Very short visit with no interaction' };
}

/** Requests from the same (daily-salted) network key: count, densest 10-minute window, any human? */
export function networkStats(requests, sessions) {
  const by = {};
  for (const r of requests) (by[r.nk] = by[r.nk] || { ts: [], human: false }).ts.push(r.t);
  for (const s of sessions) if (s.nk && humanInteraction(s.int)) (by[s.nk] = by[s.nk] || { ts: [], human: false }).human = true;
  const out = {};
  for (const [k, v] of Object.entries(by)) {
    v.ts.sort((a, b) => a - b); let burst = 0;
    for (let i = 0, j = 0; i < v.ts.length; i++) { while (v.ts[i] - v.ts[j] > 600000) j++; burst = Math.max(burst, i - j + 1); }
    out[k] = { reqs: v.ts.length, burst, human: v.human };
  }
  return out;
}

const inc = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };

/** Build one day's aggregate from raw requests + sessions. Mergeable across days. */
export function aggregateDay(day, requests, sessions, { hourOf } = {}) {
  const net = networkStats(requests, sessions);
  const reqById = new Map(requests.map(r => [r.rid, r]));
  const used = new Set();
  const visits = [];
  for (const s of sessions) { const r = s.rid ? reqById.get(s.rid) : null; if (r) used.add(r.rid); visits.push({ s, r }); }
  for (const r of requests) if (!used.has(r.rid)) visits.push({ s: null, r });

  const A = {
    v: AGG_VERSION, day, visits: { human: 0, bot: 0, uncertain: 0 }, hours: {},
    visitors: { human: [], bot: [], uncertain: [] }, returning: [],
    js: 0, noJs: 0, timeSec: 0, timeVisits: 0,
    games: {}, gameSec: {}, pages: {}, sources: {}, sourceTypes: {}, devices: {}, browsers: {}, countries: {},
    botCats: {}, botNames: {}, reasons: {},
  };
  const vsets = { human: new Set(), bot: new Set(), uncertain: new Set() }, ret = new Set();
  const recent = [];
  for (const { s, r } of visits) {
    const nk = (s && s.nk) || (r && r.nk);
    const c = classifyVisit(s, r, net[nk]);
    A.visits[c.cls]++; inc(A.reasons, `${c.cls}|${c.why}`);
    const t = (s && s.t0) || (r && r.t) || 0;
    if (hourOf) { const h = hourOf(t); A.hours[h] = A.hours[h] || { human: 0, bot: 0, uncertain: 0 }; A.hours[h][c.cls]++; }
    const bot = (s && s.bot) || (r && r.bot);
    // visitor identity: random browser id when available, otherwise network key + client type
    const who = (s && s.vid) ? 'v:' + s.vid.slice(0, 12) : 'n:' + (nk || '?') + ':' + (bot ? bot.name : ((s || r).br || '') + (s || r).dev);
    vsets[c.cls].add(who);
    if (s) A.js++; else A.noJs++;
    if (c.cls === 'bot') { inc(A.botCats, c.cat || 'Other bot'); inc(A.botNames, c.tag || c.why); }
    if (c.cls === 'human') {
      if (s.ret && s.vid) ret.add(who);
      const sec = Math.min(4 * 3600, s.vis || 0); A.timeSec += sec; A.timeVisits++;
      for (const [g, n] of Object.entries(s.plays || {})) inc(A.games, g, n);
      for (const [g, n] of Object.entries(s.games || {})) inc(A.gameSec, g, Math.min(4 * 3600, n));
      for (const [p, n] of Object.entries(s.pages || {})) inc(A.pages, p, n);
      const src = s.src || (r && r.src); if (src) { inc(A.sources, src.name); inc(A.sourceTypes, src.type); }
      inc(A.devices, s.dev || (r && r.dev)); inc(A.browsers, s.br || (r && r.br)); inc(A.countries, s.cc || (r && r.cc));
    }
    recent.push({ t, cls: c.cls, why: c.why, dev: (s || r).dev, br: (s || r).br, cc: (s && s.cc) || (r && r.cc) || '', src: ((s && s.src) || (r && r.src) || {}).name || '',
      sec: s ? Math.round(s.vis || 0) : 0, games: s ? Object.keys(s.plays || {}).slice(0, 4) : [], js: !!s, ret: !!(s && s.ret) });
  }
  for (const k of Object.keys(vsets)) A.visitors[k] = [...vsets[k]];
  A.returning = [...ret];
  recent.sort((a, b) => b.t - a.t);
  return { agg: A, recent: recent.slice(0, 60) };
}
