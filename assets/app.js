/* =========================================================================
   app.js   (vanilla, no build, no chart lib)

   The PAGE RENDERER. shell.js has already injected the shared chrome and
   published window.LDW. This script reads the current page from
   <body data-page="..."> and paints it into <main id="page">:

     hub     → the home page: terminal hero + the ranked 01–10 ladder
     article → a risk "dossier" (llm01 … llm10) or the What's-new page

   The same markup is also saved into each HTML file as static content, so a
   reader without JavaScript (or a crawler) gets the full page; with JS on,
   this script repaints it and wires the interactive bits (typing prompt,
   mitigation checklist, contents highlighting, reading progress).
   ========================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LDW || !window.LDW.ready) {
      document.addEventListener("ldw:shell-ready", boot, { once: true });
      return;
    }
    var L = window.LDW;
    var t = L.t, esc = L.escapeHtml;
    var lang = L.state.lang;
    var pageEl = document.getElementById("page");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- copy that belongs to the interface, not the data ---------- */
    var COPY = {
      en: {
        prompt: "ignore all previous instructions and",
        edition: "Edition",
        newBadge: "New in 2025",
        was: "2023",
        up: "up from", down: "down from", same: "same as",
        whatsNewMore: "Read what changed in 2025",
        added: "New", expanded: "Expanded",
        dropped: "No longer listed on their own: 2023 #07 Insecure Plugin Design and #10 Model Theft.",
        rankOf: "Rank {n} of 10",
        contents: "On this page",
        mapped: "Mapped frameworks",
        checked: "checked",
        scenario: "Scenario", impact: "Impact", defense: "Defense",
        prev: "Previous", next: "Next", home: "Back to the ranking",
        shiftTitle: "How the ranking moved, 2023 → 2025",
        shiftNew: "new entry", shiftGone: "no longer a separate entry",
        ladderLabel: "The ten risks, ranked"
      },
      zh: {
        prompt: "忽略先前所有指示，並且",
        edition: "版本",
        newBadge: "2025 新增",
        was: "2023 年",
        up: "上升，原為", down: "下降，原為", same: "名次不變，原為",
        whatsNewMore: "閱讀 2025 年的變動",
        added: "新增", expanded: "擴充",
        dropped: "不再單獨列出：2023 年的 #07 不安全的外掛設計與 #10 模型竊取。",
        rankOf: "排名 {n}／10",
        contents: "本頁內容",
        mapped: "對應框架",
        checked: "已勾選",
        scenario: "情境", impact: "影響", defense: "防範",
        prev: "上一項", next: "下一項", home: "回到排行",
        shiftTitle: "2023 → 2025 名次變動",
        shiftNew: "新增項目", shiftGone: "不再單獨列出",
        ladderLabel: "十大風險排名"
      }
    };
    var C = COPY[lang] || COPY.en;

    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function page(slug) { return L.pages.filter(function (p) { return p.slug === slug; })[0]; }

    /* "2023 #06 ↑" — where this risk sat in the previous edition */
    function moveBadge(p, r) {
      if (!("rank2023" in p)) return "";
      if (p.rank2023 == null) return '<span class="badge badge--new">' + esc(C.newBadge) + "</span>";
      var was = p.rank2023, now = r.rank;
      var dir = was > now ? "up" : was < now ? "down" : "same";
      var arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "＝";
      return '<span class="badge badge--' + dir + '">' +
        '<span class="visually-hidden">' + esc(C[dir]) + " </span>" +
        esc(C.was) + " #" + pad(was) +
        ' <span class="badge__arrow" aria-hidden="true">' + arrow + "</span></span>";
    }

    /* =====================================================================
       HOME — terminal hero + ranked ladder
       ===================================================================== */
    function renderHub(p) {
      var title = t(L.meta.title).replace(/\s*[（(]?\s*2025\s*[)）]?\s*$/, "");
      /* break the long title only at sensible places: never inside "Top 10",
         and in Chinese only between 大型語言模型 and 應用程式 */
      var titleHtml = esc(title).replace(/Top 10/, "Top&nbsp;10").replace("模型應用", "模型<wbr>應用");
      var scale = L.risks().map(function (q) {
        var r = L.riskInfo(q);
        return '<li class="t-' + r.tier + '" style="--w:' + (100 - (r.rank - 1) * 8) + '%">' +
          '<span class="hero__scale-n">' + r.num + '</span><span class="hero__scale-bar"></span></li>';
      }).join("");
      var edition = p.edition || "2025";
      var status = (p.stats || []).map(function (s) {
        return "<div><dt>" + esc(t(s.label)) + "</dt><dd>" + esc(String(s.value)) + "</dd></div>";
      }).join("") + "<div><dt>" + esc(C.edition) + "</dt><dd>" + esc(edition) + "</dd></div>";

      var rungs = L.risks().map(function (q) {
        var r = L.riskInfo(q);
        return '<li class="rung t-' + r.tier + (r.rank <= 3 ? " rung--top" : "") + '">' +
          '<a class="rung__link" href="' + esc(L.pageHref(q)) + '">' +
            '<span class="rung__rank" aria-hidden="true">' + r.num + "</span>" +
            '<span class="rung__body">' +
              '<span class="rung__code">' + esc(r.code) + "</span>" +
              '<h2 class="rung__name">' + esc(r.name) + "</h2>" +
              '<span class="rung__sum">' + esc(t(q.subtitle)) + "</span>" +
            "</span>" +
            '<span class="rung__meta">' + moveBadge(q, r) + "</span>" +
          "</a></li>";
      }).join("");

      var wn = page("whats-new");
      var focus = [["llm07", "added"], ["llm08", "added"], ["llm06", "expanded"], ["llm10", "expanded"]]
        .map(function (pair) {
          var q = page(pair[0]); if (!q) return "";
          var r = L.riskInfo(q);
          return '<li><a href="' + esc(L.pageHref(q)) + '">' +
            '<span class="rank-chip t-' + r.tier + '" aria-hidden="true">' + r.num + "</span>" +
            '<span class="callout__name">' + esc(r.name) + "</span>" +
            '<span class="tag tag--' + pair[1] + '">' + esc(C[pair[1]]) + "</span></a></li>";
        }).join("");

      return '<section class="hero" aria-labelledby="hero-title">' +
          '<div class="hero__term">' +
            '<p class="hero__prompt" aria-hidden="true">' +
              '<span class="hero__ps">user@llm-app:~$</span> ' +
              '<span class="hero__typed" id="heroTyped">' + esc(C.prompt) + "</span>" +
              '<span class="caret">█</span>' +
            "</p>" +
            '<h1 class="hero__title" id="hero-title">' + titleHtml +
              ' <span class="hero__ed">' + esc(edition) + "</span></h1>" +
            '<p class="hero__lede">' + esc(t(p.subtitle)) + "</p>" +
            '<dl class="hero__status">' + status + "</dl>" +
            '<ol class="hero__scale" aria-hidden="true">' + scale + "</ol>" +
          "</div>" +
        "</section>" +
        '<div class="board">' +
          '<ol class="ladder" aria-label="' + esc(C.ladderLabel) + '">' + rungs + "</ol>" +
          (wn ? '<aside class="callout" aria-labelledby="callout-title">' +
            '<h2 class="callout__title" id="callout-title">' + esc(t(wn.title)) + "</h2>" +
            '<p class="callout__sub">' + esc(t(wn.subtitle)) + "</p>" +
            '<ul class="callout__list">' + focus + "</ul>" +
            '<p class="callout__note">' + esc(C.dropped) + "</p>" +
            '<a class="callout__more" href="' + esc(L.pageHref(wn)) + '">' + esc(C.whatsNewMore) + "</a>" +
          "</aside>" : "") +
        "</div>";
    }

    /* =====================================================================
       ARTICLE — risk dossier / What's new
       ===================================================================== */

    /* "Constrain model behavior: Provide …" → term + body */
    function splitTerm(s) {
      var m = /^([^:：。]{2,80})[:：]\s*([\s\S]+)$/.exec(s);
      if (!m) return null;
      var max = lang === "zh" ? 30 : 80;
      if (m[1].length > max || /[.。]/.test(m[1])) return null;
      return { term: m[1], body: m[2] };
    }
    function termItem(s) {
      var sp = splitTerm(s);
      return sp ? '<b class="term">' + esc(sp.term) + "</b> " + esc(sp.body) : esc(s);
    }

    /* "Scenario #1: Direct Injection — An attacker …" */
    function parseScenario(s) {
      var re = lang === "zh"
        ? /^情境\s*#(\d+)\s*(?:（([^）]*)）)?\s*[:：]\s*([\s\S]*)$/
        : /^Scenario\s*#(\d+)\s*(?:\(([^)]*)\))?\s*:\s*([\s\S]*)$/;
      var m = re.exec(s);
      if (!m) return { num: null, title: "", body: s };
      var title = m[2] || "", body = m[3];
      if (!title) {
        var d = /^([^。.—]{2,60}?)\s*—\s*([\s\S]+)$/.exec(body);
        if (d) { title = d[1]; body = d[2]; }
      }
      return { num: parseInt(m[1], 10), title: title, body: body };
    }
    /* Pull an explicit "Mitigation:" tail and the consequence clause of the
       last sentence out of a scenario, so each can be set on its own line.
       The words are the source's own — only the line breaks are added. */
    function splitScenarioBody(body) {
      var out = { msg: body, impact: "", fixLabel: "", fix: "" };
      var mi = /\s*(Mitigation|緩解措施)\s*[:：]\s*/.exec(out.msg);
      if (mi) {
        out.fixLabel = mi[1];
        out.fix = out.msg.slice(mi.index + mi[0].length);
        out.msg = out.msg.slice(0, mi.index);
      }
      var msg = out.msg;
      var lastStop = Math.max(msg.lastIndexOf("。", msg.length - 2), msg.lastIndexOf(". ", msg.length - 3));
      var cons = lang === "zh" ? ["，最終導致", "，導致", "，造成", "，進而"] : [", leading to ", ", resulting in ", ", causing "];
      var best = -1, hit = "";
      cons.forEach(function (c) {
        var i = msg.indexOf(c, lastStop + 1);
        if (i !== -1 && (best === -1 || i < best)) { best = i; hit = c; }
      });
      if (best > 0 && msg.length - best > 6) {
        out.impact = msg.slice(best + 1).trim();
        out.msg = msg.slice(0, best);
      }
      return out;
    }

    function transcript(items, slug) {
      var n = 0;
      return '<ol class="transcript">' + items.map(function (s, i) {
        var sc = parseScenario(s);
        if (sc.num == null && i > 0) {
          return '<li class="tx tx--defense"><p class="tx__line tx__line--fix">' +
            '<span class="tx__label">' + esc(C.defense) + "</span>" + esc(s) + "</p></li>";
        }
        n = sc.num || n + 1;
        var parts = splitScenarioBody(sc.body);
        return '<li class="tx" id="' + esc(slug) + "-scenario-" + n + '">' +
          '<p class="tx__head"><span class="tx__id">#' + pad(n) + "</span>" +
            (sc.title ? '<span class="tx__title">' + esc(sc.title) + "</span>"
                      : '<span class="tx__title tx__title--plain">' + esc(C.scenario) + "</span>") + "</p>" +
          '<p class="tx__msg">' + esc(parts.msg) + "</p>" +
          (parts.impact ? '<p class="tx__line tx__line--impact"><span class="tx__label">' + esc(C.impact) + "</span>" + esc(parts.impact) + "</p>" : "") +
          (parts.fix ? '<p class="tx__line tx__line--fix"><span class="tx__label">' + esc(parts.fixLabel) + "</span>" + esc(parts.fix) + "</p>" : "") +
          "</li>";
      }).join("") + "</ol>";
    }

    function checklist(items, id) {
      return '<ul class="checklist">' + items.map(function (s, i) {
        var key = id + ":" + i;
        return '<li><label class="ck"><input type="checkbox" data-ck="' + esc(key) + '" />' +
          '<span class="ck__box" aria-hidden="true"></span>' +
          '<span class="ck__text">' + termItem(s) + "</span></label></li>";
      }).join("") + "</ul>";
    }

    function hostOf(url) {
      var m = /^https?:\/\/(?:www\.)?([^\/?#]+)/i.exec(url || "");
      return m ? m[1] : "";
    }
    function refList(refs, framework) {
      return '<ol class="' + (framework ? "refs refs--fw" : "refs") + '">' + refs.map(function (lk) {
        var label = esc(t(lk.label)), url = lk.url || "";
        var host = hostOf(url);
        if (!url) return '<li class="refs__item"><span class="refs__label">' + label + "</span></li>";
        return '<li class="refs__item"><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="refs__label">' + label + "</span>" +
          (host ? '<span class="refs__host">' + esc(host) + "</span>" : "") + "</a></li>";
      }).join("") + "</ol>";
    }

    function renderBlocks(sec, slug) {
      var ulIndex = 0;
      return (sec.blocks || []).map(function (b) {
        if (b.type === "h3") return "<h3>" + esc(t(b.text)) + "</h3>";
        if (b.type === "quote") return "<blockquote>" + esc(t(b.text)) + "</blockquote>";
        if (b.type === "code") return "<pre><code>" + esc(t(b.text)) + "</code></pre>";
        if (b.type === "links") return refList(b.items || [], sec.id === "frameworks");
        if (b.type === "ul") {
          var arr = (b.items && (b.items[lang] || b.items.en || b.items.zh)) || [];
          var idx = ulIndex++;
          if (sec.id === "scenarios") return transcript(arr, slug);
          if (sec.id === "prevention" && /^llm\d\d$/.test(slug)) return checklist(arr, slug + ":" + sec.id + ":" + idx);
          if (sec.id === "examples") return '<ul class="terms">' + arr.map(function (li) { return "<li>" + termItem(li) + "</li>"; }).join("") + "</ul>";
          return "<ul>" + arr.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>";
        }
        return "<p>" + esc(t(b.text)) + "</p>";
      }).join("");
    }

    function frameworkCode(label) {
      var m = /\b(AML\.TA?\d{4}(?:\.\d{3})?|CWE-\d+|API\d+:\d{4}|ML\d\d:\d{4})\b/.exec(label);
      return m ? m[1] : "";
    }

    /* the 2023 → 2025 slope: two ranked columns joined by lines */
    function shiftChart(p) {
      var olds = p.edition2023 || [];
      if (!olds.length) return "";
      var risks = L.risks();
      var nowRank = {};
      risks.forEach(function (q) { nowRank[q.slug] = L.riskInfo(q).rank; });
      var lines = "";
      olds.forEach(function (o) {
        var y1 = (o.rank - 0.5) * 100;
        if (o.now && nowRank[o.now]) {
          var r = L.riskInfo(page(o.now));
          var y2 = (r.rank - 0.5) * 100;
          lines += '<path class="shift__line t-' + r.tier + '" d="M0 ' + y1 + " C50 " + y1 + " 50 " + y2 + " 100 " + y2 + '" />';
        } else {
          lines += '<path class="shift__line shift__line--gone" d="M0 ' + y1 + " L38 " + y1 + '" />';
        }
      });
      risks.forEach(function (q) {
        if (q.rank2023 === null) {
          var r = L.riskInfo(q), y = (r.rank - 0.5) * 100;
          lines += '<path class="shift__line shift__line--new t-' + r.tier + '" d="M62 ' + y + " L100 " + y + '" />';
        }
      });
      var left = olds.map(function (o) {
        return '<li class="' + (o.now ? "" : "is-gone") + '"><span class="shift__rank">' + pad(o.rank) + "</span>" +
          '<span class="shift__name">' + esc(t(o.name)) + "</span></li>";
      }).join("");
      var right = risks.map(function (q) {
        var r = L.riskInfo(q);
        return '<li class="t-' + r.tier + (q.rank2023 === null ? " is-new" : "") + '"><a href="' + esc(L.pageHref(q)) + '">' +
          '<span class="shift__rank">' + r.num + "</span>" +
          '<span class="shift__name">' + esc(r.name) + "</span></a></li>";
      }).join("");
      return '<figure class="shift">' +
        '<figcaption class="shift__cap">' + esc(C.shiftTitle) +
          '<span class="shift__key"><span class="shift__key-new">' + esc(C.shiftNew) + "</span>" +
          '<span class="shift__key-gone">' + esc(C.shiftGone) + "</span></span></figcaption>" +
        '<div class="shift__grid">' +
          '<p class="shift__col-h">2023</p><span></span><p class="shift__col-h">2025</p>' +
          '<ol class="shift__list shift__list--old">' + left + "</ol>" +
          '<svg class="shift__svg" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">' + lines + "</svg>" +
          '<ol class="shift__list shift__list--new">' + right + "</ol>" +
        "</div></figure>";
    }

    function renderArticle(p) {
      var r = L.riskInfo(p);
      var sections = p.sections || [];
      var toc = sections.map(function (s) {
        return '<li><a class="toc-link" href="#' + esc(s.id) + '" data-toc="' + esc(s.id) + '">' + esc(t(s.heading)) + "</a></li>";
      }).join("");
      var body = sections.map(function (s) {
        var counter = s.id === "prevention" && r ? ' <span class="ck-count" data-ck-count hidden></span>' : "";
        return '<section class="article-section article-section--' + esc(s.id) + '" id="' + esc(s.id) + '" ' +
          'aria-labelledby="' + esc(s.id) + '-h"><h2 id="' + esc(s.id) + '-h">' + esc(t(s.heading)) + counter + "</h2>" +
          renderBlocks(s, p.slug) + "</section>";
      }).join("");

      var fwSec = sections.filter(function (s) { return s.id === "frameworks"; })[0];
      var fwChips = "";
      if (fwSec) {
        (fwSec.blocks || []).forEach(function (b) {
          (b.items || []).forEach(function (lk) {
            var label = t(lk.label), code = frameworkCode(label) || label;
            fwChips += '<li><a class="fw-chip" href="' + esc(lk.url || "#frameworks") + '"' +
              (lk.url ? ' target="_blank" rel="noopener noreferrer"' : "") +
              ' title="' + esc(label) + '">' + esc(code) + "</a></li>";
          });
        });
      }

      var head;
      if (r) {
        var meter = "";
        for (var i = 1; i <= 10; i++) meter += '<span class="meter__cell' + (i === r.rank ? " is-on" : i < r.rank ? " is-above" : "") + '"></span>';
        head = '<header class="dossier t-' + r.tier + '">' +
          '<span class="dossier__rank" aria-hidden="true">' + r.num + "</span>" +
          '<div class="dossier__id">' +
            '<h1 class="dossier__title"><span class="dossier__code">' + esc(r.code) + "</span>" +
              '<span class="dossier__name">' + esc(r.name) + "</span></h1>" +
            '<p class="dossier__sub">' + esc(t(p.subtitle)) + "</p>" +
            '<div class="dossier__meta">' +
              '<span class="meter" role="img" aria-label="' + esc(C.rankOf.replace("{n}", r.rank)) + '">' + meter + "</span>" +
              moveBadge(p, r) +
            "</div>" +
          "</div></header>";
      } else {
        head = '<header class="page-head"><h1>' + esc(t(p.title)) + '<span class="caret" aria-hidden="true">█</span></h1>' +
          (t(p.subtitle) ? '<p class="page-head__sub">' + esc(t(p.subtitle)) + "</p>" : "") + "</header>" +
          shiftChart(p);
      }

      /* prev / next along the ranking */
      var order = ["whats-new"].concat(L.risks().map(function (q) { return q.slug; }));
      var at = order.indexOf(p.slug);
      function pagerLink(slug, dir) {
        var q = page(slug); if (!q) return "";
        var qr = L.riskInfo(q);
        return '<a class="pager__link pager__link--' + dir + (qr ? " t-" + qr.tier : "") + '" href="' + esc(L.pageHref(q)) + '">' +
          '<span class="pager__dir">' + esc(dir === "prev" ? C.prev : C.next) + "</span>" +
          '<span class="pager__title">' + (qr ? '<span class="pager__num">' + qr.num + "</span>" : "") +
          esc(qr ? qr.name : t(q.title)) + "</span></a>";
      }
      var prev = at > 0 ? pagerLink(order[at - 1], "prev") : "";
      var next = at >= 0 && at < order.length - 1 ? pagerLink(order[at + 1], "next")
        : '<a class="pager__link pager__link--next" href="index.html"><span class="pager__dir">' + esc(C.next) +
          '</span><span class="pager__title">' + esc(C.home) + "</span></a>";

      return '<div class="reading-progress" id="readingProgress" aria-hidden="true"></div>' +
        head +
        '<div class="article-layout">' +
          '<div class="article-body prose">' + body + "</div>" +
          '<aside class="rail">' +
            '<nav class="toc" aria-label="' + esc(C.contents) + '"><p class="rail__h">' + esc(C.contents) + "</p><ol>" + toc + "</ol></nav>" +
            (fwChips ? '<div class="rail__fw"><p class="rail__h">' + esc(C.mapped) + '</p><ul class="fw-chips">' + fwChips + "</ul></div>" : "") +
          "</aside>" +
        "</div>" +
        '<nav class="pager" aria-label="' + esc(C.prev + " / " + C.next) + '">' + prev + next + "</nav>";
    }

    /* =====================================================================
       WIRING
       ===================================================================== */
    function wireHub() {
      var el = document.getElementById("heroTyped");
      if (!el || reduceMotion) return;
      var full = el.textContent, i = 0;
      el.textContent = "";
      el.parentNode.classList.add("is-typing");
      var step = lang === "zh" ? 90 : 42;
      (function tick() {
        i++;
        el.textContent = full.slice(0, i);
        if (i < full.length) setTimeout(tick, step);
        else el.parentNode.classList.remove("is-typing");
      })();
    }

    function wireArticle() {
      var prog = document.getElementById("readingProgress");
      var links = [].slice.call(pageEl.querySelectorAll(".toc-link"));
      var secs = [].slice.call(pageEl.querySelectorAll(".article-section"));
      function onScroll() {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        if (prog) prog.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            links.forEach(function (a) {
              var on = a.dataset.toc === en.target.id;
              a.classList.toggle("toc-link--active", on);
              if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
            });
          });
        }, { rootMargin: "-30% 0px -60% 0px" });
        secs.forEach(function (s) { io.observe(s); });
      }

      /* mitigation checklist — ticks are remembered per item in localStorage */
      var boxes = [].slice.call(pageEl.querySelectorAll("input[data-ck]"));
      var counter = pageEl.querySelector("[data-ck-count]");
      function count() {
        if (!counter) return;
        var on = boxes.filter(function (b) { return b.checked; }).length;
        counter.textContent = on + "／" + boxes.length;
        counter.setAttribute("aria-label", on + " / " + boxes.length + " " + C.checked);
        counter.hidden = false;
      }
      boxes.forEach(function (b) {
        b.checked = L.lsGet("ck:" + b.dataset.ck) === "1";
        b.addEventListener("change", function () {
          L.lsSet("ck:" + b.dataset.ck, b.checked ? "1" : "0");
          count();
        });
      });
      count();
    }

    /* =====================================================================
       RENDER the current page
       ===================================================================== */
    var p = L.currentPage();
    if (!p) { pageEl.innerHTML = '<p class="empty">No page data.</p>'; return; }
    var hub = p.layout === "hub";
    pageEl.className = "page page--" + (hub ? "hub" : "article");
    var risk = L.riskInfo(p);
    if (risk) pageEl.classList.add("t-" + risk.tier);
    pageEl.innerHTML = hub ? renderHub(p) : renderArticle(p);
    if (hub) wireHub(); else wireArticle();
  }

  boot();
})();
