import { fetchJSON, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// The Met Collection open-access artworks (type: art). Image-led.
const TERMS = ['sunflower', 'river', 'portrait', 'horse', 'moon', 'garden', 'cat', 'ship', 'mountain', 'flower', 'bird', 'dancer', 'storm', 'harvest'];

export const id = 'met';

export async function run({ count = 3 } = {}) {
  const term = pickRandom(TERMS, 1)[0];
  const search = await fetchJSON(
    `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(term)}`
  );
  const candidates = pickRandom(search?.objectIDs || [], 40);
  const cards = [];
  for (const oid of candidates) {
    if (cards.length >= count) break;
    try {
      const o = await fetchJSON(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${oid}`);
      const img = o.primaryImageSmall || o.primaryImage;
      if (!img) continue;
      const artist = o.artistDisplayName || 'Unknown artist';
      const meta = [artist, o.objectDate, o.medium].filter(Boolean);
      cards.push({
        id: `met:${o.objectID}`,
        type: 'art',
        title: o.title || 'Untitled',
        summary: truncate(meta.join(' · '), 240),
        body: [meta.join(' · '), o.creditLine, o.department].filter(Boolean).join('\n'),
        image: { src: img, alt: o.title || 'Artwork', credit: `The Met · ${o.creditLine || 'Open Access'}` },
        source: {
          name: 'The Met Collection',
          url: o.objectURL,
          trustTier: 'encyclopedic',
          author: o.artistDisplayName || undefined,
          date: o.objectDate || undefined,
        },
        tags: ['art', 'museum', term, (o.classification || '').toLowerCase()].filter(Boolean),
        lang: 'en',
        difficulty: 1,
        fetchedAt: nowIso(),
        hash: hash(`met:${o.objectID}`),
      });
    } catch {
      // skip this object
    }
  }
  return cards;
}
