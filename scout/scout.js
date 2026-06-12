import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { loadCards, saveCards, mergeDedup } from './lib/store.js';
import { cacheImage } from './lib/images.js';

import * as wikipedia from './adapters/wikipedia.js';
import * as onthisday from './adapters/onthisday.js';
import * as apod from './adapters/apod.js';
import * as met from './adapters/met.js';
import * as poetry from './adapters/poetrydb.js';
import * as greek from './adapters/greek.js';
import * as article from './adapters/article.js';
import * as bookreview from './adapters/bookreview.js';
import * as quote from './adapters/quote.js';
import * as word from './adapters/word.js';
import * as craft from './adapters/craft.js';
import * as food from './adapters/food.js';
import * as comic from './adapters/comic.js';
import * as world from './adapters/world.js';
import * as gutenberg from './adapters/gutenberg.js';
import * as smithsonian from './adapters/smithsonian.js';
import * as trivia from './adapters/trivia.js';
import * as game from './adapters/game.js';
import * as chess from './adapters/chess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..'); // curio/
const cardsPath = path.join(root, 'data', 'cards.json');
const imagesDir = path.join(root, 'data', 'images');

const ADAPTERS = { wikipedia, onthisday, apod, met, smithsonian, poetry, greek, article, bookreview, quote, word, craft, food, comic, world, gutenberg, trivia, game, chess };

async function loadConfig() {
  return JSON.parse(await readFile(path.join(__dirname, 'config.json'), 'utf8'));
}

async function main() {
  const cfg = await loadConfig();
  const channels = cfg.channels || {};
  const collected = [];

  console.log('Scout: fetching channels…');
  for (const [name, mod] of Object.entries(ADAPTERS)) {
    const ch = channels[name];
    if (!ch || ch.enabled === false) continue;
    const opts = { count: ch.count ?? 3 };
    if (name === 'apod') opts.apiKey = process.env.NASA_API_KEY || cfg.nasaApiKey || 'DEMO_KEY';
    if (name === 'smithsonian') opts.apiKey = process.env.SMITHSONIAN_API_KEY || process.env.DATA_GOV_API_KEY || cfg.smithsonianApiKey || '';
    if (name === 'greek') opts.vocabPath = path.join(root, cfg.greekVocabPath || 'scout/seed/koine_chapter1_vocabulary.csv');
    try {
      const cards = await mod.run(opts);
      console.log(`  ${name}: ${cards.length} card(s)`);
      collected.push(...cards);
    } catch (e) {
      console.warn(`  ${name}: FAILED — ${e.message}`);
    }
  }

  // Enforce the citation rule: every card must carry a source URL.
  const valid = collected.filter((c) => c.source && /^https?:\/\//i.test(String(c.source.url || '')));
  if (valid.length !== collected.length) {
    console.warn(`  dropped ${collected.length - valid.length} card(s) with no source.url`);
  }

  // Normalize tags: drop empties and de-dupe so the taste engine sees clean dimensions.
  for (const c of valid) {
    if (Array.isArray(c.tags)) c.tags = [...new Set(c.tags.filter(Boolean))];
  }

  // Cache images locally so the app works fully offline. If caching fails
  // (network/too large), drop the image rather than leave a broken offline ref.
  let cached = 0;
  for (const c of valid) {
    if (c.image?.src && /^https?:\/\//.test(c.image.src)) {
      const local = await cacheImage(c.image.src, imagesDir);
      if (local) {
        c.image.src = local;
        cached++;
      } else {
        delete c.image;
      }
    }
  }

  const existing = await loadCards(cardsPath);
  const { cards, added } = mergeDedup(existing, valid);
  const saved = await saveCards(cardsPath, cards, cfg.poolSize || 300);

  console.log(`\nFetched ${valid.length} valid card(s); ${added} new; ${cached} image(s) cached.`);
  console.log(`Pool now holds ${saved.length} card(s).`);
  console.log(`Wrote ${path.relative(process.cwd(), cardsPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
