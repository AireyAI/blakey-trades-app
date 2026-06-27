/* Blakey Trades — mock data (realistic, gold/XAUUSD flavoured) */
window.DATA = {
  user: {
    name: "Jordan Hale", first: "Jordan", handle: "@jhale_fx", initials: "JH",
    level: 7, levelName: "Disciplined", xp: 2840, xpNext: 3500,
    streak: 18, winRate: 64, rr: 2.7, sessions: 41,
  },

  live: {
    title: "London Open — Gold Game Plan",
    host: "Arron Blakey", hostInitials: "AB", hostRole: "Founder",
    watchers: 1247,
    startsIn: 732,            // seconds → drives the Home countdown
    session: "London",
    pair: "XAUUSD",
    entry: "2,946.50", sl: "2,934.00", tp: "2,984.00", bias: "Long bias",
  },

  // Home stats
  homeStats: [
    { ic:"flame", value:"18", label:"Day streak" },
    { ic:"target", value:"64%", label:"Win rate" },
    { ic:"chart", value:"2.7R", label:"Avg R:R" },
  ],

  morningBrief: {
    bias: "Cautiously bullish",
    headline: "Gold coiling under 2,980 — London could expand the range",
    points: [
      { ic:"💵", label:"Dollar (DXY)", text:"Softening into the open — a tailwind for gold" },
      { ic:"🎯", label:"Key levels", text:"2,945 demand holds the bias · 2,982 is the cap" },
      { ic:"📅", label:"On watch", text:"US data at 13:30 BST — expect a volatility spike" },
    ],
  },

  // each idea belongs to a Telegram channel (channel id) — see `channels` below
  ideas: [
    // BT VIP — flagship gold day calls
    { id:"i1", channel:"vip", pair:"XAUUSD", dir:"long", session:"London", time:"Today · 08:14",
      entry:"2,946.50", sl:"2,934.00", tp:"2,984.00", rr:"3.0", status:"running",
      note:"Reclaimed the London low and held the 2,945 demand block. Continuation into the New York liquidity above 2,980. Risk defined below structure." },
    { id:"i2", channel:"vip", pair:"XAUUSD", dir:"short", session:"New York", time:"Yesterday · 14:40",
      entry:"2,968.00", sl:"2,977.00", tp:"2,941.00", rr:"3.0", status:"tp", result:"+27.0",
      note:"Swept Asian highs and rejected the weekly supply at 2,970. Clean lower-high on the 15m gave the entry. Banked at the prior day open." },
    { id:"i4", channel:"vip", pair:"XAUUSD", dir:"long", session:"London", time:"Mon · 09:20",
      entry:"2,922.40", sl:"2,914.00", tp:"2,948.00", rr:"3.0", status:"tp", result:"+25.6",
      note:"Textbook break-and-retest of the 2,920 level off the daily trend. Patience on the retest paid." },
    { id:"i3", channel:"vip", pair:"XAUUSD", dir:"long", session:"Asia", time:"Yesterday · 02:05",
      entry:"2,951.20", sl:"2,942.00", tp:"2,978.00", rr:"2.9", status:"be", result:"BE",
      note:"Took partials into 2,965, trailed to breakeven before the NY reversal. Protect the account first." },
    // BT Swing — multi-day
    { id:"s1", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Tue",
      entry:"2,905.00", sl:"2,872.00", tp:"3,010.00", rr:"3.2", status:"running",
      note:"Weekly demand reaction. Swing target the upper liquidity — hold 3–5 days, trail under daily structure." },
    { id:"s2", channel:"swing", pair:"XAUUSD", dir:"long", session:"Daily swing", time:"Last week",
      entry:"2,840.00", sl:"2,808.00", tp:"2,932.00", rr:"2.9", status:"tp", result:"+92.0",
      note:"Higher-low off the weekly trendline. Banked the full swing into round-number supply." },
    // BT Zones — supply/demand zones
    { id:"z1", channel:"zones", pair:"XAUUSD", dir:"long", session:"Demand zone", time:"Active",
      entry:"2,945.00", sl:"2,933.00", tp:"2,972.00", rr:"2.2", status:"running",
      note:"Primary demand zone 2,944–2,946 for the session. Wait for a reaction + confirmation. React, don't predict." },
    { id:"z2", channel:"zones", pair:"XAUUSD", dir:"short", session:"Supply zone", time:"Active",
      entry:"2,983.00", sl:"2,994.00", tp:"2,955.00", rr:"2.5", status:"running",
      note:"Weekly supply 2,982–2,985 overhead. Watch for rejection wicks into this zone for shorts." },
    // SN Scalps — fast intraday
    { id:"sc1", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"12m ago",
      entry:"2,951.00", sl:"2,948.00", tp:"2,958.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"M1 break of structure off the NY open. Quick scalp, partials fast." },
    { id:"sc2", channel:"scalps", pair:"XAUUSD", dir:"short", session:"London scalp", time:"40m ago",
      entry:"2,963.00", sl:"2,966.00", tp:"2,956.00", rr:"2.3", status:"tp", result:"+7.0",
      note:"Liquidity grab above the session high, scalped the snap-back." },
    { id:"sc3", channel:"scalps", pair:"XAUUSD", dir:"long", session:"NY scalp", time:"1h ago",
      entry:"2,957.50", sl:"2,955.00", tp:"2,963.00", rr:"2.2", status:"running",
      note:"Holding the intraday VWAP reclaim. Tight stop, runners to the high." },
    // Signal IQ — mechanical bot
    { id:"iq1", channel:"iq", pair:"XAUUSD", dir:"long", session:"Auto", time:"06:00",
      entry:"2,940.00", sl:"2,930.00", tp:"2,960.00", rr:"2.0", status:"tp", result:"+20.0",
      note:"Mechanical signal — trend + momentum filter aligned long. No discretion, fixed 2R target." },
    { id:"iq2", channel:"iq", pair:"XAUUSD", dir:"short", session:"Auto", time:"03:00",
      entry:"2,972.00", sl:"2,982.00", tp:"2,952.00", rr:"2.0", status:"sl", result:"-10.0",
      note:"Mechanical short on a momentum flip. Stopped — the system takes every valid signal; the edge plays out over the sample." },
  ],

  // Telegram channels the signals are posted to (mirrored into the app)
  channels: [
    { id:"vip", name:"BT VIP", handle:"@bt_vip", mark:"BT", tone:"gold", members:"3,210", today:3, desc:"Flagship gold day-trade calls — full entry, stop and targets." },
    { id:"swing", name:"BT Swing Trades", handle:"@bt_swing", mark:"BT", tone:"quiet", members:"1,940", today:1, desc:"Multi-day swing setups for the bigger moves." },
    { id:"zones", name:"BT Zones", handle:"@bt_zones", mark:"BT", tone:"quiet", members:"2,480", today:2, desc:"Key supply & demand zones to watch each session." },
    { id:"scalps", name:"SN Scalps", handle:"@sn_scalps", mark:"SN", tone:"quiet", members:"1,510", today:4, desc:"Fast intraday scalps — in and out, tight risk." },
    { id:"iq", name:"Signal IQ", handle:"@signal_iq", mark:"🤖", tone:"bot", members:"1,120", today:6, bot:true, desc:"Automated mechanical signals, 24/5. No emotion, fixed risk." },
  ],

  categories: ["For you","Market Analysis","Mindset","Beginner Path","Session Replays","Risk"],

  featured: {
    title:"The Gold Playbook: Reading London Liquidity",
    cat:"Market Analysis", dur:"42:18", date:"2 days ago", views:"3,140",
    note:"Arron walks the full London-session framework — liquidity sweeps, the 3 entry models, and where most traders get trapped." },

  videos: [
    { id:"v1", title:"London Liquidity, Explained", cat:"Market Analysis", dur:"42:18", date:"2d ago", views:"3,140", progress:0.34, seed:11, host:"Arron Blakey" },
    { id:"v2", title:"Why Your Stops Keep Getting Hit", cat:"Risk", dur:"18:50", date:"4d ago", views:"2,610", progress:0, seed:23, host:"Arron Blakey" },
    { id:"v3", title:"The Trader's Mind: Patience Under Pressure", cat:"Mindset", dur:"27:05", date:"6d ago", views:"4,002", progress:0.72, seed:31, host:"Arron Blakey" },
    { id:"v4", title:"Building Your First Gold Watchlist", cat:"Beginner Path", dur:"15:32", date:"1w ago", views:"1,980", progress:0, seed:7, host:"Blakey Team" },
    { id:"v5", title:"New York Session Replay — Live Calls", cat:"Session Replays", dur:"58:44", date:"1w ago", views:"2,233", progress:0.12, seed:42, host:"Arron Blakey" },
    { id:"v6", title:"Risk:Reward Done Properly", cat:"Risk", dur:"21:10", date:"1w ago", views:"3,560", progress:0, seed:18, host:"Blakey Team" },
    { id:"v7", title:"Reading the Daily Before You Trade", cat:"Market Analysis", dur:"33:27", date:"2w ago", views:"2,870", progress:0, seed:55, host:"Arron Blakey" },
    { id:"v8", title:"From Revenge Trading to Routine", cat:"Mindset", dur:"24:48", date:"2w ago", views:"3,910", progress:0, seed:64, host:"Arron Blakey" },
  ],

  traderOfWeek: {
    name:"Priya Nair", handle:"@priya.trades", initials:"PN",
    ret:"+8.4%", trades:"11", winRate:"82%",
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
    { ic:"🔥", name:"18-day streak", on:true },
    { ic:"🎯", name:"60% win rate", on:true },
    { ic:"📓", name:"Journaled 40", on:true },
    { ic:"🎥", name:"Live regular", on:true },
    { ic:"🏆", name:"Top 10", on:true },
    { ic:"💎", name:"100 trades", on:false },
    { ic:"🧠", name:"Course grad", on:false },
  ],

  hubs: [
    { id:"uk", city:"London", country:"United Kingdom", flag:"🇬🇧", img:"assets/hub-london.jpg",
      tint:"linear-gradient(160deg,#1a1407,#0a0a0e)",
      event:{ d:"14", m:"Jul", title:"London Trading Floor Meetup", time:"6:30pm · Canary Wharf", }, going:218,
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
    { id:"j1", pair:"XAUUSD", dir:"long", r:2.1, outcome:"win", session:"London", date:"Today", setup:"Reclaim & hold", channel:"BT VIP", tags:["Followed plan","Patient"], note:"Waited for the London low to be reclaimed and held the 2,945 block before entering. Took partials at 2,965 and trailed the rest. Felt calm — no FOMO, executed the plan exactly." },
    { id:"j2", pair:"XAUUSD", dir:"short", r:3.0, outcome:"win", session:"New York", date:"Yesterday", setup:"Supply rejection", channel:"BT VIP", tags:["Followed plan","A+ setup"], note:"Clean lower-high into weekly supply at 2,970. Risk defined below structure, full target hit at the prior-day open. Textbook." },
    { id:"j3", pair:"XAUUSD", dir:"long", r:0, outcome:"be", session:"Asia", date:"Yesterday", setup:"Range reversal", channel:"BT Zones", tags:["Managed well"], note:"Took partials then trailed to breakeven before the NY reversal. No giveback — protected the account first." },
    { id:"j4", pair:"XAUUSD", dir:"long", r:-1.0, outcome:"loss", session:"London", date:"Mon", setup:"Breakout", channel:"SN Scalps", tags:["Chased entry","FOMO"], note:"Entered late on the breakout instead of waiting for the retest. Got wicked out. Lesson: wait for the retest, every single time." },
    { id:"j5", pair:"XAUUSD", dir:"long", r:2.6, outcome:"win", session:"London", date:"Mon", setup:"Break & retest", channel:"BT VIP", tags:["Followed plan"], note:"Textbook break-and-retest of the 2,920 level off the daily trend. Patience on the retest paid." },
    { id:"j6", pair:"XAUUSD", dir:"short", r:1.8, outcome:"win", session:"New York", date:"Fri", setup:"Liquidity grab", channel:"SN Scalps", tags:["Quick scalp"], note:"Faded the liquidity grab above the session high. In and out in 20 minutes, banked it." },
    { id:"j7", pair:"XAUUSD", dir:"long", r:-1.0, outcome:"loss", session:"Asia", date:"Thu", setup:"Counter-trend", channel:"Off-plan", tags:["Off-plan","Counter-trend"], note:"Took a trade that wasn't on the plan, against the daily trend. Stopped out. This is exactly what the journal is for — name it, don't repeat it." },
  ],

  notifications: [
    { icon:"🔴", text:"London Open call starts in 12 minutes", time:"now", unread:true, group:"Today", go:"live" },
    { icon:"📈", text:"New gold idea — XAUUSD long @ 2,946.50", time:"08:14", unread:true, group:"Today", go:"signals" },
    { icon:"🏆", text:"You climbed to #6 on the weekly leaderboard", time:"1h ago", unread:true, group:"Today", go:"community" },
    { icon:"💬", text:"Marcus Webb replied to your post", time:"2h ago", unread:false, group:"Today", go:"community" },
    { icon:"🎥", text:"New replay added — New York Session", time:"Yesterday", unread:false, group:"Earlier", go:"learn" },
    { icon:"📍", text:"London meetup is in 3 days — you're going", time:"Yesterday", unread:false, group:"Earlier", go:"hubs" },
  ],

  // Live chat playback script (loops). host:true = Arron pinned style.
  chatScript: [
    { initials:"AB", name:"Arron", host:true, text:"Morning all 👋 mapping the London open now — watch 2,945." },
    { initials:"MW", name:"Marcus", text:"Been waiting for this level all week 🔥" },
    { initials:"SR", name:"Sofia", text:"Volume picking up already" },
    { initials:"AK", name:"Aisha", text:"So this is the demand block from yesterday?" },
    { initials:"AB", name:"Arron", host:true, text:"Exactly Aisha — reclaim + hold = our long. Stop below structure, never inside it." },
    { initials:"DO", name:"Daniel", text:"In at 2,946.5, stop 2,934 ✅" },
    { initials:"PN", name:"Priya", text:"Patience. Let it come to you 🧘" },
    { initials:"TB", name:"Tom", text:"This is why I show up live every day" },
    { initials:"LF", name:"Lena", text:"First green week thanks to these calls 🙌" },
    { initials:"AB", name:"Arron", host:true, text:"Partials into 2,965, trail the rest. Protect the account first, profit second." },
    { initials:"AK", name:"Aisha", text:"Banked +1.4R already 💎" },
    { initials:"MW", name:"Marcus", text:"Clean. Textbook continuation." },
  ],

  // full country list for onboarding "where are you based?" — United Kingdom is the default
  countries: ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (Kinshasa)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"],
};
