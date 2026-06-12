import { rssCards } from '../lib/rss.js';

// Making, design & craft (type: craft) — often image-led, good for a visual hit.
export const id = 'craft';

const FEEDS = [
  { name: 'Make:', url: 'https://makezine.com/feed/', type: 'craft', trustTier: 'publication', tags: ['making', 'diy', 'craft'] },
  { name: 'Colossal', url: 'https://www.thisiscolossal.com/feed/', type: 'craft', trustTier: 'publication', tags: ['art', 'design', 'craft'], strip: [/\b(?:do stories and artists like this matter|become a colossal member)[\s\S]*$/i] },
];

export async function run({ count = 3 } = {}) {
  return rssCards(FEEDS, count);
}
