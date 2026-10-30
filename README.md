# Money Radar — live market terminal

Public site: https://money-radar-1.alkhateibalaa.workers.dev

A self-running Cloudflare Worker + static front end. No API keys and no manual updates.

- `worker/index.js` — API on the edge (cached 30 s – 15 min):
  - `/api/board` indices, oil, gold, bitcoin, TASI, USD/SAR (Yahoo Finance, intraday)
  - `/api/quotes?s=AAPL,MSFT` watchlist quotes · `/api/history?s=NVDA&r=1d|5d|1mo|6mo|1y|5y`
  - `/api/movers` Nasdaq gainers / losers / most active (Yahoo screeners)
  - `/api/radar` rule-based drop score for hard-falling Nasdaq stocks
  - `/api/news?scope=market|local&lang=en|ar` RSS headlines (CNBC, MarketWatch, Nasdaq, Saudi Gazette, Asharq Al-Awsat, Bing News)
- `public/` — the terminal UI (`index.html`, `app.css`, `app.js`), English / Arabic.

Every push to `main` redeploys via Cloudflare's Git integration (`npx wrangler deploy`).

Not financial advice.
