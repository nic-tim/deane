/*
 * End-to-end QA for the DEANE site.
 *   npm test            (needs Playwright + Chromium: `npm i -D playwright && npx playwright install chromium`)
 *
 * Starts its own copy of serve.js, drives the real page in Chromium and
 * reports every broken behaviour.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PORT = 4400 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}/`;
let passed = 0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message.split('\n').slice(0, 6).join('\n    ')); process.exitCode = 1; }
};

(async () => {
  // ── Source sweep: no leftover branding, no AI talk, no template filler ──
  await check('source has no old branding, AI references or startup filler', async () => {
    const files = ['index.html', 'config.js', 'main.js', 'styles.css'];
    const banned = /moonrot|\$rot\b|artificial|\bA\.?I\.?\b|future of finance|revolutioni[sz]|powered by|web3|next[- ]gen|ecosystem|why choose/i;
    const hits = files.flatMap(f => fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')
      .map((line, i) => banned.test(line) ? `${f}:${i + 1}: ${line.trim().slice(0, 80)}` : null).filter(Boolean));
    assert.deepEqual(hits, []);
  });

  const server = spawn(process.execPath, [path.join(ROOT, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 400));
  const browser = await chromium.launch();

  try {
    // ── Every width: load, assets, overflow, fonts, targets, wordmark fit ──
    for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [], bad = [], external = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
      page.on('request', r => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url()); });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });

      await check(`${w}px: no console errors, failed loads or external requests`, async () => {
        assert.deepEqual(errors, []);
        assert.deepEqual(bad, []);
        assert.deepEqual(external, []);
      });
      await check(`${w}px: no horizontal scroll`, async () => {
        const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        assert.ok(o[0] <= o[1], `scrollWidth ${o[0]} > clientWidth ${o[1]}`);
      });
      await check(`${w}px: all three self-hosted fonts load`, async () => {
        const ok = await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(['900 40px Archivo', '400 12px "JetBrains Mono"', '400 20px "Permanent Marker"'].map(f => document.fonts.load(f)));
          return ['900 40px Archivo', '400 12px "JetBrains Mono"', '400 20px "Permanent Marker"'].every(f => document.fonts.check(f));
        });
        assert.ok(ok);
      });
      await check(`${w}px: wordmark runs edge to edge of the content area`, async () => {
        const r = await page.evaluate(() => {
          const s = document.querySelector('.stage'); const cs = getComputedStyle(s);
          return { want: s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), got: document.querySelector('.wm-inner').getBoundingClientRect().width };
        });
        assert.ok(Math.abs(r.got - r.want) / r.want < 0.02, `wordmark ${r.got.toFixed(0)}px vs content ${r.want.toFixed(0)}px`);
      });
      await check(`${w}px: tap targets at least 44px`, async () => {
        const small = await page.evaluate(() => [...document.querySelectorAll('button, a[href], .btn-buy')]
          .filter(e => e.offsetParent && !e.closest('[hidden], .skip') && getComputedStyle(e).visibility !== 'hidden')
          .filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 24; })
          .map(e => (e.className || e.tagName) + ' "' + e.textContent.trim().slice(0, 20) + '"'));
        assert.deepEqual(small, []);
      });
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await check('brand: DEANE in title, wordmark, nav and footer', async () => {
      assert.match(await page.title(), /^DEANE/);
      assert.equal(await page.getAttribute('h1', 'aria-label'), 'DEANE');
      assert.match(await page.textContent('.nav .brand'), /DEANE/);
      assert.match(await page.textContent('footer'), /DEANE/);
      const text = await page.evaluate(() => document.body.innerText);
      assert.doesNotMatch(text, /moonrot|\$ROT\b/i);
    });

    await check('every in-page link points at an element that exists', async () => {
      const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)));
      assert.deepEqual(missing, []);
    });

    for (const id of ['who', 'token', 'find']) {
      await check(`nav link scrolls to #${id}`, async () => {
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(200);
        await page.click(`.nav-links a[href="#${id}"]`);
        await page.waitForTimeout(1400);
        const top = await page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
        assert.ok(Math.abs(top - 68) < 40, `section top at ${top}px`);
      });
    }

    await check('every visible buy button opens the preview notice', async () => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(1600);
      let opened = 0;
      for (const b of await page.$$('[data-buy]')) {
        if (!(await b.isVisible())) continue;
        await b.click();
        assert.ok(await page.isVisible('[data-notice]'));
        assert.match(await page.textContent('[data-notice]'), /buy link hasn’t been posted/);
        await page.keyboard.press('Escape');
        assert.ok(!(await page.isVisible('[data-notice]')));
        opened++;
      }
      assert.ok(opened >= 2, `only ${opened} buy buttons visible`);
      await page.click('.sticker');
      await page.click('[data-notice] button');
      assert.ok(!(await page.isVisible('[data-notice]')));
    });

    await check('placeholder links never navigate and say they are placeholders', async () => {
      const real = await page.$$eval('[data-quick-links] a, [data-tabs] a', els => els.length);
      assert.equal(real, 0);
      await page.click('[data-quick-links] button >> nth=0');
      assert.match(await page.textContent('[data-toast]'), /isn’t posted yet/);
    });

    await check('poster tabs tear off and come back', async () => {
      await page.locator('.tab').first().scrollIntoViewIfNeeded();
      await page.click('.tab >> nth=1');
      assert.ok(await page.evaluate(() => document.querySelectorAll('.tab')[1].classList.contains('is-torn')));
      assert.match(await page.textContent('[data-toast]'), /Telegram link isn’t posted yet/);
      await page.waitForTimeout(2700);
      assert.ok(await page.evaluate(() => !document.querySelectorAll('.tab')[1].classList.contains('is-torn')));
    });

    await check('contract: nothing address-shaped anywhere, and copy refuses', async () => {
      await page.evaluate(() => scrollTo(0, 0));
      const text = await page.evaluate(() => document.body.innerText);
      assert.doesNotMatch(text, /0x[a-fA-F0-9]{20,}|[1-9A-HJ-NP-Za-km-z]{32,44}/);
      assert.equal((await page.textContent('[data-contract]')).trim(), 'Not published yet');
      await page.click('[data-copy-contract]');
      assert.match(await page.textContent('[data-toast]'), /No contract address has been posted/);
    });

    await check('placeholder token values are marked as placeholders', async () => {
      const r = await page.$$eval('.r-rows dd', dds => dds.map(d => [d.textContent, d.classList.contains('is-placeholder')]));
      assert.ok(r.length >= 4);
      r.forEach(([t, flagged]) => assert.equal(flagged, /\[/.test(t), `"${t}" flagged=${flagged}`));
    });

    await check('poking Deane makes him talk, in order', async () => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.click('[data-deane]');
      assert.equal((await page.textContent('[data-bubble]')).trim(), 'gm.');
      await page.click('[data-deane]');
      assert.equal((await page.textContent('[data-bubble]')).trim(), 'i was here first.');
    });

    await check('Deane’s eyes follow the pointer', async () => {
      await page.mouse.move(10, 10);
      await page.waitForTimeout(400);
      const t = await page.evaluate(() => document.querySelector('svg.deane .pupil').style.transform);
      assert.match(t, /translate\(-/);
    });

    await check('keyboard: first Tab lands on the skip link, focus is visible', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.className), 'skip');
      await page.keyboard.press('Tab');
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
      assert.ok(await m.isVisible('#mobile-menu a[href="#token"]'));
      for (let i = 0; i < 10; i++) await m.keyboard.press('Tab');
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
      await m.click('#mobile-menu a[href="#find"]');
      await m.waitForTimeout(1500);
      assert.equal(await m.getAttribute('[data-menu-toggle]', 'aria-expanded'), 'false');
      const top = await m.evaluate(() => document.getElementById('find').getBoundingClientRect().top);
      assert.ok(Math.abs(top - 60) < 40, `section top at ${top}px`);
      assert.ok(await m.isVisible('[data-menu-toggle]'), 'nav should stay visible after a jump');
    });
    await check('mobile: menu buy button opens the notice and closes the menu', async () => {
      await m.click('[data-menu-toggle]');
      await m.waitForTimeout(700);
      await m.click('#mobile-menu [data-buy]');
      assert.ok(await m.isVisible('[data-notice]'));
      assert.equal(await m.getAttribute('[data-menu-toggle]', 'aria-expanded'), 'false');
    });
    await check('mobile: tapping Deane works with touch', async () => {
      await m.keyboard.press('Escape');
      await m.evaluate(() => scrollTo(0, 0));
      await m.waitForTimeout(300);
      await m.tap('[data-deane]');
      assert.ok(await m.isVisible('[data-bubble]'));
    });
    await m.close();

    // ── Reduced motion ──
    const r = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await r.goto(BASE, { waitUntil: 'networkidle' });
    await check('reduced motion: everything visible at once, nothing scrolling', async () => {
      const s = await r.evaluate(() => ({
        hidden: [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length,
        optedIn: document.documentElement.classList.contains('js-reveal'),
        tape: getComputedStyle(document.querySelector('.tape-track')).animationName,
      }));
      assert.equal(s.hidden, 0);
      assert.equal(s.optedIn, false);
      assert.equal(s.tape, 'none');
    });
    await r.close();

    // ── No JS ──
    const n = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    await n.goto(BASE);
    await check('without JavaScript the wordmark and copy are still there', async () => {
      assert.equal((await n.textContent('h1')).replace(/\s/g, ''), 'DEANE');
      assert.match(await n.textContent('.hero-line'), /Everybody knows a Deane/);
    });
    await n.close();
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\n${passed} checks passed${process.exitCode ? ', some FAILED' : ''}.`);
})();
