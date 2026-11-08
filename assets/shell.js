/* =========================================================================
   shell.js   (vanilla, no build)

   The SHARED CHROME for every page: app bar, the ranked 01–10 switcher and the
   footer. It also owns global state (language + theme) and exposes a tiny
   toolkit on window.LDW that app.js reuses.

   Loaded on EVERY page BEFORE app.js. It:
     1. reads the language from <html lang> and the theme from localStorage
        (falling back to the system colour scheme),
     2. injects app bar + nav + footer around <main id="page">,
     3. wires the theme toggle and points the language link at this page's
        counterpart in the other language,
     4. highlights the current page (from <body data-page="...">).

   Language belongs to the URL, not to the visitor: the Chinese pages live at
   the root and the English ones under /en/, so switching language is a
   navigation rather than an in-place repaint. Theme persists in localStorage
   only once the reader has picked one with the toggle.
   ========================================================================= */
(function () {
  "use strict";

  var META = window.SITE_META || { title: {}, subtitle: {}, footer: {} };
  var PAGES = Array.isArray(window.SITE_PAGES) ? window.SITE_PAGES : [];

  /* ---------- chrome i18n (page content strings live in the data) ---------- */
  var I18N = {
    en: {
      menu: "Risks", skip: "Skip to content", overview: "Ranking", whatsNew: "What's new",
      brand: "LLM Top 10", theme: "Switch light / dark theme", other: "中文版",
      otherLabel: "Read this page in Chinese", rank: "Rank"
    },
    zh: {
      menu: "風險清單", skip: "跳到內容", overview: "排行", whatsNew: "新版焦點",
      brand: "LLM Top 10", theme: "切換淺色／深色主題", other: "English",
      otherLabel: "Read this page in English", rank: "排名"
    }
  };

  /* ---------- sandbox-safe storage ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* ---------- global state ---------- */
  function langFromDocument() {
    var declared = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return declared.indexOf("zh") === 0 ? "zh" : "en";
  }

  /* the same page in the other language — mirror the path, never guess */
  var TWIN_DIR = "/en";
  function altLangHref() {
    var path = location.pathname || "/";
    if (path === TWIN_DIR || path.indexOf(TWIN_DIR + "/") === 0) {
      return path.slice(TWIN_DIR.length) || "/";
    }
    return TWIN_DIR + path;
  }

  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function systemTheme() { return darkQuery && darkQuery.matches ? "dark" : "light"; }
  var saved = lsGet("theme");

  var state = {
    lang:  langFromDocument(),
    theme: saved === "dark" || saved === "light" ? saved : systemTheme(),
    themeChosen: saved === "dark" || saved === "light"
  };

  /* ---------- helpers shared with app.js ---------- */
  function t(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.en || obj.zh || "";
  }
  function ui(key) { return (I18N[state.lang] || I18N.en)[key]; }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function pageHref(p) { return p.slug === "home" ? "index.html" : p.slug + ".html"; }
  function currentSlug() { return document.body.getAttribute("data-page") || "home"; }
  function currentPage() {
    var slug = currentSlug();
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].slug === slug) return PAGES[i];
    return PAGES[0] || null;
  }

  /* A risk page's slug is llm01 … llm10. Its rank drives the colour tier:
     1–3 red, 4–7 amber, 8–10 cyan. */
  function riskInfo(p) {
    var m = p && /^llm(\d\d)$/.exec(p.slug || "");
    if (!m) return null;
    var rank = parseInt(m[1], 10);
    var full = t(p.title);
    var split = /^(LLM\d\d)\s*[:：]\s*(.+)$/.exec(full);
    return {
      rank: rank,
      num: m[1],
      code: split ? split[1] : "LLM" + m[1],
      name: split ? split[2] : full,
      tier: rank <= 3 ? "hi" : rank <= 7 ? "mid" : "lo"
    };
  }
  function risks() { return PAGES.filter(function (p) { return !!riskInfo(p); }); }

  /* =======================================================================
     CHROME INJECTION — app bar, nav, footer around <main id="page">
     ===================================================================== */
  function injectChrome() {
    var main = document.getElementById("page");
    if (!main) return;

    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#page";
    skip.textContent = ui("skip");
    document.body.insertBefore(skip, document.body.firstChild);

    var here = currentSlug();
    var appbar = document.createElement("header");
    appbar.className = "appbar";
    appbar.innerHTML =
      '<div class="appbar__inner">' +
        '<a class="brand" href="index.html" aria-label="' + escapeHtml(t(META.title)) + '">' +
          '<span class="brand__org">OWASP</span>' +
          '<span class="brand__name">' + escapeHtml(ui("brand")) + '</span>' +
          '<span class="brand__ed">2025</span>' +
        '</a>' +
        '<nav class="switcher" id="pageNav" aria-label="' + escapeHtml(ui("menu")) + '"></nav>' +
        '<div class="appbar__actions">' +
          '<a class="icon-btn icon-btn--lang" id="langToggle" href="' + escapeHtml(altLangHref()) + '" ' +
             'hreflang="' + (state.lang === "en" ? "zh-Hant" : "en") + '" rel="alternate" ' +
             'lang="' + (state.lang === "en" ? "zh-Hant" : "en") + '" ' +
             'aria-label="' + escapeHtml(ui("otherLabel")) + '">' +
            '<span class="material-symbols-rounded" aria-hidden="true">translate</span>' +
            '<span class="icon-btn__txt">' + (state.lang === "en" ? "中" : "EN") + '</span>' +
          '</a>' +
          '<button class="icon-btn" id="themeToggle" type="button" aria-label="' + escapeHtml(ui("theme")) + '">' +
            '<span class="material-symbols-rounded" id="themeIcon" aria-hidden="true">dark_mode</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(appbar, main);
    paintNav(document.getElementById("pageNav"), here);

    var footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML =
      '<div class="footer__inner">' +
        '<p class="footer__text">' + escapeHtml(t(META.footer)) + '</p>' +
        '<div class="footer__links" id="footerLinks">' +
          '<a class="icon-btn" href="https://www.peteraim.com" target="_blank" rel="noopener" aria-label="peteraim.com">' +
            '<span class="material-symbols-rounded" aria-hidden="true">home</span>' +
          '</a>' +
          '<a class="icon-btn" href="https://www.linkedin.com/in/ai-med/" target="_blank" rel="noopener" aria-label="LinkedIn">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>' +
          '</a>' +
        '</div>' +
      '</div>';
    main.parentNode.insertBefore(footer, main.nextSibling);

    /* The static HTML carries a plain "English version / 中文版" link after the
       scripts so crawlers and no-JS readers can reach the other language. With
       JS on, fold it into the footer instead of leaving it floating below. */
    var alt = document.querySelector(".lang-alt-link");
    var links = document.getElementById("footerLinks");
    if (alt && links) {
      var a = alt.querySelector("a");
      if (a) {
        a.className = "footer__lang";
        links.insertBefore(a, links.firstChild);
      }
      alt.parentNode.removeChild(alt);
    }
  }

  function paintNav(nav, here) {
    if (!nav) return;
    var html = '<div class="switcher__text">';
    PAGES.forEach(function (p) {
      if (riskInfo(p)) return;
      var on = p.slug === here;
      html += '<a class="switcher__link" href="' + escapeHtml(pageHref(p)) + '"' +
        (on ? ' aria-current="page"' : "") + ">" +
        escapeHtml(p.slug === "home" ? ui("overview") : ui("whatsNew")) + "</a>";
    });
    html += '</div><ol class="switcher__ranks">';
    risks().forEach(function (p) {
      var r = riskInfo(p), on = p.slug === here;
      html += '<li><a class="rank-key t-' + r.tier + '" href="' + escapeHtml(pageHref(p)) + '"' +
        (on ? ' aria-current="page"' : "") +
        ' title="' + escapeHtml(t(p.title)) + '" aria-label="' + escapeHtml(t(p.title)) + '">' +
        r.num + "</a></li>";
    });
    html += "</ol>";
    nav.innerHTML = html;
  }

  /* ---------- document title ---------- */
  function refreshTitle() {
    var page = currentPage();
    var siteTitle = t(META.title);
    /* the home page IS the list, so it carries the list's own name */
    document.title = page && page.slug !== "home" ? t(page.title) + " · " + siteTitle : siteTitle;
  }

  /* =======================================================================
     THEME
     ===================================================================== */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    var icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = state.theme === "dark" ? "light_mode" : "dark_mode";
    var btn = document.getElementById("themeToggle");
    if (btn) btn.setAttribute("aria-pressed", state.theme === "dark" ? "true" : "false");
  }

  function wire() {
    document.getElementById("themeToggle").addEventListener("click", function () {
      state.theme = state.theme === "dark" ? "light" : "dark";
      state.themeChosen = true;
      lsSet("theme", state.theme);
      applyTheme();
    });
    /* follow the system until the reader picks a side */
    if (darkQuery) {
      var onChange = function () {
        if (state.themeChosen) return;
        state.theme = systemTheme();
        applyTheme();
      };
      if (darkQuery.addEventListener) darkQuery.addEventListener("change", onChange);
      else if (darkQuery.addListener) darkQuery.addListener(onChange);
    }
  }

  /* =======================================================================
     PUBLIC TOOLKIT (app.js uses this)
     ===================================================================== */
  window.LDW = {
    ready: false,
    state: state,
    t: t, ui: ui, escapeHtml: escapeHtml,
    lsGet: lsGet, lsSet: lsSet,
    pages: PAGES, meta: META,
    currentPage: currentPage, currentSlug: currentSlug, pageHref: pageHref,
    riskInfo: riskInfo, risks: risks
  };

  function init() {
    applyTheme();
    injectChrome();
    applyTheme();
    refreshTitle();
    wire();
    window.LDW.ready = true;
    document.dispatchEvent(new CustomEvent("ldw:shell-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
