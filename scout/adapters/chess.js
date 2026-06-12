import { fetchJSON, nowIso, hash } from '../lib/util.js';

// Lichess's daily puzzle (type: chess) — real positions from real games, CC0.
// The API hands us the FEN directly, so the Cabinet renders the board itself
// (no engine, no embed); the solution hides behind "Go deeper", and the card
// cites the puzzle's own lichess page, where you can play it out interactively.
export const id = 'chess';

// "e7e8q" → "e7→e8=Q" (UCI from→to; promotions get the piece letter)
const pretty = (m) => `${m.slice(0, 2)}→${m.slice(2, 4)}${m[4] ? '=' + m[4].toUpperCase() : ''}`;

export async function run({ count = 1 } = {}) {
  let d;
  try {
    d = await fetchJSON('https://lichess.org/api/puzzle/daily');
  } catch {
    return []; // service down → nothing this run, never fatal
  }
  const p = d && d.puzzle;
  if (!p || !p.id || !p.fen) return [];
  const turn = String(p.fen).split(' ')[1] === 'b' ? 'Black' : 'White';
  const rating = Number(p.rating) || 0;
  const solution = (p.solution || []).map(pretty);
  return [{
    id: `chess:${p.id}`,
    type: 'chess',
    title: `${turn} to move`,
    summary: `Today’s puzzle from Lichess — rating ≈ ${rating}. Find the best line for ${turn.toLowerCase()}.`,
    body: solution.length
      ? `Solution, from → to: ${solution.join(', ')}. Play it out move by move at the source link.`
      : undefined,
    chess: { fen: p.fen, ...(p.lastMove ? { lastMove: p.lastMove } : {}) },
    source: {
      name: 'Lichess',
      url: `https://lichess.org/training/${p.id}`,
      trustTier: 'community',
      date: new Date().toUTCString().slice(0, 16),
    },
    tags: ['chess', 'puzzle', ...(p.themes || []).slice(0, 4).map((t) => String(t).toLowerCase())],
    lang: 'en',
    difficulty: rating < 1300 ? 2 : rating < 1800 ? 3 : rating < 2200 ? 4 : 5,
    fetchedAt: nowIso(),
    hash: hash(p.id),
  }].slice(0, count);
}
