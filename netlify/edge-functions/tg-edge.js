// Netlify Edge Function: logs each homepage request for the human-vs-bot analytics.
// Runs at Netlify's edge in front of the static page; it never changes the page itself and
// `onError: "bypass"` makes Netlify serve the page normally if this function ever fails.
import { logPageRequest } from '../lib/edge-core.mjs';

export default async (request, context) => logPageRequest({
  request,
  ip: context.ip,
  country: context.geo && context.geo.country && context.geo.country.code,
  next: () => context.next(),
  waitUntil: typeof context.waitUntil === 'function' ? p => context.waitUntil(p) : null,
  secret: Netlify.env.get('TIOG_ADMIN_KEY'),
  tz: Netlify.env.get('TIOG_TZ') || undefined,
});

export const config = { path: ['/', '/index.html'], onError: 'bypass' };
