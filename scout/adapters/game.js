import { rssCards } from '../lib/rss.js';

// Games writing (type: game) — tabletop reviews and how-games-get-made design pieces.
// Excerpt + link only, like every RSS channel.
export const id = 'game';

const FEEDS = [
  { name: 'Shut Up & Sit Down', url: 'https://www.shutupandsitdown.com/feed/', type: 'game', trustTier: 'publication', tags: ['board games', 'games', 'review'] },
  // Industry coverage dates quickly — let news items age out between Scout runs.
  { name: 'Game Developer', url: 'https://www.gamedeveloper.com/rss.xml', type: 'game', trustTier: 'publication', tags: ['game design', 'games', 'industry'], ttlDays: 90 },
];

export async function run({ count = 3 } = {}) {
  return rssCards(FEEDS, count);
}
