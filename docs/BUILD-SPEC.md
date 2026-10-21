# OGE website — build conventions (read before adding pages)

Static site built with **Eleventy 3 + Nunjucks**. Source in `src/`, output in `_site/`.
Run `npm start` → http://localhost:8080.

## Layouts

| Layout | Use for | Key front matter |
|---|---|---|
| `layouts/page.njk` | Any standard interior page | `title`, `description`, `eyebrow`, `lede`, `hero: {image, alt, size}`, `breadcrumbs: [{label,url}]`, `sidebar: true`, `contact: {...}`, `related: [{label,url}]`, `cta: {...}` or `cta: false` |
| `layouts/program.njk` | Programs/initiatives in `src/programs/*.md` | see header comment in the file: `pillars[]`, `regions[]`, `type`, `audience`, `facts[]`, `cta`, `secondaryCta`, `contact`, `partners[]`, `status`, `initiativeTag`, `order`, `permalink` |
| `layouts/story.njk` | Global Stories in `src/stories/*.md` | `title`, `date`, `summary`, `image`, `imageAlt`, `regions[]`, `initiatives[]`, `audiences[]`, `author`, `draft`, `featured`, `tone` |
| `layouts/base.njk` | Fully custom pages (home, archive, events) | compose sections yourself inside `.container`/`.section` |

`page.njk` wraps content in `<article class="prose">` (max-width 44rem). For full-width sections inside a page, set `cta: false` where needed and compose with `base.njk`, or put markup **outside** the prose by using `base.njk` directly.

## Taxonomy (use these exact strings — they drive filters and tag links)

- **regions**: Chile, Mexico, Puerto Rico, New Zealand, South Africa, Switzerland, Hungary, Ireland, Northern Ireland, United Kingdom, Estonia, India, Costa Rica, Greece, Texas, Washington, D.C., Global
- **initiatives**: From Texas to the Troubles, Global Practicum, Projects with Underserved Communities, May Term, Clinical Master's Collaboration, Cortando la Brecha, UNHCR Partnership, TIES, Faculty Exchange, Global Social Work Certificate
- **audiences**: Student Experience, Faculty, Alumni, Partner, Staff, Donor Impact

## Data available in templates

`site` (nav, contact, taxonomy), `team` (leadership, staff, facultyLiaisons), `partners.partners`, `research.faculty`, `events` (raw) and `eventsSorted.upcoming / .past`, `map.pins`, `collections.programs`, `collections.programs_education|research|service`, `collections.publishedStories`, `collections.stories` (includes drafts).

## Components (`{% include "components/x.njk" %}`)

- `story-card.njk` — needs `story` (collection item), optional `variant` = `featured` | `compact`
- `program-card.njk` — needs `program`
- `event-card.njk` — needs `event` (from `eventsSorted`)
- `contact-card.njk` — needs `card` = `{heading, name, title, email, phone, url, note}`
- `cta-band.njk` — uses page `cta` front matter or defaults to the student/donor audience CTA
- `world-map.njk` — the pinned world map
- `page-hero.njk`, `breadcrumbs.njk`, `header.njk`, `footer.njk`, `logo.njk`

## CSS classes you can rely on (see `src/assets/css/main.css`)

Layout: `.container`, `.section`, `.section--sand`, `.section--charcoal`, `.section__head`, `.section__title`, `.section__intro`, `.section__more`, `.card-grid.card-grid--2|3|4`, `.split`, `.split--reverse`, `.split__media`, `.layout-prose`, `.layout-sidebar`, `.prose`, `.rail`, `.rail-block`, `.rail-heading`, `.rail-links`
Type: `.eyebrow`, `.eyebrow--light`, `.eyebrow--blue`, `.lede`, `.pullquote`, `.pullquote-cite`, `.small`, `.muted`
Buttons: `.btn .btn--primary|--outline|--blue|--light|--ghost-light|--sm|--lg|--block`, `.btn-row`
Tags: `.tag-list`, `.tag`, `.tag--initiative`, `.tag--audience`, `.badge--draft`, `.badge--new`, `.pillar-chip--education|research|service`
Blocks: `.pillars > .pillar(.pillar--research|--service)` with `.pillar__title/.pillar__tagline/.pillar__text/.pillar__link`; `.stats > li.stat > .stat__value + .stat__label`; `.timeline > li > .timeline__year + .timeline__text`; `.steps > li > h3 + p`; `.feature-list(.feature-list--2)`; `.resource-grid(.resource-grid--3) > a.resource > .resource__title + .resource__text + .resource__org`; `.notice(.notice--launch|--archive|--warn)`; `.destination` (`.destination__media`, `.destination__title`, `.destination__meta` dl); `.people-grid(.people-grid--3|4) > .person(.person--lead|--stack)` with `.person__initials|__photo`, `.person__name`, `.person__title`, `.person__subtitle`, `.person__bio`, `.person__contact`, `.person__focus`; `.partner-list > li.partner(.partner--past)` with `.partner__where`, `.partner__name`, `.partner__desc`, `.partner__meta`; `.country-group > .country-group__title`; `.event-detail` with `.event-detail__meta` dl; `.audience-cta`, `.cta-band--orange|blue|charcoal|green`; `.empty-state`
Forms: `form.form[data-form][data-form-success="..."]` with `.form__row.form__row--2`, `.field > label + input`, `.hint`, `.fieldset.check`, `[data-form-status]` div (`hidden`, class `form__status`, `tabindex="-1"`), `.form__note`
Filters: `form.filters[data-story-filters]` with `select name="region|initiative|audience"`, `[data-filter-reset]`, `[data-filter-summary]`, and `[data-filter-empty]` empty-state outside the form. Story cards carry `data-story data-regions="A|B" data-initiatives=... data-audiences=...`.

## Images

Available in `/assets/img/`: `hero-oaxaca-wide.jpg` (1600×424 banner), `students-oaxaca.jpg` (900×1200 portrait), `chile.jpg` (1200×1200), and small 320×240 thumbnails `oaxaca-mural.jpg`, `new-zealand-mural.jpg`, `geneva-fountain.jpg`, `south-africa-sunset.jpg` (use only at card size), `ut-social-work-logo.png`, `world-map.png`. When no suitable photo exists, omit `image` and set `tone: orange|charcoal|shale|limestone` to get a branded placeholder tile (UT palette only). Never hot-link external images.

## Voice

Professional, warm, concrete. Lead with the student or community, not the office. Use "the School" for the Steve Hicks School of Social Work and "OGE" after first mention. Taglines: student-facing "Leave to Learn. Return to Lead."; unit-wide "Global engagement that learns, serves, and discovers."; service "Serve across borders. Strengthen communities." Use the key messages in the private CONTENT-SOURCES document (kept outside this repository). Every page should include at least one segmented CTA moment (students / donors) — the default `cta-band` does this automatically.

## Accuracy rules

Everything factual must come from the private CONTENT-SOURCES document (kept outside this repository because it contains internal planning notes). Where the office hasn't supplied content yet (e.g., TIES description, certificate requirements, specific dates/costs), write a sensible, clearly-structured draft and mark it with `<!-- VERIFY: ... -->` HTML comments **and** a visible `<p class="notice notice--warn"><strong>Draft content.</strong> …</p>` so OGE staff can review. Do not invent named people, quotes attributed to real people, dollar amounts, or deadlines beyond those in the sources; use "Priority deadline: see current application" style phrasing instead.
