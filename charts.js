/* Blakey Trades — canvas "living market" engine
   Renders ambient gold price lines, the live candle chart, and thumbnails. */
(function () {
  const GOLD = "#E0B23C", GOLD_HI = "#F3D277", UP = "#37BE7E", DOWN = "#F0565B";
  const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  // deterministic PRNG so thumbnails are stable per seed
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function makeSeries(n, seed, vol, start) {
    const r = rng(seed); const out = []; let price = start || 2940;
    for (let i = 0; i < n; i++) {
      const drift = (r() - 0.48) * vol;
      const o = price;
      const c = o + drift;
      const wick = vol * (0.4 + r() * 0.8);
      const h = Math.max(o, c) + r() * wick;
      const l = Math.min(o, c) - r() * wick;
      out.push({ o, h, l, c }); price = c;
    }
    return out;
  }

  function fit(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const par = cv.parentElement;
    let w = cv.clientWidth || (par && par.clientWidth) || 300;
    let h = cv.clientHeight || (par && par.clientHeight) || 150;
    // hard clamp — a chart canvas is never legitimately bigger than this. Guarantees we
    // can't run away past the browser's max canvas size (which renders as a broken-image
    // glyph). Belt-and-braces with the .market-bg width:100% CSS rule.
    w = Math.max(1, Math.min(Math.round(w), 2000));
    h = Math.max(1, Math.min(Math.round(h), 2000));
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function bounds(candles) {
    let hi = -Infinity, lo = Infinity;
    for (const c of candles) { if (c.h > hi) hi = c.h; if (c.l < lo) lo = c.l; }
    const pad = (hi - lo) * 0.12 || 1; return { hi: hi + pad, lo: lo - pad };
  }

  function drawCandles(ctx, w, h, candles, opts = {}) {
    ctx.clearRect(0, 0, w, h);
    const padL = opts.pad ? 0 : 0, padR = 0, padT = 8, padB = 8;
    const { hi, lo } = opts.bounds || bounds(candles);
    const Y = p => padT + (hi - p) / (hi - lo) * (h - padT - padB);
    const n = candles.length, cw = (w - padL - padR) / n, bw = Math.max(1.5, cw * 0.58);

    if (opts.grid) {
      ctx.strokeStyle = "rgba(237,237,232,0.05)"; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = padT + (h - padT - padB) * i / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }
    // level lines
    if (opts.levels) for (const lv of opts.levels) {
      const y = Y(lv.price); ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.strokeStyle = lv.type === "tp" ? "rgba(55,190,126,.6)" : lv.type === "sl" ? "rgba(240,86,91,.6)" : "rgba(224,178,60,.7)";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.restore();
    }
    for (let i = 0; i < n; i++) {
      const c = candles[i], x = padL + cw * i + cw / 2;
      const up = c.c >= c.o, col = up ? UP : DOWN;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(c.h)); ctx.lineTo(x, Y(c.l)); ctx.stroke();
      const yo = Y(c.o), yc = Y(c.c), top = Math.min(yo, yc), bh = Math.max(1.5, Math.abs(yc - yo));
      ctx.globalAlpha = up ? 1 : 0.92; ctx.fillRect(x - bw / 2, top, bw, bh); ctx.globalAlpha = 1;
    }
    // current price marker
    if (opts.marker !== false) {
      const last = candles[n - 1], y = Y(last.c);
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = "rgba(224,178,60,.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.restore();
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(w - 4, y, 2.6, 0, 7); ctx.fill();
    }
  }

  function drawAmbient(ctx, w, h, pts, off) {
    ctx.clearRect(0, 0, w, h);
    const lo = Math.min(...pts), hi = Math.max(...pts), rng2 = (hi - lo) || 1;
    const Y = p => h - 10 - (p - lo) / rng2 * (h - 26);
    const step = w / (pts.length - 2);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const x = i * step - off * step; const y = Y(pts[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    // area
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(224,178,60,0.22)"); grad.addColorStop(1, "rgba(224,178,60,0)");
    ctx.lineTo(w, h); ctx.lineTo(-step, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const x = i * step - off * step; const y = Y(pts[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6; ctx.shadowColor = "rgba(224,178,60,.5)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  }

  // ---- animation registry (single rAF; auto-cleans detached canvases) ----
  const active = new Set(); let raf = null, last = 0;
  function loop(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016; last = t;
    for (const c of [...active]) {
      if (!document.contains(c.cv)) { active.delete(c); continue; }
      try { c.tick(dt, t); } catch (e) { active.delete(c); }
    }
    if (active.size) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
  }
  function ensureLoop() { if (!raf && active.size) raf = requestAnimationFrame(loop); }
  function start(chart) { active.add(chart); try { chart.tick(0); } catch (e) {} ensureLoop(); } // immediate paint, then animate

  function initAmbient(cv) {
    const seed = +cv.dataset.seed || 99;
    let { ctx, w, h } = fit(cv);
    const r = rng(seed); const N = 60; let pts = [];
    let base = 2940; for (let i = 0; i < N; i++) { base += (r() - 0.46) * 6; pts.push(base); }
    if (reduce) { drawAmbient(ctx, w, h, pts, 0); return; }
    let off = 0, acc = 0;
    const chart = { cv, tick(dt) {
      acc += dt;
      if (acc > 0.10) { acc = 0; pts.push(pts[pts.length - 1] + (Math.sin(off / 3) * 2.4) + (rng(off * 7 + seed)() - 0.5) * 5); pts.shift(); }
      off = (off + dt * 0.9) % 1;
      { const want = Math.min(cv.clientWidth || w, 2000); if (want && Math.abs(want - w) > 1) { const f = fit(cv); ctx = f.ctx; w = f.w; h = f.h; } }
      drawAmbient(ctx, w, h, pts, off);
    } };
    start(chart);
  }

  function initLive(cv) {
    let { ctx, w, h } = fit(cv);
    let candles = makeSeries(34, (Date.now() & 0xffff) || 7, 7, 2946);
    const lv = (window.DATA && DATA.live) || {};
    const levels = [
      { price: parseFloat((lv.entry || "2946").replace(/,/g, "")), type: "e" },
      { price: parseFloat((lv.sl || "2934").replace(/,/g, "")), type: "sl" },
      { price: parseFloat((lv.tp || "2984").replace(/,/g, "")), type: "tp" },
    ];
    const bnd = (() => { const b = bounds(candles); const ps = levels.map(l => l.price); return { hi: Math.max(b.hi, ...ps) + 4, lo: Math.min(b.lo, ...ps) - 4 }; })();
    if (reduce) { drawCandles(ctx, w, h, candles, { grid: true, levels, bounds: bnd }); return; }
    let acc = 0; let cur = candles[candles.length - 1];
    const chart = { cv, tick(dt) {
      acc += dt;
      // wiggle the forming candle
      cur.c += (Math.random() - 0.5) * 1.1; cur.h = Math.max(cur.h, cur.c); cur.l = Math.min(cur.l, cur.c);
      if (acc > 1.25) { acc = 0; const o = cur.c; cur = { o, c: o + (Math.random() - 0.48) * 6, h: o, l: o }; cur.h = Math.max(o, cur.c) + Math.random() * 3; cur.l = Math.min(o, cur.c) - Math.random() * 3; candles.push(cur); candles.shift(); }
      { const want = Math.min(cv.clientWidth || w, 2000); if (want && Math.abs(want - w) > 1) { const f = fit(cv); ctx = f.ctx; w = f.w; h = f.h; } }
      drawCandles(ctx, w, h, candles, { grid: true, levels, bounds: bnd });
    } };
    start(chart);
  }

  function initThumb(cv) {
    const { ctx, w, h } = fit(cv);
    const seed = +cv.dataset.seed || 5;
    const candles = makeSeries(26, seed, 6, 2900 + seed);
    drawCandles(ctx, w, h, candles, { grid: false, marker: false });
  }

  // compact signal chart — bold gold area chart zoomed to the price action (levels are in the ticket below)
  function initSignal(cv) {
    const { ctx, w, h } = fit(cv);
    const seed = +cv.dataset.seed || 5;
    const e = parseFloat(cv.dataset.e) || 2940, sl = parseFloat(cv.dataset.sl) || 2930, tp = parseFloat(cv.dataset.tp) || 2960;
    const dir = tp >= e ? 1 : -1, risk = Math.abs(e - sl) || 8;
    // smooth path that trends from ~1R below entry to ~0.55R into profit (down for shorts)
    const r = rng(seed), n = 60, pts = [];
    const startP = e - dir * risk * 1.0, endP = e + dir * risk * 0.55;
    let v = startP;
    for (let i = 0; i < n; i++) { const t = i / (n - 1); const drift = startP + (endP - startP) * t; v += (drift - v) * 0.2 + (r() - 0.5) * risk * 0.32; pts.push(v); }
    pts[n - 1] = endP;
    // visible range = the price action only (so the line fills the frame), entry kept in view
    let lo = Math.min(e, ...pts), hi = Math.max(e, ...pts);
    const pad = (hi - lo) * 0.26 || 1; hi += pad; lo -= pad;
    const padT = 6, padB = 4, X = i => (w * i) / (n - 1), Y = p => padT + (hi - p) / (hi - lo) * (h - padT - padB);
    ctx.clearRect(0, 0, w, h);
    // subtle profit/risk tint split at entry
    const yE = Y(e);
    ctx.fillStyle = "rgba(55,190,126,.07)"; ctx.fillRect(0, 0, w, Math.max(0, yE));
    ctx.fillStyle = "rgba(240,86,91,.07)"; ctx.fillRect(0, Math.max(0, yE), w, h - Math.max(0, yE));
    // entry line
    ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(224,178,60,.7)"; ctx.beginPath(); ctx.moveTo(0, yE); ctx.lineTo(w, yE); ctx.stroke(); ctx.restore();
    // bold gradient area fill
    const grad = ctx.createLinearGradient(0, padT, 0, h);
    grad.addColorStop(0, "rgba(216,182,90,.38)"); grad.addColorStop(1, "rgba(216,182,90,0)");
    ctx.beginPath(); ctx.moveTo(0, Y(pts[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(X(i), Y(pts[i]));
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    // bold glowing price line
    ctx.save(); ctx.shadowColor = "rgba(216,182,90,.55)"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, Y(pts[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(X(i), Y(pts[i]));
    ctx.strokeStyle = GOLD_HI; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
    // glowing endpoint dot
    const ey = Y(pts[n - 1]);
    ctx.save(); ctx.shadowColor = GOLD_HI; ctx.shadowBlur = 11; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(w - 4, ey, 2.4, 0, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = GOLD_HI; ctx.beginPath(); ctx.arc(w - 4, ey, 3.4, 0, 7); ctx.globalAlpha = .35; ctx.fill(); ctx.restore();
  }

  function initPlayer(cv) {
    let { ctx, w, h } = fit(cv);
    const seed = +cv.dataset.seed || 11;
    let candles = makeSeries(40, seed, 7, 2930);
    if (reduce) { drawCandles(ctx, w, h, candles, { grid: true }); return; }
    let acc = 0, cur = candles[candles.length - 1];
    const chart = { cv, tick(dt) {
      acc += dt; cur.c += (Math.random() - 0.5) * 0.8; cur.h = Math.max(cur.h, cur.c); cur.l = Math.min(cur.l, cur.c);
      if (acc > 1.4) { acc = 0; const o = cur.c; cur = { o, c: o + (Math.random() - 0.47) * 5, h: o, l: o }; cur.h = Math.max(o, cur.c) + Math.random() * 2.5; cur.l = Math.min(o, cur.c) - Math.random() * 2.5; candles.push(cur); candles.shift(); }
      drawCandles(ctx, w, h, candles, { grid: true });
    } };
    start(chart);
  }

  function initIn(root) {
    (root || document).querySelectorAll("canvas[data-chart]:not([data-init])").forEach(cv => {
      const t = cv.dataset.chart;
      try {
        if (t === "ambient") initAmbient(cv);
        else if (t === "live") initLive(cv);
        else if (t === "thumb") initThumb(cv);
        else if (t === "signal") initSignal(cv);
        else if (t === "player") initPlayer(cv);
        else return;
        cv.setAttribute("data-init", "1");
      } catch (e) { /* canvas not laid out yet — leave unmarked so initIn can retry */ }
    });
  }

  // equity curve — cumulative R, drawn on demand (journal view)
  function drawEquity(cv, rs) {
    const { ctx, w, h } = fit(cv);
    ctx.clearRect(0, 0, w, h);
    let cum = 0; const pts = [0]; for (const r of rs) { cum += r; pts.push(cum); }
    const lo = Math.min(...pts, 0), hi = Math.max(...pts, 0.5), rng = (hi - lo) || 1;
    const span = pts.length - 1;
    const X = i => span === 0 ? w / 2 : 3 + i / span * (w - 6);
    const Y = v => h - 6 - (v - lo) / rng * (h - 16);
    ctx.strokeStyle = "rgba(237,237,232,0.09)"; ctx.lineWidth = 1;
    const zy = Y(0); ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy); ctx.stroke();
    ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
    ctx.lineTo(X(pts.length - 1), h); ctx.lineTo(X(0), h); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(224,178,60,0.3)"); g.addColorStop(1, "rgba(224,178,60,0)");
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
    ctx.strokeStyle = "#E0B23C"; ctx.lineWidth = 2; ctx.shadowColor = "rgba(224,178,60,.5)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    const lx = X(pts.length - 1), ly = Y(pts[pts.length - 1]);
    ctx.fillStyle = "#F3D277"; ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, 7); ctx.fill();
  }

  window.Charts = { initIn, drawEquity };
})();
