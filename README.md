# nevio.dev

Portfolio of **Nevio Werlen**, Software Developer from Valais, Switzerland.

**Live:** [nevio.dev](https://nevio.dev) · German at `/`, English at `/en`

Every time the page loads, it builds itself. A swarm of multiplayer-style cursors is already on the page: one draws a frame around the whole hero, then the team builds the content inside it: it drags the scattered fragments of the name into place, types the copy, draws the buttons, drags in what Nevio is working on right now, while another builds the navigation. Most of them leave; three stay like colleagues in a shared file, selecting elements, measuring spacing, pulling guides and marking words. Every other section, and the footer, is drawn the same way by two or three cursors the first time it scrolls into view; subpages are built on load.

---

## Stack

| Layer      | Choice                                                         | Why                                                                        |
| ---------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Framework  | [Astro 7](https://astro.build), static output                  | Real components, zero JS by default, plain HTML for search engines         |
| Language   | TypeScript (strict)                                            | Data and scripts are typed end to end                                       |
| Styling    | Scoped component CSS and a small token layer in `src/styles`   | No framework; one design system                                            |
| Motion     | [GSAP 3](https://gsap.com) (ScrollTrigger, SplitText)          | Build timelines, scroll reveals                                            |
| Scrolling  | [Lenis](https://lenis.darkroom.engineering)                    | Smooth scrolling, synced with ScrollTrigger                                |
| Builders   | Custom cursor engine (`src/scripts/build`) + Canvas 2D contour map | Plain DOM and one GSAP timeline; no WebGL                               |
| Font       | Mona Sans (variable, self-hosted via Fontsource)               | One family for everything; no Google Fonts request                         |
| Hosting    | VPS, Nginx, Let's Encrypt                                      | See [Deployment](#deployment)                                              |

Runtime dependencies are `astro`, `gsap`, `lenis` and the font package. That's the whole list.

## Getting started

Requires **Node.js ≥ 22.23**.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type check + static build into dist/
npm run preview    # serve dist/ locally
```

`npm run build:fast` skips the type check. The deploy script uses it.

## Project structure

```
src/
├── assets/logo.ts    the NW monogram (traced vector path)
├── data/             ← all content lives here (edit these, not the components)
│   ├── profile.ts      name, links, about text, languages, CV profile
│   ├── experience.ts   positions (current = end: null)
│   ├── education.ts    schools + the «courses & certificates» placeholder
│   ├── projects.ts     project cards and full case studies
│   └── skills.ts       skill groups
├── i18n/
│   ├── index.ts        language helpers, date formatting, localized paths
│   └── ui.ts           interface strings (DE / EN)
├── layouts/
│   └── BaseLayout.astro  <head>, SEO, nav, footer, intro gate
├── views/            ← page bodies, shared by both languages
│   ├── HomePage.astro
│   ├── CaseStudyPage.astro
│   ├── CvPage.astro      printable A4 CV
│   └── NotFoundPage.astro
├── pages/            ← thin routes: / and /en, /cv, /projects/[slug], 404, sitemap.xml
├── components/
│   ├── home/           Hero, Projects, About (incl. skills), Career, Contact
│   ├── ui/             Logo, Button, Icon, WorkCard, BrowserFrame, ProjectMock
│   ├── Nav.astro       header + round magnetic menu button + side-panel menu (<dialog>)
│   ├── Footer.astro
│   └── LangHint.astro  one-time «also available in English/German» hint
├── scripts/
│   ├── site.ts         shared entry: scrolling, menu, reveals, section builds, pointer
│   ├── home.ts         home entry: hero build + «rebuild this page»
│   ├── case.ts         case-study entry: gallery lightbox
│   ├── build/          swarm rebuild: cursors.ts, planner.ts, hero.ts, sections.ts, live.ts (colleagues)
│   ├── topo/           contour map: noise.ts (3D simplex), Topography.ts (marching squares)
│   ├── pointer.ts      magnetic buttons, the visitor's «View …» cursor over projects
│   ├── reveal.ts       scroll reveals, parallax
│   ├── nav.ts, ui.ts   menu, copy, clock, language, progress
│   └── core/           GSAP setup, Lenis, environment helpers
└── styles/
    ├── tokens.css      palette, type scale, spacing, radii, motion, themes
    └── base.css        reset, layout primitives, glass, intro gate, view transitions
public/                 favicon (SVG + ICO), apple-touch-icon, OG images (og.png DE, og-en.png EN), robots.txt
nginx/                  server config + deploy script
```

## Editing content

All text and data is in `src/data`. Each text field is `{ de, en }`. The pages, the CV and the «Current» markers in the career section all read from the same source, so you never type a fact twice.

| I want to…                         | Edit                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Add or update a position           | `experience.ts`: newest first; `end: null` marks it as current               |
| Add a school or programme          | `education.ts`: progress for ongoing programmes is computed from today        |
| Add certificates                   | Replace `educationPlaceholder` in `education.ts` (or set it to `null`)       |
| Add a project                      | Add an entry to `projects.ts` (incl. `stage` colours); card, case study, route and sitemap follow. With `link` the card opens that site instead and no case study is built (LogicTrail) |
| Change the Firntech panel          | `venture` in `projects.ts` (set to `null` to hide it)                        |
| Add a portrait                     | Put the image in `public/`, then set `profile.portrait` in `profile.ts`      |
| Change an interface label          | `src/i18n/ui.ts`                                                             |

German copy uses Swiss spelling (`ss` instead of the German sharp s, «Guillemets»).

### Screenshots

Project screenshots are **not** in git. They live on the server in `assets/` next to the repo, for example `assets/slopesafe/Desktop_Map.png`, and `deploy.sh` syncs them to the web root. The one exception is the LogicTrail screenshot in `public/media/`: it comes from the public LogicTrail repository, so it ships with the build.

When a screenshot is missing, for example in local development, each card falls back to an illustrated mock of the project marked as sample data, and the case study gallery hides itself. To preview with real screenshots locally, copy the folder to `public/assets/` (also git-ignored).

## Design system

The look follows professional portfolio conventions: a white hero with cobalt type, then mostly dark (work, finale) with one light island in the middle for the personal part; a quiet header that scrolls away and hands over to a round menu button; image-led work cards; experience as CV rows; one big call to action, then a white footer that ends the page the way it started.

| Token        | Value                                   | Use                                          |
| ------------ | --------------------------------------- | -------------------------------------------- |
| Logo         | NW monogram, `currentColor`             | Header, footer, CV, favicon, portrait placeholder |
| White + Cobalt | `#FFFFFF` with `#3243F5` type (`.theme-blue`) | Home hero, its header, the footer       |
| Ink          | `#0A0F24`                               | Projects, contact, menu                      |
| Mineral      | `#F1F2EF`                               | The light island: about, experience, case-study text, CV |
| Cobalt       | `#3243F5` / `#8E9BFF` on dark           | The only UI accent: focus, current, buttons  |
| Stages       | per project, in `projects.ts`           | Tinted backgrounds the product screens rise out of |
| Builders     | 7-colour multiplayer palette            | Only for the build cursors, never in the UI  |
| Type         | Mona Sans 420 to 640, tight tracking     | One family; monospace only for size readouts |
| Motion       | `expo.out`; nothing bounces             | Things arrive fast and settle softly         |

Section heads use one pattern: a small label in the left column and a large statement on the right (`.shead`, `.label`, `.statement` in `base.css`). Where the theme changes, the next section slides over the previous one with rounded top corners. Semantic tokens (`--bg`, `--text`, `--surface`, …) switch with `.theme-dark` / `.theme-light`.

Pointer details (mouse only, never with reduced motion): magnetic round buttons (`data-magnetic`); over project cards the visitor's own cursor turns into a builder with a name tag such as «View SlopeSafe» (`data-cursor`); in the header the hovered link stays bright while the others step back.

The logo is rendered once per page as an `<svg><symbol>` in `BaseLayout` and reused through `<Logo />`, so its path data isn't repeated. `public/logo.svg` is a standalone copy.

## The swarm rebuild

Any element can be built by a cursor. Mark it in the markup:

```html
<h2 data-build="type">…</h2>      <!-- typed in (letter by letter if short) -->
<div data-build="draw">…</div>    <!-- a frame is dragged open (W × H), then the content appears -->
<span data-build="drag">…</span>  <!-- lies scattered and tilted, gets dragged into place -->
<li data-build="pop">…</li>       <!-- clicked into existence -->

<!-- the drawn frame stays up until the caller fades it, with a frame title -->
<div data-build="draw" data-build-hold data-build-name="Startseite">…</div>

<!-- same group = same cursor (one after another); label = its name tag -->
<a data-build="pop" data-build-group="nav" data-build-label="Navigation">…</a>
```

- **Where it runs**: elements inside `[data-build-root="intro"]` (header, hero, subpage headers) are built on load by cursors that are already on screen. Elements inside `[data-build-section]` (sections, footer) are built by cursors flying in the first time they reach 90 % of the viewport (clamped, so the very end of the page still triggers).
- **Planner** (`build/planner.ts`): measures every target first, then sets the start states and schedules one cursor per group on a single GSAP timeline. Cursors arc slightly like a real hand, show a click ripple, switch to an I-beam while typing, and draw Figma-style selection frames with live size readouts.
- **One timeline**: the hero build (~4 s) speeds up as soon as the visitor scrolls or types, finishes instantly on resize and can be replayed from the footer.
- **Colleagues** (`build/live.ts`): after the build, *Design* selects elements and pulls guides, *Code* inspects elements DevTools-style and measures the spacing between them, *Text* selects words. Targets carry `data-live`. Never more than two actions at once, paused while the hero is off screen; idle cursors make room for the visitor's pointer. Phones get one colleague, tablets two.
- **Contour map** (`topo/Topography.ts`): three octaves of 3D simplex noise traced with marching squares. Only cells that cross a contour do any work, everything is drawn in a few strokes at ~30 fps. A hill follows the mouse and the lines around it brighten, a nod to the Valais Alps. It sits behind the contact section, the case-study headers and the 404 page; the home hero stays plain. It pauses off-screen and in hidden tabs.

| Situation                       | Behaviour                                                         |
| ------------------------------- | ----------------------------------------------------------------- |
| Every load of the home page     | Full hero build with ~11 cursors (~4 s, name in place after ~2 s), then the colleagues |
| Deep link, reload far down the page | Short fade-in                                                 |
| Phones                          | Fewer cursors (the name is built by two), coarser map, DPR ≤ 1.5  |
| `prefers-reduced-motion`        | No cursors, no colleagues, no smooth scrolling, no reveals; static map |
| No JavaScript                   | Everything visible; the intro gate only exists when JS runs       |
| Footer «Rebuild this page»      | Scatters the hero and lets the swarm build it again               |

## Internationalisation

- German at `/`, `/cv`, `/projects/…`; English under `/en`, `/en/cv`, `/en/projects/…`. Both are generated from the same views.
- `hreflang` alternates (including `x-default`) in every `<head>` and in `sitemap.xml`.
- An explicit language choice is remembered. A visitor whose browser prefers the other language gets a single, dismissible hint and no automatic redirect.

## Accessibility

- Semantic landmarks, skip link, one `<h1>` per page, labelled sections
- Visible `:focus-visible` rings; menu and lightbox are native `<dialog>`s (focus trap, Esc)
- In-page navigation moves keyboard focus to the target section
- Split-text animations keep the text readable for screen readers and are reverted after animating
- Decorative canvas, dots and mocks are hidden from assistive tech; mocks become visible to it only when they replace a missing screenshot
- Text colours meet WCAG AA contrast on their backgrounds

## SEO

Static HTML per page and language, canonical URLs, Open Graph and Twitter cards (`public/og.png` in German, `public/og-en.png` in English: white, cobalt, the name in a drawn frame like the hero), JSON-LD (`ProfilePage`/`Person` on the home page, `CreativeWork` on case studies), `sitemap.xml` and `robots.txt`.

## Deployment

The build is static: `dist/` is the whole site. Astro writes one HTML file per route (`/cv` → `cv.html`, `/en` → `en.html`), which matches the clean-URL rules in the Nginx config.

```bash
# first time, on a fresh Debian/Ubuntu VPS (Node.js ≥ 22.23 installed):
sudo ./nginx/deploy.sh

# every update afterwards:
git pull && sudo ./nginx/deploy.sh --update
```

The script builds the site, syncs `dist/` to `/var/www/nevio.dev` (without touching `assets/`), copies the server-side screenshots and reloads Nginx. On the first run it also installs Nginx, Certbot and UFW and requests the certificate. If Node isn't available on the server, build locally and copy `dist/` up; the script then deploys the existing folder.

| Nginx feature        | Detail                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| Clean URLs           | `/foo` → `foo.html`; `/foo.html`, `/foo/` and `/index` redirect (301)  |
| Custom 404           | Bilingual `404.html`                                                   |
| Caching              | `/_astro/*` (content-hashed) immutable for 1 year, images 30 days, HTML revalidated |
| HTTPS                | HTTP → HTTPS, HTTP/2, HSTS, Certbot auto-renewal                       |
| Security headers     | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Compression          | Gzip for HTML, CSS, JS, JSON, XML, SVG, fonts                          |

## Browser support

Current versions of Chrome, Edge, Safari and Firefox. Page-to-page transitions use native cross-document View Transitions where the browser supports them, and are a plain navigation everywhere else.

## Contact

[mail@nevio.dev](mailto:mail@nevio.dev) · [LinkedIn](https://www.linkedin.com/in/nevio-bastian-werlen-893548383/) · [GitHub](https://github.com/werlen-nevio)
