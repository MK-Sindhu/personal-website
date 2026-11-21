// Projects wheel: turns the list of project panels ([data-wheel]) into a wheel of cards round a hub,
// with the front card's project shown in full beside it (below it on narrow screens).
//
// Turning it:
// - drag or swipe: the wheel follows the pointer, and a flick keeps it spinning until it settles on a card
// - scroll over it: one card per notch, and the faster you scroll the faster it turns. After a full turn
//   in one go the page scrolls again, so the wheel never traps the page.
// - the arrow buttons, the arrow keys, or a click on any card
// A soft click plays as each card passes the front. The Sound button turns it off, and the choice is kept.
//
// The panels stay the single source of content: each card is built from its panel's category, title
// and diagram. Without JavaScript the panels stay a grid.
(function () {
  var list = document.querySelector('[data-wheel]');
  if (!list) return;
  var projects = Array.prototype.filter.call(list.children, function (el) { return el.classList.contains('proj'); });
  var n = projects.length;
  if (n < 3) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(i) { return (i < 10 ? '0' : '') + i; }
  function mod(i) { return ((i % n) + n) % n; }
  function titleOf(proj) {
    var h = proj.querySelector('h3');
    return h && h.firstChild ? h.firstChild.textContent.trim() : '';
  }

  /* ---------- Build ---------- */

  var carousel = el('div', 'carousel');
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carousel');
  carousel.setAttribute('aria-label', 'Projects');
  carousel.style.setProperty('--n', n);

  // The wheel is a visual layer only; the buttons and the panel carry everything for screen readers.
  var col = el('div', 'wheel-col');
  var stage = el('div', 'stage');
  stage.setAttribute('aria-hidden', 'true');
  var wheel = el('div', 'wheel');
  var ring = el('div', 'ring');
  ring.innerHTML =
    '<svg viewBox="-100 -100 200 200">' +
      '<path id="wheel-ring-path" d="M-80 0a80 80 0 1 1 160 0a80 80 0 1 1-160 0" fill="none"/>' +
      '<circle r="96"/><circle r="64"/>' +
      '<text><textPath href="#wheel-ring-path" textLength="502" lengthAdjust="spacing">' +
        'SELECTED PROJECTS · SELECTED PROJECTS · SELECTED PROJECTS · SELECTED PROJECTS · ' +
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
  function arrow(label, glyph, dir) {
    var b = el('button', 'wheel-btn', glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', function () { seek(target + dir, true, 2); });
    return b;
  }
  controls.appendChild(arrow('Previous project', '←', -1));
  controls.appendChild(el('p', 'wheel-hint', 'Drag, scroll or pick a card'));
  controls.appendChild(arrow('Next project', '→', 1));
  var soundBtn = el('button', 'wheel-sound', 'Sound');
  soundBtn.type = 'button';
  controls.appendChild(soundBtn);
  controls.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); seek(target - 1, true, 2); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(target + 1, true, 2); }
  });

  var status = el('p', 'sr-only');
  status.setAttribute('aria-live', 'polite');

  list.parentNode.insertBefore(carousel, list);
  col.appendChild(stage);
  col.appendChild(controls);
  carousel.appendChild(col);
  carousel.appendChild(list);
  carousel.appendChild(status);

  /* ---------- Sound: a short burst of filtered noise, made in the browser ---------- */

  var soundOn = true;
  try { soundOn = localStorage.getItem('wheel-sound') !== 'off'; } catch (err) {}
  var audio = null, noise = null, lastTick = 0;

  // Browsers only allow audio after a click, tap or key press, so the sound starts after the first one.
  function unlockAudio() {
    if (!soundOn) return;
    if (!audio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = new AC();
      var len = Math.round(audio.sampleRate * 0.025);
      noise = audio.createBuffer(1, len, audio.sampleRate);
      var data = noise.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
    }
    if (audio.state === 'suspended') audio.resume();
  }
  function tick() {
    if (!soundOn || !audio || audio.state !== 'running') return;
    var t = audio.currentTime;
    if (t - lastTick < 0.035) return;
    lastTick = t;
    var src = audio.createBufferSource();
    src.buffer = noise;
    var band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2300 + Math.random() * 600;
    band.Q.value = 1.4;
    var gain = audio.createGain();
    gain.gain.value = 0.5;
    src.connect(band);
    band.connect(gain);
    gain.connect(audio.destination);
    src.start(t);
  }
  function paintSound() { soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); }
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem('wheel-sound', soundOn ? 'on' : 'off'); } catch (err) {}
    paintSound();
    if (soundOn) { unlockAudio(); setTimeout(tick, 30); }
  });
  paintSound();
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  /* ---------- Motion ---------- */
  // pos: where the wheel is, in cards (fractional while it moves). target: the card it settles on.
  // Away from the pointer, pos follows a critically damped spring to target, so a far target is
  // approached faster: scrolling or clicking quickly speeds the wheel up.

  var pos = 0, vel = 0, target = 0;
  var shown = -1, lastIdx = 0, committed = -1;
  var dragging = false, raf = 0, lastT = 0;

  function draw() {
    carousel.style.setProperty('--turn', pos.toFixed(4));
    var idx = Math.round(pos);
    if (idx !== lastIdx) { lastIdx = idx; tick(); }
    var front = mod(idx);
    if (front !== shown) {
      shown = front;
      cards.forEach(function (c, k) {
        var d = Math.abs(k - front);
        c.style.zIndex = n - Math.min(d, n - d);   // cards overlap near the hub: stack by distance from the front
        c.classList.toggle('is-active', k === front);
      });
      count.textContent = pad(front + 1) + ' / ' + pad(n);
    }
  }

  function frame() {
    var now = performance.now();   // one clock for start and frames (rAF's own timestamp can lag behind it)
    var dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    if (!dragging) {
      var w = 11, h = dt / 4;
      for (var s = 0; s < 4; s++) {
        vel += (-w * w * (pos - target) - 2 * w * vel) * h;
        pos += vel * h;
      }
      if (Math.abs(pos - target) < 0.0008 && Math.abs(vel) < 0.01) {
        pos = target; vel = 0; draw(); raf = 0;
        return;
      }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function run() {
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); }
  }

  // Show a project's details. Called as soon as the wheel knows where it will stop.
  function commit(i, announce) {
    if (i === committed) return;
    committed = i;
    projects.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    if (announce) status.textContent = 'Project ' + (i + 1) + ' of ' + n + ': ' + titleOf(projects[i]);
  }

  // Settle on card position `to`. `limit` caps how far ahead of the wheel new input can push the target
  // (so a burst of scrolling can't queue a long spin), but never pulls back a target already set.
  function seek(to, announce, limit) {
    var here = Math.round(pos);
    var lo = Math.min(target, here - limit), hi = Math.max(target, here + limit);
    target = Math.max(lo, Math.min(hi, Math.round(to)));
    commit(mod(target), announce);
    if (reduce.matches && !dragging) { pos = target; vel = 0; draw(); return; }
    run();
  }
  function goTo(i) {
    var d = mod(i - mod(target));
    if (d > n / 2) d -= n;
    seek(target + d, true, n);
  }

  /* ---------- Drag, swipe and click ---------- */

  var startX = 0, startPos = 0, pxPerCard = 1, samples = [], downCard = null, moved = false;

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startPos = pos;
    vel = 0;
    // one card's worth of drag is the arc between neighbouring card centres
    pxPerCard = Math.max(60, cards[0].offsetWidth * 1.24 * 2 * Math.PI / n);
    downCard = e.target.closest ? e.target.closest('.card') : null;
    samples = [[e.timeStamp, pos]];
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    run();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 6) return;
    moved = true;
    pos = startPos - dx / pxPerCard;   // drag left and the cards move left, bringing the next one round
    samples.push([e.timeStamp, pos]);
    if (samples.length > 6) samples.shift();
  });
  function release(e, cancelled) {
    if (!dragging) return;
    dragging = false;
    if (!moved) {
      if (downCard && !cancelled) goTo(cards.indexOf(downCard));
      else seek(Math.round(pos), true, n);
      return;
    }
    // carry on at the speed the pointer left at, and settle on the card the wheel would coast to
    var a = samples[0], b = samples[samples.length - 1], span = (b[0] - a[0]) / 1000;
    vel = span > 0.01 ? (b[1] - a[1]) / span : 0;
    if (e && e.timeStamp - b[0] > 100) vel = 0;   // the pointer stopped before letting go
    seek(pos + vel * 0.32, true, n);
  }
  stage.addEventListener('pointerup', function (e) { release(e, false); });
  stage.addEventListener('pointercancel', function (e) { release(e, true); });
  stage.addEventListener('lostpointercapture', function (e) { release(e, true); });

  /* ---------- Scroll ---------- */

  var acc = 0, gestureSteps = 0, gestureTimer = 0;
  stage.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;   // pinch zoom
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 33; else if (e.deltaMode === 2) d *= 400;
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(function () { gestureSteps = 0; acc = 0; }, 350);
    if (gestureSteps >= n) return;   // a full turn in one go: let the page scroll on
    e.preventDefault();
    var dir = 0;
    if (Math.abs(d) >= 50) { dir = d > 0 ? 1 : -1; acc = 0; }   // a mouse notch: one card
    else {                                                     // a trackpad: add up small movements
      acc += d;
      if (Math.abs(acc) >= 70) { dir = acc > 0 ? 1 : -1; acc = 0; }
    }
    if (dir) { gestureSteps++; seek(target + dir, true, 2); }
  }, { passive: false });

  draw();
  commit(0, false);
})();
