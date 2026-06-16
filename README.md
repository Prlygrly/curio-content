# curio-content

Content pool for the [Curio](https://prlygrlys-curio.netlify.app) app — the curiosity cards
(`data/cards.json`) and their cached images (`data/images/`).

This repo is **public on purpose**: the Curio app fetches it directly from the
[jsDelivr](https://www.jsdelivr.com/) CDN, so updating content here costs **no Netlify deploy**.

- **Live URL the app reads:** `https://cdn.jsdelivr.net/gh/Prlygrly/curio-content@main/data/cards.json`
- Updated automatically by the **Scout** (a scheduled GitHub Action — see `.github/workflows/`).
- Don't put anything private here.

## Hand-picked cards

Most cards are crawled from APIs by the Scout. **Hand-picked cards are the exception** — real,
human-curated curiosities you write yourself (never AI-generated), authored in
[`scout/curated/cards.json`](scout/curated/cards.json). They form Curio's permanent collection:
unlike feed cards they are **pinned in the pool and never rotate out**, so their deep links stay
valid indefinitely.

To add one:

1. Copy the `draft: true` template entry in `scout/curated/cards.json` and fill it in. Only
   `title`, `summary`, and `source.url` are required. Give it a **stable, unique `slug`** — it
   becomes the deep-link id `curated:<slug>`, so changing it later breaks any shared link.
2. Remove `draft` (or set it `false`). Draft/template entries are skipped, so the template stays
   put as living documentation.
3. Commit + push. The next daily Scout run merges it into the pool — **no Netlify deploy**. (To
   preview locally first, run the Scout from this repo.)

In the app these show up as the **Hand-picked** channel (its own Settings toggle), labelled
`☞ Hand-picked`, and "why am I seeing this?" says *"Hand-picked for the cabinet — not from a feed."*
