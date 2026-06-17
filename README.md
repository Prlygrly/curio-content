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

### Fields

| Field | Required | Notes |
|---|---|---|
| `slug` | recommended | Stable, unique; becomes the deep-link id `curated:<slug>`. Omit it and one is derived from the title, but set it explicitly so links don't shift. |
| `title` | **yes** | One line shown on the card face. |
| `summary` | **yes** | The short "hit" — one or two sentences. Long summaries get trimmed (~200 chars). |
| `body` | no | Longer prose shown when the card is opened. Use `\n` for line breaks. |
| `source.url` | **yes** | Must be `http(s)`. Sourceless cards are dropped — every card cites something real. |
| `source.name` | no | Publication or site name. Defaults to "Hand-picked". |
| `source.author` | no | Author/creator, if any. |
| `tags` | no | Topic tags. `hand-picked` is added automatically. |
| `difficulty` | no | 1–5; defaults to 2. |
| `draft` | no | `true` skips the entry (used by the template). Remove or set `false` to ship. |

### Example

```json
{
  "slug": "octopus-three-hearts",
  "title": "An octopus has three hearts",
  "summary": "Two pump blood through the gills; one drives it to the rest of the body — and that third heart stops whenever the octopus swims, which is part of why they'd rather crawl.",
  "body": "The systemic heart pauses during swimming, so jetting around is tiring. Crawling keeps the heart going steadily — a small reason octopuses often prefer the seafloor to open water.",
  "source": {
    "name": "Smithsonian Ocean",
    "url": "https://ocean.si.edu/ocean-life/invertebrates/octopus"
  },
  "tags": ["animals", "biology", "ocean"],
  "difficulty": 2
}
```
