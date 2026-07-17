/* Blakey Trades — canvas "living market" engine
   Renders ambient gold price lines, the live candle chart, and thumbnails. */
(function () {
  const _BR = window.BRAND || {};
  const _rgb = function (h) { h = (h || "#E0B23C").replace("#", ""); return parseInt(h.slice(0, 2), 16) + "," + parseInt(h.slice(2, 4), 16) + "," + parseInt(h.slice(4, 6), 16); };
  const GOLD_RGB = _rgb(_BR.accent), GOLD = _BR.accent || "#E0B23C", GOLD_HI = _BR._accentHi || "#F3D277", UP = "#3FBF7F", DOWN = "#F0565B";
  const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  // deterministic PRNG so thumbnails are stable per seed
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function makeSeries(n, seed, vol, start) {
    const r = rng(seed); const out = []; let price = start || 4020;
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
      ctx.strokeStyle = lv.type === "tp" ? "rgba(63,191,127,.6)" : lv.type === "sl" ? "rgba(240,86,91,.6)" : "rgba(" + GOLD_RGB + ",.7)";
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
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = "rgba(" + GOLD_RGB + ",.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.restore();
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(w - 4, y, 2.6, 0, 7); ctx.fill();
    }
  }

  function drawAmbient(ctx, w, h, pts, off, cachedGrad) {
    ctx.clearRect(0, 0, w, h);
    const lo = Math.min(...pts), hi = Math.max(...pts), rng2 = (hi - lo) || 1;
    const Y = p => h - 10 - (p - lo) / rng2 * (h - 26);
    const step = w / (pts.length - 2);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const x = i * step - off * step; const y = Y(pts[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    // area (gradient allocation hoisted to the caller's cache — this runs every paint)
    let grad = cachedGrad;
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(" + GOLD_RGB + ",0.22)"); grad.addColorStop(1, "rgba(" + GOLD_RGB + ",0)");
    }
    ctx.lineTo(w, h); ctx.lineTo(-step, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const x = i * step - off * step; const y = Y(pts[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6; ctx.shadowColor = "rgba(" + GOLD_RGB + ",.5)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
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
    let base = 4020; for (let i = 0; i < N; i++) { base += (r() - 0.46) * 6; pts.push(base); }
    if (reduce) { drawAmbient(ctx, w, h, pts, 0); return; }
    let off = 0, acc = 0, fc = 0, pAcc = 1, grad = null; // pAcc starts past the threshold so start()'s tick(0) paints at once
    const chart = { cv, tick(dt) {
      acc += dt; pAcc += dt;
      if (acc > 0.10) { acc = 0; pts.push(pts[pts.length - 1] + (Math.sin(off / 3) * 2.4) + (rng(off * 7 + seed)() - 0.5) * 5); pts.shift(); }
      off = (off + dt * 0.9) % 1;
      // resize check throttled to every 32nd frame — clientWidth forces a layout flush
      if ((fc = (fc + 1) & 31) === 0) { const want = Math.min(cv.clientWidth || w, 2000); if (want && Math.abs(want - w) > 1) { const f = fit(cv); ctx = f.ctx; w = f.w; h = f.h; grad = null; pAcc = 1; } }
      if (pAcc < 0.05) return; // ~20fps repaint — indistinguishable for a slow drift, 1/3 the raster cost (shadowBlur is pricey)
      pAcc = 0;
      if (!grad) { grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, "rgba(" + GOLD_RGB + ",0.22)"); grad.addColorStop(1, "rgba(" + GOLD_RGB + ",0)"); }
      drawAmbient(ctx, w, h, pts, off, grad);
    } };
    start(chart);
  }

  function initLive(cv) {
    let { ctx, w, h } = fit(cv);
    let candles = makeSeries(34, (Date.now() & 0xffff) || 7, 7, 4026);
    // normalize the walk around the entry so candles + levels always share the frame, any seed
    const mean = candles.reduce((s, c) => s + c.c, 0) / candles.length, shift = (4026 - mean) * 0.85;
    candles.forEach(c => { c.o += shift; c.c += shift; c.h += shift; c.l += shift; });
    const lv = (window.DATA && DATA.live) || {};
    const levels = [
      { price: parseFloat((lv.entry || "4026").replace(/,/g, "")), type: "e" },
      { price: parseFloat((lv.sl || "4014").replace(/,/g, "")), type: "sl" },
      { price: parseFloat((lv.tp || "4064").replace(/,/g, "")), type: "tp" },
    ];
    const bnd = (() => { const b = bounds(candles); const ps = levels.map(l => l.price); return { hi: Math.max(b.hi, ...ps) + 4, lo: Math.min(b.lo, ...ps) - 4 }; })();
    const marks = (window.DATA && DATA.liveMarkup) || [];
    const padT = 8, padB = 8;
    const Y = p => padT + (bnd.hi - p) / (bnd.hi - bnd.lo) * (h - padT - padB);
    const ease = p => 1 - Math.pow(1 - p, 3);
    function pill(x, y, text) {
      ctx.save(); ctx.font = '600 9.5px "IBM Plex Mono",monospace';
      const tw = ctx.measureText(text).width, px = 7, ph = 17, r = 8.5;
      let bx = Math.min(Math.max(x, 4), w - tw - px * 2 - 4), by = Math.max(y - ph - 5, 3);
      ctx.beginPath();
      ctx.moveTo(bx + r, by); ctx.arcTo(bx + tw + px * 2, by, bx + tw + px * 2, by + ph, r); ctx.arcTo(bx + tw + px * 2, by + ph, bx, by + ph, r); ctx.arcTo(bx, by + ph, bx, by, r); ctx.arcTo(bx, by, bx + tw + px * 2, by, r); ctx.closePath();
      ctx.fillStyle = "rgba(8,8,12,.82)"; ctx.fill();
      ctx.strokeStyle = "rgba(" + GOLD_RGB + ",.45)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = GOLD_HI; ctx.fillText(text, bx + px, by + 12); ctx.restore();
    }
    function drawMarks(T) {
      for (const m of marks) {
        if (T < m.at) continue;
        const p = ease(Math.min((T - m.at) / 0.8, 1));
        if (m.kind === "zone") {
          const y1 = Y(m.to), y2 = Y(m.from), zw = w * p;
          ctx.fillStyle = "rgba(" + GOLD_RGB + "," + (0.10 * p) + ")"; ctx.fillRect(0, y1, zw, y2 - y1);
          ctx.strokeStyle = "rgba(" + GOLD_RGB + "," + (0.35 * p) + ")"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(zw, y1); ctx.moveTo(0, y2); ctx.lineTo(zw, y2); ctx.stroke();
          if (p === 1) pill(8, y1 + 24, m.label);
        } else if (m.kind === "hline") {
          const y = Y(m.p); ctx.save(); ctx.setLineDash([5, 4]);
          ctx.strokeStyle = "rgba(" + GOLD_RGB + "," + (0.75 * p) + ")"; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w * p, y); ctx.stroke(); ctx.restore();
          if (p === 1) pill(8, y + 26, m.label);
        } else if (m.kind === "trend") {
          const x1 = m.x1 * w, y1 = Y(m.p1), x2 = x1 + (m.x2 * w - x1) * p, y2 = y1 + (Y(m.p2) - y1) * p;
          ctx.save(); ctx.strokeStyle = "rgba(" + GOLD_RGB + ",.85)"; ctx.lineWidth = 1.6;
          ctx.shadowColor = "rgba(" + GOLD_RGB + ",.5)"; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
          if (p < 1) { ctx.fillStyle = GOLD_HI; ctx.beginPath(); ctx.arc(x2, y2, 2.8, 0, 7); ctx.fill(); }
          else pill((x1 + m.x2 * w) / 2 - 45, (y1 + Y(m.p2)) / 2 + 22, m.label);
        } else if (m.kind === "flag") {
          const x = (m.x || 0.74) * w, y = Y(m.p), pulse = 5 + Math.sin(T * 2.6) * 2;
          ctx.strokeStyle = "rgba(" + GOLD_RGB + "," + (0.5 * p) + ")"; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(x, y, pulse * p, 0, 7); ctx.stroke();
          ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x, y, 3 * p, 0, 7); ctx.fill();
          if (p === 1) pill(x + 12, y + 30, m.label);
        }
      }
    }
    if (reduce) { drawCandles(ctx, w, h, candles, { grid: true, levels, bounds: bnd }); drawMarks(1e4); return; }
    let acc = 0, dAcc = 0, fc = 0, T = 0; let cur = candles[candles.length - 1];
    const fired = new Set();
    const chart = { cv, tick(dt) {
      acc += dt; T += dt;
      for (const m of marks) if (T >= m.at && !fired.has(m)) { fired.add(m); try { cv.dispatchEvent(new CustomEvent("chart-mark", { detail: m, bubbles: true })); } catch (e) {} }
      // wiggle the forming candle — mean-reverts to the entry so the chart never drifts out of frame
      cur.c += (Math.random() - 0.5) * 1.1 + (4026 - cur.c) * 0.004; cur.h = Math.max(cur.h, cur.c); cur.l = Math.min(cur.l, cur.c);
      if (acc > 1.25) { acc = 0; const o = cur.c; cur = { o, c: o + (Math.random() - 0.48) * 6 + (4026 - o) * 0.05, h: o, l: o }; cur.h = Math.max(o, cur.c) + Math.random() * 3; cur.l = Math.min(o, cur.c) - Math.random() * 3; candles.push(cur); candles.shift(); }
      if ((fc = (fc + 1) & 31) === 0) { const want = Math.min(cv.clientWidth || w, 2000); if (want && Math.abs(want - w) > 1) { const f = fit(cv); ctx = f.ctx; w = f.w; h = f.h; } }
      // full-canvas redraw throttled to ~24fps — the only per-frame change is a 1px wiggle
      dAcc += dt; if (dAcc < 0.042) return; dAcc = 0;
      drawCandles(ctx, w, h, candles, { grid: true, levels, bounds: bnd });
      drawMarks(T);
    } };
    start(chart);
  }

  function initThumb(cv) {
    const { ctx, w, h } = fit(cv);
    const seed = +cv.dataset.seed || 5;
    const candles = makeSeries(26, seed, 6, 3980 + seed);
    drawCandles(ctx, w, h, candles, { grid: false, marker: false });
  }

  // compact signal chart — mini candlesticks framed to entry / SL / TP (broker-ticket vernacular)
  function drawSignalChart(ctx, w, h, candles, levels, bnd, dir) {
    const padT = 16, padB = 10, padL = 6, padR = 10;
    const { hi, lo } = bnd;
    const Y = p => padT + (hi - p) / (hi - lo) * (h - padT - padB);
    ctx.clearRect(0, 0, w, h);

    // faint horizontal grid
    ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (h - padT - padB) * i / 3;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    }

    const yE = Y(levels.find(l => l.type === "e").price);
    if (dir > 0) {
      ctx.fillStyle = "rgba(63,191,127,0.06)"; ctx.fillRect(padL, padT, w - padL - padR, Math.max(0, yE - padT));
      ctx.fillStyle = "rgba(240,86,91,0.06)"; ctx.fillRect(padL, yE, w - padL - padR, Math.max(0, h - padB - yE));
    } else {
      ctx.fillStyle = "rgba(63,191,127,0.06)"; ctx.fillRect(padL, yE, w - padL - padR, Math.max(0, h - padB - yE));
      ctx.fillStyle = "rgba(240,86,91,0.06)"; ctx.fillRect(padL, padT, w - padL - padR, Math.max(0, yE - padT));
    }

    // SL · Entry · TP guides (ticket below carries prices — lines only here)
    for (const lv of levels) {
      const y = Y(lv.price);
      ctx.save(); ctx.setLineDash(lv.type === "e" ? [5, 4] : [3, 4]); ctx.lineWidth = 1;
      ctx.strokeStyle = lv.type === "tp" ? "rgba(63,191,127,0.55)" : lv.type === "sl" ? "rgba(240,86,91,0.55)" : "rgba(" + GOLD_RGB + ",0.65)";
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke(); ctx.restore();
    }

    // the price path — one smooth glowing gold line through the closes (the app's chart language:
    // same family as the ambient background, the equity curve and the book card; tiny candles at
    // this size read as confetti, a single line reads as a story)
    const n = candles.length;
    if (n < 2) return;
    const px = i => padL + (w - padL - padR) * (i / (n - 1));
    const pts = candles.map((c, i) => ({ x: px(i), y: Y(c.c) }));

    const tracePath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < n - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.quadraticCurveTo(pts[n - 1].x, pts[n - 1].y, pts[n - 1].x, pts[n - 1].y);
    };

    // soft area fill under (over, for shorts) the path
    tracePath();
    ctx.lineTo(pts[n - 1].x, h - padB); ctx.lineTo(pts[0].x, h - padB); ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
    grad.addColorStop(0, "rgba(" + GOLD_RGB + ",0.16)");
    grad.addColorStop(1, "rgba(" + GOLD_RGB + ",0)");
    ctx.fillStyle = grad; ctx.fill();

    // the line itself, with the brand's soft glow
    tracePath();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(" + GOLD_RGB + ",.45)"; ctx.shadowBlur = 7;
    ctx.stroke(); ctx.shadowBlur = 0;

    // current price: dashed tick + bright endpoint dot
    const yLast = pts[n - 1].y;
    ctx.strokeStyle = "rgba(" + GOLD_RGB + ",0.4)"; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, yLast); ctx.lineTo(w - padR, yLast); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(" + GOLD_RGB + ",0.28)"; ctx.beginPath(); ctx.arc(pts[n - 1].x, yLast, 6, 0, 7); ctx.fill();
    ctx.fillStyle = GOLD_HI; ctx.beginPath(); ctx.arc(pts[n - 1].x, yLast, 2.8, 0, 7); ctx.fill();
  }

  // deterministic candle narrative for a signal — shared by the mini chart and the replay
  function buildSignalSeries(seed, e, sl, tp, dir) {
    const risk = Math.abs(e - sl) || 8;
    const r = rng(seed);
    const n = 28;
    const levels = [{ price: e, type: "e" }, { price: sl, type: "sl" }, { price: tp, type: "tp" }];

    // narrative: probe toward SL, reclaim entry, push into profit (mirrored for shorts)
    const candles = [];
    let price = e - dir * risk * 0.35;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let anchor;
      if (t < 0.35) anchor = e - dir * risk * (0.55 - t * 0.4);
      else if (t < 0.55) anchor = e - dir * risk * 0.08 + (e - (e - dir * risk * 0.55)) * ((t - 0.35) / 0.2);
      else anchor = e + dir * risk * 0.15 + (tp - e) * 0.35 * ((t - 0.55) / 0.45);
      const noise = (r() - 0.5) * risk * 0.14;
      const o = price;
      const c = o + (anchor - o) * 0.38 + noise;
      const wick = risk * (0.08 + r() * 0.12);
      candles.push({ o, c, h: Math.max(o, c) + wick * r(), l: Math.min(o, c) - wick * r() });
      price = c;
    }
    candles[n - 1].c = e + dir * risk * 0.42;
    candles[n - 1].o = candles[n - 2].c;
    candles[n - 1].h = Math.max(candles[n - 1].o, candles[n - 1].c) + risk * 0.06;
    candles[n - 1].l = Math.min(candles[n - 1].o, candles[n - 1].c) - risk * 0.04;

    const pad = risk * 0.22;
    const bnd = {
      hi: Math.max(e, tp, sl, ...candles.map(c => c.h)) + pad,
      lo: Math.min(e, tp, sl, ...candles.map(c => c.l)) - pad,
    };
    return { candles, levels, bnd };
  }

  function initSignal(cv) {
    const { ctx, w, h } = fit(cv);
    const s = buildSignalSeries(+cv.dataset.seed || 5, parseFloat(cv.dataset.e) || 4020,
      parseFloat(cv.dataset.sl) || 4010, parseFloat(cv.dataset.tp) || 4040, cv.dataset.dir === "short" ? -1 : 1);
    drawSignalChart(ctx, w, h, s.candles, s.levels, s.bnd, cv.dataset.dir === "short" ? -1 : 1);
  }

  // signal replay — same deterministic series, drawn progressively; app drives it via drawAt(0..1)
  function initReplay(cv, o) {
    const { ctx, w, h } = fit(cv);
    const s = buildSignalSeries(o.seed, o.e, o.sl, o.tp, o.dir);
    const n = s.candles.length;
    function drawAt(p) {
      p = Math.max(0.05, Math.min(1, p));
      const k = Math.max(2, Math.ceil(n * p));
      drawSignalChart(ctx, w, h, s.candles.slice(0, k), s.levels, s.bnd, o.dir);
    }
    drawAt(0.05);
    return { drawAt, n };
  }

  function initPlayer(cv) {
    let { ctx, w, h } = fit(cv);
    const seed = +cv.dataset.seed || 11;
    let candles = makeSeries(40, seed, 7, 2930);
    if (reduce) { drawCandles(ctx, w, h, candles, { grid: true }); return; }
    let acc = 0, dAcc = 0, cur = candles[candles.length - 1];
    const chart = { cv, tick(dt) {
      acc += dt; cur.c += (Math.random() - 0.5) * 0.8; cur.h = Math.max(cur.h, cur.c); cur.l = Math.min(cur.l, cur.c);
      if (acc > 1.4) { acc = 0; const o = cur.c; cur = { o, c: o + (Math.random() - 0.47) * 5, h: o, l: o }; cur.h = Math.max(o, cur.c) + Math.random() * 2.5; cur.l = Math.min(o, cur.c) - Math.random() * 2.5; candles.push(cur); candles.shift(); }
      dAcc += dt; if (dAcc < 0.042) return; dAcc = 0;
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
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(" + GOLD_RGB + ",0.3)"); g.addColorStop(1, "rgba(" + GOLD_RGB + ",0)");
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.shadowColor = "rgba(" + GOLD_RGB + ",.5)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    const lx = X(pts.length - 1), ly = Y(pts[pts.length - 1]);
    ctx.fillStyle = GOLD_HI; ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, 7); ctx.fill();
  }

  window.Charts = { initIn, drawEquity, initReplay };
})();
