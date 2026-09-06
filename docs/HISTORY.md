# Project history & decisions

A running record of why the site is built the way it is. Newest entry first.

---

## 2026-09-06 — Move off hand-edited `.txt` files to a CMS + Eleventy build

### The problem

The site was static HTML on Cloudflare Pages. Five `content/*.txt` files were
loaded into `<pre>` blocks by jQuery (`$("#program").load(...)`). Non-technical
ward members (Ryan Cottam, Jon Hindes, and others — 400+ commits to
`program.txt` alone) edited those raw text files through GitHub's web editor.

Pain points:

1. **`<pre>` is whitespace-literal.** Column alignment done with spaces broke on
   phones; URLs showed as raw text ("copy and paste to your browser"); no bold,
   headings, or lists. `autolink-min.js` existed to fix links but was never
   wired in (commented out in `index.html`).
2. **Editors had to understand Git** — commits, branches, the edit→commit→deploy
   loop.
3. **`program.txt` is really a form**, retyped freehand every week, so
   formatting drifted.
4. **No preview** before publishing.
5. **Printing `print.html`** relied on a live-browser print with a `setTimeout`;
   scaling / margins / page count varied by machine, and editors couldn't
   remember the printer settings.

### Options considered

**Editing interface**

| Option | Verdict |
| --- | --- |
| Keep `.txt`, add `marked.js` client-side | Quick fix for `<pre>`, but doesn't solve the Git barrier or program drift |
| Google Docs / Sheets as source | Editors never touch Git, but weak styling control and another moving part |
| **Pages CMS** (hosted) | Friendliest, no Worker needed; hosted component outside our control |
| **Sveltia CMS** | Modern Decap replacement; needs a small OAuth Worker — trivial on Cloudflare. **Chosen.** |
| Decap CMS | Most established; heavier, same Worker need |
| TinaCMS | Visual on-page editing but needs Tina Cloud / self-host — too heavy |

**Build / hosting**

- Host stays **Cloudflare Pages, connected directly to the GitHub repo**
  (confirmed with the user). That gives a free build pipeline that was sitting
  unused. No GitHub Actions needed.
- Static site generator: **Eleventy** (over Jekyll) — Node toolchain matches the
  CMS and the PDF step; simple data-file model for the structured program.

**Printed bulletin**

The user's hard requirement: a printed **half-fold booklet on one double-sided
sheet** containing the sacrament meeting program and announcements, with
**two-column announcements**, and **no fiddly printer settings** — "flat if a
booklet can't be done cleanly."

- Rejected: live-browser print of an HTML page (the existing pain).
- Rejected: relying on the browser to impose a booklet.
- **Chosen:** generate the PDF at build time with headless Chrome, then impose
  it 2-up onto two landscape Letter sheets with `pdf-lib`. The person opens a
  fixed PDF that looks identical every week.
- Duplex can't be forced from a PDF/page, so **one first-time setting remains**
  ("print on both sides", plus "flip on short edge" if offered). Browsers
  remember it per site, so it's Ctrl/Cmd-P → Print thereafter. A printed
  instruction card (in `ROLLOUT.md`) covers the first time.
- `bulletin-flat.pdf` is generated too — a plain 2-page version, double-sided,
  no folding — as the escape hatch.

The user accepted the PDF-in-the-build approach and the one-time duplex setting.

### What was built (branch `cms-and-print-rebuild`)

- Eleventy build: `src/` → `_site/`, `npm run build` = site + PDFs.
- `src/_data/program.json` — structured program, rendered by
  `src/_includes/macros.njk` (shared by web, booklet, and flat PDF so they never
  drift).
- `src/content/*.md` — announcements / thought / schedule as Markdown; bare URLs
  auto-link via `markdown-it-link-attributes`.
- `src/_data/site.json`, `src/_data/missionaries.json`.
- Sveltia CMS at `/admin` (`admin/index.html`, `admin/config.yml`) — a labeled
  form per section.
- `scripts/build-pdf.mjs` — headless Chrome (via `puppeteer`) + `pdf-lib`:
  - `bulletin.pdf` — half-fold booklet, imposed 2-up, 2-column announcements,
    thought on the back cover.
  - `bulletin-flat.pdf` — plain 2-page fallback.
  - Non-fatal on failure so the site still deploys.
- `src/_redirects` (`/submit`, `/print`), `src/_headers` (noindex `/admin`,
  no-cache the PDFs).
- Old `index.html`, `print.html`, `content/*.txt`, `autolink-min.js` removed;
  images/assets moved under `src/`.
- `docs/ROLLOUT.md` — one-time setup, `README.md` — editor + dev guide.

### Open items / caveats

- **Chromium on the Cloudflare build image** is the one unverified piece.
  `puppeteer` downloads Chromium during `npm install`; this usually works on CF
  Pages. If the branch build fails on it, `ROLLOUT.md` has the
  `@sparticuz/chromium` fallback.
- Booklet back cover has generous whitespace on fast Sundays (short program) —
  by design, easy to change.
- Long announcements: if they run past one booklet panel the imposition warns
  and clips. Future option: a "print / web-only" toggle per announcement in the
  CMS.
- Steps needing the user's dashboard access, not yet done: CF Pages build
  command (`npm run build`, output `_site`); `sveltia-cms-auth` Worker + GitHub
  OAuth app; adding editors as repo collaborators.
- Branch not yet pushed or merged. Nothing on production changed.

### Local dev note

The dev machine has Node 18 but no npm/npx. A standalone Node 20 was used for
this session's builds. `.node-version` pins 20 for Cloudflare.
