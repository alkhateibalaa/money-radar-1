const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/ping') return new Response('pong ' + new Date().toISOString(), { headers: { 'content-type': 'text/plain' } });
    if (url.pathname === '/api/probe') {
      const extra = {
        bing: 'https://www.bing.com/news/search?q=Riyadh&format=rss',
        bing_ar: 'https://www.bing.com/news/search?q=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6&format=rss&setlang=ar',
        alarabiya_ar: 'https://www.alarabiya.net/feed/rss2/ar.xml',
        alarabiya_en: 'https://english.alarabiya.net/feed/rss2/en.xml',
        saudigazette: 'https://saudigazette.com.sa/rssFeed/74',
        gulfnews_saudi: 'https://gulfnews.com/feed/world/gulf/saudi',
        yahoo_rss: 'https://finance.yahoo.com/news/rssindex',
        nasdaq_rss: 'https://www.nasdaq.com/feed/rssoutbound?category=Markets',
        mw: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
        cnbc_ar: 'https://www.cnbcarabia.com/rss',
        argaam: 'https://www.argaam.com/ar/rss/latest-news',
        aawsat: 'https://aawsat.com/feed',
        gnews2: 'https://news.google.com/rss/search?q=Riyadh&hl=en-US&gl=US&ceid=US:en',
        screener_g: 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=3',
      };
      const tests0 = {
        chart: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?range=1d&interval=5m',
        chart2: 'https://query2.finance.yahoo.com/v8/finance/chart/%5ETASI.SR?range=5d&interval=1d',
        spark: 'https://query1.finance.yahoo.com/v8/finance/spark?symbols=AAPL,MSFT,NVDA&range=5d&interval=1d',
        spark7: 'https://query1.finance.yahoo.com/v7/finance/spark?symbols=AAPL,MSFT&range=5d&interval=1d',
        screener: 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_losers&count=25',
        quote: 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL',
        stooq: 'https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv',
        gnews: 'https://news.google.com/rss/search?q=Nasdaq%20stocks&hl=en-US&gl=US&ceid=US:en',
        gnews_ar: 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6&hl=ar&gl=SA&ceid=SA:ar',
        cnbc: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
        arabnews: 'https://www.arabnews.com/cat/1/rss.xml',
        coingecko: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        nasdaq: 'https://api.nasdaq.com/api/marketmovers?assetclass=stocks&exchangestatus=currentMarket&limit=10',
      };
      const tests = url.searchParams.get('set') === '2' ? extra : tests0;
      const out = {};
      await Promise.all(Object.entries(tests).map(async ([k, u]) => {
        try {
          const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept': '*/*' }, signal: AbortSignal.timeout(12000) });
          const t = await r.text();
          out[k] = { status: r.status, len: t.length, head: url.searchParams.get('set') === '2' && k === 'screener_g' ? t.slice(0, 2500) : t.slice(0, 220) };
        } catch (e) { out[k] = { error: String(e) }; }
      }));
      const only = url.searchParams.get('k');
      const lines = Object.entries(out).filter(([k]) => !only || k === only).map(([k, v]) => k + ' | ' + (v.error || (v.status + ' | ' + v.len + ' | ' + v.head.replace(/\s+/g, ' '))));
      return new Response(lines.join('\n\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    return env.ASSETS.fetch(req);
  },
};
