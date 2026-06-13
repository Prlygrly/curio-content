import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './lib/store.js';
import { findTextIssues } from './lib/util.js';

// Pre-push / monthly pass: scan the whole card pool for text that didn't decode
// cleanly upstream (U+FFFD or mojibake) and print each offender so it can be
// hand-fixed. Reports only — never edits cards. Run with: npm run audit
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsPath = path.join(__dirname, '..', 'data', 'cards.json');

const cards = await loadCards(cardsPath);
let flagged = 0;

for (const c of cards) {
  const issues = findTextIssues(c);
  if (!issues.length) continue;
  flagged++;
  console.log(`\n  ${c.id}  —  ${c.title || '(no title)'}`);
  for (const { field, snippet } of issues) {
    console.log(`    ${field}: …${snippet}…`);
  }
}

console.log(`\n${flagged} of ${cards.length} card(s) flagged for text issues.`);
if (flagged) {
  console.log('These cards still ship; edit data/cards.json by hand before pushing.');
}
