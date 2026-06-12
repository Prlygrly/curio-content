import { rssCards } from '../lib/rss.js';

// Cooking & recipes (type: food) — image-led, evergreen.
// NOTE: Serious Eats hard-blocks automated fetches (403), so it's pulled in via a
// Kill-the-Newsletter email→RSS bridge instead; add that feed URL here once set up.
export const id = 'food';

const FEEDS = [
  { name: '101 Cookbooks', url: 'https://www.101cookbooks.com/feed', type: 'food', trustTier: 'community', tags: ['cooking', 'recipe', 'food'] },
  // { name: 'Serious Eats', url: 'https://kill-the-newsletter.com/feeds/XXXXXXXX.xml', type: 'food', trustTier: 'community', tags: ['cooking', 'food science', 'recipe'] },
];

export async function run({ count = 3 } = {}) {
  return rssCards(FEEDS, count);
}
