/* Task 1 – Selector Detective
   The page is built from the PARTY array (party.js) with jQuery.
   Every case is ONE jQuery chain that searches the page (not the array). */

const ICONS = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };
const ICON_TITLES = { phone: 'Phone', glasses: 'Glasses', bag: 'Bag', cup: 'Cup', crumbs: 'Cake crumbs' };

function toMinutes(time) {
  const p = time.split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function avatarUrl(name) {
  return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name);
}

// If the avatar service cannot be reached, show the first letter instead.
function fallbackAvatar(name) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dfe6ee"/>' +
    '<circle cx="40" cy="32" r="14" fill="#9aa8ba"/><path d="M12 80c2-20 14-28 28-28s26 8 28 28z" fill="#9aa8ba"/>' +
    '<text x="40" y="47" font-family="Arial" font-size="26" font-weight="700" text-anchor="middle" fill="#fff">' + name.charAt(0) + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* One guest card. The guest data is kept in classes and data-* attributes. */
function makeGuestCard(g) {
  const classes = ['guest', g.color, g.aitu ? 'aitu' : ''].concat(g.things).filter(Boolean).join(' ');
  const $guest = $('<div>', { 'class': classes })
    .attr({
      'data-name': g.name,
      'data-time': g.time,
      'data-minutes': toMinutes(g.time),
      'data-color': g.color,
      'data-aitu': g.aitu ? 'yes' : 'no',
      'data-things': g.things.join(' ')
    });

  const $img = $('<img>', { alt: g.name, draggable: false })
    .on('error', function () { $(this).off('error').attr('src', fallbackAvatar(g.name)); })
    .attr('src', avatarUrl(g.name));
  const $avatar = $('<div class="avatar">').append($img);
  if (g.aitu) $avatar.append($('<span class="badge" title="AITU student">🎓</span>'));

  const $things = $('<div class="things">');
  $.each(g.things, function (i, t) {
    $things.append($('<span>', { 'class': 'ico ico-' + t, title: ICON_TITLES[t], text: ICONS[t] }));
  });

  const $card = $('<div class="gcard">').append(
    $avatar,
    $('<div class="gname">').text(g.name),
    $('<div class="gtime">').text('🕒 ' + g.time),
    $things
  );
  return $guest.append($('<div class="slot">').append($card));
}

function makeRoom(room) {
  const $room = $('<div class="room">')
    .attr({ id: 'room-' + room.id, 'data-room': room.id, 'data-name': room.name, 'data-floor': room.floor });
  $room.append($('<div class="room-head">').append($('<h3>').text(room.name)));
  const $guests = $('<div class="guests">').appendTo($room);
  $.each(room.guests, function (i, g) { $guests.append(makeGuestCard(g)); });
  return $room;
}

/* Builds the whole page again from the array: 2 floors, rooms on each floor. */
function buildHouse() {
  const $house = $('#house').empty();
  $.each([2, 1], function (i, floor) {
    const $rooms = $('<div class="rooms">');
    $.each(PARTY.rooms, function (j, room) {
      if (room.floor === floor) $rooms.append(makeRoom(room));
    });
    $house.append($('<div class="floor">').attr('data-floor', floor)
      .append($('<div class="floor-label">').text('FLOOR ' + floor), $rooms));
  });
}

/* ------------------------------------------------------------------
   THE CASES. Each `run` is one jQuery chain. `kind` tells the page
   what the chain returns: guests, rooms, or a change of the party.
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
    run: () => makeGuestCard(MIRAS).hide().insertAfter('.guest[data-name="Askar"]').fadeIn(700) },

  { id: 19, kind: 'removed', title: 'Natasha says goodbye: her card fades away and is removed.',
    run: () => $('.guest[data-name="Natasha"]').fadeOut(700, function () { $(this).remove(); }) },

  { id: 20, kind: 'guests', title: 'Who took the cake?',
    run: () => $('.floor[data-floor="1"] .guest.crumbs:not(.cup)')
      .filter(function () { const m = $(this).data('minutes'); return m > 1260 && m < 1290; })
      .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; }) }
];

/* ------------------------------------------------------------------ */

// Turns the source of an arrow function into readable chain text for the page.
function chainText(fn) {
  return fn.toString().replace(/^\(\)\s*=>\s*/, '').replace(/\n {4,6}/g, '\n  ').trim();
}

function namesOf($set) {
  return $set.map(function () { return $(this).attr('data-name'); }).get();
}

function jump($els) {            // jump once with animate()
  $els.stop(true, true).animate({ top: -16 }, 140).animate({ top: 0 }, 140);
}

function showResult(c, names, noun) {
  const $line = $('#result .result-line').empty();
  $line.append($('<b>').text('Case ' + c.id + ': '), document.createTextNode(c.title + '  →  '));
  $line.append($('<strong>').text(names.length + ' ' + noun + (names.length === 1 ? '' : 's')));
  if (names.length) $line.append(document.createTextNode(': ' + names.join(', ')));
  $('#result .result-code').text(chainText(c.run)).show();
}

function runCase(c) {
  buildHouse();                                        // always start from a fresh party
  $('.case-btn').removeClass('active').filter('[data-case="' + c.id + '"]').addClass('active');

  const $found = c.run();                              // the one jQuery chain
  const names = namesOf($found);

  if (c.kind === 'rooms') {
    $found.addClass('found-room');
    jump($found.find('.room-head'));
    showResult(c, names, 'room');
  } else if (c.kind === 'guests') {
    $found.addClass('found');
    jump($found.find('.avatar'));
    showResult(c, names, 'guest');
  } else if (c.kind === 'added') {                     // Miras fades in, then highlight him
    showResult(c, names, 'new guest');
    $found.promise().done(function () {
      $found.addClass('found');
      jump($found.find('.avatar'));
    });
  } else {                                             // Natasha fades out and is removed
    showResult(c, names, 'guest');
    $('#result .result-line').append(document.createTextNode(' (removed from the page)'));
  }
}

$(function () {
  buildHouse();
  const $cases = $('#cases');
  $.each(CASES, function (i, c) {
    $('<button type="button" class="case-btn">')
      .attr('data-case', c.id)
      .append($('<b>').text(c.id), document.createTextNode(c.title))
      .on('click', function () { runCase(c); })
      .appendTo($cases);
  });
});
