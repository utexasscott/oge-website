# Office of Global Engagement — website

A standalone website for the Office of Global Engagement (OGE), Steve Hicks School of Social Work, The University of Texas at Austin. Built to the information architecture, content model and functional requirements in the OGE communication plan and the September 2026 web-consultant brief.

## Run it locally

Requirements: Node.js 18+ (this machine has Node 24).

```
cd C:\Users\utexa\oge-website
npm install        # first time only
npm start          # builds and serves at http://localhost:8080 with live reload
```

Or double-click `Start OGE Website.bat` in this folder.

Other commands:

```
npm run build              # development build into _site/ (drafts included, review comments kept)
npm run build:prod         # production build: draft stories skipped, <!-- VERIFY --> comments stripped
npm run build:prod:subdir  # same, with every URL prefixed for deployment under /global/
npm run preview            # build, then serve _site/ without live reload
npm run check              # internal link and anchor checker (run after a build)
```

`src/_data/site.json → url` is the public base URL used for canonical links, the RSS feed and the sitemap. It currently assumes `https://socialwork.utexas.edu/global`; change it (and the `--pathprefix` in `build:prod:subdir`) once the real address is decided.

## What's in the site

| Section | URL | Notes |
|---|---|---|
| Home | `/` | Live stories feed (featured + 3 latest), pillars, world map, impact stats, signature programs, upcoming events, listserv CTA |
| About | `/about/`, `/about/leadership/`, `/about/team/`, `/about/partners/` | Mission & vision (client text), timeline, people from `team.json`, partner directory grouped by region (the historical record) |
| Education | `/education/`, `/education/student-opportunities/`, `/education/practicum/`, `/education/from-texas-to-the-troubles/`, `/education/projects-with-underserved-communities/`, `/education/may-term/`, `/education/certificate/` | Overview + philosophy, student landing page (primary CTA entry point), program pages |
| Research | `/research/`, `/research/northern-ireland/`, `/research/chile/`, `/research/ties/`, `/research/faculty/` | Research focus, area pages, faculty profiles from `research.json` |
| Service | `/service/` | "Serve across borders. Strengthen communities." Cross-lists PUC and TIES |
| Global Stories | `/stories/`, `/stories/<slug>/`, `/stories/feed.xml` | Filterable archive (region · initiative · audience, URL-synced), story pages with related stories, RSS |
| Events | `/events/` | Upcoming/past split automatically at build time from `events.json` |
| Connect | `/connect/`, `/connect/listserv/`, `/connect/media/` | Contact, listserv signup and media request forms |
| Resources | `/resources/international-students/` | Texas Global, Interstride, ATX Bridges, CARE counselor, etc. |
| Give | `/give/` | Donor landing page with impact framing |

