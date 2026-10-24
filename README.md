# MOONROT ($ROT) — concept site

A launch website for a **fictional** meme coin, built as a design and development
showcase. MOONROT, $ROT, the mascot, the copy and every figure are placeholder
branding. No token, contract, market, liquidity, partnership or community exists,
and the page says so wherever it matters.

## Run it

Requires Node 18+. There are no runtime dependencies.

```bash
npm start            # http://localhost:4321  (or: node serve.js 8080)
```

You can also open `index.html` directly in a browser. Everything works from `file://`.

## Test it

```bash
npm run check                                   # syntax check of the scripts
npm i -D playwright && npx playwright install chromium   # once
npm test                                        # 42 end-to-end checks in Chromium
```

`tests/qa.js` covers the following:

- No console errors, failed loads or third-party requests at 320, 390, 768, 1024, 1440 and 1920px.
- No horizontal scroll, the fonts really load, and tap targets are at least 44px.
- Nav links scroll to their sections, and every in-page anchor has a target.
- Every buy button opens the demo notice. Escape and the button both close it.
- Social placeholders never link out. The contract copy refuses to copy a non-existent address.
- No address-shaped strings appear anywhere on the page.
- Mobile menu: opens, traps focus, closes on Escape and returns focus, closes on navigation.
- Keyboard: the skip link comes first and focus rings are visible.
- Reduced motion: all content is visible immediately, and the marquee and mascot are still.
- With JavaScript off, the headline and copy still render.

## Files

| File | What it is |
|---|---|
| `config.js` | **All replaceable brand details.** Name, ticker, colours, copy, tokenomics, contract, socials, CTAs, disclaimers. |
| `index.html` | Page structure and the inline SVG mascot. |
| `styles.css` | Design tokens at the top, then one block per section, responsive rules, reduced motion. |
| `main.js` | Applies the config, builds the data-driven sections, and handles motion and interaction. No libraries. |
| `assets/` | Self-hosted fonts (OFL, see `assets/fonts/LICENSE.md`) and the favicon. |
| `serve.js` | Zero-dependency static server for local preview. |
| `scripts/build-preview.js` | Bundles everything into one HTML file in `dist/` for sharing. |
| `tests/qa.js` | Playwright QA suite. |

## Rebranding for the real client

Almost all of it happens in **`config.js`**:

1. **Name and ticker.** Set `brand.name`, `brand.ticker`, `brand.tagline` and the meta title and description.
2. **Colours.** Edit `colors`. Mirror the same values in the `:root` block at the top of
   `styles.css` so the first paint matches. `acid` is the single accent, so keep it rare.
3. **Copy.** Set `hero`, `marquee`, `about`, `howToBuy`, `community` and `footer`. Hero headline
   lines are an array, one string per line. Wrap a word in `*asterisks*` to colour it.
4. **Mascot.** Put the client's art in `assets/` and set `mascot.src` (and `mascot.alt`).
   It replaces the drawn moon in both the hero and the community section. A square
   transparent PNG or WebP of at least 1200px works best. The poke interaction keeps working.
   The pupil tracking and blink only apply to the SVG mascot.
5. **Tokenomics.** Set `totalSupply` and replace `allocations` (percentages should total 100;
   the ring is drawn from them). Then replace each `facts` value. Anything still in
   `[brackets]` renders in grey italic as an open placeholder.
6. **Contract.** Set `contract.address` and `contract.network` only once the address is real
   and verified. Until then the page shows "Not yet published" and the copy button refuses.
7. **Socials.** Fill in each `url`. An empty URL renders as a labelled placeholder button.
   A filled one becomes a real link that opens in a new tab.
8. **Going live.** Set `demo: false` and `hero.buyUrl` to the client's verified official
   listing. Then remove the "Concept site" flag in `index.html`, the "Illustrative" tape
   labels, the `noindex` robots meta, and the demo sentences in `footer.disclaimer`.
   Keep the risk language.

## What is still placeholder

- The brand: MOONROT, $ROT, the mascot, tagline, lore and all copy.
- Every tokenomics figure: supply, the 70/15/8/7 split, and the notes.
- Network, tax, ownership and audit status, all shown as `[To be confirmed]`.
- Contract address: not shown, by design.
- X and Telegram links: not connected, labelled as demo placeholders.
- Buy buttons: open a demo notice. No wallet connection and no transaction exist anywhere in the code.
