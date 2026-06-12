import { fetchJSON, truncate, nowIso, hash, pickRandom } from '../lib/util.js';

// A random "global fact" (type: world). The fact is templated from REST Countries' real
// structured fields (no prose is invented) and each card links to the country's Wikipedia
// article so every figure is one tap from verification. The flag is the image.
export const id = 'world';

const FIELDS = 'name,capital,region,subregion,population,languages,flags,maps,area,car';

// A few REST Countries common-names that don't resolve as a Wikipedia title verbatim.
const WIKI_ALIAS = {
  'DR Congo': 'Democratic Republic of the Congo',
  'Congo': 'Republic of the Congo',
};

function humanPop(n) {
  if (!n || n < 1) return null;
  if (n >= 1e9) return +(n / 1e9).toFixed(1) + ' billion';
  if (n >= 1e6) return +(n / 1e6).toFixed(n < 1e7 ? 1 : 0) + ' million';
  if (n >= 1e3) return Math.round(n / 1e3) + ' thousand';
  return String(n);
}

function fact(c) {
  const name = c.name && c.name.common;
  if (!name) return null;
  const cap = Array.isArray(c.capital) && c.capital[0];
  const where = c.subregion || c.region;
  const langs = c.languages ? Object.values(c.languages) : [];
  const pop = humanPop(c.population);
  const area = c.area ? Math.round(c.area).toLocaleString('en-US') : null;
  const side = c.car && c.car.side;

  const out = [where ? `${name} is a country in ${where}.` : `${name} is a country.`];
  if (cap && area) out.push(`Its capital is ${cap}, and it covers about ${area} km².`);
  else if (cap) out.push(`Its capital is ${cap}.`);
  else if (area) out.push(`It covers about ${area} km².`);
  if (pop) out.push(`About ${pop} people live there.`);
  if (langs[0]) out.push(`The main language is ${langs[0]}.`);
  if (side) out.push(`Cars drive on the ${side}.`);
  return out.join(' ');
}

export async function run({ count = 3 } = {}) {
  const list = await fetchJSON(`https://restcountries.com/v3.1/independent?status=true&fields=${FIELDS}`, { timeout: 20000 });
  const picks = pickRandom(Array.isArray(list) ? list : [], count * 3);
  const cards = [];
  for (const c of picks) {
    if (cards.length >= count) break;
    const summary = fact(c);
    if (!summary) continue;
    const name = c.name.common;
    const wikiTitle = WIKI_ALIAS[name] || name;
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/\s+/g, '_'))}`;
    const flag = c.flags && c.flags.png;
    const flagAlt = (c.flags && c.flags.alt) || `Flag of ${name}`;
    const tags = ['world', 'geography', (c.region || '').toLowerCase(), (c.subregion || '').toLowerCase()]
      .concat(c.languages ? Object.values(c.languages).slice(0, 1).map((l) => l.toLowerCase()) : [])
      .filter(Boolean);
    cards.push({
      id: `world:${name.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'world',
      title: name,
      summary: truncate(summary, 320),
      body: c.flags && c.flags.alt ? `${summary}\n\nThe flag: ${c.flags.alt}` : undefined,
      image: flag ? { src: flag, alt: flagAlt, credit: `Flag of ${name} · flagcdn.com` } : undefined,
      source: { name: 'Wikipedia', url, trustTier: 'encyclopedic' },
      attribution: { label: 'Country data · REST Countries', url: 'https://restcountries.com' },
      tags: [...new Set(tags)],
      lang: 'en',
      difficulty: 1,
      fetchedAt: nowIso(),
      hash: hash(`world:${name.toLowerCase()}`),
    });
  }
  return cards;
}
