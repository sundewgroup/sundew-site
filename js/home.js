/* sundew home: scroll story, tabs, inquiry form. No dependencies. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfg = window.SUNDEW_CONFIG || {};
  root.classList.add("js");
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var year = $("#year"); if (year) year.textContent = new Date().getFullYear();
  var mail = $("#contact-email-link");
  if (mail && cfg.contactEmail) { mail.href = "mailto:" + cfg.contactEmail; mail.textContent = cfg.contactEmail; }

  /* hero headline: one masked line per <br> */
  $$("[data-split]").forEach(function (el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) { return '<span class="split-line"><span>' + p + "</span></span>"; }).join("");
  });

  /* statement that fills in word by word */
  var fills = $$("[data-fill]").map(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    return { el: el, words: $$(".w", el) };
  });

  /* reveals */
  var risers = $$("[data-rise], .options-list li");
  if (reduce || !("IntersectionObserver" in window)) {
    risers.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    risers.forEach(function (el) { io.observe(el); });
  }

  /* horizontal story */
  var how = $("#how"), track = $("#how-track"), now = $("#how-now"), bar = $("#how-bar");
  var steps = track ? $$(".step", track) : [];
  var vids = steps.map(function (s) { return $("video", s); });
  var desktop = window.matchMedia("(min-width: 861px)");
  var lastStep = -1;
  function setStep(i) {
    if (i === lastStep) return; lastStep = i;
    if (now) now.textContent = "0" + (i + 1);
    vids.forEach(function (v, k) {
      if (!v) return;
      if (k === i && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  }
  if (!desktop.matches || reduce) {
    /* stacked layout: play films when they are on screen */
    if ("IntersectionObserver" in window && !reduce) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else e.target.pause(); });
      }, { threshold: 0.4 });
      vids.forEach(function (v) { if (v) vio.observe(v); });
    }
  }

  var bar0 = $("#top-bar"), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset, vh = window.innerHeight;
    var max = doc.body.scrollHeight - vh;
    root.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    root.style.setProperty("--sy", Math.min(y, vh).toFixed(0));
    if (bar0) bar0.classList.toggle("is-solid", y > vh * 0.6);
    fills.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.45), 0, 1);
      var n = Math.round(p * f.words.length);
      f.words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    });
    if (how && track && desktop.matches && !reduce) {
      var span = how.offsetHeight - vh;
      var hp = clamp((y - how.offsetTop) / span, 0, 1);
      track.style.transform = "translate3d(" + (-hp * (steps.length - 1) * 100) + "vw,0,0)";
      if (bar) bar.style.setProperty("--hp", ((hp * (steps.length - 1) + 1) / steps.length).toFixed(4));
      setStep(Math.round(hp * (steps.length - 1)));
    } else if (track) { track.style.transform = ""; }
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  /* partnership tabs */
  var tabs = $$(".tab"), panels = $$(".panel");
  function pick(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on; panels[k].classList.toggle("is-on", on);
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { pick(i); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); pick((i + tabs.length - 1) % tabs.length, true); }
    });
  });
  var select = $("#f-interest");
  $$("[data-interest]").forEach(function (a) {
    a.addEventListener("click", function () { if (select) select.value = a.getAttribute("data-interest"); });
  });

  /* buttons lean toward the cursor */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    $$("[data-magnet]").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* inquiry form */
  var form = $("#contact-form"), status = $("#form-status");
  if (!form || !status) return;
  function say(msg, kind) { status.textContent = msg; status.className = "form-status" + (kind ? " is-" + kind : ""); }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var bad = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var ok = el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !bad) bad = el;
    });
    if (bad) { say("Please add your name, your house and a valid email.", "error"); bad.focus(); return; }
    var data = new FormData(form);
    if (cfg.formEndpoint) {
      say("Sending.");
      fetch(cfg.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("send"); form.reset(); say("Thank you. We will reply within 24 hours."); })
        .catch(function () { say("That did not send. Please text (925) 876-9255 or email " + (cfg.contactEmail || "hello@sundewgroup.com") + ".", "error"); });
      return;
    }
    var subject = "Pilot request: " + data.get("interest") + " (" + data.get("house") + ")";
    var body = ["Name: " + data.get("name"), "House or company: " + data.get("house"), "Email: " + data.get("email"), "Inquiring about: " + data.get("interest"), "", data.get("message") || ""].join("\n");
    window.location.href = "mailto:" + (cfg.contactEmail || "hello@sundewgroup.com") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    say("Your email app should now be open with the request ready to send.");
  });
})();
