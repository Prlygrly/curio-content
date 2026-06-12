import { fetchJSON, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// General-knowledge trivia (type: trivia) from the Open Trivia Database — community-
// written questions, CC BY-SA 4.0. The question sits on the card; the answer hides
// behind "Go deeper". Requested base64-encoded so we decode bytes, not HTML entities.
// NB: OTDB has no canonical per-question page, so cards cite the database itself.
export const id = 'trivia';

const API = 'https://opentdb.com/api.php';

const dec = (s) => Buffer.from(String(s || ''), 'base64').toString('utf8');
// "Entertainment: Japanese Anime & Manga" → "japanese anime & manga"
const catTag = (c) => String(c || '').replace(/^[^:]+:\s*/, '').toLowerCase().trim();
const DIFF = { easy: 2, medium: 3, hard: 4 };

export async function run({ count = 4 } = {}) {
  let data;
  try {
    const amount = Math.max(5, Math.min(20, count * 2));
    data = await fetchJSON(`${API}?amount=${amount}&encode=base64`);
  } catch {
    return []; // service down → channel yields nothing this run, never fatal
  }
  if (!data || data.response_code !== 0 || !Array.isArray(data.results)) return [];

  const cards = [];
  for (const q of data.results) {
    const question = dec(q.question).trim();
    const correct = dec(q.correct_answer).trim();
    if (!question || !correct) continue;
    const kind = dec(q.type); // "multiple" | "boolean"
    const options = kind === 'multiple'
      ? pickRandom([correct, ...(q.incorrect_answers || []).map(dec)])
      : null;
    const difficulty = dec(q.difficulty);
    const tag = catTag(dec(q.category));
    cards.push({
      id: `trivia:${hash(question)}`,
      type: 'trivia',
      title: truncate(question, 160),
      summary: options ? truncate(`Is it: ${options.join(' · ')}?`, 300) : 'True — or false?',
      body: `Answer: ${correct}.`,
      source: { name: 'Open Trivia Database', url: 'https://opentdb.com/', trustTier: 'community' },
      tags: ['trivia', ...(tag && tag.length <= 28 ? [tag] : [])],
      lang: 'en',
      difficulty: DIFF[difficulty] || 3,
      fetchedAt: nowIso(),
      hash: hash(question),
    });
  }
  return pickRandom(cards, count);
}