Design: UT brand palette (burnt orange #BF5700, charcoal #333F48, bluebonnet, cactus, limestone), Libre Franklin + Source Serif 4 (free stand-ins for Benton Sans / a serif display face), responsive from 360px up, keyboard-accessible navigation, skip link, focus styles, reduced-motion support, print styles.

## Content model (maps 1:1 to WordPress custom post types)

| Content type | Where | How it's used |
|---|---|---|
| **Programs / initiatives** | `src/programs/*.md` | Static pages cross-listed by `pillars: [education, research, service]`. Front matter drives the "At a glance" rail, contacts, partners, CTAs. |
| **Global Stories** | `src/stories/*.md` | Dynamic, taggable. `regions`, `initiatives`, `audiences` feed the archive filters and tag links. `draft: true` keeps a story out of feeds (shown in a "pending review" list on the local archive). `featured: true` pins one to the homepage. |
| **Events** | `src/_data/events.json` | `start`/`end` ISO dates; upcoming vs past is computed at build time. |
| **People** | `src/_data/team.json` | Leadership, staff, faculty liaisons. Add `photo` paths when headshots are ready. |
| **Partners** | `src/_data/partners.json` | Partner listings with `status: active|past` so the directory doubles as an archive. |
| **Faculty research** | `src/_data/research.json` | Profiles with regions/topics; medium-term replace with a feed from the School research database. |
| **Site settings** | `src/_data/site.json` | Name, taglines, contact, navigation, footer, taxonomy vocabularies. |

### Adding a story

Create `src/stories/YYYY-MM-DD-slug.md`:

```md
---
title: "Headline"
date: 2026-10-01
summary: "One or two sentences for cards and search."
image: /assets/img/photo.jpg      # optional; omit and set tone: orange|blue|green|teal|charcoal|gold
imageAlt: "Describe the photo"
regions: [Chile]
initiatives: [Global Practicum]
audiences: [Student Experience]
author: "Office of Global Engagement"
featured: false
draft: false
---
Body in Markdown…
```

Use the exact taxonomy strings listed in `docs/BUILD-SPEC.md` (also in `site.json → taxonomy`).

### Adding an event

Append to `src/_data/events.json` with `title`, `start` (YYYY-MM-DD), optional `end`, `time`, `location`, `type`, `region`, `initiative`, `audience`, `description`, `registration`.

## Content review flags

Where the office hasn't yet supplied final content, pages carry a visible **Draft content** notice and `<!-- VERIFY: … -->` comments in the source. Search the `src/` folder for `VERIFY` to get the full list. Key items: TIES description, certificate requirements, the shared office email address, ATX Bridges and Interstride links, Give fund designation, and the three draft stories.

Sources for every fact are listed in `docs/CONTENT-SOURCES.md`.

## Moving this into WordPress (socialwork.utexas.edu)

The site was built as a standalone static site so OGE can review and test it without touching the School's WordPress install. To implement it on the School's WordPress (with Rogelio / web support):

1. **Theme:** Register a child theme or a page template set for the OGE section. `src/assets/css/main.css` is framework-free and can be enqueued as-is; `src/assets/js/main.js` likewise.
2. **Navigation:** Build an "OGE" menu location so the OGE pages share this header rather than the School's global header (the core issue in the brief). Keep the utility bar link back to the School site.
3. **Custom post types & taxonomies:** `oge_program` (with `pillar` taxonomy), `oge_story` (reuse the School's Posts with a site-wide `global` tag plus `region`, `initiative`, `audience` taxonomies — this satisfies "global tagging across legacy content"), `oge_partner`, `oge_person`. Events: use The Events Calendar (or the School's existing calendar) with a `global` category and render the feed on `/events/` and the homepage.
4. **Templates:** Each `.njk` layout/component maps to a PHP template part: `layouts/page.njk` → `page-oge.php`, `layouts/program.njk` → `single-oge_program.php`, `layouts/story.njk` → `single-oge_story.php`, `stories/index.njk` → `archive-oge_story.php` with `WP_Query` taxonomy filters replacing the client-side filter (or keep the JS filter for a no-reload experience).
5. **Forms:** Replace the simulated forms with Gravity Forms / WPForms; keep the field names so the markup contract in `main.js` still validates.
6. **Research integration (medium-term):** add a `global` term to the School research database; expose a REST endpoint; render on `/research/` and `/research/faculty/`.
7. **Performance:** the world map is a 117 KB pre-rendered PNG; stories/events feeds are static HTML. Use the School's image CDN/thumbnail sizes for story images.
8. **Phased rollout:** (1) About + Education + Connect, (2) Stories archive + tagging of legacy posts, (3) Research + Partners directory, (4) Events integration.

## Project layout

```
oge-website/
├─ eleventy.config.js      # build config, collections, filters
├─ package.json
├─ Start OGE Website.bat   # double-click launcher (Windows)
├─ docs/                   # BUILD-SPEC.md (conventions), CONTENT-SOURCES.md (facts)
├─ scripts/                # world-map generator (build-map.mjs, map-render.html, optimize-map.py)
├─ src/
│  ├─ _data/               # site.json, team.json, partners.json, events.json, research.json, map.json
│  ├─ _includes/layouts/   # base, page, program, story
│  ├─ _includes/components/# header, footer, logo, cards, map, CTA band, icons
│  ├─ assets/css|js|img/
│  ├─ programs/*.md        # program & research-area pages
│  ├─ stories/*.md         # global stories
│  ├─ about/ education/ research/ service/ stories/ events/ connect/ resources/
│  ├─ index.njk            # homepage
│  ├─ give.njk, 404.njk
└─ _site/                  # build output (generated)
```

## Credits

World map base: `@svg-maps/world` by Victor Cazanave (CC BY 4.0), rendered to PNG at build time. Photos: School of Social Work OGE web page (Oaxaca, Chile, Wellington, Cape Town, Geneva).
