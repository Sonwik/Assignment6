"""Builds the short report Assignment6_Abay_Zharkyn.docx from the data and screenshots made by tests/screenshots.js."""
import json, pathlib, subprocess
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
SHOTS = HERE / 'screenshots'
REPO = 'https://github.com/Sonwik/assignment6'
cases = {c['id']: c for c in json.load(open(HERE / 'cases.json'))['task1']}

js = (ROOT / 'task1' / 'party.js').read_text()
PARTY = json.loads(subprocess.run(['node', '-e', js + ';console.log(JSON.stringify(PARTY))'],
                                  capture_output=True, text=True, check=True).stdout)

doc = Document()
sec = doc.sections[0]
sec.left_margin = sec.right_margin = Inches(0.7)
sec.top_margin = sec.bottom_margin = Inches(0.6)
st = doc.styles['Normal']; st.font.name = 'Calibri'; st.font.size = Pt(10.5)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Calibri')
for name, size in (('Heading 1', 14), ('Heading 2', 12)):
    s = doc.styles[name]; s.font.name = 'Calibri'; s.font.size = Pt(size); s.font.color.rgb = RGBColor(0x1F, 0x4E, 0x8C)
    s.element.rPr.rFonts.set(qn('w:eastAsia'), 'Calibri')
    s.paragraph_format.space_before = Pt(8); s.paragraph_format.space_after = Pt(3)


def shade(cell, color):
    pr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), color); pr.append(shd)


def para(text='', bold=False, italic=False, size=None, align=None, after=4, style=None, container=None):
    p = (container or doc).add_paragraph(style=style)
    if text:
        r = p.add_run(text); r.bold = bold; r.italic = italic
        if size: r.font.size = Pt(size)
    if align is not None: p.alignment = align
    p.paragraph_format.space_after = Pt(after); p.paragraph_format.space_before = Pt(0)
    return p


def rich(parts, after=4, container=None, size=None):
    p = (container or doc).add_paragraph()
    for text, f in parts:
        r = p.add_run(text)
        if size: r.font.size = Pt(size)
        if f == 'b': r.bold = True
        if f == 'c': r.font.name = 'Consolas'; r.font.size = Pt(9)
    p.paragraph_format.space_after = Pt(after); p.paragraph_format.space_before = Pt(0)
    return p


def code_in(cell, text):
    for line in text.split('\n'):
        p = cell.add_paragraph(); p.paragraph_format.space_after = Pt(0); p.paragraph_format.space_before = Pt(0)
        r = p.add_run(line); r.font.name = 'Consolas'; r.font.size = Pt(7.5)
        r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Consolas')
        pPr = p._p.get_or_add_pPr(); shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), 'EEF1F6'); pPr.append(shd)


def keep_row(row):                       # a row is never split between two pages
    trPr = row._tr.get_or_add_trPr(); el = OxmlElement('w:cantSplit'); trPr.append(el)


def grid_table(cols):
    t = doc.add_table(rows=0, cols=cols); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    return t


def small_table(rows, widths, size=9, header=True):
    t = doc.add_table(rows=len(rows), cols=len(rows[0])); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for j, w in enumerate(widths): t.columns[j].width = Inches(w)
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            c = t.cell(i, j); c.width = Inches(widths[j]); c.text = ''
            p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(val)); r.font.size = Pt(size)
            if header and i == 0: r.bold = True; shade(c, 'D9E4F5')
    para(after=2)
    return t


def picture_in(cell, name, width):
    p = cell.add_paragraph(); p.paragraph_format.space_after = Pt(0)
    p.add_run().add_picture(str(SHOTS / name), width=Inches(width))


# ------------------------------------------------------------------ title
para('Assignment 6. jQuery (Selectors, Effects, Animations)', bold=True, size=18, align=WD_ALIGN_PARAGRAPH.CENTER, after=4)
small_table([['Name', 'Abay Zharkyn', 'Group', 'IT 2509'],
             ['GitHub', REPO, 'Student ID', '250520']], [0.8, 3.6, 0.9, 1.5], size=10, header=False)
para('Only jQuery 3.7.1 is used: no other libraries, no onclick attributes, no CSS transitions or animations. '
     'All motion is made with animate(), fadeTo(), fadeIn() and fadeOut().', size=10)

# ------------------------------------------------------------------ Task 1
doc.add_heading('Task 1. Selector Detective', 1)
doc.add_heading('The party as an array (party.js)', 2)
para('4 rooms with name and floor, 21 guests written from left to right, so the index in the array is the place in the room. '
     'Each guest: name, clothing color, arrival time, AITU (yes/no), things (phone, glasses, bag, cup, crumbs = cake crumbs).', size=10)
