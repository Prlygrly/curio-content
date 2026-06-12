import { fetchJSON, stripHtml, truncate, nowIso, hash } from '../lib/util.js';

// NASA Astronomy Picture of the Day (type: space). Image-led.
// DEMO_KEY works for low volume; set a free key in config for more headroom.
export const id = 'apod';

export async function run({ count = 2, apiKey = 'DEMO_KEY' } = {}) {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&count=${count}&thumbs=true`;
  // APOD's random-image endpoint can be slow; give it extra time.
  let data = await fetchJSON(url, { timeout: 30000 });
  if (!Array.isArray(data)) data = [data];
  const cards = [];
  for (const d of data) {
    // APOD entries can be videos; only keep ones we can show an image for.
    const img = d.media_type === 'image' ? d.url : d.thumbnail_url;
    if (!img) continue;
    const ymd = (d.date || '').replaceAll('-', '').slice(2); // YYMMDD
    const permalink = ymd ? `https://apod.nasa.gov/apod/ap${ymd}.html` : 'https://apod.nasa.gov/apod/astropix.html';
    const explanation = stripHtml(d.explanation);
    cards.push({
      id: `apod:${d.date}`,
      type: 'space',
      title: d.title,
      summary: truncate(explanation, 320),
      body: explanation,
      image: { src: img, alt: d.title, credit: d.copyright ? `© ${stripHtml(d.copyright)}` : 'NASA APOD (public domain)' },
      source: { name: 'NASA Astronomy Picture of the Day', url: permalink, trustTier: 'encyclopedic', date: d.date },
      tags: ['space', 'astronomy', 'science'],
      lang: 'en',
      difficulty: 2,
      fetchedAt: nowIso(),
      hash: hash(`apod:${d.date}`),
    });
  }
  return cards;
}
