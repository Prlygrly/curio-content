import { fetchJSON, stripHtml, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// Wikipedia "On this day" selected events for today's date (type: history).
export const id = 'onthisday';

export async function run({ count = 3 } = {}) {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const d = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${mm}/${dd}`);
  const events = Array.isArray(d?.selected) ? d.selected : [];
  return pickRandom(events, count).map((ev) => {
    const page = (ev.pages && ev.pages[0]) || {};
    const url = page.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Wikipedia:Selected_anniversaries';
    const subject = page.normalizedtitle || page.title;
    const text = stripHtml(ev.text);
    return {
      id: `onthisday:${mm}-${dd}:${ev.year}:${hash(ev.text)}`,
      type: 'history',
      title: subject ? `${ev.year}: ${subject}` : `On this day, ${ev.year}`,
      summary: truncate(text, 320),
      body: text,
      image: page.thumbnail?.source
        ? { src: page.thumbnail.source, alt: subject || 'Historical event', credit: 'Wikipedia' }
        : undefined,
      source: { name: 'Wikipedia · On this day', url, trustTier: 'encyclopedic', date: `${mm}-${dd}` },
      tags: ['history', 'on this day', 'anniversary'],
      lang: 'en',
      difficulty: 2,
      fetchedAt: nowIso(),
      hash: hash(`${ev.year}:${ev.text}`),
      // "On this day" is date-pegged, so it goes stale fast — hide it after 3 days.
      expires: new Date(Date.now() + 3 * 86400000).toISOString(),
    };
  });
}
