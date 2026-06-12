import { fetchJSON, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// Sourced quotes (type: quote). Text is surfaced via ZenQuotes; each card is
// CITED to the speaker's Wikiquote page — the canonical place to verify (and
// see any misattribution notes for) a quotation. No generated text.
export const id = 'quote';

function wikiquoteUrl(author) {
  if (!author || /^(unknown|anonymous)$/i.test(author)) return 'https://en.wikiquote.org/';
  return `https://en.wikiquote.org/wiki/${encodeURIComponent(author.trim().replace(/\s+/g, '_'))}`;
}

export async function run({ count = 3 } = {}) {
  let data;
  try {
    data = await fetchJSON('https://zenquotes.io/api/quotes');
  } catch {
    return []; // service down → channel yields nothing this run, never fatal
  }
  const arr = Array.isArray(data) ? data : [];
  const cards = [];
  for (const q of pickRandom(arr, count)) {
    const content = (q && q.q ? String(q.q) : '').trim();
    const author = (q && q.a ? String(q.a) : 'Unknown').trim();
    // ZenQuotes returns a sentinel object when rate-limited — skip it.
    if (!content || /zenquotes\.io/i.test(author) || /too many requests/i.test(content)) continue;
    const unknown = /^(unknown|anonymous)$/i.test(author);
    const long = content.length > 170; // only offer "go deeper" when the title truncates
    cards.push({
      id: `quote:${hash(content)}`,
      type: 'quote',
      title: truncate(`“${content}”`, 180),
      summary: `— ${author}`,
      body: long ? `“${content}”\n\n— ${author}` : undefined,
      // ZenQuotes' free tier asks for a visible credit on pages that display its quotes;
      // the card renders this as a small "↗" link. The citation (source) is Wikiquote.
      attribution: { label: 'Quotes provided by ZenQuotes', url: 'https://zenquotes.io' },
      // name is just the reference (Wikiquote); the speaker rides along as `author`,
      // which the card's Source component renders as "Wikiquote · {author}".
      source: {
        name: 'Wikiquote',
        url: wikiquoteUrl(author),
        trustTier: 'community',
        ...(unknown ? {} : { author }),
      },
      tags: ['quote', 'wisdom'],
      lang: 'en',
      difficulty: 2,
      fetchedAt: nowIso(),
      hash: hash(content),
    });
  }
  return cards;
}
