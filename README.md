# DEANE ($DEANE)

Website for the DEANE meme coin. Everybody knows a Deane.

The page is a preview build. No contract address, chain, supply, tax, liquidity,
listing or community link has been supplied, so every one of them is shown as a
clearly marked placeholder. None of them has been made up.

## Run it

Requires Node 18+. There are no runtime dependencies.

```bash
npm start            # http://localhost:4321  (or: node serve.js 8080)
```

Opening `index.html` directly in a browser also works.

## Test it

```bash
npm run check                                            # syntax check
npm i -D playwright && npx playwright install chromium   # once
npm test                                                 # 58 checks in Chromium
```

`tests/qa.js` covers the following:

- A source sweep that fails on old branding, references to artificial intelligence, or startup filler ("future of finance", "Web3", "powered by"…).
- At 320, 390, 768, 1024, 1440 and 1920px:
  - no console errors, failed loads or third-party requests
  - no horizontal scroll
  - all three fonts load
  - the wordmark runs exactly edge to edge
  - tap targets are at least 44px
- Navigation and anchors, the buy notice from every buy button, placeholder links that never navigate, and poster tabs that tear and come back.
- Contract copy that refuses to copy a missing address, and placeholder receipt values that are visibly marked.
- Deane talks when poked and his eyes follow the pointer.
- The mobile menu traps focus, closes on Escape, and closes on navigation.
- Keyboard focus, reduced motion, and the no-JavaScript version.

## Files

| File | What it is |
|---|---|
| `config.js` | **Everything replaceable:** name, ticker, colours, links, copy, receipt rows, Deane's lines, disclaimers. |
| `index.html` | Page structure and the inline SVG of Deane. |
| `styles.css` | Tokens at the top, then one block per section, then responsive rules and reduced motion. |
| `main.js` | Applies the config, fits the wordmark, and runs the menu, links, notice, tear-off tabs and Deane. No libraries. |
| `assets/` | Self-hosted fonts (licences in `assets/fonts/LICENSE.md`) and the favicon. |
| `serve.js` | Zero-dependency static server. |
| `scripts/build-preview.js` | Bundles everything into one HTML file in `dist/` for sharing. |
| `tests/qa.js` | Playwright QA suite. |

## The page

The page is built around one job: get a visitor from "who is this guy" to the
correct, official place to buy, with nothing to second-guess on the way.

1. **Hero.** Edge-to-edge wordmark with Deane peeking over it, and a BUY sticker. Below sits the contract bar (network, address and Copy) and links for How to buy, Chart, X and Telegram.
2. **Who is Deane?** The meme in four crossed-out lines and one sentence.
3. **How to buy $DEANE.** Four beginner steps:
   - Step 3 has the contract and a Copy button inline.
   - Step 4 has the Buy button inline.
   - A safety warning sits under the steps.

   Beside the steps, the **official details** receipt (sticky on desktop) lists ticker, network, contract (with Copy), the buy venue, supply and tax, plus Buy, Chart and Explorer links.
4. **Find the others.** The "Have you seen Deane?" poster, whose tear-off tabs are the official X, Telegram and Chart links.
5. **Footer.** Section links, the official links again, the preview note and the risk warning.

The nav never hides, so **Buy $DEANE** stays one tap away on every screen, phones included.

## Going live

Every official fact is set **once** in `config.js` and appears everywhere from there:

| Field | Shows up in |
|---|---|
| `network.name`, `network.nativeCoin` | hero bar, steps 1–2, receipt |
| `contract.address` | hero bar, step 3, receipt (all with Copy) |
| `links.buy` (`venue`, `url`) | every Buy button, step 4, receipt |
| `links.chart`, `links.explorer` | hero bar, receipt, poster, footer |
| `links.x`, `links.telegram` | hero bar, poster tabs, footer |
| `token.rows` | receipt. Add `proof: 'https://…'` to show a "verify" link |

Then set `preview: false` and remove the `noindex` robots meta tag in
`index.html`. Any value still in `[brackets]` stays visibly grey, so a missed
placeholder is obvious. The test suite includes a go-live rehearsal that fills
every field with test values and checks the real buy link, copy, verify links
and that no placeholder or preview label remains.

Optional: set `deane.src` to supplied artwork to replace the drawn Deane.
