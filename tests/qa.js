/*
 * End-to-end QA for the MOONROT concept site.
 *   npm test            (needs Playwright + Chromium: `npm i -D playwright && npx playwright install chromium`)
 *
 * Starts its own copy of serve.js, drives the real page in Chromium and
 * fails loudly on the first broken behaviour.
 */
const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

const PORT = 4400 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}/`;
let passed = 0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
};

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 400));
  const browser = await chromium.launch();

  try {
    // ── Load, assets, console, overflow at every width ──
    for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [], bad = [], external = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
      page.on('request', r => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url()); });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
      await check(`${w}px: no console errors, failed loads or external requests`, async () => {
        assert.deepEqual(errors, []);
        assert.deepEqual(bad, []);
        assert.deepEqual(external, []);
      });
      await check(`${w}px: no horizontal scroll`, async () => {
        const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        assert.ok(o[0] <= o[1], `scrollWidth ${o[0]} > clientWidth ${o[1]}`);
      });
      await check(`${w}px: self-hosted fonts actually loaded`, async () => {
        const ok = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('900 40px Archivo') && document.fonts.check('400 12px "JetBrains Mono"'); });
        assert.ok(ok);
      });
      await check(`${w}px: tap targets at least 44px tall`, async () => {
        const small = await page.evaluate(() => [...document.querySelectorAll('button, .btn, .nav-links a')]
          .filter(e => e.offsetParent && e.getBoundingClientRect().height < 44 && !e.closest('[hidden]'))
          .map(e => e.className || e.textContent.trim()));
        assert.deepEqual(small, []);
      });
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await check('every in-page link points at an element that exists', async () => {
      const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)));
      assert.deepEqual(missing, []);
    });

    for (const id of ['about', 'tokenomics', 'how-to-buy', 'community']) {
      await check(`nav link scrolls to #${id}`, async () => {
        await page.evaluate(() => scrollTo(0, 0));
        await page.click(`.nav-links a[href="#${id}"]`);
        await page.waitForTimeout(1400);
        const top = await page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
        assert.ok(Math.abs(top - 80) < 40, `section top at ${top}px`);
      });
    }

    await check('every buy button opens the demo notice and nothing else', async () => {
      await page.evaluate(() => scrollTo(0, 0));
      const buttons = await page.$$('[data-buy]');
      assert.ok(buttons.length >= 2);
      for (const b of buttons) {
        if (!(await b.isVisible())) continue;
        await b.click();
        assert.ok(await page.isVisible('[data-notice]'));
        assert.match(await page.textContent('[data-notice]'), /does not exist/);
        await page.keyboard.press('Escape');
        assert.ok(!(await page.isVisible('[data-notice]')));
      }
      await page.click('.hero [data-buy]');
      await page.click('[data-notice] button');
      assert.ok(!(await page.isVisible('[data-notice]')));
    });

    await check('placeholder socials announce themselves instead of linking anywhere', async () => {
      const hrefs = await page.$$eval('.social', els => els.map(e => e.getAttribute('href')));
      assert.ok(hrefs.every(h => h === null));
      await page.click('.socials .social >> nth=0');
      assert.match(await page.textContent('[data-toast]'), /Placeholder/);
    });

    await check('contract copy refuses to copy a non-existent address', async () => {
      assert.equal((await page.textContent('[data-contract]')).trim(), 'Not yet published');
      await page.click('[data-copy-contract]');
      assert.match(await page.textContent('[data-toast]'), /No contract address exists/);
    });

    await check('no address-shaped strings anywhere on the page', async () => {
      const text = await page.evaluate(() => document.body.innerText);
      assert.doesNotMatch(text, /0x[a-fA-F0-9]{20,}|[1-9A-HJ-NP-Za-km-z]{32,44}/);
    });

    await check('poking the mascot answers back', async () => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.click('[data-mascot]');
      assert.match(await page.textContent('[data-poke-count]'), /Poked once/);
    });

    await check('keyboard: first Tab lands on the skip link, and it is visible', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => ({ cls: document.activeElement.className, top: document.activeElement.getBoundingClientRect().top }));
      assert.equal(r.cls, 'skip');
      assert.ok(r.top >= 0);
    });

    await check('focus indicator is drawn on buttons', async () => {
      await page.focus('.hero [data-buy]');
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      assert.notEqual(outline, 'none');
    });
    await page.close();

    // ── Mobile menu ──
    const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await m.goto(BASE, { waitUntil: 'networkidle' });
    await check('mobile: menu opens, traps focus, closes on Escape', async () => {
      assert.ok(!(await m.isVisible('.nav-links')));
      await m.click('[data-menu-toggle]');
      await m.waitForTimeout(700);
      assert.equal(await m.getAttribute('[data-menu-toggle]', 'aria-expanded'), 'true');
      assert.ok(await m.isVisible('#mobile-menu a[href="#tokenomics"]'));
      assert.ok(await m.evaluate(() => document.body.classList.contains('menu-open')));
      for (let i = 0; i < 12; i++) await m.keyboard.press('Tab');
      assert.ok(await m.evaluate(() => !!document.activeElement.closest('#mobile-menu, [data-menu-toggle]')));
      await m.keyboard.press('Escape');
      await m.waitForTimeout(700);
      assert.equal(await m.getAttribute('[data-menu-toggle]', 'aria-expanded'), 'false');
      assert.ok(await m.evaluate(() => document.getElementById('mobile-menu').hidden));
      assert.ok(await m.evaluate(() => document.activeElement.matches('[data-menu-toggle]')));
    });
    await check('mobile: menu link closes the menu and lands on the section', async () => {
      await m.click('[data-menu-toggle]');
      await m.waitForTimeout(700);
      await m.click('#mobile-menu a[href="#how-to-buy"]');
      await m.waitForTimeout(1500);
      assert.equal(await m.getAttribute('[data-menu-toggle]', 'aria-expanded'), 'false');
      const top = await m.evaluate(() => document.getElementById('how-to-buy').getBoundingClientRect().top);
      assert.ok(Math.abs(top - 72) < 40, `section top at ${top}px`);
    });
    await check('mobile: menu buy button opens the demo notice', async () => {
      await m.click('[data-menu-toggle]');
      await m.waitForTimeout(700);
      await m.click('#mobile-menu [data-buy]');
      assert.ok(await m.isVisible('[data-notice]'));
    });
    await m.close();

    // ── Reduced motion ──
    const r = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await r.goto(BASE, { waitUntil: 'networkidle' });
    await check('reduced motion: content is visible without scrolling or waiting', async () => {
      const hidden = await r.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length);
      assert.equal(hidden, 0);
      assert.ok(!(await r.evaluate(() => document.documentElement.classList.contains('js-reveal'))));
    });
    await check('reduced motion: marquee and mascot are still', async () => {
      const s = await r.evaluate(() => ({
        marquee: getComputedStyle(document.querySelector('.marquee-track')).animationName,
        smil: document.querySelector('.mascot').animationsPaused(),
      }));
      assert.equal(s.marquee, 'none');
      assert.equal(s.smil, true);
    });
    await r.close();

    // ── No JS: the page still reads ──
    const n = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    await n.goto(BASE);
    await check('without JavaScript the headline and copy are present', async () => {
      assert.match(await n.textContent('h1'), /new/i);
      assert.ok((await n.textContent('.hero-copy')).length > 40);
    });
    await n.close();
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\n${passed} checks passed${process.exitCode ? ', some FAILED' : ''}.`);
})();
