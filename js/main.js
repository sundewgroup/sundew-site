(function () {
  "use strict";

  var config = window.SUNDEW_CONFIG || {};
  document.documentElement.classList.add("js");

  /* ---- Footer year ---- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- Contact email from config ---- */
  var emailLink = document.getElementById("contact-email-link");
  if (emailLink && config.contactEmail) {
    emailLink.href = "mailto:" + config.contactEmail;
    emailLink.textContent = config.contactEmail;
  }

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  var header = document.querySelector(".site-header");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      if (header) header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
  }

  /* ---- Contact form ---- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form || !status) return;

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function validate() {
    var firstInvalid = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var ok = el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !firstInvalid) firstInvalid = el;
    });
    return firstInvalid;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var invalid = validate();
    if (invalid) {
      setStatus("Please add your first name, last name, a valid email and a message.", "error");
      invalid.focus();
      return;
    }

    var data = new FormData(form);

    if (config.formEndpoint) {
      var button = document.getElementById("f-submit");
      button.disabled = true;
      setStatus("Sending your message.", "");
      fetch(config.formEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          form.reset();
          setStatus("Thank you. Our concierge will respond within 24 hours.", "ok");
        })
        .catch(function () {
          setStatus("That did not send. Please try again, or email us at " + config.contactEmail + ".", "error");
        })
        .then(function () {
          button.disabled = false;
        });
      return;
    }

    // No form service configured: open the visitor's email app with the message filled in.
    var name = data.get("first") + " " + data.get("last");
    var subject = "Sundew inquiry: " + data.get("interest") + " (" + name + ")";
    var body = [
      "Name: " + name,
      "Email: " + data.get("email"),
      "House or company: " + (data.get("house") || "not given"),
      "Inquiring about: " + data.get("interest"),
      "",
      data.get("message") || ""
    ].join("\n");
    window.location.href =
      "mailto:" + config.contactEmail +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    setStatus("Your email app should open with the message ready to send. If it does not, email " + config.contactEmail + ".", "ok");
  });
})();

/* ---- Motion: header state, hero light, scroll reveals, pinned story ---- */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header--over");
  var hero = document.querySelector(".hero");
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* Header turns solid once the page scrolls; the hero photo drifts slowly */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle("is-scrolled", y > 60);
      if (hero && !reduce && y < window.innerHeight * 1.2) hero.style.setProperty("--scroll", String(y));
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* A warm light follows the cursor across the hero */
  if (hero && !reduce && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (event) {
      var box = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (event.clientX - box.left) + "px");
      hero.style.setProperty("--my", (event.clientY - box.top) + "px");
    });
  }

  /* Reveal elements as they enter the screen */
  each(document.querySelectorAll("[data-stagger]"), function (group) {
    each(group.children, function (child, index) {
      child.setAttribute("data-reveal", "");
      child.style.setProperty("--d", (index * 0.09) + "s");
    });
  });
  var items = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    each(items, function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });
    each(items, function (el) { revealer.observe(el); });
  }

  /* Pinned story: the photograph changes with the chapter in view */
  var chapters = document.querySelectorAll(".chapter");
  var frames = document.querySelectorAll(".story-media img, .story-media video");
  if (!chapters.length) return;
  if (!("IntersectionObserver" in window)) {
    each(chapters, function (c) { c.classList.add("is-active"); });
    return;
  }
  var storyteller = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var active = Array.prototype.indexOf.call(chapters, entry.target);
      each(chapters, function (c, i) { c.classList.toggle("is-active", i === active); });
      each(frames, function (f, i) {
        f.classList.toggle("is-active", i === active);
        if (f.tagName !== "VIDEO") return;
        if (i === active && !reduce) { var p = f.play(); if (p && p.catch) p.catch(function () {}); }
        else f.pause();
      });
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  each(chapters, function (c) { storyteller.observe(c); });
  chapters[0].classList.add("is-active");
})();
