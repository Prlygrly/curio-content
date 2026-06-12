import { fetchJSON, stripHtml, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// Word of the day (type: word). The *definitions* — the actual content — are
// fetched from and cited to Wiktionary's REST API. The seed below is only a
// curation of which words to surface (vocabulary tokens, not facts or prose);
// many are Greek-rooted, a nod to the Ancient Greek channel.
export const id = 'word';

const WORDS = [
  'serendipity', 'ephemeral', 'mellifluous', 'halcyon', 'ineffable', 'quintessence',
  'palimpsest', 'petrichor', 'nostalgia', 'melancholy', 'labyrinth', 'catharsis',
  'epiphany', 'paradox', 'aphorism', 'etymology', 'philology', 'enigma', 'zeitgeist',
  'reverie', 'ethereal', 'eclectic', 'idyllic', 'sublime', 'oblivion', 'solitude',
  'luminous', 'eloquence', 'apotheosis', 'hubris', 'kairos', 'logos', 'ethos',
  'pathos', 'phronesis', 'eudaimonia', 'sophrosyne', 'anagnorisis', 'susurrus', 'threnody',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function run({ count = 3 } = {}) {
  const cards = [];
  const candidates = pickRandom(WORDS); // full shuffle; we stop once we have `count`
  for (let i = 0; i < candidates.length && cards.length < count; i++) {
    if (i) await sleep(400); // gentle pacing — Wiktionary's REST 429s on rapid bursts
    const word = candidates[i];
    try {
      const data = await fetchJSON(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
      const en = data && data.en;
      if (!Array.isArray(en) || !en.length) continue;
      const block = en.find((b) => Array.isArray(b.definitions) && b.definitions.length) || en[0];
      const defs = (block.definitions || []).map((d) => stripHtml(d.definition)).filter(Boolean);
      if (!defs.length) continue;
      const pos = block.partOfSpeech || '';
      const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
      cards.push({
        id: `word:${hash(word)}`,
        type: 'word',
        title: word,
        summary: truncate(`${pos ? pos + ': ' : ''}${defs[0]}`, 300),
        body: defs.slice(0, 3).map((d, i2) => `${i2 + 1}. ${d}`).join('\n'),
        source: { name: 'Wiktionary', url, trustTier: 'encyclopedic' },
        tags: ['word', 'language', 'vocabulary', pos].filter(Boolean),
        lang: 'en',
        difficulty: 2,
        fetchedAt: nowIso(),
        hash: hash(word),
      });
    } catch {
      // missing entry / rate-limited beyond retries — just try the next word
    }
  }
  return cards;
}
