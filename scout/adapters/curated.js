import { readFile } from 'node:fs/promises';
import { nowIso, hash, truncate } from '../lib/util.js';

// Hand-picked curiosities — real, human-curated cards (never AI-generated),
// authored directly in scout/curated/cards.json rather than crawled from an API.
// These are Curio's permanent collection: unlike feed cards they never rotate out
// of the pool (see the curated guard in lib/store.js saveCards). Each card's
// stable id (curated:<slug>) makes it a reliable deep-link target.
export const id = 'curated';

// Fallback slug from a title when an entry omits one. Authors should set an
// explicit slug, though — it's the deep-link id, so it must stay stable.
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function run({ curatedPath } = {}) {
  if (!curatedPath) return [];
  let raw;
  try {
    raw = await readFile(curatedPath, 'utf8');
  } catch {
    return []; // no curated file yet — silently contribute nothing
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`curated/cards.json is not valid JSON: ${e.message}`);
  }
  const entries = Array.isArray(data) ? data : Array.isArray(data.cards) ? data.cards : [];

  return entries
    // Skip template/draft rows and anything missing the essentials. scout.js also
    // drops sourceless cards, but we filter here so a half-written entry is quietly
    // ignored rather than failing the whole run.
    .filter((e) => e && !e.draft && e.title && e.summary && e.source && e.source.url)
    .map((e) => {
      const slug = e.slug || slugify(e.title);
      const tags = Array.isArray(e.tags) ? e.tags.filter(Boolean) : [];
      const card = {
        id: `curated:${slug}`,
        type: 'curated',
        title: e.title,
        summary: truncate(e.summary, 200),
        body: e.body || '',
        source: {
          name: e.source.name || 'Hand-picked',
          url: e.source.url,
          trustTier: e.source.trustTier || 'curated',
        },
        // 'hand-picked' tag lets the app distinguish these from feed cards (e.g.
        // in the "why am I seeing this?" panel) without a special card type check.
        tags: ['hand-picked', ...tags],
        difficulty: e.difficulty ?? 2,
        fetchedAt: nowIso(),
        hash: hash(`curated:${slug}`),
      };
      if (e.source.author) card.source.author = e.source.author;
      if (e.image) card.image = e.image;
      if (e.lang) card.lang = e.lang;
      return card;
    });
}
