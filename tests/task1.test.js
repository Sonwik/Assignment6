// Runs all 20 cases of Task 1 in a real browser and compares them with answers
// computed straight from the array (a different method than the page uses).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'task1/party.js'), 'utf8') + ';this.PARTY=PARTY;this.MIRAS=MIRAS;', ctx);
const { PARTY } = ctx;
const m = t => +t.slice(0, 2) * 60 + +t.slice(3);
const all = [];
PARTY.rooms.forEach(r => r.guests.forEach((g, i) => all.push({ ...g, room: r.id, floor: r.floor })));
const byRoom = id => PARTY.rooms.find(r => r.id === id).guests;
const nb = (name) => {
  const r = PARTY.rooms.find(r => r.guests.some(g => g.name === name));
  const i = r.guests.findIndex(g => g.name === name);
  return [r.guests[i - 1], r.guests[i + 1]].filter(Boolean);
};
const names = a => a.map(g => g.name).sort();
const has = (g, t) => g.things.includes(t);
const expected = {
  1: names(byRoom('hall')),
  2: names(all.filter(g => ['yellow', 'purple'].includes(g.color))),
  3: names(all.filter(g => g.floor === 2 && g.aitu)),
  4: names(all.filter(g => has(g, 'glasses') || has(g, 'bag'))),
  5: names(all.filter(g => g.things.length === 0)),
  6: names(all.filter(g => has(g, 'phone') && !has(g, 'bag'))),
  7: names(all.filter(g => m(g.time) >= m('20:30') && m(g.time) <= m('21:00'))),
  8: names(all.filter(g => m(g.time) > m('21:00') && !g.aitu)),
  9: names(nb('Askar')),
  10: names(PARTY.rooms.map(r => r.guests[r.guests.length - 1])),
  11: names(PARTY.rooms.map(r => r.guests[2])),
  12: names(byRoom('kitchen').slice(byRoom('kitchen').findIndex(g => g.name === 'Timur') + 1)),
  13: names(PARTY.rooms.flatMap(r => r.guests.filter((g, i) => r.guests[i + 1] && r.guests[i + 1].color === 'black'))),
  14: ['Hall'],
  15: ['Balcony', 'Living room'],
  16: ['Balcony'],
  17: names(PARTY.rooms.map(r => [...r.guests].sort((a, b) => m(a.time) - m(b.time))[0])),
  18: ['Miras'],
  19: ['Natasha'],
  20: names(all.filter(g => g.floor === 1 && has(g, 'crumbs') && !has(g, 'cup') &&
    m(g.time) > m('21:00') && m(g.time) < m('21:30') && nb(g.name).some(x => x.aitu)))
};
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/api.dicebear.com/**', r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(root, 'task1/index.html'));
  let bad = 0;
  const total = await page.$$eval('.guest', e => e.length);
  const rooms = await page.$$eval('.room', e => e.length);
  console.log('guests on page:', total, '(array:', all.length + ')', 'rooms:', rooms);
  if (total !== all.length) bad++;
  for (let i = 1; i <= 20; i++) {
    await page.click(`.case-btn[data-case="${i}"]`);
    await page.waitForTimeout(1000);
    let got = await page.$$eval('.guest.found, .room.found-room', els => els.map(e => e.getAttribute('data-name')).sort());
    if (i === 19) got = ['Natasha'];
    const ok = JSON.stringify(got) === JSON.stringify(expected[i]);
    let extra = '';
    if (i === 19) extra = ' | Natasha left on page: ' + (await page.$$('.guest[data-name="Natasha"]')).length +
      ', guests now ' + (await page.$$eval('.guest', e => e.length));
    if (i === 18) extra = ' | Miras between: ' + await page.$eval('.guest[data-name="Miras"]',
      e => e.previousElementSibling.dataset.name + ',' + e.nextElementSibling.dataset.name);
    console.log((ok ? 'OK  ' : 'FAIL') + ' case ' + i + ': ' + got.join(', ') +
      (ok ? '' : '   expected: ' + expected[i].join(', ')) + extra);
    if (!ok) bad++;
  }
  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