rows = [['Room (floor)', 'Guests, left to right: name (color, time, AITU, things)']]
for r in PARTY['rooms']:
    g = '; '.join(f"{x['name']} ({x['color']}, {x['time']}{', AITU' if x['aitu'] else ''}{', ' + '+'.join(x['things']) if x['things'] else ''})" for x in r['guests'])
    rows.append([f"{r['name']} ({r['floor']})", g])
small_table(rows, [1.1, 6.0], size=8.5)

doc.add_heading('How the page is built', 2)
para('buildHouse() reads the array and creates, with jQuery, 2 floors with rooms and a card for every guest (avatar with a ring in the clothing color, '
     'name, time, icons, AITU badge). Avatars: https://api.dicebear.com/9.x/open-peeps/svg?seed=Name. '
     'The data is kept on the card, so the cases search the page and not the array:', size=10, after=2)
for t in ['color, AITU and things are classes: class="guest yellow aitu phone bag";',
          'data-name="Askar", data-time="21:00", data-minutes="1260" (time as minutes, so it is easy to compare);',
          'rooms: id="room-hall", data-floor on the room and on the floor.']:
    para(t, style='List Bullet', size=10, after=0)
para('Before every case the page is built again. A click on a case highlights the found guests/rooms, makes them jump once with animate(), '
     'and prints how many were found. Every case below is one jQuery chain.', size=10, after=3)
rich([('Note: ', 'b'), ('screenshots were made in a test browser without access to the avatar service, so a grey picture with a letter is shown instead of the DiceBear avatar.', '')], size=9, after=3)

doc.add_heading('The 20 cases (chain, result, screenshot)', 2)
EXPL = {
 1: '#room-hall finds the room, the space selects every .guest inside.',
 2: 'A comma means “or”; color is a class.',
 3: 'Attribute selector for floor 2, then only guests with class aitu.',
 4: 'Comma: glasses or bag.',
 5: ':not() once for each of the five things.',
 6: '.phone and :not(.bag) on the same element.',
 7: 'filter() on data-minutes: 1230 (20:30) to 1260 (21:00), both included.',
 8: ':not(.aitu), then filter() minutes > 1260 (strictly after).',
 9: 'prev() is the left neighbor; add() adds the right one (“Askar + .guest”).',
 10: ':last-child of every .guests box.',
 11: ':nth-child(3) counts from 1.',
 12: 'nextAll(): everybody to the right of Timur in his room.',
 13: 'Black guests, then prev(): the one right before each.',
 14: 'closest() goes up from Aruzhan to her .room.',
 15: 'Rooms that do NOT have a 6th guest, so fewer than 6.',
 16: 'Rooms that have a cup and do not have glasses.',
 17: '“Came first” = earliest time: map() sorts each room by data-minutes and takes the first (not the leftmost guest).',
 18: 'Build Miras, hide(), insertAfter(Askar), fadeIn().',
 19: 'fadeOut(), and remove() in the callback after the fade.',
 20: 'Downstairs, crumbs, no cup, 21:00 < time < 21:30, and a neighbor (prev().add(next())) with class aitu. Zarina: neighbors Daniel and Natasha are AITU. '
     'Timur is not: his neighbors Emma and Sergey are not AITU.',
}
t = grid_table(2)
for i in range(1, 21, 2):
    row = t.add_row(); keep_row(row)
    for j in (0, 1):
        n = i + j; c = row.cells[j]; c.width = Inches(3.55)
        p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(1)
        r = p.add_run(f"Case {n}. {cases[n]['title']}"); r.bold = True; r.font.size = Pt(9)
        code_in(c, cases[n]['chain'])
        res = cases[n]['result'].split('→')[-1].strip()
        rich([('Result: ', 'b'), (res, '')], after=0, container=c, size=8.5)
        para(EXPL[n], italic=True, size=8.5, after=1, container=c)
        picture_in(c, f't1_case{n:02d}.png', 3.4)
para(after=2)
rich([('The thief: ', 'b'), ('Zarina', 'b'), (' (living room, 21:10, crumbs, no cup, stands between the AITU students Daniel and Natasha).', '')])

# ------------------------------------------------------------------ Task 2
doc.add_heading('Task 2. The party in motion (folder task2)', 1)
para('A copy of Task 1. The page is built from a working copy of the array (STATE), so a move also changes the array. '
     'Each guest has three layers, and each layer has only one animation, so effects never break each other: '
     '.guest (width/margins: place opens/closes), .slot (left/top: sorting), .gcard (opacity: spotlight).', size=10)
