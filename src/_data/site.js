/**
 * Site settings. Edit ../../site.config.json for names, navigation, contact details and taxonomy.
 * The public base URL can be overridden per deployment with the SITE_URL environment variable
 * (used by GitHub Pages, where the site lives under /oge-website/).
 */
import settings from "../../site.config.json" with { type: "json" };

const url = (process.env.SITE_URL || settings.url).replace(/\/$/, "");
export default { ...settings, url };
