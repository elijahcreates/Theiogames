// Small helpers shared by the edge function (Deno) and the serverless functions (Node).
// Only Web-standard APIs are used so the same file runs in both runtimes.

export const TZ_DEFAULT = 'America/New_York';

/** Calendar day (YYYY-MM-DD) of a timestamp in the site's reporting time zone. */
export function dayKey(ts, tz = TZ_DEFAULT) {
  try {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ts));
    const g = t => p.find(x => x.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')}`;
  } catch (e) { return new Date(ts).toISOString().slice(0, 10); }
}

/** Hour of day (0-23) in the reporting time zone. */
export function hourOf(ts, tz = TZ_DEFAULT) {
  try { return +new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(ts)); } catch (e) { return new Date(ts).getUTCHours(); }
}

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }

export async function hmacHex(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}

/** Constant-time string compare. */
export function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

/**
 * Privacy-preserving network key: a hash of the IP address with a salt that changes every day.
 * The raw IP is never stored, and the same visitor gets a different key tomorrow, so it can only
 * be used to spot bursts of automated traffic within one day.
 */
export async function netKey(ip, secret, day) { return (await sha256Hex(`${secret || 'tiog'}|${day}|${ip || ''}`)).slice(0, 16); }

export function rid() { return (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, '').slice(0, 20); }