for head, txt in [
    ('Spotlight. ', 'Not found guests fade to 20% with fadeTo(300, 0.2) (for room cases: guests of the other rooms); Clear fades everyone back to 100%. stop(true) before every fade.'),
    ('Guest card. ', 'One card element starts with the size and place of the avatar (offset()) and grows with animate() in 280 ms; it shows the data in words. '
                     'Esc or a click outside shrinks it back into the photo. Variables want/shown keep the right state, and a second guest closes the first card.'),
    ('Move. ', 'The array is changed at once. clone() of the card flies to the new room; the old place closes (width 0, then removed); a new place opens at the end of the new room. '
               'The flight is one animate() from 0 to 1 that reads the live position of the target on every step.'),
    ('Sort by time. ', 'stop(true), remember offset() of every card, reorder the DOM, set left/top to the difference and animate() them to 0 in 600 ms. '
                       'Click again: order by data-seq (picture order).'),
    ('Fast clicks. ', 'Every effect calls stop(true) first and starts from the real current state, so there is no queue; the last click decides the final state.')]:
    rich([(head, 'b'), (txt, '')], after=1, size=10)

figs = [('t2_01_case3_spotlight.png', 'Case 3: only AITU students upstairs stay bright'),
        ('t2_02_clear.png', 'After Clear everybody is bright'),
        ('t2_03_card_growing.png', 'The card grows out of the avatar'),
        ('t2_04_card_open.png', 'The card is open, data in words'),
        ('t2_05_card_shrinking.png', 'Esc: the card shrinks back to the photo'),
        ('t2_06_move_flying.png', 'Arman flies from the hall to the balcony'),
        ('t2_07_after_move.png', 'Arman is last on the balcony, the hall closed the gap'),
        ('t2_08_case1_after_move.png', 'Case 1 now finds 5 guests, not Arman'),
        ('t2_09_sort_sliding.png', 'Living room: the cards slide'),
        ('t2_10_living_sorted.png', 'Sorted: 19:55, 20:20, 20:30, 21:00, 21:10'),
        ('t2_11_living_back.png', 'Second click: picture order'),
        ('t2_12_sort5_fast.png', 'Kitchen after 5 very fast sort clicks')]
t = grid_table(2)
for i in range(0, len(figs), 2):
    row = t.add_row(); keep_row(row)
    for j in (0, 1):
        f, cap = figs[i + j]; c = row.cells[j]; c.width = Inches(3.55)
        p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(0)
        r = p.add_run(f'Fig. {i + j + 1}. {cap}'); r.font.size = Pt(8.5); r.italic = True
        picture_in(c, f, 3.4)
para(after=3)

doc.add_heading('Check table', 2)
small_table([
    ['Check', 'Result'],
    ['Case 3, then Clear', 'Passed: only Aigerim, Ivan, Sophia, Dias, Aruzhan stay bright; Clear returns everybody (Fig. 1–2).'],
    ['Click a guest, then Esc', 'Passed: the card grows 70 → 270 px and shrinks back after Esc (Fig. 3–5).'],
    ['Move Arman to the balcony', 'Passed: he flies in small steps, the hall has 5 guests, case 1 does not find him (Fig. 6–8).'],
    ['Sort the living room twice', 'Passed: Daniel, Inkar, Natasha, Askar, Zarina; then the picture order (Fig. 9–11).'],
    ['Sort 5 times fast', 'Passed: sorted, no card shifted, no animation left (Fig. 12).']], [2.0, 5.1], size=9)
para('Testing: both pages were checked in a real browser (Playwright, folder tests). The 20 cases of Task 1 match a separate calculation from the array; '
     'Task 2 passed the table above and a test with many fast mixed clicks (21 guests, no duplicates, no running animation, no console errors).', size=10)

doc.add_heading('Conclusion', 1)
para('I learned to find elements in different ways: id, class and attribute selectors; :not(), :has(), :last-child, :nth-child(); '
     'prev(), next(), nextAll(), closest(), add(); and filter()/map() for my own rules, for example with time. '
     'Keeping the data in classes and data-* attributes lets one short chain answer a question. '
     'In case 20 two guests had crumbs and no cup, and only checking the neighbors showed the thief is Zarina, not Timur.', size=10)
para('In Task 2 I learned that animations need a clear state: stop(true) before a new animation, one kind of animation per element, '
     'and every change must also be written to the data (the array), not only to the screen. '
     'Reading the real position with offset() made the sliding and the flight smooth even with very fast clicks.', size=10)
rich([('GitHub repository with the source code: ', 'b'), (REPO, '')])

out = HERE / 'Assignment6_Abay_Zharkyn.docx'
doc.save(out)
print('saved', out)
