/**
 * Builds the printable bulletin PDFs from the HTML Eleventy rendered into
 * _site/. Run after `eleventy`.
 *
 *   _site/bulletin.pdf       Half-fold booklet: imposed 2-up onto two landscape
 *                            Letter sheets. Print double-sided, flip on SHORT
 *                            edge, fold in half.
 *   _site/bulletin-flat.pdf  Plain 2-page Letter fallback (program / announcements).
 */
import { readFile, writeFile, access } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const SITE = path.resolve("_site");
const PANEL_W = 5.5 * 72;
const PANEL_H = 8.5 * 72;
const LETTER_W = 11 * 72; // landscape Letter
const LETTER_H = 8.5 * 72;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split("?")[0]);
        if (p.endsWith("/")) p += "index.html";
        const file = path.join(SITE, p);
        if (!file.startsWith(SITE)) {
          res.writeHead(403).end();
          return;
        }
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404).end("Not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function render(browser, origin, urlPath, pdfOpts) {
  const page = await browser.newPage();
  await page.goto(origin + urlPath, { waitUntil: "networkidle0" });
  const buf = await page.pdf({ printBackground: true, preferCSSPageSize: true, ...pdfOpts });
  await page.close();
  return buf;
}

/** Impose a reader-order booklet PDF (5.5x8.5 panels) onto 2 landscape Letter sheets. */
async function imposeBooklet(readerPdfBytes) {
  const src = await PDFDocument.load(readerPdfBytes);
  const pages = src.getPageCount();
  if (pages > 4) {
    console.warn(
      `⚠  Bulletin content ran to ${pages} panels; the booklet holds 4. ` +
        `Trim the announcements so it fits on one sheet.`
    );
  }
  const out = await PDFDocument.create();
  const embedded = await out.embedPdf(
    src,
    Array.from({ length: Math.min(pages, 4) }, (_, i) => i)
  );

  // Saddle-fold single sheet: front = [p4 | p1], back = [p2 | p3].
  for (const [left, right] of [[3, 0], [1, 2]]) {
    const sheet = out.addPage([LETTER_W, LETTER_H]);
    for (const [slot, idx] of [[0, left], [1, right]]) {
      const emb = embedded[idx];
      if (!emb) continue;
      sheet.drawPage(emb, { x: slot * PANEL_W, y: 0, width: PANEL_W, height: PANEL_H });
    }
  }
  return out.save();
}

async function main() {
  try {
    await access(path.join(SITE, "_bulletin/pages.html"));
  } catch {
    console.error("Run `eleventy` first — _site/_bulletin/pages.html is missing.");
    process.exit(1);
  }

  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const readerPdf = await render(browser, origin, "/_bulletin/pages.html", {});
    await writeFile(path.join(SITE, "bulletin.pdf"), await imposeBooklet(readerPdf));
    console.log("✓ _site/bulletin.pdf (half-fold booklet)");

    const flat = await render(browser, origin, "/_bulletin/flat.html", { format: "Letter" });
    await writeFile(path.join(SITE, "bulletin-flat.pdf"), flat);
    console.log("✓ _site/bulletin-flat.pdf (flat 2-page fallback)");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  // Don't fail the whole site deploy if PDF generation breaks (e.g. Chromium
  // missing on the build image). The site still ships; the /bulletin.pdf links
  // will 404 until this is fixed — see docs/ROLLOUT.md for the Chromium note.
  console.error("\n⚠  PDF generation failed — deploying site without bulletin PDFs.");
  console.error(err?.stack || err);
  process.exit(0);
});
