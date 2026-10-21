/**
 * Build environment flags.
 *   npm start / npm run build      → development (drafts are built and listed; VERIFY comments kept for review)
 *   npm run build:prod             → production  (drafts are not built; editorial comments are stripped)
 *   OGE_PREVIEW=1                  → preview deployment: every page gets <meta name="robots" content="noindex">
 *                                    and robots.txt disallows crawling (used for the Fly.io review site)
 */
const production = process.env.ELEVENTY_ENV === "production" || process.env.NODE_ENV === "production";
const preview = process.env.OGE_PREVIEW === "1";
export default { production, development: !production, preview };
