// Money Radar — Cloudflare Worker API.
// Pulls free public market data (Yahoo Finance) and news feeds (RSS), caches at the edge,
// and scores Nasdaq drops with transparent rules. No API keys, no Claude needed.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const Y1 = 'https://query1.finance.yahoo.com';
const Y2 = 'https://query2.finance.yahoo.com';

// Market board instruments
const BOARD = [
  { id: 'ixic', sym: '^IXIC', name: { en: 'Nasdaq Composite', ar: 'ناسداك المركب' }, unit: 'pts' },
  { id: 'ndx', sym: '^NDX', name: { en: 'Nasdaq 100', ar: 'ناسداك 100' }, unit: 'pts' },
  { id: 'spx', sym: '^GSPC', name: { en: 'S&P 500', ar: 'إس آند بي 500' }, unit: 'pts' },
  { id: 'dji', sym: '^DJI', name: { en: 'Dow Jones', ar: 'داو جونز' }, unit: 'pts' },
  { id: 'vix', sym: '^VIX', name: { en: 'VIX', ar: 'مؤشر الخوف VIX' }, unit: 'pts' },
  { id: 'tnx', sym: '^TNX', name: { en: 'US 10Y yield', ar: 'عائد السندات 10 سنوات' }, unit: 'pct' },
  { id: 'brent', sym: 'BZ=F', name: { en: 'Brent crude', ar: 'خام برنت' }, unit: 'usd' },
  { id: 'wti', sym: 'CL=F', name: { en: 'WTI crude', ar: 'خام غرب تكساس' }, unit: 'usd' },
  { id: 'gold', sym: 'GC=F', name: { en: 'Gold', ar: 'الذهب' }, unit: 'usd' },
  { id: 'btc', sym: 'BTC-USD', name: { en: 'Bitcoin', ar: 'بيتكوين' }, unit: 'usd' },
  { id: 'tasi', sym: '^TASI.SR', name: { en: 'Tadawul (TASI)', ar: 'تاسي' }, unit: 'pts' },
  { id: 'sar', sym: 'SAR=X', name: { en: 'USD/SAR', ar: 'دولار/ريال' }, unit: 'fx' },
];

// Nasdaq-100 universe for the multi-day drop scan
const NDX = ['AAPL','MSFT','NVDA','AMZN','GOOGL','META','AVGO','TSLA','COST','NFLX','AMD','PEP','ADBE','CSCO','TMUS','QCOM','INTU','TXN','AMGN','ISRG','CMCSA','HON','AMAT','BKNG','VRTX','ADP','PANW','GILD','SBUX','MU','LRCX','ADI','MDLZ','REGN','INTC','KLAC','SNPS','CDNS','MELI','PYPL','CRWD','MAR','ABNB','CTAS','ORLY','CSX','MRVL','FTNT','PDD','ASML','WDAY','NXPI','ADSK','ROP','DASH','CHTR','PCAR','MNST','CPRT','AEP','PAYX','KDP','ROST','TTD','FAST','ODFL','KHC','EXC','DDOG','BKR','EA','CTSH','VRSK','XEL','GEHC','LULU','IDXX','CCEP','ZS','TEAM','ANSS','CSGP','ON','DXCM','BIIB','MCHP','TTWO','CDW','WBD','GFS','ILMN','MDB','ARM','APP','PLTR','MSTR','AXON','SHOP','LIN','AZN'];

const NASDAQ_EXCH = new Set(['NMS', 'NGM', 'NCM', 'NAS', 'NasdaqGS', 'NasdaqGM', 'NasdaqCM']);

// ---------- helpers ----------
const json = (data, maxAge = 30) => new Response(JSON.stringify(data), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': `public, max-age=${Math.min(maxAge, 30)}`,
    'access-control-allow-origin': '*',
  },
});

async function getText(url, ms = 9000) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8' }, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
async function getJSON(url, ms) { return JSON.parse(await getText(url, ms)); }
async function yahoo(path, ms) {
  try { return await getJSON(Y1 + path, ms); } catch (e) { return getJSON(Y2 + path, ms); }
}

