/* Money Radar — live terminal front end. Talks only to this site's own /api (Cloudflare Worker). */
(() => {
  'use strict';

  // ---------------- i18n ----------------
  const T = {
    en: {
      tagline: 'Live market terminal', tadawul: 'TADAWUL', connecting: 'Connecting…', board: 'Markets', boardNote: 'Intraday · refreshes every 20s',
      risk: 'Risk meter', fear: 'Fear', greed: 'Greed', watch: 'My watchlist', addPh: 'Add ticker', sym: 'Symbol', last: 'Last', chg: 'Chg %',
      today: 'Today', watchHint: 'Saved on this device. Tap a row to chart it.', movers: 'Nasdaq movers', gainers: 'Gainers', losers: 'Losers',
      active: 'Active', relvol: 'Rel vol', mcap: 'Mkt cap', radar: 'Drop radar', how: 'How scoring works', drop: 'Drop', score: 'Score',
      verdict: 'Assessment', rsi: 'RSI', offHigh: 'Off high', newsMarket: 'Market wire', newsLocal: 'Riyadh & Saudi wire', all: 'All', bull: 'Up', bear: 'Down',
      safety: 'For safety alerts follow Saudi Civil Defense and the National Early Warning Platform.', nfa: 'Not financial advice.',
      footer: 'Prices from Yahoo Finance (may lag up to a minute; futures and indices as published). Headlines from CNBC, MarketWatch, Nasdaq, Saudi Gazette, Asharq Al-Awsat and Bing News, linked to their sources. Drop scores are automatic rules, not recommendations.',
      open: 'OPEN', closed: 'CLOSED', pre: 'PRE-MKT', after: 'AFTER-HRS', closesIn: 'closes in', opensIn: 'opens in',
      lastUpd: 'Last update', mktTime: 'Nasdaq data as of', fPrices: 'Prices', fWatch: 'Watchlist', fMovers: 'Movers', fRadar: 'Drop radar', fNewsM: 'Market news', fNewsL: 'Riyadh news', ruh: 'Riyadh',
      live: 'Live', updated: 'updated', ago: 'ago', now: 'now', s: 's', m: 'm', h: 'h', d: 'd', offline: 'Offline — retrying',
      xfear: 'Extreme fear', fear2: 'Fear', neutral: 'Neutral', greed2: 'Greed', xgreed: 'Extreme greed',
      rVix: 'VIX level', rNdq: 'Nasdaq today', rBreadth: 'Movers breadth', rHaven: 'Gold vs bitcoin',
      candidate: 'Dip candidate', watchV: 'Watch for base', wait: 'Wait', knife: 'Falling knife',
      pDrop: 'Size of fall', pQuality: 'Quality', pValue: 'Value', pOversold: 'Oversold', pStable: 'Stabilising',
      prev: 'Prev close', dayRange: 'Day range', range52: '52-week range', vol: 'Exchange', noNews: 'No headlines right now.',
      noRadar: 'No Nasdaq stock has fallen hard enough to make the radar right now.', alerts: 'security headlines (12h)', alertK: 'ALERT',
      badSym: 'Not found', w1d: 'today', w5d: '5 days', mktClosedNote: 'Market closed — last session',
      howHtml: '<b>Drop score (0–100)</b> rates Nasdaq stocks that fell ≥7% today, or Nasdaq-100 names down ≥10% over 5 sessions. Five parts:<ul><li><b>Size of fall (20)</b> — bigger drops score higher.</li><li><b>Quality (30)</b> — company size and the average analyst rating.</li><li><b>Value (20)</b> — forward P/E and how far it sits below its 52-week high.</li><li><b>Oversold (20)</b> — 14-day RSI and distance under the 50-day average.</li><li><b>Stabilising (10)</b> — bouncing off the day\'s low, calmer volume.</li></ul>75+ Dip candidate · 60–74 Watch for base · 45–59 Wait · under 45 Falling knife. Rules can\'t read the news: always check why it fell.',
    },
    ar: {
      tagline: 'منصة الأسواق المباشرة', tadawul: 'تداول', connecting: 'جارٍ الاتصال…', board: 'الأسواق', boardNote: 'خلال اليوم · تحديث كل 20 ثانية',
      risk: 'مقياس المخاطرة', fear: 'خوف', greed: 'طمع', watch: 'قائمة المتابعة', addPh: 'أضف رمزًا', sym: 'الرمز', last: 'السعر', chg: 'التغير %',
      today: 'اليوم', watchHint: 'محفوظة على هذا الجهاز. اضغط على السطر لعرض الرسم.', movers: 'الأكثر حركة في ناسداك', gainers: 'الرابحة', losers: 'الخاسرة',
      active: 'الأنشط', relvol: 'الحجم النسبي', mcap: 'القيمة السوقية', radar: 'رادار الهبوط', how: 'طريقة التقييم', drop: 'الهبوط', score: 'النقاط',
      verdict: 'التقييم', rsi: 'RSI', offHigh: 'عن القمة', newsMarket: 'أخبار الأسواق', newsLocal: 'أخبار الرياض والسعودية', all: 'الكل', bull: 'إيجابي', bear: 'سلبي',
      safety: 'لتنبيهات السلامة تابع الدفاع المدني ومنصة الإنذار المبكر الوطنية.', nfa: 'ليست نصيحة مالية.',
      footer: 'الأسعار من Yahoo Finance (قد تتأخر حتى دقيقة). العناوين من مصادر إخبارية مع روابطها الأصلية. نقاط رادار الهبوط قواعد آلية وليست توصيات.',
      open: 'مفتوح', closed: 'مغلق', pre: 'قبل الافتتاح', after: 'بعد الإغلاق', closesIn: 'يغلق بعد', opensIn: 'يفتح بعد',
      lastUpd: 'آخر تحديث', mktTime: 'بيانات ناسداك حتى', fPrices: 'الأسعار', fWatch: 'المتابعة', fMovers: 'الأكثر حركة', fRadar: 'رادار الهبوط', fNewsM: 'أخبار الأسواق', fNewsL: 'أخبار الرياض', ruh: 'بتوقيت الرياض',
      live: 'مباشر', updated: 'آخر تحديث', ago: '', now: 'الآن', s: 'ث', m: 'د', h: 'س', d: 'ي', offline: 'غير متصل — إعادة المحاولة',
      xfear: 'خوف شديد', fear2: 'خوف', neutral: 'محايد', greed2: 'طمع', xgreed: 'طمع شديد',
      rVix: 'مستوى VIX', rNdq: 'ناسداك اليوم', rBreadth: 'اتساع الحركة', rHaven: 'الذهب مقابل بيتكوين',
      candidate: 'فرصة محتملة', watchV: 'راقب الاستقرار', wait: 'انتظر', knife: 'سكين ساقطة',
      pDrop: 'حجم الهبوط', pQuality: 'الجودة', pValue: 'القيمة', pOversold: 'تشبع بيعي', pStable: 'الاستقرار',
      prev: 'الإغلاق السابق', dayRange: 'نطاق اليوم', range52: 'نطاق 52 أسبوع', vol: 'السوق', noNews: 'لا توجد عناوين الآن.',
      noRadar: 'لا يوجد سهم في ناسداك هبط بما يكفي لدخول الرادار حاليًا.', alerts: 'عناوين أمنية (12 ساعة)', alertK: 'تنبيه',
      badSym: 'غير موجود', w1d: 'اليوم', w5d: '5 أيام', mktClosedNote: 'السوق مغلق — آخر جلسة',
      howHtml: '<b>نقاط الهبوط (0–100)</b> تقيّم أسهم ناسداك التي هبطت 7% أو أكثر اليوم، أو أسهم ناسداك 100 التي هبطت 10% خلال 5 جلسات. خمسة أجزاء:<ul><li><b>حجم الهبوط (20)</b> — كلما كان أكبر زادت النقاط.</li><li><b>الجودة (30)</b> — حجم الشركة ومتوسط تقييم المحللين.</li><li><b>القيمة (20)</b> — مكرر الأرباح المتوقع والبعد عن قمة 52 أسبوعًا.</li><li><b>التشبع البيعي (20)</b> — مؤشر RSI لـ14 يومًا والبعد تحت متوسط 50 يومًا.</li><li><b>الاستقرار (10)</b> — الارتداد عن قاع اليوم وهدوء الحجم.</li></ul>75+ فرصة محتملة · 60–74 راقب الاستقرار · 45–59 انتظر · أقل من 45 سكين ساقطة. القواعد لا تقرأ الأخبار: تحقق دائمًا من سبب الهبوط.',
    },
  };

  const TAG_AR = { Fed: 'الفيدرالي', Earnings: 'أرباح', Chips: 'رقائق', Oil: 'نفط', Crypto: 'كريبتو', Gold: 'ذهب', 'Saudi market': 'السوق السعودية', Inflation: 'تضخم', Events: 'فعاليات', Security: 'أمني', Local: 'محلي', Markets: 'أسواق' };
  const PREC_AR = { FLASH: 'عاجل', PRIORITY: 'مهم' };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mr.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mr.' + k, JSON.stringify(v)); } catch (e) {} },
  };

  let lang = store.get('lang', (navigator.language || '').startsWith('ar') ? 'ar' : 'en');
  const t = (k) => (T[lang] && T[lang][k]) ?? T.en[k] ?? k;

  // ---------------- state ----------------
  const DEFAULT_WATCH = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD', 'GILD', 'PLTR'];
  const S = {
    watch: store.get('watch', DEFAULT_WATCH),
    sel: store.get('sel', 'NVDA'),
    range: '1d',
    movTab: 'gainers',
    toneM: 'all',
    board: null, quotes: {}, movers: null, radar: null, news: { market: null, local: null },
    lastOk: 0, fails: 0, at: {},
    seenNews: new Set(store.get('seen', [])),
  };

  // ---------------- utils ----------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  };
  const NF = {};
  const nf = (min, max) => (NF[min + '-' + max] ||= new Intl.NumberFormat('en-US', { minimumFractionDigits: min, maximumFractionDigits: max }));
  const fmtP = (v, unit) => {
    if (v == null || !isFinite(v)) return '—';
    if (unit === 'fx') return nf(4, 4).format(v);
    if (unit === 'pct') return nf(3, 3).format(v) + '%';
    const a = Math.abs(v);
    return (unit === 'usd' ? '$' : '') + (a >= 1000 ? nf(2, 2) : a >= 1 ? nf(2, 2) : nf(4, 4)).format(v);
  };
  const fmtC = (v, d = 2) => (v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(d, d).format(Math.abs(v)));
  const fmtPct = (v) => (v == null || !isFinite(v) ? '—' : fmtC(v, 2) + '%');
  const tone = (v) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'flat');
  const fmtBig = (v) => { if (!v) return '—'; const a = Math.abs(v); return a >= 1e12 ? nf(2, 2).format(v / 1e12) + 'T' : a >= 1e9 ? nf(1, 1).format(v / 1e9) + 'B' : a >= 1e6 ? nf(0, 0).format(v / 1e6) + 'M' : nf(0, 0).format(v); };
  const ago = (ms) => {
    if (!ms) return '';
    const s = Math.max(0, (Date.now() - ms) / 1000);
    const v = s < 60 ? [Math.round(s), 's'] : s < 3600 ? [Math.round(s / 60), 'm'] : s < 86400 ? [Math.round(s / 3600), 'h'] : [Math.round(s / 86400), 'd'];
    if (s < 45) return t('now');
    return lang === 'ar' ? `${v[0]}${t(v[1])}` : `${v[0]}${t(v[1])}`;
  };
  const api = async (path) => {
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    if (j && j.error) throw new Error(j.error);
    return j;
  };
  const tip = $('#tip');
  const showTip = (txt, x, y) => { tip.textContent = txt; tip.style.opacity = '1'; const w = tip.offsetWidth; tip.style.left = Math.min(window.innerWidth - w - 8, x + 12) + 'px'; tip.style.top = (y - 34) + 'px'; };
  const hideTip = () => { tip.style.opacity = '0'; };

  // sparkline
  const SVGNS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  let gid = 0;
  function spark(pts, prev, w = 120, hgt = 34) {
    const svg = sv('svg', { viewBox: `0 0 ${w} ${hgt}`, preserveAspectRatio: 'none' });
    if (!pts || pts.length < 2) return svg;
    const ys = pts.map((p) => p[1]);
    if (prev != null) ys.push(prev);
    let lo = Math.min(...ys), hi = Math.max(...ys);
    if (hi === lo) { hi += 1; lo -= 1; }
    const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
    const X = (x) => ((x - x0) / (x1 - x0 || 1)) * w;
    const Y = (y) => hgt - 2 - ((y - lo) / (hi - lo)) * (hgt - 4);
    const up = pts[pts.length - 1][1] >= (prev ?? pts[0][1]);
    const col = up ? 'var(--up)' : 'var(--dn)';
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    const id = 'g' + (++gid);
    const defs = sv('defs', {});
    const lg = sv('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(sv('stop', { offset: '0%', 'stop-color': up ? '#1fd18a' : '#ff4d5e', 'stop-opacity': '.28' }), sv('stop', { offset: '100%', 'stop-color': up ? '#1fd18a' : '#ff4d5e', 'stop-opacity': '0' }));
    defs.append(lg);
    svg.append(defs);
    if (prev != null) svg.append(sv('line', { x1: 0, x2: w, y1: Y(prev), y2: Y(prev), stroke: '#4a5661', 'stroke-dasharray': '2 3', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
    svg.append(sv('path', { d: d + `L${w} ${hgt}L0 ${hgt}Z`, fill: `url(#${id})` }));
    svg.append(sv('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }));
    return svg;
  }

  // ---------------- sessions & clocks ----------------
  function zparts(tz) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { wd: p.weekday, mins: (+p.hour % 24) * 60 + +p.minute, secs: +p.second, hms: `${String(+p.hour % 24).padStart(2, '0')}:${p.minute}:${p.second}` };
  }
  const dur = (m) => { const hh = Math.floor(m / 60), mm = m % 60; return hh ? `${hh}${t('h')} ${mm}${t('m')}` : `${mm}${t('m')}`; };
  function sessionUS() {
    const z = zparts('America/New_York');
    const wk = !['Sat', 'Sun'].includes(z.wd);
    const m = z.mins;
    if (wk && m >= 570 && m < 960) return { cls: 'open', txt: `${t('open')} · ${t('closesIn')} ${dur(960 - m)}` };
    if (wk && m >= 240 && m < 570) return { cls: 'ext', txt: `${t('pre')} · ${t('opensIn')} ${dur(570 - m)}` };
    if (wk && m >= 960 && m < 1200) return { cls: 'ext', txt: t('after') };
    return { cls: '', txt: t('closed') };
  }
  function sessionSA() {
    const z = zparts('Asia/Riyadh');
    const wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(z.wd);
    const m = z.mins;
    if (wk && m >= 600 && m < 900) return { cls: 'open', txt: `${t('open')} · ${t('closesIn')} ${dur(900 - m)}` };
    if (wk && m < 600) return { cls: '', txt: `${t('closed')} · ${t('opensIn')} ${dur(600 - m)}` };
    return { cls: '', txt: t('closed') };
  }
  const FEEDS_UI = [['prices', 'fPrices', 60e3], ['watch', 'fWatch', 90e3], ['movers', 'fMovers', 180e3], ['radar', 'fRadar', 360e3], ['newsM', 'fNewsM', 360e3], ['newsL', 'fNewsL', 360e3]];
  const fmtStamp = (ms, tz = 'Asia/Riyadh', withYear = true) => new Date(ms).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined, hour: '2-digit', minute: '2-digit', second: tz === 'Asia/Riyadh' ? '2-digit' : undefined, hour12: false });
  function renderUpd() {
    const vals = Object.values(S.at);
    if (vals.length) {
      const last = Math.max(...vals);
      $('#upd-main').textContent = `${fmtStamp(last)} ${t('ruh')}`;
      const ag = $('#upd-ago');
      ag.textContent = `(${ago(last)}${lang === 'en' && ago(last) !== t('now') ? ' ' + t('ago') : ''})`;
      ag.classList.toggle('stale', Date.now() - last > 180e3);
    }
    const ix = (S.board?.rows || []).find((r) => r.id === 'ixic');
    if (ix?.time) $('#upd-mkt').textContent = `${fmtStamp(ix.time * 1000, 'America/New_York', false)} ET`;
    $('#upd-list').replaceChildren(...FEEDS_UI.map(([k, lab, lim]) => {
      const v = S.at[k];
      const stale = v && Date.now() - v > lim;
      return h('li', { class: v ? (stale ? 'stale' : '') : 'wait', title: v ? fmtStamp(v) : '' },
        h('b', { text: t(lab) }),
        h('span', { text: v ? new Date(v).toLocaleTimeString('en-GB', { timeZone: 'Asia/Riyadh', hour12: false }) : '—' }),
        h('i', { text: v ? ago(v) : '…' }));
    }));
  }

  function tickClock() {
    renderUpd();
    $('#clk-ruh').textContent = zparts('Asia/Riyadh').hms;
    $('#clk-nyc').textContent = zparts('America/New_York').hms;
    for (const [id, f] of [['#sess-us', sessionUS], ['#sess-sa', sessionSA]]) {
      const s = f(); const el = $(id);
      el.className = 'sess ' + s.cls; $('.sess-v', el).textContent = s.txt;
    }
    const live = $('#live');
    if (S.lastOk) {
      const stale = Date.now() - S.lastOk > 120e3;
      live.className = 'live ' + (S.fails > 2 || stale ? 'err' : 'ok');
      $('#live-txt').textContent = S.fails > 2 ? t('offline') : `${t('live')} · ${t('updated')} ${ago(S.lastOk)}${lang === 'en' && ago(S.lastOk) !== t('now') ? ' ' + t('ago') : ''}`;
    }
  }

  // ---------------- board ----------------
  const prevPx = {};
  function flash(el, key, v) {
    const p = prevPx[key];
    prevPx[key] = v;
    if (p == null || v == null || p === v) return;
    el.classList.remove('flash-up', 'flash-dn'); void el.offsetWidth;
    el.classList.add(v > p ? 'flash-up' : 'flash-dn');
  }
  function renderBoard() {
    const box = $('#board');
    const rows = S.board?.rows;
    if (!rows) { if (!box.children.length) for (let i = 0; i < 12; i++) box.append(h('div', { class: 'tile' }, h('div', { class: 'tile-n skel', text: 'Loading' }), h('div', { class: 'tile-p skel', text: '00,000.00' }), h('div', { class: 'tile-c skel', text: '+0.00%' }))); return; }
    box.replaceChildren(...rows.map((r) => {
      const el = h('div', { class: 'tile', tabindex: 0, 'data-sym': r.sym },
        h('div', { class: 'tile-top' }, h('span', { class: 'tile-n', text: r.name?.[lang] || r.name?.en || r.sym }), h('span', { class: 'tile-s', text: r.sym })),
        h('div', { class: 'tile-p', text: r.error ? '—' : fmtP(r.price, r.unit) }),
        h('div', { class: 'tile-c ' + tone(r.chg_pct) }, h('span', { text: r.error ? '' : fmtC(r.chg, r.unit === 'fx' ? 4 : 2) }), h('span', { text: r.error ? '' : fmtPct(r.chg_pct) })),
        spark(r.pts, r.prev),
      );
      el.addEventListener('click', () => select(r.sym));
      flash(el, 'b:' + r.sym, r.price);
      return el;
    }));
    renderTape();
    renderRisk();
  }

  function renderTape() {
    const items = [];
    for (const r of S.board?.rows || []) if (!r.error) items.push([r.sym.replace('^', ''), fmtP(r.price, r.unit), r.chg_pct, r.sym]);
    for (const s of S.watch) { const q = S.quotes[s]; if (q && !q.error) items.push([s, fmtP(q.price), q.chg_pct, s]); }
    if (!items.length) return;
    const mk = () => items.map(([s, p, c, sym]) => h('span', { class: 'ti', onclick: () => select(sym) }, h('span', { class: 'ti-s', text: s }), h('span', { class: 'ti-p', text: p }), h('span', { class: tone(c), text: fmtPct(c) })));
    $('#tape').replaceChildren(...mk(), ...mk());
  }

  // ---------------- risk meter ----------------
  function renderRisk() {
    const by = Object.fromEntries((S.board?.rows || []).map((r) => [r.id, r]));
    const vix = by.vix?.price, ndq = by.ixic?.chg_pct, gold = by.gold?.chg_pct, btc = by.btc?.chg_pct;
    if (vix == null || ndq == null) return;
    const parts = [];
    const a = Math.max(-25, Math.min(25, (19 - vix) * 2.6)); parts.push([t('rVix'), nf(1, 1).format(vix), a]);
    const b = Math.max(-20, Math.min(20, ndq * 9)); parts.push([t('rNdq'), fmtPct(ndq), b]);
    let c = 0;
    if (S.movers) {
      const g = S.movers.gainers.length ? S.movers.gainers.slice(0, 10).reduce((s, r) => s + r.chg_pct, 0) : 0;
      const l = S.movers.losers.length ? S.movers.losers.slice(0, 10).reduce((s, r) => s + r.chg_pct, 0) : 0;
      c = Math.max(-8, Math.min(8, (g + l) / 12));
      parts.push([t('rBreadth'), (c >= 0 ? '+' : '−') + nf(1, 1).format(Math.abs(c)), c]);
    }
    const d = gold != null && btc != null ? Math.max(-7, Math.min(7, (btc - gold) * 1.2)) : 0;
    if (gold != null && btc != null) parts.push([t('rHaven'), fmtC(btc - gold, 1), d]);
    const score = Math.round(Math.max(0, Math.min(100, 50 + a + b + c + d)));
    const lab = score < 25 ? 'xfear' : score < 45 ? 'fear2' : score < 55 ? 'neutral' : score < 75 ? 'greed2' : 'xgreed';
    const col = score < 25 ? 'var(--dn)' : score < 45 ? '#f08a24' : score < 55 ? 'var(--fg2)' : 'var(--up)';
    $('#risk-num').textContent = score; $('#risk-num').style.color = col;
    $('#risk-label').textContent = t(lab); $('#risk-label').style.color = col;
    $('#risk-pin').style.left = `calc(${score}% - 1.5px)`;
    $('#risk-parts').replaceChildren(...parts.map(([k, v, p]) => h('li', null, h('span', { text: k }), h('span', { class: tone(p), text: `${v}  (${p >= 0 ? '+' : '−'}${Math.abs(Math.round(p))})` }))));
  }

  // ---------------- watchlist ----------------
  function renderWatch() {
    const tb = $('#watch tbody');
    tb.replaceChildren(...S.watch.map((s) => {
      const q = S.quotes[s];
      const tr = h('tr', { class: s === S.sel ? 'sel' : '' },
        h('td', null, h('span', { class: 'sym', text: s }), h('span', { class: 'nm', text: q?.error ? t('badSym') : q?.name || '' })),
        h('td', { class: 'num', text: q ? fmtP(q.price) : '…' }),
        h('td', { class: 'num' }, h('span', { class: 'chip ' + tone(q?.chg_pct), text: q ? fmtPct(q.chg_pct) : '…' })),
        h('td', { class: 'spark' }, q ? spark(q.pts, q.prev, 90, 24) : ''),
        h('td', null, h('button', { class: 'x', title: '×', 'aria-label': 'Remove ' + s, text: '×', onclick: (e) => { e.stopPropagation(); S.watch = S.watch.filter((x) => x !== s); store.set('watch', S.watch); renderWatch(); renderTape(); } })),
      );
      tr.addEventListener('click', () => select(s));
      if (q) flash(tr.children[1], 'w:' + s, q.price);
      return tr;
    }));
  }
  $('#add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = $('#add-input');
    const s = inp.value.trim().toUpperCase().replace(/[^A-Z0-9.^=\-]/g, '');
    if (!s) return;
    const form = $('#add-form');
    try {
      const j = await api('/api/quotes?s=' + encodeURIComponent(s));
      const q = j.rows[0];
      if (!q || q.error || q.price == null) throw new Error('nf');
      S.quotes[s] = q;
      if (!S.watch.includes(s)) S.watch.unshift(s);
      store.set('watch', S.watch);
      inp.value = '';
      renderWatch(); renderTape(); select(s);
    } catch (err) {
      form.classList.add('bad'); inp.value = ''; inp.placeholder = t('badSym');
      setTimeout(() => { form.classList.remove('bad'); inp.placeholder = t('addPh'); }, 1800);
    }
  });

  // ---------------- chart ----------------
  let chartData = null;
  function select(sym) {
    S.sel = sym; store.set('sel', sym);
    $$('#watch tbody tr').forEach((tr) => tr.classList.toggle('sel', tr.querySelector('.sym')?.textContent === sym));
    loadChart();
    if (window.innerWidth < 1000) $('.p-chart').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function loadChart() {
    const sym = S.sel, r = S.range;
    $('#chart-sym').textContent = sym.replace('^', '');
    try {
      const d = await api(`/api/history?s=${encodeURIComponent(sym)}&r=${r}`);
      if (sym !== S.sel || r !== S.range) return;
      chartData = d;
      drawChart();
    } catch (e) { $('#chart').replaceChildren(h('div', { class: 'empty', text: '—' })); }
  }
  function drawChart() {
    const d = chartData; if (!d) return;
    $('#chart-name').textContent = d.name || '';
    const pts = d.pts || [];
    const base = S.range === '1d' ? d.prev : (pts[0] ? pts[0][1] : d.prev);
    const last = d.price ?? (pts.length ? pts[pts.length - 1][1] : null);
    const chg = last != null && base ? last - base : null;
    const pct = chg != null ? (chg / base) * 100 : null;
    const unit = (S.board?.rows || []).find((x) => x.sym === d.sym)?.unit;
    $('#chart-head').replaceChildren(
      h('span', { class: 'ch-p', text: fmtP(last, unit) }),
      h('span', { class: 'ch-c ' + tone(chg), text: `${fmtC(chg)}  ${fmtPct(pct)}` }),
      h('span', { class: 'ch-t', text: `${d.currency || ''} · ${d.exch || ''} · ${d.time ? new Date(d.time * 1000).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { timeZone: 'Asia/Riyadh', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' RUH' : ''}` }),
    );
    const rng = (lo, hi, v) => { const r = h('div', { class: 'rng' }); if (lo != null && hi != null && v != null && hi > lo) r.append(h('i', { style: `left:${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%` })); return r; };
    $('#chart-stats').replaceChildren(
      h('div', { class: 'cs' }, h('div', { class: 'cs-k', text: t('prev') }), h('div', { class: 'cs-v', text: fmtP(d.prev, unit) })),
      h('div', { class: 'cs' }, h('div', { class: 'cs-k', text: t('dayRange') }), h('div', { class: 'cs-v', text: `${fmtP(d.day_low, unit)} – ${fmtP(d.day_high, unit)}` }), rng(d.day_low, d.day_high, last)),
      h('div', { class: 'cs' }, h('div', { class: 'cs-k', text: t('range52') }), h('div', { class: 'cs-v', text: `${fmtP(d.lo52, unit)} – ${fmtP(d.hi52, unit)}` }), rng(d.lo52, d.hi52, last)),
      h('div', { class: 'cs' }, h('div', { class: 'cs-k', text: t('vol') }), h('div', { class: 'cs-v', text: d.exch || '—' })),
    );
    const box = $('#chart');
    const W = Math.max(280, box.clientWidth - 8), H = box.clientHeight - 6;
    const padL = 8, padR = 62, padT = 10, padB = 22;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}` });
    if (pts.length < 2) { box.replaceChildren(svg); return; }
    const ys = pts.map((p) => p[1]).concat(S.range === '1d' && d.prev ? [d.prev] : []);
    let lo = Math.min(...ys), hi = Math.max(...ys); const padY = (hi - lo) * 0.08 || 1; lo -= padY; hi += padY;
    const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
    // use index-based x for multi-day ranges to skip overnight gaps
    const useIdx = S.range !== '1d';
    const X = (i) => padL + ((useIdx ? i / (pts.length - 1) : (pts[i][0] - x0) / (x1 - x0 || 1)) * (W - padL - padR));
    const Y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
    const up = (chg ?? 0) >= 0;
    const col = up ? '#1fd18a' : '#ff4d5e';
    const g = sv('g', { class: 'grid' }), ax = sv('g', { class: 'axis' });
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * i) / 4, y = Y(v);
      g.append(sv('line', { x1: padL, x2: W - padR, y1: y, y2: y }));
      const tx = sv('text', { x: W - padR + 8, y: y + 3.5 }); tx.textContent = fmtP(v, unit === 'usd' ? '' : unit); ax.append(tx);
    }
    const fmtX = (ts) => {
      const dt = new Date(ts * 1000);
      const o = S.range === '1d' ? { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York', hour12: false } : S.range === '5d' ? { weekday: 'short', timeZone: 'America/New_York' } : S.range === '5y' ? { year: 'numeric' } : { month: 'short', day: S.range === '1mo' ? 'numeric' : undefined };
      return dt.toLocaleString('en-US', o);
    };
    const nT = W < 500 ? 4 : 6;
    let lastLab = '';
    for (let k = 0; k < nT; k++) {
      const i = Math.round((k / (nT - 1)) * (pts.length - 1));
      const lab = fmtX(pts[i][0]); if (lab === lastLab) continue; lastLab = lab;
      const tx = sv('text', { x: X(i), y: H - 6, 'text-anchor': k === 0 ? 'start' : k === nT - 1 ? 'end' : 'middle' }); tx.textContent = lab; ax.append(tx);
    }
    const id = 'cg' + (++gid);
    const defs = sv('defs', {}); const lg = sv('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(sv('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': '.25' }), sv('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': '0' })); defs.append(lg);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    svg.append(defs, g, ax);
    if (S.range === '1d' && d.prev) { svg.append(sv('line', { x1: padL, x2: W - padR, y1: Y(d.prev), y2: Y(d.prev), stroke: '#55616c', 'stroke-dasharray': '4 4' })); }
    svg.append(sv('path', { d: line + `L${X(pts.length - 1)} ${H - padB}L${X(0)} ${H - padB}Z`, fill: `url(#${id})` }));
    svg.append(sv('path', { d: line, fill: 'none', stroke: col, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
    // last price tag
    const ly = Y(pts[pts.length - 1][1]);
    svg.append(sv('rect', { x: W - padR + 2, y: ly - 9, width: padR - 4, height: 18, rx: 3, fill: col }));
    const lt = sv('text', { x: W - padR + 8, y: ly + 4, fill: '#06080a', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700 }); lt.textContent = fmtP(pts[pts.length - 1][1], unit === 'usd' ? '' : unit); svg.append(lt);
    // crosshair
    const xh = sv('g', { class: 'xhair', style: 'display:none' });
    const vl = sv('line', { y1: padT, y2: H - padB }), hl = sv('line', { x1: padL, x2: W - padR }), dot = sv('circle', { r: 3.5, fill: col, stroke: '#06080a', 'stroke-width': 2 });
    xh.append(vl, hl, dot); svg.append(xh);
    const hit = sv('rect', { x: padL, y: padT, width: W - padL - padR, height: H - padT - padB, fill: 'transparent' });
    svg.append(hit);
    const move = (ev) => {
      const rct = svg.getBoundingClientRect();
      const cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - rct.left) * (W / rct.width);
      let best = 0, bd = Infinity;
      for (let i = 0; i < pts.length; i++) { const dd = Math.abs(X(i) - cx); if (dd < bd) { bd = dd; best = i; } }
      const p = pts[best], x = X(best), y = Y(p[1]);
      xh.style.display = ''; vl.setAttribute('x1', x); vl.setAttribute('x2', x); hl.setAttribute('y1', y); hl.setAttribute('y2', y); dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      const dt = new Date(p[0] * 1000).toLocaleString('en-US', S.range === '1d' || S.range === '5d' ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' } : { year: 'numeric', month: 'short', day: 'numeric' });
      const ch = base ? ((p[1] / base) - 1) * 100 : null;
      showTip(`${fmtP(p[1], unit)}  ${fmtPct(ch)}  ·  ${dt}${S.range === '1d' || S.range === '5d' ? ' ET' : ''}`, ev.touches ? ev.touches[0].clientX : ev.clientX, ev.touches ? ev.touches[0].clientY : ev.clientY);
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', () => { xh.style.display = 'none'; hideTip(); });
    hit.addEventListener('touchend', () => { xh.style.display = 'none'; hideTip(); });
    box.replaceChildren(svg);
  }
  $('#ranges').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.range = b.dataset.r;
    $$('#ranges button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    loadChart();
  });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawChart, 150); });

  // ---------------- movers ----------------
  function renderMovers() {
    const tb = $('#movers tbody');
    const rows = S.movers?.[S.movTab];
    if (!rows) { tb.replaceChildren(h('tr', null, h('td', { colspan: 5, class: 'empty', text: '…' }))); return; }
    if (!rows.length) { tb.replaceChildren(h('tr', null, h('td', { colspan: 5, class: 'empty', text: '—' }))); return; }
    tb.replaceChildren(...rows.map((r) => {
      const rv = r.vol && r.avg_vol ? r.vol / r.avg_vol : null;
      const tr = h('tr', null,
        h('td', null, h('span', { class: 'sym', text: r.sym }), h('span', { class: 'nm', text: r.name })),
        h('td', { class: 'num', text: fmtP(r.price) }),
        h('td', { class: 'num' }, h('span', { class: 'chip ' + tone(r.chg_pct), text: fmtPct(r.chg_pct) })),
        h('td', { class: 'num ' + (rv >= 2 ? 'up' : ''), text: rv ? nf(1, 1).format(rv) + '×' : '—' }),
        h('td', { class: 'num hide-sm', text: fmtBig(r.mcap) }),
      );
      tr.addEventListener('click', () => select(r.sym));
      return tr;
    }));
  }
  $('#mov-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.movTab = b.dataset.t;
    $$('#mov-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderMovers();
  });

  // ---------------- radar ----------------
  const PARTS = [['drop', 'pDrop', 20, '#ff4d5e'], ['quality', 'pQuality', 30, '#3ec7ff'], ['value', 'pValue', 20, '#ffb000'], ['oversold', 'pOversold', 20, '#a78bfa'], ['stable', 'pStable', 10, '#1fd18a']];
  const VLAB = { candidate: 'candidate', watch: 'watchV', wait: 'wait', knife: 'knife' };
  let openRow = null;
  function renderRadar() {
    const tb = $('#radar tbody');
    const rows = S.radar?.rows;
    $('#radar-legend').replaceChildren(...PARTS.map(([, k, max, c]) => h('span', null, h('i', { style: 'background:' + c }), `${t(k)} (${max})`)));
    if (!rows) { tb.replaceChildren(h('tr', null, h('td', { colspan: 7, class: 'empty', text: '…' }))); return; }
    if (!rows.length) { tb.replaceChildren(h('tr', null, h('td', { colspan: 7, class: 'empty', text: t('noRadar') }))); return; }
    const out = [];
    rows.forEach((r, i) => {
      const bar = h('div', { class: 'sbar' }, ...PARTS.map(([k, , , c]) => h('i', { style: `width:${r.parts[k]}%;background:${c}` })));
      const off = r.hi52 && r.price ? (r.price / r.hi52 - 1) * 100 : r.from_hi3;
      const tr = h('tr', { class: openRow === r.sym ? 'sel' : '' },
        h('td', { class: 'mono', text: i + 1 }),
        h('td', null, h('span', { class: 'sym', text: r.sym }), h('span', { class: 'nm', text: r.name })),
        h('td', { class: 'num' }, h('span', { class: 'dn', text: fmtPct(r.drop_pct) }), h('span', { class: 'nm', text: r.window === '5d' ? t('w5d') : t('w1d') })),
        h('td', null, h('div', { class: 'sc' }, h('b', { text: r.score }), bar)),
        h('td', null, h('span', { class: 'verdict v-' + r.band, text: t(VLAB[r.band]) })),
        h('td', { class: 'num hide-sm', text: r.rsi != null ? nf(0, 0).format(r.rsi) : '—' }),
        h('td', { class: 'num hide-sm dn', text: off != null ? fmtPct(off) : '—' }),
      );
      tr.addEventListener('click', () => { openRow = openRow === r.sym ? null : r.sym; renderRadar(); select(r.sym); });
      out.push(tr);
      if (openRow === r.sym) {
        out.push(h('tr', { class: 'detail' }, h('td', { colspan: 7 },
          h('div', { class: 'parts' }, ...PARTS.map(([k, lk, max, c]) => h('div', { class: 'part' }, t(lk), h('b', { text: `${r.parts[k]}/${max}` }), h('div', { class: 'pb' }, h('i', { style: `width:${(r.parts[k] / max) * 100}%;background:${c}` }))))),
          h('div', { class: 'facts' },
            h('span', { text: `${t('last')}: ${fmtP(r.price)}` }),
            r.mcap ? h('span', { text: `${t('mcap')}: ${fmtBig(r.mcap)}` }) : null,
            r.pe_fwd ? h('span', { text: `Fwd P/E: ${nf(1, 1).format(r.pe_fwd)}` }) : null,
            r.rating_txt ? h('span', { text: `Analysts: ${r.rating_txt}` }) : null,
            r.rsi != null ? h('span', { text: `RSI(14): ${nf(0, 0).format(r.rsi)}` }) : null,
            r.hi52 ? h('span', { text: `52w high: ${fmtP(r.hi52)}` }) : null,
          ),
        )));
      }
    });
    tb.replaceChildren(...out);
  }
  $('#how-btn').addEventListener('click', () => { const el = $('#how'); el.hidden = !el.hidden; el.innerHTML = t('howHtml'); });

  // ---------------- news ----------------
  function renderNews(scope) {
    const list = $(scope === 'market' ? '#news-market' : '#news-local');
    const items = S.news[scope]?.items;
    if (!items) { list.replaceChildren(h('li', { class: 'empty', text: '…' })); return; }
    let rows = items;
    if (scope === 'market' && S.toneM !== 'all') rows = rows.filter((x) => x.tone === S.toneM);
    if (!rows.length) { list.replaceChildren(h('li', { class: 'empty', text: t('noNews') })); }
    else list.replaceChildren(...rows.slice(0, 40).map((n) => {
      const key = n.link;
      const isNew = S.newsBoot && !S.seenNews.has(key);
      return h('li', { class: `wi t-${n.tone}${isNew ? ' new' : ''}` },
        h('span', { class: 'wi-t', text: n.ts ? ago(n.ts) : '' }),
        h('div', null,
          h('div', { class: 'wi-h' }, h('a', { href: n.link, target: '_blank', rel: 'noopener noreferrer', text: n.title })),
          h('div', { class: 'wi-m' },
            n.prec !== 'ROUTINE' ? h('span', { class: 'tag prec-' + n.prec, text: lang === 'ar' ? PREC_AR[n.prec] : n.prec }) : null,
            h('span', { class: 'tag', text: lang === 'ar' ? TAG_AR[n.tag] || n.tag : n.tag }),
            h('span', { text: n.src }),
          ),
        ),
      );
    }));
    for (const n of items) S.seenNews.add(n.link);
    store.set('seen', [...S.seenNews].slice(-400));
    if (scope === 'local') {
      const al = items.filter((n) => n.tag === 'Security' && n.ts && Date.now() - n.ts < 12 * 3600e3);
      $('#alert-count').textContent = al.length ? `${al.length} ${t('alerts')}` : '';
      const bar = $('#alertbar');
      bar.hidden = !al.length;
      if (al.length) bar.replaceChildren(h('b', { text: t('alertK') }), h('a', { href: al[0].link, target: '_blank', rel: 'noopener noreferrer', text: `${al[0].title} · ${ago(al[0].ts)}` }));
    }
  }
  $('#tone-m').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.toneM = b.dataset.f;
    $$('#tone-m button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderNews('market');
  });

  // ---------------- language ----------------
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    if (!$('#how').hidden) $('#how').innerHTML = t('howHtml');
    renderBoard(); renderWatch(); renderMovers(); renderRadar(); drawChart(); tickClock();
  }
  $('#lang').addEventListener('click', () => {
    lang = lang === 'en' ? 'ar' : 'en'; store.set('lang', lang);
    S.news = { market: null, local: null }; renderNews('market'); renderNews('local');
    applyLang(); loadNews();
  });

  // ---------------- polling ----------------
  const ok = () => { S.lastOk = Date.now(); S.fails = 0; };
  const fail = () => { S.fails++; };
  async function loadBoard() { try { S.board = await api('/api/board'); S.at.prices = S.board.at || Date.now(); ok(); renderBoard(); if (S.range === '1d' && S.board.rows.some((r) => r.sym === S.sel)) loadChart(); } catch (e) { fail(); } }
  async function loadQuotes() {
    if (!S.watch.length) { renderWatch(); return; }
    try { const j = await api('/api/quotes?s=' + S.watch.map(encodeURIComponent).join(',')); for (const q of j.rows) S.quotes[q.sym] = q; S.at.watch = j.at || Date.now(); ok(); renderWatch(); renderTape(); if (S.range === '1d' && S.watch.includes(S.sel)) loadChart(); } catch (e) { fail(); }
  }
  async function loadMovers() { try { S.movers = await api('/api/movers'); S.at.movers = S.movers.at || Date.now(); ok(); renderMovers(); renderRisk(); } catch (e) { fail(); } }
  async function loadRadar() { try { S.radar = await api('/api/radar'); S.at.radar = S.radar.at || Date.now(); ok(); renderRadar(); } catch (e) { fail(); } }
  async function loadNews() {
    await Promise.all(['market', 'local'].map(async (sc) => {
      try { S.news[sc] = await api(`/api/news?scope=${sc}&lang=${lang}`); S.at[sc === 'market' ? 'newsM' : 'newsL'] = S.news[sc].at || Date.now(); ok(); renderNews(sc); } catch (e) { fail(); }
    }));
    S.newsBoot = true;
  }

  const timers = [];
  function every(fn, ms) { fn(); timers.push([fn, ms, setInterval(() => { if (!document.hidden) fn(); }, ms)]); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - S.lastOk > 20e3) { loadBoard(); loadQuotes(); loadMovers(); loadNews(); } });

  applyLang();
  renderNews('market'); renderNews('local');
  setInterval(tickClock, 1000);
  every(loadBoard, 20e3);
  every(loadQuotes, 30e3);
  every(loadMovers, 60e3);
  every(loadRadar, 120e3);
  every(loadNews, 120e3);
  loadChart();
})();
