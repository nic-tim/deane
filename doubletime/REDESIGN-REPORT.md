# Doubletime redesign — implementation report

_October 27, 2026_

## 0. Starting point (baseline audit)

**What exists.** getdoubletime.com is a single-page Next.js (Turbopack) site with inline CSS (Figtree, brand blue `#1B45D7`), plus `/privacy` and `/terms`. It sells AI phone answering for local service businesses at $397/month, month to month. The one conversion path is booking a 15-minute Cal.com call, or emailing nick@getdoubletime.com. There are no forms, no analytics, no CMS and no auth on the public pages. The source code is **not on this machine**, so the audit used the live site.

| Area | Finding |
|---|---|
| Strengths | Sharp, specific copy ("The calls you miss are the jobs you lose."), an honest founder voice, a clear price, and a believable call transcript as the hero visual. |
| Visual design | Clean but generic: one typeface, white page, identical icon-less cards, and a single blue. Nothing is art-directed and every section has the same rhythm. |
| UX / navigation | Only 3 nav items. No FAQ, so objections (number, contract, setup, emergencies) are buried in body copy. |
| Messaging | Strong. The cost of missed calls is stated but never shown. |
| Conversion | One CTA, which is good. The pricing block is thin, and there is no recap of what $397 includes. |
| Mobile | Works, but the hero visual sits far below the fold. |
| Technical | Lighthouse (mobile): Perf 97 · A11y **96** (fails colour contrast) · BP 100 · SEO 100. `/sitemap.xml` returns 404. The logo SVG flips its hands to **white in OS dark mode**, which makes them invisible on a light header. In this test browser, scroll-reveal sections stayed blank because they rely only on IntersectionObserver. |

## 1. Redesign summary

The page is rebuilt around one idea: **after hours**. Calls arrive when you can't answer them, and Doubletime picks up.

1. **Hero**: the same headline, now with a serif-italic emphasis. One primary CTA plus email as the secondary. Below it, a dusk-gradient "stage" plays the existing example call in sequence and then shows its three real outputs: the calendar booking, the confirmation text and the summary sent to the owner. It is captioned as an example call.
2. **Trades strip**: the existing list of 8 industries, kept as a list. No fake logos.
3. **Why it matters** (new, dark section): an "example day" timeline. Closed hours, jobs, lunch and calls already in progress show as gaps, against a full 24-hour Doubletime bar.
4. **What it does**: the 6 existing capabilities as a varied bento grid. Each tile has a small visual that matches its claim (calendar slot, question chips, trigger words → "forwarded to your cell", SMS, call log).
5. **How it works**: the 3 existing steps as an editorial numbered row, plus the "No hardware / No new number / No contract" assurances.
6. **Pricing**: a split layout with the price card listing what's included. Every line comes from claims already on the site, and the founder's "worth keeping" line is kept as a pull quote.
7. **FAQ** (new): 6 questions built from facts already published on the site, using native `<details>` so it is accessible.
8. **Final CTA** and a **footer** with the real address, email, legal links and the SMS disclosure, kept verbatim.

No testimonials, statistics, logos, integrations or features were added. Copy changes are limited to headings and short connective lines.

## 2. Design direction and references

| Reference | What I could inspect | What carried over |
|---|---|---|
| **Antimetal** (antimetal.com) | Live site, fully | Warm off-white paper (`#F7F7F3`), a serif display paired with a clean sans, an atmospheric gradient hero framing the *actual product output*, mono numbered labels (`01 — WHY IT MATTERS`), one pill CTA. |
| **Mobbin** (mobbin.com) | Live HTML + stylesheet (it renders unstyled in the test browser) | Large rounded radii (16–32px), pill buttons, a bento grid of real-looking artifacts, sans headlines with serif accents, generous whitespace. |
| **Zaro** | **Not inspected.** The Mobbin preview links return 403, and zaro.com is a NYC bakery, so I could not identify which Zaro the link meant. | None. Send a screenshot or the real URL and I'll fold it in. |

**System.** Geist (sans) with Instrument Serif italic accents, both self-hosted (about 60 KB, no external font requests). Colours: Doubletime blue kept as the brand colour, warm paper and ink neutrals, a night navy for after-hours sections, plus green and amber status colours. 8px-based spacing, a 1200px container with a `clamp(16px, 5vw, 48px)` gutter, section padding `clamp(88px, 11vw, 152px)`. Motion uses one easing curve, durations of 140/320/700ms, and honours `prefers-reduced-motion`.

