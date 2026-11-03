/* Task 2 – The party in motion
   A copy of Task 1 with four animated effects, all done with jQuery:
   1. Spotlight  – found guests stay bright, the others fade to 20% (fadeTo)
   2. Guest card – grows out of the avatar, closes with Esc / outside click
   3. Move       – the card flies to the new room, the old place closes, the new one opens
   4. Sort       – cards slide to their new places (offset() + animate())
   The page is always built from STATE, so a move changes the array too. */

const ICONS = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };
const ICON_TITLES = { phone: 'Phone', glasses: 'Glasses', bag: 'Bag', cup: 'Cup', crumbs: 'Cake crumbs' };
const THINGS_IN_WORDS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };

const GUEST_W = 100, GUEST_MARGIN = 3;        // layout of one guest place (see style.css)
let STATE;                                    // working copy of the party (moves change it)
let sorted = {};                              // room id -> is the room sorted by time now?
let flights = [];                             // running flights, so a rebuild can stop them

function resetState() { STATE = JSON.parse(JSON.stringify(PARTY.rooms)); }
function roomState(id) { return STATE.find(function (r) { return r.id === id; }); }

function toMinutes(time) {
  const p = time.split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}
function avatarUrl(name) {
  return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name);
}
function fallbackAvatar(name) {               // used only if the avatar service cannot be reached
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dfe6ee"/>' +
    '<circle cx="40" cy="32" r="14" fill="#9aa8ba"/><path d="M12 80c2-20 14-28 28-28s26 8 28 28z" fill="#9aa8ba"/>' +
    '<text x="40" y="47" font-family="Arial" font-size="26" font-weight="700" text-anchor="middle" fill="#fff">' + name.charAt(0) + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function makeAvatar(g) {
  const $img = $('<img>', { alt: g.name, draggable: false })
    .on('error', function () { $(this).off('error').attr('src', fallbackAvatar(g.name)); })
    .attr('src', avatarUrl(g.name));
  const $avatar = $('<div class="avatar">').append($img);
  if (g.aitu) $avatar.append($('<span class="badge" title="AITU student">🎓</span>'));
  return $avatar;
}

/* One guest card. Layers (each one has its own job, so effects never fight):
   .guest  – the place in the room: classes + data-*, width/margin animation
   .slot   – slides to a new place when the room is sorted (left/top)
   .gcard  – the card itself: opacity for the spotlight                       */
function makeGuestCard(g, seq) {
  const classes = ['guest', g.color, g.aitu ? 'aitu' : ''].concat(g.things).filter(Boolean).join(' ');
  const $guest = $('<div>', { 'class': classes })
    .attr({
      'data-name': g.name,
      'data-time': g.time,
      'data-minutes': toMinutes(g.time),
      'data-color': g.color,
      'data-aitu': g.aitu ? 'yes' : 'no',
      'data-things': g.things.join(' '),
      'data-seq': seq                         // place in the picture order of its room
    });
  const $things = $('<div class="things">');
  $.each(g.things, function (i, t) {
    $things.append($('<span>', { 'class': 'ico ico-' + t, title: ICON_TITLES[t], text: ICONS[t] }));
  });
  const $card = $('<div class="gcard">').attr('data-color', g.color).append(
    makeAvatar(g),
    $('<div class="gname">').text(g.name),
    $('<div class="gtime">').text('🕒 ' + g.time),
    $things
  );
  return $guest.append($('<div class="slot">').append($card));
}

function makeRoom(room) {
  const $room = $('<div class="room">')
    .attr({ id: 'room-' + room.id, 'data-room': room.id, 'data-name': room.name, 'data-floor': room.floor });
  $room.append($('<div class="room-head">').append(
    $('<h3>').text(room.name),
    $('<button type="button" class="sort-btn">Sort by time</button>').attr('data-room', room.id)
  ));
  const $guests = $('<div class="guests">').appendTo($room);
  $.each(room.guests, function (i, g) { $guests.append(makeGuestCard(g, i)); });
  return $room;
}

function stopFlights() {
  $.each(flights, function (i, f) { $(f).stop(true); });
  flights = [];
  $('.flying').remove();
}

/* Builds the whole page again from STATE: 2 floors, rooms on each floor. */
function buildHouse() {
  stopFlights();
  hideInfoNow();
  sorted = {};
  const $house = $('#house').empty();
  $.each([2, 1], function (i, floor) {
    const $rooms = $('<div class="rooms">');
    $.each(STATE, function (j, room) {
      if (room.floor === floor) $rooms.append(makeRoom(room));
    });
    $house.append($('<div class="floor">').attr('data-floor', floor)
      .append($('<div class="floor-label">').text('FLOOR ' + floor), $rooms));
  });
}

/* ------------------------------------------------------------------
   THE 20 CASES – the same one-chain solutions as in Task 1.
   Times are minutes: 20:30 = 1230, 21:00 = 1260, 21:30 = 1290.
------------------------------------------------------------------ */
const CASES = [
  { id: 1, kind: 'guests', title: 'Who is in the hall?',
    run: () => $('#room-hall .guest') },
  { id: 2, kind: 'guests', title: 'Who is dressed in yellow or purple?',
    run: () => $('.guest.yellow, .guest.purple') },
  { id: 3, kind: 'guests', title: 'Which AITU students are upstairs?',
    run: () => $('.floor[data-floor="2"] .guest.aitu') },
  { id: 4, kind: 'guests', title: 'Who has glasses or a bag?',
    run: () => $('.guest.glasses, .guest.bag') },
  { id: 5, kind: 'guests', title: 'Who came with nothing at all?',
    run: () => $('.guest:not(.phone):not(.glasses):not(.bag):not(.cup):not(.crumbs)') },
  { id: 6, kind: 'guests', title: 'Who has a phone but no bag?',
    run: () => $('.guest.phone:not(.bag)') },
  { id: 7, kind: 'guests', title: 'Who arrived between 20:30 and 21:00, both included?',
    run: () => $('.guest').filter(function () {
      const m = $(this).data('minutes');
      return m >= 1230 && m <= 1260;
    }) },
  { id: 8, kind: 'guests', title: 'Who arrived after 21:00 and is not an AITU student?',
    run: () => $('.guest:not(.aitu)').filter(function () {
      return $(this).data('minutes') > 1260;
    }) },
  { id: 9, kind: 'guests', title: 'Who stands right next to Askar?',
    run: () => $('.guest[data-name="Askar"]').prev().add('.guest[data-name="Askar"] + .guest') },
  { id: 10, kind: 'guests', title: 'Who stands last in each room?',
    run: () => $('.room .guest:last-child') },
  { id: 11, kind: 'guests', title: 'Who stands third in each room?',
    run: () => $('.room .guest:nth-child(3)') },
  { id: 12, kind: 'guests', title: 'Who stands after Timur in his room?',
    run: () => $('.guest[data-name="Timur"]').nextAll() },
  { id: 13, kind: 'guests', title: 'Who stands right before someone in black?',
    run: () => $('.guest.black').prev() },
  { id: 14, kind: 'rooms', title: 'In which room is Aruzhan?',
    run: () => $('.guest[data-name="Aruzhan"]').closest('.room') },
  { id: 15, kind: 'rooms', title: 'Which rooms have fewer than 6 guests?',
    run: () => $('.room:not(:has(.guest:nth-child(6)))') },
  { id: 16, kind: 'rooms', title: 'In which rooms does somebody have a cup, but nobody wears glasses?',
    run: () => $('.room:has(.guest.cup):not(:has(.guest.glasses))') },
  { id: 17, kind: 'guests', title: 'Who came first to each room?',
    run: () => $('.room').map(function () {
      return $(this).find('.guest').get().sort((a, b) => $(a).data('minutes') - $(b).data('minutes'))[0];
    }) },
  { id: 18, kind: 'added', title: 'Miras (AITU, blue, 21:20, phone) comes and stands between Askar and Inkar.',
    run: () => makeGuestCard(MIRAS, 99).hide().insertAfter('.guest[data-name="Askar"]').fadeIn(700) },
  { id: 19, kind: 'removed', title: 'Natasha says goodbye: her card fades away and is removed.',
    run: () => $('.guest[data-name="Natasha"]').fadeOut(700, function () { $(this).remove(); }) },
  { id: 20, kind: 'guests', title: 'Who took the cake?',
    run: () => $('.floor[data-floor="1"] .guest.crumbs:not(.cup)')
      .filter(function () { const m = $(this).data('minutes'); return m > 1260 && m < 1290; })
      .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; }) }
];

