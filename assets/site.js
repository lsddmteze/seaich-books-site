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
    a.addEventListener("click", function () { track("retailer_click", { format: k, book: a.getAttribute("data-book") || "far-off-land" }); });
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
    var tag = function (net) { return url + (url.indexOf("?") > -1 ? "&" : "?") + "utm_source=" + net + "&utm_medium=social&utm_campaign=share"; };
    var links = {
      x: "https://twitter.com/intent/tweet?text=" + e(text) + "&url=" + e(tag("x")),
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + e(tag("facebook")),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + e(tag("linkedin")),
      reddit: "https://www.reddit.com/submit?url=" + e(tag("reddit")) + "&title=" + e(text),
      pinterest: "https://pinterest.com/pin/create/button/?url=" + e(tag("pinterest")) + "&media=" + e(img) + "&description=" + e(text),
      whatsapp: "https://wa.me/?text=" + e(text + " " + tag("whatsapp")),
      threads: "https://www.threads.net/intent/post?text=" + e(text + " " + tag("threads")),
      bluesky: "https://bsky.app/intent/compose?text=" + e(text + " " + tag("bluesky")),
      email: "mailto:?subject=" + e(text) + "&body=" + e(text + "\n\n" + tag("email"))
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


  /* ---- CRM attribution: first and latest touch (UTM, referrer, landing page) ---- */
  var ATTR = {};
  (function () {
    try {
      var q = new URLSearchParams(location.search), now = new Date().toISOString().slice(0, 10);
      var touch = { source: q.get("utm_source") || "", medium: q.get("utm_medium") || "", campaign: q.get("utm_campaign") || "",
                    content: q.get("utm_content") || "", referrer: document.referrer && document.referrer.indexOf(location.host) < 0 ? document.referrer : "",
                    landing: location.pathname, date: now };
      if (!touch.source && touch.referrer) { try { touch.source = new URL(touch.referrer).hostname.replace(/^www\./, ""); touch.medium = "referral"; } catch (e) {} }
      var ft = JSON.parse(localStorage.getItem("slp_ft") || "null");
      if (!ft) { ft = touch.source ? touch : { source: "direct", medium: "none", campaign: "", content: "", referrer: "", landing: location.pathname, date: now }; localStorage.setItem("slp_ft", JSON.stringify(ft)); }
      if (touch.source) localStorage.setItem("slp_lt", JSON.stringify(touch));
      var lt = JSON.parse(localStorage.getItem("slp_lt") || "null") || ft;
      var views = (parseInt(localStorage.getItem("slp_pv") || "0", 10) || 0) + 1; localStorage.setItem("slp_pv", String(views));
      ATTR = { first_source: ft.source, first_medium: ft.medium, first_campaign: ft.campaign, first_landing: ft.landing, first_referrer: ft.referrer, first_date: ft.date,
               last_source: lt.source, last_medium: lt.medium, last_campaign: lt.campaign, last_content: lt.content, pages_viewed: views };
    } catch (e) {}
  })();

  /* ---- Mobile buy bar: appears after the first screen, can be closed for the session ---- */
  (function () {
    var bar = $("[data-buybar]"); if (!bar) return;
    var closed = false; try { closed = sessionStorage.getItem("slp_bar") === "x"; } catch (e) {}
    if (closed) { bar.remove(); return; }
    document.body.classList.add("has-buybar");
    function upd() { bar.classList.toggle("show", window.scrollY > 520); }
    window.addEventListener("scroll", upd, { passive: true }); upd();
    $("[data-buybar-close]", bar).addEventListener("click", function () {
      bar.remove(); document.body.classList.remove("has-buybar"); try { sessionStorage.setItem("slp_bar", "x"); } catch (e) {}
    });
  })();

  /* ---- Free-sample offer (desktop): once per visitor every 14 days, after reading half a page or 40 seconds ---- */
  (function () {
    var box = $("[data-promo]"); if (!box) return;
    var key = "slp_promo", wait = 14 * 864e5;
    try { var t = parseInt(localStorage.getItem(key) || "0", 10); if (t && Date.now() - t < wait) return; } catch (e) {}
    var shown = false, formInView = false;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        formInView = es.some(function (x) { return x.isIntersecting; });
        if (formInView) box.classList.remove("show");
      });
      $$('form[data-form="newsletter"]').forEach(function (f) { io.observe(f); });
    }
    function show() {
      if (shown || formInView || window.innerWidth <= 860) return;
      var h = document.documentElement; if (h.scrollHeight > 2 * h.clientHeight && (h.scrollTop + h.clientHeight) / h.scrollHeight < 0.55 && !box._timer) return;
      shown = true; box.classList.add("show"); try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
      track("promo_view", { page: location.pathname });
    }
    window.addEventListener("scroll", function () { show(); }, { passive: true });
    setTimeout(function () { box._timer = true; show(); }, 40000);
    $("[data-promo-close]", box).addEventListener("click", function () { box.classList.remove("show"); track("promo_close", {}); });
  })();

  /* ---- Section menu on phones: keep the current page in view ---- */
  (function () {
    var cur = $('.subnav a[aria-current="page"]');
    if (cur && cur.parentNode && window.innerWidth <= 860 && cur.parentNode.scrollWidth > cur.parentNode.clientWidth) {
      try { cur.parentNode.scrollLeft = cur.offsetLeft - 24; } catch (e) {}
    }
  })();

  /* Email signup and contact forms */
  $$("form[data-form]").forEach(function (f) {
    var msg = $(".form-msg", f);
    var kind = f.getAttribute("data-form");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = {}; new FormData(f).forEach(function (v, k) { if (k in data) { data[k] = [].concat(data[k], v); } else { data[k] = (k === "books") ? [v] : v; } });
      if (data.website) return; /* honeypot */
      data.source = location.pathname; data.form = kind;
      for (var ak in ATTR) if (ATTR.hasOwnProperty(ak)) data[ak] = ATTR[ak];
      var endpoint = (kind === "contact" || kind === "course") ? (CFG.contactEndpoint || CFG.newsletterEndpoint) : CFG.newsletterEndpoint;
      var isMsg = kind === "contact" || kind === "course";
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
        revealSample(isMsg ? "This form is not connected yet. Please try again soon." : (sample ? "Signups open soon. Your free sample is ready now:" : "Signups open soon. Please check back."));
        track("signup_unconfigured", { form: kind });
        return;
      }
      if (msg) msg.textContent = "Sending…";
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          f.reset();
          revealSample(isMsg ? "Thank you. Your message was received." : (sample ? "You’re on the list. Here is your free sample:" : "You’re on the list."));
          track(kind === "course" ? "course_inquiry" : (kind === "contact" ? "contact_submit" : "sign_up"), { method: "email", first_source: ATTR.first_source || "" });
          track("generate_lead", { lead_source: kind, page: location.pathname, first_source: ATTR.first_source || "" });
        })
        .catch(function () {
          if (!isMsg && sample) { revealSample("We couldn’t add you to the list just now, but your free sample is ready:"); track("signup_error", { form: kind }); return; }
          if (msg) msg.textContent = "That didn’t go through. Please check your connection and try again.";
        });
    });
  });


  /* Tracked links (sample download etc.) */
  $$("[data-track]").forEach(function (a) {
    a.addEventListener("click", function () { track(a.getAttribute("data-track"), { page: location.pathname }); });
  });

  /* Reader paths (Start Here) */
  $$(".paths").forEach(function (box) {
    var btns = $$("[data-path]", box);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-path");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(".path-out", box).forEach(function (p) { p.hidden = p.getAttribute("data-out") !== k; });
        track("quiz_complete", { path: k });
      });
    });
  });

  /* Glossary filter */
  var gq = $("#gloss-q");
  if (gq) {
    var terms = $$(".gl-item"), gout = $("#gloss-out"), gcat = "";
    var run = function () {
      var q = gq.value.trim().toLowerCase(), n = 0;
      terms.forEach(function (t) {
        var ok = (!q || t.textContent.toLowerCase().indexOf(q) > -1) && (!gcat || t.getAttribute("data-cat") === gcat);
        t.hidden = !ok; if (ok) n++;
      });
      $$(".gl-group").forEach(function (g) { g.hidden = !$$(".gl-item", g).some(function (t) { return !t.hidden; }); });
      if (gout) gout.textContent = (q || gcat) ? n + (n === 1 ? " term" : " terms") : "";
    };
    gq.addEventListener("input", run);
    $$("[data-gcat]").forEach(function (c) {
      c.addEventListener("click", function () {
        var on = c.getAttribute("aria-pressed") !== "true";
        $$("[data-gcat]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        if (on) c.setAttribute("aria-pressed", "true");
        gcat = on ? c.getAttribute("data-gcat") : ""; run(); track("glossary_filter", { cat: gcat || "all" });
      });
    });
  }

  /* Site search (modal) */
  var sd = $("dialog.search"), sinput = sd ? $("input", sd) : null, sres = sd ? $(".s-results", sd) : null, loaded = false;
  function loadIndex(cb) {
    if (loaded || window.SEARCH_INDEX) { loaded = true; cb(); return; }
    var s = document.createElement("script"); s.src = window.SITE_BASE + "assets/search-index.js";
    s.onload = function () { loaded = true; cb(); }; document.head.appendChild(s);
  }
  function href(slug) {
    var hash = "", i = slug.indexOf("#"); if (i > -1) { hash = slug.slice(i); slug = slug.slice(0, i); }
    if (window.SITE_EXT) return window.SITE_BASE + (slug || "index") + ".html" + hash;
    return "/" + slug + hash;
  }
  function search(q) {
    q = q.trim().toLowerCase(); sres.innerHTML = "";
    if (q.length < 2) return;
    var words = q.split(/\s+/), hits = [];
    (window.SEARCH_INDEX || []).forEach(function (it) {
      var hay = (it.t + " " + it.d + " " + (it.k || "")).toLowerCase(), score = 0;
      words.forEach(function (w) { if (hay.indexOf(w) > -1) score += (it.t.toLowerCase().indexOf(w) > -1 ? 3 : 1); else score -= 99; });
      if (score > 0) hits.push([score, it]);
    });
    hits.sort(function (a, b) { return b[0] - a[0]; });
    hits.slice(0, 12).forEach(function (h) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = href(h[1].s); a.innerHTML = "<b></b><span></span>";
      a.firstChild.textContent = h[1].t; a.lastChild.textContent = h[1].d;
      li.appendChild(a); sres.appendChild(li);
    });
    if (!hits.length) { var li = document.createElement("li"); li.className = "none"; li.textContent = "No matches. Try “journal,” “Huxley,” “grace” or “DMN.”"; sres.appendChild(li); }
  }
  function openSearch() {
    if (!sd) return;
    loadIndex(function () { if (sd.showModal) sd.showModal(); else sd.setAttribute("open", ""); sinput.focus(); });
    track("search_open", {});
  }
  $$("[data-search]").forEach(function (b) { b.addEventListener("click", openSearch); });
  if (sd) {
    var tmr; sinput.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { search(sinput.value); }, 120); });
    $("[data-search-close]", sd).addEventListener("click", function () { sd.close(); });
    sd.addEventListener("click", function (e) { if (e.target === sd) sd.close(); });
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target && e.target.tagName;
    if (e.key === "/" && t !== "INPUT" && t !== "TEXTAREA" && t !== "SELECT") { e.preventDefault(); openSearch(); }
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
