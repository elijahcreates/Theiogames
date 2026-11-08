// Core of the edge request logger, kept runtime-neutral so it can be tested locally in Node.
// For every homepage request it records ONE small, privacy-safe line (no IP, no full user agent)
// and gives the browser a short-lived first-party cookie (tg_rid) so the page's own script can say
// "this request really loaded in a browser and ran JavaScript". Requests that never come back with
// JavaScript are how bots that don't run scripts get counted.
import { botFromUA, deviceOf, browserOf, sourceOf } from './bots.mjs';
import { dayKey, netKey, hmacHex, rid as makeRid } from './util.mjs';

export async function logPageRequest({ request, ip, country, next, waitUntil, secret, tz, fetchImpl }) {
  const res = await next();
  try {
    if (request.method !== 'GET') return res;
    const h = request.headers;
    const purpose = (h.get('sec-purpose') || h.get('purpose') || h.get('x-moz') || '').toLowerCase();
    if (purpose.includes('prefetch') || purpose.includes('prerender')) return res;   // browser speculation, not a visit
    const ua = h.get('user-agent') || '';
    const now = Date.now(), day = dayKey(now, tz), id = makeRid();
    const url = new URL(request.url);
    const rec = {
      k: 'req', rid: id, t: now, day,
      nk: await netKey(ip, secret, day),
      bot: botFromUA(ua), dev: deviceOf(ua), br: browserOf(ua),
      src: sourceOf(h.get('referer') || '', url.hostname, url.searchParams.get('utm_source')),
      cc: (country || '').slice(0, 2),
      sf: h.has('sec-fetch-mode') || h.has('sec-fetch-site'),          // real browsers send these
      al: !!h.get('accept-language'),
      hd: /headless/i.test(ua) || /HeadlessChrome/.test(h.get('sec-ch-ua') || ''),
    };
    const body = JSON.stringify(rec);
    const sig = secret ? await hmacHex(secret, body) : '';
    const send = (fetchImpl || fetch)(new URL('/.netlify/functions/tg', request.url), { method: 'POST', headers: { 'content-type': 'application/json', 'x-tg-sig': sig }, body }).catch(() => {});
    if (waitUntil) waitUntil(send); else await Promise.race([send, new Promise(r => setTimeout(r, 400))]);
    const out = new Response(res.body, res);   // copy so headers are mutable
    out.headers.append('set-cookie', `tg_rid=${id}; Max-Age=900; Path=/; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`);
    return out;
  } catch (e) {
    return res;   // analytics must never break the page
  }
}
