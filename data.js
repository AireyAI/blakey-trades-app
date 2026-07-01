/* Blakey Trades — mock data (realistic, gold/XAUUSD flavoured) */
window.DATA = {
  user: {
    name: "Jordan Hale", first: "Jordan", handle: "@jhale_fx", initials: "JH",
    level: 7, levelName: "Disciplined", xp: 2840, xpNext: 3500,
    streak: 18, winRate: 64, rr: 2.7, sessions: 41,
  },

  live: {
    title: "Live Trading Room",   // not shown as the call name anymore — the live call comes from schedule[] via liveCallInfo()
    host: "Arron Blakey", hostInitials: "AB", hostRole: "Founder",
    watchers: 1247,
    startsIn: 732,            // seconds → drives the Home countdown
    session: "London",
    pair: "XAUUSD",
    entry: "4,026.50", sl: "4,014.00", tp: "4,064.00", bias: "Long bias",
  },

  // weekly live-call timetable (client's "Upcoming Zoom Calls" schedule; times = UK)
  schedule: [
    { day:"Mon", time:"18:00", at:"6:00 PM", session:"New Starter Call", host:"Nick" },
    { day:"Mon", time:"19:00", at:"7:00 PM", session:"Swing Trades Education", host:"Georgie" },
    { day:"Tue", time:"19:00", at:"7:00 PM", session:"Trade Management", host:"Oscar" },
    { day:"Wed", time:"19:00", at:"7:00 PM", session:"Live Trading on Signal IQ", host:"Blakey & Scott" },
    { day:"Thu", time:"19:00", at:"7:00 PM", session:"Swing Trades Education", host:"Georgie" },
    { day:"Thu", time:"20:00", at:"8:00 PM", session:"Tutorial & Live Scalps", host:"SN" },
    { day:"Sun", time:"19:00", at:"7:00 PM", session:"Mindset", host:"Blakey" },
  ],

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
    // BT VIP — flagship gold day calls (Arron's "Personal Trade Idea" format: entry range, SL→BE, TP ladder)
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
    // BT Swing — multi-day
    { id:"s1", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Tue",
      entry:"3,985.00", sl:"3,952.00", tp:"4,090.00", rr:"3.2", status:"running",
      note:"Weekly demand reaction. Swing target the upper liquidity — hold 3–5 days, trail under daily structure." },
    { id:"s2", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Last week",
      entry:"3,920.00", sl:"3,888.00", tp:"4,012.00", rr:"2.9", status:"tp", result:"+92.0",
      note:"Higher-low off the weekly trendline. Banked the full swing into round-number supply." },
    // BT Zones — supply/demand zones
    { id:"z1", channel:"zones", pair:"XAUUSD", dir:"long", session:"Demand zone", time:"Active",
      entry:"4,025.00", sl:"4,013.00", tp:"4,052.00", rr:"2.2", status:"running",
      note:"Primary demand zone 4,024–4,026 for the session. Wait for a reaction + confirmation. React, don't predict." },
    { id:"z2", channel:"zones", pair:"XAUUSD", dir:"short", session:"Supply zone", time:"Active",
      entry:"4,063.00", sl:"4,074.00", tp:"4,035.00", rr:"2.5", status:"running",
      note:"Weekly supply 4,062–4,065 overhead. Watch for rejection wicks into this zone for shorts." },
    // SN Scalps — fast intraday
    { id:"sc1", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"12m ago",
      entry:"4,031.00", sl:"4,028.00", tp:"4,038.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"M1 break of structure off the NY open. Quick scalp, partials fast." },
    { id:"sc2", channel:"scalps", pair:"XAUUSD", dir:"short", session:"London scalp", time:"40m ago",
      entry:"4,043.00", sl:"4,046.00", tp:"4,036.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"Liquidity grab above the session high, scalped the snap-back." },
    { id:"sc3", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"1h ago",
      entry:"4,037.50", sl:"4,035.00", tp:"4,043.00", rr:"2.2", status:"sl", result:"-2.5",
      note:"VWAP reclaim rolled over and stopped for -2.5. Scalping is a game of small losses and bigger winners — this is one of the small ones, taken without hesitation." },
    // Signal IQ — mechanical bot
    { id:"iq1", channel:"iq", pair:"XAUUSD", dir:"long", session:"Auto", time:"06:00",
      entry:"4,020.00", sl:"4,010.00", tp:"4,040.00", rr:"2.0", status:"tp", result:"+20.0",
      note:"Mechanical signal — trend + momentum filter aligned long. No discretion, fixed 2R target." },
    { id:"iq2", channel:"iq", pair:"XAUUSD", dir:"short", session:"Auto", time:"03:00",
      entry:"4,052.00", sl:"4,062.00", tp:"4,032.00", rr:"2.0", status:"sl", result:"-10.0",
      note:"Mechanical short on a momentum flip. Stopped — the system takes every valid signal; the edge plays out over the sample." },
  ],

  // Telegram channels the signals are posted to (mirrored into the app)
  channels: [
    { id:"vip", name:"BT VIP", handle:"@bt_vip", mark:"BT", img:"assets/channels/vip.jpg", tone:"gold", members:"3,210", today:3, desc:"Flagship gold day-trade calls — full entry, stop and targets." },
    { id:"swing", name:"BT Swing Trades", handle:"@bt_swing", mark:"BT", img:"assets/channels/swing.jpg", tone:"quiet", members:"1,940", today:1, desc:"Multi-day swing setups for the bigger moves." },
    { id:"zones", name:"BT Zones", handle:"@bt_zones", mark:"BT", img:"assets/channels/zones.jpg", tone:"quiet", members:"2,480", today:2, desc:"Key supply & demand zones to watch each session." },
    { id:"scalps", name:"SN Scalps", handle:"@sn_scalps", mark:"SN", img:"assets/channels/scalps.jpg", tone:"quiet", members:"1,510", today:4, desc:"Fast intraday scalps — in and out, tight risk." },
    { id:"iq", name:"Signal IQ", handle:"@signal_iq", mark:"🤖", tone:"bot", members:"1,120", today:6, bot:true, desc:"Automated mechanical signals, 24/5. No emotion, fixed risk." },
  ],

  categories: ["For you","Market Analysis","Mindset","Beginner Path","Session Replays","Risk"],

  featured: {
    title:"The Gold Playbook: Reading London Liquidity",
    cat:"Market Analysis", dur:"42:18", date:"2 days ago", views:"3,140",
    img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=1000&h=520&fit=crop&q=78",
    note:"Arron walks the full London-session framework — liquidity sweeps, the 3 entry models, and where most traders get trapped." },

  videos: [
    { id:"v1", title:"London Liquidity, Explained", cat:"Market Analysis", dur:"42:18", date:"2d ago", views:"3,140", progress:0.34, seed:11, img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
    { id:"v2", title:"Why Your Stops Keep Getting Hit", cat:"Risk", dur:"18:50", date:"4d ago", views:"2,610", progress:0, seed:23, img:"https://images.unsplash.com/photo-1689732888407-310424e3a372?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
    { id:"v3", title:"The Trader's Mind: Patience Under Pressure", cat:"Mindset", dur:"27:05", date:"6d ago", views:"4,002", progress:0.72, seed:31, img:"https://images.unsplash.com/photo-1624461145824-d9d44d85cc77?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
    { id:"v4", title:"Building Your First Gold Watchlist", cat:"Beginner Path", dur:"15:32", date:"1w ago", views:"1,980", progress:0, seed:7, img:"https://images.unsplash.com/photo-1616783943928-32f4e1e16147?w=600&h=360&fit=crop&q=72", host:"Blakey Team" },
    { id:"v5", title:"New York Session Replay — Live Calls", cat:"Session Replays", dur:"58:44", date:"1w ago", views:"2,233", progress:0.12, seed:42, img:"https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
    { id:"v6", title:"Risk:Reward Done Properly", cat:"Risk", dur:"21:10", date:"1w ago", views:"3,560", progress:0, seed:18, img:"https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=600&h=360&fit=crop&q=72", host:"Blakey Team" },
    { id:"v7", title:"Reading the Daily Before You Trade", cat:"Market Analysis", dur:"33:27", date:"2w ago", views:"2,870", progress:0, seed:55, img:"https://images.unsplash.com/photo-1689732888407-310424e3a372?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
    { id:"v8", title:"From Revenge Trading to Routine", cat:"Mindset", dur:"24:48", date:"2w ago", views:"3,910", progress:0, seed:64, img:"https://images.unsplash.com/photo-1624461145824-d9d44d85cc77?w=600&h=360&fit=crop&q=72", host:"Arron Blakey" },
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
      body:"3 weeks no revenge trades. Journaling every entry like Arron said. Small wins compound. Thank you to this community for keeping me accountable.",
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
    { id:"dubai", city:"Dubai", country:"United Arab Emirates", flag:"🇦🇪", img:"assets/hub-dubai.jpg",
      tint:"linear-gradient(160deg,#1c1503,#0a0a0e)",
      event:{ d:"22", m:"Jul", title:"Gold Masterclass — Live Trading", time:"7:00pm · DIFC", }, going:164,
      faces:["PN","DO","LF","AB"] },
    { id:"ni", city:"Belfast", country:"Northern Ireland", flag:"🇬🇧", img:"assets/hub-belfast.jpg",
      tint:"linear-gradient(160deg,#10140d,#0a0a0e)",
      event:{ d:"09", m:"Aug", title:"NI Traders Social & Q&A", time:"5:00pm · City Centre", }, going:96,
      faces:["TB","AK","MW","JH"] },
  ],

  journal: [
    { id:"j1", pair:"XAUUSD", dir:"long", r:2.1, outcome:"win", session:"London", date:"Today", setup:"Reclaim & hold", channel:"BT VIP", tags:["Followed plan","Patient"], note:"Waited for the London low to be reclaimed and held the 4,025 block before entering. Took partials at 4,045 and trailed the rest. Felt calm — no FOMO, executed the plan exactly." },
    { id:"j2", pair:"XAUUSD", dir:"short", r:3.0, outcome:"win", session:"New York", date:"Yesterday", setup:"Supply rejection", channel:"BT VIP", tags:["Followed plan","A+ setup"], note:"Clean lower-high into weekly supply at 4,050. Risk defined below structure, full target hit at the prior-day open. Textbook." },
    { id:"j3", pair:"XAUUSD", dir:"long", r:0, outcome:"be", session:"Asia", date:"Yesterday", setup:"Range reversal", channel:"BT Zones", tags:["Managed well"], note:"Took partials then trailed to breakeven before the NY reversal. No giveback — protected the account first." },
    { id:"j4", pair:"XAUUSD", dir:"long", r:-1.0, outcome:"loss", session:"London", date:"Mon", setup:"Breakout", channel:"SN Scalps", tags:["Chased entry","FOMO"], note:"Entered late on the breakout instead of waiting for the retest. Got wicked out. Lesson: wait for the retest, every single time." },
    { id:"j5", pair:"XAUUSD", dir:"long", r:2.6, outcome:"win", session:"London", date:"Mon", setup:"Break & retest", channel:"BT VIP", tags:["Followed plan"], note:"Textbook break-and-retest of the 4,000 level off the daily trend. Patience on the retest paid." },
    { id:"j6", pair:"XAUUSD", dir:"short", r:1.8, outcome:"win", session:"New York", date:"Fri", setup:"Liquidity grab", channel:"SN Scalps", tags:["Quick scalp"], note:"Faded the liquidity grab above the session high. In and out in 20 minutes, banked it." },
    { id:"j7", pair:"XAUUSD", dir:"long", r:-1.0, outcome:"loss", session:"Asia", date:"Thu", setup:"Counter-trend", channel:"Off-plan", tags:["Off-plan","Counter-trend"], note:"Took a trade that wasn't on the plan, against the daily trend. Stopped out. This is exactly what the journal is for — name it, don't repeat it." },
  ],

  notifications: [
    { icon:"i-live", text:"Your next live call starts in 12 minutes", time:"now", unread:true, group:"Today", go:"live" },
    { icon:"i-chart", text:"New gold idea — XAUUSD long @ 4,026.50", time:"08:14", unread:true, group:"Today", go:"signals" },
    { icon:"i-trophy", text:"You climbed to #6 on the weekly leaderboard", time:"1h ago", unread:true, group:"Today", go:"community" },
    { icon:"i-comment", text:"Marcus Webb replied to your post", time:"2h ago", unread:false, group:"Today", go:"community" },
    { icon:"i-play", text:"New replay added — New York Session", time:"Yesterday", unread:false, group:"Earlier", go:"learn" },
    { icon:"i-pin", text:"London meetup is in 3 days — you're going", time:"Yesterday", unread:false, group:"Earlier", go:"hubs" },
  ],

  // Live chat playback script (loops). host:true = Arron pinned style.
  chatScript: [
    { initials:"AB", name:"Arron", host:true, text:"Morning all 👋 mapping the London open now — watch 4,025." },
    { initials:"MW", name:"Marcus", text:"Been waiting for this level all week 🔥" },
    { initials:"SR", name:"Sofia", text:"Volume picking up already" },
    { initials:"AK", name:"Aisha", text:"So this is the demand block from yesterday?" },
    { initials:"AB", name:"Arron", host:true, text:"Exactly Aisha — reclaim + hold = our long. Stop below structure, never inside it." },
    { initials:"DO", name:"Daniel", text:"In at 4,026.5, stop 4,014 ✅" },
    { initials:"PN", name:"Priya", text:"Patience. Let it come to you 🧘" },
    { initials:"TB", name:"Tom", text:"This is why I show up live every day" },
    { initials:"LF", name:"Lena", text:"First green week thanks to these calls 🙌" },
    { initials:"AB", name:"Arron", host:true, text:"Partials into 4,045, trail the rest. Protect the account first, profit second." },
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
    { id:"found", name:"Foundations", level:"Beginner", lessons:8, done:0, color:"#3ECB86", desc:"Markets, candles & risk basics — start here." },
    { id:"gold", name:"The Gold Playbook", level:"Core", lessons:10, done:0, color:"#E0B23C", desc:"Liquidity, the London open & the 3 entry models." },
    { id:"risk", name:"Risk & Psychology", level:"Core", lessons:7, done:0, color:"#6AA0FF", desc:"Position sizing, drawdown & the trader's mind." },
    { id:"pro", name:"Pro Execution", level:"Advanced", lessons:9, done:0, color:"#C06AFF", desc:"Scaling, sessions & a repeatable edge." },
  ],
  // ── path quizzes (one bank per learning path; `c` = correct index, `why` teaches after answering) ──
  quizzes: {
    found: { pass:5, qs:[
      { q:"What does a stop-loss actually do?", a:["Closes the trade at a set level to cap the loss","Guarantees you exit in profit","Locks the spread in your favour","Adds to the position if price drops"], c:0, why:"A stop-loss is a pre-set exit so one losing trade can't damage the account." },
      { q:"XAUUSD is the price of…", a:["One ounce of gold in US dollars","Gold in British pounds per gram","A percentage move of the dollar","A basket of precious metals"], c:0, why:"XAUUSD = the US-dollar price of one troy ounce of gold." },
      { q:"Gold usually moves ___ the US dollar (DXY).", a:["Inverse to","In lockstep with","Faster than, same direction","Completely unrelated to"], c:0, why:"A stronger dollar makes gold pricier abroad, so gold and DXY tend to move opposite." },
      { q:"A 'demand zone' is…", a:["An area where buyers previously stepped in hard","The single highest price of the day","A level price can never break","Where the spread is always widest"], c:0, why:"It's a decision area where buying turned price up before — something to watch, not a guarantee." },
      { q:"Before risking real money, the smart first step is to…", a:["Practise the plan on demo or tiny size","Use maximum leverage to learn faster","Copy every signal with no thought","Only trade during news spikes"], c:0, why:"Reps on demo or small size build the habit without risking the account." },
      { q:"Risking 1% of a £2,000 account, how much is at risk on the trade?", a:["£20","£200","£2","£100"], c:0, why:"1% of £2,000 is £20. Fixed-percent risk keeps every trade the same size relative to the account." },
      { q:"Why is gold (XAUUSD) a sound market to learn on?", a:["It's deeply liquid and respects clear technical levels","It can only ever go up over time","Brokers pay you just to hold it","It only moves for one hour a day"], c:0, why:"Gold's liquidity and clean reaction to levels suit a patient, rules-based approach." },
    ]},
    gold: { pass:5, qs:[
      { q:"What is the core Blakey Trades long trigger?", a:["Price reclaims a level and holds it","Any dip in price","A round number gets hit","An indicator turns green"], c:0, why:"Reclaim-and-hold shows buyers have taken control before you commit — the BT long." },
      { q:"Why does the London open matter for gold?", a:["It often expands the range and sets the day's liquidity","Gold only trades during London hours","Spreads drop to zero then","The dollar stops moving at the open"], c:0, why:"London brings the volume and volatility that frequently defines the day's range." },
      { q:"'Liquidity' resting above the highs is best described as…", a:["Clustered stop / limit orders price is drawn toward","A guaranteed wall of resistance","A period of very low volume","A fee your broker charges"], c:0, why:"Liquidity is pooled orders; price is often drawn to it before reversing." },
      { q:"A liquidity sweep is when price…", a:["Spikes past a high/low, grabs orders, then reverses","Trends smoothly in one direction all day","Gaps higher at the weekly open","Sits dead flat in a tight range"], c:0, why:"The sweep takes resting liquidity beyond a level then reverses — a trap-and-go." },
      { q:"Where does your stop belong?", a:["Beyond the structure that invalidates the idea","As tight as possible, structure aside","At a fixed distance every single trade","Just above entry on a long"], c:0, why:"Stops go beyond the level that proves you wrong — inside it, you get wicked out." },
      { q:"'Premium' in a trading range means price is…", a:["In the expensive upper half — favour selling","In the cheap lower half — favour buying","Exactly on the midpoint","Outside the range entirely"], c:0, why:"Above the range's 50% is premium (look to sell); below it is discount (look to buy)." },
      { q:"A fair value gap (FVG / imbalance) is…", a:["A fast 3-candle gap price often returns to fill","A guaranteed reversal point","A type of broker fee","The day's high minus its low"], c:0, why:"Price moved so fast it left an imbalance; it frequently returns to rebalance before continuing." },
    ]},
    risk: { pass:5, qs:[
      { q:"Risking 1% per trade, a 5-trade losing streak costs roughly…", a:["About 5% of the account","Half the account","Exactly 1% in total","Nothing — the stop refunds it"], c:0, why:"1% × 5 ≈ a 5% drawdown — survivable. Fixed-fractional risk keeps you in the game." },
      { q:"A +2R winning trade means you made…", a:["Twice what you risked on it","2% of your whole account","Two standard lots","Two pips of profit"], c:0, why:"R is your risk unit, so +2R = profit equal to twice the amount risked." },
      { q:"'Revenge trading' is…", a:["Forcing trades to win back a loss","Only taking A+ setups","Journaling every entry","Banking partial profits early"], c:0, why:"Chasing a loss off-plan turns a bad day into a bad month. Name it, then stop it." },
      { q:"Position size should be set by…", a:["Your risk % and the stop distance","How confident the trade feels","The size of your last winner","A fixed lot, every time"], c:0, why:"Size = account risk ÷ stop distance. Confidence isn't a sizing input." },
      { q:"You've hit your daily loss limit. The right move is to…", a:["Stop trading for the day","Double size to win it back","Pull your stops and wait","Switch to a more volatile pair"], c:0, why:"The daily limit protects you from yourself — when it's hit, you're done for the day." },
      { q:"You moved your stop to breakeven, then price drifts back to entry. The result is…", a:["A breakeven scratch — no loss","A full −1R loss","A +1R win","A margin call"], c:0, why:"At breakeven the worst case is a scratch — the downside is already off the table." },
      { q:"Two trades risk the same %, but one has a wider stop. Its position size is…", a:["Smaller than the tighter-stop trade","Larger than the tighter-stop trade","Exactly the same","Always zero"], c:0, why:"Size = risk ÷ stop distance, so a wider stop means a smaller position for the same risk." },
    ]},
    pro: { pass:5, qs:[
      { q:"'Scaling out' of a position means…", a:["Taking partial profit as price moves your way","Adding size on every tick","Sliding the stop further from price","Only ever closing at the full target"], c:0, why:"Scaling out banks partials and de-risks while leaving runners for the bigger move." },
      { q:"Moving your stop to breakeven does what?", a:["Removes the downside risk on an open winner","Guarantees the full take-profit","Widens your risk on the trade","Increases your position size"], c:0, why:"At breakeven the worst case is a scratch — the loss is off the table, not the target locked." },
      { q:"Why trade the same sessions consistently?", a:["A repeatable edge needs a comparable sample","Other sessions are against the rules","Brokers require a fixed schedule","To dodge volatility entirely"], c:0, why:"Same conditions make results comparable — that's how an edge becomes measurable." },
      { q:"A trading 'edge' is best described as…", a:["Positive expectancy repeated over many trades","One enormous winning trade","A secret indicator nobody has","Never taking a single loss"], c:0, why:"Edge = positive expectancy across a large sample, not the outcome of any one trade." },
      { q:"Two valid setups appear at once. The pro move is to…", a:["Take the higher-quality A+ setup","Trade both at full size","Skip trading for a week","Double size on the riskier one"], c:0, why:"Capital and focus are finite — concentrate on the highest-probability setup." },
      { q:"'Trading on tilt' usually shows up as…", a:["Forcing extra, off-plan trades after a big win or loss","Following your checklist exactly","Sitting on your hands during chop","Journalling every trade"], c:0, why:"Tilt is emotional, off-plan trading after a strong result — the journal is how you catch it." },
      { q:"A trading journal is most valuable because it…", a:["Turns your real results into feedback you can act on","Guarantees winning trades","Removes the need for a stop","Predicts the next candle"], c:0, why:"Reviewing real outcomes is how a process actually improves over time." },
    ]},
  },
  // ── glossary ──
  glossary: [
    // ── Market structure ──
    { cat:"Market structure", term:"Liquidity", def:"Clusters of resting orders (stops + limits) that price is drawn toward — usually just above swing highs or below swing lows. Smart money pushes price into liquidity to fill size before the real move." },
    { cat:"Market structure", term:"Break of Structure (BOS)", def:"Price closes beyond the previous swing high (uptrend) or low (downtrend), confirming the trend is still intact. Your 'continuation' signal." },
    { cat:"Market structure", term:"Change of Character (CHoCH)", def:"The first structural break against the prevailing trend — an early warning that momentum may be flipping. Often the first clue before a reversal." },
    { cat:"Market structure", term:"Reclaim & hold", def:"Price breaks back above a level and holds it instead of rejecting — proof buyers have taken control. The core BT VIP long trigger." },
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
    { cat:"Macro & news", term:"XAUUSD", def:"The price of one troy ounce of gold in US dollars — the pair BT VIP trades. 'Gold' and 'XAUUSD' are the same thing." },
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
  announcements: [
    { from:"Arron Blakey", role:"Founder", time:"2h ago", text:"New York session was textbook today — replay's up in Learn. Watch how we managed the runner." },
    { from:"Team", role:"Blakey Trades", time:"Yesterday", text:"Dubai meetup tickets are live — 12 spots left. See you on the floor." },
    { from:"Arron Blakey", role:"Founder", time:"2 days ago", text:"Big week ahead — CPI Wednesday + NFP Friday. Plan your risk; don't force trades around the news." },
  ],
};