function chainText(fn) {
  return fn.toString().replace(/^\(\)\s*=>\s*/, '').replace(/\n {4,6}/g, '\n  ').trim();
}
function namesOf($set) {
  return $set.map(function () { return $(this).attr('data-name'); }).get();
}
function jump($els) {                          // jump once with animate()
  $els.stop(true, true).animate({ top: -16 }, 140).animate({ top: 0 }, 140);
}
function showResult(c, names, noun) {
  const $line = $('#result .result-line').empty();
  $line.append($('<b>').text('Case ' + c.id + ': '), document.createTextNode(c.title + '  →  '));
  $line.append($('<strong>').text(names.length + ' ' + noun + (names.length === 1 ? '' : 's')));
  if (names.length) $line.append(document.createTextNode(': ' + names.join(', ')));
  $('#result .result-code').text(chainText(c.run)).show();
}

/* ---------- 1. Spotlight ----------
   Found guests stay bright; everybody else fades to 20% in 0.3 s.
   When the case finds rooms, the guests of all the other rooms fade.   */
function spotlight($found, kind) {
  let $others;
  if (kind === 'rooms') {
    $others = $('.guest').filter(function () { return !$(this).closest('.room').is($found); });
  } else {
    $others = $('.guest').not($found);
  }
  const $bright = (kind === 'rooms') ? $('.guest').not($others) : $found;
  $bright.find('.gcard').stop(true).fadeTo(300, 1);
  $others.find('.gcard').stop(true).fadeTo(300, 0.2);
}