// Edge cache wrapper: compute once per TTL per data-center.
async function cached(ctx, key, ttl, fn) {
  const cache = caches.default;
  const req = new Request('https://cache.money-radar/' + key);
  const hit = await cache.match(req);
  if (hit) return hit.json();
  const data = await fn();
  ctx.waitUntil(cache.put(req, new Response(JSON.stringify(data), { headers: { 'cache-control': `public, max-age=${ttl}`, 'content-type': 'application/json' } })));
  return data;
}

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : v && typeof v.raw === 'number' ? v.raw : null);
const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

// ---------- quotes ----------
async function chart(sym, range = '1d', interval = '5m') {
  const j = await yahoo(`/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false`);
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error('no chart ' + sym);
  const m = r.meta || {};
  const ts = r.timestamp || [];
  const cl = r.indicators?.quote?.[0]?.close || [];
  const pts = [];
  for (let i = 0; i < ts.length; i++) if (cl[i] != null) pts.push([ts[i], round(cl[i], 4)]);
  const price = num(m.regularMarketPrice) ?? (pts.length ? pts[pts.length - 1][1] : null);
  const prev = range === '1d' ? (num(m.chartPreviousClose) ?? num(m.previousClose)) : (num(m.previousClose) ?? num(m.chartPreviousClose));
  return {
    sym,
    name: m.longName || m.shortName || sym,
    exch: m.fullExchangeName || m.exchangeName || '',
    currency: m.currency || '',
    price,
    prev,
    chg: price != null && prev ? price - prev : null,
    chg_pct: price != null && prev ? (price / prev - 1) * 100 : null,
    day_high: num(m.regularMarketDayHigh),
    day_low: num(m.regularMarketDayLow),
    hi52: num(m.fiftyTwoWeekHigh),
    lo52: num(m.fiftyTwoWeekLow),
    time: m.regularMarketTime || null,
    tz: m.exchangeTimezoneName || '',
    state: m.marketState || null,
    pts,
  };
}

async function board(ctx) {
  return cached(ctx, 'board-v1', 30, async () => {
    const rows = await Promise.all(BOARD.map(async (b) => {
      try {
        const c = await chart(b.sym, '1d', b.id === 'tasi' ? '15m' : '5m');
        return { id: b.id, name: b.name, unit: b.unit, ...c };
      } catch (e) { return { id: b.id, name: b.name, unit: b.unit, sym: b.sym, error: true }; }
    }));
    return { at: Date.now(), rows };
  });
}

const SYM_RE = /^[A-Z0-9^.=\-]{1,12}$/;
async function quotes(ctx, list) {
  const syms = [...new Set(list.map((s) => s.trim().toUpperCase()).filter((s) => SYM_RE.test(s)))].slice(0, 25);
  const rows = await Promise.all(syms.map((s) => cached(ctx, 'q1-' + s, 30, async () => {
    try { return await chart(s, '1d', '5m'); } catch (e) { return { sym: s, error: true }; }
  })));
  return { at: Date.now(), rows };
}

const RANGES = { '1d': '5m', '5d': '30m', '1mo': '1d', '6mo': '1d', '1y': '1d', '5y': '1wk' };
async function history(ctx, sym, range) {
  sym = String(sym || '').toUpperCase();
  if (!SYM_RE.test(sym) || !RANGES[range]) return { error: 'bad request' };
  return cached(ctx, `h1-${sym}-${range}`, range === '1d' ? 30 : 600, () => chart(sym, range, RANGES[range]));
}

