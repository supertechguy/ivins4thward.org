# Rollout — one-time setup

The branch `cms-and-print-rebuild` converts the site from hand-edited `.txt`
files to an Eleventy build with a CMS and generated print PDFs. Nothing on the
live site changes until the branch is merged. Steps 1, 2, 4 and 7 are done in
code; steps 3, 5 and 6 need dashboard access and are below.

---

## Step 3 — point Cloudflare Pages at the build

Cloudflare dashboard → **Workers & Pages → ivins4thward.org → Settings → Build**:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `_site` |
| Root directory | *(leave blank)* |

Node version comes from the committed `.node-version` file (20). Save, then
**Deployments → retry** the latest branch deploy, or push a commit.

The branch gets its own preview URL (`cms-and-print-rebuild.ivins4thward-org.pages.dev`)
— check that before merging.

### Chromium note

`npm run build` renders the bulletin PDFs with headless Chrome (via `puppeteer`,
downloaded during `npm install`). If a build log shows a Chromium launch failure:

1. First try: add an environment variable `PUPPETEER_CACHE_DIR = /opt/buildhome/repo/.puppeteer`
   so the download is cached between builds, and add `.puppeteer/` to `.gitignore`.
2. If Chrome still won't launch on the build image, switch `scripts/build-pdf.mjs`
   to `puppeteer-core` + `@sparticuz/chromium` (a self-contained Chromium build
   for restricted environments) — ~15 lines changed.

PDF failure is non-fatal: the site still deploys, only `/bulletin.pdf` and
`/bulletin-flat.pdf` are missing until fixed.

---

## Step 5 — GitHub login for the CMS (sveltia-cms-auth Worker)

Sveltia CMS commits as the editor's own GitHub account. That needs a tiny OAuth
broker. Deploy Sveltia's ready-made one as a Cloudflare Worker (free tier):

1. **Create a GitHub OAuth app** — GitHub → Settings → Developer settings →
   OAuth Apps → New:
   - Application name: `Ivins 4th Ward CMS`
   - Homepage URL: `https://www.ivins4thward.org`
   - Authorization callback URL: `https://ivins4thward-cms-auth.<your-workers-subdomain>.workers.dev/callback`
     *(fill in after the Worker is deployed, then edit this back)*
   - Note the **Client ID** and generate a **Client secret**.

2. **Deploy the Worker** — clone `https://github.com/sveltia/sveltia-cms-auth`,
   then in that repo:
   ```
   npx wrangler deploy
   npx wrangler secret put GITHUB_CLIENT_ID       # paste Client ID
   npx wrangler secret put GITHUB_CLIENT_SECRET   # paste Client secret
   npx wrangler secret put ALLOWED_DOMAINS        # www.ivins4thward.org,*.ivins4thward-org.pages.dev
   ```
   Wrangler prints the Worker URL. Put it (and `/callback`) back into the GitHub
   OAuth app from step 1.

3. **Wire it into the CMS** — in `admin/config.yml`, set:
   ```yaml
   backend:
     base_url: https://ivins4thward-cms-auth.<your-workers-subdomain>.workers.dev
   ```
   Commit that change.

4. Visit `https://www.ivins4thward.org/admin` and confirm the GitHub login works.

---

## Step 6 — give editors access

Each editor needs **write access to the `supertechguy/ivins4thward.org` repo**
(GitHub → repo → Settings → Collaborators → Add people). That's the only
permission the CMS checks.

Optional extra gate: Cloudflare **Zero Trust → Access → Applications**, add an
application for `www.ivins4thward.org/admin/*` with an email-list policy (free up
to 50 users). Editors then also sign in with email before the CMS loads.

Send editors:
- the `/admin` link
- the "For content editors" section of `README.md`
- the printer instruction card below

---

## Printer instruction card

Print this small and tape it by the printer.

```
┌─────────────────────────────────────────────┐
│  IVINS 4TH WARD — SUNDAY BULLETIN            │
│                                             │
│  1. Open  ivins4thward.org/bulletin.pdf      │
│  2. Print. In the print box, set:            │
│       • Paper size: Letter                   │
│       • Orientation: Landscape               │
│       • Print on both sides: YES             │
│       • Flip on: SHORT EDGE                  │
│  3. Fold each sheet in half.                 │
│                                             │
│  The computer remembers this. Next week it   │
│  is just  Ctrl+P  →  Print.                  │
│                                             │
│  Folding looks wrong? Use                    │
│  ivins4thward.org/bulletin-flat.pdf instead  │
│  (2 pages, double-sided, no folding).        │
└─────────────────────────────────────────────┘
```

---

## Merge

Once the preview deploy looks right and steps 3 & 5 are done on a branch-safe
basis, merge `cms-and-print-rebuild` to `main`. First production build takes
~1–2 minutes. Delete the old bookmark to editing `.txt` files on GitHub.