function clearAll() {
  $('.guest').removeClass('found').find('.gcard').stop(true).fadeTo(300, 1);
  $('.room').removeClass('found-room');
  $('.case-btn').removeClass('active');
  $('#result .result-line').text('Choose a case above.');
  $('#result .result-code').hide();
}

function runCase(c) {
  buildHouse();                                // always start from the current party
  $('.case-btn').removeClass('active').filter('[data-case="' + c.id + '"]').addClass('active');

  const $found = c.run();                      // the one jQuery chain
  const names = namesOf($found);

  if (c.kind === 'rooms') {
    $found.addClass('found-room');
    jump($found.find('.room-head'));
    showResult(c, names, 'room');
    spotlight($found, 'rooms');
  } else if (c.kind === 'guests') {
    $found.addClass('found');
    jump($found.find('.avatar'));
    showResult(c, names, 'guest');
    spotlight($found, 'guests');
  } else if (c.kind === 'added') {             // Miras fades in; he is the one in the spotlight
    showResult(c, names, 'new guest');
    spotlight($found, 'guests');
    $found.promise().done(function () {
      $found.addClass('found');
      jump($found.find('.avatar'));
    });
  } else {                                     // Natasha fades out and is removed: nobody to highlight
    showResult(c, names, 'guest');
    $('#result .result-line').append(document.createTextNode(' (removed from the page)'));
  }
}

/* ---------- 2. Guest card ----------
   One card element (#info). It starts as small as the avatar, on the avatar,
   and grows to full size. Closing shrinks it back into the photo.
   `want` is the guest the user asked for last; `shown` is the guest whose
   content is in the card. Every request first stops the running animation
   with stop(true), so fast clicking never builds a queue.                  */
const $info = $('<div id="info" class="info">').appendTo('body');
let want = null, shown = null, lastRect = null, lastFull = null;

function avatarRect(name) {
  const $a = $('.guest[data-name="' + name + '"] .avatar').first();
  if (!$a.length) return null;
  const o = $a.offset();
  return { left: o.left, top: o.top, width: $a.outerWidth(), height: $a.outerHeight() };
}

function thingsInWords(things) {
  if (!things.length) return 'Has nothing with them';
  const w = things.map(function (t) { return THINGS_IN_WORDS[t]; });
  const last = w.pop();
  return 'Has ' + (w.length ? w.join(', ') + ' and ' + last : last);
}

