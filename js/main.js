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
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
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
      setStatus("Please fill in your business name, your name, a valid email and your type of business.", "error");
      invalid.focus();
      return;
    }

    var data = new FormData(form);

    if (config.formEndpoint) {
      var button = document.getElementById("f-submit");
      button.disabled = true;
      setStatus("Sending your request.", "");
      fetch(config.formEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          form.reset();
          setStatus("Thanks. Your request is in and we will be in touch soon.", "ok");
        })
        .catch(function () {
          setStatus("That did not send. Please try again, or email us at " + config.contactEmail + ".", "error");
        })
        .then(function () {
          button.disabled = false;
        });
      return;
    }

    // No form service configured: open the visitor's email app with the request filled in.
    var subject = "Partner quote request: " + data.get("business");
    var body = [
      "Business: " + data.get("business"),
      "Name: " + data.get("name"),
      "Email: " + data.get("email"),
      "Phone: " + (data.get("phone") || "not given"),
      "Type of business: " + data.get("type"),
      "",
      data.get("message") || ""
    ].join("\n");
    window.location.href =
      "mailto:" + config.contactEmail +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    setStatus("Your email app should open with the request ready to send. If it does not, email " + config.contactEmail + ".", "ok");
  });
})();
