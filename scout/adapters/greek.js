import { readFile } from 'node:fs/promises';
import { nowIso, hash, pickRandom, truncate } from '../lib/util.js';

// Ancient Greek vocabulary cards (type: greek), sourced from the user's OWN
// Logos Ch.1 vocabulary list (real, curated data — never AI-generated).
// Each card links to the real Wiktionary "Ancient Greek" entry to go deeper.
export const id = 'greek';

// Minimal CSV parser handling quoted fields, embedded commas, and "" escapes.
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQ = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i++;
      continue;
    }
    if (c === ',') {
      pushField();
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      pushField();
      pushRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    pushField();
    pushRow();
  }
  return rows.filter((r) => r.some((x) => x.trim().length));
}

// First headword before a comma/slash/space (e.g. "ἀγαθός, -ή, -όν" -> "ἀγαθός").
function lemma(greek) {
  return String(greek)
    .split(/[,/]/)[0]
    .trim()
    .split(/\s+/)[0]
    .trim();
}

export async function run({ count = 6, vocabPath } = {}) {
  if (!vocabPath) return [];
  let text;
  try {
    text = await readFile(vocabPath, 'utf8');
  } catch {
    return [];
  }
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const gi = col('greek');
  const ei = col('english');
  const pi = col('part_of_speech');
  const ci = col('category');
  const ni = col('notes');

  const entries = rows
    .slice(1)
    .map((r) => ({
      greek: (r[gi] || '').trim(),
      english: (r[ei] || '').trim(),
      pos: (r[pi] || '').trim(),
      cat: (r[ci] || '').trim(),
      notes: (r[ni] || '').trim(),
    }))
    .filter((e) => e.greek && e.english);

  return pickRandom(entries, count).map((e) => {
    const lem = lemma(e.greek);
    const wiktionary = `https://en.wiktionary.org/wiki/${encodeURIComponent(lem)}#Ancient_Greek`;
    const summary = `${e.greek} — “${e.english}”${e.pos ? ` · ${e.pos}` : ''}`;
    const body = [
      e.notes ? `Note: ${e.notes}` : null,
      'From your Logos Ch.1 vocabulary. Open the source to see the full Wiktionary entry.',
    ]
      .filter(Boolean)
      .join('\n');
    const isFunction = e.cat.includes('function');
    return {
      id: `greek:${hash(`${e.greek}|${e.english}`)}`,
      type: 'greek',
      title: lem,
      summary: truncate(summary, 200),
      body,
      source: { name: 'Logos Ch.1 · Wiktionary', url: wiktionary, trustTier: 'encyclopedic' },
      tags: ['ancient greek', 'koine', 'vocabulary', e.pos, e.cat].filter(Boolean),
      lang: 'grc',
      difficulty: isFunction ? 1 : 2,
      fetchedAt: nowIso(),
      hash: hash(`${e.greek}|${e.english}`),
    };
  });
}
