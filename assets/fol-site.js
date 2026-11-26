/* The Far-Off Land — site behaviour. No dependencies. */
(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Buy links: config overrides the built-in Amazon search links once product pages exist */
  $$("[data-buy]").forEach(function (a) {
    var k = a.getAttribute("data-buy");
    if (k === "paperback" && CFG.amazonPaperback) a.href = CFG.amazonPaperback;
    if (k === "kindle" && CFG.amazonKindle) a.href = CFG.amazonKindle;
    a.addEventListener("click", function () { track("buy_click", { format: k }); });
  });

  /* Analytics (optional): GA4 measurement ID in config.js */
  function track(name, params) {
    try { if (window.gtag) window.gtag("event", name, params || {}); } catch (e) {}
  }
  if (CFG.ga4) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", CFG.ga4);
  }

  /* Mobile menu */
  var mb = $(".menu-btn"), nav = $("#nav");
  if (mb && nav) mb.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    mb.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* Share */
  function pageUrl() { var c = $('link[rel="canonical"]'); return c ? c.href : location.href; }
  $$(".share").forEach(function (box) {
    var url = box.getAttribute("data-url") || pageUrl();
    var text = box.getAttribute("data-text") || document.title;
    var img = box.getAttribute("data-img") || "";
    var e = encodeURIComponent;
    var links = {
      x: "https://twitter.com/intent/tweet?text=" + e(text) + "&url=" + e(url),
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + e(url),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + e(url),
      reddit: "https://www.reddit.com/submit?url=" + e(url) + "&title=" + e(text),
      pinterest: "https://pinterest.com/pin/create/button/?url=" + e(url) + "&media=" + e(img) + "&description=" + e(text),
      whatsapp: "https://wa.me/?text=" + e(text + " " + url),
      threads: "https://www.threads.net/intent/post?text=" + e(text + " " + url),
      bluesky: "https://bsky.app/intent/compose?text=" + e(text + " " + url),
      email: "mailto:?subject=" + e(text) + "&body=" + e(text + "\n\n" + url)
    };
    $$("a[data-net]", box).forEach(function (a) {
      var n = a.getAttribute("data-net"); if (links[n]) a.href = links[n];
      a.addEventListener("click", function () { track("share", { method: n }); });
    });
    var copy = $("button[data-copy-link]", box);
    if (copy) copy.addEventListener("click", function () { copyText(url, copy, "Link copied"); track("share", { method: "copy" }); });
    var nat = $("button[data-native]", box);
    if (nat) {
      if (navigator.share) {
        nat.hidden = false;
        nat.addEventListener("click", function () {
          navigator.share({ title: document.title, text: text, url: url }).catch(function () {});
          track("share", { method: "native" });
        });
      }
    }
  });
  function copyText(t, btn, done) {
    var old = btn.textContent;
    var ok = function () { btn.textContent = done || "Copied"; setTimeout(function () { btn.textContent = old; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(ok, function () { btn.textContent = "Select and copy"; });
    } else { btn.textContent = "Select and copy"; }
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = document.getElementById(b.getAttribute("data-copy"));
      if (el) copyText(el.innerText.trim(), b, "Copied");
    });
  });

  /* Nine sessions explorer (tabs) */
  $$(".track").forEach(function (track) {
    var tabs = $$('[role="tab"]', track);
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); track("session_view", { n: i + 1 }); });
      t.addEventListener("keydown", function (ev) {
        if (ev.key === "ArrowRight") { ev.preventDefault(); select((i + 1) % tabs.length, true); }
        if (ev.key === "ArrowLeft") { ev.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    $$("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        var cur = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
        var d = parseInt(b.getAttribute("data-step"), 10);
        select((cur + d + tabs.length) % tabs.length, true);
      });
    });
  });

  /* Generic chip filters: <div class="chips" data-filter="#target" data-attr="data-tags"> */
  $$(".chips[data-filter]").forEach(function (box) {
    var target = $(box.getAttribute("data-filter"));
    var attr = box.getAttribute("data-attr") || "data-tags";
    var cls = box.getAttribute("data-dim") || "dim";
    var hlc = box.getAttribute("data-hl") || "";
    var out = box.getAttribute("data-out") ? $(box.getAttribute("data-out")) : null;
    var chips = $$(".chip", box);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var on = c.getAttribute("aria-pressed") !== "true";
        chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        if (on) c.setAttribute("aria-pressed", "true");
        var key = on ? c.getAttribute("data-key") : "";
        var n = 0;
        $$("[" + attr + "]", target).forEach(function (el) {
          var match = !key || (" " + el.getAttribute(attr) + " ").indexOf(" " + key + " ") > -1;
          if (match && key) n++;
          el.classList.toggle(cls, !match);
          if (hlc) el.classList.toggle(hlc, !!key && match);
        });
        if (out) out.textContent = key ? (n + " " + (n === 1 ? "match" : "matches") + " for " + c.textContent) : "";
        track("filter", { key: key || "all" });
      });
    });
  });

  /* Facsimile lightbox */
  var lb = $("dialog.lb");
  if (lb) {
    var items = $$(".gallery [data-full]"), idx = 0;
    var img = $("img", lb), cap = $(".lb-cap", lb);
    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].getAttribute("data-full");
      img.alt = items[idx].getAttribute("data-cap");
      cap.textContent = "Facsimile " + (idx + 1) + " of " + items.length + ". " + items[idx].getAttribute("data-cap");
    }
    items.forEach(function (b, i) { b.addEventListener("click", function () { show(i); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(idx - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(idx + 1); });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close ? lb.close() : lb.removeAttribute("open"); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* Email signup and contact forms */
  $$("form[data-form]").forEach(function (f) {
    var msg = $(".form-msg", f);
    var kind = f.getAttribute("data-form");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
      if (data.website) return; /* honeypot */
      data.source = location.pathname; data.form = kind;
      var endpoint = kind === "contact" ? (CFG.contactEndpoint || CFG.newsletterEndpoint) : CFG.newsletterEndpoint;
      var sample = f.getAttribute("data-sample");
      function revealSample(prefix) {
        if (!msg) return;
        msg.innerHTML = "";
        msg.appendChild(document.createTextNode(prefix));
        if (sample) {
          var a = document.createElement("a"); a.href = sample; a.textContent = "Download the free sample (PDF)";
          msg.appendChild(document.createTextNode(" ")); msg.appendChild(a);
        }
      }
      if (!endpoint) {
        revealSample(kind === "contact" ? "The message form is not connected yet. Please write to the publisher directly." : "Signups open soon. Your free sample is ready now:");
        track("signup_unconfigured", { form: kind });
        return;
      }
      if (msg) msg.textContent = "Sending…";
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          f.reset();
          revealSample(kind === "contact" ? "Thank you. Your message was received." : "You’re on the list. Here is your free sample:");
          track(kind === "contact" ? "contact_submit" : "sign_up", { method: "email" });
        })
        .catch(function () { if (msg) msg.textContent = "That didn’t go through. Please check your connection and try again."; });
    });
  });

  /* Reading progress + back to top */
  var bar = $(".progress"), top = $(".to-top");
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (bar && max > 0) bar.style.width = (100 * h.scrollTop / max) + "%";
    if (top) top.classList.toggle("show", h.scrollTop > 900);
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
