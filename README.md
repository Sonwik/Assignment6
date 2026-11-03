# Assignment 6 – jQuery (Selectors, Effects, Animations)

Abay Zharkyn, group IT 2509.

Only jQuery 3.7.1 is used (a local copy is in each task folder). No other libraries, no `onclick` attributes,
no CSS transitions and no CSS animations – all motion is made with jQuery (`animate()`, `fadeTo()`, `fadeIn()`, `fadeOut()`).

## Run

Open the page in a browser – no build step, no server needed:

- `task1/index.html` – **Task 1. Selector Detective** (the party as an array, 20 cases, each solved with one jQuery chain)
- `task2/index.html` – **Task 2. The party in motion** (spotlight, guest card, move, sort by time, fast clicks)

Avatars are loaded from DiceBear (`https://api.dicebear.com/9.x/open-peeps/svg?seed=Name`). If the service cannot be reached,
the page shows a grey picture with the first letter of the name.

## Files

| File | What it is |
|---|---|
| `task1/party.js` | the party from the picture as an array (rooms, guests) |
| `task1/app.js` | builds the page from the array, the 20 cases (one jQuery chain each) |
| `task2/app.js` | the same cases + the four effects: spotlight, guest card, move, sort |
| `tests/` | browser tests (Playwright): `task1.test.js`, `task2.test.js`, and `screenshots.js` for the report |
| `report/` | the report (`Assignment6_Abay_Zharkyn.docx`), its screenshots and the script that builds it |

## Tests

```
npm install playwright     # once
node tests/task1.test.js   # 20 cases checked against an independent calculation from the array
node tests/task2.test.js   # the check table of Task 2 + fast clicks
```

## The thief (case 20)

Zarina: downstairs (living room), came at 21:10 (after 21:00, before 21:30), has crumbs but no cup,
and stands between two AITU students (Daniel and Natasha).
