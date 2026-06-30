/* Blakey Trades — app shell, router, screens, interactions */
(function () {
  const D = window.DATA;
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
    t.classList.add("show"); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- router ----------
  let cleanups = [];
  let activeTab = "home";
  function clean() { cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; }
  function setScreen(html) {
    clean();
    const s = $("#screen");
    s.innerHTML = html; s.classList.remove("screen-enter"); void s.offsetWidth; s.classList.add("screen-enter");
    $("#screen-scroll").scrollTop = 0;
    requestAnimationFrame(() => Charts.initIn(s));
  }

  const SCREENS = {};
  function go(tab) {
    const m = $("#modal"); if (m && m.classList.contains("open")) closeModal(); // never trap the user in a sheet/player
    activeTab = tab; livePreview = false; // tab nav exits any live-room preview
    SCREENS[tab]();
    [...document.querySelectorAll(".tab")].forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  }

  // ---------- header ----------
  function topbar(right) {
    return `<div class="app-topbar"><img class="brand-word" src="assets/blakey-logo.png" alt="Blakey Trades">${right || ""}</div>`;
  }
  function header(title, sub) {
    return topbar(`<button class="icon-btn" data-act="notif">${ic("i-bell")}<span class="badge"></span></button>`) +
      `<div class="app-head">
      <div class="who" data-act="profile" style="cursor:pointer">
        ${av(D.user.initials, 44)}
        <div><small>${sub || greeting()}</small><b>${title || D.user.name}</b></div>
        <span class="who-go">Profile ${ic("i-chev","ic")}</span>
      </div>
    </div>`;
  }
  function greeting() { const h = new Date().getHours(); return (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + ","; }

  // ---------- live-call schedule (real weekly timetable) ----------
  const DAY_IDX = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const DAY_FULL = { Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" };
  function nextCall() {
    const now = new Date();
    let best = null, bestMs = Infinity;
    for (const c of (D.schedule || [])) {
      const [h, m] = c.time.split(":").map(Number);
      const dd = (DAY_IDX[c.day] - now.getDay() + 7) % 7;
      const dt = new Date(now); dt.setDate(now.getDate() + dd); dt.setHours(h, m, 0, 0);
      if (dt.getTime() <= now.getTime()) dt.setDate(dt.getDate() + 7);
      const diff = dt.getTime() - now.getTime();
      if (diff < bestMs) { bestMs = diff; best = c; }
    }
    return best ? { ...best, startsIn: Math.floor(bestMs / 1000) } : null;
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
    const renderPrice = () => {
      if (mbPrice == null) return;
      const txt = mbPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      allOf(".mb-price").forEach(e => e.textContent = txt);
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
    paintSession(); if (mbPrice != null) renderPrice(); // instant paint when returning to a screen
    pull();
    const t1 = setInterval(pull, 12000), t2 = setInterval(paintSession, 20000), t0 = setTimeout(startMock, 2500);
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
      : `Gold ${pct >= 0 ? "firm" : "soft"} at $${price} — ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(2)}% into ${day}'s session`;
    const ev = nextCalEvent();
    return {
      bias,
      headline,
      points: [
        { ic: "i-dollar", label: "Spot gold", text: `$${price} · ${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct || 0).toFixed(2)}% today` },
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
  }
  function callsJoined() { const s = pState(); return s.calls != null ? s.calls : D.user.sessions; }
  function bumpCalls() { const s = pState(), today = new Date().toLocaleDateString("en-CA"); if (s.lastCallDay === today) return false; s.calls = (s.calls != null ? s.calls : D.user.sessions) + 1; s.lastCallDay = today; pSave(s); return true; }
  // journalStats() is the canonical one defined below — extended with winRate + avgRR for these helpers
  function profStreak() { const s = pState(); return s.streak != null ? s.streak : D.user.streak; }
  function lbPoints() { const s = pState(); return s.lbPoints != null ? s.lbPoints : 3480; }
  function recordLog() { // a logged trade earns points + extends the streak once per day, and persists the journal
    const s = pState(), today = new Date().toLocaleDateString("en-CA");
    if (s.lastLogDay && s.lastLogDay !== today) s.streak = (s.streak != null ? s.streak : D.user.streak) + 1;
    else if (s.streak == null) s.streak = D.user.streak;
    s.lastLogDay = today;
    s.lbPoints = (s.lbPoints != null ? s.lbPoints : 3480) + 50;
    s.journal = D.journal;
    pSave(s);
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
      { ic: "chart", value: st.avgRR.toFixed(1) + "R", label: "Avg R:R" },
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

  // ============================ HOME ============================
  SCREENS.home = function () {
    const v = D.live;
    const nc = nextCall() || { session: v.title, host: v.host, day: "Mon", at: "", startsIn: v.startsIn };
    const ideas = D.ideas[0];
    const watching = D.videos.filter(x => x.progress > 0);
    setScreen(`
      ${header()}
      ${marketBar()}
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
            <button class="btn btn-ghost btn-sm" data-act="remind" style="height:52px;padding:0 16px">Remind me</button>
          </div>
        </div>
      </div>

      <div class="stat-row reveal" style="animation-delay:.05s">
        ${liveHomeStats().map(s => `<div class="stat">${ic("i-" + s.ic, "ic")}<b class="num">${s.value}</b><small>${s.label}</small></div>`).join("")}
      </div>

      ${toolsRow()}

      <div class="section-head"><span class="h2">Today's idea</span><span class="more" data-act="ideas">All signals ›</span></div>
      ${ideaCard(ideas)}

      <div class="section-head"><span class="h2">Trader of the week</span><span class="more" data-tab="community">View ›</span></div>
      ${totwMini()}

      <div class="section-head"><span class="h2">Continue watching</span><span class="more" data-tab="learn">Library ›</span></div>
      <div class="rail rail-pad">
        ${watching.map(vCard).join("")}
      </div>

      <div class="section-head"><span class="h2">Next meetups</span><span class="more" data-tab="hubs">Hubs ›</span></div>
      ${D.hubs.slice(0, 1).map(hubMini).join("")}
      <div class="spacer"></div>
    `);
    // countdown to the next scheduled call
    let left = nc.startsIn;
    const cd = $("#cd");
    const paint = () => {
      const d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
      const cells = d > 0 ? [["Days", d], ["Hrs", h], ["Min", m]] : [["Hrs", h], ["Min", m], ["Sec", s]];
      cd.innerHTML = cells.map(([l, n]) =>
        `<div class="cd-cell"><b class="num">${String(n).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
    };
    paint();
    const t = setInterval(() => { left = left > 0 ? left - 1 : 0; paint(); }, 1000);
    cleanups.push(() => clearInterval(t));
    wireCommon();
    $("[data-act=joinlive]").onclick = () => { if (bumpCalls()) { addXp(50); toast("Joined the call · +50 XP", "i-live"); } go("live"); };
    $("[data-act=remind]").onclick = (e) => { e.currentTarget.textContent = "Reminder set ✓"; toast("Reminder set — we'll ping you at the open", "i-check"); };
    mountMarketBar();
  };

  // user marks whether they took a signal (👍/👎) — persists across re-renders
  const tookState = {};
  function tookBase(id) { let n = 0; for (const c of id) n += c.charCodeAt(0); return 24 + (n % 60); }
  function tookRow(i) {
    const s = tookState[i.id];
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
      tookState[id] = tookState[id] === choice ? null : choice; // tap again to clear
      const row = b.closest(".took");
      if (row) {
        const up = row.querySelector(".took-btn.up"), down = row.querySelector(".took-btn.down");
        up.classList.toggle("on", tookState[id] === "up");
        down.classList.toggle("on", tookState[id] === "down");
        const n = up.querySelector(".num"); if (n) n.textContent = tookBase(id) + (tookState[id] === "up" ? 1 : 0);
      }
      if (tookState[id] === "up") openLogTrade(signalPrefill(D.ideas.find(x => x.id === id))); // took it → drop it into the journal, pre-filled
      else toast(tookState[id] === "down" ? "Marked as not taken" : "Cleared", null);
    });
  }
  function signalPrefill(i) {
    if (!i) return {};
    const sess = /york/i.test(i.session) ? "New York" : /asia/i.test(i.session) ? "Asia" : "London";
    const oc = i.status === "tp" ? "win" : i.status === "sl" ? "loss" : i.status === "be" ? "be" : "win";
    const r = i.status === "sl" ? 1 : (parseFloat(i.rr) || 2);
    const ch = (D.channels.find(c => c.id === i.channel) || {}).name || "Signal";
    return { pair: i.pair, dir: i.dir, session: sess, outcome: oc, r, setup: `${ch} signal`, note: i.note || "" };
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
        ${st}
      </div>
      <div class="sig-chart"><canvas data-chart="signal" data-seed="${(i.id.charCodeAt(0) + (i.id.charCodeAt(1) || 0)) * 3}" data-e="${i.entry.replace(/,/g, "")}" data-sl="${i.sl.replace(/,/g, "")}" data-tp="${i.tp.replace(/,/g, "")}" data-dir="${i.dir}"></canvas>
        <span class="sig-src ${i.channel === "iq" ? "bot" : ""}">${i.channel === "iq" ? "🤖 Signal IQ" : 'Arron Blakey <span class="vchk">✓</span>'}</span></div>
      <div class="ticket">
        <div class="cell"><small>Entry</small><b class="num">${i.entry}</b></div>
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
    return `<div class="card totw reveal" data-tab="community">
      <div class="trophy">${ic("i-trophy")}</div>
      ${av(w.initials, 44)}
      <div class="meta"><small class="eyebrow muted">This week</small><b>${w.name}</b>
        <div class="num up" style="font-size:13px;margin-top:2px">${w.ret} · ${w.winRate} win rate</div></div>
      <div style="margin-left:auto">${ic("i-chev","ic")}</div>
    </div>`;
  }

  function hubMini(h) {
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
    return `<div class="vcard" data-video="${v.id}">
      <div class="thumb"><canvas data-chart="thumb" data-seed="${v.seed}"></canvas>
        <div class="play-mini"><span>${ic("i-play")}</span></div>
        <span class="dur num">${v.dur}</span>
        ${v.progress ? `<div class="prog"><i style="width:${Math.round(v.progress*100)}%"></i></div>` : ""}
      </div>
      <h4>${v.title}</h4>
      <div class="vmeta"><span>${v.cat}</span>·<span>${v.views} views</span></div>
    </div>`;
  }

  // ============================ LIVE ============================
  let livePreview = false; // demo: lets you peek into the live room when no call is on
  function isLiveNow() { // true only inside a scheduled call window (device clock, UK times)
    const now = new Date();
    return (D.schedule || []).some(c => {
      if (DAY_IDX[c.day] !== now.getDay()) return false;
      const [h, m] = c.time.split(":").map(Number);
      const start = new Date(now); start.setHours(h, m, 0, 0);
      const mins = (now - start) / 60000;
      return mins >= -5 && mins <= 75;
    });
  }
  function liveStageHtml(v) {
    return `<div id="live-stage">
        <canvas id="live-canvas" data-chart="live"></canvas>
        <div class="live-grad"></div>
        <div class="live-hud">
          <span class="pill pill-live"><span class="dot-live"></span> LIVE</span>
          <span class="live-watchers">${ic("i-comm","ic")} <span id="watchers">${v.watchers.toLocaleString()}</span> watching</span>
        </div>
        ${livePreview ? `<button class="live-exit" id="live-exit">Preview · exit ✕</button>` : ""}
        <div class="live-levels">
          <span class="lvl tp">TP ${v.tp}</span>
          <span class="lvl e">Entry ${v.entry}</span>
          <span class="lvl sl">SL ${v.sl}</span>
        </div>
        <div class="live-host">${av(v.hostInitials, 36)}<div><b>${v.host} <span class="vchk">✓</span></b><small>${v.hostRole} · Hosting</small></div></div>
        <div class="live-chat"><div class="live-chat-inner" id="chat"></div></div>
        <div class="live-compose">
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
            <button class="btn btn-gold" data-act="remind-call">${ic("i-bell")} Remind me</button>
            <button class="btn btn-ghost" id="live-preview">${ic("i-play")} Preview the room</button>
          </div>
        </div>
      </div>`;
  }
  SCREENS.live = function () {
    const v = D.live, live = isLiveNow() || livePreview, nc = nextCall();
    setScreen(`
      ${live ? liveStageHtml(v) : liveLobbyHtml(nc)}
      <div style="padding-top:16px">
        ${live ? `<span class="eyebrow">${v.session} open · live now</span>
        <h2 class="h2" style="margin:8px 0 4px">${v.title}</h2>
        <p class="sub">Arron is mapping the London open in real time — liquidity, the entry model, and live risk management on ${v.pair}.</p>
        <div class="section-head"><span class="h3">Covering today</span></div>
        ${["Where London liquidity is resting","The A+ entry model (reclaim & hold)","Live risk: where the stop really goes","Q&A from the floor"].map(x=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)">${ic("i-check","ic")}<span style="font-size:13.5px">${x}</span></div>`).join("")}` : `<p class="sub" style="margin-top:2px">The room opens automatically when the call starts — free for members. Set a reminder so you don't miss the open.</p>`}
        ${scheduleSection()}
        <div class="section-head"><span class="h3">Recent replays</span><span class="more" data-tab="learn">All ›</span></div>
        <div class="rail rail-pad">${D.videos.filter(x=>x.cat==="Session Replays"||x.host==="Arron Blakey").slice(0,4).map(vCard).join("")}</div>
        <p class="sub" style="font-size:11px;text-align:center;margin-top:18px;color:var(--faint)">Educational content only. Not financial advice.</p>
        <div class="spacer"></div>
      </div>
    `);
    if (!live) {
      const cd = $("#lobby-cd"); let left = nc ? nc.startsIn : 0;
      const paint = () => { if (!cd) return; const d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600), m = Math.floor(left % 3600 / 60), s = left % 60; cd.innerHTML = (d > 0 ? `<span class="cd-cell"><b>${d}</b><small>days</small></span>` : "") + `<span class="cd-cell"><b>${String(h).padStart(2,"0")}</b><small>hrs</small></span><span class="cd-cell"><b>${String(m).padStart(2,"0")}</b><small>min</small></span><span class="cd-cell"><b>${String(s).padStart(2,"0")}</b><small>sec</small></span>`; };
      paint();
      const lt = setInterval(() => { left = left > 0 ? left - 1 : 0; paint(); if (left <= 0) go("live"); }, 1000);
      cleanups.push(() => clearInterval(lt));
      const pv = $("#live-preview"); if (pv) pv.onclick = () => { livePreview = true; SCREENS.live(); };
      const rm = $("[data-act=remind-call]"); if (rm) rm.onclick = () => toast("We'll ping you 10 min before the call", "i-bell");
      wireCommon();
      return;
    }
    // watchers ticker
    let w = v.watchers;
    const wt = setInterval(() => { w += Math.floor(Math.random() * 9) - 3; $("#watchers").textContent = w.toLocaleString(); }, 2600);
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
      while (chat.children.length > 7) chat.removeChild(chat.firstChild);
    }
    push(); push(); push();
    const ct = setInterval(push, 2400);
    // auto reactions
    const rt = setInterval(() => { if (Math.random() > .4) flyReaction(Math.random() > .5 ? "🔥" : "💎"); }, 1500);
    cleanups.push(() => { clearInterval(wt); clearInterval(ct); clearInterval(rt); });
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
      ${topbar(`<button class="icon-btn" data-act="search">${ic("i-search")}</button>`)}
      <div class="app-head"><div class="who"><div><small>${D.videos.length*7+120}+ lessons</small><b>Education</b></div></div></div>
      <div class="learn-hero reveal" data-video="v1">
        <canvas class="thumb" data-chart="thumb" data-seed="11"></canvas>
        <div class="g"></div>
        <div class="play">${ic("i-play")}</div>
        <div class="body"><span class="eyebrow">Featured · ${f.cat}</span>
          <h3 class="h2" style="margin:7px 0 5px">${f.title}</h3>
          <div class="vmeta sub" style="font-size:12px">${f.dur} · ${f.views} views · ${f.date}</div></div>
      </div>
      ${academySection()}
      <div class="section-head"><span class="h2">Library</span></div>
      <div class="chips" id="chips">
        ${D.categories.map(c => `<button class="chip${c===learnCat?" active":""}" data-cat="${c}">${c}</button>`).join("")}
      </div>
      <div id="learn-list"></div>
      <div class="spacer"></div>
    `);
    renderLearnList();
    [...document.querySelectorAll("#chips .chip")].forEach(c => c.onclick = () => { learnCat = c.dataset.cat; [...document.querySelectorAll("#chips .chip")].forEach(x => x.classList.toggle("active", x === c)); renderLearnList(); });
    wireCommon();
  };
  function renderLearnList() {
    const list = $("#learn-list"); if (!list) return;
    const items = learnCat === "For you" ? D.videos : D.videos.filter(v => v.cat === learnCat);
    const watching = items.filter(v => v.progress > 0);
    list.innerHTML =
      (watching.length ? `<div class="section-head"><span class="h3">Continue watching</span></div><div class="rail rail-pad">${watching.map(vCard).join("")}</div>` : "") +
      `<div class="section-head"><span class="h3">${learnCat === "For you" ? "All lessons" : learnCat}</span><span class="more">${items.length} videos</span></div>` +
      items.map(vRow).join("");
    requestAnimationFrame(() => Charts.initIn(list));
    [...list.querySelectorAll("[data-video]")].forEach(n => n.onclick = () => openPlayer(n.dataset.video));
  }
  function vRow(v) {
    return `<div class="vrow" data-video="${v.id}">
      <div class="thumb"><canvas data-chart="thumb" data-seed="${v.seed}"></canvas>
        ${v.progress?`<div class="prog" style="position:absolute;left:0;bottom:0;height:3px;width:100%;background:rgba(255,255,255,.15);z-index:2"><i style="display:block;height:100%;width:${Math.round(v.progress*100)}%;background:var(--gold)"></i></div>`:""}</div>
      <div class="info"><h4>${v.title}</h4>
        <div class="vmeta">${v.cat} · ${v.dur} · ${v.views} views</div></div>
      ${ic("i-play","ic")}</div>`;
  }

  // ============================ CIRCLE (journal + community) ============================
  let circleTab = "journal";
  SCREENS.community = function () {
    setScreen(`
      ${topbar(`<button class="icon-btn" data-act="notif">${ic("i-bell")}<span class="badge"></span></button>`)}
      <div class="app-head"><div class="who"><div><small>Your trading circle</small><b id="circle-title">${circleTab === "journal" ? "My Journal" : "Community"}</b></div></div></div>
      <div class="seg" id="circle-seg">
        <button class="seg-btn ${circleTab === "journal" ? "on" : ""}" data-seg="journal">My Journal</button>
        <button class="seg-btn ${circleTab === "community" ? "on" : ""}" data-seg="community">Community</button>
      </div>
      <div id="circle-body"></div>
    `);
    [...document.querySelectorAll("#circle-seg .seg-btn")].forEach(b => b.onclick = () => {
      circleTab = b.dataset.seg;
      [...document.querySelectorAll("#circle-seg .seg-btn")].forEach(x => x.classList.toggle("on", x === b));
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
  const sharedEntries = new Set(); // journal entries posted to the community feed
  function resStr(j) { return j.outcome === "be" ? "BE" : (j.r > 0 ? "+" : "") + j.r.toFixed(1) + "R"; }
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
    return `<div class="card jcard" data-jentry="${j.id}">
      <div class="jc-top">
        <div class="jc-pair">${ic("i-chart","ic")}<b>${j.pair}</b><span class="idea-dir ${j.dir}">${j.dir === "long" ? "▲ LONG" : "▼ SHORT"}</span></div>
        ${pill}
      </div>
      <div class="jc-meta">${j.setup} · ${j.session} · ${j.date}${from}</div>
      <div class="jc-note">${j.note}</div>
      <div class="jc-tags">${(j.tags || []).map(t => `<span class="jtag ${badTag(t) ? "bad" : "good"}">${t}</span>`).join("")}</div>
    </div>`;
  }
  function renderJournalView(body) {
    const s = journalStats();
    const items = D.journal.filter(j => journalFilter === "All" ? true : journalFilter === "Wins" ? j.outcome === "win" : j.outcome === "loss");
    body.innerHTML = `
      <div class="jstats reveal">
        <div class="jstat"><b class="num ${s.netR >= 0 ? "up" : "down"}">${s.netR >= 0 ? "+" : ""}${s.netR.toFixed(1)}R</b><small>Net result</small></div>
        <div class="jstat"><b class="num">${s.wr}%</b><small>Win rate</small></div>
        <div class="jstat"><b class="num">${s.count}</b><small>Trades</small></div>
        <div class="jstat"><b class="num">${s.pf.toFixed(1)}</b><small>Profit factor</small></div>
      </div>
      <div class="card card-pad equity-card">
        <div class="eq-head"><span class="eyebrow">Equity curve · R</span><span class="num ${s.netR >= 0 ? "up" : "down"}" style="font-size:13px">${s.netR >= 0 ? "+" : ""}${s.netR.toFixed(1)}R</span></div>
        <canvas id="equity-cv"></canvas>
      </div>
      <button class="btn btn-gold btn-block" data-log style="margin:14px 0 2px">${ic("i-plus")} Log a trade</button>
      <div class="chips" id="jfilters">${["All", "Wins", "Losses"].map(f => `<button class="chip ${f === journalFilter ? "active" : ""}" data-jf="${f}">${f}</button>`).join("")}</div>
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
        <button class="comm-act" data-act="challenge">${ic("i-flame")}<span><b>June challenge</b><small>${D.challenge.done}/${D.challenge.total} days</small></span></button>
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
    const shared = sharedEntries.has(id);
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
      <p class="sub" style="font-size:11px;text-align:center;margin-top:10px;color:var(--faint)">${shared ? "This trade is on the community feed." : "Post this trade to the community feed for others to see."}</p>
    `);
    const sh = $("[data-share]");
    if (sh && !shared) sh.onclick = () => {
      D.posts.unshift({ author: D.user.name, initials: D.user.initials, time: "now", me: true, body: j.note, tag: { pair: j.pair, dir: j.dir, rr: resStr(j) }, likes: 0, comments: 0, liked: false });
      sharedEntries.add(id);
      closeModal(); circleTab = "community";
      setTimeout(() => { if (activeTab === "community") SCREENS.community(); toast("Shared to the community", "i-check"); }, 320);
    };
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
      <label class="flabel">Result (R multiple)</label>
      <input class="finput num" id="f-r" type="number" step="0.1" value="${pre.r != null ? pre.r : "2.0"}" inputmode="decimal">
      <label class="flabel">Session</label>
      <div class="fchips" id="f-sess">${["London", "New York", "Asia"].map(v => `<button class="fchip ${v === sess ? "on" : ""}" data-fsess="${v}">${v}</button>`).join("")}</div>
      <label class="flabel">Setup</label>
      <input class="finput" id="f-setup" placeholder="e.g. Break & retest" value="${pre.setup || ""}">
      <label class="flabel">Notes & reflection</label>
      <textarea class="finput ftext" id="f-note" placeholder="What did you do well? What would you do differently?">${pre.note || ""}</textarea>
      <button class="btn btn-gold btn-block" id="f-save" style="margin-top:10px">Save to journal</button>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll("[data-fdir]")].forEach(b => b.onclick = () => { dir = b.dataset.fdir; setOn("#f-dir", b); });
    [...document.querySelectorAll("[data-foc]")].forEach(b => b.onclick = () => { oc = b.dataset.foc; setOn("#f-oc", b); });
    [...document.querySelectorAll("[data-fsess]")].forEach(b => b.onclick = () => { sess = b.dataset.fsess; setOn("#f-sess", b); });
    $("#f-save").onclick = () => {
      let rv = parseFloat($("#f-r").value); if (isNaN(rv)) rv = 1;
      rv = oc === "be" ? 0 : oc === "loss" ? -Math.abs(rv) : Math.abs(rv);
      D.journal.unshift({
        id: "j" + Date.now(), pair: ($("#f-pair").value || "XAUUSD").toUpperCase(), dir, r: rv, outcome: oc,
        session: sess, date: "Today", setup: $("#f-setup").value || "Setup", channel: "—",
        tags: oc === "win" ? ["Followed plan"] : oc === "loss" ? ["Review"] : ["Managed well"],
        note: $("#f-note").value || "No notes added.",
      });
      recordLog(); addXp(40); // persist journal + streak + leaderboard points + XP
      closeModal(); journalFilter = "All";
      setTimeout(() => { if (activeTab === "community") renderCircle(); toast("Trade logged · +50 pts", "i-check"); }, 320);
    };
  }
  function lbRow(r) {
    const medalCls = r.rank === 1 ? "m1" : r.rank === 2 ? "m2" : r.rank === 3 ? "m3" : "";
    const dn = r.delta.startsWith("+") ? "up" : r.delta.startsWith("-") ? "down" : "";
    return `<div class="lb-row ${r.top?"top":""}" style="${r.me?"border-color:rgba(199,164,77,.4);background:rgba(199,164,77,.06)":""}">
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
      <p class="sub" style="margin:2px 2px 6px">Three home cities and growing. Meet the floor, trade the open together, and learn face-to-face.</p>
      ${D.hubs.map(hub).join("")}
      <div class="card card-pad" style="text-align:center;border-style:dashed;opacity:.8">
        <div style="font-size:22px">📍</div>
        <b style="font-family:var(--display);display:block;margin-top:6px">More hubs coming</b>
        <small class="sub">Manchester · Toronto · Lagos — vote inside the community.</small>
      </div>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll("[data-rsvp]")].forEach(b => b.onclick = () => {
      const on = b.classList.toggle("btn-gold"); b.classList.toggle("btn-ghost", !on);
      b.textContent = on ? "Going ✓" : "RSVP";
      toast(on ? "You're going — see you there" : "RSVP cancelled", on ? "i-check" : null);
    });
    wireCommon();
  };
  function hub(h) {
    return `<div class="hub reveal">
      <div class="hub-img" style="background:url('${h.img}') center/cover, ${h.tint}">
        <div class="hub-img-g"></div>
        <div class="next"><span class="pill pill-gold">${ic("i-cal","ic")} ${h.event.d} ${h.event.m}</span></div>
        <div class="hub-cap">
          <h3><span class="hub-flag">${h.flag}</span>${h.city}</h3>
          <div class="loc">${ic("i-pin","ic")} ${h.country}</div>
        </div>
      </div>
      <div class="hub-body">
        <div class="event">
          <div class="date"><b>${h.event.d}</b><small>${h.event.m}</small></div>
          <div class="ev-info"><b>${h.event.title}</b><small>${h.event.time}</small></div>
        </div>
        <div class="going">
          <div class="faces">${h.faces.map(f => av(f, 28, "quiet")).join("")}</div>
          <small>${h.going} members going</small>
          <button class="btn btn-ghost btn-sm rsvp" data-rsvp>RSVP</button>
        </div>
      </div></div>`;
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

      <div class="stat-row" style="margin-top:13px">
        <div class="stat">${ic("i-flame","ic")}<b class="num">${profStreak()}</b><small>Day streak</small></div>
        <div class="stat">${ic("i-target","ic")}<b class="num">${journalStats().winRate}%</b><small>Win rate</small></div>
        <div class="stat">${ic("i-live","ic")}<b class="num">${callsJoined()}</b><small>Calls joined</small></div>
      </div>

      <div class="section-head"><span class="h2">Your numbers</span><span class="more" data-act="journal">Journal ›</span></div>
      <div class="card card-pad">
        <div class="num-grid">
          <div class="num-cell"><b class="num ${js.netR>=0?'up':'down'}">${js.netR>=0?'+':''}${js.netR.toFixed(1)}R</b><small>Net result</small></div>
          <div class="num-cell"><b class="num">${js.avgRR.toFixed(1)}R</b><small>Avg win</small></div>
          <div class="num-cell"><b class="num">${js.pf.toFixed(1)}</b><small>Profit factor</small></div>
          <div class="num-cell"><b class="num ${bestTrade()>=0?'up':''}">${bestTrade()>=0?'+':''}${bestTrade().toFixed(1)}R</b><small>Best trade</small></div>
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
        ${hubRow("i-flame","Monthly challenge","June · journal every trade","challenge")}
        ${hubRow("i-comm","Members & following","4,200+ on the floor","members")}
        ${hubRow("i-share","Invite a trader","Grow the community","invite")}
        ${hubRow("i-book","Trading glossary","Key terms, explained","glossary")}
        ${hubRow("i-bell","Notifications","Choose what pings you","settings")}
        ${hubRow("i-chart","Announcements","From Arron & the team","announce",true)}
      </div>

      <div class="section-head"><span class="h2">Trade journal</span><span class="more" data-act="journal">Open journal ›</span></div>
      <div class="card card-pad">
        ${D.journal.slice(0,4).map((j,i)=>`<div class="journal" ${i===3?'style="border-bottom:none"':''}>
          <div class="jp"><b>${j.pair} ${j.dir==='long'?'▲':'▼'}</b><small>${j.setup} · ${j.session} · ${j.date}</small></div>
          <div class="res num ${j.outcome==='win'?'up':j.outcome==='loss'?'down':''}">${resStr(j)}</div></div>`).join("")}
      </div>

      <div class="section-head"><span class="h2">Settings</span></div>
      <div class="card card-pad">
        ${settingRow("i-bell","Push notifications","",true,"set1")}
        ${settingRow("i-live","Live call reminders","",true,"set2")}
        ${settingRow("i-moon","Appearance","Dark",false)}
        ${settingRow("i-shield","Account & security","",false)}
        ${settingRow("i-book","Help & support","",false,null,true)}
      </div>
      <button class="btn btn-ghost btn-block" id="sign-out" style="margin-top:14px">Sign out</button>
      <p class="sub" style="font-size:11px;text-align:center;margin-top:16px;color:var(--faint)">Member since 2025 · Educational content only. Not financial advice.</p>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll(".toggle")].forEach(t => t.onclick = () => { const on = t.classList.toggle("on"); toast(on ? "Turned on" : "Turned off", on ? "i-check" : null); });
    const bk = $("[data-back]"); if (bk) bk.onclick = () => go("home");
    const so = $("#sign-out"); if (so) so.onclick = signOut;
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
        <div class="tcard-head"><img src="assets/blakey-logo.png" class="tcard-logo" alt="Blakey Trades"></div>
        ${av(D.user.initials, 64)}
        <div class="tcard-name">${D.user.name}</div>
        <div class="tcard-lvl">⭐ Level ${profLevel()} · ${tierName(profLevel())}</div>
        <div class="tcard-stats">
          <div><b class="num gold-text">${js.winRate}%</b><small>Win rate</small></div>
          <div><b class="num gold-text">${profStreak()}</b><small>Day streak</small></div>
          <div><b class="num ${js.netR>=0?'up':'down'}">${js.netR>=0?'+':''}${js.netR.toFixed(1)}R</b><small>Net result</small></div>
        </div>
        <div class="tcard-foot">${D.user.handle} · Blakey Trades</div>
      </div>
      <button class="btn btn-gold btn-block" id="tc-share" style="margin-top:14px">${ic("i-share")} Share my card</button>
      <div class="spacer"></div>`);
    const sh = $("#tc-share"); if (sh) sh.onclick = () => toast("Card ready to share", "i-share");
  }
  function settingRow(icon, label, val, toggle, id, last) {
    return `<div class="settings-row"${last?' style="border-bottom:none"':''}>${ic(icon)}<span class="lbl">${label}</span>
      ${toggle ? `<div class="toggle on" id="${id}"><i></i></div>` : `<span class="val">${val||""}</span>${ic("i-chev","ic")}`}</div>`;
  }
  function hubRow(icon, title, sub, act, last) {
    return `<button class="hub-row${last ? " last" : ""}" data-act="${act}">${ic(icon, "ic")}<div class="hr-body"><b>${title}</b><small>${sub}</small></div>${ic("i-chev", "ic")}</button>`;
  }

  // ============================ MODALS (player + idea) ============================
  function openModal(html) {
    const m = $("#modal"); m.innerHTML = `<div class="sheet"><button class="sheet-grab" aria-label="Close"></button>${html}</div>`;
    m.classList.add("open"); requestAnimationFrame(() => Charts.initIn(m));
    m.onclick = (e) => { if (e.target === m) closeModal(); };       // tap dimmed area
    const grab = m.querySelector(".sheet-grab"); if (grab) grab.onclick = closeModal; // tap handle
    return m;
  }
  function closeModal() { const m = $("#modal"); m.classList.remove("open"); setTimeout(() => { m.innerHTML = ""; }, 350); }

  function openPlayer(id) {
    const v = D.videos.find(x => x.id === id) || D.videos[0];
    openModal(`
      <div class="player">
        <canvas data-chart="player" data-seed="${v.seed}"></canvas>
        <div class="big-play" data-pp><span>${ic("i-play")}</span></div>
        <div class="controls">
          <div class="bar"><i></i></div>
          <div class="crow"><span>14:21</span><svg viewBox="0 0 24 24"><use href="#i-play"/></svg><span style="margin-left:auto">${v.dur}</span></div>
        </div>
      </div>
      <span class="eyebrow" style="margin-top:14px;display:block">${v.cat}</span>
      <h2 class="h2" style="margin:7px 0 5px">${v.title}</h2>
      <div class="sub" style="font-size:12.5px">${v.host} · ${v.views} views · ${v.date}</div>
      <div style="display:flex;gap:10px;margin:15px 0 4px">
        <button class="btn btn-gold" style="flex:1" data-pp>${ic("i-play")} Resume</button>
        <button class="btn btn-ghost btn-sm" style="height:52px" data-act="save">+ List</button>
      </div>
      <div class="section-head"><span class="h3">Chapters</span></div>
      ${[["00:00","Why the London open matters"],["08:12","Mapping liquidity"],["19:40","The 3 entry models"],["31:05","Live risk management"],["38:20","Q&A from the floor"]]
        .map(([t,c])=>`<div class="chapter"><span class="t num">${t}</span><span class="c">${c}</span>${ic("i-play","ic")}</div>`).join("")}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:16px;color:var(--faint)">Educational content only. Not financial advice.</p>
    `);
    [...document.querySelectorAll("[data-pp]")].forEach(b => b.onclick = () => toast("Playing — " + v.title, "i-play"));
    const sv = $("[data-act=save]"); if (sv) sv.onclick = () => toast("Saved to your list", "i-check");
  }

  function openIdea(id) {
    const i = D.ideas.find(x => x.id === id) || D.ideas[0];
    openModal(`
      <div class="player" style="height:170px"><canvas data-chart="player" data-seed="${i.id.charCodeAt(1)*5}"></canvas></div>
      <div class="idea-top" style="margin-top:16px">
        <div class="idea-pair">${ic("i-chart","ic")}<span class="sym" style="font-family:var(--display);font-weight:800;font-size:19px">${i.pair}</span>
          <span class="idea-dir ${i.dir}">${i.dir==="long"?"▲ LONG":"▼ SHORT"}</span></div>
        <span class="eyebrow muted">${i.time}</span>
      </div>
      <div class="ticket" style="margin-top:12px">
        <div class="cell"><small>Entry</small><b class="num">${i.entry}</b></div>
        <div class="cell sl"><small>Stop</small><b class="num">${i.sl}</b></div>
        <div class="cell tp"><small>Target</small><b class="num">${i.tp}</b></div>
      </div>
      <div class="idea-foot" style="margin:12px 2px"><span class="rr num">Risk:Reward <b>${i.rr}</b></span><span class="rr num">${i.session} session</span></div>
      <span class="eyebrow" style="display:block;margin:6px 0 6px">The reasoning</span>
      <p class="sub">${i.note}</p>
      ${tookRow(i)}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:18px;color:var(--faint)">Educational content only. Not financial advice.</p>
    `);
    wireTook();
  }

  // ---------- notifications ----------
  function liveNotifs() { // real events computed from live state
    const out = [], nc = nextCall();
    if (nc) {
      const s = nc.startsIn, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
      const when = isLiveNow() ? "is live now" : h > 0 ? `starts in ${h}h ${m}m` : `starts in ${m}m`;
      out.push({ icon: "i-live", text: `${nc.session} ${when} — ${nc.host} hosting`, time: "now", unread: true, go: "live" });
    }
    out.push({ icon: "i-trophy", text: `You're #${myRank()} on the weekly leaderboard`, time: "now", unread: true, go: "community" });
    return out;
  }
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
    const mk = $("[data-mark]"); if (mk) mk.onclick = () => { D.notifications.forEach(n => n.unread = false); [...document.querySelectorAll(".notif")].forEach(n => n.classList.remove("unread")); [...document.querySelectorAll("[data-act=notif] .badge")].forEach(b => { b.hidden = true; }); toast("All caught up", "i-check"); };
  }

  // ---------- signals: channels hub (a bottom tab) + per-channel feed ----------
  SCREENS.signals = function () { // Signals tab — the Telegram channels, mirrored in-app
    setScreen(`
      ${topbar()}
      <div class="app-head"><div class="who"><div><small>${ic("i-tg","ic")} Synced from Telegram</small><b>Trade Signals</b></div></div></div>
      <p class="sub" style="margin:0 2px 8px">Every call from the Blakey Trades channels, in one place.</p>
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
    list.innerHTML = items.map(ideaCard).join("");
    requestAnimationFrame(() => Charts.initIn(list));
    [...list.querySelectorAll("[data-idea]")].forEach(n => n.onclick = () => openIdea(n.dataset.idea));
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
    const live = !!(liveCal && liveCal.length);
    const subLive = `<span class="cal-live">● Live</span> · news that moves gold · times UK`;
    openModal(`<h3 class="sheet-title">Market news</h3><p class="sheet-sub">${live ? subLive : "News that moves gold · times UK"}</p><div class="cal" id="cal-list">${calRowsHtml(live ? liveCal : D.calendar)}</div>`);
    if (!live) loadCalendar().then(d => { const box = $("#cal-list"); if (d && box) { box.innerHTML = calRowsHtml(d); const s = box.parentElement.querySelector(".sheet-sub"); if (s) s.innerHTML = subLive; } });
  }
  function openAlerts() {
    const list = () => D.alerts.map((a, i) => `<div class="alert-row"><div class="alert-body"><b class="num">${a.sym} ${a.cond === "above" ? "▲" : "▼"} ${a.price}</b><small>${a.note}</small></div><button class="tgl ${a.on ? "on" : ""}" data-al="${i}"><span></span></button></div>`).join("");
    openModal(`<h3 class="sheet-title">Price alerts</h3><p class="sheet-sub">Get pinged when gold hits your level.</p><div id="alert-list">${list()}</div><label class="flabel" style="margin-top:16px">New gold alert</label><div class="calc-2"><input class="finput num" id="al-px" inputmode="decimal" placeholder="e.g. 2,960"><button class="btn btn-gold" id="al-add" style="height:50px;flex:none;padding:0 18px">${ic("i-plus")} Add</button></div>`);
    const wire = () => [...document.querySelectorAll("[data-al]")].forEach(b => b.onclick = () => { const a = D.alerts[+b.dataset.al]; a.on = !a.on; b.classList.toggle("on", a.on); });
    wire();
    const add = $("#al-add"); if (add) add.onclick = () => { const px = $("#al-px").value.trim(); if (!px) return; D.alerts.unshift({ sym: "XAUUSD", cond: "above", price: px, note: "Custom alert", on: true }); $("#alert-list").innerHTML = list(); wire(); $("#al-px").value = ""; toast("Alert set", "i-check"); };
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
  function openGlossary() {
    openModal(`<h3 class="sheet-title">Trading glossary</h3><p class="sheet-sub">Plain-English definitions.</p><div class="gloss">${D.glossary.map(g => `<div class="gloss-row"><b>${g.term}</b><span>${g.def}</span></div>`).join("")}</div>`);
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
    const def = [1, 1, 1, 0, 1, 1];
    openModal(`<h3 class="sheet-title">Notifications</h3><p class="sheet-sub">Choose what pings you.</p><div class="settings">${opts.map((o, i) => `<div class="set-row"><span>${o}</span><button class="tgl ${def[i] ? "on" : ""}" data-set></button></div>`).join("")}</div>`);
    [...document.querySelectorAll("[data-set]")].forEach(b => b.onclick = () => b.classList.toggle("on"));
  }
  function openAnnouncements() {
    openModal(`<h3 class="sheet-title">Announcements</h3><p class="sheet-sub">From Arron & the team.</p><div class="ann">${D.announcements.map(a => `<div class="ann-row">${av(a.from === "Team" ? "BT" : "AB", 38)}<div><div class="ann-top"><b>${a.from}</b><span class="vchk">✓</span><span class="ann-time">${a.time}</span></div><p>${a.text}</p></div></div>`).join("")}</div>`);
  }
  function openChallenge() {
    const c = D.challenge, pct = Math.round(c.done / c.total * 100);
    openModal(`<h3 class="sheet-title">Monthly challenge</h3><div class="chal"><div class="chal-ic">${ic("i-flame")}</div>
      <b class="chal-name">${c.name}</b><p class="chal-desc">${c.desc}</p>
      <div class="chal-bar"><i style="width:${pct}%"></i></div><div class="chal-meta"><span class="num gold-text">${c.done}/${c.total}</span> days · ${pct}%</div>
      <div class="chal-reward">${ic("i-trophy", "ic")} ${c.reward}</div>
      <button class="btn ${c.joined ? "btn-ghost" : "btn-gold"} btn-block" id="chal-join" style="margin-top:16px">${c.joined ? "You're in ✓" : "Join challenge"}</button></div>`);
    const j = $("#chal-join"); if (j) j.onclick = () => { c.joined = true; j.className = "btn btn-ghost btn-block"; j.textContent = "You're in ✓"; toast("Joined — log a trade today", "i-check"); };
  }
  function openMembers() {
    const rows = liveLeaderboard().map(m => `<div class="mem-row">${av(m.initials, 40, m.top ? "" : "quiet")}<div class="mem-body"><b>${m.name}${m.me ? " · You" : ""}</b><small class="num">${m.handle}</small></div>${m.me ? "" : `<button class="btn btn-ghost btn-sm" data-f>Follow</button>`}</div>`).join("");
    openModal(`<h3 class="sheet-title">Members</h3><p class="sheet-sub">${(4200).toLocaleString()}+ on the floor — follow traders you rate.</p><div class="mem">${rows}</div>`);
    [...document.querySelectorAll("[data-f]")].forEach(b => b.onclick = () => { const on = b.classList.toggle("following"); b.textContent = on ? "Following ✓" : "Follow"; });
  }
  function openChat() {
    const msgs = D.chatScript.slice(0, 8);
    openModal(`<h3 class="sheet-title">Community chat</h3><p class="sheet-sub">The floor, all day.</p><div class="cchat">${msgs.map(m => `<div class="cmsg ${m.host ? "host" : ""}">${av(m.initials, 30, "quiet")}<div class="ct"><b>${m.name}${m.host ? " · Host" : ""}</b>${m.text}</div></div>`).join("")}</div><div class="cchat-in"><input class="finput" placeholder="Message the floor…"><button class="btn btn-gold" style="height:48px;flex:none;padding:0 15px">${ic("i-send")}</button></div>`);
  }

  // ============================ ACADEMY + TRACK RECORD ============================
  const LESSON_POOL = ["What moves gold", "Reading candles", "Support & resistance", "The London open", "Liquidity & sweeps", "The 3 entry models", "Risk per trade", "Stop placement", "Managing the trade", "Journaling & review", "Trading psychology", "Building your edge"];
  function academySection() {
    return `<div class="section-head"><span class="h2">Your path</span><span class="more" data-act="glossary">Glossary ›</span></div>
      <div class="paths">${D.paths.map(p => {
        const pct = Math.round(p.done / p.lessons * 100);
        return `<button class="path" data-path="${p.id}">
          <div class="path-ring" style="background:conic-gradient(${p.color} ${pct * 3.6}deg, var(--surface-3) 0)"><span>${pct}%</span></div>
          <div class="path-body"><div class="path-top"><b>${p.name}</b><span class="path-lvl">${p.level}</span></div>
          <div class="path-desc">${p.desc}</div><div class="path-meta">${p.done}/${p.lessons} lessons${p.done === p.lessons ? " · complete ✓" : ""}</div></div>
          ${ic("i-chev", "ic")}</button>`;
      }).join("")}</div>`;
  }
  function openPath(id) {
    const p = D.paths.find(x => x.id === id) || D.paths[0];
    const rows = Array.from({ length: p.lessons }, (_, i) => { const done = i < p.done, t = LESSON_POOL[i % LESSON_POOL.length]; return `<div class="lesson ${done ? "done" : ""}"><span class="les-n">${done ? ic("i-check", "ic") : i + 1}</span><span class="les-t">${t}</span>${done ? "" : ic("i-play", "ic")}</div>`; }).join("");
    openModal(`<h3 class="sheet-title">${p.name}</h3><p class="sheet-sub">${p.level} · ${p.done}/${p.lessons} complete</p><div class="lessons">${rows}</div><button class="btn btn-gold btn-block" id="path-quiz" style="margin-top:16px">${ic("i-target")} ${p.name} quiz</button>`);
    const q = $("#path-quiz"); if (q) q.onclick = () => openQuiz(p.id);
  }
  function openQuiz(pathId) {
    const path = D.paths.find(p => p.id === pathId);
    const bank = (D.quizzes && (D.quizzes[pathId] || D.quizzes.found)) || { pass: 1, qs: [] };
    const title = path ? path.name : "Quick";
    const render = () => {
      // shuffle options each render so the correct answer is never in a fixed slot
      const prepared = bank.qs.map(q => {
        const opts = q.a.map((opt, j) => ({ opt, correct: j === q.c }));
        for (let i = opts.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [opts[i], opts[k]] = [opts[k], opts[i]]; }
        return { q: q.q, why: q.why, opts };
      });
      const body = prepared.map((q, i) => `<div class="quiz-q"><span class="quiz-prog">Question ${i + 1} of ${prepared.length}</span><b>${q.q}</b>${q.opts.map(o => `<button class="quiz-opt" data-correct="${o.correct ? 1 : 0}">${o.opt}</button>`).join("")}<div class="quiz-why">${q.why}</div></div>`).join("");
      openModal(`<h3 class="sheet-title">${title} quiz</h3><p class="sheet-sub">${prepared.length} questions · ${bank.pass}/${prepared.length} to pass.</p><div class="quiz">${body}</div><div id="quiz-score"></div>`);
      let answered = 0, correct = 0;
      [...document.querySelectorAll(".quiz-opt")].forEach(b => b.onclick = () => {
        const qd = b.closest(".quiz-q"); if (qd.classList.contains("done")) return;
        qd.classList.add("done"); answered++;
        if (b.dataset.correct === "1") correct++;
        [...qd.querySelectorAll(".quiz-opt")].forEach(o => { o.disabled = true; if (o.dataset.correct === "1") o.classList.add("right"); else if (o === b) o.classList.add("wrong"); });
        const why = qd.querySelector(".quiz-why"); if (why) why.classList.add("show");
        if (answered === prepared.length) finish(correct, prepared.length);
      });
    };
    const finish = (correct, total) => {
      const passed = correct >= bank.pass, s = $("#quiz-score"); if (!s) return;
      s.innerHTML = `<div class="qs-card ${passed ? "pass" : "fail"}">${ic(passed ? "i-trophy" : "i-target", "ic")}<div>You scored <b class="gold-text">${correct}/${total}</b> — ${passed ? "passed · +60 XP" : `${bank.pass}/${total} needed — review &amp; retry.`}</div></div><button class="btn ${passed ? "btn-ghost" : "btn-gold"} btn-block" id="quiz-retry" style="margin-top:12px">${passed ? "Retake quiz" : "Try again"}</button>`;
      if (passed) { addXp(60); toast("Quiz passed · +60 XP", "i-trophy"); }
      const r = $("#quiz-retry"); if (r) r.onclick = render;
    };
    render();
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
    [...document.querySelectorAll("[data-tab]")].forEach(n => n.addEventListener("click", e => { e.stopPropagation(); go(n.dataset.tab); }));
    [...document.querySelectorAll("[data-path]")].forEach(n => n.onclick = () => openPath(n.dataset.path));
    [...document.querySelectorAll("[data-video]")].forEach(n => n.addEventListener("click", () => openPlayer(n.dataset.video)));
    [...document.querySelectorAll("[data-idea]")].forEach(n => n.addEventListener("click", () => openIdea(n.dataset.idea)));
    [...document.querySelectorAll("[data-act=notif]")].forEach(n => n.onclick = openNotifications);
    [...document.querySelectorAll("[data-act=ideas]")].forEach(n => n.onclick = openIdeas);
    [...document.querySelectorAll("[data-act=journal]")].forEach(n => n.onclick = () => { circleTab = "journal"; go("community"); });
    [...document.querySelectorAll("[data-act=profile]")].forEach(n => n.onclick = () => go("profile"));
    [...document.querySelectorAll("[data-act=search]")].forEach(n => n.onclick = () => toast("Search the library", "i-search"));
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
      `<button class="tab ${t.live ? "live-tab" : ""} ${t.id===activeTab?"active":""}" data-tab="${t.id}">
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
        <img class="login-wordmark" src="assets/blakey-logo.png" alt="Blakey Trades">
        <h1 class="h1">The floor is<br>open.</h1>
        <p class="sub" style="margin-top:10px;max-width:280px">Live gold calls, the full education library, and ${(4200).toLocaleString()}+ traders who show up every day. Welcome to Blakey Trades.</p>
      </div>
      <div class="login-bottom">
        <button class="btn btn-gold btn-block" id="enter">Continue with phone</button>
        <div class="login-or">or</div>
        <div class="social-row">
          <button class="social-btn" data-soc>${appleSvg()}</button>
          <button class="social-btn" data-soc>${googleSvg()}</button>
          <button class="social-btn" data-soc>${tgSvg()}</button>
        </div>
        <p class="login-foot">Free for members — funded by our partners.<br>By continuing you agree to the Terms & Privacy Policy.</p>
      </div>`;
    $("#app").appendChild(el);
    requestAnimationFrame(() => Charts.initIn(el));
    const enter = () => {
      el.style.transition = "opacity .4s, transform .4s"; el.style.opacity = "0"; el.style.transform = "translateY(-10px)";
      setTimeout(() => { el.remove(); showOnboarding(); }, 420);
    };
    $("#enter").onclick = enter;
    const provs = ["Apple", "Google", "Telegram"]; // believable demo sign-in: connect → land in the app, stay signed in
    [...el.querySelectorAll("[data-soc]")].forEach((b, i) => b.onclick = () => {
      const prov = provs[i] || "account";
      [...el.querySelectorAll("[data-soc]")].forEach(x => x.disabled = true);
      b.classList.add("loading");
      toast(`Connecting to ${prov}…`, "i-check");
      setSignedIn(prov);
      setTimeout(() => {
        el.style.transition = "opacity .4s, transform .4s"; el.style.opacity = "0"; el.style.transform = "translateY(-10px)";
        setTimeout(() => { el.remove(); renderTabbar(); go("home"); setTimeout(() => toast(`Signed in with ${prov}`, "i-check"), 450); }, 420);
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
          <img class="ob-wordmark" src="assets/blakey-logo.png" alt="Blakey Trades">
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
      else body = `
        <div class="ob-top"><span class="eyebrow">Step 4 of 4</span><h2 class="h2" style="margin:8px 0 4px">Your first live call</h2><p class="sub">This is where it clicks — Arron trades the open, live, with the room.</p></div>
        <div class="card ob-call">
          <div class="ob-call-row"><span class="pill pill-live"><span class="dot-live"></span> Today</span><span class="num" style="color:var(--gold);font-weight:700">7:00am BST</span></div>
          <h3 style="font-family:var(--display);font-weight:700;font-size:17px;margin:11px 0 3px">London Open — Gold Game Plan</h3>
          <div class="sub" style="font-size:12.5px">Hosted by Arron Blakey <span class="vchk">✓</span></div>
          <button class="btn btn-ghost btn-block" data-cal style="margin-top:14px">${ic("i-cal")} Add to calendar</button>
        </div>
        <button class="btn btn-gold btn-block" data-next style="margin-top:auto">Enter Blakey Trades</button>`;
      el.innerHTML = `${dots()}<div class="ob-body">${body}</div>`;
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
      const cal = el.querySelector("[data-cal]"); if (cal) cal.onclick = () => { cal.textContent = "Added to calendar ✓"; toast("Added — see you at the open", "i-check"); };
    }
    function finish() { setSignedIn("phone"); el.style.transition = "opacity .4s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 420); renderTabbar(); go("home"); setTimeout(() => toast(`Welcome, ${D.user.first} 👋`, "i-check"), 500); }
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
    fitDevice();
    hydrateProfile(); // journal + streak + points from device storage (seeds the demo journal first run)
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
  function appleSvg(){return '<svg viewBox="0 0 24 24" fill="#EDEDE8"><path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.04 1.4-.65 2.6-.65 1.2 0 1.5.65 2.6.63 1.1-.02 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.02-.01-2.1-.8-2.1-3.1zM14.5 6.3c.5-.65.9-1.55.8-2.45-.8.03-1.7.53-2.3 1.18-.5.57-.95 1.5-.83 2.37.9.07 1.8-.45 2.33-1.1z"/></svg>';}
  function googleSvg(){return '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6C4.7 19.9 8.1 22 12 22z"/><path fill="#FBBC05" d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H3.1C2.4 9 2 10.5 2 12s.4 3 1.1 4.4l3.3-2.6z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.2 14.7 2 12 2 8.1 2 4.7 4.1 3.1 7.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg>';}
  function tgSvg(){return '<svg viewBox="0 0 24 24" fill="#229ED9"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.2 13 1.4 11.5c-1-.3-1-1 .2-1.5l19-7.3c.9-.3 1.6.2 1.3 1.6z"/></svg>';}

})();
