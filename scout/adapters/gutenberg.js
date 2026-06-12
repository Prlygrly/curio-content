import { fetchText, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// Short openings of public-domain classics (type: passage). At run time we fetch the real
// Project Gutenberg plain text, strip PG's license wrapper + front matter, and excerpt the
// first lines of the actual narrative — anchored on the known opening so we never show a
// title page. Nothing is authored or paraphrased: it's the author's own words, truncated,
// linking back to the full free book. (The works are public domain; we keep only an excerpt.)
export const id = 'gutenberg';

const SHELF = [
  { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, anchor: 'It is a truth universally acknowledged', tags: ['novel', 'romance', 'regency'] },
  { id: 2701, title: 'Moby-Dick', author: 'Herman Melville', year: 1851, anchor: 'Call me Ishmael', tags: ['novel', 'sea', 'adventure'] },
  { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', year: 1859, anchor: 'It was the best of times', tags: ['novel', 'history', 'revolution'] },
  { id: 84, title: 'Frankenstein', author: 'Mary Shelley', year: 1818, anchor: 'You will rejoice to hear that no disaster', tags: ['novel', 'gothic', 'science'] },
  { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892, anchor: 'To Sherlock Holmes she is always', tags: ['mystery', 'detective', 'short-stories'] },
  { id: 11, title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865, anchor: 'Alice was beginning to get very tired', tags: ['fantasy', 'childrens', 'classic'] },
  { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1890, anchor: 'The studio was filled with the rich odour of roses', tags: ['novel', 'gothic', 'aesthetics'] },
  { id: 1260, title: 'Jane Eyre', author: 'Charlotte Brontë', year: 1847, anchor: 'There was no possibility of taking a walk that day', tags: ['novel', 'romance', 'gothic'] },
  { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', year: 1883, anchor: 'Squire Trelawney, Dr. Livesey', tags: ['adventure', 'pirates', 'sea'] },
  { id: 55, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', year: 1900, anchor: 'Dorothy lived in the midst of the great Kansas prairies', tags: ['fantasy', 'childrens', 'adventure'] },
  { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', year: 1861, anchor: "My father's family name being Pirrip", tags: ['novel', 'coming-of-age'] },
  { id: 35, title: 'The Time Machine', author: 'H. G. Wells', year: 1895, anchor: 'The Time Traveller (for so it will be convenient', tags: ['science-fiction', 'novel'] },
  { id: 43, title: 'The Strange Case of Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson', year: 1886, anchor: 'Mr. Utterson the lawyer was a man of a rugged countenance', tags: ['novel', 'gothic', 'mystery'] },
  { id: 1232, title: 'The Prince', author: 'Niccolò Machiavelli', year: 1532, anchor: 'All states, all powers, that have held and hold rule over men', tags: ['philosophy', 'politics', 'history'] },
];

// Build a whitespace- and quote-tolerant matcher for an anchor phrase (Gutenberg texts
// wrap lines and use curly apostrophes/quotes).
function anchorRe(anchor) {
  const flex = anchor
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+')
    .replace(/'/g, "['‘’]")
    .replace(/"/g, '["“”]');
  return new RegExp(flex, 'i');
}

function excerpt(text, anchor) {
  const s = text.indexOf('*** START OF');
  const e = text.indexOf('*** END OF');
  let body = text.slice(s >= 0 ? text.indexOf('\n', s) + 1 : 0, e >= 0 ? e : undefined);
  let from = 0;
  if (anchor) {
    const m = body.match(anchorRe(anchor));
    if (m) from = m.index;
    else return ''; // anchor missed — better to skip than serve a title page
  }
  return body.slice(from)
    .replace(/\[Illustration[\s\S]*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function run({ count = 3 } = {}) {
  const picks = pickRandom(SHELF, Math.min(count + 2, SHELF.length));
  const cards = [];
  for (const b of picks) {
    if (cards.length >= count) break;
    try {
      const txt = await fetchText(`https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`, { timeout: 25000 });
      const passage = excerpt(txt, b.anchor);
      if (!passage || passage.length < 120) continue;
      cards.push({
        id: `passage:gutenberg:${b.id}`,
        type: 'passage',
        title: b.title,
        summary: truncate(passage, 360),
        body: truncate(passage, 700),
        source: { name: 'Project Gutenberg', url: `https://www.gutenberg.org/ebooks/${b.id}`, trustTier: 'publication', author: b.author, date: String(b.year) },
        tags: ['classic', 'literature', ...(b.tags || [])],
        lang: 'en',
        difficulty: 2,
        fetchedAt: nowIso(),
        hash: hash(`passage:gutenberg:${b.id}`),
      });
    } catch { /* fetch error — skip this book this run */ }
  }
  return cards;
}
