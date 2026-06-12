import { rssCards } from '../lib/rss.js';

// Book reviews & literary criticism (type: book-review) from open syndication feeds.
export const id = 'bookreview';

const FEEDS = [
  { name: 'Los Angeles Review of Books', url: 'https://lareviewofbooks.org/feed/', type: 'book-review', trustTier: 'publication', tags: ['books', 'review', 'literature'] },
  { name: 'Public Books', url: 'https://www.publicbooks.org/feed/', type: 'book-review', trustTier: 'publication', tags: ['books', 'review', 'ideas'] },
];

export async function run({ count = 2 } = {}) {
  return rssCards(FEEDS, count);
}