// ---------- movers & drop radar ----------
function slimQuote(q) {
  const rating = typeof q.averageAnalystRating === 'string' ? parseFloat(q.averageAnalystRating) : null;
  return {
    sym: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    exch: q.exchange,
    price: num(q.regularMarketPrice),
    chg_pct: num(q.regularMarketChangePercent),
    vol: num(q.regularMarketVolume),
    avg_vol: num(q.averageDailyVolume3Month),
    mcap: num(q.marketCap),
    pe_fwd: num(q.forwardPE),
    pe: num(q.trailingPE),
    hi52: num(q.fiftyTwoWeekHigh),
    lo52: num(q.fiftyTwoWeekLow),
    ma50: num(q.fiftyDayAverage),
    ma200: num(q.twoHundredDayAverage),
    day_low: num(q.regularMarketDayLow),
    day_high: num(q.regularMarketDayHigh),
    rating: rating && isFinite(rating) ? rating : null,
    rating_txt: typeof q.averageAnalystRating === 'string' ? q.averageAnalystRating : null,
  };
}

async function screener(id, count = 100) {
  const j = await yahoo(`/v1/finance/screener/predefined/saved?scrIds=${id}&count=${count}&formatted=false&lang=en-US&region=US`);
  return (j?.finance?.result?.[0]?.quotes || []).map(slimQuote);
}

function rsi(closes, n = 14) {
  if (closes.length < n + 1) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) g += d; else l -= d; }
  g /= n; l /= n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n;
    l = (l * (n - 1) + Math.max(-d, 0)) / n;
  }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}

async function sparkBatch(syms, range) {
  const out = {};
  for (let i = 0; i < syms.length; i += 20) {
    const part = syms.slice(i, i + 20);
    try {
      const j = await yahoo(`/v8/finance/spark?symbols=${part.map(encodeURIComponent).join(',')}&range=${range}&interval=1d`);
      // Two shapes seen in the wild: {SYM:{close,...}} or {spark:{result:[{symbol,response:[...]}]}}
      if (j?.spark?.result) {
        for (const r of j.spark.result) {
          const resp = r.response?.[0];
          const cl = resp?.indicators?.quote?.[0]?.close || [];
          out[r.symbol] = { close: cl.filter((v) => v != null), prev: num(resp?.meta?.chartPreviousClose), price: num(resp?.meta?.regularMarketPrice) };
        }
      } else {
        for (const [k, v] of Object.entries(j || {})) {
          if (v && Array.isArray(v.close)) out[k] = { close: v.close.filter((x) => x != null), prev: num(v.chartPreviousClose), price: null };
        }
      }
    } catch (e) { /* skip this chunk */ }
  }
  return out;
}

// Drop score, 0–100, five transparent parts.
function scoreDrop(d) {
  const drop = Math.abs(Math.min(d.drop_pct, 0));
  const p = {};
  // 1) Size of the fall (0–20): 7% ⇒ ~8, 15% ⇒ ~16, 25%+ ⇒ 20
  p.drop = Math.round(Math.min(20, drop * 0.8 + (drop >= 7 ? 2 : 0)));
  // 2) Business quality (0–30): size + analyst view
  let q = 0;
  const mc = d.mcap || 0;
  q += mc >= 500e9 ? 16 : mc >= 100e9 ? 14 : mc >= 30e9 ? 11 : mc >= 10e9 ? 8 : mc >= 2e9 ? 5 : mc > 0 ? 2 : 6;
  if (d.rating != null) q += d.rating <= 1.8 ? 14 : d.rating <= 2.3 ? 11 : d.rating <= 2.8 ? 7 : d.rating <= 3.3 ? 3 : 0;
  else q += 6;
  p.quality = Math.min(30, q);
  // 3) Value after the drop (0–20): forward P/E and distance below 52-week high
  let v = 0;
  const pe = d.pe_fwd ?? d.pe;
  if (pe != null && pe > 0) v += pe < 12 ? 10 : pe < 18 ? 8 : pe < 25 ? 6 : pe < 35 ? 4 : pe < 50 ? 2 : 0;
  else v += pe != null && pe <= 0 ? 0 : 3;
  if (d.hi52 && d.price) { const off = (1 - d.price / d.hi52) * 100; v += off >= 40 ? 10 : off >= 25 ? 8 : off >= 15 ? 6 : off >= 8 ? 4 : 2; }
  else v += 3;
  p.value = Math.min(20, v);
  // 4) Oversold / stretch (0–20): RSI and distance under the 50-day average
  let o = 0;
  if (d.rsi != null) o += d.rsi < 25 ? 12 : d.rsi < 30 ? 10 : d.rsi < 35 ? 7 : d.rsi < 45 ? 4 : 1;
  else o += 5;
  if (d.ma50 && d.price) { const u = (1 - d.price / d.ma50) * 100; o += u >= 20 ? 8 : u >= 12 ? 6 : u >= 6 ? 4 : u > 0 ? 2 : 0; }
  else o += 3;
  p.oversold = Math.min(20, o);
  // 5) Stabilising (0–10): bounce off today's low, volume calming
  let s = 0;
  if (d.day_low && d.day_high && d.price && d.day_high > d.day_low) {
    const pos = (d.price - d.day_low) / (d.day_high - d.day_low);
    s += pos >= 0.66 ? 6 : pos >= 0.4 ? 4 : pos >= 0.2 ? 2 : 0;
  } else s += 2;
  if (d.last_up) s += 4;
  else if (d.vol && d.avg_vol) s += d.vol < d.avg_vol * 1.5 ? 2 : 0;
  p.stable = Math.min(10, s);
  const total = p.drop + p.quality + p.value + p.oversold + p.stable;
  const band = total >= 75 ? 'candidate' : total >= 60 ? 'watch' : total >= 45 ? 'wait' : 'knife';
  return { parts: p, score: total, band };
}