function fillInfo(name) {
  const $g = $('.guest[data-name="' + name + '"]');
  const things = ($g.attr('data-things') || '').split(' ').filter(Boolean);
  const $room = $g.closest('.room');
  const roomId = $room.attr('data-room');
  const g = { name: name, color: $g.attr('data-color'), aitu: $g.attr('data-aitu') === 'yes' };

  const $head = $('<div class="info-head">').append(
    $('<div class="gcard">').attr('data-color', g.color).append(makeAvatar(g)).css('width', 70),
    $('<div>').append($('<h2>').text(name),
      $('<div class="room-line">').text('In the ' + $room.attr('data-name').toLowerCase() + ', floor ' + $room.attr('data-floor')))
  );
  const $list = $('<ul>').append(
    $('<li>').text('Came at ' + $g.attr('data-time')),
    $('<li>').text(g.aitu ? 'AITU student' : 'Not an AITU student'),
    $('<li>').text('Wears ' + g.color),
    $('<li>').text(thingsInWords(things))
  );
  const $moves = $('<div>').append($('<div class="move-title">').text('Move this guest'));
  $.each(STATE, function (i, r) {
    if (r.id === roomId) return;
    $moves.append($('<button type="button" class="move-btn">')
      .attr({ 'data-guest': name, 'data-to': r.id })
      .text('Move to the ' + r.name.toLowerCase()));
  });
  $info.empty().append($('<div class="info-inner">').append($head, $list, $moves));
}

function placeNear(r, W, H) {
  const docW = $(document).width(), sTop = $(window).scrollTop(), vh = $(window).height();
  const left = Math.max(8, Math.min(r.left + r.width / 2 - W / 2, docW - W - 8));
  const top = Math.max(sTop + 8, Math.min(r.top - 20, sTop + vh - H - 8));
  return { left: left, top: top };
}

function growFrom(name) {
  const r = avatarRect(name);
  if (!r) return;
  lastRect = r;
  fillInfo(name);
  $info.stop(true).css({ display: 'block', visibility: 'hidden', width: 270, height: 'auto', left: -9999, top: 0, opacity: 1 });
  const W = 270, H = $info.outerHeight();
  const t = placeNear(r, W, H);
  shown = name;
  lastFull = { left: t.left, top: t.top, width: W, height: H };
  $info.css({ visibility: 'visible', left: r.left, top: r.top, width: r.width, height: r.height, opacity: 0.3 })
    .animate({ left: t.left, top: t.top, width: W, height: H, opacity: 1 }, 280);
}

function shrinkTo(name, done) {
  const r = avatarRect(name) || lastRect;
  if (!r) { hideInfoNow(); if (done) done(); return; }
  $info.stop(true).animate({ left: r.left, top: r.top, width: r.width, height: r.height, opacity: 0 }, 220, function () {
    $info.hide();
    shown = null;
    if (done) done();
  });
}

function hideInfoNow() { want = null; shown = null; $info.stop(true).hide(); }

function showCard(name) {
  want = name;
  if ($info.is(':visible')) {
    if (shown === name) {                      // it was closing: open it again from where it is
      $info.stop(true).animate({ left: lastFull.left, top: lastFull.top, width: lastFull.width, height: lastFull.height, opacity: 1 }, 220);
      return;
    }
    shrinkTo(shown, function () { if (want) growFrom(want); });   // the first card closes, then the new one opens
  } else {
    growFrom(name);
  }
}
function closeCard() {
  want = null;
  if ($info.is(':visible')) shrinkTo(shown);
}

/* ---------- 3. Move ----------
   The array changes at once. On the page: the old place closes (width 0),
   a new place opens at the end of the other room, and a clone of the card
   flies there. The flight follows the live position of the new place.     */
