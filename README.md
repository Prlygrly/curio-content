# curio-content

Content pool for the [Curio](https://prlygrlys-curio.netlify.app) app — the curiosity cards
(`data/cards.json`) and their cached images (`data/images/`).

This repo is **public on purpose**: the Curio app fetches it directly from the
[jsDelivr](https://www.jsdelivr.com/) CDN, so updating content here costs **no Netlify deploy**.

- **Live URL the app reads:** `https://cdn.jsdelivr.net/gh/Prlygrly/curio-content@main/data/cards.json`
- Updated automatically by the **Scout** (a scheduled GitHub Action — see `.github/workflows/`).
- Don't put anything private here.
