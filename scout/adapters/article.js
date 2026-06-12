import { rssCards } from '../lib/rss.js';

// Essays & ideas (type: article) from real publications' syndication feeds.
// Excerpt + link only — the card sends you to the source to read in full.
export const id = 'article';

const FEEDS = [
  { name: 'Aeon', url: 'https://aeon.co/feed.rss', type: 'article', trustTier: 'publication', tags: ['essay', 'ideas', 'philosophy'] },
  { name: 'Quanta Magazine', url: 'https://api.quantamagazine.org/feed/', type: 'article', trustTier: 'publication', tags: ['science', 'ideas', 'mathematics'] },
  { name: 'The Public Domain Review', url: 'https://publicdomainreview.org/rss.xml', type: 'article', trustTier: 'publication', tags: ['essay', 'history', 'culture'] },
  { name: 'Marginal Revolution', url: 'https://marginalrevolution.com/feed', type: 'article', trustTier: 'community', tags: ['economics', 'ideas', 'blog'] },
  { name: 'Imprimis', url: 'https://imprimis.hillsdale.edu/feed/', type: 'article', trustTier: 'publication', tags: ['ideas', 'liberty', 'lecture'] },
  { name: 'Arts & Letters Daily', url: 'https://www.aldaily.com/feed/', type: 'article', trustTier: 'publication', tags: ['essay', 'ideas', 'criticism'] },
  { name: 'Atlas Obscura', url: 'https://www.atlasobscura.com/feeds/latest', type: 'article', trustTier: 'publication', tags: ['curiosities', 'places', 'history'] },
  { name: 'Sententiae Antiquae', url: 'https://sententiaeantiquae.com/feed/', type: 'article', trustTier: 'community', tags: ['classics', 'greek', 'antiquity'] },
  // Time-pegged sources carry a ttlDays so stale items age out (see rss.js / isVisible).
  { name: 'ProPublica', url: 'https://www.propublica.org/feeds/propublica/main', type: 'article', trustTier: 'publication', tags: ['investigative', 'news', 'accountability'], ttlDays: 90 },
  { name: 'The Free Press', url: 'https://www.thefp.com/feed', type: 'article', trustTier: 'publication', tags: ['news', 'culture', 'opinion'], ttlDays: 30 },
  // Added 2026-06: ideas / essays / classics / a little programming (all verified live).
  { name: 'The Marginalian', url: 'https://www.themarginalian.org/feed/', type: 'article', trustTier: 'publication', tags: ['ideas', 'literature', 'art', 'philosophy'] },
  { name: 'Antigone Journal', url: 'https://antigonejournal.com/feed/', type: 'article', trustTier: 'publication', tags: ['classics', 'greek', 'antiquity', 'history'] },
  { name: 'Nautilus', url: 'https://nautil.us/feed/', type: 'article', trustTier: 'publication', tags: ['science', 'ideas', 'nature'] },
  { name: 'Farnam Street', url: 'https://fs.blog/feed/', type: 'article', trustTier: 'community', tags: ['ideas', 'psychology', 'decision-making'] },
  { name: 'Scott H. Young', url: 'https://www.scotthyoung.com/blog/feed/', type: 'article', trustTier: 'community', tags: ['learning', 'productivity', 'ideas'] },
  { name: 'Kottke', url: 'https://feeds.kottke.org/main', type: 'article', trustTier: 'community', tags: ['curiosities', 'culture', 'design'] },
  { name: 'Julia Evans', url: 'https://jvns.ca/atom.xml', type: 'article', trustTier: 'community', tags: ['programming', 'computers', 'technology'] },
  { name: "Lapham's Quarterly", url: 'https://www.laphamsquarterly.org/rss.xml', type: 'article', trustTier: 'publication', tags: ['history', 'culture', 'literature'] },
  { name: 'Barking Up the Wrong Tree', url: 'https://bakadesuyo.com/feed/', type: 'article', trustTier: 'community', tags: ['psychology', 'self-improvement', 'science'] },
  // Added 2026-06-11 (all probed live). NB: All About Birds 403s bots; BMCR's feed is
  // currently empty server-side — both declined for now.
  { name: 'Damn Interesting', url: 'https://www.damninteresting.com/feed/', type: 'article', trustTier: 'publication', tags: ['curiosities', 'history', 'science'] },
  { name: 'Now I Know', url: 'https://nowiknow.com/feed/', type: 'article', trustTier: 'community', tags: ['trivia', 'curiosities'] },
  { name: 'Language Log', url: 'https://languagelog.ldc.upenn.edu/nll/?feed=rss2', type: 'article', trustTier: 'community', tags: ['linguistics', 'language'] },
  { name: 'Low-Tech Magazine', url: 'https://solar.lowtechmagazine.com/posts/index.xml', type: 'article', trustTier: 'publication', tags: ['technology', 'sustainability', 'history'] },
  { name: 'The Current (Criterion)', url: 'https://www.criterion.com/feeds/current', type: 'article', trustTier: 'publication', tags: ['film', 'essay', 'criticism'] },
];

export async function run({ count = 4 } = {}) {
  return rssCards(FEEDS, count);
}
