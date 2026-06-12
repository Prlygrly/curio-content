import { fetchJSON, stripHtml, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// Smithsonian Open Access (type: art) — CC0 artworks & artifacts from across the
// Smithsonian's units. Image-led; a sibling to the Met channel. Needs a free api.data.gov
// key (the SAME key works for NASA APOD). Without a valid key the API returns 403 and the
// scout just skips this channel.
export const id = 'smithsonian';

const TERMS = ['portrait', 'landscape', 'bird', 'flower', 'ceramic', 'textile', 'insect', 'mineral', 'sculpture', 'botanical', 'moon', 'ship', 'mask'];

function firstCC0Image(media) {
  if (!Array.isArray(media)) return null;
  for (const m of media) {
    const access = m && m.usage && m.usage.access;
    const url = m && (m.content || m.thumbnail);
    if (url && /^https?:\/\//.test(url) && access === 'CC0') return url;
  }
  return null;
}

export async function run({ count = 3, apiKey = '' } = {}) {
  if (!apiKey) return []; // no key → nothing to do (see config.smithsonianApiKey)
  const term = pickRandom(TERMS, 1)[0];
  const start = Math.floor(Math.random() * 60);
  const q = `${term} AND online_media_type:"Images"`;
  const url = `https://api.si.edu/openaccess/api/v1.0/search?api_key=${encodeURIComponent(apiKey)}&rows=60&start=${start}&q=${encodeURIComponent(q)}`;
  const data = await fetchJSON(url, { timeout: 20000 });
  const rows = (data && data.response && data.response.rows) || [];
  const cards = [];
  for (const row of pickRandom(rows, rows.length)) {
    if (cards.length >= count) break;
    const dnr = row && row.content && row.content.descriptiveNonRepeating;
    if (!dnr) continue;
    const img = firstCC0Image(dnr.online_media && dnr.online_media.media);
    if (!img) continue;
    const title = stripHtml(String((dnr.title && dnr.title.content) || row.title || '')).trim();
    const link = dnr.record_link || dnr.guid;
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    const unit = dnr.data_source || 'Smithsonian';
    const idx = (row.content && row.content.indexedStructured) || {};
    const meta = [idx.date && idx.date[0], idx.object_type && idx.object_type[0]].filter(Boolean);
    cards.push({
      id: `art:si:${row.id || hash(link)}`,
      type: 'art',
      title,
      summary: truncate([unit, ...meta].filter(Boolean).join(' · '), 240),
      body: meta.length ? `${unit}\n${meta.join(' · ')}` : unit,
      image: { src: img, alt: title, credit: `${unit} · Smithsonian Open Access (CC0)` },
      source: { name: 'Smithsonian Open Access', url: link, trustTier: 'encyclopedic', ...(meta[0] ? { date: String(meta[0]) } : {}) },
      tags: ['art', 'museum', 'smithsonian', term].concat(idx.object_type ? [String(idx.object_type[0]).toLowerCase()] : []).filter(Boolean),
      lang: 'en',
      difficulty: 1,
      fetchedAt: nowIso(),
      hash: hash(`art:si:${row.id || link}`),
    });
  }
  return cards;
}
