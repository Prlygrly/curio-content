import { createHash } from 'node:crypto';

// A descriptive User-Agent is required/encouraged by Wikimedia and polite elsewhere.
export const UA = 'Curio/0.1 (personal offline reading app)';

export function hash(str) {
  return createHash('sha1').update(String(str)).digest('hex').slice(0, 16);
}

export function stripHtml(s = '') {
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s = '', n = 280) {
  s = String(s).trim();
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch JSON with a timeout and retry-with-backoff on transient failures
// (network errors, 5xx, 429). Fails fast on other 4xx (e.g. 404).
export async function fetchJSON(url, { timeout = 15000, headers = {}, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} for ${url}`);
        if ((res.status >= 500 || res.status === 429) && attempt < retries) {
          lastErr = err;
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw err;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

// Like fetchJSON, but returns the raw text body — for RSS/Atom feeds (XML).
export async function fetchText(url, { timeout = 15000, headers = {}, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8',
          ...headers,
        },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} for ${url}`);
        if ((res.status >= 500 || res.status === 429) && attempt < retries) {
          lastErr = err;
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw err;
      }
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

// Fisher–Yates shuffle; returns first n (or all if n is null/undefined).
export function pickRandom(arr, n) {
  const a = [...(arr || [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return n == null ? a : a.slice(0, n);
}

export function nowIso() {
  return new Date().toISOString();
}

// Detect text that didn't decode cleanly upstream: the Unicode replacement
// character (U+FFFD, e.g. NASA APOD serving a lost "ö") or classic mojibake
// from UTF-8 misread as Latin-1 ("Ã©", "â€™"). The original bytes are gone, so
// we can't auto-repair — callers flag (never block) so corrupt-but-readable
// cards still ship and can be hand-fixed before a push. See scout/audit.js.
const BAD_TEXT = /\uFFFD|\u00C3[\u0080-\u00BF]|\u00E2\u20AC/;

// Returns [{ field, snippet }] for each string value in `card` with bad text.
export function findTextIssues(card) {
  const hits = [];
  const walk = (val, fieldPath) => {
    if (typeof val === 'string') {
      const m = val.match(BAD_TEXT);
      if (m) {
        const i = m.index;
        const snippet = val.slice(Math.max(0, i - 20), i + 20).replace(/\s+/g, ' ');
        hits.push({ field: fieldPath, snippet });
      }
    } else if (val && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        walk(v, fieldPath ? `${fieldPath}.${k}` : k);
      }
    }
  };
  walk(card, '');
  return hits;
}
