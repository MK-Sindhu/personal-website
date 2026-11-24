// The hooded robot in the bottom-right corner: a small 3D figure built here from simple shapes
// (no model file), drawn with three.js, which is loaded only once the page itself has finished.
//
// What it does:
// - breathes, blinks, and turns its head towards the pointer (or the last tap)
// - waves once, shortly after it appears
// - watches the projects wheel and nods as each card passes (the wheel sends "wheelcard" events)
// - smiles and hops when the email address is copied ("emailcopied")
// - does a trick when it is clicked, picked at random: hop, spin, backflip, dance, head spin,
//   skipping with a rope, or stopping to think
// - now and then does one of the calmer ones by itself
// Every trick eases in from the standing pose and back out to it, so nothing jumps.
//
// It is decoration only: hidden from screen readers, and it never takes a click away from the page.
// With reduced motion it is drawn once, standing still. Without WebGL it does not appear.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function start() {
    var s = document.createElement('script');
    s.src = 'assets/js/vendor/three.min.js';
    s.onload = function () { try { build(window.THREE); } catch (err) { /* no WebGL: leave the page as it is */ } };
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);

  function build(T) {
    var box = document.createElement('div');
    box.className = 'robot';
    box.setAttribute('aria-hidden', 'true');

    var renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    box.appendChild(renderer.domElement);
    document.body.appendChild(box);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 3 / 4, 0.1, 50);
    camera.position.set(0, 2.25, 8.4);
    camera.lookAt(0, 1.72, 0);

    scene.add(new T.HemisphereLight(0xffffff, 0x30343a, 1.5));
    var key = new T.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2.5, 5, 5);
    scene.add(key);
    var rimA = new T.DirectionalLight(0x6ee7ea, 1.6);   // the site's cyan and violet, from behind
    rimA.position.set(-4, 2.5, -4);
    scene.add(rimA);
    var rimB = new T.DirectionalLight(0xa893ff, 1.4);
    rimB.position.set(4, 3, -4);
    scene.add(rimB);

    /* ---------- Materials ---------- */

    var cloth = new T.MeshStandardMaterial({ color: 0x8b8d90, roughness: 0.95, side: T.DoubleSide });
    var clothDark = new T.MeshStandardMaterial({ color: 0x6f7174, roughness: 0.95 });
    var shell = new T.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.22, metalness: 0.35 });
    var metal = new T.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.45, metalness: 0.6 });
    var trousers = new T.MeshStandardMaterial({ color: 0x141517, roughness: 0.9 });
    var sole = new T.MeshStandardMaterial({ color: 0xeee8dd, roughness: 0.7 });
    var shoe = new T.MeshStandardMaterial({ color: 0xff8a4c, roughness: 0.75 });
    var cord = new T.MeshStandardMaterial({ color: 0xffb98a, roughness: 0.8 });
    var glow = new T.MeshBasicMaterial({ color: 0xffb43a });   // the eyes: the site's amber

    /* ---------- Shapes ---------- */

    function mesh(geo, mat, parent, x, y, z) {
      var m = new T.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      parent.add(m);
      return m;
    }
    // A box with rounded edges: every point is pulled to within r of a smaller box inside it.
    function roundedBox(w, h, d, r) {
      var g = new T.BoxGeometry(w, h, d, 10, 10, 10);
      var p = g.attributes.position, nrm = g.attributes.normal;
      var v = new T.Vector3(), c = new T.Vector3();
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        c.set(Math.max(-w / 2 + r, Math.min(w / 2 - r, v.x)),
              Math.max(-h / 2 + r, Math.min(h / 2 - r, v.y)),
              Math.max(-d / 2 + r, Math.min(d / 2 - r, v.z)));
        v.sub(c).normalize();
        nrm.setXYZ(i, v.x, v.y, v.z);
        v.multiplyScalar(r).add(c);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      return g;
    }
    function lathe(points) {
      return new T.LatheGeometry(points.map(function (q) { return new T.Vector2(q[0], q[1]); }), 40);
    }
    function roundedRect(w, h, r) {
      var s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return new T.ShapeGeometry(s, 8);
    }
    function arc(ro, ri, a0, a1) {
      var s = new T.Shape();
      s.absarc(0, 0, ro, a0, a1, false);
      s.absarc(0, 0, ri, a1, a0, true);
      return new T.ShapeGeometry(s, 16);
    }
    function softDot(inner, outer) {
      var c = document.createElement('canvas');
      c.width = c.height = 64;
      var g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new T.CanvasTexture(c);
    }

    /* ---------- The robot (about 3.1 units tall, feet at y = 0, facing +z) ---------- */

    var root = new T.Group();
    scene.add(root);

    var shadow = mesh(new T.PlaneGeometry(2.6, 1.5),
      new T.MeshBasicMaterial({ map: softDot('rgba(0,0,0,.5)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }), scene, 0, 0.01, 0.1);
    shadow.rotation.x = -Math.PI / 2;

    [-1, 1].forEach(function (side) {
      mesh(roundedBox(0.46, 0.12, 0.74, 0.05), sole, root, side * 0.3, 0.06, 0.1);
      mesh(roundedBox(0.42, 0.24, 0.68, 0.11), shoe, root, side * 0.3, 0.2, 0.09);
      mesh(new T.CylinderGeometry(0.21, 0.21, 0.36, 20), trousers, root, side * 0.3, 0.46, 0);
      mesh(new T.TorusGeometry(0.2, 0.055, 10, 24), clothDark, root, side * 0.3, 0.33, 0).rotation.x = Math.PI / 2;
    });

    var body = new T.Group();
    root.add(body);
    var torso = mesh(lathe([[0, 0.52], [0.6, 0.52], [0.71, 0.58], [0.73, 0.72], [0.67, 1.0], [0.57, 1.3], [0.44, 1.5], [0.3, 1.58]]), cloth, body);
    torso.scale.z = 0.82;
    mesh(roundedBox(0.66, 0.3, 0.12, 0.055), clothDark, body, 0, 0.82, 0.55).rotation.x = -0.06;
    var collar = mesh(new T.TorusGeometry(0.4, 0.14, 12, 28), cloth, body, 0, 1.54, 0);
    collar.rotation.x = Math.PI / 2;
    collar.scale.y = 0.9;
    [-1, 1].forEach(function (side) {
      var c = mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 8), cord, body, side * 0.12, 1.18, 0.51);
      c.rotation.x = 0.16;
      mesh(new T.CylinderGeometry(0.028, 0.028, 0.07, 8), metal, body, side * 0.12, 0.92, 0.555);
    });

    function arm(side) {
      var a = new T.Group();
      a.position.set(side * 0.55, 1.34, 0);
      body.add(a);
      mesh(new T.CapsuleGeometry(0.2, 0.46, 6, 16), cloth, a, 0, -0.36, 0);
      mesh(new T.TorusGeometry(0.17, 0.07, 10, 20), clothDark, a, 0, -0.72, 0).rotation.x = Math.PI / 2;
      mesh(new T.SphereGeometry(0.14, 16, 12), metal, a, 0, -0.86, 0).scale.set(1, 1.05, 0.8);
      for (var f = -1; f <= 1; f++) mesh(new T.CapsuleGeometry(0.033, 0.1, 4, 8), metal, a, f * 0.075, -1.0, 0.02);
      return a;
    }
    var armL = arm(-1), armR = arm(1);

    var head = new T.Group();
    head.position.set(0, 1.56, 0);
    root.add(head);
    mesh(roundedBox(1.3, 1.02, 1.0, 0.3), shell, head, 0, 0.62, 0.06);

    // The hood: a bowl turned to face forwards, open at the front, with a thick rim.
    var hood = mesh(lathe([[0, -0.95], [0.45, -0.88], [0.8, -0.6], [0.98, -0.15], [1.0, 0.2], [0.94, 0.48], [0.86, 0.64]]), cloth, head, 0, 0.68, 0);
    hood.geometry.rotateX(Math.PI / 2);
    hood.scale.y = 0.93;
    var rim = mesh(new T.TorusGeometry(0.86, 0.075, 12, 48), cloth, head, 0, 0.68, 0.64);
    rim.scale.y = 0.93;

    var eyes = new T.Group(), smile = new T.Group();
    eyes.position.set(0, 0.64, 0.572);
    smile.position.copy(eyes.position);
    smile.visible = false;
    head.add(eyes);
    head.add(smile);
    var halo = new T.MeshBasicMaterial({ map: softDot('rgba(255,150,40,.5)', 'rgba(255,150,40,0)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    [-1, 1].forEach(function (side) {
      mesh(roundedRect(0.14, 0.32, 0.06), glow, eyes, side * 0.29, 0, 0);
      mesh(new T.PlaneGeometry(0.52, 0.68), halo, head, side * 0.29, 0.64, 0.568);
      mesh(arc(0.15, 0.085, 0.35, Math.PI - 0.35), glow, smile, side * 0.29, -0.08, 0);
    });

    // Props: a skipping rope (half a ring between the hands, turned about the line through them)
    // and three thought dots above the head. Both are hidden until their trick plays.
    var rope = mesh(new T.TorusGeometry(1, 0.022, 8, 40, Math.PI), cord, root, 0, 0.69, 0);
    rope.visible = false;
    var dots = [[0.72, 3.3, 0.06], [0.98, 3.48, 0.085], [1.28, 3.72, 0.115]].map(function (d) {
      var m = mesh(new T.SphereGeometry(d[2], 14, 10), glow, scene, d[0], d[1], 0.3);
      m.visible = false;
      return m;
    });

    /* ---------- What it reacts to ---------- */

    var now = 0;                       // seconds, advanced only while animating
    var look = { x: -0.35, y: 0 };     // where it wants to look: -1..1 across and down the window
    var lookUntil = 0, lookAt = null;  // a temporary point of interest (the wheel), until `lookUntil`
    var waveFrom = -1, nodFrom = -1, smileUntil = 0, nextBlink = 2.5, blinkFrom = -1;
    var yaw = 0, pitch = 0;

    // Tricks: length in seconds, and whether it smiles all the way through.
    var TRICKS = { hop: [0.5, 1], spin: [0.85, 1], flip: [0.95, 1], dance: [1.9, 1], headspin: [0.9, 1], skip: [3.6, 1], think: [3.6, 0] };
    var ALL = Object.keys(TRICKS), CALM = ['think', 'skip', 'headspin', 'hop'];   // CALM: the ones it does by itself
    var trick = '', trickFrom = 0, lastTrick = '', nextIdle = 9, calm = 0, smileShown = false;

    function centre(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function aim(px, py) {
      var c = centre(box);
      look.x = Math.max(-1, Math.min(1, (px - c.x) / (window.innerWidth * 0.5)));
      look.y = Math.max(-1, Math.min(1, (py - c.y) / (window.innerHeight * 0.6)));
    }
    function play(name) {
      if (reduce.matches) {            // no movement: just a smile for a moment
        smileUntil = now + 1;
        clearTimeout(calm);
        calm = setTimeout(function () { smileUntil = 0; kick(); }, 1200);
      } else if (!trick) {
        trick = lastTrick = name;
        trickFrom = now;
        if (TRICKS[name][1]) smileUntil = now + TRICKS[name][0] + 0.6;
      }
      kick();
    }
    function pick(names) {             // a random one, never the same twice running
      var n;
      do { n = names[Math.floor(Math.random() * names.length)]; } while (n === lastTrick);
      return n;
    }
    function cheer() { play('hop'); }
    function doTrick() { if (!trick) play(pick(ALL)); }   // a click during a trick lets it finish

    window.addEventListener('pointermove', function (e) { aim(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      aim(e.clientX, e.clientY);
      var r = box.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) doTrick();
    }, { passive: true });
    document.addEventListener('wheelcard', function () {
      var stage = document.querySelector('.stage');
      if (stage) { lookAt = stage; lookUntil = now + 1.4; }
      nodFrom = now;
    });
    document.addEventListener('emailcopied', cheer);

    /* ---------- Drawing ---------- */

    function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

    function pose(dt) {
      // head: towards the pointer, or towards the wheel while it turns
      var tx = look.x, ty = look.y;
      if (lookAt && now < lookUntil) {
        var c = centre(lookAt), b = centre(box);
        tx = Math.max(-1, Math.min(1, (c.x - b.x) / (window.innerWidth * 0.5)));
        ty = Math.max(-1, Math.min(1, (c.y - b.y) / (window.innerHeight * 0.6)));
      }
      var k = 1 - Math.exp(-dt * 7);
      yaw += (tx * 0.75 - yaw) * k;
      pitch += (ty * 0.42 - pitch) * k;

      var nod = 0;
      if (nodFrom >= 0) {
        var n = (now - nodFrom) / 0.32;
        if (n < 1) nod = Math.sin(n * Math.PI) * 0.2; else nodFrom = -1;
      }
      // The trick in progress: p runs from 0 to 1 over its length. `env` rises from 0 to 1 at the start
      // and falls back at the end; every pose change is scaled by it, so tricks blend in and out.
      if (!trick && !reduce.matches && now > nextIdle) play(pick(CALM));
      var up = 0, turn = 0, flip = 0, lean = 0, headTurn = 0, armsUp = 0, pump = 0, skip = 0, spinAt = 0, think = 0, p = 0;
      if (trick) {
        p = (now - trickFrom) / TRICKS[trick][0];
        var arcUp = Math.sin(Math.min(1, p) * Math.PI), env = ease(p / 0.14) * (1 - ease((p - 0.86) / 0.14));
        if (p >= 1) { trick = ''; nextIdle = now + 12 + Math.random() * 16; }
        else if (trick === 'hop') up = arcUp * 0.34;
        else if (trick === 'spin') { up = arcUp * 0.2; turn = ease(p) * Math.PI * 2; }
        else if (trick === 'flip') { up = arcUp * 0.6; flip = -ease(p) * Math.PI * 2; }
        else if (trick === 'headspin') headTurn = ease(p) * Math.PI * 2;
        else if (trick === 'dance') {
          var beat = p * Math.PI * 8;
          lean = Math.sin(beat) * 0.13 * env;
          up = Math.abs(Math.sin(beat)) * 0.09 * env;
          armsUp = env;
          pump = Math.sin(beat) * 0.35 * env;
        } else if (trick === 'skip') {
          // six turns of the rope: speeding up over the first 15%, steady, slowing over the last 15%
          var a = 0.15, v = 1 / (1 - a), g = p < a ? v * p * p / (2 * a) : p > 1 - a ? 1 - v * (1 - p) * (1 - p) / (2 * a) : v * (p - a / 2);
          skip = env;
          spinAt = Math.PI + g * Math.PI * 12;                      // starts and ends hanging down behind the feet
          up = Math.max(0, -Math.cos(spinAt)) * 0.2 * env;         // in the air as the rope passes underneath
        } else if (trick === 'think') {
          think = env;
          if (p > 0.8) smileUntil = now + 0.9;                      // got it
        }
      }

      head.rotation.set(pitch * (1 - think * 0.8) + nod - think * 0.26, yaw * (1 - think * 0.8) + headTurn + think * 0.42,
        Math.sin(now * 0.9) * 0.025 - think * 0.13);
      // a backflip turns about the middle of the body (y = 1.5), not the feet
      root.rotation.set(flip, -0.3 + yaw * 0.3 + turn, lean);
      root.position.set(0, up + 1.5 - 1.5 * Math.cos(flip), -1.5 * Math.sin(flip));

      // rope: long enough to clear the hood overhead, short enough to skim the floor underneath
      rope.visible = skip > 0.001;
      if (rope.visible) {
        rope.rotation.x = spinAt;
        rope.scale.set(1.18, (0.7 + 0.98 * (1 + Math.cos(spinAt))) * skip, 1);
      }
      // thought dots: they pop up one after another and float
      dots.forEach(function (d, i) {
        var sc = think * ease((p - 0.16 - i * 0.13) / 0.1);
        d.visible = sc > 0.001;
        d.scale.setScalar(sc || 0.001);
        d.position.y = [3.3, 3.48, 3.72][i] + Math.sin(now * 3 + i) * 0.03;
      });

      // breathing and a slow sway
      var breath = Math.sin(now * 1.8);
      body.scale.set(1 + breath * 0.008, 1 + breath * 0.012, 1 + breath * 0.008);
      head.position.y = 1.56 + breath * 0.012;

      var sq = 1 - up * 0.5;
      shadow.scale.set(sq, sq, 1);
      shadow.material.opacity = 0.9 - up;

      // arms: hanging with a little swing; the right one waves
      var swing = Math.sin(now * 1.8 + 1) * 0.04;
      var out = up * 1.2 * (1 - skip) + skip * (0.55 + Math.sin(spinAt) * 0.07);   // arms lift in a jump; held out to turn the rope
      armL.rotation.z = -0.22 - swing - (armsUp ? armsUp * 2.2 - pump : out);
      var raise = 0, wag = 0;
      if (waveFrom >= 0) {
        var w = now - waveFrom;
        if (w < 2.3) { raise = ease(w / 0.35) * (1 - ease((w - 1.9) / 0.4)); wag = Math.sin(w * 11) * 0.3 * raise; }
        else waveFrom = -1;
      }
      armR.rotation.z = 0.22 + swing + (armsUp ? armsUp * 2.2 + pump : out) + raise * 2.25 + wag - think * 0.5;
      armR.rotation.x = -think * (2.0 + Math.sin(now * 5) * 0.05);                 // hand up to the chin, tapping

      // eyes: blink, narrow while thinking, or smile. A change of expression happens mid-blink.
      var smiling = now < smileUntil;
      if (reduce.matches) smileShown = smiling;
      else if (smiling !== smileShown && blinkFrom < 0) blinkFrom = now;
      if (now > nextBlink) { if (blinkFrom < 0) blinkFrom = now; nextBlink = now + 2.2 + Math.random() * 3.5; }
      var open = 1;
      if (blinkFrom >= 0) {
        var bl = (now - blinkFrom) / 0.16;
        if (bl >= 0.5) smileShown = smiling;
        if (bl < 1) open = Math.abs(1 - bl * 2); else blinkFrom = -1;
      }
      eyes.visible = !smileShown;
      smile.visible = smileShown;
      eyes.scale.y = Math.max(0.08, open * (1 - think * 0.4));
      smile.scale.y = Math.max(0.08, open);
    }

    function size() {
      var w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    var raf = 0, last = 0;
    function frame(t) {
      raf = 0;
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      now += dt;
      pose(dt);
      renderer.render(scene, camera);
      if (!reduce.matches && !document.hidden) raf = requestAnimationFrame(frame);
    }
    // Start the loop; with reduced motion this draws the reaction's end state once and stops.
    function kick() {
      if (raf) return;
      if (reduce.matches) { pose(1); renderer.render(scene, camera); return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    size();
    if (window.ResizeObserver) new ResizeObserver(function () { size(); pose(0); renderer.render(scene, camera); }).observe(box);
    else window.addEventListener('resize', function () { size(); pose(0); renderer.render(scene, camera); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if (reduce.addEventListener) reduce.addEventListener('change', kick);

    if (!reduce.matches) waveFrom = 0.9;
    kick();
    box.classList.add('is-ready');
  }
})();
