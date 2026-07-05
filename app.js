/* Trading-community template — app shell, router, screens, interactions.
   All brand-specific values come from window.BRAND (see brand.js). */
(function () {
  const D = window.DATA;
  const B = window.BRAND;
  const $ = (s, r) => (r || document).querySelector(s);
  const ic = (id, cls) => `<svg class="${cls || ""}"><use href="#${id}"/></svg>`;

  function av(initials, size, opt) {
    size = size || 36; const cls = ["av", "av-" + size]; let style = "";
    if (opt === "quiet") cls.push("av-quiet");
    else if (opt && opt.indexOf("pic:") === 0) { cls.push("av-pic"); style = `background-image:url('${opt.slice(4)}')`; }
    return `<div class="${cls.join(" ")}"${style ? ` style="${style}"` : ""}>${opt && opt.indexOf("pic:") === 0 ? "" : initials}</div>`;
  }

  let toastT;
  function toast(msg, iconId) {
    const t = $("#toast");
    t.innerHTML = (iconId ? ic(iconId) : "") + `<span>${msg}</span>`;
    haptic(14); t.classList.add("show"); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- premium feel: haptics + count-up ----------
  function reduceMotion() { try { return window.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { return false; } }
  let _interacted = false;
  try { window.addEventListener("pointerdown", () => { _interacted = true; }, { once: true, capture: true }); } catch (e) {}
  function haptic(p) { if (!_interacted) return; try { if (navigator.vibrate) navigator.vibrate(p || 8); } catch (e) {} } // Android web; no-op on iOS Safari; only after first user gesture
  function countUp(el) {
    if (!el || reduceMotion()) return;
    const raw = (el.textContent || "").trim();
    const m = raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const pre = m[1], orig = m[2], suf = m[3], clean = orig.replace(/,/g, ""), target = parseFloat(clean);
    if (!isFinite(target)) return;
    const dec = (clean.split(".")[1] || "").length, comma = orig.includes(","), dur = 600, t0 = performance.now();
    const fmt = v => pre + (comma ? (+v.toFixed(dec)).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)) + suf;
    function frame(t) {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(frame); else el.textContent = pre + orig + suf;
    }
    requestAnimationFrame(frame);
    // guarantee the final value even if rAF is throttled (backgrounded tab / webview)
    setTimeout(() => { el.textContent = pre + orig + suf; }, dur + 200);
  }

  // ---------- router ----------
  let cleanups = [];
  let activeTab = "home";
  function clean() { cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; }
  function setScreen(html) {
    clean();
    const s = $("#screen");
    s.innerHTML = html; s.classList.remove("screen-enter"); void s.offsetWidth; s.classList.add("screen-enter");
    const scroller = $("#screen-scroll");
    if (!reduceMotion()) {
      s.querySelectorAll(".reveal").forEach((el, i) => { el.style.animationDelay = Math.min(i * 55, 340) + "ms"; });
      // below-fold reveals wait for scroll entry instead of firing off-screen
      const vh = scroller ? scroller.clientHeight : 844;
      const wait = [...s.querySelectorAll(".reveal")].filter(el => el.offsetTop > vh);
      if (wait.length) {
        const io = new IntersectionObserver((ents) => {
          ents.forEach(en => { if (en.isIntersecting) { en.target.style.animationDelay = "0ms"; en.target.classList.remove("reveal-wait"); io.unobserve(en.target); } });
        }, { root: scroller, threshold: 0.12 });
        wait.forEach(el => { el.classList.add("reveal-wait"); io.observe(el); });
        cleanups.push(() => io.disconnect());
      }
    }
    scroller.scrollTop = 0;
    requestAnimationFrame(() => { Charts.initIn(s); s.querySelectorAll(".stat b.num, .num-cell b.num, .jstat b.num, .track-stats > div b").forEach(countUp); paintOpenPl(); });
  }

  const SCREENS = {};
  let _navSilent = false; // true while popstate drives navigation (don't re-push)
  function go(tab) {
    haptic(8);
    const m = $("#modal"); if (m && m.classList.contains("open")) closeModal(); // never trap the user in a sheet/player
    activeTab = tab; livePreview = false; // tab nav exits any live-room preview
    if (tab === "signals") setSetting("sigDay", ymd()); // daily-goal signal
    if (!_navSilent) { try { history.pushState({ t: tab }, ""); } catch (e) {} }
    SCREENS[tab]();
    [...document.querySelectorAll(".tab")].forEach(t => { t.classList.toggle("active", t.dataset.tab === tab); t.setAttribute("aria-current", t.dataset.tab === tab ? "page" : "false"); });
  }
  // hardware/browser back: first closes an open sheet, then walks tab history, never exits the prototype cold
  window.addEventListener("popstate", (e) => {
    const m = $("#modal");
    if (m && m.classList.contains("open")) { closeModal(); try { history.pushState({ t: activeTab }, ""); } catch (er) {} return; }
    const t = (e.state && e.state.t) || "home";
    if (SCREENS[t]) { _navSilent = true; go(t); _navSilent = false; }
  });

  // ---------- header ----------
  function topbar(right) {
    return `<div class="app-topbar"><img class="brand-word" src="${B.logo}" alt="${B.name}">${right || ""}</div>`;
  }
  function header(title, sub) {
    return topbar(`<div class="tb-actions"><button class="icon-btn" data-act="theme-top" aria-label="Toggle light or dark mode">${ic(currentTheme()==="light"?"i-moon":"i-sun")}</button><button class="icon-btn" data-act="notif" aria-label="Notifications${unreadCount() ? ", unread" : ""}">${ic("i-bell")}${badgeHtml()}</button></div>`) +
      `<div class="app-head">
      <button class="as-btn who" data-act="profile" style="cursor:pointer">
        ${av(D.user.initials, 44)}
        <div><small>${sub || greeting()}</small><b>${title || D.user.name}</b></div>
        <span class="who-go">Profile ${ic("i-chev","ic")}</span>
      </button>
    </div>`;
  }
  function greeting() { const h = new Date().getHours(); return (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + ","; }

  // ---------- live-call schedule (real weekly timetable, UK times) ----------
  const DAY_IDX = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const DAY_FULL = { Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" };
  const TZ_UK = "Europe/London";
  function ukDayShort(ms) { return new Intl.DateTimeFormat("en-GB", { timeZone: TZ_UK, weekday: "short" }).format(new Date(ms)).slice(0, 3); }
  function ukYmd(ms) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ_UK, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms)); }
  function ukWallToUtc(isoLocal) {
    const [date, time = "00:00:00"] = isoLocal.split("T");
    const [Y, M, D] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    let lo = Date.UTC(Y, M - 1, D - 1), hi = Date.UTC(Y, M - 1, D + 1, 23, 59);
    const parts = (t) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ_UK, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t));
    const g = (ps, ty) => +ps.find(x => x.type === ty).value;
    for (let i = 0; i < 20; i++) {
      const mid = Math.floor((lo + hi) / 2); const ps = parts(mid);
      const cmp = g(ps, "year") - Y || g(ps, "month") - M || g(ps, "day") - D || g(ps, "hour") - hh || g(ps, "minute") - mm;
      if (cmp < 0) lo = mid + 1; else if (cmp > 0) hi = mid - 1; else return mid;
    }
    return lo;
  }
  function ukInstantForDay(dayKey, timeStr, fromMs) {
    const [h, m] = timeStr.split(":").map(Number);
    const target = DAY_IDX[dayKey];
    for (let add = 0; add < 14; add++) {
      const probe = fromMs + add * 86400000;
      if (DAY_IDX[ukDayShort(probe)] !== target) continue;
      const instant = ukWallToUtc(`${ukYmd(probe)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      if (instant > fromMs) return instant;
    }
    return null;
  }
  function ukInstantOnDay(dayKey, timeStr, refMs) {
    const [h, m] = timeStr.split(":").map(Number);
    const target = DAY_IDX[dayKey];
    for (let add = 0; add < 8; add++) {
      const probe = refMs - add * 86400000;
      if (DAY_IDX[ukDayShort(probe)] !== target) continue;
      return ukWallToUtc(`${ukYmd(probe)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    }
    return null;
  }
  function nextCall() {
    const now = Date.now();
    let best = null, bestMs = Infinity;
    for (const c of (D.schedule || [])) {
      const ms = ukInstantForDay(c.day, c.time, now);
      if (ms == null) continue;
      const diff = ms - now;
      if (diff < bestMs) { bestMs = diff; best = c; }
    }
    return best ? { ...best, startsIn: Math.floor(bestMs / 1000) } : null;
  }
  // the call that's live right now (within its window) else the next one — all from the real schedule
  function liveCallInfo() {
    const now = new Date();
    const liveOne = (D.schedule || []).find(c => {
      if (DAY_IDX[c.day] !== now.getDay()) return false;
      const [h, m] = c.time.split(":").map(Number);
      const start = new Date(now); start.setHours(h, m, 0, 0);
      const mins = (now - start) / 60000;
      return mins >= -5 && mins <= 75;
    });
    const c = liveOne || nextCall();
    if (!c) return null;
    const initials = (c.host || "BT").replace(/&/g, " ").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return { session: c.session, host: c.host, initials, day: c.day, at: c.at };
  }
  function scheduleSection() {
    const nc = nextCall();
    const key = c => c.day + c.time + c.session;
    const nk = nc ? key(nc) : "";
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let rows = "";
    for (const d of order) {
      const calls = (D.schedule || []).filter(c => c.day === d);
      if (!calls.length) {
        rows += `<div class="sch-row off"><div class="sch-day">${DAY_FULL[d]}</div><div class="sch-time">—</div><div class="sch-sess"><b>Off</b></div></div>`;
      } else calls.forEach((c, i) => {
        const isNext = key(c) === nk;
        rows += `<div class="sch-row${isNext ? " next" : ""}">
          <div class="sch-day">${i === 0 ? DAY_FULL[d] : ""}</div>
          <div class="sch-time num">${c.at}</div>
          <div class="sch-sess"><b>${c.session}</b><small>with ${c.host}</small></div>
          ${isNext ? `<span class="sch-tag">NEXT</span>` : ""}
        </div>`;
      });
    }
    return `<div class="card sched reveal">
      <div class="sch-head"><span class="eyebrow">${ic("i-cal", "ic")} This week · live calls</span><span class="sch-count num">${(D.schedule || []).length} calls</span></div>
      ${rows}
    </div>`;
  }

  // ---------- live market bar (XAU/USD price + session clock) ----------
  function sessionInfo() {
    const now = new Date();
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    let label;
    if (h >= 12 && h < 16) label = "London·NY";
    else if (h >= 7 && h < 12) label = "London";
    else if (h >= 16 && h < 21) label = "New York";
    else if (h >= 21 && h < 23) label = "NY close";
    else label = "Asia";
    let next = null;
    for (const [o, n] of [[7, "London"], [12, "New York"], [23, "Asia"]]) { if (o > h + 1e-6) { next = [o, n]; break; } }
    if (!next) next = [31, "London"];
    const mins = Math.max(0, Math.round((next[0] - h) * 60));
    return { label, next: `${next[1]} ${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}m` };
  }
  function mbSeg() {
    return `<span class="mb-seg">
      <span class="mb-live"></span><span class="mb-sym">XAU/USD</span><span class="mb-price num">—</span><span class="mb-chg num"></span>
      <span class="mb-sep">•</span>
      <span class="mb-dot"></span><span class="mb-sess">—</span><span class="mb-next num"></span>
      <span class="mb-sep">•</span>
      <button class="mb-news" data-newspill hidden></button>
    </span>`;
  }
  function marketBar() {
    // scrolling ticker — duplicated segment so the loop is seamless
    return `<div class="marketbar" aria-label="Live market ticker"><div class="mb-track">${mbSeg()}${mbSeg()}</div></div>`;
  }
  // real spot gold (XAU/USD) — free, no-key, CORS-enabled feed; price cached across screens
  let mbPrice = null, mbBase = null;
  function goldDayBaseline(price) {
    // one reference price per UTC day → the % shown is a real intraday move, and it persists
    try {
      const day = new Date().toISOString().slice(0, 10);
      const saved = JSON.parse(localStorage.getItem("bt_gold_base") || "null");
      if (saved && saved.day === day && typeof saved.price === "number") return saved.price;
      localStorage.setItem("bt_gold_base", JSON.stringify({ day, price }));
      return price;
    } catch (e) { return price; }
  }
  // fire price alerts off the live gold feed (XAU only — the one symbol with a real price here).
  // arms on the first read so an already-passed level doesn't fire on load; re-arms when price leaves it.
  let alertsArmed = false;
  function checkAlerts(px) {
    if (px == null || !D.alerts) return;
    D.alerts.forEach(a => {
      if (!/^XAU/.test(a.sym)) return;                       // DXY etc. have no live price yet
      const lvl = parseFloat(String(a.price).replace(/,/g, ""));
      if (!isFinite(lvl)) return;
      const met = a.cond === "above" ? px >= lvl : px <= lvl;
      if (!alertsArmed) { a._armed = !met; return; }         // don't fire pre-existing states on load
      if (a.on && met && a._armed) { a._armed = false; a.on = false; toast(`${a.sym} ${a.cond === "above" ? "▲" : "▼"} ${a.price} — ${a.note}`, "i-bell"); } // one-shot, like a real price alert
      if (!met) a._armed = true;                             // re-arm once price moves back off the level
    });
    alertsArmed = true;
  }
  function mountMarketBar() {
    const allOf = sel => [...document.querySelectorAll(sel)];
    const paintSession = () => { const s = sessionInfo(); allOf(".mb-sess").forEach(e => e.textContent = s.label); allOf(".mb-next").forEach(e => e.textContent = " · " + s.next); };
    let _lastPx = null;
    const renderPrice = () => {
      if (mbPrice == null) return;
      const txt = mbPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const moved = mbPrice !== _lastPx;
      allOf(".mb-price").forEach(e => {
        if (e.textContent !== txt) e.textContent = txt;
        if (moved && !reduceMotion()) { e.classList.remove("mb-pop"); void e.offsetWidth; e.classList.add("mb-pop"); }
      });
      _lastPx = mbPrice;
      paintOpenPl(); paintPaper();
      if (mbBase) {
        const pct = (mbPrice - mbBase) / mbBase * 100;
        const t = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
        allOf(".mb-chg").forEach(c => { c.textContent = t; c.className = "mb-chg num " + (pct >= 0 ? "up" : "down"); });
      }
      checkAlerts(mbPrice);
      paintBrief();
    };
    let mock = null;
    const startMock = () => { // only if the live feed never answers — never show an empty bar
      if (mock || mbPrice != null) return;
      mbPrice = 2958.40; mbBase = 2946.00; renderPrice();
      mock = setInterval(() => { mbPrice += (Math.random() - 0.48) * 0.9; renderPrice(); }, 2200);
      cleanups.push(() => clearInterval(mock));
    };
    const pull = async () => {
      try {
        const r = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok || typeof j.price !== "number") throw 0;
        if (mock) { clearInterval(mock); mock = null; } // real data arrived → kill the fallback
        mbPrice = j.price; mbBase = goldDayBaseline(j.price); renderPrice();
      } catch (e) { startMock(); }
    };
    // high-impact news countdown pill — "CPI · 1h 42m", red + "size down" inside 30 min; tap opens the calendar
    const paintNews = () => {
      const now = Date.now();
      const e = (liveCal || []).filter(x => x.impact === "high" && new Date(x.date).getTime() > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      allOf("[data-newspill]").forEach(el => {
        if (!e) { el.hidden = true; return; }
        const ms = new Date(e.date).getTime() - now, h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), soon = ms < 30 * 6e4;
        el.hidden = false;
        el.textContent = `⚠ ${e.event} · ${h > 0 ? h + "h " + m + "m" : m + "m"}${soon ? " — size down" : ""}`;
        el.classList.toggle("soon", soon);
        el.onclick = openCalendar;
      });
    };
    paintSession(); paintNews(); if (mbPrice != null) renderPrice(); // instant paint when returning to a screen
    pull();
    const t1 = setInterval(() => { if (!document.hidden) pull(); }, 12000), t2 = setInterval(() => { paintSession(); paintNews(); }, 20000), t0 = setTimeout(startMock, 2500);
    cleanups.push(() => { clearInterval(t1); clearInterval(t2); clearTimeout(t0); });
  }
  // next high-impact event from the live calendar (drives the brief's "On watch")
  function nextCalEvent() {
    if (!liveCal || !liveCal.length) return null;
    const now = Date.now();
    const fut = liveCal.filter(e => e.impact === "high" && new Date(e.date).getTime() > now).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!fut.length) return null;
    const e = fut[0], f = fmtCalItem(e);
    return `${e.event} · ${e.cur} · ${f.day} ${f.time}`;
  }
  // derive the brief from live data (real spot $, intraday move, price-anchored levels, today's news); neutral fallback until the price lands
  function briefData() {
    const g = mbPrice, pct = (g != null && mbBase) ? (g - mbBase) / mbBase * 100 : null;
    if (g == null) return D.morningBrief;
    const price = g.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const step = 25, support = Math.floor(g / step) * step, resistance = Math.ceil((g + 0.01) / step) * step;
    const f0 = n => n.toLocaleString("en-US");
    const bias = pct == null ? "Balanced" : pct > 0.15 ? "Firm" : pct < -0.15 ? "Soft" : "Balanced";
    const day = new Date().toLocaleDateString("en-GB", { weekday: "long" });
    const headline = pct == null ? `Gold at $${price} into ${day}'s session`
      : bias === "Balanced" ? `Gold holding around $${price} into ${day}'s session`
      : `Gold ${pct >= 0 ? "firm" : "soft"} at $${price} — ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(2)}% into ${day}'s session`;
    const ev = nextCalEvent();
    return {
      bias,
      headline,
      points: [
        { ic: "i-dollar", label: "Spot gold", text: pct != null && Math.abs(pct) < 0.05 ? `$${price} · flat today` : `$${price} · ${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct || 0).toFixed(2)}% today` },
        { ic: "i-target", label: "Key levels", text: `Support $${f0(support)} · Resistance $${f0(resistance)}` },
        { ic: "i-cal", label: "On watch", text: ev || "No tier-1 data due — technicals lead today" },
      ],
    };
  }
  function briefBodyHtml() {
    const b = briefData();
    return `<div class="brief-bias">${b.bias}</div>
      <h3 class="brief-h">${b.headline}</h3>
      <div class="brief-points">
        ${b.points.map(p => `<div class="brief-pt">${ic(p.ic, "bp-ic")}<div class="bp-tx"><b>${p.label}</b><span>${p.text}</span></div></div>`).join("")}
      </div>`;
  }
  function paintBrief() { const el = document.getElementById("brief-body"); if (el) el.innerHTML = briefBodyHtml(); }
  function morningBriefCard() {
    const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    return `<div class="card brief reveal">
      <div class="brief-head"><span class="eyebrow">${ic("i-chart", "ic")} Morning brief</span><span class="brief-time num">${today}</span></div>
      <div id="brief-body">${briefBodyHtml()}</div>
    </div>`;
  }

  // ============================ PROFILE STATE (persisted, client-side) ============================
  // Makes the prototype cohesive: a logged trade feeds win-rate / R:R / streak / leaderboard / badges,
  // all saved on the device. (True cross-device sync + real auth is the production app.)
  const PSTORE = "bt_profile_v1";
  function pState() { try { return JSON.parse(localStorage.getItem(PSTORE) || "null") || {}; } catch (e) { return {}; } }
  function pSave(s) { try { localStorage.setItem(PSTORE, JSON.stringify(s)); } catch (e) {} }
  function pSet(patch) { const s = pState(); Object.assign(s, patch); pSave(s); return s; }
  function hydrateProfile() { // first run seeds storage with the demo journal; thereafter it's the source of truth
    const s = pState();
    if (Array.isArray(s.journal)) D.journal = s.journal;
    else pSet({ journal: D.journal, streak: D.user.streak, lbPoints: 3480 });
    if (s.name) { D.user.name = s.name; D.user.first = s.first || s.name.split(/\s+/)[0]; D.user.initials = s.initials || D.user.initials; }
    if (s.country) D.user.country = s.country;
    if (s.pathDone) D.paths.forEach(p => { if (s.pathDone[p.id] != null) p.done = Math.min(s.pathDone[p.id], p.lessons); });
    if (s.videoProgress) D.videos.forEach(v => { if (s.videoProgress[v.id] != null) v.progress = s.videoProgress[v.id]; });
    if (s.challenge) Object.assign(D.challenge, s.challenge);
    if (Array.isArray(s.alerts)) D.alerts = s.alerts;
    if (Array.isArray(s.posts)) D.posts = s.posts;
  }
  function callKey(c) { return c.day + "|" + c.time + "|" + c.session; }
  function getTook(id) { return (pState().took || {})[id] || null; }
  function setTook(id, val) {
    const took = { ...(pState().took || {}) };
    if (val) took[id] = val; else delete took[id];
    pSet({ took });
  }
  function isShared(id) { return (pState().sharedJournal || []).includes(id); }
  function markShared(id) {
    const a = new Set(pState().sharedJournal || []); a.add(id);
    pSet({ sharedJournal: [...a] });
  }
  function liveChallenge() { const s = pState(); return { ...D.challenge, ...(s.challenge || {}) }; }
  function saveChallenge(patch) {
    const c = { ...liveChallenge(), ...patch };
    pSet({ challenge: { name: c.name, desc: c.desc, done: c.done, total: c.total, reward: c.reward, joined: c.joined } });
    Object.assign(D.challenge, c);
  }
  function pathDone(id) {
    const p = D.paths.find(x => x.id === id); if (!p) return 0;
    const stored = (pState().pathDone || {})[id];
    return stored != null ? Math.min(stored, p.lessons) : p.done;
  }
  function setPathDone(id, n) {
    const p = D.paths.find(x => x.id === id); if (!p) return;
    const v = Math.min(Math.max(0, n), p.lessons);
    p.done = v;
    pSet({ pathDone: { ...(pState().pathDone || {}), [id]: v } });
  }
  function getVideoProgress(id) {
    const v = D.videos.find(x => x.id === id);
    const stored = (pState().videoProgress || {})[id];
    return stored != null ? stored : (v ? v.progress : 0);
  }
  function setVideoProgress(id, prog) {
    const v = D.videos.find(x => x.id === id); if (!v) return;
    v.progress = Math.min(1, Math.max(0, prog));
    pSet({ videoProgress: { ...(pState().videoProgress || {}), [id]: v.progress } });
  }
  function isReminded(c) { return (pState().reminders || []).includes(callKey(c)); }
  function setReminder(c) {
    const k = callKey(c), rs = new Set(pState().reminders || []);
    if (rs.has(k)) return false;
    rs.add(k); pSet({ reminders: [...rs] }); return true;
  }
  function remindBtnLabel(c) { return c && isReminded(c) ? "Reminder set ✓" : "Remind me"; }
  // scheduled live-call alerts — in the real app these fire from the backend (§9): a 10-minute warning
  // and a "started" push. Here they preview on reminder-set so the pitch shows exactly what lands.
  let _callAlertT = [];
  function previewCallAlerts(nc) {
    if (!nc) return;
    _callAlertT.forEach(clearTimeout); _callAlertT = [];
    const host = nc.host || "the team", sess = nc.session || "Live call";
    _callAlertT.push(setTimeout(() => showPush(`${sess} starts in 10 minutes`, `Your live call with ${host} is coming up — get ready to join.`), 1600));
    _callAlertT.push(setTimeout(() => showPush(`🔴 ${sess} has started`, `${host} is live now — tap to join the room.`), 4400));
  }
  function bumpChallengeDay() {
    const c = liveChallenge(); if (!c.joined) return;
    const s = pState(), today = new Date().toLocaleDateString("en-CA");
    if (s.lastChallengeDay === today) return;
    s.lastChallengeDay = today; pSave(s);
    saveChallenge({ done: Math.min(c.done + 1, c.total) });
  }
  function saveAlerts() { pSet({ alerts: D.alerts }); }
  function savePosts() { pSet({ posts: D.posts }); }
  function getSetting(key, def) { const v = (pState().settings || {})[key]; return v != null ? v : def; }
  function setSetting(key, val) { pSet({ settings: { ...(pState().settings || {}), [key]: val } }); }
  // ---- theme (dark default / light) ----
  function currentTheme() { return getSetting("theme", "dark") === "light" ? "light" : "dark"; }
  function applyTheme(t) { document.documentElement.dataset.theme = (t === "light" ? "light" : "dark"); }
  function toggleTheme() { const next = currentTheme() === "light" ? "dark" : "light"; setSetting("theme", next); applyTheme(next); return next; }
  // 300ms opacity dip so the theme swap doesn't hard-snap every surface at once
  function themeFade(after) {
    const app = document.querySelector(".app");
    if (reduceMotion() || !app) { const t = toggleTheme(); if (after) after(t); return; }
    app.style.transition = "opacity .14s ease"; app.style.opacity = "0.3";
    setTimeout(() => {
      const t = toggleTheme();
      app.style.transition = "opacity .26s var(--ease-out)"; app.style.opacity = "1";
      setTimeout(() => { app.style.transition = ""; app.style.opacity = ""; }, 320);
      if (after) after(t);
    }, 140);
  }
  function getNotifPrefs() {
    const def = [1, 1, 1, 0, 1, 1];
    const p = pState().notifPrefs;
    return def.map((d, i) => (p && p[i] != null ? !!p[i] : !!d));
  }
  function setNotifPref(i, on) {
    const prefs = getNotifPrefs(); prefs[i] = !!on;
    pSet({ notifPrefs: prefs });
  }
  function savedVideos() { return pState().savedVideos || []; }
  function isSaved(id) { return savedVideos().includes(id); }
  function toggleSaved(id) {
    const s = new Set(savedVideos());
    if (s.has(id)) s.delete(id); else s.add(id);
    pSet({ savedVideos: [...s] });
    return s.has(id);
  }
  function icsStamp(ms) { return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z"); }
  function downloadCallIcs(call) {
    const nc = call || nextCall(); if (!nc) { toast("No upcoming call to add", null); return; }
    const start = ukInstantForDay(nc.day, nc.time, Date.now());
    if (!start) { toast("Could not schedule this call", null); return; }
    const end = start + 75 * 60000;
    const uid = callKey(nc) + "@" + B.domain;
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//" + B.name + "//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + icsStamp(Date.now()),
      "DTSTART:" + icsStamp(start),
      "DTEND:" + icsStamp(end),
      "SUMMARY:" + nc.session.replace(/,/g, "\\,"),
      "DESCRIPTION:" + B.name + " live call with " + nc.host + ". Free for members.",
      "LOCATION:" + B.name + " App",
      "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Live call starts in 10 minutes", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "blakey-trades-" + nc.session.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    toast("Calendar event downloaded", "i-cal");
  }
  function callsJoined() { const s = pState(); return s.calls != null ? s.calls : D.user.sessions; }
  function bumpCalls() { const s = pState(), today = new Date().toLocaleDateString("en-CA"); if (s.lastCallDay === today) return false; s.calls = (s.calls != null ? s.calls : D.user.sessions) + 1; s.lastCallDay = today; pSave(s); return true; }
  // journalStats() is the canonical one defined below — extended with winRate + avgRR for these helpers
  function profStreak() { const s = pState(); return s.streak != null ? s.streak : D.user.streak; }
  function lbPoints() { const s = pState(); return s.lbPoints != null ? s.lbPoints : 3480; }
  function recordLog() { // a logged trade earns points + extends the streak once per day, and persists the journal
    const s = pState(), today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    if (s.lastLogDay !== today) {
      if (s.lastLogDay === yesterday) s.streak = (s.streak != null ? s.streak : D.user.streak) + 1;
      else if (s.lastLogDay) s.streak = 1;
      else if (s.streak == null) s.streak = D.user.streak;
    } else if (s.streak == null) s.streak = D.user.streak;
    s.lastLogDay = today;
    s.lbPoints = (s.lbPoints != null ? s.lbPoints : 3480) + 50;
    s.journal = D.journal;
    pSave(s);
    bumpChallengeDay();
  }
  function liveLeaderboard() { // inject your real points, re-sort, re-rank
    const rows = D.leaderboard.map(r => ({ ...r, _p: r.me ? lbPoints() : parseInt(String(r.pts).replace(/,/g, ""), 10) || 0 }));
    rows.sort((a, b) => b._p - a._p);
    rows.forEach((r, i) => { r.rank = i + 1; r.pts = r._p.toLocaleString("en-US"); r.top = i < 3; });
    return rows;
  }
  function myRank() { const me = liveLeaderboard().find(r => r.me); return me ? me.rank : 99; }
  function liveBadges() { // unlock from real stats where computable
    const st = journalStats(), streak = profStreak(), rank = myRank();
    const cond = { "18-day streak": streak >= 18, "60% win rate": st.winRate >= 60, "Journaled 40": st.count >= 40, "Top 10": rank <= 10, "100 trades": st.count >= 100 };
    return D.badges.map(b => ({ ...b, on: (b.name in cond) ? cond[b.name] : b.on }));
  }
  function liveHomeStats() {
    const st = journalStats();
    return [
      { ic: "flame", value: String(profStreak()), label: "Day streak" },
      { ic: "target", value: st.winRate + "%", label: "Win rate" },
      { ic: "chart", value: money(st.avgRR, false), label: "Avg win" },
    ];
  }
  // ── XP & levelling, earned from real actions (log a trade, pass a quiz, join a live call) ──
  const TIERS = [[12, "Master"], [10, "Elite"], [8, "Sharp"], [6, "Disciplined"], [4, "Consistent"], [2, "Developing"], [0, "Rookie"]];
  function tierName(lv) { for (const [t, n] of TIERS) if (lv >= t) return n; return "Rookie"; }
  function profLevel() { const s = pState(); return s.level != null ? s.level : D.user.level; }
  function profXp() { const s = pState(); return s.xp != null ? s.xp : D.user.xp; }
  function profXpNext() { const s = pState(); return s.xpNext != null ? s.xpNext : D.user.xpNext; }
  function addXp(n) {
    const s = pState();
    let xp = (s.xp != null ? s.xp : D.user.xp) + n;
    let level = s.level != null ? s.level : D.user.level;
    let xpNext = s.xpNext != null ? s.xpNext : D.user.xpNext;
    let leveled = false;
    while (xp >= xpNext) { xp -= xpNext; level++; xpNext = Math.round(xpNext * 1.2 / 50) * 50; leveled = true; }
    s.xp = xp; s.level = level; s.xpNext = xpNext; pSave(s);
    if (leveled) setTimeout(() => toast(`Level up! You're Level ${level} · ${tierName(level)}`, "i-trophy"), 650);
    return leveled;
  }
  // ── believable demo sign-in (persisted session) ──
  function isSignedIn() { const s = pState(); return !!(s.session && s.session.signedIn); }
  function setSignedIn(provider) { pSet({ session: { provider: provider || "phone", signedIn: true, at: Date.now() } }); }
  function signOut() { const s = pState(); delete s.session; pSave(s); location.href = location.pathname; } // drop ?screen= so it returns to login

  // ============================ "TODAY ON THE FLOOR" STORIES ============================
  const ymd = () => new Date().toLocaleDateString("en-CA");
  function storyStrip() {
    const seen = getSetting("storySeen", "") === ymd();
    return `<button class="story-strip reveal" data-act="story">
      <span class="story-ring ${seen ? "seen" : ""}"><span class="story-dot">${ic("i-flame")}</span></span>
      <span class="story-tx"><b>Today on ${B.floor}</b><small>${seen ? "Watched · tap to replay" : "Your daily recap · 5 cards"}</small></span>
      ${ic("i-chev", "ic")}
    </button>`;
  }
  function storyCards() {
    const bd = briefData ? briefData() : null;
    const nc = nextCall();
    const todays = D.ideas.filter(i => /Today|ago|Active|Auto/.test(i.time || ""));
    const w = D.traderOfWeek, ch = liveChallenge();
    const cards = [];
    const pts = (bd && bd.points) || [];
    cards.push({ eyebrow: "Morning brief", h: (bd && bd.headline) || "Mapping today's session", body: `${bd && bd.bias ? `<span class="pill pill-gold" style="margin-bottom:14px">${bd.bias}</span>` : ""}${pts.slice(0, 2).map(p => `<p><b style="color:var(--gold)">${p.label}</b> — ${p.text}</p>`).join("")}` });
    cards.push({ eyebrow: "Signals today", h: `${todays.length} calls on the floor`, body: `<div class="st-sigs">${todays.slice(0, 4).map(i => `<div class="st-sig"><span>${i.pair} ${i.dir === "long" ? "▲" : "▼"}</span><b class="num ${i.status === "tp" ? "up" : i.status === "sl" ? "down" : ""}">${i.status === "tp" ? "Hit TP " + i.result : i.status === "sl" ? "Stopped " + i.result : i.status === "be" ? "BE" : "Running"}</b></div>`).join("")}</div>` });
    if (nc) cards.push({ eyebrow: "Next live call", h: nc.session, body: `<p style="margin-bottom:6px">with ${nc.host}</p><div class="st-big num">${DAY_FULL[nc.day]} ${nc.at}</div>`, cta: { label: "Set a reminder", go: "live" } });
    cards.push({ eyebrow: "Trader of the week", h: w.name, body: `<div class="st-avatar">${av(w.initials, 64)}</div><div class="st-big num up">${w.ret}</div><p>${w.winRate} win rate · ${w.trades} trades</p>` });
    cards.push({ eyebrow: "Monthly challenge", h: "Journal every trade", body: `<div class="st-big num gold-text">${ch.done}<small style="font-size:22px">/${ch.total}</small></div><p>days logged — keep the streak alive</p>`, cta: { label: "Log a trade", go: "community" } });
    return cards;
  }
  function openStories() {
    const cards = storyCards();
    let idx = 0, timer = null, holdT = 0;
    const host = document.querySelector(".app");
    const old = document.getElementById("story"); if (old) old.remove();
    const el = document.createElement("div");
    el.id = "story"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Daily recap");
    el.innerHTML = `
      <div class="st-bars">${cards.map(() => `<span class="st-bar"><i></i></span>`).join("")}</div>
      <button class="st-close" aria-label="Close">✕</button>
      <div class="st-card" id="st-card"></div>
      <div class="st-nav"><button class="st-zone" data-stz="-1" aria-label="Previous"></button><button class="st-zone" data-stz="1" aria-label="Next"></button></div>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    const bars = [...el.querySelectorAll(".st-bar i")];
    const paint = () => {
      const c = cards[idx];
      $("#st-card").innerHTML = `
        <span class="eyebrow">${c.eyebrow}</span>
        <h2>${c.h}</h2>
        <div class="st-body">${c.body || ""}</div>
        ${c.cta ? `<button class="btn btn-gold" data-stgo="${c.cta.go}" style="margin-top:22px;padding:0 28px">${c.cta.label}</button>` : ""}`;
      bars.forEach((b, n) => { b.style.transition = "none"; b.style.transform = n < idx ? "scaleX(1)" : "scaleX(0)"; });
      const go2 = $("#st-card [data-stgo]"); if (go2) go2.onclick = () => { close(); go(go2.dataset.stgo); };
      run();
    };
    const DUR = 5000;
    function run() {
      cancelAnimationFrame(timer);
      if (reduceMotion()) { bars[idx].style.transform = "scaleX(1)"; return; } // manual advance only
      const t0 = performance.now();
      (function f(t) {
        if (!document.contains(el)) return;
        if (holdT) { timer = requestAnimationFrame(f); return; } // press-hold pauses
        const p = Math.min((t - t0) / DUR, 1);
        bars[idx].style.transition = "none"; bars[idx].style.transform = `scaleX(${p})`;
        if (p >= 1) { step(1); return; }
        timer = requestAnimationFrame(f);
      })(t0);
    }
    function step(d) { idx += d; if (idx < 0) idx = 0; if (idx >= cards.length) { close(); return; } paint(); }
    function close() {
      cancelAnimationFrame(timer);
      setSetting("storySeen", ymd());
      el.classList.remove("show"); setTimeout(() => el.remove(), 380);
      const strip = document.querySelector(".story-strip .story-ring"); if (strip) strip.classList.add("seen");
      document.removeEventListener("keydown", onKey);
    }
    const onKey = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
    document.addEventListener("keydown", onKey);
    el.querySelector(".st-close").onclick = close;
    let heldLong = false;
    [...el.querySelectorAll("[data-stz]")].forEach(z => {
      z.onclick = () => { if (heldLong) { heldLong = false; return; } step(+z.dataset.stz); };
      z.onpointerdown = () => { holdT = Date.now(); };
      z.onpointerup = () => { heldLong = Date.now() - holdT > 350; holdT = 0; };
    });
    paint();
  }

  // ============================ HOME ============================
  SCREENS.home = function () {
    const v = D.live;
    const nc = nextCall() || { ...(D.schedule[0] || { session: "Live trading", host: "the team", day: "Mon", at: "" }), startsIn: 0 };
    const ideas = D.ideas[0];
    const watching = D.videos.filter(x => getVideoProgress(x.id) > 0);
    setScreen(`
      ${header()}
      ${marketBar()}
      ${storyStrip()}
      ${deskCard()}
      ${morningBriefCard()}
      <div class="live-banner reveal">
        <canvas class="market-bg" data-chart="ambient" data-seed="7"></canvas>
        <div class="lb-inner">
          <div class="lb-row">
            <span class="eyebrow">Next live call · ${DAY_FULL[nc.day]} ${nc.at}</span>
            <span class="pill pill-live"><span class="dot-live"></span> Live call</span>
          </div>
          <h3>${nc.session}</h3>
          <div class="sub" style="font-size:12.5px">Hosted by ${nc.host}</div>
          <div class="countdown" id="cd"></div>
          <div style="display:flex;gap:10px;margin-top:15px">
            <button class="btn btn-gold" style="flex:1" data-act="joinlive">${ic("i-live")} Join live</button>
            <button class="btn btn-ghost btn-sm" data-act="remind" style="height:52px;padding:0 16px">${remindBtnLabel(nc)}</button>
          </div>
        </div>
      </div>

      <div class="stat-row reveal" style="animation-delay:.05s">
        ${liveHomeStats().map(s => `<div class="stat">${ic("i-" + s.ic, "ic")}<b class="num">${s.value}</b><small>${s.label}</small></div>`).join("")}
      </div>

      ${toolsRow()}

      <div class="section-head"><span class="h2">Community</span><span class="more" data-tab="community" data-seg="community">Open ›</span></div>
      ${floorCard()}

      <div class="section-head"><span class="h2">Today's idea</span><span class="more" data-act="ideas">All signals ›</span></div>
      ${(getSetting("tier", "free") === "free" && ideas.status === "running") ? lockedSignalCard(ideas) : ideaCard(ideas)}

      <div class="section-head"><span class="h2">Trader of the week</span><span class="more" data-tab="community">View ›</span></div>
      ${totwMini()}

      <div class="section-head"><span class="h2">Continue watching</span><span class="more" data-tab="learn">Library ›</span></div>
      <div class="rail rail-pad">
        ${watching.map(vCard).join("")}
      </div>

      <div class="section-head"><span class="h2">Training Hub</span><span class="more" data-tab="hubs">Hubs ›</span></div>
      ${D.hubs.slice(0, 1).map(hubMini).join("")}
      <div class="spacer"></div>
    `);
    // countdown to the next scheduled call — build cells once, roll only the digits that change
    let left = nc.startsIn;
    const cd = $("#cd");
    const cdLabels = nc.startsIn >= 86400 ? ["Days", "Hrs", "Min"] : ["Hrs", "Min", "Sec"];
    cd.innerHTML = cdLabels.map(l => `<div class="cd-cell"><b class="num">00</b><span>${l}</span></div>`).join("");
    const cdB = [...cd.querySelectorAll(".cd-cell b")];
    const paint = () => {
      const d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
      const vals = d > 0 ? [d, h, m] : [h, m, s];
      vals.forEach((n, i) => {
        const str = String(n).padStart(2, "0");
        const b = cdB[i];
        if (b && b.textContent !== str) {
          b.textContent = str;
          if (!reduceMotion()) { b.classList.remove("cd-tick"); void b.offsetWidth; b.classList.add("cd-tick"); }
        }
      });
    };
    paint();
    const t = setInterval(() => { left = left > 0 ? left - 1 : 0; paint(); }, 1000);
    cleanups.push(() => clearInterval(t));
    wireCommon();
    $("[data-act=joinlive]").onclick = () => { if (isLiveNow()) { if (bumpCalls()) { addXp(50); toast("Joined the call · +50 XP", "i-live"); } } go("live"); };
    $("[data-act=remind]").onclick = (e) => { const call = nextCall(); if (!call) return; const isNew = setReminder(call); e.currentTarget.textContent = "Reminder set ✓"; toast("Reminder set — we'll alert you 10 minutes before", "i-bell"); if (isNew) previewCallAlerts(call); };
    const fc = $("[data-home-chat]"); if (fc) fc.onclick = openChat;
    const hlk = $("[data-lockvip]"); if (hlk) hlk.onclick = IB ? openVerifyBroker : openMembership;
    mountMarketBar();
  };

  // user marks whether they took a signal (👍/👎) — persisted in bt_profile_v1
  function tookBase(id) { let n = 0; for (const c of id) n += c.charCodeAt(0); return 24 + (n % 60); }
  function tookRow(i) {
    const s = getTook(i.id);
    const cnt = tookBase(i.id) + (s === "up" ? 1 : 0);
    return `<div class="took">
      <span class="took-q">Did you take it?</span>
      <div class="took-btns">
        <button class="took-btn up ${s === "up" ? "on" : ""}" data-took="up" data-id="${i.id}">${ic("i-thumbup")}<span class="num">${cnt}</span></button>
        <button class="took-btn down ${s === "down" ? "on" : ""}" data-took="down" data-id="${i.id}">${ic("i-thumbdown")}</button>
      </div>
    </div>`;
  }
  function wireTook() {
    [...document.querySelectorAll("[data-took]")].forEach(b => b.onclick = (e) => {
      e.stopPropagation(); // don't open the idea sheet
      const id = b.dataset.id, choice = b.dataset.took;
      const next = getTook(id) === choice ? null : choice;
      setTook(id, next);
      const row = b.closest(".took");
      if (row) {
        const up = row.querySelector(".took-btn.up"), down = row.querySelector(".took-btn.down");
        up.classList.toggle("on", next === "up");
        down.classList.toggle("on", next === "down");
        const n = up.querySelector(".num"); if (n) n.textContent = tookBase(id) + (next === "up" ? 1 : 0);
      }
      if (next === "up") openLogTrade(signalPrefill(D.ideas.find(x => x.id === id)));
      else toast(next === "down" ? "Marked as not taken" : "Cleared", null);
    });
  }
  function signalPrefill(i) {
    if (!i) return {};
    const sess = /york/i.test(i.session) ? "New York" : /asia/i.test(i.session) ? "Asia" : "London";
    const oc = i.status === "tp" ? "win" : i.status === "sl" ? "loss" : i.status === "be" ? "be" : "win";
    const ch = (D.channels.find(c => c.id === i.channel) || {}).name || "Signal";
    return { pair: i.pair, dir: i.dir, session: sess, outcome: oc, setup: `${ch} signal`, note: i.note || "" };
  }

  // ---- live open-P&L on running signals (driven by the real spot-gold feed) ----
  function openPlPts(i) {
    if (mbPrice == null || !i || !i.entry) return null;
    const e = parseFloat(String(i.entry).replace(/,/g, ""));
    if (!isFinite(e)) return null;
    return (mbPrice - e) * (i.dir === "long" ? 1 : -1);
  }
  function paintOpenPl() {
    [...document.querySelectorAll("[data-openpl]")].forEach(el => {
      const i = D.ideas.find(x => x.id === el.dataset.openpl);
      const p = openPlPts(i);
      if (p == null) { el.textContent = ""; return; }
      el.textContent = "Open " + (p >= 0 ? "+" : "") + p.toFixed(1) + " pts";
      el.className = "pl-chip " + (p >= 0 ? "up" : "down");
    });
  }
  function ideaCard(i) {
    const st = i.status === "tp" ? `<span class="pill pill-up">${ic("i-check","ic")} Hit TP ${i.result}</span>`
      : i.status === "sl" ? `<span class="pill pill-down">Stopped ${i.result}</span>`
      : i.status === "be" ? `<span class="pill">Breakeven</span>`
      : `<span class="pill pill-gold"><span class="dot-live"></span> Running</span>`;
    return `<div class="card idea reveal" data-idea="${i.id}">
      <div class="idea-top">
        <div class="idea-pair">${ic("i-chart","ic")}<span class="sym">${i.pair}</span>
          <span class="idea-dir ${i.dir}">${i.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        <span class="idea-top-r">${st}${i.status === "running" ? `<span class="pl-chip" data-openpl="${i.id}"></span>` : ""}</span>
      </div>
      <div class="sig-chart"><canvas data-chart="signal" data-seed="${(i.id.charCodeAt(0) + (i.id.charCodeAt(1) || 0)) * 3}" data-e="${i.entry.replace(/,/g, "")}" data-sl="${i.sl.replace(/,/g, "")}" data-tp="${i.tp.replace(/,/g, "")}" data-dir="${i.dir}"></canvas>
        <span class="sig-src ${i.channel === "iq" ? "bot" : ""}">${i.channel === "iq" ? "🤖 Signal IQ" : `${B.founder} <span class="vchk">✓</span>`}</span>
        <span class="sig-live">${ic("i-chart", "ic")} Live chart ›</span></div>
      <div class="ticket">
        <div class="cell"><small>Entry</small><b class="num">${i.entryRange || i.entry}</b></div>
        <div class="cell sl"><small>Stop</small><b class="num">${i.sl}</b></div>
        <div class="cell tp"><small>Target</small><b class="num">${i.tp}</b></div>
      </div>
      <div class="idea-foot">
        <span class="rr num">R:R <b>${i.rr}</b> · ${i.session}</span>
        <span class="more">Details ›</span>
      </div>
      ${tookRow(i)}
    </div>`;
  }

  function totwMini() {
    const w = D.traderOfWeek;
    return `<div class="card totw reveal" data-tab="community" data-seg="community">
      <div class="trophy">${ic("i-trophy")}</div>
      ${av(w.initials, 44)}
      <div class="meta"><small class="eyebrow muted">This week</small><b>${w.name}</b>
        <div class="num up" style="font-size:13px;margin-top:2px">${w.ret} · ${w.winRate} win rate</div></div>
      <div style="margin-left:auto">${ic("i-chev","ic")}</div>
    </div>`;
  }

  // ---- "Your desk" — the member's personalised daily briefing ----
  function copierState() {
    const tier = getSetting("tier", "free");
    if (tier === "free") return { code: "verify", label: "Verify to unlock ›", cls: "gold-tx" };
    const today = (D.copierTrades || []).filter(t => /Today/.test(t.time)).length;
    return { code: "on", label: today ? `${today} trade${today > 1 ? "s" : ""} today ›` : "Live ✓", cls: "up" };
  }
  function unreadAnnouncements() { return Math.max(0, D.announcements.length - getSetting("annSeen", 0)); }
  function deskCard() {
    const js = journalStats(), cp = copierState(), nc = nextCall();
    const sigsToday = D.channels.reduce((s, c) => s + (c.today || 0), 0);
    const healthy = js.pf >= 1 && js.netR >= 0;
    const when = nc ? (nc.startsIn < 86400 ? (parseInt(nc.time) >= 17 ? "Tonight" : "Today") + " " + nc.at : `${DAY_FULL[nc.day]} ${nc.at}`) : "";
    const unread = unreadAnnouncements(), dmUn = dmUnread() + (thisWeeksReview() ? 0 : 1); // DMs + the pending weekly review pull people in
    const row = (icon, label, val, act, extra) => `<button class="as-btn desk-row" ${act}>${ic(icon, "ic")}<span class="dr-label">${label}</span><span class="dr-val ${extra || ""}">${val}</span>${ic("i-chev", "dr-chev")}</button>`;
    return `<div class="card card-pad desk reveal" style="animation-delay:.03s">
      <div class="sch-head" style="margin-bottom:4px"><span class="eyebrow">${ic("i-home", "ic")} Your office</span><span class="streak-chip">${ic("i-flame", "ic")} ${profStreak()}-day streak</span></div>
      ${row("i-chart", "Auto-copier + analysis", cp.label, 'data-act="copier"', cp.cls)}
      ${row("i-shield", "Account health", healthy ? "Good ✓" : "Review risk", 'data-act="journal"', healthy ? "up" : "down")}
      ${row("i-chart", "New signals today", `<span class="num">${sigsToday}</span>`, 'data-tab="signals"')}
      ${nc ? row("i-live", nc.session, when, 'data-tab="live"') : ""}
      ${row("i-target", "Your journal", `<span class="num ${js.netR >= 0 ? "up" : "down"}">${money(js.netR)}</span>`, 'data-act="journal"')}
      ${row("i-bell", "Announcements", unread ? `<span class="num">${unread}</span> unread` : "All read ✓", 'data-act="announce"', unread ? "gold-tx" : "")}
      <button class="btn btn-gold btn-block" data-act="office" style="margin-top:13px">${ic("i-home")} Enter your office${dmUn ? `<span class="dm-badge num">${dmUn}</span>` : ""}</button>
    </div>`;
  }

  // ---- the office: DM inbox state + daily goals + streak extension ----
  function dmSeenMap() { return pState().dmSeen || {}; }
  function dmUnread() { const seen = dmSeenMap(); return (D.dms || []).reduce((s, t) => s + Math.max(0, t.msgs.length - (seen[t.id] || 0)), 0); }
  function markDmSeen(id) { const t = D.dms.find(x => x.id === id); if (t) pSet({ dmSeen: { ...dmSeenMap(), [id]: t.msgs.length } }); }
  function dailyGoals() {
    const g = [
      { label: "Read the daily recap", done: getSetting("storySeen", "") === ymd(), act: 'data-act="story"' },
      { label: "Check today's signals", done: getSetting("sigDay", "") === ymd(), act: 'data-tab="signals"' },
      { label: "Log a trade in your journal", done: getSetting("logDay", "") === ymd(), act: 'data-act="journal"' },
    ];
    // every Monday: plan the week around the economic calendar
    if (new Date().getDay() === 1) g.unshift({ label: "Check the week's news", done: getSetting("newsWeek", "") === weekKey(), act: 'data-act="calendar"' });
    return g;
  }
  function maybeExtendStreak() {
    if (getSetting("streakDay", "") === ymd()) return false;
    if (!dailyGoals().every(g => g.done)) return false;
    const s = pState();
    pSet({ streak: (s.streak != null ? s.streak : D.user.streak) + 1 });
    setSetting("streakDay", ymd());
    return true;
  }

  SCREENS.office = function () {
    const stagesWon = maybeGrantStageXp(); // grant stage bounties first so the XP bar paints post-award
    const u = D.user, js = journalStats(), goals = dailyGoals(), gDone = goals.filter(g => g.done).length;
    const seen = dmSeenMap();
    setScreen(`
      ${topbar(`<button class="icon-btn back-btn" data-back>${ic("i-chev")}</button>`)}
      <div class="office-head reveal">
        <div class="av-ring" style="background:conic-gradient(var(--gold) ${Math.round(profXp() / profXpNext() * 360)}deg, var(--surface-3) 0)">${av(u.initials, 64)}</div>
        <div class="of-id">
          <div class="of-hi">Welcome back,</div>
          <div class="of-name">${(u.first || u.name.split(" ")[0])}'s office</div>
          <span class="pill pill-gold" style="margin-top:7px">Level ${profLevel()} · ${tierName(profLevel())}</span>
        </div>
        <span class="streak-chip">${ic("i-flame", "ic")} ${profStreak()}d</span>
      </div>

      <div class="card level reveal">
        <div class="kv"><span>Progress to Level ${profLevel() + 1}</span><b class="num">${profXp().toLocaleString()} / ${profXpNext().toLocaleString()} XP</b></div>
        <div class="level-bar"><i style="width:${Math.round(profXp() / profXpNext() * 100)}%"></i></div>
        <div class="kv" style="margin-top:2px"><span>${(profXpNext() - profXp()).toLocaleString()} XP to go — log a trade for +40, join a call for +50</span></div>
      </div>

      <div class="badges" style="margin-top:14px">${liveBadges().map(b => `<div class="badge-it ${b.on ? "on" : "off"}"><div class="ring2">${ic(b.ic, "bdg-ic")}</div><small>${b.name}</small></div>`).join("")}</div>

      <div class="card card-pad reveal" style="margin-top:14px">
        <div class="sch-head"><span class="eyebrow">${ic("i-check", "ic")} Today's goals</span><span class="sch-count num">${gDone}/${goals.length}</span></div>
        ${goals.map(g => `<button class="as-btn jny-row ${g.done ? "is-done" : ""}" ${g.done ? 'aria-disabled="true"' : g.act}><span class="jny-node">${g.done ? ic("i-check", "ic") : ""}</span><span class="jny-label">${g.label}</span>${g.done ? "" : `<span class="jny-next">Do it</span>`}</button>`).join("")}
        <p class="of-goalnote">${gDone === goals.length ? `Perfect day — your ${profStreak()}-day streak is safe.` : `Complete all ${goals.length} to extend your ${profStreak()}-day streak.`}</p>
      </div>

      ${weeklyReviewCard()}

      ${journeyCard()}

      <div class="section-head"><span class="h2">Messages</span><span class="more" data-act="members">Members ›</span></div>
      <div class="card card-pad">
        ${D.dms.map(t => {
          const un = Math.max(0, t.msgs.length - (seen[t.id] || 0)), lastM = t.msgs[t.msgs.length - 1];
          return `<button class="as-btn dm-row" data-dm="${t.id}">${av(t.initials, 44, un ? "" : "quiet")}<div class="dm-body"><div class="dm-top"><b>${t.name}${t.role === "Coach" ? ' <span class="vchk">✓</span>' : ""}</b><span class="dm-time num">${t.last}</span></div><small class="dm-prev">${lastM.me ? "You: " : ""}${lastM.text}</small></div>${un ? `<span class="dm-un num">${un}</span>` : ic("i-chev", "dr-chev")}</button>`;
        }).join("")}
      </div>

      <div class="stat-row" style="margin-top:14px">
        <div class="stat">${ic("i-trophy", "ic")}<b class="num">#${myRank()}</b><small>Leaderboard</small></div>
        <div class="stat">${ic("i-target", "ic")}<b class="num">${js.winRate}%</b><small>Win rate</small></div>
        <div class="stat">${ic("i-chart", "ic")}<b class="num ${js.netR >= 0 ? "up" : "down"}">${money(js.netR)}</b><small>Net result</small></div>
      </div>

      <div class="section-head"><span class="h2">Quick actions</span></div>
      <div class="card card-pad">
        ${hubRow("i-share", "Share your trader card", "Flex the streak — post your stats", "tradercard")}
        ${hubRow("i-flame", "Monthly challenge", "Journal every trade · 30 days", "challenge")}
        ${hubRow("i-chart", "Auto-copier + analysis", "Every trade the system takes, explained", "copier", true)}
      </div>
      <div class="spacer"></div>
    `);
    const bk = $("[data-back]"); if (bk) bk.onclick = () => go("home");
    [...document.querySelectorAll("[data-dm]")].forEach(n => n.onclick = () => openDm(n.dataset.dm));
    const tc = $('[data-act="tradercard"]'); if (tc) tc.onclick = openTraderCard;
    wireCommon();
    if (maybeExtendStreak()) setTimeout(() => {
      toast(`Streak extended — ${profStreak()} days`, "i-flame");
      const sc = document.querySelector(".office-head .streak-chip");
      if (sc) sc.innerHTML = `${ic("i-flame", "ic")} ${profStreak()}d`;
    }, 700);
    if (stagesWon) setTimeout(() => toast(`Stage ${stagesWon > 1 ? "rewards" : "reward"} banked · +${stagesWon * 250} XP`, "i-trophy"), 1300);
  };

  // ---- weekly review — the Friday debrief: honest 1-10 self-scores → a personal Trader Score ----
  function weekKey() { const d = new Date(), y = d.getFullYear(), start = new Date(y, 0, 1); return y + "-W" + Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7); }
  function weeklyHistory() { return pState().weekly || []; }
  function thisWeeksReview() { return weeklyHistory().find(w => w.week === weekKey()) || null; }
  function scoreBand(s) { return s >= 80 ? "Elite week" : s >= 65 ? "Disciplined" : s >= 50 ? "Building" : "Reset week"; }
  const WR_QS = [
    { id: "plan", label: "Followed my trading plan" },
    { id: "risk", label: "Sized my risk right — never over-risked" },
    { id: "run", label: "Let winners run — no early exits" },
    { id: "greed", label: "Took profit at the plan, not out of greed" },
    { id: "emo", label: "No revenge trades, no FOMO entries" },
    { id: "journal", label: "Journaled every trade I took" },
  ];
  function weeklyReviewCard() {
    const done = thisWeeksReview();
    const hist = weeklyHistory();
    const prev = done ? hist.filter(w => w.week !== weekKey()).slice(-1)[0] : hist.slice(-1)[0];
    const isFri = [5, 6, 0].includes(new Date().getDay());
    if (done) {
      const d = prev ? done.score - prev.score : null;
      return `<div class="card card-pad wr reveal">
        <div class="sch-head"><span class="eyebrow">${ic("i-target", "ic")} Weekly review</span><span class="sch-count">done ✓</span></div>
        <div class="wr-done">
          <div class="ws-ring" style="background:conic-gradient(var(--gold) ${Math.round(done.score / 100 * 360)}deg, var(--surface-4) 0)"><b class="num">${done.score}</b></div>
          <div><b class="wr-band">${scoreBand(done.score)}</b><small>Trader score · this week${d != null ? ` · <span class="num ${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}</span> vs last` : ""}</small><small>Next review opens Friday.</small></div>
        </div>
      </div>`;
    }
    return `<button class="as-btn card card-pad wr reveal" data-act="weeklyreview">
      <div class="sch-head"><span class="eyebrow">${ic("i-target", "ic")} Weekly review</span><span class="sch-count">+75 XP</span></div>
      <p class="wr-hook">${isFri ? "It's Friday — time for the truth." : "Get ahead of Friday — debrief your week."} Six honest questions, one Trader Score.</p>
      ${prev ? `<p class="wr-last">Last week: <b class="num">${prev.score}</b> · ${scoreBand(prev.score)}</p>` : ""}
      <span class="btn btn-gold btn-block" style="margin-top:11px">${ic("i-edit")} Start the review</span>
    </button>`;
  }
  function openWeeklyReview() {
    if (thisWeeksReview()) { toast("This week's review is done — Friday's next", "i-check"); return; }
    openModal(`
      <h3 class="sheet-title">Weekly review</h3>
      <p class="sheet-sub">Be brutally honest — this score is for you, not the leaderboard. 1 = not at all, 10 = nailed it.</p>
      ${WR_QS.map(q => `
        <div class="ws-row">
          <div class="ws-top"><label for="ws-${q.id}">${q.label}</label><b class="num" id="wsv-${q.id}">5</b></div>
          <input type="range" class="fd-slider" id="ws-${q.id}" min="1" max="10" step="1" value="5" aria-label="${q.label}">
        </div>`).join("")}
      <label class="flabel" for="ws-well">What did you do well?</label>
      <textarea class="finput ftext" id="ws-well" placeholder="e.g. Waited for the reclaim instead of chasing…"></textarea>
      <label class="flabel" for="ws-fix">What will you do differently next week?</label>
      <textarea class="finput ftext" id="ws-fix" placeholder="e.g. Half size on news days…"></textarea>
      <button class="btn btn-gold btn-block" id="ws-submit" style="margin-top:14px">${ic("i-check")} Get my Trader Score</button>
      <div class="spacer"></div>`);
    WR_QS.forEach(q => {
      const sl = $("#ws-" + q.id), out = $("#wsv-" + q.id);
      const paint = () => { out.textContent = sl.value; sl.style.background = `linear-gradient(90deg, var(--gold) ${(sl.value - 1) / 9 * 100}%, var(--surface-4) 0)`; };
      paint(); sl.oninput = paint;
    });
    $("#ws-submit").onclick = () => {
      const dims = WR_QS.map(q => ({ id: q.id, label: q.label, v: +$("#ws-" + q.id).value }));
      const score = Math.round(dims.reduce((s, d) => s + d.v, 0) / dims.length * 10);
      const entry = { week: weekKey(), score, dims: dims.map(d => ({ id: d.id, v: d.v })), well: ($("#ws-well").value || "").slice(0, 300), fix: ($("#ws-fix").value || "").slice(0, 300) };
      pSet({ weekly: [...weeklyHistory().filter(w => w.week !== weekKey()), entry] });
      addXp(75);
      const prev = weeklyHistory().filter(w => w.week !== weekKey()).slice(-1)[0];
      openModal(`
        <h3 class="sheet-title">Your Trader Score</h3>
        <div class="wr-result">
          <div class="ws-ring ws-ring-lg" style="background:conic-gradient(var(--gold) ${Math.round(score / 100 * 360)}deg, var(--surface-4) 0)"><b class="num">${score}</b></div>
          <b class="wr-band">${scoreBand(score)}</b>
          <small>${prev ? `${score >= prev.score ? "Up from" : "Down from"} ${prev.score} last week · ` : ""}+75 XP banked</small>
        </div>
        ${dims.map(d => `<div class="ws-dim"><span>${d.label}</span><div class="ws-dimbar"><i style="width:${d.v * 10}%"></i></div><b class="num">${d.v}</b></div>`).join("")}
        ${entry.fix ? `<div class="wr-note">${ic("i-edit", "ic")}<div><b>Next week's fix</b><small>${entry.fix.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</small></div></div>` : ""}
        <button class="btn btn-gold btn-block" id="wr-close" style="margin-top:14px">See you next Friday</button>`);
      toast(`Trader score ${score} · +75 XP`, "i-check");
      $("#wr-close").onclick = () => { closeModal(); setTimeout(() => { if (SCREENS[activeTab]) SCREENS[activeTab](); }, 360); };
    };
  }

  // ---- DM thread — scripted replies with a typing indicator ----
  function openDm(id) {
    const t = D.dms.find(x => x.id === id); if (!t) return;
    markDmSeen(id);
    const listUn = document.querySelector(`[data-dm="${id}"] .dm-un`); if (listUn) listUn.remove();
    const esc = (s) => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const bubble = (m) => `<div class="dm-msg${m.me ? " me" : ""}">${m.me ? esc(m.text) : m.text}<span class="dm-t num">${m.time}</span></div>`;
    openModal(`
      <div class="dm-head">${av(t.initials, 44)}<div><b>${t.name}${t.role === "Coach" ? ' <span class="vchk">✓</span>' : ""}</b><small>${t.role || "Member"}</small></div></div>
      <div class="dm-thread" id="dm-thread">${t.msgs.map(bubble).join("")}</div>
      <div class="dm-compose">
        <input class="finput" id="dm-in" placeholder="Message ${t.name.split(" ")[0]}…" autocomplete="off" aria-label="Message ${t.name}">
        <button class="btn btn-gold dm-send" id="dm-send" aria-label="Send">${ic("i-send")}</button>
      </div>`);
    const th = $("#dm-thread"), inp = $("#dm-in"), snd = $("#dm-send");
    th.scrollTop = th.scrollHeight;
    let ri = 0, timers = [];
    const send = () => {
      const v = (inp.value || "").trim(); if (!v) return;
      inp.value = "";
      const mine = { me: true, text: v, time: "now" };
      t.msgs.push(mine);
      th.insertAdjacentHTML("beforeend", bubble(mine));
      th.scrollTop = th.scrollHeight;
      markDmSeen(id);
      timers.push(setTimeout(() => {
        th.insertAdjacentHTML("beforeend", `<div class="dm-msg dm-typing" id="dm-typing"><i></i><i></i><i></i></div>`);
        th.scrollTop = th.scrollHeight;
        timers.push(setTimeout(() => {
          const ty = $("#dm-typing"); if (ty) ty.remove();
          const rep = { text: t.replies[ri % t.replies.length], time: "now" }; ri++;
          t.msgs.push(rep);
          th.insertAdjacentHTML("beforeend", bubble(rep));
          th.scrollTop = th.scrollHeight;
          markDmSeen(id);
        }, 1500 + Math.random() * 900));
      }, 500));
    };
    snd.onclick = send;
    inp.onkeydown = (e) => { if (e.key === "Enter") send(); };
  }

  // ---- "Your journey" — the staged road to a consistently profitable trader.
  // Every milestone is derived from the member's REAL state (journal, calls, tier, copier, streak, rank).
  function journeyStages() {
    const js = journalStats(), tier = getSetting("tier", "free"), wk = weeklyHistory();
    const anyLesson = D.videos.some(v => getVideoProgress(v.id) > 0);
    return [
      { name: "Get on " + B.floor, pace: "day one", steps: [
        { label: "Joined " + B.floor, done: true },
        { label: `Verified with ${B.broker}`, done: tier !== "free", xp: 100, act: 'data-act="verifyib"' },
        { label: "Read a trade analysis", done: !!getSetting("copierSeen", false), xp: 150, act: 'data-act="copier"' },
      ] },
      { name: "Learn the playbook", pace: "week one", steps: [
        { label: "Watched your first live call", done: callsJoined() > 0, xp: 50, act: 'data-tab="live"' },
        { label: "Started the education library", done: anyLesson, xp: 50, act: 'data-tab="learn"' },
        { label: "Took your first trade", done: js.count > 0, xp: 50, act: 'data-act="journal"' },
      ] },
      { name: "Build the discipline", pace: "weeks 2–4", steps: [
        { label: "Logged 5 trades in the journal", done: js.count >= 5, xp: 75, act: 'data-act="journal"' },
        { label: "First weekly review banked", done: wk.length >= 1, xp: 75, act: 'data-act="weeklyreview"' },
        { label: "First profitable week", done: js.netR > 0, xp: 100, act: 'data-act="journal"' },
        { label: "Held a 7-day streak", done: profStreak() >= 7, xp: 75 },
      ] },
      { name: "Prove the edge", pace: "months 1–2", steps: [
        { label: "60% win rate over 10+ trades", done: js.winRate >= 60 && js.count >= 10, xp: 150, act: 'data-act="journal"' },
        { label: `${money(1000, false)} banked on your book`, done: js.netR >= 1000, xp: 200, act: 'data-act="journal"' },
        { label: "Two Trader Scores of 65+", done: wk.filter(w => w.score >= 65).length >= 2, xp: 150, act: 'data-act="weeklyreview"' },
        { label: "Held a 14-day streak", done: profStreak() >= 14, xp: 100 },
      ] },
      { name: "Trade it like a pro", pace: "the long game", steps: [
        { label: `${money(5000, false)} banked on your book`, done: js.netR >= 5000, xp: 250, act: 'data-act="journal"' },
        { label: "Held a 30-day streak", done: profStreak() >= 30, xp: 250 },
        { label: "Four weekly reviews banked", done: wk.length >= 4, xp: 200, act: 'data-act="weeklyreview"' },
        { label: `Cracked the top 5 on ${B.floor}`, done: myRank() <= 5, xp: 300, act: 'data-act="members"' },
      ] },
    ];
  }
  // one-time +250 XP bounty when a stage fully completes (checked on office render)
  function maybeGrantStageXp() {
    const granted = pState().jnyXp || [];
    const newly = journeyStages().map((st, i) => st.steps.every(s => s.done) && !granted.includes(i) ? i : -1).filter(i => i >= 0);
    if (!newly.length) return 0;
    pSet({ jnyXp: [...granted, ...newly] });
    newly.forEach(() => addXp(250));
    return newly.length;
  }
  function journeyCard() {
    const stages = journeyStages();
    const flat = stages.flatMap(st => st.steps);
    const done = flat.filter(s => s.done).length, total = flat.length;
    let seenNext = false;
    const curStage = stages.findIndex(st => st.steps.some(s => !s.done));
    const summit = done === total;
    return `<div class="card card-pad jny reveal">
      <div class="sch-head"><span class="eyebrow">${ic("i-pin", "ic")} Your journey</span><span class="sch-count num">${done}/${total}</span></div>
      <div class="jny-bar"><i style="width:${Math.max(4, Math.round(done / total * 100))}%"></i></div>
      <p class="jny-dest">Stage ${(curStage === -1 ? stages.length : curStage + 1)} of ${stages.length} · <b>${stages[curStage === -1 ? stages.length - 1 : curStage].name}</b> — destination: consistently profitable, tracked from your real journal.</p>
      ${stages.map((st, si) => {
        const stDone = st.steps.every(s => s.done);
        return `<div class="jny-stage ${stDone ? "is-done" : ""}"><span class="jny-st-n num">${si + 1}</span><span class="jny-st-name">${st.name}<i class="jny-pace">${st.pace}</i></span>${stDone ? ic("i-check", "ic") : `<span class="jny-st-count num">${st.steps.filter(s => s.done).length}/${st.steps.length}</span>`}</div>`
        + st.steps.map(s => {
          const isNext = !s.done && !seenNext; if (isNext) seenNext = true;
          return `<button class="as-btn jny-row ${s.done ? "is-done" : isNext ? "is-next" : ""}" ${(!s.done && s.act) || ""} ${s.done ? 'aria-disabled="true"' : ""}>
            <span class="jny-node">${s.done ? ic("i-check", "ic") : ""}</span>
            <span class="jny-label">${s.label}</span>
            ${s.done ? "" : isNext ? `<span class="jny-next">Next up${s.xp ? ` · +${s.xp} XP` : ""}</span>` : s.xp ? `<span class="jny-xp num">+${s.xp} XP</span>` : ""}
          </button>`;
        }).join("");
      }).join("")}
      <div class="jny-summit ${summit ? "is-done" : ""}">
        <span class="jny-node">${ic("i-trophy", "ic")}</span>
        <div><b>Consistently profitable</b><small>${summit ? "You made it — this is what the numbers say." : "Where the road leads. Every step above moves you closer."}</small></div>
      </div>
    </div>`;
  }

  // ---- auto-copier feed — the system's trades, each with the reasoning + an AI review ----
  function copierTradeCard(t) {
    const pill = t.status === "tp" ? `<span class="pill pill-up">${t.result}</span>`
      : t.status === "sl" ? `<span class="pill pill-down">${t.result}</span>`
      : `<span class="pill pill-gold"><span class="dot-live"></span> Live</span>`;
    return `<div class="card ct-card">
      <div class="ct-top">
        <div class="idea-pair">${ic("i-chart", "ic")}<span class="sym">${t.pair}</span><span class="idea-dir ${t.dir}">${t.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        ${pill}
      </div>
      <div class="ct-levels">${t.time} · entry <b>${t.entry}</b> · SL <b>${t.sl}</b> · TP <b>${t.tp}</b></div>
      <div class="ct-why"><span class="ct-lbl">Why it took it</span><p>${t.why}</p></div>
      <div class="ai-review">
        <div class="ai-head">${ic("i-chart", "ic")}Technical analysis</div>
        <p>${t.review}</p>
      </div>
    </div>`;
  }
  function openCopier() {
    const tier = getSetting("tier", "free");
    if (tier === "free") {
      openModal(`
        <h3 class="sheet-title">Auto-copier + analysis</h3>
        <p class="sheet-sub">The auto-copier takes every ${B.short} VIP setup automatically — and the app shows you the trade, <b>why</b> it took it, and a full <b>technical analysis</b> of each one. Learn the logic behind every call.</p>
        <div class="vb-how">
          <div class="vb-step"><span class="vb-n num">1</span><span>Every trade the system takes appears here in real time.</span></div>
          <div class="vb-step"><span class="vb-n num">2</span><span>See the exact reasoning — the setup, the entry model, the risk.</span></div>
          <div class="vb-step"><span class="vb-n num">3</span><span>A full technical analysis breaks down what was good, what to watch, and the repeatable lesson.</span></div>
        </div>
        <button class="btn btn-gold btn-block" data-act="verifyib" style="margin-top:14px">${ic("i-shield")} Verify with ${B.broker} to unlock</button>
        <p class="sub" style="font-size:11px;text-align:center;margin-top:12px;color:var(--faint)">Educational only — the trades are the system's, shown to help you learn. Not financial advice.</p>`);
      wireCommon();
      return;
    }
    setSetting("copierSeen", true);
    const trades = D.copierTrades || [];
    const running = trades.filter(t => t.status === "running").length;
    openModal(`
      <h3 class="sheet-title">Auto-copier + analysis</h3>
      <p class="sheet-sub">Every trade the system takes — with the reasoning and a full technical analysis, so you learn from each one.</p>
      <div class="ct-summary">
        <div class="ct-sum"><b class="num">${trades.length}</b><small>Trades shown</small></div>
        <div class="ct-sum"><b class="num up">${running}</b><small>Live now</small></div>
        <div class="ct-sum"><b class="num gold-text">100%</b><small>Analysed</small></div>
      </div>
      <div class="ct-feed">${trades.map(copierTradeCard).join("")}</div>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:6px;color:var(--faint)">Educational only — the trades are the system's. Not financial advice.</p>
      <div class="spacer"></div>`);
    wireCommon();
  }

  // home "on the floor" card — one-tap into the community chat
  function floorCard() {
    const seed = D.chatScript[0];
    const stack = ["MW", "SR", "AK"];
    return `<div class="card floor-card reveal" data-home-chat style="animation-delay:.05s">
      <div class="floor-head">
        <span class="pill pill-live"><span class="dot-live"></span> On ${B.floor} now</span>
        <span class="floor-online num">4,213 online</span>
      </div>
      <div class="floor-msg">
        ${av(seed.initials, 36)}
        <div class="floor-bubble"><b>${seed.name} <span class="vchk">✓</span></b>${seed.text}</div>
      </div>
      <div class="floor-foot">
        <div class="floor-stack">${stack.map((i, n) => `<span class="fs-av" style="margin-left:${n ? "-8px" : "0"};z-index:${9 - n}">${av(i, 28, "quiet")}</span>`).join("")}<span class="fs-more">chatting now</span></div>
        <span class="floor-cta">${ic("i-comm", "ic")} Open chat</span>
      </div>
    </div>`;
  }

  function hubMini(h) {
    if (h.real) return `<div class="card" data-tab="hubs" style="display:flex;align-items:center;gap:13px;padding:13px;overflow:hidden">
      <div style="flex:none;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--gold-soft);border:1px solid var(--gold-line);color:var(--gold)">${ic("i-pin","ic")}</div>
      <div style="flex:1;min-width:0">
        <b style="font-family:var(--display);font-size:14px;display:block">${h.city} Training Hub</b>
        <small style="font-size:11.5px;color:var(--muted)">${h.flag} ${h.access} · ${h.hours}</small>
      </div>${ic("i-chev","ic")}</div>`;
    return `<div class="card" data-tab="hubs" style="display:flex;align-items:center;gap:13px;padding:13px;overflow:hidden">
      <div style="text-align:center;font-family:var(--mono);flex:none">
        <b style="font-size:19px;color:var(--gold);display:block;line-height:1">${h.event.d}</b>
        <small style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">${h.event.m}</small>
      </div>
      <div style="flex:1;min-width:0">
        <b style="font-family:var(--display);font-size:14px;display:block">${h.event.title}</b>
        <small style="font-size:11.5px;color:var(--muted)">${h.flag} ${h.city} · ${h.going} going</small>
      </div>${ic("i-chev","ic")}</div>`;
  }

  function vCard(v) {
    return `<button class="as-btn vcard" data-video="${v.id}">
      <div class="thumb"><img class="thumb-img" src="${v.img}" alt="" loading="lazy" decoding="async"><div class="thumb-grad"></div>
        <div class="play-mini"><span>${ic("i-play")}</span></div>
        <span class="dur num">${v.dur}</span>
        ${getVideoProgress(v.id) ? `<div class="prog"><i style="width:${Math.round(getVideoProgress(v.id)*100)}%"></i></div>` : ""}
      </div>
      <h4>${v.title}</h4>
      <div class="vmeta"><span>${v.cat}</span>·<span>${v.views} views</span></div>
    </button>`;
  }

  // ============================ LIVE ============================
  let livePreview = false; // demo: lets you peek into the live room when no call is on
  function isLiveNow() { // true only inside a scheduled call window (UK timetable)
    const now = Date.now();
    return (D.schedule || []).some(c => {
      const start = ukInstantOnDay(c.day, c.time, now);
      if (start == null) return false;
      const mins = (now - start) / 60000;
      return mins >= -5 && mins <= 75;
    });
  }
  function liveStageHtml(v, preview) {
    const ci = liveCallInfo() || { host: v.host, initials: v.hostInitials, session: v.session };
    return `<div id="live-stage"${preview ? ' class="is-preview"' : ''}>
        <canvas id="live-canvas" data-chart="live"></canvas>
        <div class="live-grad"></div>
        <div class="live-hud">
          ${preview
            ? `<span class="pill pill-preview"><span class="dot-prev"></span> PREVIEW</span>`
            : `<span class="pill pill-live"><span class="dot-live"></span> LIVE</span>
          <span class="live-watchers">${ic("i-comm","ic")} <span id="watchers">${v.watchers.toLocaleString()}</span> watching</span>`}
        </div>
        ${preview ? `<button class="live-exit" id="live-exit">Exit preview ✕</button>` : ""}
        <div class="live-levels">
          <span class="lvl tp">TP ${v.tp}</span>
          <span class="lvl e">Entry ${v.entry}</span>
          <span class="lvl sl">SL ${v.sl}</span>
        </div>
        <div class="live-host">${av(ci.initials, 36)}<div><b>${ci.host} <span class="vchk">✓</span></b><small>Hosting · ${ci.session}</small></div></div>
        <div class="mark-chip" id="mark-chip" role="status" aria-live="polite"></div>
      </div>
      <div class="live-chatbox">
        <div class="live-chat2" id="chat"></div>
        <div class="live-compose2">
          <div class="live-input">Say something to the floor…</div>
          <button class="react-btn" data-react="🔥">🔥</button>
          <button class="react-btn" data-react="💎">💎</button>
        </div>
      </div>`;
  }
  function liveLobbyHtml(nc) {
    return `<div id="live-lobby">
        <canvas class="market-bg" data-chart="ambient" data-seed="9"></canvas>
        <div class="lobby-inner">
          <span class="pill pill-gold">${ic("i-live","ic")} Next live call</span>
          <h2 class="lobby-title">${nc ? nc.session : "Live trading room"}</h2>
          <div class="lobby-host">${nc ? `with ${nc.host} · ${DAY_FULL[nc.day]} ${nc.at}` : "Schedule coming up"}</div>
          <div class="countdown lobby-cd" id="lobby-cd"></div>
          <div class="lobby-actions">
            <button class="btn btn-gold" data-act="remind-call">${ic("i-bell")} ${remindBtnLabel(nc)}</button>
            <button class="btn btn-ghost" data-act="add-cal">${ic("i-cal")} Add to calendar</button>
            <button class="btn btn-ghost" id="live-preview">${ic("i-play")} Preview the room</button>
          </div>
        </div>
      </div>`;
  }
  SCREENS.live = function () {
    const v = D.live, realLive = isLiveNow(), preview = livePreview && !realLive, live = realLive || preview, nc = nextCall(), cInfo = liveCallInfo() || { session: v.session, host: v.host, initials: v.hostInitials };
    setScreen(`
      ${live ? liveStageHtml(v, preview) : liveLobbyHtml(nc)}
      <div style="padding-top:16px">
        ${live ? `<span class="eyebrow">${cInfo.session} · ${preview ? "preview" : "live now"}</span>
        <h2 class="h2" style="margin:8px 0 4px">${cInfo.session}</h2>
        <p class="sub">${preview ? `A look inside the live room. When ${cInfo.session} goes live, members join free — ${cInfo.host} walks the charts, the entry model and live risk on ${v.pair} in real time.` : `${cInfo.host} is leading ${cInfo.session} live — liquidity, the entry model, and live risk management on ${v.pair}.`}</p>
        <div class="section-head"><span class="h3">Covering today</span></div>
        ${["Where the liquidity is resting","The A+ entry model (reclaim & hold)","Live risk: where the stop really goes","Q&A from the floor"].map(x=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)">${ic("i-check","ic")}<span style="font-size:13.5px">${x}</span></div>`).join("")}` : `<p class="sub" style="margin-top:2px">The room opens automatically when the call starts — free for members. Set a reminder so you don't miss the open.</p>`}
        ${scheduleSection()}
        <div class="section-head"><span class="h3">Recent replays</span><span class="more" data-tab="learn">All ›</span></div>
        <div class="rail rail-pad">${D.videos.filter(x=>x.cat==="Session Replays"||x.host===B.founder).slice(0,4).map(vCard).join("")}</div>
        <p class="sub" style="font-size:11px;text-align:center;margin-top:18px;color:var(--faint)">Educational content only. Not financial advice.</p>
        <div class="spacer"></div>
      </div>
    `);
    if (!live) {
      const cd = $("#lobby-cd"); let left = nc ? nc.startsIn : 0;
      const paint = () => { if (!cd) return; const d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600), m = Math.floor(left % 3600 / 60), s = left % 60; cd.innerHTML = (d > 0 ? `<span class="cd-cell"><b>${d}</b><small>days</small></span>` : "") + `<span class="cd-cell"><b>${String(h).padStart(2,"0")}</b><small>hrs</small></span><span class="cd-cell"><b>${String(m).padStart(2,"0")}</b><small>min</small></span><span class="cd-cell"><b>${String(s).padStart(2,"0")}</b><small>sec</small></span>`; };
      paint();
      let warned = false; // fire the real 10-minute warning once if the countdown reaches it while reminded
      const lt = setInterval(() => {
        left = left > 0 ? left - 1 : 0; paint();
        if (!warned && left <= 600 && left > 0 && nc && isReminded(nc)) { warned = true; showPush(`${nc.session} starts in 10 minutes`, `Your live call with ${nc.host} is coming up — get ready to join.`); }
        if (left <= 0) { if (nc && isReminded(nc)) showPush(`🔴 ${nc.session} has started`, `${nc.host} is live now — tap to join the room.`); go("live"); }
      }, 1000);
      cleanups.push(() => clearInterval(lt));
      const pv = $("#live-preview"); if (pv) pv.onclick = () => { livePreview = true; SCREENS.live(); };
      const rm = $("[data-act=remind-call]"); if (rm) rm.onclick = () => { if (nc && setReminder(nc)) { toast("We'll alert you 10 minutes before the call", "i-bell"); previewCallAlerts(nc); } else toast("Reminder already set", "i-check"); rm.innerHTML = ic("i-bell") + " Reminder set ✓"; };
      const ac = $("[data-act=add-cal]"); if (ac) ac.onclick = () => downloadCallIcs(nc);
      wireCommon();
      return;
    }
    // watchers ticker
    let w = v.watchers;
    const wt = setInterval(() => { if (document.hidden) return; const el = $("#watchers"); if (el) { w += Math.floor(Math.random() * 9) - 3; el.textContent = w.toLocaleString(); } }, 2600);
    // chat playback
    const chat = $("#chat"); let ci = 0;
    function push() {
      const m = D.chatScript[ci % D.chatScript.length]; ci++;
      const node = document.createElement("div");
      node.className = "chat-msg" + (m.host ? " host" : "");
      node.innerHTML = m.host
        ? `<div class="ct"><b>${m.name} · Host</b>${m.text}</div>`
        : `${av(m.initials, 28, "quiet")}<div class="ct"><b>${m.name}</b>${m.text}</div>`;
      chat.appendChild(node);
      while (chat.children.length > 14) chat.removeChild(chat.firstChild);
      chat.scrollTop = chat.scrollHeight;
    }
    push(); push(); push();
    const ct = setInterval(() => { if (!document.hidden) push(); }, 2400);
    // auto reactions
    const rt = setInterval(() => { if (document.hidden || reduceMotion()) return; if (Math.random() > .4) flyReaction(Math.random() > .5 ? "🔥" : "💎"); }, 1500);
    cleanups.push(() => { clearInterval(wt); clearInterval(ct); clearInterval(rt); });
    // founder chart markup → "marking the chart" chip
    const lcv = $("#live-canvas");
    if (lcv) {
      let mkT = null;
      const onMark = (e) => {
        const chip = $("#mark-chip"); if (!chip) return;
        chip.innerHTML = `${ic("i-edit", "ic")} ${cInfo.host.split(" ")[0]} marked the chart — <b>${e.detail.chip || e.detail.label}</b>`;
        chip.classList.add("show"); haptic(8);
        clearTimeout(mkT); mkT = setTimeout(() => chip.classList.remove("show"), 3600);
      };
      lcv.addEventListener("chart-mark", onMark);
      cleanups.push(() => { clearTimeout(mkT); lcv.removeEventListener("chart-mark", onMark); });
    }
    [...document.querySelectorAll("[data-react]")].forEach(b => b.onclick = () => { flyReaction(b.dataset.react, b); });
    const ex = $("#live-exit"); if (ex) ex.onclick = () => { livePreview = false; SCREENS.live(); };
    wireCommon();
  };

  function flyReaction(emoji, btn) {
    const stage = $("#live-stage"); if (!stage) return;
    const s = document.createElement("div"); s.className = "react-fly"; s.textContent = emoji;
    const r = stage.getBoundingClientRect();
    let x = r.width - 60 + (Math.random() * 30 - 15), y = r.height - 90;
    if (btn) { const br = btn.getBoundingClientRect(); x = br.left - r.left + 6; y = br.top - r.top; }
    s.style.left = x + "px"; s.style.top = y + "px"; s.style.setProperty("--rot", (Math.random() * 30 - 15) + "deg");
    stage.appendChild(s); setTimeout(() => s.remove(), 2500);
  }

  // ============================ LEARN ============================
  let learnCat = "For you";
  SCREENS.learn = function () {
    const f = D.featured;
    setScreen(`
      ${topbar(`<button class="icon-btn" data-act="search" aria-label="Search the library">${ic("i-search")}</button>`)}
      <div class="app-head"><div class="who"><div><small>${D.videos.length*7+120}+ lessons</small><b>Education</b></div></div></div>
      <button class="as-btn learn-hero reveal" data-video="v1">
        <img class="hero-thumb" src="${f.img}" alt="" loading="lazy" decoding="async">
        <div class="g"></div>
        <div class="play">${ic("i-play")}</div>
        <div class="body"><span class="eyebrow">Featured · ${f.cat}</span>
          <h3 class="h2" style="margin:7px 0 5px">${f.title}</h3>
          <div class="vmeta sub" style="font-size:12px">${f.dur} · ${f.views} views · ${f.date}</div></div>
      </button>
      ${academySection()}
      <div class="section-head"><span class="h2">Library</span></div>
      <div class="chips" id="chips">
        ${D.categories.map(c => `<button class="chip${c===learnCat?" active":""}" data-cat="${c}" aria-pressed="${c===learnCat}">${c}</button>`).join("")}
      </div>
      <div id="learn-list"></div>
      <div class="spacer"></div>
    `);
    renderLearnList();
    [...document.querySelectorAll("#chips .chip")].forEach(c => c.onclick = () => { learnCat = c.dataset.cat; [...document.querySelectorAll("#chips .chip")].forEach(x => x.classList.toggle("active", x === c)); renderLearnList(); });
    wireCommon();
  };
  function openLearnSearch() {
    openModal(`<h3 class="sheet-title">Search library</h3><p class="sheet-sub">${D.videos.length} lessons · type to filter</p>
      <input class="finput" id="learn-q" placeholder="Search by title, category, or host…" aria-label="Search the library" autocomplete="off">
      <div id="learn-search-results" style="margin-top:14px"></div>`);
    const run = () => {
      const box = $("#learn-search-results"), q = ($("#learn-q").value || "").trim().toLowerCase();
      if (!box) return;
      const hits = !q ? D.videos.slice(0, 6) : D.videos.filter(v => (v.title + " " + v.cat + " " + v.host).toLowerCase().includes(q));
      box.innerHTML = hits.length
        ? hits.map(vRow).join("")
        : `<p class="sub" style="text-align:center;padding:24px 0">No lessons match “${($("#learn-q").value || "").replace(/</g, "")}”</p>`;
      requestAnimationFrame(() => Charts.initIn(box));
      [...box.querySelectorAll("[data-video]")].forEach(n => n.onclick = () => { closeModal(); openPlayer(n.dataset.video); });
    };
    const inp = $("#learn-q"); if (inp) { inp.oninput = run; inp.focus(); }
    run();
  }
  function renderLearnList() {
    const list = $("#learn-list"); if (!list) return;
    const items = learnCat === "For you" ? D.videos : D.videos.filter(v => v.cat === learnCat);
    const watching = items.filter(v => getVideoProgress(v.id) > 0);
    list.innerHTML =
      (watching.length ? `<div class="section-head"><span class="h3">Continue watching</span></div><div class="rail rail-pad">${watching.map(vCard).join("")}</div>` : "") +
      `<div class="section-head"><span class="h3">${learnCat === "For you" ? "All lessons" : learnCat}</span><span class="more">${items.length} videos</span></div>` +
      items.map(vRow).join("");
    requestAnimationFrame(() => Charts.initIn(list));
    [...list.querySelectorAll("[data-video]")].forEach(n => n.onclick = () => openPlayer(n.dataset.video));
  }
  function vRow(v) {
    return `<button class="as-btn vrow" data-video="${v.id}">
      <div class="thumb"><img class="thumb-img" src="${v.img}" alt="" loading="lazy" decoding="async"><div class="thumb-grad"></div>
        ${getVideoProgress(v.id)?`<div class="prog" style="position:absolute;left:0;bottom:0;height:3px;width:100%;background:rgba(255,255,255,.15);z-index:2"><i style="display:block;height:100%;width:${Math.round(getVideoProgress(v.id)*100)}%;background:var(--gold)"></i></div>`:""}</div>
      <div class="info"><h4>${v.title}</h4>
        <div class="vmeta">${v.cat} · ${v.dur} · ${v.views} views</div></div>
      ${ic("i-play","ic")}</button>`;
  }

  // ============================ CIRCLE (journal + community) ============================
  let circleTab = "journal";
  SCREENS.community = function () {
    setScreen(`
      ${topbar(`<button class="icon-btn" data-act="notif" aria-label="Notifications${unreadCount() ? ", unread" : ""}">${ic("i-bell")}${badgeHtml()}</button>`)}
      <div class="app-head"><div class="who"><div><small>Your trading circle</small><b id="circle-title">${circleTab === "journal" ? "My Journal" : "Community"}</b></div></div></div>
      <div class="seg" id="circle-seg">
        <button class="seg-btn ${circleTab === "journal" ? "on" : ""}" data-seg="journal" aria-pressed="${circleTab === "journal"}">My Journal</button>
        <button class="seg-btn ${circleTab === "community" ? "on" : ""}" data-seg="community" aria-pressed="${circleTab === "community"}">Community</button>
      </div>
      <div id="circle-body"></div>
    `);
    [...document.querySelectorAll("#circle-seg .seg-btn")].forEach(b => b.onclick = () => {
      circleTab = b.dataset.seg;
      [...document.querySelectorAll("#circle-seg .seg-btn")].forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
      $("#circle-title").textContent = circleTab === "journal" ? "My Journal" : "Community";
      renderCircle();
    });
    renderCircle();
    wireCommon();
  };
  function renderCircle() {
    const body = $("#circle-body"); if (!body) return;
    if (circleTab === "journal") renderJournalView(body); else renderCommunityView(body);
  }

  // ---- journal ----
  let journalFilter = "All";
  // money formatter — result values are profit/loss in the community's currency
  function money(v, signed = true) { const n = Math.round(v || 0), c = B.ccy || "£"; const sign = n > 0 ? (signed ? "+" : "") : n < 0 ? "-" : ""; return sign + c + Math.abs(n).toLocaleString(); }
  function resStr(j) { return j.outcome === "be" ? "BE" : money(j.r); }
  function badTag(t) { return /FOMO|Chased|Off-plan|Counter|Review/i.test(t); }
  function journalStats() {
    const J = D.journal;
    const wins = J.filter(j => j.outcome === "win").length, losses = J.filter(j => j.outcome === "loss").length;
    const decided = wins + losses, wr = decided ? Math.round(wins / decided * 100) : 0;
    const netR = J.reduce((a, j) => a + j.r, 0);
    const gW = J.filter(j => j.r > 0).reduce((a, j) => a + j.r, 0), gL = Math.abs(J.filter(j => j.r < 0).reduce((a, j) => a + j.r, 0));
    const winR = J.filter(j => j.outcome === "win").map(j => Math.abs(j.r)).filter(x => x > 0);
    const avgRR = winR.length ? winR.reduce((a, b) => a + b, 0) / winR.length : 0;
    return { wins, losses, wr, winRate: wr, netR, pf: gL ? gW / gL : gW, count: J.length, avgRR };
  }
  function journalCard(j) {
    const pill = j.outcome === "win" ? `<span class="pill pill-up">${resStr(j)}</span>` : j.outcome === "loss" ? `<span class="pill pill-down">${resStr(j)}</span>` : `<span class="pill">BE</span>`;
    const from = j.channel && !["—", "Off-plan"].includes(j.channel) ? ` · ${j.channel}` : "";
    return `<button class="as-btn card jcard" data-jentry="${j.id}">
      <div class="jc-top">
        <div class="jc-pair">${ic("i-chart","ic")}<b>${j.pair}</b><span class="idea-dir ${j.dir}">${j.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        ${pill}
      </div>
      <div class="jc-meta">${j.setup} · ${j.session} · ${j.date}${from}</div>
      <div class="jc-note">${j.note}</div>
      <div class="jc-tags">${(j.tags || []).map(t => `<span class="jtag ${badTag(t) ? "bad" : "good"}">${t}</span>`).join("")}</div>
    </button>`;
  }
  // "Your edge" — pattern analytics derived from the user's real logged trades (pure code, no LLM)
  function edgeCard() {
    const J = D.journal;
    if (J.length < 4) return "";
    // win-rate by session
    const sess = ["London", "New York", "Asia"].map(sn => {
      const es = J.filter(j => (j.session || "").indexOf(sn === "New York" ? "York" : sn) >= 0);
      const dec = es.filter(j => j.outcome !== "be");
      const wins = dec.filter(j => j.outcome === "win").length;
      return { sn, n: es.length, w: wins, l: dec.length - wins, wr: dec.length ? Math.round(wins / dec.length * 100) : 0 };
    }).filter(x => x.n);
    // best / worst setup by avg profit (2+ trades)
    const bySetup = {};
    J.forEach(j => { const k = j.setup || "—"; (bySetup[k] = bySetup[k] || []).push(j.r); });
    const setups = Object.entries(bySetup).filter(([, rs]) => rs.length >= 2)
      .map(([k, rs]) => ({ k, n: rs.length, avg: rs.reduce((a, b) => a + b, 0) / rs.length }))
      .sort((a, b) => b.avg - a.avg);
    // profit distribution (7 buckets around breakeven)
    const edges = [-150, -50, 50, 250, 450, 650];
    const buckets = new Array(7).fill(0);
    J.forEach(j => { let b = edges.findIndex(e => j.r < e); if (b < 0) b = 6; buckets[b]++; });
    const maxB = Math.max(...buckets, 1);
    const c = B.ccy || "£";
    const labels = ["≤-" + c + "150", "-" + c + "100", "BE", "+" + c + "200", "+" + c + "400", "+" + c + "600", c + "600+"];
    // one derived sentence — best sess vs worst, or setup edge
    let insight = "";
    const ranked = [...sess].filter(x => x.w + x.l >= 2).sort((a, b) => b.wr - a.wr);
    if (ranked.length >= 2 && ranked[0].wr - ranked[ranked.length - 1].wr >= 25)
      insight = `Your ${ranked[0].sn} win rate (${ranked[0].wr}%) is well clear of ${ranked[ranked.length - 1].sn} (${ranked[ranked.length - 1].wr}%) — your edge lives in the ${ranked[0].sn} ${ranked[0].sn === "Asia" ? "session" : "open"}.`;
    else if (setups.length >= 2 && setups[0].avg - setups[setups.length - 1].avg >= 100)
      insight = `“${setups[0].k}” averages ${money(setups[0].avg)} across ${setups[0].n} trades — lean into it and cut “${setups[setups.length - 1].k}”.`;
    return `<div class="card card-pad edge-card reveal">
      <div class="eq-head"><span class="eyebrow">${ic("i-target","ic")} Your edge</span><span class="sub" style="font-size:11px">from ${J.length} logged trades</span></div>
      <div class="edge-sess">${sess.map(x => `<div class="edge-row"><span class="edge-n">${x.sn}</span><div class="edge-bar"><i style="transform:scaleX(${x.wr / 100})"></i></div><b class="num">${x.wr}%</b><small>${x.w}W ${x.l}L</small></div>`).join("")}</div>
      ${setups.length ? `<div class="edge-setups">
        <div class="edge-set"><span>${ic("i-check","ic")} Best setup</span><b>${setups[0].k}</b><small class="num up">${money(setups[0].avg)} avg · ${setups[0].n}</small></div>
        ${setups.length > 1 ? `<div class="edge-set"><span>${ic("i-thumbdown","ic")} Weakest</span><b>${setups[setups.length - 1].k}</b><small class="num ${setups[setups.length - 1].avg < 0 ? "down" : ""}">${money(setups[setups.length - 1].avg)} avg · ${setups[setups.length - 1].n}</small></div>` : ""}
      </div>` : ""}
      <div class="edge-histo" role="img" aria-label="Distribution of trade results in ${B.ccy || "£"}">${buckets.map((b, n) => `<div class="eh-col"><i style="transform:scaleY(${b / maxB})" class="${n < 2 ? "neg" : n === 2 ? "" : "pos"}"></i><small>${labels[n]}</small></div>`).join("")}</div>
      ${insight ? `<p class="edge-insight">${insight}</p>` : ""}
    </div>`;
  }
  function renderJournalView(body) {
    const s = journalStats();
    const items = D.journal.filter(j => journalFilter === "All" ? true : journalFilter === "Wins" ? j.outcome === "win" : j.outcome === "loss");
    body.innerHTML = `
      <div class="jstats reveal">
        <div class="jstat"><b class="num ${s.netR >= 0 ? "up" : "down"}">${money(s.netR)}</b><small>Net result</small></div>
        <div class="jstat"><b class="num">${s.wr}%</b><small>Win rate</small></div>
        <div class="jstat"><b class="num">${s.count}</b><small>Trades</small></div>
        <div class="jstat"><b class="num">${s.pf.toFixed(1)}</b><small>Profit factor</small></div>
      </div>
      <div class="card card-pad equity-card">
        <div class="eq-head"><span class="eyebrow">Equity curve · ${B.ccy || "£"}</span><span class="num ${s.netR >= 0 ? "up" : "down"}" style="font-size:13px">${money(s.netR)}</span></div>
        <canvas id="equity-cv"></canvas>
      </div>
      ${edgeCard()}
      <button class="btn btn-gold btn-block" data-log style="margin:14px 0 2px">${ic("i-plus")} Log a trade</button>
      <div class="chips" id="jfilters">${["All", "Wins", "Losses"].map(f => `<button class="chip ${f === journalFilter ? "active" : ""}" data-jf="${f}" aria-pressed="${f === journalFilter}">${f}</button>`).join("")}</div>
      <div id="journal-list">${items.length ? items.map(journalCard).join("") : `<p class="sub" style="text-align:center;padding:30px 0">No trades here yet — tap “Log a trade”.</p>`}</div>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:14px;color:var(--faint)">Your private journal. Educational only — not financial advice.</p>
      <div class="spacer"></div>`;
    const cv = $("#equity-cv"); if (cv && Charts.drawEquity) { const rs = D.journal.map(j => j.r).slice().reverse(); requestAnimationFrame(() => Charts.drawEquity(cv, rs)); }
    $("[data-log]").onclick = openLogTrade;
    [...document.querySelectorAll("#jfilters .chip")].forEach(c => c.onclick = () => { journalFilter = c.dataset.jf; renderCircle(); });
    [...document.querySelectorAll("[data-jentry]")].forEach(n => n.onclick = () => openJournalEntry(n.dataset.jentry));
  }
  function renderCommunityView(body) {
    const w = D.traderOfWeek;
    body.innerHTML = `
      <div class="totw-big reveal">
        <div class="shine"></div>
        <div class="crown">${ic("i-trophy")}</div>
        <span class="eyebrow">Trader of the week</span>
        ${av(w.initials, 64)}
        <div class="name gold-text">${w.name}</div>
        <div class="handle num">${w.handle}</div>
        <div class="stats">
          <div><b class="num up">${w.ret}</b><small>Return</small></div>
          <div><b class="num">${w.trades}</b><small>Trades</small></div>
          <div><b class="num">${w.winRate}</b><small>Win rate</small></div>
        </div>
        <p class="sub" style="margin-top:15px;font-style:italic">“${w.quote}”</p>
      </div>
      <div class="comm-actions">
        <button class="comm-act" data-act="chat">${ic("i-comm")}<span><b>Community chat</b><small>The floor, all day</small></span></button>
        <button class="comm-act" data-act="challenge">${ic("i-flame")}<span><b>Monthly challenge</b><small>${liveChallenge().done}/${liveChallenge().total} days</small></span></button>
      </div>
      <div class="section-head"><span class="h2">Leaderboard</span><span class="more">This week</span></div>
      ${liveLeaderboard().map(lbRow).join("")}
      <div class="section-head"><span class="h2">Your badges</span></div>
      <div class="badges">${liveBadges().map(b => `<div class="badge-it ${b.on ? "on" : "off"}"><div class="ring2">${ic(b.ic, "bdg-ic")}</div><small>${b.name}</small></div>`).join("")}</div>
      <div class="section-head"><span class="h2">From the floor</span></div>
      ${D.posts.map(post).join("")}
      <div class="spacer"></div>`;
    [...document.querySelectorAll(".post-actions .like")].forEach(a => a.onclick = () => {
      const liked = a.classList.toggle("liked"); const c = a.querySelector("span"); let n = +c.dataset.n;
      n += liked ? 1 : -1; c.dataset.n = n; c.textContent = n;
    });
    const cbtn = body.querySelector("[data-act=chat]"); if (cbtn) cbtn.onclick = openChat;
    const chbtn = body.querySelector("[data-act=challenge]"); if (chbtn) chbtn.onclick = openChallenge;
  }
  function openJournalEntry(id) {
    const j = D.journal.find(x => x.id === id); if (!j) return;
    const shared = isShared(id);
    openModal(`
      <div class="player" style="height:150px"><canvas data-chart="player" data-seed="${(j.dir === "long" ? 14 : 27) + j.id.length * 3}"></canvas></div>
      <div class="jc-top" style="margin-top:16px">
        <div class="jc-pair">${ic("i-chart","ic")}<b style="font-family:var(--display);font-size:19px">${j.pair}</b><span class="idea-dir ${j.dir}">${j.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        <span class="pill ${j.outcome === "win" ? "pill-up" : j.outcome === "loss" ? "pill-down" : ""}">${resStr(j)}</span>
      </div>
      <div class="jc-meta" style="margin:10px 2px">${j.setup} · ${j.session} session · ${j.date}${j.channel && !["—", "Off-plan"].includes(j.channel) ? ` · from ${j.channel}` : ""}</div>
      <span class="eyebrow" style="display:block;margin:8px 0 6px">Reflection</span>
      <p class="sub">${j.note}</p>
      <div class="jc-tags" style="margin-top:13px">${(j.tags || []).map(t => `<span class="jtag ${badTag(t) ? "bad" : "good"}">${t}</span>`).join("")}</div>
      <button class="btn ${shared ? "btn-ghost" : "btn-gold"} btn-block" data-share style="margin-top:18px">${shared ? "✓ Shared to community" : ic("i-share") + " Share to community"}</button>
      <button class="btn btn-ghost btn-block" data-sharecard style="margin-top:10px">${ic("i-share")} Share as card ↗</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:10px;color:var(--faint)">${shared ? "This trade is on the community feed." : "Post this trade to the community feed for others to see."}</p>
    `);
    const sh = $("[data-share]");
    if (sh && !shared) sh.onclick = () => {
      D.posts.unshift({ author: D.user.name, initials: D.user.initials, time: "now", me: true, body: j.note, tag: { pair: j.pair, dir: j.dir, rr: resStr(j) }, likes: 0, comments: 0, liked: false });
      savePosts(); markShared(id);
      closeModal(); circleTab = "community";
      setTimeout(() => { if (activeTab === "community") SCREENS.community(); toast("Shared to the community", "i-check"); }, 320);
    };
    const sc = $("[data-sharecard]"); if (sc) sc.onclick = () => exportTradeCard(j);
  }
  // gold-foil shareable trade card — canvas-rendered 1080×1350 PNG, every colour routed through BRAND
  async function exportTradeCard(j) {
    try { await Promise.all([document.fonts.load('800 96px "Sora"'), document.fonts.load('700 120px "JetBrains Mono"'), document.fonts.load('500 44px "Outfit"')]); } catch (e) {}
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    // near-black base + subtle vignette
    x.fillStyle = "#0B0B0F"; x.fillRect(0, 0, W, H);
    const vg = x.createRadialGradient(W / 2, H * 0.36, 120, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, "rgba(255,255,255,0.05)"); vg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    // foil bar — same stops as the CSS foil, derived from BRAND
    const foil = x.createLinearGradient(0, 0, W, 0);
    foil.addColorStop(0, B._accentDarkest || "#705117"); foil.addColorStop(0.28, B.accent);
    foil.addColorStop(0.5, B._accentHi || "#F3D277"); foil.addColorStop(0.72, B.accent);
    foil.addColorStop(1, B._accentDarkest || "#705117");
    x.fillStyle = foil; x.fillRect(0, 0, W, 14);
    // brand wordmark
    x.fillStyle = foil; x.font = '800 64px "Sora", sans-serif'; x.textAlign = "center";
    x.fillText(B.name.toUpperCase(), W / 2, 150);
    x.fillStyle = "rgba(255,255,255,.45)"; x.font = '500 30px "Outfit", sans-serif';
    x.fillText("TRADE CARD", W / 2, 200);
    // pair + direction
    x.fillStyle = "#F3F3F1"; x.font = '800 88px "Sora", sans-serif';
    x.fillText(j.pair, W / 2, 400);
    const long = j.dir === "long";
    x.fillStyle = long ? "#3ECB86" : "#F0565B"; x.font = '700 44px "JetBrains Mono", monospace';
    x.fillText(long ? "▲ LONG" : "▼ SHORT", W / 2, 465);
    // giant profit result
    const rTxt = j.outcome === "be" ? "BE" : money(j.r);
    x.fillStyle = j.r > 0 ? "#3FBF7F" : j.outcome === "be" ? "#9A9AA6" : "#F0565B";
    x.font = '700 ' + (rTxt.length > 6 ? 170 : 210) + 'px "JetBrains Mono", monospace';
    x.fillText(rTxt, W / 2, 760);
    // meta line
    x.fillStyle = "rgba(255,255,255,.55)"; x.font = '500 36px "Outfit", sans-serif';
    x.fillText(`${j.setup} · ${j.session} session`, W / 2, 850);
    // equity spark from the journal
    const rs = D.journal.map(t => t.r).slice().reverse();
    let cum = 0; const pts = [0]; rs.forEach(r => { cum += r; pts.push(cum); });
    const lo = Math.min(...pts, 0), hi = Math.max(...pts, 1), sx = 160, sw = W - 320, sy = 940, sh2 = 170;
    x.beginPath();
    pts.forEach((v, n) => { const px = sx + n / (pts.length - 1) * sw, py = sy + sh2 - (v - lo) / (hi - lo) * sh2; n ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.strokeStyle = B.accent; x.lineWidth = 5; x.stroke();
    x.fillStyle = B._accentHi || B.accent;
    const lastX = sx + sw, lastY = sy + sh2 - (pts[pts.length - 1] - lo) / (hi - lo) * sh2;
    x.beginPath(); x.arc(lastX, lastY, 9, 0, 7); x.fill();
    // handle + footer
    x.fillStyle = "rgba(255,255,255,.5)"; x.font = '500 34px "JetBrains Mono", monospace';
    x.fillText(D.user.handle + " · " + B.name, W / 2, 1220);
    x.fillStyle = "rgba(255,255,255,.28)"; x.font = '500 24px "Outfit", sans-serif';
    x.fillText("Educational only · not financial advice", W / 2, 1280);
    cv.toBlob(async (blob) => {
      if (!blob) { toast("Could not render the card", null); return; }
      const file = new File([blob], "trade-card.png", { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "My " + B.name + " trade" });
          toast("Card shared", "i-check"); return;
        }
      } catch (e) { if (e && e.name === "AbortError") return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "trade-card.png"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast("Card saved", "i-check");
    }, "image/png");
  }
  function setOn(sel, btn) { [...document.querySelectorAll(sel + " .fchip")].forEach(x => x.classList.toggle("on", x === btn)); }
  function openLogTrade(pre) {
    pre = pre || {};
    let dir = pre.dir || "long", oc = pre.outcome || "win", sess = pre.session || "London";
    openModal(`
      <h2 class="h2" style="margin:2px 0 3px">Log a trade</h2>
      <p class="sub" style="font-size:12px;margin-bottom:15px">${pre.setup ? `Pre-filled from ${pre.setup} — confirm the outcome and save.` : "Record it while it's fresh — the journal is where the growth happens."}</p>
      <label class="flabel">Pair</label>
      <input class="finput" id="f-pair" value="${pre.pair || "XAUUSD"}">
      <label class="flabel">Direction</label>
      <div class="fchips" id="f-dir">${[["long", "▲ Long"], ["short", "▼ Short"]].map(([v, l]) => `<button class="fchip ${v === dir ? "on" : ""}" data-fdir="${v}">${l}</button>`).join("")}</div>
      <label class="flabel">Outcome</label>
      <div class="fchips" id="f-oc">${[["win", "Win"], ["loss", "Loss"], ["be", "Breakeven"]].map(([v, l]) => `<button class="fchip ${v === oc ? "on" : ""}" data-foc="${v}">${l}</button>`).join("")}</div>
      <label class="flabel">Profit / loss (${B.ccy || "£"})</label>
      <input class="finput num" id="f-pl" type="number" step="1" value="${pre.pl != null ? pre.pl : ""}" placeholder="e.g. 420" inputmode="decimal">
      <label class="flabel">Lot size used</label>
      <input class="finput num" id="f-lot" type="number" step="0.01" min="0" value="${pre.lots != null ? pre.lots : "1.00"}" inputmode="decimal">
      <div class="f-weighted" id="f-weighted"></div>
      <label class="flabel">Session</label>
      <div class="fchips" id="f-sess">${["London", "New York", "Asia"].map(v => `<button class="fchip ${v === sess ? "on" : ""}" data-fsess="${v}">${v}</button>`).join("")}</div>
      <label class="flabel">Setup</label>
      <input class="finput" id="f-setup" placeholder="e.g. Break & retest" value="${pre.setup || ""}">
      <label class="flabel">Notes & reflection</label>
      <textarea class="finput ftext" id="f-note" placeholder="What did you do well? What would you do differently?">${pre.note || ""}</textarea>
      <button class="btn btn-gold btn-block" id="f-save" style="margin-top:10px">Save to journal</button>
      <div class="spacer"></div>
    `);
    // result = profit / loss in money, signed by the outcome
    const readLots = () => { let l = parseFloat($("#f-lot").value); return isNaN(l) || l < 0 ? 1 : l; };
    const readPL = () => { let v = parseFloat($("#f-pl").value); if (isNaN(v)) v = 0; v = Math.abs(v); return oc === "be" ? 0 : oc === "loss" ? -v : v; };
    const updResult = () => {
      const v = readPL(), el = $("#f-weighted");
      el.className = "f-weighted " + (v > 0 ? "up" : v < 0 ? "down" : "");
      el.innerHTML = oc === "be" ? "Breakeven — no gain, no loss." : `${oc === "win" ? "Win" : "Loss"} · <b class="num">${money(v)}</b> to your book`;
    };
    [...document.querySelectorAll("[data-fdir]")].forEach(b => b.onclick = () => { dir = b.dataset.fdir; setOn("#f-dir", b); });
    [...document.querySelectorAll("[data-foc]")].forEach(b => b.onclick = () => { oc = b.dataset.foc; setOn("#f-oc", b); updResult(); });
    [...document.querySelectorAll("[data-fsess]")].forEach(b => b.onclick = () => { sess = b.dataset.fsess; setOn("#f-sess", b); });
    $("#f-pl").oninput = updResult; updResult();
    $("#f-save").onclick = () => {
      const lots = readLots(), rv = readPL();
      D.journal.unshift({
        id: "j" + Date.now(), pair: ($("#f-pair").value || "XAUUSD").toUpperCase(), dir, r: rv, lots, outcome: oc,
        session: sess, date: "Today", setup: $("#f-setup").value || "Setup", channel: "—",
        tags: oc === "win" ? ["Followed plan"] : oc === "loss" ? ["Review"] : ["Managed well"],
        note: $("#f-note").value || "No notes added.",
      });
      recordLog(); addXp(40); setSetting("logDay", ymd()); // persist journal + streak + leaderboard points + XP + daily goal
      closeModal(); journalFilter = "All";
      setTimeout(() => { if (activeTab === "community") renderCircle(); toast("Trade logged · +50 pts", "i-check"); }, 320);
    };
  }
  function lbRow(r) {
    const medalCls = r.rank === 1 ? "m1" : r.rank === 2 ? "m2" : r.rank === 3 ? "m3" : "";
    const dn = r.delta.startsWith("+") ? "up" : r.delta.startsWith("-") ? "down" : "";
    return `<div class="lb-row ${r.top?"top":""}" style="${r.me?"border-color:rgba(224,178,60,.4);background:rgba(224,178,60,.06)":""}">
      <div class="rank num ${medalCls}">${r.rank}</div>
      ${av(r.initials, 36, r.top ? "" : "quiet")}
      <div class="nm"><b>${r.name}${r.me?' · You':''}</b><small class="num">${r.handle}</small></div>
      <div style="text-align:right"><div class="pts num">${r.pts}</div><div class="delta num ${dn}">${r.delta!=="0"?r.delta:"—"}</div></div>
    </div>`;
  }
  function post(p) {
    return `<div class="card post">
      <div class="post-head">${av(p.initials, 44, p.me ? "" : "quiet")}
        <div class="nm"><b>${p.author}${p.me ? ' <span class="you-tag">You</span>' : ''}</b><small>${p.time === "now" ? "now" : p.time + " ago"}</small></div>
        ${p.tag?`<span class="idea-dir ${p.tag.dir}" style="margin-left:auto">${p.tag.pair} ${p.tag.rr}</span>`:""}</div>
      <div class="post-body">${p.body}</div>
      <div class="post-actions">
        <button class="a like ${p.liked?"liked":""}">${ic("i-heart")}<span data-n="${p.likes}">${p.likes}</span></button>
        <span class="a">${ic("i-comment")}${p.comments}</span>
        <span class="a" style="margin-left:auto">${ic("i-share")}</span>
      </div></div>`;
  }

  // ============================ HUBS ============================
  SCREENS.hubs = function () {
    setScreen(`
      ${topbar()}
      <div class="app-head"><div class="who"><div><small>Trade together, in person</small><b>Training Hubs</b></div></div></div>
      <p class="sub" style="margin:2px 2px 6px">Train in person at our members-only Hub — learn in real time, trade the open together, and sharpen your edge face-to-face. More cities on the way.</p>
      ${D.hubs.map(hub).join("")}
      <div class="card card-pad" style="text-align:center;border-style:dashed;opacity:.8">
        <div style="font-size:22px">📍</div>
        <b style="font-family:var(--display);display:block;margin-top:6px">More hubs coming</b>
        <small class="sub">Manchester · Toronto · Lagos — vote inside the community.</small>
      </div>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll("[data-rsvp]")].forEach(b => b.onclick = () => {
      const id = b.dataset.rsvp, rs = new Set(pState().rsvp || []), on = !rs.has(id);
      if (on) rs.add(id); else rs.delete(id);
      pSet({ rsvp: [...rs] });
      b.classList.toggle("btn-gold", on); b.classList.toggle("btn-ghost", !on);
      b.textContent = on ? "Interest registered ✓" : "Register interest";
      toast(on ? "We'll let you know when dates go live" : "Removed", on ? "i-check" : null);
    });
    [...document.querySelectorAll("[data-hubsched]")].forEach(b => b.onclick = () => openHubSchedule(b.dataset.hubsched));
    wireCommon();
  };
  function hub(h) {
    if (h.real) return hubReal(h);
    const interested = (pState().rsvp || []).includes(h.id);
    return `<div class="hub reveal">
      <div class="hub-img" style="background:url('${h.img}') center/cover, ${h.tint}">
        <div class="hub-img-g"></div>
        <div class="next"><span class="pill pill-gold">${ic("i-pin","ic")} Coming soon</span></div>
        <div class="hub-cap">
          <h3><span class="hub-flag">${h.flag}</span>${h.city}</h3>
          <div class="loc">${ic("i-pin","ic")} ${h.country}</div>
        </div>
      </div>
      <div class="hub-body">
        <p class="sub" style="margin:2px 2px 14px;line-height:1.55">A ${B.name} hub is opening in ${h.city}. Register your interest and we'll tell you the moment dates go live.</p>
        <button class="btn ${interested ? "btn-gold" : "btn-ghost"} btn-block rsvp" data-rsvp="${h.id}">${interested ? "Interest registered ✓" : "Register interest"}</button>
      </div></div>`;
  }
  function hubReal(h) {
    return `<div class="hub reveal">
      <div class="hub-img" style="background:url('${h.img}') center/cover, ${h.tint}">
        <div class="hub-img-g"></div>
        <div class="next"><span class="pill pill-gold">${ic("i-shield","ic")} ${h.access}</span></div>
        <div class="hub-cap">
          <h3><span class="hub-flag">${h.flag}</span>${h.city}</h3>
          <div class="loc">${ic("i-pin","ic")} ${h.country}</div>
        </div>
      </div>
      <div class="hub-body">
        <div class="hub-tag">${h.tagline}</div>
        <div class="hub-facts">
          <div class="hf">${ic("i-pin","ic")}<div><b>Address</b><small>${h.address}</small></div></div>
          <div class="hf">${ic("i-cal","ic")}<div><b>Open</b><small>${h.hours} · ${h.access}</small></div></div>
        </div>
        <div class="hub-cta-row">
          <button class="btn btn-gold btn-sm" data-hubsched="${h.id}">${ic("i-cal")} Weekly schedule</button>
          <a class="btn btn-ghost btn-sm" href="${h.map}" target="_blank" rel="noopener">${ic("i-pin")} Directions</a>
        </div>
      </div></div>`;
  }
  function openHubSchedule(id) {
    const h = (D.hubs || []).find(x => x.id === id); if (!h) return;
    const tel = (h.phone || "").replace(/\s/g, "");
    openModal(`<h3 class="sheet-title">${h.city} Training Hub</h3>
      <p class="sheet-sub">${h.tagline}</p>
      <div class="card card-pad">
        <div class="hf">${ic("i-pin","ic")}<div><b>Location</b><small>${h.address}</small></div></div>
        <div class="hf">${ic("i-cal","ic")}<div><b>Hours</b><small>${h.hours}</small></div></div>
        <div class="hf" style="border-bottom:none">${ic("i-shield","ic")}<div><b>Access</b><small>${h.access}</small></div></div>
      </div>
      <div class="acct-h">Weekly schedule</div>
      <div class="card card-pad">
        ${h.schedule.map(d => `<div class="hsc-day${/closed/i.test(d.time) ? " closed" : ""}">
          <div class="hsc-head"><b>${d.day}</b><span>${d.time}</span></div>
          <ul class="hsc-items">${d.items.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>`).join("")}
      </div>
      ${h.oneToOne ? `<div class="acct-h">1-to-1 training</div>
      <div class="card card-pad"><ul class="hsc-items">${h.oneToOne.map(i => `<li>${i}</li>`).join("")}</ul></div>` : ""}
      <a class="btn btn-gold btn-block" href="https://blakeytrades.com" target="_blank" rel="noopener" style="margin-top:14px">Become a member</a>
      ${h.phone ? `<a class="btn btn-ghost btn-block" href="tel:${tel}" style="margin-top:10px">${ic("i-comm")} ${h.phone}</a>` : ""}
      <p class="sub" style="font-size:11px;text-align:center;margin:14px 0 2px;color:var(--faint)">Members-only · capital at risk · not financial advice.</p>
      <div class="spacer"></div>`);
  }

  // ============================ PROFILE ============================
  // ── profile: real "Your numbers" + next-milestone, derived from the journal + leaderboard ──
  function sessionStats() {
    const J = D.journal || [];
    return ["London", "New York", "Asia"].map(s => {
      const es = J.filter(j => j.session === s), wins = es.filter(j => j.outcome === "win").length;
      const dec = wins + es.filter(j => j.outcome === "loss").length;
      return { session: s, count: es.length, wr: dec ? Math.round(wins / dec * 100) : 0 };
    }).filter(s => s.count > 0);
  }
  function bestTrade() { const J = D.journal || []; return J.length ? Math.max(...J.map(j => j.r || 0)) : 0; }
  function nextUp() {
    const st = journalStats(), lb = liveLeaderboard(), me = lb.findIndex(r => r.me), out = [];
    const goals = [{ name: "Journaled 40 trades", t: 40 }, { name: "100 trades logged", t: 100 }].filter(g => st.count < g.t);
    if (goals.length) { const g = goals.sort((a, b) => (a.t - st.count) - (b.t - st.count))[0]; out.push({ label: g.name, val: `${st.count} / ${g.t}`, pct: Math.round(st.count / g.t * 100) }); }
    if (me > 0) { const ab = lb[me - 1], gap = ab._p - lb[me]._p; out.push({ label: `Overtake ${ab.name.split(" ")[0]} for #${me}`, val: `${gap} pts to go`, pct: Math.round(lb[me]._p / ab._p * 100) }); }
    return out;
  }
  SCREENS.profile = function () {
    const u = D.user, js = journalStats();
    setScreen(`
      ${topbar(`<button class="icon-btn back-btn" data-back>${ic("i-chev")}</button>`)}
      <div class="profile-head reveal">
        <div class="av-ring" style="background:conic-gradient(var(--gold) ${Math.round(profXp()/profXpNext()*360)}deg, var(--surface-3) 0)">${av(u.initials, 64)}</div>
        <div class="name">${u.name}</div>
        <div class="handle num">${u.handle}</div>
        <div style="margin-top:10px"><span class="pill pill-gold">⭐ Level ${profLevel()} · ${tierName(profLevel())}</span></div>
        <div class="ph-actions">
          <button class="btn btn-ghost btn-sm" id="edit-profile">${ic("i-edit")} Edit</button>
          <button class="btn btn-ghost btn-sm" id="share-card">${ic("i-share")} Share card</button>
        </div>
      </div>

      <div class="card level">
        <div class="kv"><span>Progress to Level ${profLevel()+1}</span><b>${profXp().toLocaleString()} / ${profXpNext().toLocaleString()} XP</b></div>
        <div class="level-bar"><i style="width:${Math.round(profXp()/profXpNext()*100)}%"></i></div>
        <div class="kv"><span>${profXpNext()-profXp()} XP to go — log a trade for +40, pass a path quiz for +60</span></div>
      </div>

      ${getSetting("tier", "free") === "vip"
        ? `<button class="up-card reveal" data-act="membership"><div class="up-ic">${ic("i-trophy","ic")}</div><div class="up-body"><b>${B.short} VIP · Active</b><small>Full signals, the live room &amp; all education</small></div><span class="pill pill-gold">VIP</span></button>`
        : `<button class="up-card reveal" data-act="membership"><div class="up-ic">${ic("i-shield","ic")}</div><div class="up-body"><b>Unlock ${B.short} VIP</b><small>Full signals, the live room &amp; all education</small></div><span class="up-cta">See plans ${ic("i-chev","ic")}</span></button>`}

      <div class="stat-row" style="margin-top:13px">
        <div class="stat">${ic("i-flame","ic")}<b class="num">${profStreak()}</b><small>Day streak</small></div>
        <div class="stat">${ic("i-target","ic")}<b class="num">${journalStats().winRate}%</b><small>Win rate</small></div>
        <div class="stat">${ic("i-live","ic")}<b class="num">${callsJoined()}</b><small>Calls joined</small></div>
      </div>

      <div class="section-head"><span class="h2">Your numbers</span><span class="more" data-act="journal">Journal ›</span></div>
      <div class="card card-pad">
        <div class="num-grid">
          <div class="num-cell"><b class="num ${js.netR>=0?'up':'down'}">${money(js.netR)}</b><small>Net result</small></div>
          <div class="num-cell"><b class="num">${money(js.avgRR, false)}</b><small>Avg win</small></div>
          <div class="num-cell"><b class="num">${js.pf.toFixed(1)}</b><small>Profit factor</small></div>
          <div class="num-cell"><b class="num ${bestTrade()>=0?'up':''}">${money(bestTrade())}</b><small>Best trade</small></div>
        </div>
        <div class="sess-block"><div class="sess-h">Win rate by session</div>
          ${sessionStats().map(s => `<div class="sess-row"><span class="sess-name">${s.session}</span><div class="sess-bar"><i style="width:${s.wr}%"></i></div><span class="sess-pct num">${s.wr}%</span></div>`).join("")}
        </div>
      </div>

      ${nextUp().length ? `<div class="section-head"><span class="h2">Next up</span></div>
      <div class="card card-pad">
        ${nextUp().map(n => `<div class="nu-row"><div class="nu-top"><span class="nu-label">${n.label}</span><span class="nu-val num">${n.val}</span></div><div class="nu-bar"><i style="width:${Math.min(100,n.pct)}%"></i></div></div>`).join("")}
      </div>` : ""}

      <div class="section-head"><span class="h2">Community & tools</span></div>
      <div class="card card-pad">
        ${hubRow("i-shield",`${B.founderLast}'s Desk`,"Founder view · run your community","foundersdesk")}
        ${hubRow("i-flame","Monthly challenge","Journal every trade · 30 days","challenge")}
        ${hubRow("i-comm","Members & following","4,200+ on the floor","members")}
        ${hubRow("i-share","Invite a trader","Grow the community","invite")}
        ${hubRow("i-book","Trading glossary","Key terms, explained","glossary")}
        ${hubRow("i-bell","Notifications","Choose what pings you","settings")}
        ${hubRow("i-chart","Announcements",`From ${B.founderFirst} & the team`,"announce",true)}
      </div>

      <div class="section-head"><span class="h2">Trade journal</span><span class="more" data-act="journal">Open journal ›</span></div>
      <div class="card card-pad">
        ${D.journal.slice(0,4).map((j,i)=>`<div class="journal" ${i===3?'style="border-bottom:none"':''}>
          <div class="jp"><b>${j.pair} ${j.dir==='long'?'▲':'▼'}</b><small>${j.setup} · ${j.session} · ${j.date}</small></div>
          <div class="res num ${j.outcome==='win'?'up':j.outcome==='loss'?'down':''}">${resStr(j)}</div></div>`).join("")}
      </div>

      <div class="section-head"><span class="h2">Settings</span></div>
      <div class="card card-pad">
        ${settingRow("i-bell","Push notifications","",true,"set1",false,getSetting("push",true))}
        ${settingRow("i-live","Live call reminders","",true,"set2",false,getSetting("liveReminders",true))}
        ${settingRow("i-moon","Appearance",currentTheme()==="light"?"Light":"Dark",false,null,false,null,"theme")}
        ${settingRow("i-shield","Account & security","",false,null,false,null,"account")}
        ${settingRow("i-tg","Help & support",`@${B.handle}`,false,null,true,null,"support")}
      </div>
      <button class="btn btn-ghost btn-block" id="sign-out" style="margin-top:14px">Sign out</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:16px;color:var(--faint)">Member since 2025 · Educational content only. Not financial advice.</p>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll(".toggle")].forEach(t => t.onclick = () => {
      const on = t.classList.toggle("on");
      t.setAttribute("aria-checked", on);
      if (t.id === "set1") setSetting("push", on);
      else if (t.id === "set2") setSetting("liveReminders", on);
      toast(on ? "Turned on" : "Turned off", on ? "i-check" : null);
    });
    const bk = $("[data-back]"); if (bk) bk.onclick = () => go("home");
    const so = $("#sign-out"); if (so) so.onclick = signOut;
    const sup = $('[data-act="support"]'); if (sup) sup.onclick = () => window.open(`https://t.me/${B.handle}`, "_blank", "noopener");
    const themeBtn = $('[data-act="theme"]'); if (themeBtn) themeBtn.onclick = () => themeFade(t => { toast(t === "light" ? "Light mode on" : "Dark mode on", "i-moon"); SCREENS.profile(); });
    const acctBtn = $('[data-act="account"]'); if (acctBtn) acctBtn.onclick = openAccountSecurity;
    const ep = $("#edit-profile"); if (ep) ep.onclick = openEditProfile;
    const sc = $("#share-card"); if (sc) sc.onclick = openTraderCard;
    wireCommon();
  };
  function openEditProfile() {
    openModal(`<h2 class="h2" style="margin:2px 0 4px">Edit profile</h2>
      <p class="sub" style="font-size:12px;margin-bottom:15px">This is how the floor sees you.</p>
      <label class="flabel">Display name</label>
      <input class="finput" id="ep-name" value="${D.user.name}">
      <button class="btn btn-gold btn-block" id="ep-save" style="margin-top:16px">Save</button>
      <div class="spacer"></div>`);
    const s = $("#ep-save"); if (s) s.onclick = () => {
      const nm = ($("#ep-name").value || "").trim(); if (!nm) return;
      D.user.name = nm; D.user.first = nm.split(/\s+/)[0];
      D.user.initials = nm.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || D.user.initials;
      pSet({ name: D.user.name, first: D.user.first, initials: D.user.initials });
      closeModal(); SCREENS.profile(); toast("Profile updated", "i-check");
    };
  }
  function openTraderCard() {
    const js = journalStats();
    openModal(`<div class="tcard">
        <div class="tcard-head"><img src="${B.logo}" class="tcard-logo" alt="${B.name}"></div>
        ${av(D.user.initials, 64)}
        <div class="tcard-name">${D.user.name}</div>
        <div class="tcard-lvl">⭐ Level ${profLevel()} · ${tierName(profLevel())}</div>
        <div class="tcard-stats">
          <div><b class="num gold-text">${js.winRate}%</b><small>Win rate</small></div>
          <div><b class="num gold-text">${profStreak()}</b><small>Day streak</small></div>
          <div><b class="num ${js.netR>=0?'up':'down'}">${money(js.netR)}</b><small>Net result</small></div>
        </div>
        <div class="tcard-foot">${D.user.handle} · ${B.name}</div>
      </div>
      <button class="btn btn-gold btn-block" id="tc-share" style="margin-top:14px">${ic("i-share")} Share my card</button>
      <div class="spacer"></div>`);
    const sh = $("#tc-share"); if (sh) sh.onclick = async () => {
      const text = `${D.user.name} · Level ${profLevel()} ${tierName(profLevel())} · ${js.winRate}% win rate · ${profStreak()}-day streak · ${B.name}`;
      const url = "https://blakey-trades.pages.dev/";
      try {
        if (navigator.share) await navigator.share({ title: "My " + B.name + " card", text, url });
        else { await navigator.clipboard.writeText(text + "\n" + url); toast("Card copied to clipboard", "i-check"); }
      } catch (e) { if (e && e.name !== "AbortError") toast("Card ready to share", "i-share"); }
    };
  }
  function settingRow(icon, label, val, toggle, id, last, on, act) {
    const isOn = on != null ? on : true;
    return `<div class="settings-row${act ? " tap" : ""}"${act ? ` data-act="${act}"` : ""}${last?' style="border-bottom:none"':''}>${ic(icon)}<span class="lbl">${label}</span>
      ${toggle ? `<button type="button" class="toggle ${isOn ? "on" : ""}" id="${id}" role="switch" aria-checked="${isOn}" aria-label="${label}"><i></i></button>` : `<span class="val">${val||""}</span>${ic("i-chev","ic")}`}</div>`;
  }
  function hubRow(icon, title, sub, act, last) {
    return `<button class="hub-row${last ? " last" : ""}" data-act="${act}">${ic(icon, "ic")}<div class="hr-body"><b>${title}</b><small>${sub}</small></div>${ic("i-chev", "ic")}</button>`;
  }
  function acctRow(icon, label, val, last) {
    return `<div class="settings-row"${last ? ' style="border-bottom:none"' : ''}>${ic(icon)}<span class="lbl">${label}</span><span class="val">${val || ""}</span>${ic("i-chev","ic")}</div>`;
  }
  function openAccountSecurity() {
    const u = D.user;
    openModal(`<h3 class="sheet-title">Account &amp; security</h3>
      <p class="sheet-sub">Your membership, login and data — all in one place.</p>
      <div class="acct-card">
        <div class="acct-id">${av(u.initials, 44)}<div class="acct-meta"><b>${u.name}</b><small>${u.handle} · Member since 2025</small></div></div>
        <div class="acct-tags">${getSetting("tier", "free") === "vip" ? `<span class="pill pill-gold">${ic("i-trophy","ic")} ${B.short} VIP · Active</span>` : `<span class="pill">Free member</span><span class="acct-free">Free · partner-funded</span>`}</div>
      </div>
      <div class="acct-h">Account</div>
      <div class="card card-pad">
        ${acctRow("i-tg","Email","jordan.hale@gmail.com")}
        ${acctRow("i-tg","Telegram","@jhale_fx · linked")}
        ${acctRow("i-dollar","Membership","BT VIP — free",true)}
      </div>
      <div class="acct-h">Security</div>
      <div class="card card-pad">
        ${settingRow("i-shield","Two-factor auth","",true,"sec-2fa",false,getSetting("twofa",false))}
        ${settingRow("i-check","Biometric login","",true,"sec-bio",false,getSetting("bio",true))}
        ${acctRow("i-edit","Change password","Updated 3 weeks ago")}
        ${acctRow("i-live","Active sessions","2 devices",true)}
      </div>
      <div class="acct-h">Privacy &amp; data</div>
      <div class="card card-pad">
        ${acctRow("i-shield","Privacy policy","")}
        ${acctRow("i-share","Export my data","")}
        ${acctRow("i-comment","Delete account","",true)}
      </div>
      <p class="sub" style="font-size:11px;text-align:center;margin:16px 0 2px;color:var(--faint)">Educational community · capital at risk · not financial advice.</p>
      <div class="spacer"></div>`);
    [...document.querySelectorAll(".toggle")].forEach(t => t.onclick = () => {
      const on = t.classList.toggle("on");
      t.setAttribute("aria-checked", on);
      if (t.id === "sec-2fa") { setSetting("twofa", on); toast(on ? "Two-factor enabled" : "Two-factor off", on ? "i-shield" : null); }
      else if (t.id === "sec-bio") { setSetting("bio", on); toast(on ? "Biometric login on" : "Biometric login off", on ? "i-check" : null); }
    });
  }

  // ============================ MODALS (player + idea) ============================
  let _lastFocus = null;
  function openModal(html) {
    const m = $("#modal");
    _lastFocus = document.activeElement;
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" tabindex="-1"><button class="sheet-grab" aria-label="Close"></button>${html}</div>`;
    void m.offsetWidth;                                             // reflow so the translateY(100%) start state paints → slide-up actually animates
    m.classList.add("open"); requestAnimationFrame(() => { Charts.initIn(m); const sh = m.querySelector(".sheet"); if (sh) try { sh.focus({ preventScroll: true }); } catch (e) {} });
    m.onclick = (e) => { if (e.target === m) closeModal(); };       // tap dimmed area
    const grab = m.querySelector(".sheet-grab"); if (grab) grab.onclick = closeModal; // tap handle
    wireSheetDrag(m.querySelector(".sheet"));                       // swipe-down to dismiss
    return m;
  }
  // native-feel drag-to-dismiss: pull the sheet down (from the top zone, or anywhere when scrolled to top)
  function wireSheetDrag(sh) {
    if (!sh) return;
    let startY = 0, dy = 0, dragging = false, mayDrag = false, t0 = 0;
    sh.addEventListener("touchstart", (e) => {
      const y = e.touches[0].clientY;
      mayDrag = sh.scrollTop <= 0 || (y - sh.getBoundingClientRect().top) < 64;
      startY = y; dy = 0; dragging = false; t0 = performance.now();
    }, { passive: true });
    sh.addEventListener("touchmove", (e) => {
      if (!mayDrag) return;
      const d = e.touches[0].clientY - startY;
      if (!dragging) { if (d > 8 && sh.scrollTop <= 0) { dragging = true; sh.style.transition = "none"; } else if (d < -4) { mayDrag = false; return; } else return; }
      dy = Math.max(0, d);
      e.preventDefault();
      sh.style.transform = `translateY(${dy * 0.92}px)`;
    }, { passive: false });
    const end = () => {
      if (!dragging) return;
      dragging = false; mayDrag = false;
      const vel = dy / Math.max(performance.now() - t0, 1);
      sh.style.transition = "";
      if (dy > 120 || (dy > 40 && vel > 0.45)) { sh.style.transform = "translateY(100%)"; closeModal(); }
      else sh.style.transform = "";
    };
    sh.addEventListener("touchend", end);
    sh.addEventListener("touchcancel", end);
  }
  function closeModal() { const m = $("#modal"); if (!m.classList.contains("open")) return; m.classList.remove("open"); setTimeout(() => { m.innerHTML = ""; }, 350); try { _lastFocus && _lastFocus.focus && _lastFocus.focus({ preventScroll: true }); } catch (e) {} }

  function openPlayer(id) {
    const v = D.videos.find(x => x.id === id) || D.videos[0];
    let prog = getVideoProgress(v.id);
    const pctLabel = Math.round(prog * 100);
    openModal(`
      <div class="player">
        <canvas data-chart="player" data-seed="${v.seed}"></canvas>
        <div class="big-play" data-pp style="${prog >= 1 ? "display:none" : ""}"><span>${ic("i-play")}</span></div>
        <div class="controls">
          <div class="bar"><i id="vbar" style="width:${pctLabel}%"></i></div>
          <div class="crow"><span id="vtime">${pctLabel}%</span><svg viewBox="0 0 24 24"><use href="#i-play"/></svg><span style="margin-left:auto">${v.dur}</span></div>
        </div>
      </div>
      <span class="eyebrow" style="margin-top:14px;display:block">${v.cat}</span>
      <h2 class="h2" style="margin:7px 0 5px">${v.title}</h2>
      <div class="sub" style="font-size:12.5px">${v.host} · ${v.views} views · ${v.date}</div>
      <div style="display:flex;gap:10px;margin:15px 0 4px">
        <button class="btn btn-gold" style="flex:1" data-pp>${ic("i-play")} ${prog >= 1 ? "Replay" : prog > 0 ? "Resume" : "Play"}</button>
        <button class="btn btn-ghost btn-sm" style="height:52px" data-act="save">${isSaved(v.id) ? "Saved ✓" : "+ List"}</button>
      </div>
      <div class="section-head"><span class="h3">Chapters</span></div>
      ${[["00:00","Why the London open matters"],["08:12","Mapping liquidity"],["19:40","The 3 entry models"],["31:05","Live risk management"],["38:20","Q&A from the floor"]]
        .map(([t,c])=>`<div class="chapter"><span class="t num">${t}</span><span class="c">${c}</span>${ic("i-play","ic")}</div>`).join("")}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:16px;color:var(--faint)">Educational content only. Not financial advice.</p>
    `);
    let playing = false, tick;
    const paint = () => {
      prog = getVideoProgress(v.id);
      const bar = $("#vbar"), tm = $("#vtime"), bp = document.querySelector(".big-play");
      const p = Math.round(prog * 100);
      if (bar) bar.style.width = p + "%";
      if (tm) tm.textContent = p + "%";
      if (bp) bp.style.display = prog >= 1 ? "none" : "";
    };
    const play = () => {
      if (playing) return;
      if (prog >= 1) { setVideoProgress(v.id, 0); prog = 0; paint(); }
      playing = true;
      toast("Playing — " + v.title, "i-play");
      tick = setInterval(() => {
        prog = Math.min(1, getVideoProgress(v.id) + 0.06);
        setVideoProgress(v.id, prog);
        paint();
        if (prog >= 1) {
          clearInterval(tick); playing = false;
          toast("Lesson complete · saved to Continue watching", "i-check");
          if (activeTab === "learn") SCREENS.learn(); else if (activeTab === "home") SCREENS.home();
        }
      }, 900);
    };
    [...document.querySelectorAll("[data-pp]")].forEach(b => b.onclick = play);
    const sv = $("[data-act=save]"); if (sv) sv.onclick = () => { const on = toggleSaved(v.id); sv.textContent = on ? "Saved ✓" : "+ List"; toast(on ? "Saved to your list" : "Removed from list", on ? "i-check" : null); };
  }

  function openIdea(id) {
    const i = D.ideas.find(x => x.id === id) || D.ideas[0];
    // hard gate: a free member can never open a LIVE (running) entry's detail — verify with the broker first
    if (getSetting("tier", "free") === "free" && i.status === "running") { return IB ? openVerifyBroker() : openMembership(); }
    const sell = i.dir === "short";
    const st = i.status === "tp" ? `<span class="pill pill-up">${ic("i-check","ic")} Hit TP ${i.result}</span>`
      : i.status === "sl" ? `<span class="pill pill-down">Stopped ${i.result}</span>`
      : i.status === "be" ? `<span class="pill">Breakeven</span>`
      : `<span class="pill pill-gold"><span class="dot-live"></span> Running</span>`;
    const rich = !!(i.tps && i.tps.length);
    const post = rich ? `
      <div class="sigpost">
        <div class="sp-top">
          <span class="sp-head ${sell ? "sell" : "buy"}">${sell ? "🔴 SELL" : "🟢 BUY"} ${i.pair} <span class="sp-gold">(Gold)</span></span>
          ${st}
        </div>
        <div class="sp-sub">Personal Trade Idea — not financial advice, just what ${B.founderFirst}'s personally doing.</div>
        <div class="sp-grid">
          <div class="sp-row"><span>Entry</span><b class="num">${i.entryRange || i.entry}</b></div>
          <div class="sp-row"><span>Stop Loss</span><b class="num sl">${i.sl}</b></div>
        </div>
        <div class="sp-tps">
          <div class="sp-tps-h">🎯 Take Profits</div>
          ${i.slBe ? `<div class="sp-tp be"><span>SL to BE</span><b class="num">${i.slBe}</b></div>` : ""}
          ${i.tps.map((t, n) => `<div class="sp-tp"><span>TP${n + 1}</span><b class="num">${t}</b></div>`).join("")}
        </div>
        ${i.updates && i.updates.length ? `<div class="sp-updates"><div class="sp-up-h">${ic("i-tg","ic")} Live updates</div>${i.updates.map(u => `<div class="sp-up">${u}</div>`).join("")}</div>` : ""}
      </div>` : `
      <div class="idea-top" style="margin-top:16px">
        <div class="idea-pair">${ic("i-chart","ic")}<span class="sym" style="font-family:var(--display);font-weight:800;font-size:19px">${i.pair}</span>
          <span class="idea-dir ${i.dir}">${i.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        <span class="eyebrow muted">${i.time}</span>
      </div>
      <div class="ticket" style="margin-top:12px">
        <div class="cell"><small>Entry</small><b class="num">${i.entryRange || i.entry}</b></div>
        <div class="cell sl"><small>Stop</small><b class="num">${i.sl}</b></div>
        <div class="cell tp"><small>Target</small><b class="num">${i.tp}</b></div>
      </div>
      <div class="idea-foot" style="margin:12px 2px"><span class="rr num">Risk:Reward <b>${i.rr}</b></span><span class="rr num">${i.session} session</span></div>`;
    const closed = i.status === "tp" || i.status === "sl" || i.status === "be";
    const canReplay = rich && closed && i.updates && i.updates.length;
    const canPaper = i.status === "running";
    openModal(`
      <div class="tv-chart" id="tv-${i.id}"><div class="tv-load">${ic("i-chart","ic")} Loading live chart…</div></div>
      <div class="rp-bar" id="rp-bar" hidden><input type="range" class="fd-slider" id="rp-scrub" min="0" max="1000" value="0" aria-label="Scrub through the trade replay"></div>
      ${canReplay ? `<button class="btn btn-ghost btn-block" id="rp-btn" style="margin-top:12px">${ic("i-play")} Replay this call</button>` : ""}
      ${post}
      ${canPaper ? `<button class="btn btn-ghost btn-block" id="pp-btn" style="margin-top:14px">${ic("i-shield")} Paper trade this idea</button>` : ""}
      <span class="eyebrow" style="display:block;margin:16px 0 6px">The reasoning</span>
      <p class="sub">${linkTerms(i.note)}</p>
      ${tookRow(i)}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:18px;color:var(--faint)">Live chart by TradingView · Educational content only. Not financial advice.</p>
    `);
    wireTook();
    mountTV("tv-" + i.id);
    // ---- replay: scrub through the trade's life, updates firing in sync ----
    const rb = $("#rp-btn");
    if (rb) rb.onclick = () => {
      rb.hidden = true;
      const host = document.getElementById("tv-" + i.id);
      host.innerHTML = '<canvas id="rp-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas><span class="rp-tag">Replay</span>';
      const rp = Charts.initReplay($("#rp-cv"), {
        seed: (i.id.charCodeAt(0) + (i.id.charCodeAt(1) || 0)) * 3,
        e: parseFloat(i.entry.replace(/,/g, "")), sl: parseFloat(i.sl.replace(/,/g, "")),
        tp: parseFloat(i.tp.replace(/,/g, "")), dir: i.dir === "short" ? -1 : 1,
      });
      const bar = $("#rp-bar"), scrub = $("#rp-scrub"), ups = [...document.querySelectorAll(".sp-up")];
      bar.hidden = false;
      const setP = (p) => {
        rp.drawAt(p);
        scrub.value = Math.round(p * 1000);
        ups.forEach((u, idx) => u.classList.toggle("rp-dim", p < (idx + 1) / (ups.length + 0.4)));
      };
      if (reduceMotion()) { setP(1); return; }
      let playing = true;
      const t0 = performance.now(), DUR = 6200;
      (function play(t) {
        if (!playing || !document.contains(scrub)) return;
        const p = Math.min((t - t0) / DUR, 1);
        setP(1 - Math.pow(1 - p, 2.2));
        if (p < 1) requestAnimationFrame(play);
      })(t0);
      scrub.addEventListener("pointerdown", () => { playing = false; });
      scrub.addEventListener("input", () => { playing = false; setP(+scrub.value / 1000); });
    };
    // ---- paper trade: anchor at the live price, track it app-wide ----
    const pb = $("#pp-btn");
    if (pb) pb.onclick = () => {
      if (pState().paperPos) { toast("One open paper trade at a time — that's the discipline", "i-shield"); return; }
      openPaperTicket(i);
    };
  }
  // lazy-load TradingView's widget lib once, then mount a clean dark live XAUUSD chart
  function loadTV() {
    if (window._tvP) return window._tvP;
    window._tvP = new Promise((res, rej) => {
      if (window.TradingView) return res();
      const s = document.createElement("script"); s.src = "https://s3.tradingview.com/tv.js";
      s.onload = () => res(); s.onerror = rej; document.head.appendChild(s);
    });
    return window._tvP;
  }
  function mountTV(cid) {
    loadTV().then(() => {
      const el = document.getElementById(cid);
      if (!el || !window.TradingView) return;
      el.innerHTML = "";
      const light = currentTheme() === "light";
      new TradingView.widget({
        container_id: cid, symbol: "OANDA:XAUUSD", interval: "60", timezone: "Europe/London",
        theme: light ? "light" : "dark", style: "1", locale: "en", autosize: true, enable_publishing: false,
        hide_top_toolbar: true, hide_legend: true, hide_side_toolbar: true, allow_symbol_change: false, save_image: false,
        backgroundColor: light ? "#ffffff" : "#0b0c11", gridColor: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)",
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#37BE7E", "mainSeriesProperties.candleStyle.downColor": "#F0565B",
          "mainSeriesProperties.candleStyle.borderUpColor": "#37BE7E", "mainSeriesProperties.candleStyle.borderDownColor": "#F0565B",
          "mainSeriesProperties.candleStyle.wickUpColor": "#37BE7E", "mainSeriesProperties.candleStyle.wickDownColor": "#F0565B"
        }
      });
    }).catch(() => { const el = document.getElementById(cid); if (el) el.innerHTML = `<div class="tv-load">Live chart unavailable — check connection</div>`; });
  }

  // ---------- notifications ----------
  function liveNotifs() { // real events computed from live state
    const out = [], nc = nextCall();
    if (nc) {
      const s = nc.startsIn, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
      const soon = !isLiveNow() && s <= 600;
      const text = isLiveNow() ? `🔴 ${nc.session} has started — ${nc.host} is live now`
        : soon ? `${nc.session} starts in ${Math.max(1, m)} min — get ready to join`
        : `${nc.session} ${h > 0 ? `starts in ${h}h ${m}m` : `starts in ${m}m`} — ${nc.host} hosting`;
      out.push({ k: "call-" + nc.session, icon: isLiveNow() || soon ? "i-live" : "i-bell", text, time: "now", unread: true, go: "live" });
    }
    (D.schedule || []).forEach(c => {
      if (isReminded(c)) out.push({ k: "rem-" + c.session, icon: "i-bell", text: `Reminder set · ${c.session} (${c.at} UK)`, time: "scheduled", unread: false, go: "live" });
    });
    out.push({ k: "leaderboard", icon: "i-trophy", text: `You're #${myRank()} on the weekly leaderboard`, time: "now", unread: true, go: "community" });
    return out;
  }
  // state-driven bell badge — "mark all read" persists instead of un-doing itself on the next render
  function unreadCount() {
    const seen = pState().notifSeen || {};
    const live = liveNotifs().filter(n => n.unread && !seen[n.k]).length;
    const stat = pState().notifReadAt ? 0 : D.notifications.filter(n => n.unread).length;
    return live + stat;
  }
  function badgeHtml() { return unreadCount() > 0 ? '<span class="badge"></span>' : ""; }
  function openNotifications() {
    const groups = {};
    liveNotifs().forEach(n => (groups.Today = groups.Today || []).push(n));
    D.notifications.filter(n => n.go !== "live" && !/leaderboard/i.test(n.text)).forEach(n => (groups[n.group] = groups[n.group] || []).push(n));
    const sec = g => groups[g] ? `<div class="eyebrow muted" style="margin:16px 2px 9px">${g}</div>` +
      groups[g].map(n => `<button class="notif ${n.unread ? "unread" : ""}" data-go="${n.go}">${ic(n.icon, "nicon")}<span class="ntext">${n.text}</span><span class="ntime num">${n.time}</span></button>`).join("") : "";
    openModal(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">
        <h2 class="h2">Notifications</h2>
        <button class="btn btn-ghost btn-sm" data-mark>Mark all read</button>
      </div>
      ${sec("Today")}${sec("Earlier")}
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll(".notif")].forEach(b => b.onclick = () => { const g = b.dataset.go; closeModal(); setTimeout(() => { if (SCREENS[g]) go(g); }, 300); });
    const mk = $("[data-mark]"); if (mk) mk.onclick = () => {
      D.notifications.forEach(n => n.unread = false);
      const seen = { ...(pState().notifSeen || {}) }; liveNotifs().forEach(n => { seen[n.k] = 1; });
      pSet({ notifReadAt: Date.now(), notifSeen: seen });
      [...document.querySelectorAll(".notif")].forEach(n => n.classList.remove("unread"));
      [...document.querySelectorAll("[data-act=notif] .badge")].forEach(b => b.remove());
      toast("All caught up", "i-check");
    };
  }

  // ---------- signals: channels hub (a bottom tab) + per-channel feed ----------
  SCREENS.signals = function () { // Signals tab — the Telegram channels, mirrored in-app
    setScreen(`
      ${topbar()}
      <div class="app-head"><div class="who"><div><small>${ic("i-tg","ic")} Synced from Telegram</small><b>Trade Signals</b></div></div></div>
      <p class="sub" style="margin:0 2px 8px">Every call from the ${B.name} channels, in one place.</p>
      <div class="tg-sync"><span class="tg-syncdot"></span><div class="tg-sync-tx"><b>Live-synced from Telegram</b><small>Members keep their calls in Telegram — the app just gives them a better home.</small></div></div>
      <div class="nfa">${ic("i-shield","ic")} Educational only · not financial advice · capital at risk</div>
      ${marketBar()}
      <div style="height:14px"></div>
      ${trackRecordCard()}
      <div class="section-head"><span class="h2">Channels</span></div>
      ${D.channels.map(channelCard).join("")}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:14px;color:var(--faint)">Educational content only. Not financial advice.</p>
      <div class="spacer"></div>`);
    [...document.querySelectorAll("[data-chan]")].forEach(n => n.onclick = () => openChannel(n.dataset.chan));
    mountMarketBar();
  };
  function openIdeas() { go("signals"); } // alias for the Home link / notifications
  function chanMark(c, extra) {
    const cls = `chan-mark ${c.tone || ""}${extra ? " " + extra : ""}${c.img ? " has-img" : ""}`;
    return c.img
      ? `<div class="${cls}"><img src="${c.img}" alt="${c.name}" loading="lazy"></div>`
      : `<div class="${cls}">${c.mark}</div>`;
  }
  function channelCard(c) {
    const items = D.ideas.filter(i => i.channel === c.id);
    const latest = items[0];
    return `<button class="chan" data-chan="${c.id}">
      ${chanMark(c)}
      <div class="chan-body">
        <div class="chan-top"><b>${c.name}</b><span class="tg-badge">${ic("i-tg")} Telegram</span></div>
        <div class="chan-desc">${c.desc}</div>
        <div class="chan-meta"><span class="num">${c.members}</span> ${c.bot ? "followers" : "members"} · <span class="num">${c.today}</span> today${latest ? ` · <span class="idea-dir ${latest.dir}" style="padding:1px 7px;font-size:9px">${latest.pair} ${latest.dir === "long" ? "▲" : "▼"}</span>` : ""}</div>
      </div>
      ${ic("i-chev", "ic")}
    </button>`;
  }
  let lastChanId = null;
  function openChannel(id) {
    const c = D.channels.find(x => x.id === id) || D.channels[0];
    const items = D.ideas.filter(i => i.channel === id);
    const closed = items.filter(i => i.status === "tp" || i.status === "sl");
    const wins = items.filter(i => i.status === "tp").length;
    const wr = closed.length ? Math.round(wins / closed.length * 100) : 100;
    setScreen(`
      ${topbar(`<button class="icon-btn back-btn" data-back>${ic("i-chev")}</button>`)}
      <div class="chan-head">
        ${chanMark(c, "big")}
        <div><div class="chan-title">${c.name}${c.bot ? ` <span class="pill pill-gold" style="height:20px;font-size:10px">🤖 Mechanical</span>` : ""}</div><div class="chan-handle num">${c.handle}</div></div>
      </div>
      <p class="sub" style="margin:11px 2px">${c.desc}</p>
      <div class="chan-stats">
        <div><b class="num">${c.members}</b><small>${c.bot ? "Followers" : "Members"}</small></div>
        <div><b class="num">${items.length}</b><small>Signals</small></div>
        <div><b class="num up">${wr}%</b><small>Win rate</small></div>
      </div>
      <div class="nfa">${ic("i-shield","ic")} Educational only · not financial advice · capital at risk</div>
      <div class="section-head"><span class="h3">Recent signals</span><span class="more num">${items.length}</span></div>
      <div id="chan-list"></div>
      <button class="tg-link" data-tg>${ic("i-tg")} Open ${c.handle} in Telegram ↗</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:8px;color:var(--faint)">Educational content only. Not financial advice.</p>
      <div class="spacer"></div>`);
    [...document.querySelectorAll(".tab")].forEach(t => t.classList.toggle("active", t.dataset.tab === "signals"));
    activeTab = "signals";
    $("[data-back]").onclick = openIdeas;
    $("[data-tg]").onclick = () => toast(`Opens ${c.name} on Telegram`, "i-tg");
    const list = $("#chan-list");
    lastChanId = id;
    const tier = getSetting("tier", "free");
    list.innerHTML = items.map(x => (tier === "free" && x.status === "running") ? lockedSignalCard(x) : ideaCard(x)).join("");
    requestAnimationFrame(() => Charts.initIn(list));
    [...list.querySelectorAll("[data-idea]")].forEach(n => n.onclick = () => openIdea(n.dataset.idea));
    const lk = list.querySelector("[data-lockvip]"); if (lk) lk.onclick = IB ? openVerifyBroker : openMembership;
    const vv = list.querySelector("[data-vipviewers]");
    if (vv && !reduceMotion()) { const iv = setInterval(() => { if (document.hidden) return; let n = +vv.textContent + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)); n = Math.max(72, Math.min(103, n)); vv.textContent = n; }, 4000); cleanups.push(() => clearInterval(iv)); }
    wireTook();
  }

  // ---------- shared wiring ----------
  // ============================ TRADING TOOLS ============================
  function toolsRow() {
    const tools = [
      { act: "calc", ic: "i-calc", label: "Risk calc" },
      { act: "calendar", ic: "i-cal", label: "News" },
      { act: "alerts", ic: "i-bell", label: "Alerts" },
      { act: "watchlist", ic: "i-dollar", label: "Gold price" },
    ];
    return `<div class="tools-row">${tools.map(t => `<button class="tool-tile" data-act="${t.act}">${ic(t.ic)}<span>${t.label}</span></button>`).join("")}</div>`;
  }
  function openCalc() {
    openModal(`
      <h3 class="sheet-title">Risk calculator</h3><p class="sheet-sub">Position size from your risk — XAUUSD.</p>
      <label class="flabel">Account balance ($)</label><input class="finput num" id="c-bal" inputmode="decimal" value="10000">
      <label class="flabel">Risk per trade (%)</label><input class="finput num" id="c-risk" inputmode="decimal" value="1">
      <div class="calc-2"><div><label class="flabel">Entry</label><input class="finput num" id="c-entry" inputmode="decimal" value="2946.5"></div><div><label class="flabel">Stop loss</label><input class="finput num" id="c-sl" inputmode="decimal" value="2934.0"></div></div>
      <div id="calc-out"></div>`);
    const calc = () => {
      const bal = parseFloat($("#c-bal").value) || 0, risk = parseFloat($("#c-risk").value) || 0;
      const entry = parseFloat($("#c-entry").value) || 0, sl = parseFloat($("#c-sl").value) || 0;
      const riskUSD = bal * risk / 100, dist = Math.abs(entry - sl), perLot = dist * 100;
      const lots = perLot > 0 ? riskUSD / perLot : 0;
      const out = $("#calc-out"); if (!out) return;
      out.innerHTML = `<div class="calc-card">
        <div class="cc-row"><span>Risk amount</span><b class="num up">$${riskUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</b></div>
        <div class="cc-row"><span>Stop distance</span><b class="num">${dist.toFixed(1)} pts</b></div>
        <div class="cc-row big"><span>Position size</span><b class="num gold-text">${lots.toFixed(2)} lots</b></div>
        <div class="cc-row"><span>≈ units</span><b class="num">${Math.round(lots * 100).toLocaleString()} oz</b></div>
      </div><p class="calc-note">${ic("i-shield", "ic")} Educational tool — always confirm sizing with your broker.</p>`;
    };
    ["#c-bal", "#c-risk", "#c-entry", "#c-sl"].forEach(s => { const e = $(s); if (e) e.oninput = calc; });
    calc();
  }
  // ── economic calendar: live gold-impact news via the Cloudflare Worker proxy (KV-cached → ForexFactory feed) ──
  // CORS-enabled; falls back to the mock D.calendar so the sheet is never empty/broken.
  const CAL_API = "https://blakey-cal.kyleairey.workers.dev";
  let liveCal = null;
  async function loadCalendar() {
    try {
      const r = await fetch(CAL_API, { cache: "no-store" });
      if (!r.ok) throw 0;
      const d = await r.json();
      if (Array.isArray(d) && d.length) {
        liveCal = d;
        try { localStorage.setItem("bt_cal", JSON.stringify({ t: Date.now(), d })); } catch (e) {}
        paintBrief(); // refresh the brief's "On watch" once the calendar lands
        return d;
      }
    } catch (e) {}
    return null;
  }
  function fmtCalItem(e) { // live rows carry an ISO `date` → render day/time in UK time; mock rows pass through
    if (!e.date) return { day: e.day, time: e.time, cur: e.cur, impact: e.impact, event: e.event, forecast: e.forecast || "", previous: e.previous || "" };
    const d = new Date(e.date), tz = "Europe/London";
    const time = d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
    const key = x => x.toLocaleDateString("en-GB", { timeZone: tz });
    const now = new Date(), tom = new Date(now.getTime() + 864e5), ek = key(d);
    const day = ek === key(now) ? "Today" : ek === key(tom) ? "Tomorrow" : d.toLocaleDateString("en-GB", { timeZone: tz, weekday: "long" });
    return { day, time, cur: e.cur, impact: e.impact, event: e.event, forecast: e.forecast || "", previous: e.previous || "" };
  }
  function calRowsHtml(list) {
    const byDay = {}; list.map(fmtCalItem).forEach(e => (byDay[e.day] = byDay[e.day] || []).push(e));
    return Object.keys(byDay).map(d => `<div class="cal-day">${d}</div>${byDay[d].map(e => `<div class="cal-row"><span class="cal-time num">${e.time}</span><span class="cal-cur">${e.cur}</span><span class="cal-ev">${e.event}${(e.forecast || e.previous) ? `<small class="cal-fp num">Forecast ${e.forecast || "–"} · Prev ${e.previous || "–"}</small>` : ""}</span><span class="cal-imp imp-${e.impact}">${e.impact}</span></div>`).join("")}`).join("");
  }
  function openCalendar() {
    setSetting("newsWeek", weekKey()); // marks the Monday "check the week's news" goal done
    const live = !!(liveCal && liveCal.length);
    const subLive = `<span class="cal-live">● Live</span> · news that moves gold · times UK`;
    openModal(`<h3 class="sheet-title">Market news</h3><p class="sheet-sub">${live ? subLive : "News that moves gold · times UK"}</p><div class="cal" id="cal-list">${calRowsHtml(live ? liveCal : D.calendar)}</div>`);
    if (!live) loadCalendar().then(d => {
      const box = $("#cal-list"); if (!d || !box) return;
      const swap = () => { box.innerHTML = calRowsHtml(d); const s = box.parentElement.querySelector(".sheet-sub"); if (s) s.innerHTML = subLive; };
      if (reduceMotion()) { swap(); return; }
      box.style.transition = "opacity .18s"; box.style.opacity = "0";
      setTimeout(() => { swap(); box.style.opacity = "1"; setTimeout(() => { box.style.transition = ""; }, 220); }, 190);
    });
  }
  function openAlerts() {
    const list = () => D.alerts.map((a, i) => `<div class="alert-row"><div class="alert-body"><b class="num">${a.sym} ${a.cond === "above" ? "▲" : "▼"} ${a.price}</b><small>${a.note}</small></div><button class="tgl ${a.on ? "on" : ""}" data-al="${i}"><span></span></button></div>`).join("");
    openModal(`<h3 class="sheet-title">Price alerts</h3><p class="sheet-sub">Get pinged when gold hits your level.</p><div id="alert-list">${list()}</div><label class="flabel" style="margin-top:16px">New gold alert</label><div class="calc-2"><input class="finput num" id="al-px" inputmode="decimal" placeholder="e.g. 2,960" aria-label="Alert price level"><button class="btn btn-gold" id="al-add" style="height:50px;flex:none;padding:0 18px">${ic("i-plus")} Add</button></div>`);
    const wire = () => [...document.querySelectorAll("[data-al]")].forEach(b => b.onclick = () => { const a = D.alerts[+b.dataset.al]; a.on = !a.on; b.classList.toggle("on", a.on); saveAlerts(); });
    wire();
    const add = $("#al-add"); if (add) add.onclick = () => { const px = $("#al-px").value.trim(); if (!px) return; D.alerts.unshift({ sym: "XAUUSD", cond: "above", price: px, note: "Custom alert", on: true }); saveAlerts(); $("#alert-list").innerHTML = list(); wire(); $("#al-px").value = ""; toast("Alert set", "i-check"); };
  }
  // ── Gold price tool: live spot gold in the community's currencies ──
  // USD = real spot (gold-api, shared with the market bar); GBP/EUR = ECB daily (frankfurter); AED = its fixed USD peg.
  const AED_PEG = 3.6725; // the UAE dirham is pegged to the US dollar
  let fxUsd = null; // { GBP, EUR } — units per 1 USD
  async function loadFx() {
    try {
      const r = await fetch(CAL_API + "/fx", { cache: "no-store" });
      if (!r.ok) throw 0;
      const j = await r.json(); // the /fx route returns the rates object directly: { GBP, EUR }
      if (j && (j.GBP || j.EUR)) { fxUsd = j; try { localStorage.setItem("bt_fx", JSON.stringify({ t: Date.now(), r: j })); } catch (e) {} return j; }
    } catch (e) {}
    return null;
  }
  function goldRowsHtml() {
    const g = (mbPrice != null) ? mbPrice : null;
    const rate = { GBP: fxUsd && fxUsd.GBP, EUR: fxUsd && fxUsd.EUR, AED: AED_PEG };
    return D.goldCurrencies.map(c => {
      const r = rate[c.code];
      const px = (g != null && r) ? c.sym + (g * r).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
      return `<div class="gp-ccy"><span class="gp-flag">${c.flag}</span><div class="gp-cbody"><b>XAU/${c.code}</b><small>${c.name}</small></div><span class="gp-cpx num">${px}</span></div>`;
    }).join("");
  }
  function openWatchlist() {
    const g = (mbPrice != null) ? mbPrice : null;
    const pct = (g != null && mbBase) ? ((g - mbBase) / mbBase * 100) : null;
    const usd = g != null ? "$" + g.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
    const chg = pct != null ? `<span class="gp-chg num ${pct >= 0 ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}% today</span>` : "";
    openModal(`<h3 class="sheet-title">Gold</h3><p class="sheet-sub">Live spot price · XAU/USD</p>
      <div class="gp-hero"><canvas class="gp-spark" data-chart="thumb" data-seed="7"></canvas><div class="gp-px num">${usd}</div>${chg}<div class="gp-unit">per troy ounce</div></div>
      <div class="gp-ccy-h">Gold in your currency</div>
      <div class="gp-list" id="gp-list">${goldRowsHtml()}</div>`);
    if (!fxUsd) loadFx().then(r => { if (r) { const box = $("#gp-list"); if (box) box.innerHTML = goldRowsHtml(); } });
  }

  // ============================ COMMUNITY / PROFILE FEATURES ============================
  // trading jargon in trusted DATA strings auto-links to its glossary definition (never run on user input)
  // vernacular → canonical glossary term (the notes say "demand block", the glossary says "Supply / demand zone")
  const GLOSS_ALIAS = {
    "liquidity sweep": "Liquidity sweep", "swept": "Liquidity sweep", "sweep": "Liquidity sweep",
    "liquidity": "Liquidity", "demand block": "Supply / demand zone", "demand zone": "Supply / demand zone",
    "supply zone": "Supply / demand zone", "supply": "Supply / demand zone", "order block": "Order block",
    "reclaimed": "Reclaim & hold", "reclaim": "Reclaim & hold", "breakeven": "Breakeven (BE)",
    "structure": "Break of Structure (BOS)", "retest": "Support & resistance", "resistance": "Support & resistance",
    "fvg": "Fair value gap (FVG)", "drawdown": "Drawdown", "fomo": "FOMO", "confluence": "Confluence",
    "revenge": "Revenge trading", "trailing": "Trailing stop", "trailed": "Trailing stop",
    "partials": "Scaling out", "nfp": "NFP", "cpi": "CPI", "fomc": "FOMC", "range": "Range",
  };
  let _termRx = null;
  function linkTerms(html) {
    if (!D.glossary || !D.glossary.length) return html;
    if (!_termRx) {
      const alts = Object.keys(GLOSS_ALIAS).map(a => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
      _termRx = new RegExp("\\b(" + alts.join("|") + ")\\b", "i");
    }
    const seen = new Set();
    // link only the first occurrence per term, and never inside a tag
    return html.split(/(<[^>]+>)/).map(part => {
      if (part.startsWith("<")) return part;
      let out = "", rest = part, m;
      while ((m = rest.match(_termRx))) {
        const canon = GLOSS_ALIAS[m[1].toLowerCase()] || m[1];
        out += rest.slice(0, m.index);
        if (seen.has(canon)) { out += m[1]; }
        else { seen.add(canon); out += `<button class="gterm" data-gterm="${canon}">${m[1]}</button>`; }
        rest = rest.slice(m.index + m[1].length);
      }
      return out + rest;
    }).join("");
  }
  function showGloss(word) {
    const w = word.toLowerCase();
    const g = D.glossary.find(x => x.term.toLowerCase() === w)
      || D.glossary.find(x => w.indexOf(x.term.toLowerCase()) >= 0 || x.term.toLowerCase().indexOf(w) >= 0);
    if (!g) return;
    const old = document.getElementById("gloss-pop"); if (old) old.remove();
    const el = document.createElement("div");
    el.id = "gloss-pop"; el.setAttribute("role", "note");
    el.innerHTML = `<span class="eyebrow">${g.cat || "Glossary"}</span><b>${g.term}</b><p>${g.def}</p><small>Tap anywhere to dismiss</small>`;
    (document.querySelector(".app") || document.body).appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    const kill = () => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); document.removeEventListener("pointerdown", onDoc, true); };
    const onDoc = (e) => { if (!el.contains(e.target)) kill(); };
    setTimeout(() => document.addEventListener("pointerdown", onDoc, true), 60);
    setTimeout(kill, 9000);
  }
  function openGlossary() {
    const cats = [...new Set(D.glossary.map(g => g.cat || "Terms"))];
    const body = cats.map(c => `<div class="gloss-cat">${c}</div>${D.glossary.filter(g => (g.cat || "Terms") === c).map(g => `<div class="gloss-row"><b>${g.term}</b><span>${g.def}</span></div>`).join("")}`).join("");
    openModal(`<h3 class="sheet-title">Trading glossary</h3>
      <p class="sheet-sub">${D.glossary.length} terms every gold trader should know — the BT VIP vocabulary, in plain English.</p>
      <input class="finput gloss-search" id="gloss-q" placeholder="Search terms…" aria-label="Search glossary terms" autocomplete="off">
      <div class="gloss" id="gloss-list">${body}</div>
      <div class="gloss-empty" id="gloss-empty" hidden>No terms match — try another word.</div>
      <p class="sub" style="font-size:11px;text-align:center;margin:14px 0 4px;color:var(--faint)">Educational only · not financial advice.</p>`);
    const q = $("#gloss-q");
    if (q) q.oninput = () => {
      const v = q.value.toLowerCase().trim();
      let shown = 0;
      [...document.querySelectorAll("#gloss-list .gloss-row")].forEach(r => { const m = !v || r.textContent.toLowerCase().includes(v); r.style.display = m ? "" : "none"; if (m) shown++; });
      [...document.querySelectorAll("#gloss-list .gloss-cat")].forEach(h => { let n = h.nextElementSibling, any = false; while (n && n.classList.contains("gloss-row")) { if (n.style.display !== "none") any = true; n = n.nextElementSibling; } h.style.display = any ? "" : "none"; });
      const e = $("#gloss-empty"); if (e) e.hidden = shown > 0;
    };
  }
  function openInvite() {
    openModal(`<div class="invite"><div class="invite-ic">${ic("i-share")}</div>
      <h3 class="sheet-title" style="text-align:center">Invite a trader</h3>
      <p class="sheet-sub" style="text-align:center">Bring someone to the floor — it's free. The community grows when you do.</p>
      <div class="invite-code"><span class="num">JORDAN-22</span><button class="invite-copy" id="inv-copy">Copy</button></div>
      <button class="btn btn-gold btn-block" id="inv-share" style="margin-top:14px">${ic("i-share")} Share invite link</button>
      <div class="invite-stat"><b class="num gold-text">3</b> joined · VIP badge unlocks at 5</div></div>`);
    const c = $("#inv-copy"); if (c) c.onclick = () => { c.textContent = "Copied ✓"; toast("Invite code copied", "i-check"); };
    const s = $("#inv-share"); if (s) s.onclick = () => toast("Share to anyone", "i-share");
  }
  function openSettings() {
    const opts = ["New signals", "Live call starting", "Replies & mentions", "Leaderboard moves", "Economic news", "Streak reminders"];
    const prefs = getNotifPrefs();
    openModal(`<h3 class="sheet-title">Notifications</h3><p class="sheet-sub">Choose what pings you.</p><div class="settings">${opts.map((o, i) => `<div class="set-row"><span>${o}</span><button class="tgl ${prefs[i] ? "on" : ""}" data-set="${i}" role="switch" aria-checked="${!!prefs[i]}" aria-label="${o}"><span></span></button></div>`).join("")}</div>`);
    [...document.querySelectorAll("[data-set]")].forEach(b => b.onclick = () => { const on = b.classList.toggle("on"); b.setAttribute("aria-checked", on); setNotifPref(+b.dataset.set, on); });
  }
  function openAnnouncements() {
    openModal(`<h3 class="sheet-title">Announcements</h3><p class="sheet-sub">From ${B.founderFirst} & the team.</p><div class="ann">${D.announcements.map(a => `<div class="ann-row">${av(a.from === "Team" ? B.short : B.founderInitials, 38)}<div><div class="ann-top"><b>${a.from}</b><span class="vchk">✓</span><span class="ann-time">${a.time}</span></div><p>${a.text}</p></div></div>`).join("")}</div>`);
    if (unreadAnnouncements()) {
      setSetting("annSeen", D.announcements.length);
      const dr = document.querySelector('.desk [data-act=announce] .dr-val');
      if (dr) { dr.textContent = "All read ✓"; dr.classList.remove("gold-tx"); }
    }
  }
  function openChallenge() {
    const c = liveChallenge(), pct = Math.round(c.done / c.total * 100);
    openModal(`<h3 class="sheet-title">Monthly challenge</h3><div class="chal"><div class="chal-ic">${ic("i-flame")}</div>
      <b class="chal-name">${c.name}</b><p class="chal-desc">${c.desc}</p>
      <div class="chal-bar"><i style="width:${pct}%"></i></div><div class="chal-meta"><span class="num gold-text">${c.done}/${c.total}</span> days · ${pct}%</div>
      <div class="chal-reward">${ic("i-trophy", "ic")} ${c.reward}</div>
      <button class="btn ${c.joined ? "btn-ghost" : "btn-gold"} btn-block" id="chal-join" style="margin-top:16px">${c.joined ? "You're in ✓" : "Join challenge"}</button></div>`);
    const j = $("#chal-join"); if (j) j.onclick = () => { saveChallenge({ joined: true }); j.className = "btn btn-ghost btn-block"; j.textContent = "You're in ✓"; toast("Joined — log a trade today", "i-check"); };
  }
  function openMembers() {
    const rows = liveLeaderboard().map(m => `<div class="mem-row">${av(m.initials, 40, m.top ? "" : "quiet")}<div class="mem-body"><b>${m.name}${m.me ? " · You" : ""}</b><small class="num">${m.handle}</small></div>${m.me ? "" : `<button class="btn btn-ghost btn-sm" data-f>Follow</button>`}</div>`).join("");
    openModal(`<h3 class="sheet-title">Members</h3><p class="sheet-sub">${(4200).toLocaleString()}+ on the floor — follow traders you rate.</p><div class="mem">${rows}</div>`);
    [...document.querySelectorAll("[data-f]")].forEach(b => b.onclick = () => { const on = b.classList.toggle("following"); b.textContent = on ? "Following ✓" : "Follow"; });
  }

  // ============================ MONETISATION + FOUNDER (the money story) ============================
  const IB = B.vipModel !== "paid"; // partner-funded VIP: verified via the founder's broker IB list
  const PLANS = [
    { id: "free", name: "Free", tag: "The floor", cta: "Current plan", cur: true, feats: ["Live gold calls in Telegram", "Community chat & the floor", "Education previews", "Economic calendar & tools"] },
    { id: "vip", name: `${B.short} VIP`, tag: "Full signals + live room", gold: true, ib: IB, cta: IB ? `Unlock with ${B.broker}` : "Upgrade to VIP", feats: [`Every VIP signal — full entry, stop & all targets`, "The live trading room, every session", "Complete education library (176+ lessons)", "Verified track record & instant alerts"] },
    { id: "inner", name: "Inner Circle", tag: "Everything + mentorship", cta: "Upgrade", feats: ["Everything in VIP", "1-to-1 trade reviews with the team", "Priority in the live room", "In-person Training Hub access"] },
  ];
  function rerenderAfterTier() { if (lastChanId && $("#chan-list")) openChannel(lastChanId); else if (SCREENS[activeTab]) SCREENS[activeTab](); }
  function openMembership() {
    const tierNow = getSetting("tier", "free");
    const cards = PLANS.map(t => {
      const cur = t.id === tierNow;
      return `
      <div class="tier ${t.gold ? "tier-gold" : ""} ${cur ? "tier-cur" : ""}">
        <div class="tier-top">
          <div><div class="tier-name">${t.name}</div><div class="tier-tag">${t.tag}</div></div>
          ${cur ? `<span class="pill">Current</span>` : t.id === "free" ? `<span class="tier-price">£0</span>` : t.ib ? `<span class="tier-price">Free<small> · ${B.broker}-linked</small></span>` : `<span class="tier-price">£—<small>/mo</small></span>`}
        </div>
        <ul class="tier-feats">${t.feats.map(f => `<li>${ic("i-check", "ic")}<span>${f}</span></li>`).join("")}</ul>
        <button class="btn ${t.gold ? "btn-gold" : "btn-ghost"} btn-block tier-cta" data-tier="${t.id}"${cur ? " disabled" : ""}>${cur ? "Current plan" : t.cta}</button>
      </div>`;
    }).join("");
    openModal(`
      <h3 class="sheet-title">Membership</h3>
      <p class="sheet-sub">${IB ? `${B.short} VIP is partner-funded — free when you trade with ${B.broker} under ${B.name}. Inner Circle pricing is yours to set.` : "Your community, your pricing — you set the price when you launch."}</p>
      <div class="tiers">${cards}</div>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:6px;color:var(--faint)">Free members keep getting calls in Telegram. VIP unlocks the full app.</p>
      ${getSetting("tier", "free") !== "free" ? `<button class="btn btn-ghost btn-sm btn-block" id="demo-reset" style="margin-top:10px">Demo: reset to Free</button>` : ""}`);
    const rs = $("#demo-reset"); if (rs) rs.onclick = () => { setSetting("tier", "free"); closeModal(); toast("Demo reset — back to Free", "i-check"); setTimeout(rerenderAfterTier, 360); };
    [...document.querySelectorAll("[data-tier]")].forEach(b => b.onclick = () => {
      if (b.disabled || b.dataset.tier === "free") return;
      const plan = PLANS.find(p => p.id === b.dataset.tier) || PLANS[1];
      if (plan.ib) return openVerifyBroker();
      openModal(`
        <h3 class="sheet-title">Confirm upgrade</h3>
        <p class="sheet-sub">${plan.name} — the full ${B.name} experience.</p>
        <div class="card card-pad" style="margin:10px 0 14px">
          <div class="kv"><span>Plan</span><b>${plan.name}</b></div>
          <div class="kv"><span>Billing</span><b>Monthly · cancel anytime</b></div>
          <div class="kv"><span>Price</span><b>£— · you set this at launch</b></div>
        </div>
        <button class="btn btn-gold btn-block" id="confirm-up">${ic("i-check")} Confirm upgrade</button>
        <p class="sub" style="font-size:11px;text-align:center;margin-top:10px;color:var(--faint)">Demo checkout — no payment taken.</p>`);
      $("#confirm-up").onclick = () => {
        setSetting("tier", plan.id === "inner" ? "inner" : "vip");
        closeModal();
        setTimeout(() => {
          showPush(`Welcome to ${plan.name} 🔓`, "Full signals, the live room & the library are unlocked");
          toast(`${plan.name} unlocked`, "i-check");
          rerenderAfterTier();
        }, 380);
      };
    });
  }
  // ---- broker (IB) verification — VIP is free for members trading under the founder's partner link ----
  function openVerifyBroker() {
    openModal(`
      <h3 class="sheet-title">Unlock ${B.short} VIP</h3>
      <p class="sheet-sub">${B.short} VIP is free — funded by the ${B.name} × ${B.broker} partnership. Link a ${B.broker} account opened under ${B.name} and every signal unlocks.</p>
      <div class="vb-how">
        <div class="vb-step"><span class="vb-n num">1</span><span>Open your ${B.broker} account through ${B.founderFirst}'s partner link — or ask support to move an existing one under ${B.name}.</span></div>
        <div class="vb-step"><span class="vb-n num">2</span><span>Enter your ${B.broker} account number below.</span></div>
        <div class="vb-step"><span class="vb-n num">3</span><span>We verify it against the ${B.name} partner list — VIP unlocks instantly.</span></div>
      </div>
      <label class="flabel" for="vb-acct">${B.broker} account number</label>
      <input class="finput num" id="vb-acct" inputmode="numeric" autocomplete="off" placeholder="e.g. 8 0 4 2 1 9 7">
      <button class="btn btn-gold btn-block" id="vb-verify" style="margin-top:14px">${ic("i-shield")} Verify &amp; unlock VIP</button>
      <button class="btn btn-ghost btn-block" id="vb-open" style="margin-top:10px">${ic("i-chev")} New to ${B.broker}? Open an account</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:12px;color:var(--faint)">Demo — verification is simulated. The live app checks your account against the ${B.name} partner (IB) list with ${B.broker}.</p>`);
    const btn = $("#vb-verify"), inp = $("#vb-acct");
    btn.onclick = () => {
      const v = (inp.value || "").replace(/\D/g, "");
      if (v.length < 6) { inp.focus(); toast(`Enter your ${B.broker} account number`, "i-shield"); return; }
      btn.disabled = true; btn.textContent = `Checking with ${B.broker}…`;
      setTimeout(() => {
        setSetting("tier", "vip");
        setSetting("vantageAcct", v);
        closeModal();
        setTimeout(() => {
          showPush(`Account verified ✓`, `${B.short} VIP unlocked — every signal, the live room & the library`);
          toast("Verified — VIP unlocked", "i-check");
          rerenderAfterTier();
        }, 380);
      }, 1400);
    };
    $("#vb-open").onclick = () => toast(`Opens ${B.founderFirst}'s ${B.broker} partner link`, "i-chev");
  }
  // locked signal card — the paywall mechanic across EVERY channel: live/running entries are locked for
  // free members and require Vantage verification; closed results stay public as the track-record teaser.
  function lockedSignalCard(i) {
    return `<div class="card idea sig-locked" data-lockvip>
      <div class="sl-blur" aria-hidden="true">
        <div class="idea-top"><div class="idea-pair">${ic("i-chart", "ic")}<span class="sym">${i.pair}</span><span class="idea-dir ${i.dir}">${i.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div><span class="pill pill-gold"><span class="dot-live"></span> LIVE</span></div>
        <div class="sig-chart"><canvas data-chart="signal" data-seed="${(i.id.charCodeAt(0) + (i.id.charCodeAt(1) || 0)) * 3}" data-e="${i.entry.replace(/,/g, "")}" data-sl="${i.sl.replace(/,/g, "")}" data-tp="${i.tp.replace(/,/g, "")}" data-dir="${i.dir}"></canvas></div>
        <div class="ticket"><div class="cell"><small>Entry</small><b class="num">4,0••–4,0••</b></div><div class="cell sl"><small>Stop</small><b class="num">4,0••</b></div><div class="cell tp"><small>Target</small><b class="num">4,0••</b></div></div>
      </div>
      <div class="sl-lock"><div class="sl-lock-ic">${ic("i-shield", "ic")}</div><b>Live signal · members only</b><small>Live entries are for verified members — ${IB ? `link your ${B.broker} account` : "unlock VIP"} to see the entry, stop &amp; targets.</small><div class="sl-meta"><span class="dot-live"></span>Posted 4m ago · <span data-vipviewers>87</span> watching now</div><span class="btn btn-gold btn-sm sl-cta">Unlock VIP</span></div>
    </div>`;
  }
  // ---- paper trading: one live mock position, anchored at the current price ----
  function openPaperTicket(i) {
    const slDist = Math.abs(parseFloat(i.entry.replace(/,/g, "")) - parseFloat(i.sl.replace(/,/g, ""))) || 10;
    const tpDist = Math.abs(parseFloat(i.tp.replace(/,/g, "")) - parseFloat(i.entry.replace(/,/g, ""))) || 25;
    const px = mbPrice != null ? mbPrice : parseFloat(i.entry.replace(/,/g, ""));
    openModal(`
      <h3 class="sheet-title">Paper trade</h3>
      <p class="sheet-sub">${i.pair} ${i.dir === "long" ? "▲ LONG" : "▼ SHORT"} · entry at the live price. One position at a time — protect the account first.</p>
      <div class="card card-pad" style="margin:10px 0 14px">
        <div class="kv"><span>Entry (live)</span><b class="num">${px.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></div>
        <div class="kv"><span>Stop distance</span><b class="num sl-tx">−${slDist.toFixed(1)} pts</b></div>
        <div class="kv"><span>Target distance</span><b class="num up">+${tpDist.toFixed(1)} pts</b></div>
      </div>
      <label class="flabel">Risk per trade</label>
      <div class="chips" style="margin-top:8px">${[0.5, 1, 2].map((r, n) => `<button class="chip${n === 1 ? " active" : ""}" data-risk="${r}" aria-pressed="${n === 1}">${r}%</button>`).join("")}</div>
      <button class="btn btn-gold btn-block" id="pp-start" style="margin-top:16px">${ic("i-shield")} Start paper trade</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:10px;color:var(--faint)">Simulated — no real money. Closes itself at the stop or target.</p>`);
    let risk = 1;
    [...document.querySelectorAll("[data-risk]")].forEach(c => c.onclick = () => {
      risk = +c.dataset.risk;
      [...document.querySelectorAll("[data-risk]")].forEach(x => { x.classList.toggle("active", x === c); x.setAttribute("aria-pressed", x === c); });
    });
    $("#pp-start").onclick = () => {
      pSet({ paperPos: { ideaId: i.id, pair: i.pair, dir: i.dir, entry: px, slDist, tpDist, riskPct: risk, at: Date.now() } });
      closeModal(); renderPaperPill(); haptic(14);
      toast("Paper trade open — tracking the live price", "i-shield");
    };
  }
  function renderPaperPill() {
    const host = document.querySelector(".app");
    let el = document.getElementById("paper-pill");
    const pos = pState().paperPos;
    if (!pos) { if (el) { el.classList.remove("show"); setTimeout(() => el.remove(), 400); } return; }
    if (!el) {
      el = document.createElement("button");
      el.id = "paper-pill"; el.className = "paper-pill";
      el.setAttribute("aria-label", "Open paper trade");
      host.appendChild(el);
      el.onclick = () => openIdea(pos.ideaId);
      requestAnimationFrame(() => el.classList.add("show"));
    }
    paintPaper();
  }
  function paintPaper() {
    const el = document.getElementById("paper-pill"), pos = pState().paperPos;
    if (!el || !pos || mbPrice == null) return;
    const pts = (mbPrice - pos.entry) * (pos.dir === "long" ? 1 : -1);
    const r = pts / pos.slDist;
    el.innerHTML = `${ic("i-shield", "ic")} <b>${pos.pair}</b> ${pos.dir === "long" ? "▲" : "▼"} paper · <b class="num ${r >= 0 ? "up" : "down"}">${r >= 0 ? "+" : ""}${r.toFixed(2)}R</b>`;
    if (pts <= -pos.slDist) closePaper("loss", -1);
    else if (pts >= pos.tpDist) closePaper("win", pos.tpDist / pos.slDist);
  }
  function closePaper(outcome, r) {
    const pos = pState().paperPos; if (!pos) return;
    pSet({ paperPos: null }); renderPaperPill();
    showPush(outcome === "win" ? "🎯 Paper trade closed · target hit" : "Paper trade closed · stopped",
      `${pos.pair} ${pos.dir} · ${r >= 0 ? "+" : ""}${r.toFixed(1)}R at ${pos.riskPct}% risk`);
    setTimeout(() => openLogTrade({
      pair: pos.pair, dir: pos.dir, session: "London", outcome,
      setup: "Paper trade", note: `Paper-traded the ${pos.ideaId.toUpperCase()} idea at ${pos.riskPct}% risk — closed ${r >= 0 ? "+" : ""}${r.toFixed(1)}R. Journaled like a real one.`,
    }), 900);
  }

  // founder-facing view — "does this make me money & is it less work?"
  function openFoundersDesk() {
    openModal(`
      <div class="fd-head"><span class="pill pill-gold">${ic("i-shield", "ic")} Founder view</span></div>
      <h3 class="sheet-title" style="margin:10px 0 2px">${B.founderLast}'s Desk</h3>
      <p class="sheet-sub">Your community, your revenue — ${IB ? `${B.broker} rebates and Inner Circle` : "run it"} in one place.</p>
      <div class="fd-stats">
        <div class="fd-stat"><b class="num">4,213</b><small>Members</small></div>
        <div class="fd-stat"><b class="num gold-text">312</b><small>${IB ? `VIP · ${B.broker}-verified` : "VIP members"}</small></div>
        <div class="fd-stat"><b class="num up">+87</b><small>New this week</small></div>
        <div class="fd-stat"><b class="num gold-text" id="fd-mrr-stat">£—</b><small>MRR · ${IB ? "Inner Circle" : "your price"}</small></div>
      </div>
      ${IB ? `<div class="fd-ib">${ic("i-shield", "ic")}<div><b>${B.broker} partner rebates</b><small>Every VIP member is verified under your IB — you earn on every lot they trade, on top of memberships. Unverified accounts never see a live entry.</small></div></div>` : ""}
      <div class="fd-price">
        <div class="fd-price-top"><span class="eyebrow" id="fd-price-label">${IB ? "Inner Circle price" : "VIP price"}</span><b class="fd-mrr" id="fd-mrr">£—</b></div>
        <input type="range" class="fd-slider" id="fd-slider" min="${IB ? 29 : 9}" max="${IB ? 299 : 99}" step="${IB ? 5 : 1}" aria-label="Set your ${IB ? "Inner Circle" : "VIP"} monthly price">
        <div class="fd-proj" id="fd-proj"></div>
      </div>
      <div class="fd-funnel">
        <div class="fd-fn"><span>Free</span><div class="fd-fbar"><i style="width:100%"></i></div><b class="num">3,853</b></div>
        <div class="fd-fn"><span>VIP</span><div class="fd-fbar"><i style="width:34%"></i></div><b class="num">312</b></div>
        <div class="fd-fn"><span>Inner Circle</span><div class="fd-fbar"><i style="width:12%"></i></div><b class="num">48</b></div>
      </div>
      <button class="btn btn-gold btn-block" id="fd-post">${ic("i-send")} Post a signal → notify 312 VIP</button>
      <button class="btn btn-ghost btn-block" id="fd-live" style="margin-top:10px">${ic("i-live")} Go live now</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:12px;color:var(--faint)">Signals still start in your Telegram — the app mirrors them and pushes automatically. You change nothing about how you work.</p>`);
    const VIPN = 312, INNERN = 48, slider = $("#fd-slider");
    const sMin = +slider.min, sMax = +slider.max;
    const setP = (p) => {
      const mrr = Math.round(IB ? INNERN * p : VIPN * p + INNERN * p * 2.5), mrrStr = "£" + mrr.toLocaleString();
      $("#fd-mrr").textContent = mrrStr;
      const stat = $("#fd-mrr-stat"); if (stat) stat.textContent = mrrStr;
      $("#fd-price-label").textContent = "£" + p + "/mo · " + (IB ? "Inner Circle" : "VIP");
      $("#fd-proj").innerHTML = IB
        ? `At <b>£${p}</b>/mo · ${INNERN} Inner Circle → <b>${mrrStr}</b>/mo · <b>£${(mrr * 12).toLocaleString()}</b>/yr — plus ${B.broker} rebates on ${VIPN} VIP`
        : `At <b>£${p}</b>/mo · ${VIPN} VIP + ${INNERN} Inner Circle → <b>${mrrStr}</b>/mo · <b>£${(mrr * 12).toLocaleString()}</b>/yr`;
      slider.style.background = `linear-gradient(90deg, var(--gold) ${(p - sMin) / (sMax - sMin) * 100}%, var(--surface-4) 0)`;
    };
    const p0 = Math.min(sMax, Math.max(sMin, +getSetting("vipPrice", IB ? 149 : 39))); slider.value = p0; setP(p0);
    slider.oninput = () => { const p = +slider.value; setP(p); setSetting("vipPrice", p); };
    const post = $("#fd-post"); if (post) post.onclick = () => { closeModal(); setTimeout(() => { showPush(`🟢 ${B.short} VIP · New ${B.market} idea`, "Entry 4,024–4,028 · SL 4,014 · targets inside"); toast("Pushed to VIP · 312 members notified", "i-check"); }, 400); };
    const live = $("#fd-live"); if (live) live.onclick = () => { closeModal(); go("live"); };
  }
  // iOS-style lock-screen push preview — a signals business IS push
  function showPush(title, body) {
    const host = document.querySelector(".app") || document.body;
    const el = document.createElement("div");
    el.className = "push-banner";
    el.innerHTML = `<div class="pb-ic">${ic("i-tg")}</div><div class="pb-body"><div class="pb-top"><b>${B.name}</b><span>now</span></div><div class="pb-title">${title}</div><div class="pb-text">${body}</div></div>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 420); }, 3600);
  }

  function openChat() {
    const hist = pState().chatHistory || [];
    const seed = D.chatScript.slice(0, 8);
    const renderMsg = m => `<div class="cmsg ${m.host ? "host" : ""}${m.me ? " me" : ""}">${m.me ? "" : av(m.initials, 30, "quiet")}<div class="ct"><b>${m.name}${m.host ? " · Host" : m.me ? " · You" : ""}</b>${m.text}</div></div>`;
    openModal(`<h3 class="sheet-title">Community chat</h3><p class="sheet-sub">The floor, all day.</p><div class="cchat" id="cchat-feed">${seed.map(renderMsg).join("")}${hist.map(renderMsg).join("")}</div><div class="cchat-in"><input class="finput" id="cchat-in" placeholder="Message ${B.floor}…" aria-label="Message ${B.floor}"><button class="btn btn-gold" id="cchat-send" aria-label="Send message" style="height:48px;flex:none;padding:0 15px">${ic("i-send")}</button></div>`);
    const feed = $("#cchat-feed"); feed.scrollTop = feed.scrollHeight;
    const append = (m) => { feed.insertAdjacentHTML("beforeend", renderMsg(m)); feed.scrollTop = feed.scrollHeight; };
    // demo replies — local echo only; a real build wires this to Arron's live community
    let sent = hist.length;
    const floorReplies = [
      { name: "Marcus", initials: "MW", text: "👊 welcome to the floor" },
      { name: B.founder, initials: B.founderInitials, host: true, text: "Good to have you. Risk first, profit second — always." },
      { name: "Sofia", initials: "SR", text: "we're all on 4,025 too 👀" },
      { name: "Aisha", initials: "AK", text: "🙌" },
      { name: B.founder, initials: B.founderInitials, host: true, text: "Drop your entry + stop when you take it — we review them live." },
      { name: "Daniel", initials: "DO", text: "same, waiting on the reclaim 🧘" },
    ];
    const send = () => {
      const inp = $("#cchat-in"), txt = (inp.value || "").trim(); if (!txt) return;
      const safe = txt.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const mine = { name: D.user.name, initials: D.user.initials, text: safe, me: true };
      append(mine);
      inp.value = "";
      pSet({ chatHistory: [...(pState().chatHistory || []), mine] });
      const reply = sent === 0
        ? { name: B.founder, initials: B.founderInitials, text: `Welcome to ${B.floor}, ${D.user.first} — good to have you here.`, host: true }
        : floorReplies[(sent - 1) % floorReplies.length];
      sent++;
      setTimeout(() => append(reply), 750 + Math.random() * 500);
    };
    const btn = $("#cchat-send"), inp = $("#cchat-in");
    if (btn) btn.onclick = send;
    if (inp) inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } };
  }

  // ============================ ACADEMY + TRACK RECORD ============================
  const LESSON_POOL = ["What moves gold", "Reading candles", "Support & resistance", "The London open", "Liquidity & sweeps", "The 3 entry models", "Risk per trade", "Stop placement", "Managing the trade", "Journaling & review", "Trading psychology", "Building your edge"];
  function academySection() {
    return `<div class="section-head"><span class="h2">Your path</span><span class="more" data-act="glossary">Glossary ›</span></div>
      <div class="paths">${D.paths.map(p => {
        const done = pathDone(p.id), pct = Math.round(done / p.lessons * 100);
        return `<button class="path" data-path="${p.id}">
          <div class="path-ring" style="background:conic-gradient(${p.color} ${pct * 3.6}deg, var(--surface-3) 0)"><span>${pct}%</span></div>
          <div class="path-body"><div class="path-top"><b>${p.name}</b><span class="path-lvl">${p.level}</span></div>
          <div class="path-desc">${p.desc}</div><div class="path-meta">${done}/${p.lessons} lessons${done === p.lessons ? " · complete ✓" : ""}</div></div>
          ${ic("i-chev", "ic")}</button>`;
      }).join("")}</div>`;
  }
  function openPath(id) {
    const p = D.paths.find(x => x.id === id) || D.paths[0];
    const doneN = pathDone(p.id);
    const rows = Array.from({ length: p.lessons }, (_, i) => { const done = i < doneN, t = LESSON_POOL[i % LESSON_POOL.length]; return `<div class="lesson ${done ? "done" : ""}"><span class="les-n">${done ? ic("i-check", "ic") : i + 1}</span><span class="les-t">${t}</span>${done ? "" : ic("i-play", "ic")}</div>`; }).join("");
    openModal(`<h3 class="sheet-title">${p.name}</h3><p class="sheet-sub">${p.level} · ${doneN}/${p.lessons} complete</p><div class="lessons">${rows}</div><button class="btn btn-gold btn-block" id="path-quiz" style="margin-top:16px">${ic("i-target")} ${p.name} quiz</button>`);
    const q = $("#path-quiz"); if (q) q.onclick = () => openQuiz(p.id);
  }
  function openQuiz(pathId) {
    const path = D.paths.find(p => p.id === pathId);
    const bank = (D.quizzes && (D.quizzes[pathId] || D.quizzes.found)) || { pass: 1, qs: [] };
    const title = path ? path.name : "Quick";
    let prepared = [], idx = 0, correct = 0, locked = false;
    function build() {
      prepared = bank.qs.map(q => {
        const opts = q.a.map((opt, j) => ({ opt, correct: j === q.c }));
        for (let i = opts.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [opts[i], opts[k]] = [opts[k], opts[i]]; }
        return { q: q.q, why: q.why, opts };
      });
      idx = 0; correct = 0; renderQ();
    }
    function renderQ() {
      const q = prepared[idx], n = prepared.length, last = idx + 1 >= n; locked = false;
      openModal(`
        <div class="quiz-head">
          <div class="quiz-bar"><i style="width:${Math.round(idx / n * 100)}%"></i></div>
          <div class="quiz-meta"><span>${title} quiz</span><span class="num">${idx + 1} / ${n}</span></div>
        </div>
        <b class="quiz-question">${q.q}</b>
        <div class="quiz-opts">${q.opts.map(o => `<button class="quiz-opt" data-correct="${o.correct ? 1 : 0}">${o.opt}</button>`).join("")}</div>
        <div class="quiz-why">${q.why}</div>
        <button class="btn btn-gold btn-block quiz-next" id="quiz-next" hidden>${last ? "See results" : "Next question"}</button>
        <div class="spacer"></div>`);
      [...document.querySelectorAll(".quiz-opt")].forEach(b => b.onclick = () => {
        if (locked) return; locked = true;
        const ok = b.dataset.correct === "1"; if (ok) correct++;
        haptic(ok ? 12 : 22);
        [...document.querySelectorAll(".quiz-opt")].forEach(o => { o.disabled = true; if (o.dataset.correct === "1") o.classList.add("right"); else if (o === b) o.classList.add("wrong"); });
        const w = document.querySelector(".quiz-why"); if (w) w.classList.add("show");
        const nx = $("#quiz-next"); if (nx) { nx.hidden = false; nx.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      });
      const nx = $("#quiz-next"); if (nx) nx.onclick = () => { if (idx + 1 < prepared.length) { idx++; renderQ(); } else finish(); };
    }
    function finish() {
      const total = prepared.length, passed = correct >= bank.pass, pct = Math.round(correct / total * 100);
      const ps = pState(), already = !!(ps.quizzesPassed && ps.quizzesPassed[pathId]);
      const best = Math.max((ps.quizBest && ps.quizBest[pathId]) || 0, correct);
      pSet({ quizBest: { ...(ps.quizBest || {}), [pathId]: best } });
      if (passed && !already) {
        addXp(60); pSet({ quizzesPassed: { ...(ps.quizzesPassed || {}), [pathId]: true } });
        if (path) { const cur = pathDone(pathId); if (cur < path.lessons) setPathDone(pathId, cur + 1); }
        toast("Quiz passed · +60 XP", "i-trophy");
      } else if (passed) { toast("Passed again — no extra XP", "i-check"); }
      else { haptic(30); }
      const sub = passed
        ? (already ? `Sharp as ever — your best is ${best}/${total}.` : `+60 XP earned and your path moved forward. Best: ${best}/${total}.`)
        : `You need ${bank.pass}/${total} to pass. Review the lessons and run it back — you've got this.`;
      openModal(`
        <div class="quiz-result ${passed ? "pass" : "fail"}">
          <div class="qr-ring" style="background:conic-gradient(${passed ? "var(--gold)" : "var(--down)"} ${pct}%, var(--line-2) 0)"><div class="qr-ring-in">${ic(passed ? "i-trophy" : "i-target", "ic")}</div></div>
          <div class="qr-score"><b class="gold-text">${correct}</b><span>/ ${total}</span></div>
          <div class="qr-verdict">${passed ? "Passed" : "Not quite"}</div>
          <p class="qr-sub">${sub}</p>
        </div>
        <button class="btn btn-gold btn-block" id="quiz-retry">${passed ? "Retake quiz" : "Try again"}</button>
        <button class="btn btn-ghost btn-block" id="quiz-back" style="margin-top:10px">Back to ${title}</button>
        <div class="spacer"></div>`);
      const r = $("#quiz-retry"); if (r) r.onclick = build;
      const bk = $("#quiz-back"); if (bk) bk.onclick = () => openPath(pathId);
    }
    build();
  }
  function trackRecordCard() {
    const closed = D.ideas.filter(i => i.status === "tp" || i.status === "sl");
    const wins = closed.filter(i => i.status === "tp");
    const wr = closed.length ? Math.round(wins.length / closed.length * 100) : 0;
    const totalR = wins.reduce((s, i) => s + (parseFloat(i.rr) || 2), 0) - (closed.length - wins.length);
    return `<div class="card track">
      <div class="sch-head"><span class="eyebrow">${ic("i-shield", "ic")} Verified track record</span><span class="sch-count">last 30 days</span></div>
      <div class="track-stats">
        <div><b class="num up">${wr}%</b><small>Win rate</small></div>
        <div><b class="num">${D.ideas.length}</b><small>Signals</small></div>
        <div><b class="num ${totalR >= 0 ? "up" : "down"}">${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R</b><small>Net result</small></div>
      </div>
      <p class="track-note">${ic("i-check", "ic")} Every call logged — wins and losses, independently tracked.</p></div>`;
  }

  function wireCommon() {
    [...document.querySelectorAll("[data-tab]")].forEach(n => n.addEventListener("click", e => { e.stopPropagation(); if (n.dataset.seg) circleTab = n.dataset.seg; go(n.dataset.tab); }));
    [...document.querySelectorAll("[data-path]")].forEach(n => n.onclick = () => openPath(n.dataset.path));
    [...document.querySelectorAll("[data-video]")].forEach(n => n.addEventListener("click", () => openPlayer(n.dataset.video)));
    [...document.querySelectorAll("[data-idea]")].forEach(n => n.addEventListener("click", () => openIdea(n.dataset.idea)));
    [...document.querySelectorAll("[data-act=notif]")].forEach(n => n.onclick = openNotifications);
    [...document.querySelectorAll("[data-act=theme-top]")].forEach(n => n.onclick = () => themeFade(t => { n.innerHTML = ic(t === "light" ? "i-moon" : "i-sun"); toast(t === "light" ? "Light mode" : "Dark mode", "i-moon"); }));
    [...document.querySelectorAll("[data-act=ideas]")].forEach(n => n.onclick = openIdeas);
    [...document.querySelectorAll("[data-act=journal]")].forEach(n => n.onclick = () => { circleTab = "journal"; go("community"); });
    [...document.querySelectorAll("[data-act=profile]")].forEach(n => n.onclick = () => go("profile"));
    [...document.querySelectorAll("[data-act=search]")].forEach(n => n.onclick = openLearnSearch);
    [...document.querySelectorAll("[data-act=calc]")].forEach(n => n.onclick = openCalc);
    [...document.querySelectorAll("[data-act=calendar]")].forEach(n => n.onclick = openCalendar);
    [...document.querySelectorAll("[data-act=alerts]")].forEach(n => n.onclick = openAlerts);
    [...document.querySelectorAll("[data-act=watchlist]")].forEach(n => n.onclick = openWatchlist);
    [...document.querySelectorAll("[data-act=invite]")].forEach(n => n.onclick = openInvite);
    [...document.querySelectorAll("[data-act=glossary]")].forEach(n => n.onclick = openGlossary);
    [...document.querySelectorAll("[data-act=settings]")].forEach(n => n.onclick = openSettings);
    [...document.querySelectorAll("[data-act=announce]")].forEach(n => n.onclick = openAnnouncements);
    [...document.querySelectorAll("[data-act=challenge]")].forEach(n => n.onclick = openChallenge);
    [...document.querySelectorAll("[data-act=members]")].forEach(n => n.onclick = openMembers);
    [...document.querySelectorAll("[data-act=membership]")].forEach(n => n.onclick = openMembership);
    [...document.querySelectorAll("[data-act=copier]")].forEach(n => n.onclick = openCopier);
    [...document.querySelectorAll("[data-act=verifyib]")].forEach(n => n.onclick = openVerifyBroker);
    [...document.querySelectorAll("[data-act=office]")].forEach(n => n.onclick = () => go("office"));
    [...document.querySelectorAll("[data-act=weeklyreview]")].forEach(n => n.onclick = openWeeklyReview);
    [...document.querySelectorAll("[data-act=foundersdesk]")].forEach(n => n.onclick = openFoundersDesk);
    [...document.querySelectorAll("[data-act=story]")].forEach(n => n.onclick = openStories);
    [...document.querySelectorAll("[data-act=chat]")].forEach(n => n.onclick = () => { circleTab = "community"; go("community"); setTimeout(openChat, 60); });
    wireTook();
  }

  // ---------- tab bar ----------
  const TABS = [
    { id: "home", label: "Home", icon: "i-home" },
    { id: "signals", label: "Signals", icon: "i-chart" },
    { id: "live", label: "Live", icon: "i-live", live: true },
    { id: "learn", label: "Learn", icon: "i-learn" },
    { id: "community", label: "Journal", icon: "i-book" },
    { id: "hubs", label: "Hubs", icon: "i-hub" },
  ];
  function renderTabbar() {
    $("#tabbar").innerHTML = TABS.map(t =>
      `<button class="tab ${t.live ? "live-tab" : ""} ${t.id===activeTab?"active":""}" data-tab="${t.id}" aria-current="${t.id===activeTab?"page":"false"}">
        <span class="tab-cluster">${ic(t.icon)}${t.live ? '<span class="dot"></span>' : ""}</span>${t.label}</button>`).join("");
    [...document.querySelectorAll("#tabbar .tab")].forEach(b => b.onclick = () => go(b.dataset.tab));
  }

  // ---------- login + boot ----------
  function showLogin() {
    const el = document.createElement("div");
    el.className = "login"; el.id = "login";
    el.innerHTML = `
      <canvas class="market-bg" data-chart="ambient" data-seed="12"></canvas>
      <div class="login-top">
        <img class="login-wordmark" src="${B.logo}" alt="${B.name}">
        <h1 class="h1">${B.tagline}</h1>
        <p class="sub" style="margin-top:10px;max-width:280px">${B.blurb} Welcome to ${B.name}.</p>
      </div>
      <div class="login-bottom">
        <button class="btn btn-gold btn-block" id="enter">Continue with phone</button>
        <div class="login-or">or</div>
        <div class="social-row">
          <button class="social-btn" data-soc aria-label="Continue with Apple">${appleSvg()}</button>
          <button class="social-btn" data-soc aria-label="Continue with Google">${googleSvg()}</button>
          <button class="social-btn" data-soc aria-label="Continue with Telegram">${tgSvg()}</button>
        </div>
        <p class="login-foot">Free for members — funded by our partners.<br>By continuing you agree to the Terms & Privacy Policy.</p>
      </div>`;
    $("#app").appendChild(el);
    requestAnimationFrame(() => Charts.initIn(el));
    const enterApp = () => {
      el.style.transition = "opacity .4s, transform .4s"; el.style.opacity = "0"; el.style.transform = "translateY(-10px)";
      setTimeout(() => {
        el.remove();
        if (pState().onboardingDone) { setSignedIn("phone"); renderTabbar(); go("home"); setTimeout(() => toast(`Welcome back, ${D.user.first} 👋`, "i-check"), 450); }
        else showOnboarding();
      }, 420);
    };
    $("#enter").onclick = enterApp;
    const provs = ["Apple", "Google", "Telegram"]; // believable demo sign-in: connect → land in the app, stay signed in
    [...el.querySelectorAll("[data-soc]")].forEach((b, i) => b.onclick = () => {
      const prov = provs[i] || "account";
      [...el.querySelectorAll("[data-soc]")].forEach(x => x.disabled = true);
      b.classList.add("loading");
      toast(`Connecting to ${prov}…`, "i-check");
      setSignedIn(prov);
      setTimeout(() => {
        el.style.transition = "opacity .4s, transform .4s"; el.style.opacity = "0"; el.style.transform = "translateY(-10px)";
        setTimeout(() => {
          el.remove();
          if (pState().onboardingDone) { renderTabbar(); go("home"); setTimeout(() => toast(`Signed in with ${prov}`, "i-check"), 450); }
          else showOnboarding();
        }, 420);
      }, 750);
    });
  }

  // ---------- onboarding (first-run after login) ----------
  function showOnboarding() {
    let step = 0, level = "Developing";
    const el = document.createElement("div"); el.className = "onboard"; el.id = "onboard";
    $("#app").appendChild(el);
    const dots = () => `<div class="ob-dots">${[0, 1, 2, 3].map(i => `<span class="ob-dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}"></span>`).join("")}</div>`;
    function render() {
      let body;
      if (step === 0) body = `
        <div class="ob-center">
          <img class="ob-wordmark" src="${B.logo}" alt="${B.name}">
          <h1 class="h1" style="margin-top:22px">Welcome to<br>the floor.</h1>
          <p class="sub" style="margin-top:10px;max-width:285px">You're one of ${(4200).toLocaleString()}+ gold traders now. Let's get you set up — takes 30 seconds.</p>
        </div>
        <button class="btn btn-gold btn-block" data-next>Get started</button>`;
      else if (step === 1) body = `
        <div class="ob-top"><span class="eyebrow">Step 2 of 4</span><h2 class="h2" style="margin:8px 0 4px">What should we call you?</h2><p class="sub">So the floor knows who's in the room.</p></div>
        <label class="flabel">Display name</label><input class="finput" id="ob-name" value="${D.user.first}">
        <label class="flabel">Where are you based?</label>
        <div class="fselect-wrap">
          <select class="fselect" id="ob-country">${(D.countries || []).map(c => `<option value="${c}"${c === "United Kingdom" ? " selected" : ""}>${c}</option>`).join("")}</select>
        </div>
        <button class="btn btn-gold btn-block" data-next style="margin-top:auto">Continue</button>`;
      else if (step === 2) body = `
        <div class="ob-top"><span class="eyebrow">Step 3 of 4</span><h2 class="h2" style="margin:8px 0 4px">Where are you at?</h2><p class="sub">We'll point you to the right place to start.</p></div>
        <div class="ob-levels" id="ob-lv">
          ${[["Beginner", "New to gold trading"], ["Developing", "Some screen time, building consistency"], ["Consistent", "Profitable — here to sharpen"]].map(([t, d]) => `<button class="ob-level ${t === level ? "on" : ""}" data-lv="${t}"><b>${t}</b><span>${d}</span></button>`).join("")}
        </div>
        <button class="btn btn-gold btn-block" data-next style="margin-top:auto">Continue</button>`;
      else { const onc = nextCall() || { session: "Live trading", host: "the team", day: "Mon", at: "" }; body = `
        <div class="ob-top"><span class="eyebrow">Step 4 of 4</span><h2 class="h2" style="margin:8px 0 4px">Your first live call</h2><p class="sub">This is where it clicks — trade the session live, with the room.</p></div>
        <div class="card ob-call">
          <div class="ob-call-row"><span class="pill pill-live"><span class="dot-live"></span> ${DAY_FULL[onc.day] || "Soon"}</span><span class="num" style="color:var(--gold);font-weight:700">${onc.at || ""}</span></div>
          <h3 style="font-family:var(--display);font-weight:700;font-size:17px;margin:11px 0 3px">${onc.session}</h3>
          <div class="sub" style="font-size:12.5px">Hosted by ${onc.host} <span class="vchk">✓</span></div>
          <button class="btn btn-ghost btn-block" data-cal style="margin-top:14px">${ic("i-cal")} Add to calendar</button>
        </div>
        <button class="btn btn-gold btn-block" data-next style="margin-top:auto">Enter ${B.name}</button>`; }
      el.innerHTML = `${dots()}<div class="ob-body">${body}</div>`;
      if (!reduceMotion()) { el.classList.remove("ob-enter"); void el.offsetWidth; el.classList.add("ob-enter"); }
      const next = el.querySelector("[data-next]"); if (next) next.onclick = () => {
        if (step === 1) {
          const nameEl = el.querySelector("#ob-name"), countryEl = el.querySelector("#ob-country");
          if (nameEl) {
            const first = nameEl.value.trim();
            if (first) {
              D.user.first = first;
              D.user.name = first;
              const parts = first.split(/\s+/).filter(Boolean);
              D.user.initials = parts.map(w => w[0]).join("").slice(0, 2).toUpperCase() || D.user.initials;
            }
          }
          if (countryEl) D.user.country = countryEl.value;
        }
        step++; if (step > 3) finish(); else render();
      };
      [...el.querySelectorAll("[data-lv]")].forEach(b => b.onclick = () => { level = b.dataset.lv; [...el.querySelectorAll("#ob-lv .ob-level")].forEach(x => x.classList.toggle("on", x === b)); });
      const cal = el.querySelector("[data-cal]"); if (cal) cal.onclick = () => { downloadCallIcs(nextCall()); cal.innerHTML = ic("i-cal") + " Added to calendar ✓"; };
    }
    function finish() {
      pSet({ name: D.user.name, first: D.user.first, initials: D.user.initials, country: D.user.country, onboardingDone: true, traderLevel: level });
      setSignedIn("phone");
      el.style.transition = "opacity .4s"; el.style.opacity = "0";
      setTimeout(() => el.remove(), 420);
      renderTabbar(); go("home");
      setTimeout(() => toast(`Welcome, ${D.user.first} 👋`, "i-check"), 500);
    }
    render();
  }

  // scale the desktop phone-frame down to fit short windows (so the bottom — onboarding
  // button, tab bar — is never clipped). Disabled on real phones (fullscreen, see CSS).
  function fitDevice() {
    const s = Math.min(1, (window.innerHeight - 56) / 868, (window.innerWidth - 28) / 414);
    document.documentElement.style.setProperty("--fit", (s > 0 ? s : 1).toFixed(3));
  }
  window.addEventListener("resize", fitDevice);
  function boot() {
    applyTheme(getSetting("theme", "dark"));
    try { history.replaceState({ t: "home" }, ""); } catch (e) {}
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#modal").classList.contains("open")) closeModal(); });
    document.addEventListener("click", (e) => { const t = e.target.closest && e.target.closest(".gterm"); if (t) { e.stopPropagation(); showGloss(t.dataset.gterm); } }, true);
    // sticky liquid-glass top bar: condense onto glass once content scrolls beneath it
    const sc = $("#screen-scroll");
    if (sc) sc.addEventListener("scroll", () => { const tb = $("#screen .app-topbar"); if (tb) tb.classList.toggle("scrolled", sc.scrollTop > 8); }, { passive: true });
    fitDevice();
    hydrateProfile(); // journal + streak + points from device storage (seeds the demo journal first run)
    renderPaperPill(); // restore an open paper position across reloads
    // hydrate the economic calendar from cache (instant), then refresh from the live proxy
    try { const c = JSON.parse(localStorage.getItem("bt_cal") || "null"); if (c && c.d && c.d.length && (Date.now() - c.t) < 12 * 36e5) liveCal = c.d; } catch (e) {}
    loadCalendar();
    try { const f = JSON.parse(localStorage.getItem("bt_fx") || "null"); if (f && f.r && (Date.now() - f.t) < 12 * 36e5) fxUsd = f.r; } catch (e) {}
    loadFx();
    // Demo phase: no SW caching — always serve fresh. Nuke any stale SW + caches from earlier loads.
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
    Charts.initIn(document); // splash ambient
    const jump = new URLSearchParams(location.search).get("screen");
    if (jump && SCREENS[jump]) { // deep-link straight into the app (demo + QA)
      const sp = $("#screen-splash"); if (sp) sp.remove();
      renderTabbar(); go(jump); return;
    }
    setTimeout(() => {
      const sp = $("#screen-splash");
      sp.style.transition = "opacity .5s"; sp.style.opacity = "0";
      setTimeout(() => { sp.remove(); showLogin(); }, 520);
    }, 1700);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  // social svgs
  function appleSvg(){return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.04 1.4-.65 2.6-.65 1.2 0 1.5.65 2.6.63 1.1-.02 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.02-.01-2.1-.8-2.1-3.1zM14.5 6.3c.5-.65.9-1.55.8-2.45-.8.03-1.7.53-2.3 1.18-.5.57-.95 1.5-.83 2.37.9.07 1.8-.45 2.33-1.1z"/></svg>';}
  // monochrome brand marks — flagship auth screens don't run full-saturation logos on dark glass
  function googleSvg(){return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path d="M12 22c2.7 0 5-1 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6C4.7 19.9 8.1 22 12 22z" opacity=".85"/><path d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H3.1C2.4 9 2 10.5 2 12s.4 3 1.1 4.4l3.3-2.6z" opacity=".7"/><path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.2 14.7 2 12 2 8.1 2 4.7 4.1 3.1 7.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1z" opacity=".92"/></svg>';}
  function tgSvg(){return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.2 13 1.4 11.5c-1-.3-1-1 .2-1.5l19-7.3c.9-.3 1.6.2 1.3 1.6z"/></svg>';}

})();
