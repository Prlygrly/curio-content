import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function loadCards(cardsPath) {
  try {
    const data = JSON.parse(await readFile(cardsPath, 'utf8'));
    return Array.isArray(data.cards) ? data.cards : [];
  } catch {
    return [];
  }
}

// Add only cards whose id isn't already present (de-dup).
export function mergeDedup(existing, incoming) {
  const byId = new Map(existing.map((c) => [c.id, c]));
  let added = 0;
  for (const c of incoming) {
    if (!byId.has(c.id)) {
      byId.set(c.id, c);
      added++;
    }
  }
  return { cards: [...byId.values()], added };
}

// Newest first, capped to poolSize.
export async function saveCards(cardsPath, cards, poolSize) {
  const sorted = [...cards].sort((a, b) => String(b.fetchedAt).localeCompare(String(a.fetchedAt)));
  const capped = sorted.slice(0, poolSize);
  await mkdir(path.dirname(cardsPath), { recursive: true });
  const out = { generatedAt: new Date().toISOString(), count: capped.length, cards: capped };
  await writeFile(cardsPath, JSON.stringify(out, null, 2), 'utf8');
  return capped;
}
