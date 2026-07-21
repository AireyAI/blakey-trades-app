/* Content data — realistic, gold/XAUUSD flavoured. Edit this file to swap a
   community's channels, hub(s), testimonials, schedule & videos. Founder/brand
   names come from BRAND (brand.js), which loads before this file. */
window.DATA = {
  user: {
    name: "Jordan Hale", first: "Jordan", handle: "@jhale_fx", initials: "JH",
    level: 7, levelName: "Disciplined", xp: 2840, xpNext: 3500,
    streak: 18, winRate: 64, rr: 2.7, sessions: 41,
  },

  live: {
    title: "Live Trading Room",   // not shown as the call name anymore — the live call comes from schedule[] via liveCallInfo()
    host: BRAND.founder, hostInitials: BRAND.founderInitials, hostRole: "Founder",
    watchers: 1247,
    startsIn: 732,            // seconds → drives the Home countdown
    session: "London",
    pair: "XAUUSD",
    entry: "4,026.50", sl: "4,014.00", tp: "4,064.00", bias: "Long bias",
  },

  // founder chart markup — timed annotations "drawn" on the live chart, synced to the room narrative.
  // kind: zone (price band) | hline (level) | trend (drawn line, x as width fractions) | flag (pulse marker)
  liveMarkup: [
    { at: 2.2,  kind: "zone",  from: 4016, to: 4026, label: "Demand block", chip: "Demand block · 4,016–4,026" },
    { at: 7.5,  kind: "hline", p: 4045, label: "Partials 4,045", chip: "Partials level · liquidity above 4,045" },
    { at: 13,   kind: "trend", x1: 0.06, p1: 4049, x2: 0.60, p2: 4028, label: "Let it come to you", chip: "Pullback path — let it come to you" },
    { at: 18.5, kind: "flag",  p: 4026.5, x: 0.74, label: "4,026.5 ✓", chip: "Long taken · 4,026.5" },
  ],

  // weekly Zoom timetable — source: Arron's Welcome to BT PDF (2026-07). Times = UK.
  schedule: [
    { day:"Mon", time:"18:00", at:"6:00 PM", session:"New Starter Call", host:"Nick", theme:"Beginners · welcome, getting started, community overview" },
    { day:"Mon", time:"19:00", at:"7:00 PM", session:"New Starter Charts", host:"Sean", theme:"TradingView · build a chart · key points in the market" },
    { day:"Tue", time:"19:00", at:"7:00 PM", session:"Market Education", host:"The Oracle", theme:"Live analysis · trade execution · education & Q&A" },
    { day:"Wed", time:"19:00", at:"7:00 PM", session:"Live Trading on Signal IQ", host:"Mike", theme:"Signal IQ demos · platform walkthrough · tips & Q&A" },
    { day:"Thu", time:"19:00", at:"7:00 PM", session:"EMA Educational Training", host:"Oscar", theme:"EMA strategy · market analysis · trade management · Q&A" },
    { day:"Sun", time:"19:00", at:"7:00 PM", session:"Mindset", host:"Arron", theme:"Weekly outlook · community updates · trading psychology" },
  ],

  // Welcome to BT / Phantom Group orientation (PDF inventory → app)
  welcome: {
    disclaimer: "Nothing in here is given as financial advice.",
    intro: "Whether you are completely new to trading or already have some experience, the goal here is simple: learn, improve and become more consistent over time.",
    pillars: [
      "Live Trade Signals",
      "Education & Training",
      "Zoom Calls",
      "Community Support",
      "Trading Tools & Systems",
      "Beginner Guidance",
    ],
    groupsIntro: "Now you have started your journey with Phantom Group, you will be added to the main Phantom Group, which is split into the subgroups below.",
    subgroups: [
      { name: "Announcements", gate: null },
      { name: "Members area", gate: null },
      { name: "Institutional Order-flow", gate: "confident" },
      { name: "High RR", gate: "confident" },
      { name: "RR Trader", gate: "confident" },
      { name: "Market Maker", gate: "confident" },
      { name: "EMA Trader", gate: null },
      { name: "Zoom Calls / Live Streams", gate: null },
      { name: "Education", gate: null },
    ],
    membersArea: {
      title: "Members Area 2.0",
      body: "Your central hub for everything happening within the community — announcements, company updates, competitions, events and the latest news.",
    },
    roomCards: [
      { title: "High RR", gate: "confident", body: "High risk-to-reward opportunities via market structure, supply & demand zones, fair value gaps (FVG), inverse FVGs and SMT divergence." },
      { title: "RR Trader", gate: "confident", body: "High-quality setups with favourable risk-to-reward — disciplined, high-probability signals throughout the trading day." },
      { title: "Education", gate: null, body: "Step-by-step training, chart analysis and strategies so you become a confident, independent trader at your own pace." },
    ],
    signalIq: {
      title: "Signal IQ",
      tagline: "The FUTURE of trading.",
      body: "Exclusive software with powerful data and AI technology. It helps identify high-probability opportunities while removing emotion from the decision — so you can trade 24/7 when it suits you. Included FREE with every Blakey Trades membership, with full training and ongoing support.",
    },
    finalMessage: "Success in trading doesn't come from chasing every opportunity. It comes from discipline, consistency and trusting the process. Make the most of every resource — attend the live calls, ask questions, and keep learning. Welcome to Blakey Trades × Phantom Group.",
  },

  // Home stats
  homeStats: [
    { ic:"flame", value:"18", label:"Day streak" },
    { ic:"target", value:"64%", label:"Win rate" },
    { ic:"chart", value:"2.7R", label:"Avg R:R" },
  ],

  // neutral fallback only — the real brief is derived live from spot gold + the economic calendar (see briefData() in app.js)
  morningBrief: {
    bias: "Loading",
    headline: "Mapping today's gold session…",
    points: [
      { ic:"i-dollar", label:"Spot gold", text:"Fetching the live price…" },
      { ic:"i-target", label:"Key levels", text:"Calculating from spot…" },
      { ic:"i-cal", label:"On watch", text:"Checking today's economic calendar…" },
    ],
  },

  // each idea belongs to a Telegram channel (channel id) — see `channels` below
  ideas: [
    // VIP Trader — flagship gold day calls (Arron's "Personal Trade Idea" format: entry range, SL→BE, TP ladder)
    { id:"i1", channel:"vip", pair:"XAUUSD", dir:"long", session:"London", time:"Today · 08:14",
      entry:"4,026.50", sl:"4,014.00", tp:"4,064.00", rr:"3.0", status:"running",
      entryRange:"4,024–4,028", slBe:"4,031", tps:["4,035","4,042","4,049","4,056","4,064","OPEN 🚀"],
      updates:["Buying now @ 4,026","+9 pips — SL to BE 🔒","TP1 hit ✅ +9 pips"],
      note:"Reclaimed the London low and held the 4,025 demand block. Continuation into the New York liquidity above 4,060. Risk defined below structure." },
    { id:"i2", channel:"vip", pair:"XAUUSD", dir:"short", session:"New York", time:"Yesterday · 14:40",
      entry:"4,048.00", sl:"4,057.00", tp:"4,021.00", rr:"3.0", status:"tp", result:"+27.0",
      entryRange:"4,046–4,050", slBe:"4,043", tps:["4,041","4,036","4,031","4,026","4,021","OPEN 🚀"],
      updates:["Selling now @ 4,048","+20 pips — SL to BE","TP4 hit ✅","Closed +27 pips 🎯"],
      note:"Swept Asian highs and rejected the weekly supply at 4,050. Clean lower-high on the 15m gave the entry. Banked at the prior day open." },
    { id:"i4", channel:"vip", pair:"XAUUSD", dir:"long", session:"London", time:"Mon · 09:20",
      entry:"4,002.40", sl:"3,994.00", tp:"4,028.00", rr:"3.0", status:"tp", result:"+25.6",
      entryRange:"4,000–4,004", slBe:"4,007", tps:["4,010","4,016","4,022","4,028","4,034","OPEN 🚀"],
      updates:["Buying now @ 4,002","+8 pips — SL to BE","Banked +25.6 pips ✅"],
      note:"Textbook break-and-retest of the 4,000 level off the daily trend. Patience on the retest paid." },
    { id:"i3", channel:"vip", pair:"XAUUSD", dir:"long", session:"Asia", time:"Yesterday · 02:05",
      entry:"4,031.20", sl:"4,022.00", tp:"4,058.00", rr:"2.9", status:"sl", result:"-9.2",
      entryRange:"4,029–4,033", slBe:"4,036", tps:["4,040","4,047","4,054","4,058","4,065","OPEN 🚀"],
      updates:["Buying now @ 4,031","Reclaim failed — NY reversal swept it","Stopped 4,022. Full -1R, no revenge — risk was defined below structure so it costs one unit and no more. This is the job."],
      note:"The reclaim failed and the New York reversal took the stop. A clean -1R loss — posted live, never deleted. Managing losing ideas is the edge, not avoiding them." },
    // Gold Trades — multi-day
    { id:"s1", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Tue",
      entry:"3,985.00", sl:"3,952.00", tp:"4,090.00", rr:"3.2", status:"running",
      note:"Weekly demand reaction. Swing target the upper liquidity — hold 3–5 days, trail under daily structure." },
    { id:"s2", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Last week",
      entry:"3,920.00", sl:"3,888.00", tp:"4,012.00", rr:"2.9", status:"tp", result:"+92.0",
      note:"Higher-low off the weekly trendline. Banked the full swing into round-number supply." },
    // Institutional Order-Flow — supply/demand zones
    { id:"z1", channel:"zones", pair:"XAUUSD", dir:"long", session:"Demand zone", time:"Active",
      entry:"4,025.00", sl:"4,013.00", tp:"4,052.00", rr:"2.2", status:"running",
      note:"Primary demand zone 4,024–4,026 for the session. Wait for a reaction + confirmation. React, don't predict." },
    { id:"z2", channel:"zones", pair:"XAUUSD", dir:"short", session:"Supply zone", time:"Active",
      entry:"4,063.00", sl:"4,074.00", tp:"4,035.00", rr:"2.5", status:"running",
      note:"Weekly supply 4,062–4,065 overhead. Watch for rejection wicks into this zone for shorts." },
    // SN Scalps — fast intraday
    { id:"sc0", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"3m ago",
      entry:"4,039.50", sl:"4,036.50", tp:"4,046.00", rr:"2.2", status:"running", result:"Running",
      note:"M1 break-and-retest off the NY open. In on the reclaim, targeting the session high." },
    { id:"sc1", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"12m ago",
      entry:"4,031.00", sl:"4,028.00", tp:"4,038.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"M1 break of structure off the NY open. Quick scalp, partials fast." },
    { id:"sc2", channel:"mm", pair:"XAUUSD", dir:"short", session:"London scalp", time:"40m ago",
      entry:"4,043.00", sl:"4,046.00", tp:"4,036.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"Liquidity grab above the session high, scalped the snap-back." },
    { id:"sc3", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"1h ago",
      entry:"4,037.50", sl:"4,035.00", tp:"4,043.00", rr:"2.2", status:"sl", result:"-2.5",
      note:"VWAP reclaim rolled over and stopped for -2.5. Scalping is a game of small losses and bigger winners — this is one of the small ones, taken without hesitation." },
    // EMA Trader — systematic EMA entries (+ Market Maker shares this pool)
    { id:"iq0", channel:"iq", pair:"XAUUSD", dir:"long", session:"Auto", time:"09:00",
      entry:"4,041.00", sl:"4,031.00", tp:"4,061.00", rr:"2.0", status:"running", result:"Running",
      note:"Mechanical signal — trend + momentum filter aligned long. No discretion, fixed 2R target." },
    { id:"iq1", channel:"iq", pair:"XAUUSD", dir:"long", session:"Auto", time:"06:00",
      entry:"4,020.00", sl:"4,010.00", tp:"4,040.00", rr:"2.0", status:"tp", result:"+20.0",
      note:"Mechanical signal — trend + momentum filter aligned long. No discretion, fixed 2R target." },
    { id:"iq2", channel:"mm", pair:"XAUUSD", dir:"short", session:"Auto", time:"03:00",
      entry:"4,052.00", sl:"4,062.00", tp:"4,032.00", rr:"2.0", status:"sl", result:"-10.0",
      note:"Mechanical short on a momentum flip. Stopped — the system takes every valid signal; the edge plays out over the sample." },
  ],

  // Telegram channels the signals are posted to (mirrored into the app)
  // the six REAL Telegram groups (Kyle, 2026-07-11) — ids unchanged so signal wiring holds:
  // vip=VIP Trader (flagship, gated) · swing=Gold Trades · zones=Institutional Order-Flow ·
  // scalps=SN Scalps · iq=EMA Trader · mm=Market Maker
  channels: [
    { id:"vip", name:"VIP Trader", handle:"@viptrader", mark:"📈", img:"assets/channels/vip.webp", tone:"gold", members:"3,210", today:3, desc:"Flagship gold day-trade calls — full entry, stop and targets." },
    { id:"zones", name:"Institutional Order-Flow", handle:"@instorderflow", mark:"🔥", img:"assets/channels/orderflow.webp", tone:"quiet", members:"2,480", today:2, gate:"confident",
      desc:"High-probability setups by following institutional market activity — plus educational videos. Only use this group when you are confident." },
    { id:"swing", name:"Gold Trades", handle:"@goldtrades", mark:"💎", img:"assets/channels/goldtrades.webp", tone:"quiet", members:"1,940", today:1, desc:"Core gold setups and the weekly recap — the bigger moves." },
    { id:"scalps", name:"SN Scalps", handle:"@snscalps", mark:"🏆", img:"assets/channels/scalps.webp", tone:"quiet", members:"1,510", today:4, desc:"Fast intraday scalps — in and out, tight risk." },
    { id:"mm", name:"Market Maker", handle:"@marketmakertrades", mark:"💹", img:"assets/channels/marketmaker.webp", tone:"quiet", members:"1,320", today:2, gate:"confident",
      desc:"Market structure, liquidity and direction — larger moves with disciplined risk. Only use this group when you are confident." },
    { id:"iq", name:"EMA Trader", handle:"@ematrader", mark:"💻", img:"assets/channels/ematrader.webp", tone:"quiet", members:"1,120", today:3, host:"Oscar",
      desc:"Led by Oscar — live setups up to ~4 hours a day. He explains why he's taking each trade, how he manages risk, and manages from entry to exit. EMA = Exponential Moving Average." },
  ],

  categories: ["For you","Market Analysis","Mindset","Beginner Path","Session Replays","Risk"],

  featured: {
    title:"The Gold Playbook: Reading London Liquidity",
    cat:"Market Analysis", dur:"42:18", date:"2 days ago", views:"3,140",
    img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=1000&h=520&fit=crop&q=78",
    note: BRAND.founderFirst + " walks the full London-session framework — liquidity sweeps, the 3 entry models, and where most traders get trapped." },

  videos: [
    { id:"v1", title:"London Liquidity, Explained", cat:"Market Analysis", dur:"42:18", date:"2d ago", views:"3,140", progress:0.34, seed:11, img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
    { id:"v2", title:"Why Your Stops Keep Getting Hit", cat:"Risk", dur:"18:50", date:"4d ago", views:"2,610", progress:0, seed:23, img:"https://images.unsplash.com/photo-1689732888407-310424e3a372?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
    { id:"v3", title:"The Trader's Mind: Patience Under Pressure", cat:"Mindset", dur:"27:05", date:"6d ago", views:"4,002", progress:0.72, seed:31, img:"https://images.unsplash.com/photo-1624461145824-d9d44d85cc77?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
    { id:"v4", title:"Building Your First Gold Watchlist", cat:"Beginner Path", dur:"15:32", date:"1w ago", views:"1,980", progress:0, seed:7, img:"https://images.unsplash.com/photo-1616783943928-32f4e1e16147?w=600&h=360&fit=crop&q=72", host: BRAND.short + " Team" },
    { id:"v5", title:"New York Session Replay — Live Calls", cat:"Session Replays", dur:"58:44", date:"1w ago", views:"2,233", progress:0.12, seed:42, img:"https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
    { id:"v6", title:"Risk:Reward Done Properly", cat:"Risk", dur:"21:10", date:"1w ago", views:"3,560", progress:0, seed:18, img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=600&h=360&fit=crop&q=72", host: BRAND.short + " Team" },
    { id:"v7", title:"Reading the Daily Before You Trade", cat:"Market Analysis", dur:"33:27", date:"2w ago", views:"2,870", progress:0, seed:55, img:"https://images.unsplash.com/photo-1689732888407-310424e3a372?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
    { id:"v8", title:"From Revenge Trading to Routine", cat:"Mindset", dur:"24:48", date:"2w ago", views:"3,910", progress:0, seed:64, img:"https://images.unsplash.com/photo-1624461145824-d9d44d85cc77?w=600&h=360&fit=crop&q=72", host:BRAND.founder },
  ],

  traderOfWeek: {
    name:"Priya Nair", handle:"@priya.trades", initials:"PN",
    ret:"+8.4R", trades:"11", winRate:"78%",
    quote:"Stopped chasing every candle. Took 3 A+ setups all week and let them run. The plan works when you do." },

  leaderboard: [
    { rank:1, name:"Priya Nair", handle:"@priya.trades", initials:"PN", pts:"4,820", delta:"+3", top:true },
    { rank:2, name:"Marcus Webb", handle:"@mwebb", initials:"MW", pts:"4,610", delta:"+1", top:true },
    { rank:3, name:"Sofia Romano", handle:"@sofia.r", initials:"SR", pts:"4,275", delta:"-1", top:true },
    { rank:4, name:"Daniel Okafor", handle:"@danfx", initials:"DO", pts:"3,990", delta:"+2" },
    { rank:5, name:"Aisha Khan", handle:"@aisha.k", initials:"AK", pts:"3,840", delta:"+5" },
    { rank:6, name:"Tom Bryce", handle:"@tbryce", initials:"TB", pts:"3,610", delta:"0" },
    { rank:7, name:"Jordan Hale", handle:"@jhale_fx", initials:"JH", pts:"3,480", delta:"+4", me:true },
    { rank:8, name:"Lena Fischer", handle:"@lenaf", initials:"LF", pts:"3,205", delta:"-2" },
  ],

  posts: [
    { author:"Marcus Webb", initials:"MW", time:"12m", featured:false,
      body:"Followed the London plan to the tick this morning. +2.1R on gold, out before the lunchtime chop. The discipline framework from Tuesday's call is everything. 🙏",
      tag:{ pair:"XAUUSD", dir:"long", rr:"+2.1R" }, likes:84, comments:12, liked:false },
    { author:"Aisha Khan", initials:"AK", time:"48m", featured:false,
      body:"3 weeks no revenge trades. Journaling every entry like " + BRAND.founderFirst + " said. Small wins compound. Thank you to this community for keeping me accountable.",
      likes:142, comments:23, liked:true },
    { author:"Daniel Okafor", initials:"DO", time:"2h", featured:false,
      body:"Anyone else catch the NY short? That supply zone was textbook. Banked +1.8R and called it a day. Process over profit.",
      tag:{ pair:"XAUUSD", dir:"short", rr:"+1.8R" }, likes:67, comments:9, liked:false },
  ],

  badges: [
    { ic:"i-flame", name:"18-day streak", on:true },
    { ic:"i-target", name:"60% win rate", on:true },
    { ic:"i-book", name:"Journaled 40", on:true },
    { ic:"i-live", name:"Live regular", on:true },
    { ic:"i-trophy", name:"Top 10", on:true },
    { ic:"i-chart", name:"100 trades", on:false },
    { ic:"i-learn", name:"Course grad", on:false },
  ],

  hubs: [
    { id:"uk", city:"Worksop", country:"England, UK", flag:"🇬🇧",
      img:"https://images.unsplash.com/photo-1744782211816-c5224434614f?w=1000&h=440&fit=crop&q=80",
      tint:"linear-gradient(160deg,#10141d,#0a0a0e)", real:true,
      tagline:"A dedicated space to learn, train & grow",
      address:"17 Central Avenue, Worksop, S80 1EJ",
      hours:"Mon–Thu · 9am–5pm", access:"Members only", phone:"+44 7347 648721",
      map:"https://www.google.com/maps/search/?api=1&query=17+Central+Avenue+Worksop+S80+1EJ",
      schedule:[
        { day:"Monday", time:"9am – 7pm", items:["Intro to trading basics","Understanding risk management","How to read the signals","7–9pm — new-starter sign-ups & beginner training"] },
        { day:"Tuesday", time:"9am – 5pm", items:["Trading strategies","Entry, SL & TP breakdowns","Live chart analysis","Trade examples + full breakdown"] },
        { day:"Wednesday", time:"9am – 5pm", items:["Intro to trading basics","Understanding risk management","Reading simple setups","Q&A for new starters"] },
        { day:"Thursday", time:"9am – 5pm", items:["Live market sessions & reactions","Reviewing the week's trades","What went right / wrong","Adjustments for the week ahead"] },
        { day:"Friday", time:"Closed", items:["Rest day — recharge for next week"] },
      ],
      oneToOne:["Personalised support","Strategy refinement","Risk management & mindset","Help with execution & consistency","By request / booking only"],
      faces:["MW","SR","TB","AK"] },
    { id:"dubai", city:"Dubai", country:"United Arab Emirates", flag:"🇦🇪", img:"assets/hub-dubai.webp",
      tint:"linear-gradient(160deg,#1c1503,#0a0a0e)",
      event:{ d:"22", m:"Jul", title:"Gold Masterclass — Live Trading", time:"7:00pm · DIFC", }, going:164,
      faces:["PN","DO","LF","AB"] },
    { id:"ni", city:"Belfast", country:"Northern Ireland", flag:"🇬🇧", img:"assets/hub-belfast.webp",
      tint:"linear-gradient(160deg,#10140d,#0a0a0e)",
      event:{ d:"09", m:"Aug", title:"NI Traders Social & Q&A", time:"5:00pm · City Centre", }, going:96,
      faces:["TB","AK","MW","JH"] },
  ],

  journal: [
    { id:"j1", pair:"XAUUSD", dir:"long", r:420, lots:1.0, outcome:"win", session:"London", date:"Today", setup:"Reclaim & hold", channel:"VIP Trader", tags:["Followed plan","Patient"], note:"Waited for the London low to be reclaimed and held the 4,025 block before entering. Took partials at 4,045 and trailed the rest. Felt calm — no FOMO, executed the plan exactly." },
    { id:"j2", pair:"XAUUSD", dir:"short", r:600, lots:1.0, outcome:"win", session:"New York", date:"Yesterday", setup:"Supply rejection", channel:"VIP Trader", tags:["Followed plan","A+ setup"], note:"Clean lower-high into weekly supply at 4,050. Risk defined below structure, full target hit at the prior-day open. Textbook." },
    { id:"j3", pair:"XAUUSD", dir:"long", r:0, lots:0.5, outcome:"be", session:"Asia", date:"Yesterday", setup:"Range reversal", channel:"Order-Flow", tags:["Managed well"], note:"Took partials then trailed to breakeven before the NY reversal. No giveback — protected the account first." },
    { id:"j4", pair:"XAUUSD", dir:"long", r:-200, lots:1.0, outcome:"loss", session:"London", date:"Mon", setup:"Breakout", channel:"SN Scalps", tags:["Chased entry","FOMO"], note:"Entered late on the breakout instead of waiting for the retest. Got wicked out. Lesson: wait for the retest, every single time." },
    { id:"j5", pair:"XAUUSD", dir:"long", r:520, lots:1.0, outcome:"win", session:"London", date:"Mon", setup:"Break & retest", channel:"VIP Trader", tags:["Followed plan"], note:"Textbook break-and-retest of the 4,000 level off the daily trend. Patience on the retest paid." },
    { id:"j6", pair:"XAUUSD", dir:"short", r:300, lots:0.5, outcome:"win", session:"New York", date:"Fri", setup:"Liquidity grab", channel:"SN Scalps", tags:["Quick scalp"], note:"Faded the liquidity grab above the session high. In and out in 20 minutes, banked it." },
    { id:"j7", pair:"XAUUSD", dir:"long", r:-200, lots:0.5, outcome:"loss", session:"Asia", date:"Thu", setup:"Counter-trend", channel:"Off-plan", tags:["Off-plan","Counter-trend"], note:"Took a trade that wasn't on the plan, against the daily trend. Stopped out. This is exactly what the journal is for — name it, don't repeat it." },
  ],

  notifications: [
    { icon:"i-live", text:"Your next live call starts in 12 minutes", time:"now", unread:true, group:"Today", go:"live" },
    { icon:"i-chart", text:"New signal on Telegram — tap Signals to get onboarded", time:"08:14", unread:true, group:"Today", go:"signals" },
    { icon:"i-trophy", text:"You climbed to #6 on the weekly leaderboard", time:"1h ago", unread:true, group:"Today", go:"community" },
    { icon:"i-comment", text:"Marcus Webb replied to your post", time:"2h ago", unread:false, group:"Today", go:"community" },
    { icon:"i-play", text:"New replay added — New York Session", time:"Yesterday", unread:false, group:"Earlier", go:"learn" },
    { icon:"i-pin", text:"London meetup is in 3 days — you're going", time:"Yesterday", unread:false, group:"Earlier", go:"hubs" },
  ],

  // Live chat playback script (loops). host:true = Arron pinned style.
  chatScript: [
    { initials:BRAND.founderInitials, name:BRAND.founderFirst, host:true, text:"Morning all 👋 mapping the London open now — watch 4,025." },
    { initials:"MW", name:"Marcus", text:"Been waiting for this level all week 🔥" },
    { initials:"SR", name:"Sofia", text:"Volume picking up already" },
    { initials:"AK", name:"Aisha", text:"So this is the demand block from yesterday?" },
    { initials:BRAND.founderInitials, name:BRAND.founderFirst, host:true, text:"Exactly Aisha — reclaim + hold = our long. Stop below structure, never inside it." },
    { initials:"DO", name:"Daniel", text:"In at 4,026.5, stop 4,014 ✅" },
    { initials:"PN", name:"Priya", text:"Patience. Let it come to you 🧘" },
    { initials:"TB", name:"Tom", text:"This is why I show up live every day" },
    { initials:"LF", name:"Lena", text:"First green week thanks to these calls 🙌" },
    { initials:BRAND.founderInitials, name:BRAND.founderFirst, host:true, text:"Partials into 4,045, trail the rest. Protect the account first, profit second." },
    { initials:"AK", name:"Aisha", text:"Banked +1.4R already 💎" },
    { initials:"MW", name:"Marcus", text:"Clean. Textbook continuation." },
  ],

  // full country list for onboarding "where are you based?" — United Kingdom is the default
  countries: ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (Kinshasa)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"],

  // ── economic calendar (gold-impact news) ──
  calendar: [
    { day:"Today", time:"13:30", cur:"USD", impact:"high", event:"Core CPI m/m" },
    { day:"Today", time:"13:30", cur:"USD", impact:"high", event:"CPI y/y" },
    { day:"Today", time:"15:00", cur:"USD", impact:"med",  event:"Fed Williams Speaks" },
    { day:"Today", time:"08:00", cur:"GBP", impact:"low",  event:"BoE Bailey Speaks" },
    { day:"Tomorrow", time:"13:30", cur:"USD", impact:"med", event:"Unemployment Claims" },
    { day:"Tomorrow", time:"15:00", cur:"USD", impact:"high", event:"FOMC Member Speaks" },
    { day:"Friday", time:"13:30", cur:"USD", impact:"high", event:"Non-Farm Payrolls" },
    { day:"Friday", time:"13:30", cur:"USD", impact:"high", event:"Unemployment Rate" },
    { day:"Friday", time:"13:30", cur:"USD", impact:"med",  event:"Avg Hourly Earnings" },
  ],
  // ── gold price tool: live spot gold, priced in the community's currencies (UK / EU / Dubai) ──
  goldCurrencies: [
    { code:"GBP", name:"British Pound", flag:"🇬🇧", sym:"£" },
    { code:"EUR", name:"Euro", flag:"🇪🇺", sym:"€" },
    { code:"AED", name:"UAE Dirham", flag:"🇦🇪", sym:"AED " },
  ],
  // ── price alerts ──
  alerts: [
    { sym:"XAUUSD", cond:"above", price:"4,062.0", note:"Range cap — breakout watch", on:true },
    { sym:"XAUUSD", cond:"below", price:"4,025.0", note:"Demand zone", on:true },
    { sym:"DXY", cond:"below", price:"104.00", note:"Dollar weakness = gold tailwind", on:false },
  ],
  // ── academy learning paths ──
  paths: [
    { id:"found", name:"Foundations", level:"Beginner", lessons:8, done:0, color:"#3FBF7F", desc:"Markets, candles & risk basics — start here." },
    { id:"gold", name:"The Gold Playbook", level:"Core", lessons:10, done:0, color:BRAND.accent, desc:"Liquidity, the London open & the 3 entry models." },
    { id:"risk", name:"Risk & Psychology", level:"Core", lessons:7, done:0, color:"#6AA0FF", desc:"Position sizing, drawdown & the trader's mind." },
    { id:"pro", name:"Pro Execution", level:"Advanced", lessons:9, done:0, color:"#C06AFF", desc:"Scaling, sessions & a repeatable edge." },
  ],
  // ── written curriculum — one entry per lesson, same order/length as paths[].lessons ──
  curricula: {
    found: [
      { t:"What actually moves gold", mins:4, rule:"Check DXY and real yields before you check the chart.", body:[
        "Gold has no earnings and pays no dividend, so its price is driven by what it competes with: the US dollar and the interest you could earn holding dollars instead. When the dollar strengthens or real yields rise, holding gold costs you more in missed interest — price tends to fall. When yields drop or the dollar weakens, gold gets attractive fast.",
        "The second driver is fear. Gold is the market's insurance policy — wars, banking wobbles, inflation scares and central-bank buying all push money into it. That's why gold can rally on days when nothing on the chart explains it.",
        "Practical habit: before every session, glance at DXY (the dollar index) and the news calendar. If the dollar is flying, fighting it on a gold long is swimming upstream." ] },
      { t:"Reading a candlestick properly", mins:3, rule:"Wicks are rejection — the story is in what price refused to do.", body:[
        "Every candle answers four questions: where price opened, the highest it reached, the lowest it touched, and where it closed. The body shows commitment; the wicks show rejection — places price visited and got pushed away from.",
        "A long lower wick into a support zone means sellers tried to break it and buyers absorbed them. A full-bodied candle closing at its high means one side was in total control. Candles only mean something at a level — the same pattern in the middle of nowhere is noise.",
        "Stop memorising 40 pattern names. Learn to read one candle as a fight between buyers and sellers, and ask who won and where." ] },
      { t:"Support & resistance that actually holds", mins:4, rule:"Levels are zones, not lines — mark the area, not the pip.", body:[
        "A support or resistance level is simply a price where enough decisions were made last time that traders remember it. The market doesn't respect a line to the pip — it respects an area, usually a few dollars wide on gold.",
        "The strongest zones share three traits: they caused a sharp reaction before, they line up with a session high/low or the daily open, and they haven't been retested to death. Every retest consumes the orders sitting there — the fifth tap of a level is far weaker than the first.",
        "Mark fewer levels, wider. A chart with four meaningful zones beats a chart with twenty lines you don't believe in." ] },
      { t:"Trend, range, and when to stay out", mins:4, rule:"No higher-highs and no clean range? That's a no-trade regime.", body:[
        "Markets do three things: trend, range, and chop. A trend makes higher highs and higher lows (or the reverse). A range respects a ceiling and a floor. Chop does neither — and chop is where accounts die.",
        "Your first job each session isn't finding an entry, it's naming the regime. Trend days reward pullback entries and holding runners. Range days reward fading the extremes and taking profit early. Chop rewards the trader who closes the laptop.",
        "If you can't describe what price is doing in one sentence, you don't have a trade — you have a guess." ] },
      { t:"Timeframes: top-down in three steps", mins:4, rule:"Bias on the daily, story on the hourly, trigger on the small frame.", body:[
        "Every clean setup reads the same way top-down. The daily chart gives bias: is gold in premium or discount, and which side ran recently? The 1-hour gives structure: the zones, the liquidity, where the session is likely to reach.",
        "Only then do you drop to the 5-minute for the trigger — the reclaim, the rejection, the break-and-retest. Traders who live on the 1-minute see a hundred signals a day and none of them mean anything, because there's no context above them.",
        "Rule of thumb: your trigger timeframe should be roughly ten times smaller than your structure timeframe. H1 structure, M5 trigger." ] },
      { t:"Lots, pips & what a gold move costs", mins:3, rule:"On 1.00 lots, every $1 gold moves is $100 to your account.", body:[
        "XAUUSD is quoted as dollars per troy ounce, and a standard lot is 100 ounces. So a $1.00 move in the gold price is $100 on a 1.00-lot position, $10 on 0.10, $1 on 0.01. Burn that into memory — it's the maths behind every stop and target you'll ever place.",
        "A typical day-trade stop on gold might be $8–12 of price. On 1.00 lots that's $800–1,200 of risk. On 0.05 lots it's $40–60. Same trade, same chart — completely different consequence.",
        "The spread matters too: you enter paying it. On fast news it widens violently, which is one of several reasons news candles are for watching, not entering." ] },
      { t:"Stop-losses are the subscription fee", mins:3, rule:"Decide the invalidation before the entry — never after.", body:[
        "A stop-loss isn't an admission you might be wrong — it's the price of finding out. Every trade is a hypothesis: 'buyers should hold this zone.' The stop goes where that sentence stops being true, usually just beyond the zone or the swing that defined it.",
        "Placing stops by 'how much I'm willing to lose' instead of where the idea is invalid gets you stopped on noise, then watching price go your way without you. Size the position to fit the stop — never move the stop to fit the size.",
        "And once it's set, it's set. Widening a stop mid-trade is just paying more to stay wrong longer." ] },
      { t:"Your one-page trading plan", mins:5, rule:"If it's not written down, it's not a plan — it's a mood.", body:[
        "A trading plan fits on one page: the sessions you trade, the one or two setups you take, your risk per trade, your daily stop (the loss that ends the day), and the routine before and after each session.",
        "Its power is that it makes discipline checkable. 'Did I follow the plan?' becomes a yes/no question — which is exactly what your daily check-in and Friday Trader Score measure in this app.",
        "Start embarrassingly simple: one setup, one session, fixed risk. You can add sophistication once boring consistency is proven. Most traders try it the other way round and never get either." ] },
    ],
    gold: [
      { t:"The three sessions of a gold day", mins:5, rule:"Asia builds the range, London breaks it, New York decides if it was real.", body:[
        "Gold trades around the clock but it doesn't behave the same all day. Asia is usually quiet accumulation — a range forms, and its high and low become the first liquidity of the day.",
        "London opens with real volume and loves to sweep one side of the Asia range before choosing a direction. New York brings the US data, the dollar flows, and the day's resolution — often continuing London's move, sometimes violently reversing it.",
        "Knowing the clock changes how you read the same chart: a breakout at 3am means little; the same breakout at the London open is a statement of intent." ] },
      { t:"Liquidity: where the stops live", mins:5, rule:"Obvious levels attract price BECAUSE everyone's stops are behind them.", body:[
        "Big players can't fill large orders without someone on the other side. The easiest counterparty is a pool of stop-losses — and stops cluster in predictable places: above equal highs, below equal lows, beyond session extremes and round numbers.",
        "That's why price so often spikes through an 'obvious' level, fills the resting orders, and reverses. The breakout traders provide the liquidity; the informed money takes the other side.",
        "Train yourself to see a clean double-top not as resistance but as a target — a pool the market may want to visit before doing what it always intended." ] },
      { t:"The London sweep, step by step", mins:5, rule:"The sweep isn't the trade — the reclaim after it is.", body:[
        "The most repeatable pattern in gold: Asia builds a range, London opens and drives through one side of it — triggering breakout entries and resting stops — then reverses hard back inside. The failed break is the information.",
        "The sequence to watch: (1) the sweep beyond the Asia high or low, (2) the sharp rejection back inside the range, (3) the reclaim — price closing back through the swept level and holding it.",
        "Entering ON the sweep is gambling on direction. Entering on the confirmed reclaim, with a stop beyond the sweep's extreme, is a defined-risk trade on a pattern the market repeats week after week." ] },
      { t:"Entry model 1: Reclaim & hold", mins:5, rule:"Broken level, reclaimed and held = the cleanest long in the book.", body:[
        "Price breaks below a level everyone's watching, stops fire, and then — the tell — it climbs straight back above and holds. Everyone who sold the breakdown is now trapped underwater, and their exits become your fuel.",
        "The entry: wait for the reclaim candle to close back above the level, then buy the hold — the first quiet retest that stays above. Stop goes under the reclaim low. Target the opposite side of the structure, or the next liquidity pool.",
        "The discipline is in the 'hold': if price reclaims and immediately sinks back through, there's no trade. A reclaim that needs a second attempt wasn't a reclaim." ] },
      { t:"Entry model 2: Supply & demand rejection", mins:5, rule:"The strongest zones are fresh, sharp, and aligned with your bias.", body:[
        "A supply zone is where aggressive selling previously launched from — usually a small consolidation before a sharp drop. When price returns there, the question is whether unfilled sellers remain.",
        "Grade the zone before trusting it: Was the original departure violent? Is this the first return? Does it sit at a sensible place — a premium of the day's range, a session extreme, a higher-timeframe level? Fresh + sharp + aligned is an A-zone; anything less is a B you size down or skip.",
        "Entry is the rejection itself: a clear reversal candle inside the zone, stop beyond the zone's far edge, first target the middle of the range you came from." ] },
      { t:"Entry model 3: Break & retest", mins:4, rule:"Chase nothing — the retest is where risk is small enough to define.", body:[
        "When gold genuinely breaks a level with conviction — full-bodied close, follow-through — the trade isn't the breakout candle. It's the retest: price pulling back to the broken level and confirming it now acts as the opposite (old resistance behaving as support).",
        "The retest gives you everything the breakout can't: a tight stop (just beyond the retested level), a defined invalidation, and confirmation that the break wasn't a liquidity grab.",
        "If price runs without retesting? Let it go. There are five gold setups a week; there is no shortage of trades, only a shortage of patience." ] },
      { t:"The daily open, premium & discount", mins:4, rule:"Longs are cheap below the daily open, expensive above it.", body:[
        "The daily open (and the midpoint of the day's developing range) splits the session into premium and discount. Buying deep in discount — near the lows, at support, after a sweep — means your idea can be wrong by a little without costing much.",
        "Buying in premium — chasing strength near the highs — means paying the worst price of the day for the same idea. The setup can be identical; the location decides the outcome.",
        "This is why the models in this path all wait for price to come to a level. Location is the edge; the trigger is just the timing." ] },
      { t:"News days: NFP, CPI & FOMC", mins:4, rule:"No entries in the 15 minutes either side of red-folder news.", body:[
        "Three events move gold more than anything else: US jobs (NFP, first Friday), inflation (CPI), and the Fed (FOMC). Around them spreads explode, stops slip, and the first spike is routinely reversed within minutes.",
        "The professional play is boring: flatten or reduce before the release, let the first spike and its retrace print, and only then look for a setup in the direction the dust settles.",
        "Check the calendar every Monday (it's in this app), mark the red days, and treat them as different animals: half size, wider stops, or — completely acceptable — no trades at all." ] },
      { t:"Confluence: stacking the reasons", mins:4, rule:"One reason is a guess, three reasons is a setup.", body:[
        "No single tool is right often enough on its own. Edge comes from stacking independent reasons that all point the same way: a liquidity sweep INTO a fresh demand zone AT a discount of the day WITH the dollar rolling over.",
        "Build a simple checklist from this path: session timing ✓ liquidity taken ✓ zone quality ✓ location (premium/discount) ✓ trigger candle ✓. Four or five ticks is an A-setup worth full risk. Two ticks is a pass.",
        "Confluence also kills overtrading — most candidates fail the checklist, which is exactly the point." ] },
      { t:"Building your daily map", mins:5, rule:"Ten minutes of mapping before London beats three hours of staring after it.", body:[
        "Before the session, build the map: mark yesterday's high and low, the Asia range, the daily open, and the two or three zones you'd genuinely trade from. Write one sentence of bias — 'above X I look for longs to Y' — and one invalidation.",
        "During the session you're no longer searching, you're waiting: either price comes to your map and gives a trigger, or it doesn't and you don't trade.",
        "After the session, thirty seconds: did price respect your levels? Was the bias right? That feedback loop — map, trade, review, journaled in this app — is the entire job, repeated until it compounds." ] },
    ],
    risk: [
      { t:"Position sizing: the only maths that matters", mins:5, rule:"Risk a fixed 1% — the position size falls out of the stop, never the other way.", body:[
        "Decide risk first: 1% of a £2,000 account is £20. Find the stop distance the chart demands — say $10 of gold price. Size = risk ÷ (stop × value per lot per dollar). $10 × $100/lot = $1,000 per lot, so £20 of risk buys roughly 0.02 lots.",
        "Notice what this does: every trade now costs the same fraction of your account regardless of how wide the stop is. Tight setup, bigger size; wide setup, smaller size; identical consequence when wrong.",
        "Traders who size by feel — 'this one looks good, I'll go bigger' — are letting confidence, the least reliable instrument they own, set their risk. Use the calculator in this app until the maths is reflex." ] },
      { t:"Expectancy: why win rate is half the story", mins:4, rule:"You can win 40% of trades and grow — if winners average 2R+.", body:[
        "Measure every trade in R — multiples of what you risked. Lose £20 risking £20: −1R. Win £50 risking £20: +2.5R. Expectancy = (win% × average win) − (loss% × average loss).",
        "A 40% win rate with 2.5R winners makes money: (0.4 × 2.5) − (0.6 × 1) = +0.4R per trade. A 70% win rate with 0.5R winners loses it: (0.7 × 0.5) − (0.3 × 1) = +0.05R — one bad habit from negative.",
        "This is liberating: you don't need to be right most of the time. You need losers capped at −1R and winners allowed to finish. The journal tab computes this for you — profit factor is expectancy wearing different clothes." ] },
      { t:"Drawdown maths & the daily stop", mins:4, rule:"Three losses is a finished day — the fourth is rarely a trading decision.", body:[
        "Losses compound against you asymmetrically: −10% needs +11% to recover, −20% needs +25%, −50% needs +100%. Protecting the downside isn't cowardice, it's arithmetic.",
        "At 1% risk per trade, a losing streak is survivable — ten straight losses (rare but real) is about −10%. At 5% risk, the same streak is −40% and the maths turns brutal.",
        "Add a daily circuit breaker: three losses or −3%, whichever comes first, ends the session. The fourth trade of a losing day is almost never analysis — it's recovery-seeking, and the market charges extra for that." ] },
      { t:"Revenge trading: the circuit breaker", mins:4, rule:"The urge to win it back RIGHT NOW is the signal to stop.", body:[
        "Revenge trading has a signature: seconds after a loss you're back in, bigger, on a setup you'd never take cold. The loss created a debt in your head, and the market feels like the only place to repay it.",
        "You can't out-discipline a flooded brain in the moment — so decide the rules before: after any loss, a mandatory 15-minute break away from the screen. After a daily stop, done means done, and log how it felt in the journal.",
        "The Trader Score in this app asks about exactly this every Friday. A red week with honest answers builds more skill than a green week you can't explain." ] },
      { t:"FOMO & chasing: paying the worst price", mins:3, rule:"If the move already happened, the trade already happened.", body:[
        "FOMO entries have the worst location of any trade: you buy strength at the top of the impulse, your stop is either huge or hopeless, and the first natural pullback takes you out — often right before the move resumes.",
        "The antidote is mechanical, not motivational: you are only allowed to enter at YOUR levels, on YOUR trigger. Missed the reclaim? The retest may come. No retest? That trade belonged to someone else.",
        "Write missed trades in the journal as 'missed — plan respected'. Rewarding the discipline, not just the profit, is how the habit sticks." ] },
      { t:"The journal IS the edge", mins:4, rule:"Log every trade the moment it closes — feelings included.", body:[
        "Every trade you log is a data point about YOUR trading — not trading in general. Twenty trades in, patterns appear that no course can teach: your London win rate versus New York, how FOMO-tagged entries perform, what your real average winner is.",
        "The edge analytics in this app (your win rate by session, your setup performance) are only as honest as the entries feeding them. Log the losses in full sentences — they're the expensive lessons; skipping them is throwing away what you paid for.",
        "One line about emotion per entry. 'Calm, followed plan' or 'entered angry after loss' — six months later that column will explain your equity curve better than any indicator." ] },
      { t:"Process goals beat outcome goals", mins:4, rule:"Judge the week by plan-adherence, not P&L — money follows process.", body:[
        "'Make £500 this week' is a goal you don't control — the market decides. 'Take only A-setups, risk 1%, journal every trade, review Friday' is a goal you control completely, and it's the one that eventually produces the £500.",
        "Outcome-focus creates exactly the behaviour that prevents the outcome: forcing trades in dead sessions to hit a number, moving stops because 'I can't take another loss this week'.",
        "This is why your weekly Trader Score here measures discipline questions, not profit. A 9/10 process week that lost money is a good week — repeat it and the results arrive. A lucky win on a broken process is the most expensive thing the market sells." ] },
    ],
    pro: [
      { t:"Scaling out: paying yourself along the way", mins:4, rule:"Partials at the first target turn good trades into calm ones.", body:[
        "All-or-nothing exits force a brutal choice: take profit early and cry when it runs, or hold for the home run and watch winners die at breakeven. Scaling out dissolves the dilemma.",
        "A robust default: close half at the first structural target (locking roughly +1R), leave the rest for the full move with the stop trailed to sensible structure. The banked half buys the patience to hold the runner properly.",
        "The maths gives up a little on the best trades and gains a lot on the average ones — and it's the average ones that make the year." ] },
      { t:"Breakeven: protection or self-sabotage?", mins:4, rule:"Move to BE at a structural milestone — never at a feeling.", body:[
        "Moving the stop to entry feels like free insurance, but done too early it's a donation: gold routinely retests the entry area before the real move, and a premature BE stop converts winners into scratches.",
        "The professional version is conditional: move to breakeven only when the trade has PROVEN something — the first target paid, a new swing formed in your favour, the level that would justify BE actually printed.",
        "Ask one question before touching the stop: 'has the chart changed, or have my nerves?' Only one of those is a reason." ] },
      { t:"Set-and-forget vs active management", mins:4, rule:"Pick ONE management style per setup type and grade yourself on it.", body:[
        "Set-and-forget places the stop and targets, then walks away — it maximises discipline and minimises interference, and for most developing traders it outperforms their meddling by a wide margin.",
        "Active management — trailing, adding, cutting early on new information — can beat it, but only with rules written before the trade. 'I trail below each M15 higher-low' is a system; 'it looked weak' is not.",
        "The tell is in your journal: compare outcomes of interfered trades against untouched ones for a month. Most traders discover their interventions have negative expectancy — data that changes behaviour faster than any lecture." ] },
      { t:"Let the equity curve steer the size", mins:4, rule:"Trade smaller in drawdown, never bigger — earn your size back.", body:[
        "Your equity curve is live telemetry on the fit between your system and current conditions. A steady climb says press on. A sharp dip says something changed — the market's regime, or your discipline.",
        "Professionals cut size in drawdown: after three losing days, halve risk until a green week earns it back. Amateurs do the opposite — doubling down to recover fast — which is how a rough patch becomes a blown account.",
        "The equity chart in your journal makes this visible. If the last five entries slope down, that's the market telling you to get small and get selective — listen." ] },
      { t:"Correlation: gold's companion gauges", mins:4, rule:"A gold long agrees with DXY falling — check the companions before size.", body:[
        "Gold rarely moves alone. The dollar index (DXY) is its mirror; real yields set its cost; silver often leads or confirms the metal complex; risk sentiment decides whether it's trading as insurance or as a commodity.",
        "Practical use is confirmation, not prediction: your long setup at demand carries more weight when DXY is stalling at resistance and silver already bounced. When gold says long but every companion says dollar-strength, the setup deserves half size or a pass.",
        "One glance at DXY before every entry. Two markets agreeing beats one chart looking pretty." ] },
      { t:"Know your session statistics", mins:4, rule:"Trade the session where YOUR numbers say you have an edge.", body:[
        "The edge panel in your journal splits results by session for a reason: nearly every trader is two different people at different times of day. A 70% London win rate and a 30% New York one isn't noise after enough trades — it's an instruction.",
        "The reasons are usually mundane: NY means evening fatigue, faster news-driven moves, or a setup type that suits London's sweep behaviour but not New York's trends.",
        "Twenty trades per session is the minimum before trusting the split. Then act on it: full risk where you have proof, half risk where you're hypothesising, zero where the data says stop." ] },
      { t:"Prop-style risk rules at home", mins:4, rule:"A daily loss limit and a max-loss line — enforced like a prop firm would.", body:[
        "Prop firms survive on two rules: a daily loss limit (breach it, you're done for the day) and a maximum drawdown (breach it, you're done, full stop). Adopting them at home is free and changes behaviour immediately.",
        "Set them realistically — daily stop at 3%, account line at 10% — and treat the daily one as a hardware switch, not a suggestion. The best traders' worst days are small; that is the entire secret of their smooth curves.",
        "Write both numbers at the top of your one-page plan. When the daily stop hits, the platform closes and the review begins — the review is where the loss gets converted into tuition." ] },
      { t:"The review cadence that compounds", mins:4, rule:"Friday review every week — skipping it means repeating the week.", body:[
        "Improvement doesn't come from more screen time; it comes from structured feedback. Daily: thirty seconds — did I follow the plan? (your daily check-in). Weekly: the Friday review — six honest scores, what worked, what to change (your Trader Score).",
        "Monthly, go deeper: reread every journal entry, pull the three most expensive mistakes, and write ONE rule change — not five — for the next month. One change per month is twelve compounding improvements a year.",
        "The traders who plateau are almost never short of information. They're short of a loop that forces the information back into behaviour. You're holding that loop in your hand." ] },
      { t:"From consistency to compounding", mins:5, rule:"Prove the process on small size — scale risk only after 90 green-process days.", body:[
        "The path from here isn't a secret setup — it's sequence. First, consistency: three months of following the plan at small size, measured by process scores, not profit. Most people never complete this stage because it's boring. That's why it pays.",
        "Second, scale: once the numbers prove the edge (positive expectancy over 50+ journaled trades), increase risk methodically — 1% to 1.5%, hold for a month of stability, reassess. Never scale during a hot streak; euphoria and leverage is the classic account-killer.",
        "Third, longevity: the compounding maths only works if you're still here in year three. Every rule in this path — sizing, daily stops, reviews — exists to guarantee survival long enough for skill to matter. Protect the downside; the upside takes care of itself." ] },
    ],
  },
  // ── path quizzes (one bank per learning path; `c` = correct index, `why` teaches after answering) ──
  quizzes: {
    found: { pass:8, qs:[
      { q:"What does a stop-loss actually do?", a:["Closes the trade at a set level to cap the loss","Guarantees you exit in profit","Locks the spread in your favour","Adds to the position if price drops"], c:0, why:"A stop-loss is a pre-set exit so one losing trade can't damage the account." },
      { q:"XAUUSD is the price of…", a:["One ounce of gold in US dollars","Gold in British pounds per gram","A percentage move of the dollar","A basket of precious metals"], c:0, why:"XAUUSD = the US-dollar price of one troy ounce of gold." },
      { q:"Gold usually moves ___ the US dollar (DXY).", a:["Inverse to","In lockstep with","Faster than, same direction","Completely unrelated to"], c:0, why:"A stronger dollar makes gold pricier abroad, so gold and DXY tend to move opposite." },
      { q:"A 'demand zone' is…", a:["An area where buyers previously stepped in hard","The single highest price of the day","A level price can never break","Where the spread is always widest"], c:0, why:"It's a decision area where buying turned price up before — something to watch, not a guarantee." },
      { q:"Before risking real money, the smart first step is to…", a:["Practise the plan on demo or tiny size","Use maximum leverage to learn faster","Copy every signal with no thought","Only trade during news spikes"], c:0, why:"Reps on demo or small size build the habit without risking the account." },
      { q:"Risking 1% of a £2,000 account, how much is at risk on the trade?", a:["£20","£200","£2","£100"], c:0, why:"1% of £2,000 is £20. Fixed-percent risk keeps every trade the same size relative to the account." },
      { q:"Why is gold (XAUUSD) a sound market to learn on?", a:["It's deeply liquid and respects clear technical levels","It can only ever go up over time","Brokers pay you just to hold it","It only moves for one hour a day"], c:0, why:"Gold's liquidity and clean reaction to levels suit a patient, rules-based approach." },
      { q:"On a 1.00-lot gold position, a $1.00 move in price is worth…", a:["$100","$1","$10","$1,000"], c:0, why:"A standard XAUUSD lot is 100 ounces, so every $1 of price = $100 to the position." },
      { q:"A long lower wick into a support zone most likely means…", a:["Sellers pushed in and buyers absorbed them","The market is closed","Support has definitely broken","Nothing — wicks are random"], c:0, why:"The wick shows price visited lower levels and was rejected — buyers defended the zone." },
      { q:"Real yields rise sharply. Gold most often…", a:["Falls — holding gold now costs more in missed interest","Rises — yields don't matter","Freezes until the next NFP","Doubles its spread permanently"], c:0, why:"Gold pays no interest, so higher real yields make it comparatively less attractive." },
      { q:"Price is making no higher-highs and holds no clean range. The disciplined move is…", a:["Stand aside — chop is a no-trade regime","Trade both directions at once","Double the position size","Remove your stop to survive the noise"], c:0, why:"If you can't name the regime in one sentence, you don't have a trade — you have a guess." },
      { q:"The best reason support/resistance 'works' is that…", a:["Traders remember where decisions were made and act there again","Charts are magic","Brokers repaint the levels","Price is programmed to bounce"], c:0, why:"Levels mark past decision areas — memory and resting orders make them react again." },
    ]},
    gold: { pass:8, qs:[
      { q:"What is the core " + BRAND.name + " long trigger?", a:["Price reclaims a level and holds it","Any dip in price","A round number gets hit","An indicator turns green"], c:0, why:"Reclaim-and-hold shows buyers have taken control before you commit — the " + BRAND.short + " long." },
      { q:"Why does the London open matter for gold?", a:["It often expands the range and sets the day's liquidity","Gold only trades during London hours","Spreads drop to zero then","The dollar stops moving at the open"], c:0, why:"London brings the volume and volatility that frequently defines the day's range." },
      { q:"'Liquidity' resting above the highs is best described as…", a:["Clustered stop / limit orders price is drawn toward","A guaranteed wall of resistance","A period of very low volume","A fee your broker charges"], c:0, why:"Liquidity is pooled orders; price is often drawn to it before reversing." },
      { q:"A liquidity sweep is when price…", a:["Spikes past a high/low, grabs orders, then reverses","Trends smoothly in one direction all day","Gaps higher at the weekly open","Sits dead flat in a tight range"], c:0, why:"The sweep takes resting liquidity beyond a level then reverses — a trap-and-go." },
      { q:"Where does your stop belong?", a:["Beyond the structure that invalidates the idea","As tight as possible, structure aside","At a fixed distance every single trade","Just above entry on a long"], c:0, why:"Stops go beyond the level that proves you wrong — inside it, you get wicked out." },
      { q:"'Premium' in a trading range means price is…", a:["In the expensive upper half — favour selling","In the cheap lower half — favour buying","Exactly on the midpoint","Outside the range entirely"], c:0, why:"Above the range's 50% is premium (look to sell); below it is discount (look to buy)." },
      { q:"A fair value gap (FVG / imbalance) is…", a:["A fast 3-candle gap price often returns to fill","A guaranteed reversal point","A type of broker fee","The day's high minus its low"], c:0, why:"Price moved so fast it left an imbalance; it frequently returns to rebalance before continuing." },
      { q:"Stops cluster most predictably…", a:["Just beyond equal highs/lows and session extremes","In the exact middle of the range","At random prices","Only at round thousands"], c:0, why:"Obvious levels collect stops behind them — which is exactly why price gets drawn there." },
      { q:"London sweeps the Asia low then closes back inside the range. The trade is…", a:["The confirmed reclaim — not the sweep itself","Shorting the breakdown immediately","Doubling any position that's losing","Buying the exact low with no stop"], c:0, why:"The failed break is the information; entering on the reclaim gives defined risk on a repeatable pattern." },
      { q:"In the 15 minutes around NFP or FOMC, the playbook says…", a:["No new entries — spreads widen and first spikes routinely reverse","Enter with double size for the volatility","Remove stops so they can't slip","Only trade the first spike"], c:0, why:"News windows have slippage and fake first moves — let the dust settle, then trade the map." },
      { q:"Buying 'in discount' means entering…", a:["In the lower part of the day's range, near support","Above the day's high","Whenever the app sends a push","Only after three green candles"], c:0, why:"Location is the edge: cheap-side entries let you be slightly wrong without paying much." },
      { q:"A supply zone deserves the most trust when it is…", a:["Fresh, formed by a violent departure, and aligned with bias","Retested five times already","Drawn on the 1-second chart","Below the current price"], c:0, why:"First return + sharp origin + sensible location = an A-grade zone; each retest consumes its orders." },
    ]},
    risk: { pass:8, qs:[
      { q:"Risking 1% per trade, a 5-trade losing streak costs roughly…", a:["About 5% of the account","Half the account","Exactly 1% in total","Nothing — the stop refunds it"], c:0, why:"1% × 5 ≈ a 5% drawdown — survivable. Fixed-fractional risk keeps you in the game." },
      { q:"A +2R winning trade means you made…", a:["Twice what you risked on it","2% of your whole account","Two standard lots","Two pips of profit"], c:0, why:"R is your risk unit, so +2R = profit equal to twice the amount risked." },
      { q:"'Revenge trading' is…", a:["Forcing trades to win back a loss","Only taking A+ setups","Journaling every entry","Banking partial profits early"], c:0, why:"Chasing a loss off-plan turns a bad day into a bad month. Name it, then stop it." },
      { q:"Position size should be set by…", a:["Your risk % and the stop distance","How confident the trade feels","The size of your last winner","A fixed lot, every time"], c:0, why:"Size = account risk ÷ stop distance. Confidence isn't a sizing input." },
      { q:"You've hit your daily loss limit. The right move is to…", a:["Stop trading for the day","Double size to win it back","Pull your stops and wait","Switch to a more volatile pair"], c:0, why:"The daily limit protects you from yourself — when it's hit, you're done for the day." },
      { q:"You moved your stop to breakeven, then price drifts back to entry. The result is…", a:["A breakeven scratch — no loss","A full −1R loss","A +1R win","A margin call"], c:0, why:"At breakeven the worst case is a scratch — the downside is already off the table." },
      { q:"Two trades risk the same %, but one has a wider stop. Its position size is…", a:["Smaller than the tighter-stop trade","Larger than the tighter-stop trade","Exactly the same","Always zero"], c:0, why:"Size = risk ÷ stop distance, so a wider stop means a smaller position for the same risk." },
      { q:"A 40% win rate with average winners of +2.5R and losers of −1R is…", a:["Profitable — expectancy is +0.4R per trade","Break-even at best","Guaranteed to blow up","Impossible to trade"], c:0, why:"(0.4 × 2.5) − (0.6 × 1) = +0.4R. Winners' size matters as much as how often you win." },
      { q:"A −20% drawdown needs roughly what gain to recover?", a:["+25%","+20%","+10%","+50%"], c:0, why:"Losses compound against you: 80 × 1.25 = 100. Protecting the downside is arithmetic, not fear." },
      { q:"The strongest sign you're about to revenge trade is…", a:["An urgent need to win the loss back RIGHT NOW","A written plan and a calm checklist","Waiting patiently for your level","Reducing size after a red day"], c:0, why:"Urgency after a loss is the tell — the mandatory break exists precisely for that moment." },
      { q:"After your third loss of the day, the professional move is…", a:["Stop trading — the daily circuit breaker has fired","One more trade at double size","Remove the stop on the next entry","Switch to a new strategy mid-session"], c:0, why:"The fourth trade of a red day is usually recovery-seeking, not analysis. Done means done." },
      { q:"'Take only A-setups and journal every trade' is better than 'make £500 this week' because…", a:["You control the process — the market controls the outcome","Money goals are illegal","Journals replace stops","£500 is too small a target"], c:0, why:"Process goals are actionable every day; outcome-chasing produces forced trades that prevent the outcome." },
    ]},
    pro: { pass:8, qs:[
      { q:"'Scaling out' of a position means…", a:["Taking partial profit as price moves your way","Adding size on every tick","Sliding the stop further from price","Only ever closing at the full target"], c:0, why:"Scaling out banks partials and de-risks while leaving runners for the bigger move." },
      { q:"Moving your stop to breakeven does what?", a:["Removes the downside risk on an open winner","Guarantees the full take-profit","Widens your risk on the trade","Increases your position size"], c:0, why:"At breakeven the worst case is a scratch — the loss is off the table, not the target locked." },
      { q:"Why trade the same sessions consistently?", a:["A repeatable edge needs a comparable sample","Other sessions are against the rules","Brokers require a fixed schedule","To dodge volatility entirely"], c:0, why:"Same conditions make results comparable — that's how an edge becomes measurable." },
      { q:"A trading 'edge' is best described as…", a:["Positive expectancy repeated over many trades","One enormous winning trade","A secret indicator nobody has","Never taking a single loss"], c:0, why:"Edge = positive expectancy across a large sample, not the outcome of any one trade." },
      { q:"Two valid setups appear at once. The pro move is to…", a:["Take the higher-quality A+ setup","Trade both at full size","Skip trading for a week","Double size on the riskier one"], c:0, why:"Capital and focus are finite — concentrate on the highest-probability setup." },
      { q:"'Trading on tilt' usually shows up as…", a:["Forcing extra, off-plan trades after a big win or loss","Following your checklist exactly","Sitting on your hands during chop","Journalling every trade"], c:0, why:"Tilt is emotional, off-plan trading after a strong result — the journal is how you catch it." },
      { q:"A trading journal is most valuable because it…", a:["Turns your real results into feedback you can act on","Guarantees winning trades","Removes the need for a stop","Predicts the next candle"], c:0, why:"Reviewing real outcomes is how a process actually improves over time." },
      { q:"Taking partials at the first target mainly buys you…", a:["Banked profit plus the patience to hold the runner","A worse average price on every trade","Freedom from needing a stop","Twice the spread cost for nothing"], c:0, why:"Locking ~1R early removes the fear that makes traders strangle winners at breakeven." },
      { q:"The right moment to move a stop to breakeven is…", a:["After a structural milestone — a target paid or a new swing formed","The instant the trade goes green","Whenever you feel nervous","Never, under any circumstances"], c:0, why:"BE too early donates winners to the entry retest; BE after proof is protection." },
      { q:"Your last five journal entries slope downward. Size should…", a:["Halve until a green week earns it back","Double to recover faster","Stay identical no matter what","Go all-in on the next A-setup"], c:0, why:"Drawdown is telemetry — professionals cut size when the curve dips; amateurs press and compound the damage." },
      { q:"Your gold long fires while DXY breaks out UPWARD. You should…", a:["Halve size or pass — a companion gauge disagrees","Ignore the dollar completely","Triple size for bravery","Flip short with no setup"], c:0, why:"Gold and DXY are mirrors; a setup fighting the dollar deserves less risk, not more." },
      { q:"Prop firms enforce a daily loss limit because…", a:["Keeping the worst day small is what keeps the equity curve smooth","It annoys traders","Losses don't matter otherwise","It doubles the leverage"], c:0, why:"Survival maths: the best traders' worst days are small — adopt the same switch at home." },
    ]},
  },
  // ── glossary ──
  glossary: [
    // ── Market structure ──
    { cat:"Market structure", term:"Liquidity", def:"Clusters of resting orders (stops + limits) that price is drawn toward — usually just above swing highs or below swing lows. Smart money pushes price into liquidity to fill size before the real move." },
    { cat:"Market structure", term:"Break of Structure (BOS)", def:"Price closes beyond the previous swing high (uptrend) or low (downtrend), confirming the trend is still intact. Your 'continuation' signal." },
    { cat:"Market structure", term:"Change of Character (CHoCH)", def:"The first structural break against the prevailing trend — an early warning that momentum may be flipping. Often the first clue before a reversal." },
    { cat:"Market structure", term:"Reclaim & hold", def:"Price breaks back above a level and holds it instead of rejecting — proof buyers have taken control. The core VIP Trader long trigger." },
    { cat:"Market structure", term:"Support & resistance", def:"Levels where buyers (support) or sellers (resistance) have repeatedly stepped in. Decision zones to react at — not magic walls." },
    { cat:"Market structure", term:"Supply / demand zone", def:"An area where price previously reversed sharply, leaving unfilled orders. Demand sits below price, supply above. React on the return, don't predict it." },
    { cat:"Market structure", term:"Range", def:"A sideways market trapped between a high and a low. Most of the session is range; the edges are where the trades live." },
    // ── Smart money concepts ──
    { cat:"Smart money concepts", term:"Order block", def:"The last opposing candle before a strong move — where institutions loaded their position. A high-probability area for price to return to and react from." },
    { cat:"Smart money concepts", term:"Fair value gap (FVG)", def:"An imbalance — a 3-candle gap where price moved so fast it left no overlap. Price often returns to 'fill' the gap before continuing; a precision entry zone." },
    { cat:"Smart money concepts", term:"Liquidity sweep", def:"Price spikes past a high or low, grabs the resting stops, then sharply reverses — a stop-hunt / trap-and-go. The bread and butter of the BT entry model." },
    { cat:"Smart money concepts", term:"Mitigation", def:"When price returns to an order block or the origin of a move to rebalance unfilled orders before continuing. Frequently your entry trigger." },
    { cat:"Smart money concepts", term:"Premium / discount", def:"Above the 50% of a range is 'premium' (expensive — look to sell); below is 'discount' (cheap — look to buy). Buy low, sell high, measured." },
    { cat:"Smart money concepts", term:"Inducement", def:"An obvious-looking level designed to lure traders in early, so smart money can take their stops before the real move. If it looks too easy, it's bait." },
    // ── Risk & money management ──
    { cat:"Risk & money management", term:"R / R-multiple", def:"Your risk on a trade expressed as 1 unit (1R). +2R = you made twice what you risked; −1R = a full stop. Thinking in R strips the money-emotion out." },
    { cat:"Risk & money management", term:"Risk:reward (R:R)", def:"Potential reward divided by risk. A 3:1 setup risks 1 to make 3 — so you can be right less than half the time and still grow the account." },
    { cat:"Risk & money management", term:"Position sizing", def:"Lot size = account risk ÷ stop distance. Size is set by your risk %, never by how confident the trade feels. Same risk every time keeps the maths honest." },
    { cat:"Risk & money management", term:"Drawdown", def:"The peak-to-trough drop in your account. Surviving drawdown is the whole game — protect capital and the upside takes care of itself." },
    { cat:"Risk & money management", term:"Expectancy", def:"Average expected profit per trade across a big sample: (win% × avg win) − (loss% × avg loss). A positive edge repeated — not one hero trade." },
    { cat:"Risk & money management", term:"Stop loss / take profit", def:"SL is your pre-set exit for a loss; TP is your exit at target. Both go in before emotion does — the plan, decided in advance." },
    { cat:"Risk & money management", term:"Breakeven (BE)", def:"Moving your stop to entry once a trade is in profit — worst case becomes a scratch, not a loss. 'SL to BE' on a call means do exactly that." },
    // ── Trading psychology ──
    { cat:"Trading psychology", term:"Revenge trading", def:"Forcing trades to win back a loss. It turns a bad trade into a bad week. Name it the second you feel it, then step away from the screen." },
    { cat:"Trading psychology", term:"FOMO", def:"Fear of missing out — chasing an entry after the move's already gone. The setup comes again; a missed trade costs nothing, a chased one costs R." },
    { cat:"Trading psychology", term:"Confluence", def:"Two or more reasons lining up for the same trade — e.g. demand zone + liquidity sweep + session timing. More confluence, higher probability." },
    { cat:"Trading psychology", term:"Process over profit", def:"Judge yourself on whether you followed the plan, not on whether the trade won. Good process plus enough reps and profit shows up on its own." },
    // ── Macro & news ──
    { cat:"Macro & news", term:"XAUUSD", def:"The price of one troy ounce of gold in US dollars — the pair VIP Trader calls. 'Gold' and 'XAUUSD' are the same thing." },
    { cat:"Macro & news", term:"DXY", def:"US Dollar Index. Gold is priced in dollars, so it usually moves inverse to DXY — a stronger dollar pressures gold, a weaker dollar lifts it." },
    { cat:"Macro & news", term:"NFP", def:"Non-Farm Payrolls — high-impact US jobs data on the first Friday of each month. A major gold mover; size down or stand aside around it." },
    { cat:"Macro & news", term:"CPI", def:"Consumer Price Index — the headline inflation read. Hot CPI lifts rate-hike expectations and pressures gold; cool CPI tends to support it." },
    { cat:"Macro & news", term:"FOMC", def:"The US Federal Reserve's rate-setting meetings + the Chair's press conference. Decisions and tone whip gold hard — a known volatility event." },
    { cat:"Macro & news", term:"Safe-haven", def:"Gold's role as a store of value in fear and uncertainty. Risk-off flows (war, crisis, falling real yields) often bid gold regardless of the chart." },
    // ── Order mechanics ──
    { cat:"Order mechanics", term:"Pip / point", def:"The unit gold moves in. Most brokers quote gold to 2 decimals, so 4,026.0 → 4,027.0 is 100 'points' / $1. Always know your broker's convention." },
    { cat:"Order mechanics", term:"Spread", def:"The gap between the buy and sell price — your cost to enter. Spreads widen around news and the daily rollover, and they eat tight scalps first." },
    { cat:"Order mechanics", term:"Slippage", def:"Getting filled at a worse price than expected when the market moves fast (news, thin liquidity). It's why a stop can cost more than the level you set." },
    { cat:"Order mechanics", term:"Scaling out", def:"Banking partial profit at TP levels while leaving a 'runner' for the bigger move. The TP1–TP6 ladder on a BT call is built for exactly this." },
    { cat:"Order mechanics", term:"Trailing stop", def:"Moving your stop along behind price to lock in profit as a trade runs, instead of a fixed target. Lets winners breathe while protecting gains." },
  ],
  // ── monthly challenge ──
  challenge: { name:"Journal Every Trade", desc:"Log all your trades for 30 days — build the habit that builds consistency.", done:18, total:30, reward:"Disciplined badge + leaderboard boost", joined:true },
  // ── announcements from the team ──
  // direct messages — the office inbox (scripted replies cycle per thread)
  dms: [
    { id:"mw", name:"Marcus Webb", initials:"MW", role:"Member", last:"2m ago",
      msgs:[
        { text:"You catch that London move? Clean as anything.", time:"09:12" },
        { text:"I waited for the reclaim like Arron said — best entry I've taken all month 🙌", time:"09:13" },
      ],
      replies:[
        "Exactly — patience pays. What was your R on it?",
        "I'm holding my runner into NY. Stop's at breakeven so I'm relaxed either way.",
        "Same setup as Tuesday's. The playbook just keeps repeating.",
      ] },
    { id:"pn", name:"Priya Nair", initials:"PN", role:"Top 3 · leaderboard", last:"1h ago",
      msgs:[
        { text:"Saw you climbing the leaderboard 👀", time:"08:20" },
        { text:"Keep journaling every trade — that's what got me to top 3.", time:"08:21" },
      ],
      replies:[
        "Honestly, the journal reviews changed everything for me.",
        "Do the Mindset call on Sunday — most underrated session on the schedule.",
        "Two good trades a week beats ten forced ones. Quality over quantity.",
      ] },
    { id:"ge", name:"Georgie", initials:"GE", role:"Coach", last:"Yesterday",
      msgs:[
        { text:"Good question in Thursday's session 👏", time:"Thu" },
        { text:"Bring your last 3 swing entries to the next call and we'll review them live on the chart.", time:"Thu" },
      ],
      replies:[
        "Perfect — drop them in before 7 and I'll pull them up on the chart.",
        "That's exactly the habit that separates the consistent traders.",
        "See you on the call 👊",
      ] },
  ],

  announcements: [
    { from:BRAND.founder, role:"Founder", time:"2h ago", text:"New York session was textbook today — replay's up in Learn. Watch how we managed the runner." },
    { from:"Team", role: BRAND.name, time:"Yesterday", text:"Dubai meetup tickets are live — 12 spots left. See you on the floor." },
    { from:BRAND.founder, role:"Founder", time:"2 days ago", text:"Big week ahead — CPI Wednesday + NFP Friday. Plan your risk; don't force trades around the news." },
  ],
};