function moveGuest(name, toId) {
  const $g = $('.guest[data-name="' + name + '"]');
  if (!$g.length) return;
  const fromId = $g.closest('.room').attr('data-room');
  if (fromId === toId) return;

  // the array
  const from = roomState(fromId), to = roomState(toId);
  const data = from.guests.splice(from.guests.findIndex(function (g) { return g.name === name; }), 1)[0];
  to.guests.push(data);

  // the flying card: a clone that starts exactly where the original card is
  const $card = $g.find('.gcard');
  const start = $card.offset();
  const $fly = $card.clone().addClass('flying' + ($g.hasClass('found') ? ' found' : ''))
    .css({ left: start.left, top: start.top, width: GUEST_W }).appendTo('body');

  // old room: the place is empty and closes slowly
  $g.removeClass('guest').addClass('ghost').removeAttr('data-name');
  $g.stop(true).animate({ width: 0, marginLeft: 0, marginRight: 0 }, 650, function () { $(this).remove(); });

  // new room: a place opens slowly at the end (hidden until the card lands)
  const $toGuests = $('#room-' + toId + ' .guests');
  const seq = Math.max(-1, ...$toGuests.children('.guest').map(function () { return +$(this).attr('data-seq'); }).get()) + 1;
  const $new = makeGuestCard(data, seq).addClass('arriving').css({ width: 0, marginLeft: 0, marginRight: 0 })
    .appendTo($toGuests);
  $new.find('.gcard').css('opacity', $card.css('opacity'));
  if ($fly.hasClass('found')) $new.addClass('found');
  $new.animate({ width: GUEST_W, marginLeft: GUEST_MARGIN, marginRight: GUEST_MARGIN }, 650);
  sorted[toId] = false;                                    // the newcomer stands last
  $('.sort-btn[data-room="' + toId + '"]').removeClass('on').text('Sort by time');

  // the flight: 0 -> 1, the end point is read again on every step
  const flight = $({ t: 0 });
  flights.push(flight);
  flight.animate({ t: 1 }, {
    duration: 900,
    step: function (now) {
      const end = $new.find('.gcard').offset();
      $fly.css({ left: start.left + (end.left - start.left) * now, top: start.top + (end.top - start.top) * now });
    },
    complete: function () {
      $fly.remove();
      $new.removeClass('arriving');
      flights = flights.filter(function (f) { return f !== flight; });
    }
  });
}

/* ---------- 4. Sort by time ----------
   Click: earliest to latest. Click again: back to the picture order.
   The cards slide: we remember where every card is, reorder the DOM, then
   animate each card from its old place to the new one (left/top -> 0).
   stop(true) first, so the card continues from where it is on screen.    */
function sortRoom(roomId) {
  sorted[roomId] = !sorted[roomId];
  const byTime = sorted[roomId];
  $('.sort-btn[data-room="' + roomId + '"]').toggleClass('on', byTime)
    .text(byTime ? 'Picture order' : 'Sort by time');

  const $guests = $('#room-' + roomId + ' .guests');
  const $items = $guests.children('.guest');
  const $slots = $items.children('.slot');

  $slots.stop(true);                                       // no queue: start from the current place
  const before = $slots.map(function () { return $(this).offset(); }).get();

  const order = $items.get().sort(function (a, b) {
    const key = byTime ? 'data-minutes' : 'data-seq';
    return (+a.getAttribute(key) - +b.getAttribute(key)) || (+a.getAttribute('data-seq') - +b.getAttribute('data-seq'));
  });
  $guests.append(order);                                   // new order in the DOM
  $slots.css({ left: 0, top: 0 });

  $slots.each(function (i) {
    const now = $(this).offset();
    const dx = before[i].left - now.left, dy = before[i].top - now.top;
    if (dx || dy) $(this).css({ left: dx, top: dy }).animate({ left: 0, top: 0 }, 600);
  });
}

/* ------------------------------------------------------------------ */

$(function () {
  resetState();
  buildHouse();

  const $cases = $('#cases');
  $.each(CASES, function (i, c) {
    $('<button type="button" class="case-btn">')
      .attr('data-case', c.id)
      .append($('<b>').text(c.id), document.createTextNode(c.title))
      .on('click', function () { runCase(c); })
      .appendTo($cases);
  });

  $('#clear-btn').on('click', clearAll);
  $('#reset-btn').on('click', function () { resetState(); buildHouse(); clearAll(); });

  $('#house').on('click', '.sort-btn', function () { sortRoom($(this).attr('data-room')); });
  $('#house').on('click', '.guest', function () {
    const name = $(this).attr('data-name');
    if (want === name) closeCard(); else showCard(name);
  });
  $info.on('click', '.move-btn', function () {
    const name = $(this).attr('data-guest'), to = $(this).attr('data-to');
    hideInfoNow();
    moveGuest(name, to);
  });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#info, .guest').length) closeCard();
  });
});
