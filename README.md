# ivins4thward.org

Ward bulletin site for the Ivins 4th Ward. Static site built with
[Eleventy](https://www.11ty.dev/), edited through [Sveltia CMS](https://github.com/sveltia/sveltia-cms),
hosted on Cloudflare Pages.

## For content editors

Go to **https://www.ivins4thward.org/admin**, sign in with GitHub, edit, and
click **Save**. The site rebuilds itself in about a minute. You never touch code.

What you can edit:

| Section in the CMS | What it controls |
| --- | --- |
| Sunday Program | The sacrament meeting program — a form, one field per line |
| Bulletin Text → Announcements | Announcements (website + printed bulletin) |
| Bulletin Text → Thought / Meeting Schedule | Those two sections |
| Missionaries | The current-missionaries list |
| Site Settings | Address, meeting time, contact info |

## Printing the Sunday bulletin

Open **https://www.ivins4thward.org/bulletin.pdf** and print it:

- **Paper:** Letter, **landscape** (the PDF is already landscape — the print
  dialog should pick this automatically).
- **Both sides:** on. Set **"Flip on short edge"** if the dialog offers a choice.
- Fold the sheet in half. Done.

Your browser remembers these settings, so after the first time it's just
Ctrl/Cmd-P → Print.

Trouble folding or with the printer? Use the plain two-page version:
**https://www.ivins4thward.org/bulletin-flat.pdf** (program on page 1,
announcements on page 2, print double-sided).

## For developers

```
npm install
npm run dev      # local preview at http://localhost:8080
npm run build    # full build -> _site/ (site + bulletin PDFs)
```

- `src/` — site source (Eleventy input)
  - `_data/program.json` — structured program (also editable in the CMS)
  - `_data/site.json`, `_data/missionaries.json`
  - `content/*.md` — free-text sections
  - `_includes/macros.njk` — shared program / missionaries rendering
  - `bulletin.njk` — the half-fold booklet (source for `bulletin.pdf`)
  - `bulletin-flat.njk` — the plain fallback (source for `bulletin-flat.pdf`)
- `scripts/build-pdf.mjs` — renders the two PDFs with headless Chrome + pdf-lib
- `admin/` — Sveltia CMS

See [`docs/ROLLOUT.md`](docs/ROLLOUT.md) for one-time setup on Cloudflare and GitHub, and [`docs/HISTORY.md`](docs/HISTORY.md) for why the site is built this way.