async function movers(ctx) {
  return cached(ctx, 'movers-v2', 60, async () => {
    const [gain, lose, active] = await Promise.all([
      screener('day_gainers', 150).catch(() => []),
      screener('day_losers', 150).catch(() => []),
      screener('most_actives', 100).catch(() => []),
    ]);
    const nq = (r) => NASDAQ_EXCH.has(r.exch);
    const big = (r) => (r.mcap || 0) >= 300e6 && (r.price || 0) >= 2;
    return {
      at: Date.now(),
      gainers: gain.filter((r) => nq(r) && big(r)).sort((a, b) => b.chg_pct - a.chg_pct).slice(0, 15),
      losers: lose.filter((r) => nq(r) && big(r)).sort((a, b) => a.chg_pct - b.chg_pct).slice(0, 15),
      active: active.filter(nq).slice(0, 15),
    };
  });
}

async function radar(ctx) {
  return cached(ctx, 'radar-v2', 120, async () => {
    const [mv, spark] = await Promise.all([
      movers(ctx),
      cached(ctx, 'ndx-spark-v1', 900, () => sparkBatch(NDX, '3mo')),
    ]);
    const cand = new Map();
    // A) Today's hard fallers on the Nasdaq (≥7%, real companies)
    for (const r of mv.losers) if (r.chg_pct <= -7 && (r.mcap || 0) >= 1e9) cand.set(r.sym, { ...r, drop_pct: r.chg_pct, window: '1d' });
    // B) Nasdaq-100 names down ≥10% over 5 sessions, or ≥7% today
    for (const [sym, s] of Object.entries(spark)) {
      const c = s.close;
      if (!c || c.length < 8) continue;
      const last = c[c.length - 1];
      const d5 = (last / c[c.length - 6] - 1) * 100;
      const d1 = (last / c[c.length - 2] - 1) * 100;
      const hi3 = Math.max(...c);
      const fromHi = (last / hi3 - 1) * 100;
      const best = Math.min(d1 <= -7 ? d1 : 0, d5 <= -10 ? d5 : 0);
      if (best < 0 && !cand.has(sym)) cand.set(sym, { sym, drop_pct: best, window: best === d1 ? '1d' : '5d', price: last, from_hi3: fromHi, _closes: c });
      else if (cand.has(sym)) Object.assign(cand.get(sym), { _closes: c, from_hi3: fromHi });
    }
    // Fill fundamentals for B-names via a quick quote screen lookup (from movers lists where possible)
    const pool = new Map([...mv.losers, ...mv.gainers, ...mv.active].map((r) => [r.sym, r]));
    const rows = [];
    for (const d of cand.values()) {
      const f = pool.get(d.sym) || {};
      const c = d._closes;
      const row = { ...f, ...d };
      row.name = row.name || d.sym;
      row.rsi = c ? round(rsi(c), 1) : null;
      row.last_up = c && c.length > 2 ? c[c.length - 1] > c[c.length - 2] && d.window !== '1d' : false;
      if (!row.ma50 && c && c.length >= 50) row.ma50 = c.slice(-50).reduce((a, b) => a + b, 0) / 50;
      if (!row.hi52 && c) row.hi52 = Math.max(...c);
      delete row._closes;
      Object.assign(row, scoreDrop(row));
      rows.push(row);
    }
    rows.sort((a, b) => b.score - a.score);
    return { at: Date.now(), rows: rows.slice(0, 20) };
  });
}

