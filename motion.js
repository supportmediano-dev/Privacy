/* Mediano mockup — motion.
   Everything degrades: no JS, the page is still readable and scrollable. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var slow = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress ---------- */
  var prog = document.getElementById("prog");
  function onScroll() {
    var h = document.body.scrollHeight - innerHeight;
    prog.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- unfold on scroll ---------- */
  var ups = document.querySelectorAll(".up");
  function open1(el) {
    el.classList.add("in");
    // and let go of the clip once it is open, so shadows are not cut square
    setTimeout(function () { el.classList.add("done"); }, 620);
  }
  function openAll() { ups.forEach(open1); }
  if (slow || !("IntersectionObserver" in window)) {
    openAll();
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        open1(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: .06 });
    ups.forEach(function (el) { io.observe(el); });
    setTimeout(openAll, 2600);           // never leave anything covered
  }

  /* ---------- count up ---------- */
  var nums = document.querySelectorAll("[data-count]");
  function run(el) {
    var to = +el.dataset.count, t0 = performance.now(), d = 1100;
    if (slow || !to) { el.textContent = to.toLocaleString(); return; }
    (function step(t) {
      var k = Math.min((t - t0) / d, 1);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * k).toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); } });
    }, { threshold: .4 });
    nums.forEach(function (n) { io2.observe(n); });
  } else nums.forEach(run);

  /* ---------- the deck ---------- */
  var rail = document.getElementById("rail");
  var cards = rail ? [].slice.call(rail.children) : [];
  var dots = document.getElementById("dots");
  if (rail) {
    cards.forEach(function () { dots.insertAdjacentHTML("beforeend", "<i></i>"); });
    var pips = [].slice.call(dots.children);

    /* neighbours shrink and lean away from centre — a hand of cards */
    var tick = false;
    function paint() {
      var mid = rail.getBoundingClientRect().left + rail.clientWidth / 2, near = 0, best = 1e9;
      cards.forEach(function (c, i) {
        var b = c.getBoundingClientRect(), d = (b.left + b.width / 2 - mid) / rail.clientWidth;
        var a = Math.abs(d);
        if (a < best) { best = a; near = i; }
        if (!slow) {
          // iOS app switcher: cards stay upright and overlap, the focused one
          // in front at full size, the rest tucked behind it and dimmed.
          var k = Math.min(a, 1.2);
          var pull = -d * 58;                 // slide neighbours under the centre
          var scale = 1 - Math.min(k, 1) * .13;
          c.style.transform =
            "translateX(" + pull.toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
          c.style.zIndex = String(100 - Math.round(k * 20));
          c.style.filter = "brightness(" + (1 - Math.min(k, 1) * .1).toFixed(3) + ")";
        }
      });
      pips.forEach(function (p, i) { p.classList.toggle("on", i === near); });
      tick = false;
    }
    function queue() { if (!tick) { tick = true; requestAnimationFrame(paint); } }
    rail.scrollLeft = 0;
    rail.addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    queue();

    /* pointer drag, so a mouse can deal the deck too */
    var down = false, x0 = 0, s0 = 0, moved = 0;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;           // native touch scroll is better
      down = true; moved = 0; x0 = e.clientX; s0 = rail.scrollLeft;
      rail.classList.add("drag"); rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - x0; moved = Math.abs(dx);
      rail.scrollLeft = s0 - dx;
    });
    function up() {
      if (!down) return;
      down = false; rail.classList.remove("drag");
      var w = cards[0].offsetWidth + 16;
      rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: "smooth" });
    }
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    rail.addEventListener("click", function (e) { if (moved > 6) e.preventDefault(); }, true);
  }

  /* ---------- hero tilts toward the pointer ---------- */
  var tilt = document.getElementById("tilt");
  if (tilt && !slow && matchMedia("(pointer:fine)").matches) {
    addEventListener("pointermove", function (e) {
      var y = (e.clientX / innerWidth - .5) * 14, x = (e.clientY / innerHeight - .5) * -10;
      tilt.style.transform = "rotateY(" + y.toFixed(2) + "deg) rotateX(" + x.toFixed(2) + "deg)";
    }, { passive: true });
  }

  /* ---------- ripple ---------- */
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".btn"); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), i = document.createElement("span");
    i.className = "ripple";
    i.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
    b.appendChild(i); setTimeout(function () { i.remove(); }, 620);
  });

  /* ---------- ticker: double the words so the loop is seamless ---------- */
  var tickEl = document.getElementById("tick");
  if (tickEl) tickEl.innerHTML += tickEl.innerHTML;

  /* ---------- skin ---------- */
  var KEY = "mediano-mock-skin";
  var shots = document.querySelectorAll("img[data-glass]");
  function skin(s) {
    root.setAttribute("data-skin", s);
    document.querySelectorAll(".skin button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.skin === s));
    });
    shots.forEach(function (im) {
      var n = s === "glass" ? im.dataset.glass : im.dataset.paper;
      if (n && im.getAttribute("src") !== n) im.setAttribute("src", n);
    });
    document.querySelector('meta[name=theme-color]')
      .setAttribute("content", s === "glass" ? "#FFFFFF" : "#FAF4EC");
  }
  var saved; try { saved = localStorage.getItem(KEY); } catch (e) {}
  skin(saved === "glass" ? "glass" : "paper");
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".skin button"); if (!b) return;
    skin(b.dataset.skin);
    try { localStorage.setItem(KEY, b.dataset.skin); } catch (err) {}
  });
  setTimeout(function () {
    shots.forEach(function (im) { new Image().src = im.dataset.glass; });
  }, 2200);

  /* ---------- bottom bar follows the section you are in ---------- */
  var links = [].slice.call(document.querySelectorAll(".tabbar a"));
  var marks = links.map(function (a) { return document.getElementById(a.dataset.sec); });
  addEventListener("scroll", function () {
    var best = 0, bd = 1e9;
    marks.forEach(function (m, i) {
      if (!m) return;
      var d = Math.abs(m.getBoundingClientRect().top - 90);
      if (d < bd) { bd = d; best = i; }
    });
    links.forEach(function (a, i) { a.classList.toggle("on", i === best); });
  }, { passive: true });
})();

