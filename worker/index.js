const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/probe') {
      const tests = {
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
      const out = {};
      await Promise.all(Object.entries(tests).map(async ([k, u]) => {
        try {
          const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept': '*/*' } });
          const t = await r.text();
          out[k] = { status: r.status, len: t.length, head: t.slice(0, 220) };
        } catch (e) { out[k] = { error: String(e) }; }
      }));
      return Response.json(out);
    }
    return env.ASSETS.fetch(req);
  },
};
