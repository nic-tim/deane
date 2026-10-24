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
npm test                                                 # 50 checks in Chromium
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

1. **Hero.** A giant wordmark that is always fitted edge to edge, with Deane peeking over it. His eyes follow the pointer and he talks when poked. A round BUY sticker sits on the wordmark. Below it are a contract-address bar and Chart / X / Telegram links.
2. **Tape.** One tilted marquee strip.
3. **Who is Deane?** He is not a dog, a frog, a cat in a hat, or a guy with a roadmap. Just Deane.
4. **The boring part.** Token details as a till receipt, plus three lines on how to buy once it's live.
5. **Find the others.** A "Have you seen Deane?" poster whose tear-off tabs are the community links.
6. **Footer.** The preview note and risk warning.

## Going live

Everything happens in `config.js`:

1. **`links`.** Fill in `buy`, `chart`, `x` and `telegram` with official URLs (and handles). An empty URL stays a labelled placeholder button. A filled one becomes a real link that opens in a new tab.
2. **`contract.address`.** Paste the verified address. The hero bar shows it in full, the receipt shows it shortened, and Copy starts working.
3. **`token.rows`.** Replace each `[TBD]`. Any value still containing `[brackets]` renders grey as a visible placeholder.
4. **`token.howTo`.** Replace `[chain]` with the real chain.
5. **`preview: false`.** Buy buttons then go to `links.buy.url` instead of the notice, and the preview-only lines (the footer note and the poster note) disappear.
6. In `index.html`, remove `<meta name="robots" content="noindex, nofollow">`.
7. Optional: set `deane.src` to supplied artwork to replace the drawn Deane in both the hero and the poster. The poke-to-talk interaction keeps working.
