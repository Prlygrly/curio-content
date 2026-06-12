import { fetchJSON, truncate, nowIso, hash } from '../lib/util.js';

// PoetryDB — public-domain poems (type: poem). No AI-generated verse.
export const id = 'poetry';

export async function run({ count = 2 } = {}) {
  const data = await fetchJSON(`https://poetrydb.org/random/${count}`);
  const poems = Array.isArray(data) ? data : [];
  return poems
    .filter((p) => p.title && Array.isArray(p.lines))
    .map((p) => {
      const lines = p.lines.filter((l) => l.trim().length);
      const preview = lines.slice(0, 4).join('\n');
      return {
        id: `poetry:${hash(`${p.author}|${p.title}`)}`,
        type: 'poem',
        title: p.title,
        summary: truncate(preview, 240),
        body: p.lines.join('\n'),
        source: {
          name: `${p.author} · PoetryDB`,
          // A real, queryable permalink that returns this exact poem as JSON.
          url: `https://poetrydb.org/title/${encodeURIComponent(p.title)}`,
          trustTier: 'community',
          author: p.author,
        },
        tags: ['poem', 'poetry', 'public domain'],
        lang: 'en',
        difficulty: 3,
        fetchedAt: nowIso(),
        hash: hash(`${p.author}|${p.title}`),
      };
    });
}
