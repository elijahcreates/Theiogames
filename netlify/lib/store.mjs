// Storage: Netlify Blobs in production. For local testing set TG_LOCAL_STORE=/some/dir and the
// same small interface is backed by plain files instead.
import { promises as fs } from 'node:fs';
import path from 'node:path';

function fileStore(dir) {
  const file = k => path.join(dir, encodeURIComponent(k));
  return {
    async get(k, opts) { try { const s = await fs.readFile(file(k), 'utf8'); return opts && opts.type === 'json' ? JSON.parse(s) : s; } catch (e) { return null; } },
    async set(k, v) { await fs.mkdir(dir, { recursive: true }); await fs.writeFile(file(k), String(v)); },
    async setJSON(k, v) { await this.set(k, JSON.stringify(v)); },
    async delete(k) { try { await fs.unlink(file(k)); } catch (e) {} },
    async list({ prefix = '' } = {}) {
      let names = []; try { names = await fs.readdir(dir); } catch (e) {}
      return { blobs: names.map(n => ({ key: decodeURIComponent(n) })).filter(b => b.key.startsWith(prefix)) };
    },
  };
}

let cached = null;
export async function getAnalyticsStore() {
  if (cached) return cached;
  if (process.env.TG_LOCAL_STORE) return (cached = fileStore(process.env.TG_LOCAL_STORE));
  const { getStore } = await import('@netlify/blobs');
  return (cached = getStore({ name: 'tiog-analytics', consistency: 'strong' }));
}

/** Run async fn over items with limited concurrency. */
export async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
