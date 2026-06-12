import { fetchJSON, stripHtml, truncate, nowIso, hash } from '../lib/util.js';

// Random Wikipedia article summaries (type: wiki).
// REST API: GET /page/random/summary returns one random article each call.
export const id = 'wikipedia';

export async function run({ count = 4 } = {}) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    try {
      const d = await fetchJSON('https://en.wikipedia.org/api/rest_v1/page/random/summary');
      if (!d || !d.extract) continue;
      const url = d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(d.title)}`;
      const extract = stripHtml(d.extract);
      cards.push({
        id: `wikipedia:${d.pageid || d.title}`,
        type: 'wiki',
        title: d.title,
        summary: truncate(extract, 320),
        body: extract,
        image: d.thumbnail?.source
          ? { src: d.thumbnail.source, alt: d.title, credit: 'Wikipedia' }
          : undefined,
        source: { name: 'Wikipedia', url, trustTier: 'encyclopedic' },
        tags: ['encyclopedia', 'wikipedia', 'random'],
        lang: 'en',
        difficulty: 2,
        fetchedAt: nowIso(),
        hash: hash(url),
      });
    } catch {
      // skip this one, keep going
    }
  }
  return cards;
}
