/** Directory data for Global Stories. Drafts are built locally for review but never in production. */
export default {
  eleventyComputed: {
    layout: (data) => (data.page.inputPath.endsWith(".md") ? "layouts/story.njk" : data.layout),
    tags: (data) => (data.page.inputPath.endsWith(".md") ? ["story"] : data.tags),
    permalink: (data) => {
      if (!data.page.inputPath.endsWith(".md")) return data.permalink;
      return data.draft && data.env.production ? false : `/stories/${data.page.fileSlug}/`;
    },
  },
};
