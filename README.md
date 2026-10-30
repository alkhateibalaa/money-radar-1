# Money Radar

A static intelligence console: Nasdaq signals, a drop radar, market news and Riyadh local intel.

- `index.html` – the page (layout, styles, charts; uses d3 from cdnjs)
- `dash.js` – small runtime that loads `data/*.json` and draws the page; it re-checks for new data every 5 minutes
- `data/*.json` – datasets, rewritten by an hourly Claude sweep (10:39–23:39 Riyadh, Sun–Fri)

Hosted on Cloudflare Pages: no build step, output directory `/`.

Research, not financial advice.
