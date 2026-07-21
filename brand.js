/* ============================================================
   brand.js — THE ONLY FILE YOU EDIT TO RESKIN THIS APP.
   Loaded before data.js / charts.js / app.js.
   Change the values below, drop in a new logo, tweak data.js content,
   and deploy. See TEMPLATE.md for the full 10-minute checklist.
   ============================================================ */
window.BRAND = {
  // ---- identity ----  (EXAMPLE values — replace with the client's)
  name: "Blakey Trades",           // full brand name (shown everywhere)
  short: "BT",                     // 2-letter mark (avatars, channel badges)
  founder: "Arron Blakey",         // founder full name (signal author, host)
  founderFirst: "Arron",           // first name ("From Arron", "what Arron's doing")
  founderLast: "Blakey",           // surname (the "Blakey's Desk" founder view)
  founderInitials: "AB",           // founder avatar initials

  // ---- voice ----
  tagline: "Welcome to the future of trading.", // login hero headline
  blurb: "Blakey Trades — part of The Phantom Group. Live signals on Telegram, education, Zoom calls, and Signal IQ.", // login sub-line
  floor: "the floor",              // the community's word for itself ("the room", "the desk"…)
  parentGroup: "Phantom Group",    // co-brand parent (Welcome to BT deck, 2026-07)

  // ---- contact / links ----
  handle: "blakeytrades_support",  // Telegram support (t.me/<handle>)
  domain: "blakeytrades.com",      // used for calendar UIDs
  logo: "assets/logo-phantom.png?v=98",   // trimmed alpha crest (760×853 master)
  signalIqLogo: "assets/signal-iq-logo.png?v=92",
  broker: "Vantage",               // IB partner broker — VIP is verified against the founder's IB client list

  // ---- how VIP is funded: "ib" = free via broker partnership (IB rebates) · "paid" = subscription-only ----
  vipModel: "ib",

  // ---- market they trade (label only in fast-reskin mode) ----
  market: "XAUUSD",
  marketName: "Gold",
  ccy: "£",                        // currency members journal their profit/loss in ($, €, etc.)

  // ---- backend (MT5 screenshot import) ----
  api: {
    supabaseUrl: "https://rnoqrxdgzydkkfozvswe.supabase.co",
    supabaseAnonKey: "sb_publishable_w0wPbG3RBM3Jvnd6bCYaLw_yX8TSbVc",
    parseMt5Url: "https://rnoqrxdgzydkkfozvswe.supabase.co/functions/v1/parse-mt5-screenshot",
  },

  // ---- brand colour — the WHOLE metallic theme derives from this one hex ----
  accent: "#E0B23C",
};

