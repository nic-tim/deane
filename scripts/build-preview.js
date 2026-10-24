// Bundles the site into one self-contained HTML file (fonts, CSS, config and
// script inlined) for sharing as a single page: `node scripts/build-preview.js`.
// Output: dist/moonrot-preview.html. The source files stay the source of truth.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(root, f)).toString('base64')}`;

let css = read('styles.css').replace(/url\("assets\/fonts\/([^"]+)"\)/g, (m, f) => `url("${dataUri('assets/fonts/' + f, 'font/woff2')}")`);
const html = read('index.html');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const headScript = head.match(/<script>[\s\S]*?<\/script>/)[0];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];

body = body
  .replace('<script src="config.js"></script>', `<script>\n${read('config.js')}\n</script>`)
  .replace('<script src="main.js" defer></script>', `<script>\n${read('main.js')}\n</script>`);

const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<meta name="robots" content="noindex, nofollow">',
  `<link rel="icon" href="${dataUri('assets/favicon.svg', 'image/svg+xml')}">`,
  `<style>\n${css}\n</style>`,
  headScript,
  body.trim(),
].join('\n');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'moonrot-preview.html'), out);
console.log(`dist/moonrot-preview.html  ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
