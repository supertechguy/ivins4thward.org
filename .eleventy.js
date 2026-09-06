import markdownIt from "markdown-it";
import markdownItLinkAttributes from "markdown-it-link-attributes";

export default function (eleventyConfig) {
  // Static assets: copy straight through, keeping the same URLs the old site used.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/*.jpeg");
  eleventyConfig.addPassthroughCopy("src/*.jpg");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.pdf");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/christmas.html");
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy("admin");

  // Markdown: turn bare URLs into links, open them in a new tab.
  const md = markdownIt({ html: true, breaks: true, linkify: true }).use(
    markdownItLinkAttributes,
    { matcher: (href) => /^https?:\/\//.test(href), attrs: { target: "_blank", rel: "noopener" } }
  );
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("markdown", (str) => (str ? md.render(String(str)) : ""));
  eleventyConfig.addFilter("markdownInline", (str) => (str ? md.renderInline(String(str)) : ""));

  // Friendly date formatting for the program header, e.g. "Sunday, September 6, 2026".
  eleventyConfig.addFilter("bulletinDate", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