// ---------- news ----------
const FEEDS = {
  market: {
    en: [
      { src: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114' },
      { src: 'CNBC Tech', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910' },
      { src: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
      { src: 'Nasdaq', url: 'https://www.nasdaq.com/feed/rssoutbound?category=Markets' },
      { src: 'Bing News', url: 'https://www.bing.com/news/search?q=Nasdaq+stocks&format=rss' },
    ],
    ar: [
      { src: 'Bing', url: 'https://www.bing.com/news/search?q=%D9%86%D8%A7%D8%B3%D8%AF%D8%A7%D9%83&format=rss&setlang=ar' },
      { src: 'Bing', url: 'https://www.bing.com/news/search?q=%D9%88%D9%88%D9%84+%D8%B3%D8%AA%D8%B1%D9%8A%D8%AA&format=rss&setlang=ar' },
      { src: 'Bing', url: 'https://www.bing.com/news/search?q=%D8%A7%D9%84%D9%86%D9%81%D8%B7+%D8%A8%D8%B1%D9%86%D8%AA&format=rss&setlang=ar' },
    ],
  },
  local: {
    en: [
      { src: 'Bing News', url: 'https://www.bing.com/news/search?q=Riyadh&format=rss' },
      { src: 'Bing News', url: 'https://www.bing.com/news/search?q=Saudi+Arabia&format=rss' },
      { src: 'Bing News', url: 'https://www.bing.com/news/search?q=Tadawul+TASI&format=rss' },
      { src: 'Saudi Gazette', url: 'https://saudigazette.com.sa/rssFeed/74' },
    ],
    ar: [
      { src: 'Bing', url: 'https://www.bing.com/news/search?q=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6&format=rss&setlang=ar' },
      { src: 'Bing', url: 'https://www.bing.com/news/search?q=%D8%AA%D8%A7%D8%B3%D9%8A+%D8%A7%D9%84%D8%B3%D9%88%D9%82+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9&format=rss&setlang=ar' },
      { src: 'Asharq Al-Awsat', url: 'https://aawsat.com/feed' },
    ],
  },
};

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
const tag = (blk, name) => { const m = blk.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? m[1] : ''; };

function parseRss(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks.slice(0, 30)) {
    const title = decode(tag(b, 'title'));
    let link = decode(tag(b, 'link')) || (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    try { // Bing wraps links in a redirect
      const u = new URL(link);
      if (u.hostname.endsWith('bing.com') && u.searchParams.get('url')) link = u.searchParams.get('url');
    } catch (e) {}
    const when = Date.parse(decode(tag(b, 'pubDate')) || decode(tag(b, 'published')) || decode(tag(b, 'updated')) || decode(tag(b, 'dc:date')));
    const src = decode(tag(b, 'News:Source')) || decode(tag(b, 'source')) || feed.src;
    if (!title || !/^https?:\/\//.test(link)) continue;
    items.push({ title: title.slice(0, 220), link, ts: isFinite(when) ? when : null, src });
  }
  return items;
}

const ALERT_RE = /(missile|drone|intercept|air defen[cs]e|civil defen[cs]e|explosion|houthi|siren|attack on|strike on|صاروخ|صواريخ|مسيّر|مسير|اعتراض|الدفاع المدني|الدفاع الجوي|انفجار|الحوثي|هجوم)/i;
const TAGS = [
  ['Fed', /(\bfed\b|powell|rate (hike|cut)|fomc|federal reserve|الفيدرالي|الفائدة)/i],
  ['Earnings', /(earnings|results|quarter|revenue|guidance|eps|أرباح|نتائج)/i],
  ['Chips', /(chip|semiconductor|nvidia|intel|amd|tsmc|broadcom|رقائق|أشباه الموصلات)/i],
  ['Oil', /(oil|crude|brent|opec|aramco|نفط|برنت|أوبك|أرامكو)/i],
  ['Crypto', /(bitcoin|crypto|ethereum|binance|بيتكوين|عملات مشفرة)/i],
  ['Gold', /(gold|bullion|الذهب)/i],
  ['Saudi market', /(tadawul|tasi|saudi exchange|تاسي|تداول|السوق السعودية)/i],
  ['Inflation', /(inflation|cpi|pce|prices rose|التضخم)/i],
  ['Events', /(riyadh season|concert|festival|موسم الرياض|حفل|مهرجان)/i],
];
function classify(it, scope) {
  if (scope === 'local' && ALERT_RE.test(it.title)) return 'Security';
  for (const [t, re] of TAGS) if (re.test(it.title)) return t;
  return scope === 'local' ? 'Local' : 'Markets';
}
const TONE_UP = /(surge|soar|jump|rall|gain|beat|record high|rise|climb|rebound|upgrade|ارتفاع|يرتفع|قفز|مكاسب|صعود)/i;
const TONE_DN = /(plunge|sink|slump|tumble|fall|drop|miss|cut|downgrade|sell-?off|rout|crash|loss|lower|هبوط|انخفاض|تراجع|خسائر|يتراجع|ينخفض)/i;

async function news(ctx, scope, lang) {
  if (!FEEDS[scope] || !FEEDS[scope][lang]) return { error: 'bad request' };
  return cached(ctx, `news-v2-${scope}-${lang}`, 150, async () => {
    const lists = await Promise.all(FEEDS[scope][lang].map(async (f) => {
      try { return parseRss(await getText(f.url, 8000), f); } catch (e) { return []; }
    }));
    const seen = new Set();
    const now = Date.now();
    const out = [];
    for (const it of lists.flat().sort((a, b) => (b.ts || 0) - (a.ts || 0))) {
      const k = it.title.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '').slice(0, 60);
      if (seen.has(k)) continue;
      seen.add(k);
      if (it.ts && now - it.ts > 4 * 86400e3) continue;
      const t = classify(it, scope);
      const tone = t === 'Security' ? 'alert' : TONE_DN.test(it.title) ? 'bear' : TONE_UP.test(it.title) ? 'bull' : 'neutral';
      const fresh = it.ts && now - it.ts < 90 * 60e3;
      out.push({ ...it, tag: t, tone, prec: t === 'Security' && it.ts && now - it.ts < 12 * 3600e3 ? 'FLASH' : fresh ? 'PRIORITY' : 'ROUTINE' });
      if (out.length >= 60) break;
    }
    return { at: now, items: out };
  });
}

// ---------- router ----------
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (p === '/api/board') return json(await board(ctx), 30);
      if (p === '/api/quotes') return json(await quotes(ctx, (url.searchParams.get('s') || '').split(',')), 30);
      if (p === '/api/history') return json(await history(ctx, url.searchParams.get('s'), url.searchParams.get('r') || '1d'), 30);
      if (p === '/api/movers') return json(await movers(ctx), 60);
      if (p === '/api/radar') return json(await radar(ctx), 60);
      if (p === '/api/news') return json(await news(ctx, url.searchParams.get('scope') || 'market', url.searchParams.get('lang') === 'ar' ? 'ar' : 'en'), 60);
      if (p === '/api/ping') return new Response('pong ' + new Date().toISOString());
      if (p.startsWith('/api/')) return json({ error: 'not found' }, 5);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 5);
    }
    return env.ASSETS.fetch(req);
  },
};
