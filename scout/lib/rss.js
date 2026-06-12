import { fetchText, stripHtml, truncate, nowIso, hash, pickRandom } from './util.js';

// Zero-dependency RSS/Atom reader. We never scrape page HTML — we read the feeds
// publishers offer for syndication, and keep only the excerpt + a link back to the
// real article (no full copyrighted text, no generated text).

function safeChar(code) {
  try { return String.fromCodePoint(code); } catch { return ''; }
}

// Unwrap CDATA and decode XML/HTML entities (numeric + the common named ones).
// &amp; is decoded last so we never double-decode.
export function decode(s = '') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

// Inner text of the first <tag>…</tag> (namespaced tags like content:encoded work too).
function firstTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : '';
}
function attrOf(tagStr, name) {
  const m = tagStr.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : '';
}

// RSS: <link>https://…</link>. Atom: <link href="…" rel="alternate"/>.
function resolveLink(item) {
  const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim());
  const rssLink = decode(firstTag(item, 'link')).trim();
  if (isHttp(rssLink)) return rssLink;
  const links = item.match(/<link\b[^>]*>/gi) || [];
  let fallback = '';
  for (const l of links) {
    const href = attrOf(l, 'href');
    if (!isHttp(href)) continue;
    const rel = attrOf(l, 'rel');
    if (rel === 'alternate' || !rel) return href;
    if (!fallback) fallback = href;
  }
  return isHttp(fallback) ? fallback : '';
}

// media:content / media:thumbnail / enclosure, else the first <img> in the markup.
function extractImage(item) {
  const mediaTags = item.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/gi) || [];
  for (const tag of mediaTags) {
    const url = attrOf(tag, 'url');
    if (!url) continue;
    const type = attrOf(tag, 'type');
    const medium = attrOf(tag, 'medium');
    if (/^image\//i.test(type) || medium === 'image' || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)) return url;
  }
  const body = firstTag(item, 'content:encoded') || firstTag(item, 'description') || firstTag(item, 'summary') || firstTag(item, 'content');
  const img = decode(body).match(/<img\b[^>]*\bsrc\s*=\s*"([^"]+)"/i);
  if (img && /^https?:\/\//i.test(img[1])) return img[1];
  return undefined;
}

function authorOf(item) {
  const dc = stripHtml(decode(firstTag(item, 'dc:creator'))).trim();
  if (dc) return dc;
  const a = firstTag(item, 'author');
  if (a) return stripHtml(decode(firstTag(a, 'name') || a)).trim(); // Atom: <author><name>…</name></author>
  return '';
}

function splitItems(xml) {
  const rss = xml.match(/<item\b[\s\S]*?<\/item>/gi);
  if (rss && rss.length) return rss;
  return xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
}

const DENY_CATS = new Set(['uncategorized']);
// Pull the feed item's own <category>/<category term="…"> tags so users can hide precisely.
function extractCategories(item) {
  const out = [];
  const rss = item.match(/<category\b[^>]*>([\s\S]*?)<\/category>/gi) || [];
  for (const c of rss) { const m = c.match(/>([\s\S]*?)<\/category>/i); if (m) out.push(m[1]); }
  const atom = item.match(/<category\b[^>]*\bterm="([^"]*)"/gi) || [];
  for (const c of atom) { const m = c.match(/\bterm="([^"]*)"/i); if (m) out.push(m[1]); }
  return out;
}
function mergeTags(feedTags, item) {
  const cats = extractCategories(item)
    .map((s) => stripHtml(decode(s)).toLowerCase().trim())
    .filter((s) => s && s.length <= 28 && !DENY_CATS.has(s));
  return [...new Set([...(feedTags || []), ...cats])].slice(0, 10);
}

function itemToCard(item, feed) {
  const link = resolveLink(item);
  if (!link) return null;
  // text only: drop podcast / audio episodes (e.g. The Free Press's "Honestly")
  if (/<enclosure[^>]*type="audio\//i.test(item) || /<media:content[^>]*type="audio\//i.test(item)) return null;
  const title = stripHtml(decode(firstTag(item, 'title'))).trim();
  if (!title) return null;
  const raw = firstTag(item, 'description') || firstTag(item, 'summary') || firstTag(item, 'content:encoded') || firstTag(item, 'content');
  let text = stripHtml(decode(raw));
  if (feed.strip) for (const re of feed.strip) text = text.replace(re, '');   // drop boilerplate (e.g. Colossal membership pitch)
  text = text.replace(/\s+/g, ' ').trim();
  const author = authorOf(item);
  const date = stripHtml(decode(firstTag(item, 'pubDate') || firstTag(item, 'published') || firstTag(item, 'updated'))).trim();
  const image = extractImage(item);
  return {
    id: `${feed.type}:${hash(link)}`,
    type: feed.type,
    title,
    summary: truncate(text || title, 300),
    body: text ? truncate(text, 600) : undefined,
    image: image ? { src: image, alt: title, credit: feed.name } : undefined,
    source: {
      name: feed.name,
      url: link,
      trustTier: feed.trustTier || 'publication',
      ...(author ? { author } : {}),
      ...(date ? { date: date.slice(0, 24) } : {}),
    },
    tags: mergeTags(feed.tags, item),
    lang: 'en',
    difficulty: feed.difficulty || 3,
    fetchedAt: nowIso(),
    hash: hash(link),
    // time-limited sources stamp an expiry; the app hides expired cards from the deck/endless
    ...(feed.ttlDays ? { expires: new Date(Date.now() + feed.ttlDays * 86400000).toISOString() } : {}),
  };
}

// Fetch several feeds, normalise to cards, and return a varied subset of `count`.
// A dead or blocked feed is skipped, never fatal to the channel.
export async function rssCards(feeds, count = 4) {
  const perFeed = Math.max(2, Math.ceil((count * 2) / Math.max(1, feeds.length)));
  const pool = [];
  for (const feed of feeds) {
    try {
      const items = splitItems(await fetchText(feed.url));
      let taken = 0;
      for (const it of items) {
        const card = itemToCard(it, feed);
        if (!card) continue;
        pool.push(card);
        if (++taken >= perFeed) break;
      }
    } catch {
      /* skip this feed */
    }
  }
  const seen = new Set();
  const unique = pool.filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
  return pickRandom(unique, count);
}
