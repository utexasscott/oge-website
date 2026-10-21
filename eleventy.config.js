import { DateTime } from "luxon";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import rssPlugin from "@11ty/eleventy-plugin-rss";
import { HtmlBasePlugin } from "@11ty/eleventy";

/**
 * Office of Global Engagement — site build configuration.
 *
 * Content model (see README.md → "Content model"):
 *   src/programs/*.md   → Programs & initiatives (static pages, cross-listed by pillar)
 *   src/stories/*.md    → Global Stories (dynamic, taggable: regions / initiatives / audiences)
 *   src/_data/events.json   → Events (upcoming / past split at build time)
 *   src/_data/team.json     → Leadership, staff and faculty liaisons
 *   src/_data/partners.json → Partner listings (the historical record)
 *   src/_data/research.json → Faculty research profiles
 *
 * Environments: `npm start`/`npm run build` = development (drafts built, review comments kept);
 * `npm run build:prod` = production (drafts skipped, <!-- VERIFY --> comments stripped).
 * Deploying under a sub-path? `eleventy --pathprefix=/global/` rewrites all root-relative URLs.
 */
const isProduction = process.env.ELEVENTY_ENV === "production" || process.env.NODE_ENV === "production";

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function (eleventyConfig) {
  // ---------- Static assets ----------
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");

  // ---------- Markdown ----------
  const md = markdownIt({ html: true, linkify: true, typographer: true }).use(markdownItAnchor, {
    permalink: false,
    level: [2, 3],
    slugify,
  });
  // Wrap tables so they can scroll horizontally without losing table semantics (no display:block on <table>).
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>';
  md.renderer.rules.table_close = () => "</table></div>";
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("markdown", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("markdownInline", (s) => (s ? md.renderInline(String(s)) : ""));

  // ---------- Plugins ----------
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(HtmlBasePlugin); // honours --pathprefix for sub-directory deployments

  // ---------- Dates ----------
  const toDT = (d) => {
    // Eleventy parses front-matter dates as UTC midnight; keep them in UTC so the calendar day is preserved.
    if (d instanceof Date) return DateTime.fromJSDate(d, { zone: "utc" });
    return DateTime.fromISO(String(d), { zone: "America/Chicago" });
  };
  eleventyConfig.addFilter("date", (d, fmt = "LLLL d, yyyy") => toDT(d).toFormat(fmt));
  eleventyConfig.addFilter("isoDate", (d) => toDT(d).toISODate());
  eleventyConfig.addFilter("year", (d) => toDT(d).toFormat("yyyy"));
  eleventyConfig.addFilter("rfc822Utc", (d) => toDT(d).toFormat("EEE, dd LLL yyyy HH:mm:ss 'GMT'"));
  eleventyConfig.addGlobalData("buildDate", () => new Date());
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  // ---------- Generic helpers ----------
  eleventyConfig.addFilter("limit", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : arr));
  eleventyConfig.addFilter("where", (arr, key, val) =>
    (arr || []).filter((item) => {
      const data = item.data ? item.data : item;
      const v = data[key];
      return Array.isArray(v) ? v.includes(val) : v === val;
    })
  );
  eleventyConfig.addFilter("whereNot", (arr, key, val) =>
    (arr || []).filter((item) => {
      const data = item.data ? item.data : item;
      return data[key] !== val;
    })
  );
  eleventyConfig.addFilter("sortBy", (arr, key, dir = "asc") => {
    const out = [...(arr || [])].sort((a, b) => {
      const av = (a.data ? a.data : a)[key] ?? 0;
      const bv = (b.data ? b.data : b)[key] ?? 0;
      return av > bv ? 1 : av < bv ? -1 : 0;
    });
    return dir === "desc" ? out.reverse() : out;
  });
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("join", (arr, sep = ", ") => (Array.isArray(arr) ? arr.join(sep) : arr));
  eleventyConfig.addFilter("unique", (arr) => [...new Set(arr || [])]);
  eleventyConfig.addFilter("flattenKey", (arr, key) => {
    const out = [];
    for (const item of arr || []) {
      const v = (item.data ? item.data : item)[key];
      if (Array.isArray(v)) out.push(...v);
      else if (v) out.push(v);
    }
    return [...new Set(out)].sort();
  });
  eleventyConfig.addFilter("findBy", (arr, key, val) =>
    (arr || []).find((item) => (item.data ? item.data : item)[key] === val)
  );
  eleventyConfig.addFilter("excerpt", (html, n = 160) => {
    const text = String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > n ? text.slice(0, n).replace(/\s+\S*$/, "") + "…" : text;
  });
  eleventyConfig.addFilter("jsonify", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("isActive", (pageUrl, href) => {
    const url = typeof pageUrl === "string" ? pageUrl : ""; // page.url is `false` for unwritten drafts
    if (!href || href === "/") return url === "/";
    return url.startsWith(href);
  });
  // Byte size of a file under src/ (for RSS enclosures). Returns 0 if missing.
  eleventyConfig.addFilter("fileSize", (p) => {
    try {
      return statSync(resolve(import.meta.dirname, "src", String(p).replace(/^\//, ""))).size;
    } catch {
      return 0;
    }
  });
  eleventyConfig.addFilter("telHref", (phone) => "tel:+1" + String(phone || "").replace(/\D/g, ""));

  // ---------- Collections ----------
  eleventyConfig.addCollection("stories", (api) =>
    api
      .getFilteredByGlob("src/stories/*.md")
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("publishedStories", (api) =>
    api
      .getFilteredByGlob("src/stories/*.md")
      .filter((s) => !s.data.draft)
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("programs", (api) =>
    api
      .getFilteredByGlob("src/programs/*.md")
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );
  for (const pillar of ["education", "research", "service"]) {
    eleventyConfig.addCollection(`programs_${pillar}`, (api) =>
      api
        .getFilteredByGlob("src/programs/*.md")
        .filter((p) => (p.data.pillars || []).includes(pillar))
        .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    );
  }

  // Events come from a data file; expose sorted upcoming / past lists as global data.
  eleventyConfig.addGlobalData("eventsSorted", async () => {
    const { default: events } = await import("./src/_data/events.json", { with: { type: "json" } });
    const now = DateTime.now().setZone("America/Chicago").startOf("day");
    const parsed = events.map((e) => {
      const startDT = DateTime.fromISO(e.start, { zone: "America/Chicago" });
      const endDT = DateTime.fromISO(e.end || e.start, { zone: "America/Chicago" });
      if (!startDT.isValid || !endDT.isValid) {
        throw new Error(`events.json: invalid start/end date in event "${e.title}" (use YYYY-MM-DD)`);
      }
      return { ...e, id: e.id || `${slugify(e.title)}-${e.start}`, startDT, endDT };
    });
    const upcoming = parsed.filter((e) => e.endDT >= now).sort((a, b) => a.startDT - b.startDT);
    const past = parsed.filter((e) => e.endDT < now).sort((a, b) => b.startDT - a.startDT);
    return { upcoming, past };
  });

  // ---------- Production hygiene ----------
  if (isProduction) {
    // Strip editorial <!-- VERIFY: ... --> comments so review notes never ship.
    eleventyConfig.addTransform("strip-editorial-comments", (content, outputPath) => {
      if (outputPath && (outputPath.endsWith(".html") || outputPath.endsWith(".xml"))) {
        return content
          .replace(/<!--\s*VERIFY[\s\S]*?-->/g, "")
          .replace(/&lt;!--\s*VERIFY[\s\S]*?--&gt;/g, ""); // entity-escaped copies inside RSS content:encoded
      }
      return content;
    });
  }

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html", "11ty.js"],
  };
}