/* ---------- theme try-on ----------
   The 21 palettes straight out of AuriaTheme.swift: bg, surface, warm.
   The little phone wears one at a time; tapping a swatch pins it and
   stops the carousel, because nobody likes a demo that fights back. */
(function () {
  "use strict";
  var P = [
    ["Linen","#FAF4EC","#FFFBF6","#EADFCE","#241A15"],
    ["Bone","#F9F6F0","#FFFFFF","#F4EFE1","#241A15"],
    ["Sand","#EFE6D2","#F8F1E0","#E0D3B5","#241A15"],
    ["Mist","#ECEBE6","#F6F5F1","#DAD7CB","#241A15"],
    ["Rose","#F8D9E4","#FCE7EF","#EEB6CB","#3D161B"],
    ["Fuchsia","#F1B6CE","#F7CBDB","#DE8DAD","#3D161B"],
    ["Honey","#F8E9AE","#FCF3C9","#EDD279","#241A15"],
    ["Apricot","#FBDBBC","#FDE8D3","#F2B985","#241A15"],
    ["Sage","#E6EDE4","#F2F7F0","#CBD8C7","#12251C"],
    ["Sky","#E4EDF5","#F1F6FB","#C4D6E7","#13233D"],
    ["Lilac","#EBE6F2","#F5F1FA","#CFC4E0","#2C1740"],
    ["Maroon","#3D161B","#54242B","#602E36","#FBEFE6"],
    ["Mulberry","#4A1734","#632649","#702F55","#FBEFE6"],
    ["Plum","#2C1740","#412759","#4C3066","#F1E9FA"],
    ["Ocean","#13233D","#223758","#2B4166","#E7F0FB"],
    ["Forest","#12251C","#1F3B2E","#274737","#E6F3EA"],
    ["Slate","#1A1D21","#2B3037","#353B43","#EDF1F5"],
    ["Cocoa","#241A15","#392B22","#46352A","#F7EDE4"],
    ["Teal","#0F2529","#1C3F45","#244E55","#E4F4F4"],
    ["Ink","#13110E","#2A2722","#332F28","#F7F3EC"],
    ["Black","#000000","#121212","#1C1C1C","#FFFFFF"]
  ];
  var pv = document.getElementById("pv"), name = document.getElementById("pvName"),
      sw = document.getElementById("sw");
  if (!pv || !sw) return;

  function hexA(h, a) {
    var n = parseInt(h.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  var accents = ["#C8501B","#B8790E","#A81F3C","#1C6B63","#6B3FA0","#1F4FA8","#E8B923"];
  var i = 0, timer = null, pinned = false;

  function wear(n) {
    var p = P[n]; i = n;
    pv.style.setProperty("--pv-bg", p[1]);
    pv.style.setProperty("--pv-surf", p[2]);
    pv.style.setProperty("--pv-warm", p[3]);
    pv.style.setProperty("--pv-ink", p[4]);
    // AuriaTheme: line = ink at 10%. Rebuild it from the ink hex so the
    // chip outlines sit right on every palette, light or dark.
    pv.style.setProperty("--pv-line", hexA(p[4], .12));
    pv.style.setProperty("--pv-accent", accents[n % accents.length]);
    name.textContent = p[0];
    [].forEach.call(sw.children, function (b, k) {
      b.setAttribute("aria-pressed", String(k === n));
    });
  }

  P.forEach(function (p, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.style.background = "linear-gradient(135deg," + p[2] + " 0 50%," + p[1] + " 50% 100%)";
    b.setAttribute("aria-label", p[0]);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { pinned = true; clearInterval(timer); wear(n); });
    sw.appendChild(b);
  });

  wear(0);

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches &&
      "IntersectionObserver" in window) {
    // only cycle while it is actually on screen
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (pinned) return;
        clearInterval(timer);
        if (e.isIntersecting) timer = setInterval(function () { wear((i + 1) % P.length); }, 1700);
      });
    }, { threshold: .35 }).observe(pv);
  }
})();
