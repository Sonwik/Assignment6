// Task 2 checks: the five rows of the check table + the "fast clicks" rule.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
let bad = 0;
const check = (name, ok, info) => { console.log((ok ? 'OK   ' : 'FAIL ') + name + (info ? '  [' + info + ']' : '')); if (!ok) bad++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.route('**/api.dicebear.com/**', r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(root, 'task2/index.html'));
  await wait(300);

  const order = room => page.$$eval(`#room-${room} .guests > .guest`, els => els.map(e => e.dataset.name));
  const opac = () => page.$$eval('.guest', els => Object.fromEntries(els.map(e => [e.dataset.name, +(+getComputedStyle(e.querySelector('.gcard')).opacity).toFixed(2)])));
  const settled = async () => {
    await wait(1600);
    return page.evaluate(() => ({ animated: $(':animated').length, flying: $('.flying').length, ghosts: $('.ghost').length, arriving: $('.arriving').length }));
  };

  // ---------- 1. Case 3, then Clear ----------
  await page.click('.case-btn[data-case="3"]');
  await wait(600);
  let o = await opac();
  const bright = Object.keys(o).filter(n => o[n] === 1).sort();
  check('Case 3: only the AITU students upstairs stay bright', JSON.stringify(bright) === JSON.stringify(['Aigerim', 'Aruzhan', 'Dias', 'Ivan', 'Sophia']), bright.join(','));
  check('Case 3: everybody else is at 20%', Object.keys(o).filter(n => !bright.includes(n)).every(n => o[n] === 0.2));
  await page.click('#clear-btn'); await wait(600);
  o = await opac();
  check('Clear: everybody is bright again', Object.values(o).every(v => v === 1));

  // a room case: guests of all other rooms are pale
  await page.click('.case-btn[data-case="14"]'); await wait(600);
  o = await opac();
  const brightRoom = Object.keys(o).filter(n => o[n] === 1).sort();
  check('Case 14 (a room case): only the hall guests stay bright', JSON.stringify(brightRoom) === JSON.stringify(['Arman', 'Aruzhan', 'Bekzat', 'Dias', 'Saule', 'Sophia']), brightRoom.join(','));
  await page.click('#clear-btn'); await wait(500);

  // ---------- 2. Guest card grows from the avatar, Esc shrinks it ----------
  const av = await page.$eval('.guest[data-name="Arman"] .avatar', e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  await page.click('.guest[data-name="Arman"]');
  const sizes = [];
  for (let i = 0; i < 6; i++) { sizes.push(await page.$eval('#info', e => Math.round(e.getBoundingClientRect().width))); await wait(60); }
  await wait(400);
  const full = await page.$eval('#info', e => ({ w: Math.round(e.getBoundingClientRect().width), text: e.innerText }));
  check('Card starts about the size of the avatar', sizes[0] < 150, 'first sizes ' + sizes.join(','));
  check('Card grows (not a jump)', sizes.some(s => s > sizes[0] && s < full.w), 'full ' + full.w);
  check('Card text in words', /Came at 20:35/.test(full.text) && /Not an AITU student/.test(full.text) && /Has a bag and glasses/.test(full.text) && /Move to the balcony/.test(full.text) && !/Move to the hall/.test(full.text), full.text.replace(/\n+/g, ' | '));
  await page.keyboard.press('Escape');
  await wait(100);
  const mid = await page.$eval('#info', e => Math.round(e.getBoundingClientRect().width));
  await wait(500);
  const hidden = await page.$eval('#info', e => getComputedStyle(e).display);
  check('Esc: card shrinks back and hides', mid < full.w && hidden === 'none', 'mid-shrink ' + mid + ', display ' + hidden);

  await page.click('.guest[data-name="Dias"]'); await wait(500);
  await page.mouse.click(5, 500); await wait(500);
  check('Click outside closes the card', (await page.$eval('#info', e => getComputedStyle(e).display)) === 'none');

  await page.click('.guest[data-name="Dias"]'); await wait(500);
  await page.click('.guest[data-name="Saule"]'); await wait(900);
  const one = await page.$$eval('#info', e => e.length), title = await page.$eval('#info h2', e => e.textContent);
  check('Only one card: the second guest replaces the first', one === 1 && title === 'Saule', title);
  await page.keyboard.press('Escape'); await wait(500);

  // fast clicks on a guest: final state must match the last click
  // (the open card covers its own guest, so the clicks are sent from the page, 30 ms apart)
  const fastClicks = (sel, n, gap) => page.evaluate(async ([sel, n, gap]) => {
    for (let i = 0; i < n; i++) { document.querySelector(sel).click(); await new Promise(r => setTimeout(r, gap)); }
  }, [sel, n, gap]);
  await fastClicks('.guest[data-name="Daniel"]', 7, 30);
  await wait(700);
  const afterOdd = await page.$eval('#info', e => getComputedStyle(e).display);
  const stCard = await page.evaluate(() => ({ animated: $(':animated').length }));
  check('7 fast clicks on a guest: the card is open (odd number), no queue', afterOdd === 'block' && stCard.animated === 0, JSON.stringify(stCard));
  await fastClicks('.guest[data-name="Daniel"]', 6, 30);
  await wait(700);
  check('6 more fast clicks (even number): the card is still open', (await page.$eval('#info', e => getComputedStyle(e).display)) === 'block');
  await fastClicks('.guest[data-name="Daniel"]', 1, 30);
  await wait(700);
  check('One more click: the card is closed', (await page.$eval('#info', e => getComputedStyle(e).display)) === 'none');
  await page.evaluate(async () => {
    for (const n of ['Aliya', 'Madina', 'Ivan', 'Sophia', 'Dias', 'Saule']) { document.querySelector('.guest[data-name="' + n + '"]').click(); await new Promise(r => setTimeout(r, 40)); }
  });
  await wait(900);
  check('Fast clicks on 6 different guests: one card, the last guest', (await page.$$eval('#info', e => e.length)) === 1 && (await page.$eval('#info h2', e => e.textContent)) === 'Saule');
  await page.keyboard.press('Escape'); await wait(600);

  // ---------- 3. Move Arman to the balcony ----------
  await page.click('.guest[data-name="Arman"]'); await wait(500);
  await page.click('.move-btn[data-to="balcony"]');
  const track = [];
  for (let i = 0; i < 9; i++) {
    track.push(await page.evaluate(() => { const f = document.querySelector('.flying'); if (!f) return null; const r = f.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; }));
    await wait(100);
  }
  const flightPts = track.filter(Boolean);
  const steps = flightPts.slice(1).map((p, i) => Math.hypot(p[0] - flightPts[i][0], p[1] - flightPts[i][1]));
  check('Arman flies (many small steps, no jump)', flightPts.length >= 5 && Math.max(...steps) < 450, 'positions ' + JSON.stringify(flightPts) + ' max step ' + Math.round(Math.max(...steps)));
  const midHall = await order('hall');
  const st = await settled();
  const bal = await order('balcony'), hall = await order('hall');
  check('Arman is the last guest on the balcony', bal[bal.length - 1] === 'Arman', bal.join(','));
  check('The hall closed the gap', !hall.includes('Arman') && hall.length === 5, hall.join(','));
  check('Hall place closed slowly (ghost existed during flight)', midHall.length === 5);
  check('No leftovers after the move', st.animated === 0 && st.flying === 0 && st.ghosts === 0 && st.arriving === 0, JSON.stringify(st));
  await page.click('.case-btn[data-case="1"]'); await wait(900);
  const c1 = await page.$$eval('.guest.found', e => e.map(x => x.dataset.name).sort());
  check('Case 1 no longer finds Arman', !c1.includes('Arman') && c1.length === 5, c1.join(','));
  const c1room = await page.$eval('.guest[data-name="Arman"]', e => e.closest('.room').dataset.room);
  check('After a rebuild Arman is still on the balcony (array changed)', c1room === 'balcony');

  // ---------- 4. Sort the living room twice ----------
  await page.click('#clear-btn'); await wait(400);
  const before = await order('living');
  await page.click('.sort-btn[data-room="living"]');
  const slide = [];
  for (let i = 0; i < 6; i++) { slide.push(await page.$$eval('#room-living .slot', els => els.map(e => Math.round(e.getBoundingClientRect().left)))); await wait(100); }
  const s1 = await order('living');
  await wait(700);
  check('Living room sorted: 19:55, 20:20, 20:30, 21:00, 21:10', JSON.stringify(s1) === JSON.stringify(['Daniel', 'Inkar', 'Natasha', 'Askar', 'Zarina']), s1.join(','));
  const moved = slide.some((row, i) => i && row.some((x, j) => x !== slide[i - 1][j]));
  check('Cards slide (positions change step by step)', moved, JSON.stringify(slide.slice(0, 3)));
  await page.click('.sort-btn[data-room="living"]'); await wait(900);
  const s2 = await order('living');
  check('Sorted again: back to the picture order', JSON.stringify(s2) === JSON.stringify(before), s2.join(','));

  // ---------- 5. Sort 5 times fast ----------
  const sortedTimes = n => page.$$eval(`#room-${n} .guests > .guest`, els => els.map(e => +e.dataset.minutes));
  for (let i = 0; i < 5; i++) { await page.click('.sort-btn[data-room="kitchen"]', { delay: 0 }); await wait(40); }
  const st2 = await settled();
  const kt = await sortedTimes('kitchen');
  check('Sort 5 times fast: kitchen ends sorted', kt.every((v, i) => !i || kt[i - 1] <= v), kt.join(','));
  const offs = await page.$$eval('#room-kitchen .slot', els => els.map(e => [e.style.left, e.style.top]));
  check('No card left shifted or shaking', st2.animated === 0 && offs.every(([l, t]) => (l === '0px' || l === '') && (t === '0px' || t === '')), JSON.stringify(offs));
  for (let i = 0; i < 6; i++) { await page.click('.sort-btn[data-room="balcony"]', { delay: 0 }); await wait(25); }
  await settled();
  const bo = await order('balcony');
  check('Sort 6 times fast: balcony back in picture order (with Arman last)', JSON.stringify(bo) === JSON.stringify(['Aigerim', 'Aliya', 'Madina', 'Ivan', 'Arman']), bo.join(','));

  // mixed chaos: moves, cases, sorts, guest clicks as fast as possible
  for (let i = 0; i < 4; i++) {
    await page.click('.guest[data-name="Kamila"]'); await wait(450);
    await page.click('.move-btn >> nth=' + (i % 3), { delay: 0 }); await wait(40);
    await page.click('.sort-btn[data-room="hall"]', { delay: 0 });
    await page.click('.case-btn[data-case="' + (2 + i) + '"]', { delay: 0 });
    await page.click('#clear-btn', { delay: 0 });
  }
  const st3 = await settled();
  const total = await page.$$eval('.guest', e => e.length);
  const names = await page.$$eval('.guest', e => e.map(x => x.dataset.name));
  check('After chaos: 21 guests, no duplicates, no animation left', total === 21 && new Set(names).size === 21 && st3.animated === 0 && st3.flying === 0 && st3.ghosts === 0, JSON.stringify(st3) + ' total ' + total);
  // rooms in the DOM equal the array
  const consistent = await page.evaluate(() => STATE.every(r => $('#room-' + r.id + ' .guest').length === r.guests.length));
  check('The page matches the array (STATE)', consistent);

  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
