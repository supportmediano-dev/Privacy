/* Mediano — paper motion.
   Two behaviours, both lifted from the app:

   1. Unfold. A sheet is uncovered as it enters the viewport. It is opaque
      from frame one and never scales — PaperUnfold's rules 1 and 2.
   2. Ripple. Material's tap feedback, so a press feels like it landed.       */

(function () {
  "use strict";

  var sheets = document.querySelectorAll(".unfold");

  /* ---- unfold ----
     The hiding rule lives behind .paper-js, so it only applies once this
     script is alive. No script, no hidden content. */
  document.documentElement.classList.add("paper-js");

  function open1(el) {
    el.classList.add("open");
    // and let go of the clip once it is open, so shadows are not cut square
    setTimeout(function () { el.classList.add("done"); }, 520);
  }

  function openAll() {
    sheets.forEach(open1);
  }

  /* Last resort: whatever happens with the observer, nothing stays covered. */
  setTimeout(openAll, 1600);

  if (!("IntersectionObserver" in window)) {
    openAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings slightly, the way a stack of paper falls open.
        var delay = Number(el.dataset.delay || 0);
        setTimeout(function () { open1(el); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    sheets.forEach(function (el, i) {
      if (!el.dataset.delay) el.dataset.delay = String((i % 3) * 60);
      io.observe(el);
    });
  }

  /* ---- ripple ---- */
  document.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest(".btn");
    if (!btn || btn.getAttribute("aria-disabled") === "true") return;

    var box = btn.getBoundingClientRect();
    var size = Math.max(box.width, box.height);
    var ink = document.createElement("span");
    ink.className = "ripple";
    ink.style.width = ink.style.height = size + "px";
    ink.style.left = (e.clientX - box.left - size / 2) + "px";
    ink.style.top = (e.clientY - box.top - size / 2) + "px";
    btn.appendChild(ink);
    setTimeout(function () { ink.remove(); }, 560);
  });
})();

/* ---- skin ----
   The app ships two designs behind one toggle in Settings → Appearance.
   The site does the same. The choice is remembered per visitor. */
(function () {
  "use strict";

  var KEY = "mediano-skin";
  var root = document.documentElement;

  function apply(skin) {
    if (skin === "glass") root.setAttribute("data-skin", "glass");
    else root.setAttribute("data-skin", "paper");
    document.querySelectorAll(".skin-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.skin === skin));
    });
  }

  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  apply(saved === "glass" ? "glass" : "paper");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".skin-switch button");
    if (!btn) return;
    var skin = btn.dataset.skin;
    apply(skin);
    try { localStorage.setItem(KEY, skin); } catch (err) { /* private mode: fine */ }
  });
})();

/* ---- screenshots follow the skin ----
   Paper shows the classic shell, Glass shows the Liquid Glass one. Same
   screens, same tracks, photographed twice. */
(function () {
  "use strict";

  var shots = document.querySelectorAll("img[data-glass]");
  if (!shots.length) return;

  // Preload the glass set once, so the first toggle does not flash a gap.
  var warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    shots.forEach(function (img) { new Image().src = img.dataset.glass; });
  }

  function paint(skin) {
    shots.forEach(function (img) {
      var next = skin === "glass" ? img.dataset.glass : img.dataset.paper;
      if (next && img.getAttribute("src") !== next) img.setAttribute("src", next);
    });
  }

  // Run after the skin module has set the attribute, and on every change.
  paint(document.documentElement.dataset.skin);
  new MutationObserver(function () {
    paint(document.documentElement.dataset.skin);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin"] });

  document.addEventListener("pointerover", warm, { once: true });
  setTimeout(warm, 2500);
})();
