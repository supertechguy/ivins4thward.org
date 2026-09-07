import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import markdownIt from "markdown-it";
import markdownItLinkAttributes from "markdown-it-link-attributes";

// Render the free-text content files (edited in the CMS as plain Markdown) to
// HTML once, at build time, so templates can drop them straight in.
const md = markdownIt({ html: true, breaks: true, linkify: true }).use(
  markdownItLinkAttributes,
  {
    matcher: (href) => /^https?:\/\//.test(href),
    attrs: { target: "_blank", rel: "noopener" },
  }
);

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content");

export default async function () {
  const out = {};
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".md")) continue;
    const key = file.replace(/\.md$/, "");
    const raw = await readFile(path.join(dir, file), "utf8");
    out[key] = md.render(raw);
  }
  return out;
}