## 3. Files

All files are under `doubletime/` in the `deane` repo. It is plain static HTML/CSS/JS with no build step, because no Next.js source was available. Run `npm start` from the repo root and open http://localhost:4321/doubletime/.

- `index.html`: page markup, metadata (canonical, OG/Twitter, Organization JSON-LD built from the published address and email only)
- `styles.css`: design tokens and all components
- `main.js` (about 3 KB): sticky-header state, accessible mobile menu, hero call sequence, scroll reveal
- `assets/img/logo-mark.svg` and `logo-mark-dark.svg`: the existing logo with the dark-mode flip removed (fixed light and dark variants)
- `assets/img/*.png`: the existing icons and OG image, copied unchanged
- `assets/fonts/*.woff2`: Geist and Instrument Serif (both SIL OFL; see `assets/fonts/LICENSE.md`)
- `screenshots/`: before and after, desktop and mobile, full page (JPEG)

This demo copy carries `<meta name="robots" content="noindex">` so it can't compete with the real domain in search. Remove it when the page goes live. A production root should also add a `robots.txt` with a `Sitemap:` line and a `sitemap.xml` for `/`, `/privacy` and `/terms` (the live site's `/sitemap.xml` currently returns 404).

**Porting into the Next.js repo:** the markup maps directly onto `app/page.tsx`, and `styles.css` can become a global or module stylesheet. Keep the existing `opengraph-image` and `icon` routes, and change the legal links back to relative `/privacy` and `/terms` (they're absolute here so they work locally).

## 4. Functionality

- Every "Book a call" CTA (header, mobile menu, hero, pricing, final CTA, footer) goes to `https://cal.com/founder-doubletime-5td7wi`, unchanged. Checked: HTTP 200.
- Email CTAs: `mailto:nick@getdoubletime.com`, unchanged.
- Privacy and Terms links return 200.
- No forms exist on the live site, so none were added and none were simulated.
- No analytics exist on the live site, so none were added.

## 5. Testing (actually run)

| Check | Result |
|---|---|
| Lighthouse 12.8.2, mobile | **Perf 97 · A11y 100 · BP 100 · SEO 100**. LCP 1.9s (live: 2.4s), CLS 0, TBT 160ms |
| Lighthouse 12.8.2, desktop | **100 · 100 · 100 · 100**. LCP 0.4s, CLS 0 |
| Horizontal overflow at 320, 360, 375, 390, 414, 430, 600, 768, 900, 1024, 1280, 1440, 1920px | None |
| Touch targets under 24px | Only inline email links inside running text (exempt under WCAG 2.5.8) |
| Anchors, local assets, external links | All resolve |
| Mobile menu | Opens on click, focus moves to the first link, Esc closes it and returns focus to the toggle, a link click closes it and scrolls to the section, it closes when the window widens past 880px |
| Reduced motion (headless Chrome `--force-prefers-reduced-motion`) | All 18 reveals and 7 hero items visible immediately |
| No-JS | Content visible (reveal styles apply only once JS adds the `.js` class) |
| Console errors | None |
| Visual review | 1440, 768 and 375px in the in-app browser |

**Not tested:** real Safari or iOS devices, screen readers (the semantics are in place: landmarks, labelled navs, `role="img"` with labels on the timelines, `aria-hidden` on decorative visuals), and lint or type checks (there's no toolchain in a static build).

## 6. Known issues and owner input

- **Zaro reference**: not inspected (see above).
- **Demo line**: the hero still says "A live demo line goes up shortly." When the number exists, it should become the secondary CTA (`tel:` link).
- **Example content**: the timeline ("example day") and the tile visuals use illustrative times and phrases such as "gas smell". They're labelled as examples, but check they fit your real customers.
- **Not deployed**: nothing was committed, pushed or deployed.

## 7. Next steps

1. Port into the Next.js repo and ship behind a preview deploy.
2. Add the demo phone number as a second CTA as soon as it's live. It's the strongest proof available.
3. Once real customers agree, add one or two attributed results or quotes next to pricing.
