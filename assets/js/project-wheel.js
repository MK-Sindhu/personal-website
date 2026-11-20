// Projects wheel: turns the list of project panels ([data-wheel]) into a wheel of cards round a hub.
// The front card's project is shown in full underneath. Turn it by dragging, with the arrow buttons
// or arrow keys, or by clicking a card. The panels stay the single source of content: each card is
// built from its panel's number, category, title and diagram. Without JavaScript the panels stay a grid.
(function () {
  var list = document.querySelector('[data-wheel]');
  if (!list) return;
  var projects = Array.prototype.filter.call(list.children, function (el) { return el.classList.contains('proj'); });
  var n = projects.length;
  if (n < 3) return;

  var active = 0;
  var turn = 0;   // whole steps turned so far; it keeps counting so the wheel always takes the short way round

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(i) { return (i < 10 ? '0' : '') + i; }
  function titleOf(proj) {
    var h = proj.querySelector('h3');
    return h && h.firstChild ? h.firstChild.textContent.trim() : '';
  }

  var carousel = el('div', 'carousel');
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carousel');
  carousel.setAttribute('aria-label', 'Projects');
  carousel.style.setProperty('--n', n);

  // The wheel is a visual layer only; the buttons and the panel below carry everything for screen readers.
  var stage = el('div', 'stage');
  stage.setAttribute('aria-hidden', 'true');
  var wheel = el('div', 'wheel');
  var ring = el('div', 'ring');
  ring.innerHTML =
    '<svg viewBox="-100 -100 200 200">' +
      '<path id="wheel-ring-path" d="M-80 0a80 80 0 1 1 160 0a80 80 0 1 1-160 0" fill="none"/>' +
      '<circle r="96"/><circle r="64"/>' +
      '<text><textPath href="#wheel-ring-path" textLength="502" lengthAdjust="spacing">' +
        'SELECTED WORK · RESEARCH AND PROJECTS · SELECTED WORK · RESEARCH AND PROJECTS · ' +
      '</textPath></text>' +
    '</svg>';
  wheel.appendChild(ring);

  var cards = projects.map(function (proj, i) {
    var card = el('div', 'card');
    card.setAttribute('data-theme', proj.getAttribute('data-theme') || 'ink');
    card.style.setProperty('--i', i);

    var top = el('p', 'card-top');
    var kicker = proj.querySelector('.kicker');
    top.appendChild(el('span', null, pad(i + 1)));
    top.appendChild(el('span', null, kicker ? kicker.textContent.split(' · ')[0] : ''));
    card.appendChild(top);

    var art = el('div', 'card-art');
    var viz = proj.querySelector('.viz');
    if (viz) art.appendChild(viz.cloneNode(true));
    card.appendChild(art);

    card.appendChild(el('p', 'card-title', titleOf(proj)));
    card.addEventListener('click', function () { if (!dragged) go(i, true); });
    wheel.appendChild(card);
    return card;
  });

  var mark = el('div', 'hub-mark');
  mark.appendChild(el('span', 'hub-arrow', '▲'));
  var count = el('span', 'hub-count');
  mark.appendChild(count);
  stage.appendChild(wheel);
  stage.appendChild(mark);

  var controls = el('div', 'wheel-controls');
  function button(label, glyph, dir) {
    var b = el('button', 'wheel-btn', glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', function () { step(dir); });
    return b;
  }
  controls.appendChild(button('Previous project', '←', -1));
  controls.appendChild(el('p', 'wheel-hint', 'Drag or pick a card'));
  controls.appendChild(button('Next project', '→', 1));
  controls.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  var status = el('p', 'sr-only');
  status.setAttribute('aria-live', 'polite');

  list.parentNode.insertBefore(carousel, list);
  carousel.appendChild(stage);
  carousel.appendChild(controls);
  carousel.appendChild(list);
  carousel.appendChild(status);

  function go(i, announce) {
    var delta = (((i - active) % n) + n) % n;
    if (delta > n / 2) delta -= n;
    turn += delta;
    active = i;
    render(announce);
  }
  function step(dir) { go((((active + dir) % n) + n) % n, true); }
  function render(announce) {
    carousel.style.setProperty('--turn', turn);
    cards.forEach(function (c, k) {
      // cards overlap near the hub, so stack them by distance from the front card
      var d = Math.abs(k - active);
      c.style.zIndex = n - Math.min(d, n - d);
      c.classList.toggle('is-active', k === active);
    });
    projects.forEach(function (p, k) { p.classList.toggle('is-active', k === active); });
    count.textContent = pad(active + 1) + ' / ' + pad(n);
    if (announce) status.textContent = 'Project ' + (active + 1) + ' of ' + n + ': ' + titleOf(projects[active]);
  }

  // Drag or swipe sideways to turn one step. Vertical swipes still scroll the page (touch-action: pan-y).
  var startX = null;
  var dragged = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    startX = e.clientX;
    dragged = false;
  });
  stage.addEventListener('pointermove', function (e) {
    if (startX !== null && Math.abs(e.clientX - startX) > 8) dragged = true;
  });
  window.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', function () { startX = null; });

  render(false);
})();
