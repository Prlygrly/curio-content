import { fetchJSON, fetchText, stripHtml, truncate, nowIso, hash } from '../lib/util.js';
import { decode } from '../lib/rss.js';

// Webcomics (type: comic). The image carries the visual gag; the punchline "hover-text"
// (xkcd's title-text, SMBC's labelled "Hovertext") is surfaced as the card summary so it
// survives on touch — phones have no mouse-hover, so on the real sites that joke is lost.
// Excerpt + link only; we never reproduce the whole archive.
export const id = 'comic';

// --- xkcd: clean JSON API, /info.0.json per comic (and the latest at the root). ---
async function xkcd(n) {
  const latest = await fetchJSON('https://xkcd.com/info.0.json', { timeout: 15000 });
  const max = latest.num || 0;
  if (!max) return [];
  const nums = [max];                       // always include today's
  const seen = new Set(nums);
  let guard = 0;
  while (nums.length < n * 3 && nums.length < max && guard++ < 200) {
    const r = 1 + Math.floor(Math.random() * max);
    if (r === 404 || seen.has(r)) continue; // #404 deliberately doesn't exist
    seen.add(r); nums.push(r);
  }
  const cards = [];
  for (const num of nums) {
    if (cards.length >= n) break;
    try {
      const d = num === max ? latest : await fetchJSON(`https://xkcd.com/${num}/info.0.json`, { timeout: 12000 });
      if (!d || !d.img || !/^https?:\/\//.test(d.img)) continue;
      const title = d.title || d.safe_title || `xkcd #${d.num}`;
      const alt = stripHtml(d.alt || '');
      const transcript = stripHtml(d.transcript || '').trim();
      const date = (d.year && d.month && d.day) ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : undefined;
      cards.push({
        id: `comic:xkcd:${d.num}`,
        type: 'comic',
        title,
        summary: alt || title,             // the hover-text punchline, always visible
        body: transcript && transcript.length > 40 ? truncate(transcript, 700) : undefined,
        image: { src: d.img, alt: d.alt || title, credit: `xkcd #${d.num} · Randall Munroe (CC BY-NC 2.5)` },
        source: { name: 'xkcd', url: `https://xkcd.com/${d.num}/`, trustTier: 'community', author: 'Randall Munroe', ...(date ? { date } : {}) },
        tags: ['comic', 'xkcd', 'humor'],
        lang: 'en',
        difficulty: 1,
        fetchedAt: nowIso(),
        hash: hash(`comic:xkcd:${d.num}`),
      });
    } catch { /* skip 404 holes / transient errors */ }
  }
  return cards;
}

// --- SMBC: RSS; the image + a labelled "Hovertext:" live inside the <description>. ---
async function smbc(n) {
  const xml = await fetchText('https://www.smbc-comics.com/comic/rss', { timeout: 15000 });
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const cards = [];
  for (const item of items) {
    if (cards.length >= n) break;
    const link = decode((item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '').trim();
    if (!/^https?:\/\//.test(link)) continue;
    const title = stripHtml(decode((item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''))
      .replace(/^Saturday Morning Breakfast Cereal\s*[-–—:]\s*/i, '').trim() || 'SMBC';
    const desc = decode((item.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '');
    const img = (desc.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
    if (!img || !/^https?:\/\//.test(img)) continue;
    const hover = stripHtml((desc.match(/Hovertext:\s*<br\s*\/?>([\s\S]*?)<\/p>/i) || [])[1] || '');
    const author = stripHtml(decode((item.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i) || [])[1] || '')) || 'Zach Weinersmith';
    const date = stripHtml((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '').slice(0, 16);
    cards.push({
      id: `comic:smbc:${hash(link)}`,
      type: 'comic',
      title,
      summary: hover || title,
      image: { src: img, alt: hover || title, credit: `SMBC · ${author}` },
      source: { name: 'Saturday Morning Breakfast Cereal', url: link, trustTier: 'community', author, ...(date ? { date } : {}) },
      tags: ['comic', 'smbc', 'humor'],
      lang: 'en',
      difficulty: 1,
      fetchedAt: nowIso(),
      hash: hash(link),
    });
  }
  return cards;
}

export async function run({ count = 4 } = {}) {
  const half = Math.max(1, Math.round(count / 2));
  const cards = [];
  try { cards.push(...await xkcd(half)); } catch { /* xkcd down — still try SMBC */ }
  try { cards.push(...await smbc(half)); } catch { /* SMBC down — keep what we have */ }
  return cards;
}
