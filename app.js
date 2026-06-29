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
    activeTab = tab;
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
  function marketBar() {
    return `<div class="marketbar">
      <div class="mb-item"><span class="mb-live" title="Live spot price"></span><span class="mb-sym">XAU/USD</span><span class="mb-price num" id="mb-price">—</span><span class="mb-chg num" id="mb-chg"></span></div>
      <div class="mb-item mb-session"><span class="mb-dot"></span><span id="mb-sess">—</span><span class="mb-next num" id="mb-next"></span></div>
    </div>`;
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
  function mountMarketBar() {
    const paintSession = () => { const s = sessionInfo(); const se = $("#mb-sess"), ne = $("#mb-next"); if (se) se.textContent = s.label; if (ne) ne.textContent = " · " + s.next; };
    const renderPrice = () => {
      const el = $("#mb-price"); if (!el || mbPrice == null) return;
      el.textContent = mbPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const c = $("#mb-chg"); if (c && mbBase) {
        const pct = (mbPrice - mbBase) / mbBase * 100;
        c.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
        c.className = "mb-chg num " + (pct >= 0 ? "up" : "down");
      }
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
  function morningBriefCard() {
    const b = D.morningBrief;
    return `<div class="card brief reveal">
      <div class="brief-head"><span class="eyebrow">${ic("i-chart", "ic")} Morning brief</span><span class="brief-time num">6:30 BST</span></div>
      <div class="brief-bias">${b.bias}</div>
      <h3 class="brief-h">${b.headline}</h3>
      <div class="brief-points">
        ${b.points.map(p => `<div class="brief-pt">${ic(p.ic, "bp-ic")}<div class="bp-tx"><b>${p.label}</b><span>${p.text}</span></div></div>`).join("")}
      </div>
    </div>`;
  }

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
        ${D.homeStats.map(s => `<div class="stat">${ic("i-" + s.ic, "ic")}<b class="num">${s.value}</b><small>${s.label}</small></div>`).join("")}
      </div>

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
    $("[data-act=joinlive]").onclick = () => go("live");
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
      toast(tookState[id] === "up" ? "Marked as taken" : tookState[id] === "down" ? "Marked as not taken" : "Cleared", tookState[id] === "up" ? "i-check" : null);
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
  SCREENS.live = function () {
    const v = D.live;
    setScreen(`
      <div id="live-stage">
        <canvas id="live-canvas" data-chart="live"></canvas>
        <div class="live-grad"></div>
        <div class="live-hud">
          <span class="pill pill-live"><span class="dot-live"></span> LIVE</span>
          <span class="live-watchers">${ic("i-comm","ic")} <span id="watchers">${v.watchers.toLocaleString()}</span> watching</span>
        </div>
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
      </div>
      <div style="padding-top:16px">
        <span class="eyebrow">${v.session} open · live now</span>
        <h2 class="h2" style="margin:8px 0 4px">${v.title}</h2>
        <p class="sub">Arron is mapping the London open in real time — liquidity, the entry model, and live risk management on ${v.pair}.</p>
        <div class="section-head"><span class="h3">Covering today</span></div>
        ${["Where London liquidity is resting","The A+ entry model (reclaim & hold)","Live risk: where the stop really goes","Q&A from the floor"].map(x=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)">${ic("i-check","ic")}<span style="font-size:13.5px">${x}</span></div>`).join("")}
        ${scheduleSection()}
        <div class="section-head"><span class="h3">Recent replays</span><span class="more" data-tab="learn">All ›</span></div>
        <div class="rail rail-pad">${D.videos.filter(x=>x.cat==="Session Replays"||x.host==="Arron Blakey").slice(0,4).map(vCard).join("")}</div>
        <p class="sub" style="font-size:11px;text-align:center;margin-top:18px;color:var(--faint)">Educational content only. Not financial advice.</p>
        <div class="spacer"></div>
      </div>
    `);
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
    return { wins, losses, wr, netR, pf: gL ? gW / gL : gW, count: J.length };
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
      <div class="section-head"><span class="h2">Leaderboard</span><span class="more">This week</span></div>
      ${D.leaderboard.map(lbRow).join("")}
      <div class="section-head"><span class="h2">Your badges</span></div>
      <div class="badges">${D.badges.map(b => `<div class="badge-it ${b.on ? "on" : "off"}"><div class="ring2">${ic(b.ic, "bdg-ic")}</div><small>${b.name}</small></div>`).join("")}</div>
      <div class="section-head"><span class="h2">From the floor</span></div>
      ${D.posts.map(post).join("")}
      <div class="spacer"></div>`;
    [...document.querySelectorAll(".post-actions .like")].forEach(a => a.onclick = () => {
      const liked = a.classList.toggle("liked"); const c = a.querySelector("span"); let n = +c.dataset.n;
      n += liked ? 1 : -1; c.dataset.n = n; c.textContent = n;
    });
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
  function openLogTrade() {
    let dir = "long", oc = "win", sess = "London";
    openModal(`
      <h2 class="h2" style="margin:2px 0 3px">Log a trade</h2>
      <p class="sub" style="font-size:12px;margin-bottom:15px">Record it while it's fresh — the journal is where the growth happens.</p>
      <label class="flabel">Pair</label>
      <input class="finput" id="f-pair" value="XAUUSD">
      <label class="flabel">Direction</label>
      <div class="fchips" id="f-dir">${[["long", "▲ Long"], ["short", "▼ Short"]].map(([v, l]) => `<button class="fchip ${v === dir ? "on" : ""}" data-fdir="${v}">${l}</button>`).join("")}</div>
      <label class="flabel">Outcome</label>
      <div class="fchips" id="f-oc">${[["win", "Win"], ["loss", "Loss"], ["be", "Breakeven"]].map(([v, l]) => `<button class="fchip ${v === oc ? "on" : ""}" data-foc="${v}">${l}</button>`).join("")}</div>
      <label class="flabel">Result (R multiple)</label>
      <input class="finput num" id="f-r" type="number" step="0.1" value="2.0" inputmode="decimal">
      <label class="flabel">Session</label>
      <div class="fchips" id="f-sess">${["London", "New York", "Asia"].map(v => `<button class="fchip ${v === sess ? "on" : ""}" data-fsess="${v}">${v}</button>`).join("")}</div>
      <label class="flabel">Setup</label>
      <input class="finput" id="f-setup" placeholder="e.g. Break & retest">
      <label class="flabel">Notes & reflection</label>
      <textarea class="finput ftext" id="f-note" placeholder="What did you do well? What would you do differently?"></textarea>
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
      closeModal(); journalFilter = "All";
      setTimeout(() => { if (activeTab === "community") renderCircle(); toast("Trade logged", "i-check"); }, 320);
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
  SCREENS.profile = function () {
    const u = D.user;
    setScreen(`
      ${topbar(`<button class="icon-btn back-btn" data-back>${ic("i-chev")}</button>`)}
      <div class="profile-head reveal">
        ${av(u.initials, 64)}
        <div class="name">${u.name}</div>
        <div class="handle num">${u.handle}</div>
        <div style="margin-top:10px"><span class="pill pill-gold">⭐ Level ${u.level} · ${u.levelName}</span></div>
      </div>

      <div class="card level">
        <div class="kv"><span>Progress to Level ${u.level+1}</span><b>${u.xp.toLocaleString()} / ${u.xpNext.toLocaleString()} XP</b></div>
        <div class="level-bar"><i style="width:${Math.round(u.xp/u.xpNext*100)}%"></i></div>
        <div class="kv"><span>${u.xpNext-u.xp} XP to go — show up to today's live call for +50</span></div>
      </div>

      <div class="stat-row" style="margin-top:13px">
        <div class="stat">${ic("i-flame","ic")}<b class="num">${u.streak}</b><small>Day streak</small></div>
        <div class="stat">${ic("i-target","ic")}<b class="num">${u.winRate}%</b><small>Win rate</small></div>
        <div class="stat">${ic("i-live","ic")}<b class="num">${u.sessions}</b><small>Calls joined</small></div>
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
      <p class="sub" style="font-size:11px;text-align:center;margin-top:16px;color:var(--faint)">Member since 2025 · Educational content only. Not financial advice.</p>
      <div class="spacer"></div>
    `);
    [...document.querySelectorAll(".toggle")].forEach(t => t.onclick = () => { const on = t.classList.toggle("on"); toast(on ? "Turned on" : "Turned off", on ? "i-check" : null); });
    const bk = $("[data-back]"); if (bk) bk.onclick = () => go("home");
    wireCommon();
  };
  function settingRow(icon, label, val, toggle, id, last) {
    return `<div class="settings-row"${last?' style="border-bottom:none"':''}>${ic(icon)}<span class="lbl">${label}</span>
      ${toggle ? `<div class="toggle on" id="${id}"><i></i></div>` : `<span class="val">${val||""}</span>${ic("i-chev","ic")}`}</div>`;
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
  function openNotifications() {
    const groups = {};
    D.notifications.forEach(n => (groups[n.group] = groups[n.group] || []).push(n));
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
      ${D.channels.map(channelCard).join("")}
      <p class="sub" style="font-size:11px;text-align:center;margin-top:14px;color:var(--faint)">Educational content only. Not financial advice.</p>
      <div class="spacer"></div>`);
    [...document.querySelectorAll("[data-chan]")].forEach(n => n.onclick = () => openChannel(n.dataset.chan));
    mountMarketBar();
  };
  function openIdeas() { go("signals"); } // alias for the Home link / notifications
  function channelCard(c) {
    const items = D.ideas.filter(i => i.channel === c.id);
    const latest = items[0];
    return `<button class="chan" data-chan="${c.id}">
      <div class="chan-mark ${c.tone}">${c.mark}</div>
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
        <div class="chan-mark ${c.tone} big">${c.mark}</div>
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
  function wireCommon() {
    [...document.querySelectorAll("[data-tab]")].forEach(n => n.addEventListener("click", e => { e.stopPropagation(); go(n.dataset.tab); }));
    [...document.querySelectorAll("[data-video]")].forEach(n => n.addEventListener("click", () => openPlayer(n.dataset.video)));
    [...document.querySelectorAll("[data-idea]")].forEach(n => n.addEventListener("click", () => openIdea(n.dataset.idea)));
    [...document.querySelectorAll("[data-act=notif]")].forEach(n => n.onclick = openNotifications);
    [...document.querySelectorAll("[data-act=ideas]")].forEach(n => n.onclick = openIdeas);
    [...document.querySelectorAll("[data-act=journal]")].forEach(n => n.onclick = () => { circleTab = "journal"; go("community"); });
    [...document.querySelectorAll("[data-act=profile]")].forEach(n => n.onclick = () => go("profile"));
    [...document.querySelectorAll("[data-act=search]")].forEach(n => n.onclick = () => toast("Search the library", "i-search"));
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
    [...el.querySelectorAll("[data-soc]")].forEach(b => b.onclick = enter);
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
    function finish() { el.style.transition = "opacity .4s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 420); renderTabbar(); go("home"); setTimeout(() => toast(`Welcome, ${D.user.first} 👋`, "i-check"), 500); }
    render();
  }

  function boot() {
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
