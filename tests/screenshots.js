// Takes the screenshots for the report and saves the chains + results of all cases as JSON.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'report', 'screenshots');
fs.mkdirSync(out, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/api.dicebear.com/**', r => r.abort());
  const shot = async (name, from = '#result', pad = 12) => {
    const a = await page.$eval(from, e => { const r = e.getBoundingClientRect(); return r.top + scrollY; });
    const b = await page.$eval('#house', e => { const r = e.getBoundingClientRect(); return r.bottom + scrollY; });
    await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true, clip: { x: 0, y: Math.max(0, a - pad), width: 1440, height: b - a + pad * 2 } });
  };
  const meta = { task1: [], task2: {} };

  // ---------------- Task 1 ----------------
  await page.goto('file://' + path.join(root, 'task1/index.html'));
  await wait(300);
  await page.screenshot({ path: path.join(out, 't1_00_page.png'), fullPage: true });
  for (let i = 1; i <= 20; i++) {
    await page.click(`.case-btn[data-case="${i}"]`);
    await wait(1100);
    const info = await page.evaluate(i => {
      const c = CASES.find(c => c.id === i);
      return { id: i, title: c.title, chain: chainText(c.run), result: document.querySelector('#result .result-line').textContent };
    }, i);
    meta.task1.push(info);
    await page.evaluate(() => $('#result .result-code').hide());   // the chain is printed in the report text
    await shot('t1_case' + String(i).padStart(2, '0'), '#result', 6);
  }

  // ---------------- Task 2 ----------------
  await page.goto('file://' + path.join(root, 'task2/index.html'));
  await wait(300);
  await page.screenshot({ path: path.join(out, 't2_00_page.png'), fullPage: true });

  await page.click('.case-btn[data-case="3"]'); await wait(900);
  await shot('t2_01_case3_spotlight');
  await page.click('#clear-btn'); await wait(700);
  await shot('t2_02_clear');
  await page.click('.case-btn[data-case="14"]'); await wait(900);
  await shot('t2_02b_room_case14_spotlight');
  await page.click('#clear-btn'); await wait(700);

  await page.click('.guest[data-name="Arman"]'); await wait(90);
  await shot('t2_03_card_growing');
  await wait(600);
  await shot('t2_04_card_open');
  await page.keyboard.press('Escape'); await wait(70);
  await shot('t2_05_card_shrinking');
  await wait(600);
  await shot('t2_05b_card_closed');

  await page.click('.guest[data-name="Arman"]'); await wait(500);
  await page.click('.move-btn[data-to="balcony"]'); await wait(300);
  await shot('t2_06_move_flying');
  await wait(1500);
  await shot('t2_07_after_move');
  await page.click('.case-btn[data-case="1"]'); await wait(1000);
  await shot('t2_08_case1_after_move');
  await page.click('#clear-btn'); await wait(600);

  await page.click('.sort-btn[data-room="living"]'); await wait(200);
  await shot('t2_09_sort_sliding');
  await wait(800);
  await shot('t2_10_living_sorted');
  await page.click('.sort-btn[data-room="living"]'); await wait(1000);
  await shot('t2_11_living_back');

  for (let i = 0; i < 5; i++) { await page.click('.sort-btn[data-room="kitchen"]', { delay: 0 }); await wait(40); }
  await wait(1500);
  await shot('t2_12_sort5_fast');

  fs.writeFileSync(path.join(root, 'report', 'cases.json'), JSON.stringify(meta, null, 2));
  console.log('screenshots:', fs.readdirSync(out).length);
  await browser.close();
})();