/* ---- accent engine: derive the full gold/metal palette from BRAND.accent ---- */
(function () {
  var B = window.BRAND;
  function hexToRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h, s, l = (mx + mn) / 2, d = mx - mn; if (!d) { h = s = 0; } else { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h * 360, s, l]; }
  function hslToHex(h, s, l) { h /= 360; var r, g, b; function q(p, q2, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q2 - p) * 6 * t; if (t < 1 / 2) return q2; if (t < 2 / 3) return p + (q2 - p) * (2 / 3 - t) * 6; return p; } if (!s) { r = g = b = l; } else { var q2 = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q2; r = q(p, q2, h + 1 / 3); g = q(p, q2, h); b = q(p, q2, h - 1 / 3); } var to = function (x) { return ("0" + Math.round(x * 255).toString(16)).slice(-2); }; return "#" + to(r) + to(g) + to(b); }

  var rgb = hexToRgb(B.accent), hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  var H = hsl[0], S = hsl[1], L = hsl[2];
  var cl = function (x) { return Math.max(0, Math.min(1, x)); };
  var onInk = function (hex) { var c = hexToRgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) > 150 ? "#1A1206" : "#FFFFFF"; };

  // ---- DARK (default) derived palette ----
  var d_hi = hslToHex(H, cl(S + 0.05), cl(L + 0.14));
  var d_deep = hslToHex(H, cl(S + 0.02), cl(L - 0.17));
  var d_darkest = hslToHex(H, cl(S + 0.02), cl(L - 0.30));
  var d_lightest = hslToHex(H, cl(S - 0.10), cl(L + 0.34));
  var d_rgb = rgb.join(",");
  var d_foil = "linear-gradient(135deg," + d_darkest + " 0%," + B.accent + " 24%," + d_lightest + " 47%," + d_hi + " 58%," + d_deep + " 82%," + d_darkest + " 100%)";

  // ---- LIGHT derived palette (re-derived at legible lightness for a white background) ----
  var l_gold = hslToHex(H, cl(S + 0.05), 0.38);
  var l_hi = hslToHex(H, cl(S + 0.08), 0.30);
  var l_deep = hslToHex(H, cl(S + 0.05), 0.24);
  var l_darkest = hslToHex(H, cl(S + 0.02), 0.18);
  var l_mid = hslToHex(H, cl(S - 0.02), 0.52);
  var l_rgb = hexToRgb(l_gold).join(",");
  var l_foil = "linear-gradient(135deg," + l_darkest + " 0%," + l_gold + " 24%," + l_mid + " 47%," + l_gold + " 58%," + l_deep + " 82%," + l_darkest + " 100%)";

  // Inject a real stylesheet (NOT inline on <html>) so the [data-theme=light] block can win the cascade.
  var css =
    ":root{" +
      "--gold:" + B.accent + ";--gold-rgb:" + d_rgb + ";--gold-hi:" + d_hi + ";--gold-deep:" + d_deep + ";" +
      "--gold-soft:rgba(" + d_rgb + ",0.12);--gold-line:rgba(" + d_rgb + ",0.22);--gold-foil:" + d_foil + ";" +
      "--glow-gold:0 0 0 1px rgba(" + d_rgb + ",0.22),0 20px 60px -20px rgba(" + d_rgb + ",0.28);" +
      "--on-accent:" + onInk(B.accent) + ";}" +
    "[data-theme=\"light\"]{" +
      "--gold:" + l_gold + ";--gold-rgb:" + l_rgb + ";--gold-hi:" + l_hi + ";--gold-deep:" + l_deep + ";" +
      "--gold-soft:rgba(" + l_rgb + ",0.14);--gold-line:rgba(" + l_rgb + ",0.30);--gold-foil:" + l_foil + ";" +
      "--glow-gold:0 0 0 1px rgba(" + l_rgb + ",0.20),0 18px 50px -22px rgba(" + l_rgb + ",0.20);" +
      "--on-accent:" + onInk(l_gold) + ";}" +
    /* the live lobby stays a dark room in light mode too — keep the DARK gold inside it */
    "[data-theme=\"light\"] #live-lobby," +
    "[data-theme=\"light\"] #live-stage{" +
      "--gold:" + B.accent + ";--gold-rgb:" + d_rgb + ";--gold-hi:" + d_hi + ";--gold-deep:" + d_deep + ";" +
      "--gold-soft:rgba(" + d_rgb + ",0.14);--gold-line:rgba(" + d_rgb + ",0.30);--gold-foil:" + d_foil + ";" +
      "--glow-gold:0 0 0 1px rgba(" + d_rgb + ",0.22),0 20px 60px -20px rgba(" + d_rgb + ",0.28);" +
      "--on-accent:" + onInk(B.accent) + ";}";
  var st = document.createElement("style");
  st.id = "brand-accent";
  st.textContent = css;
  document.head.appendChild(st);

  // expose derived values for charts.js / canvas share-cards (canvas ignores CSS vars)
  B._accentHi = d_hi;
  B._accentDeep = d_deep;
  B._accentDarkest = d_darkest;

  if (B.name) try { document.title = B.name + " — Community"; } catch (e) {}
  try { var sm = document.querySelector(".stage-meta b"); if (sm) sm.textContent = (B.name || "").toUpperCase(); } catch (e) {}
})();
