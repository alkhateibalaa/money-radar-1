// Money Radar — tiny standalone runtime.
// Loads data/<id>.json, runs the page's calcs and draws, and refreshes every 5 minutes.
(() => {
  const DATASETS = ['snapshot', 'pulse', 'signals', 'dips', 'movers', 'news', 'feeds', 'calendar', 'tasi',
    'bands', 'method', 'dip_bands', 'dip_method', 'income'];
  const REFRESH_MS = 5 * 60 * 1000;

  const raw = {};      // id -> {status, data}
  const calcs = {};    // id -> {inputs, fn}
  const draws = {};    // name -> fn | {mount, update, unmount}
  const mounted = new Map(); // el -> handle
  const dataCbs = [];
  let params = {};
  let cache = {};

  try {
    const q = new URLSearchParams(location.search);
    q.forEach((v, k) => { params[k] = v; });
  } catch (e) {}

  const LOOK = window.MR_LOOK || {};
  const dark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const palette = () => ((dark() ? LOOK.dark : LOOK.light) || {}).charts || ['#0f8b80', '#b07d14', '#5a8a26', '#2f76b8', '#c4544a', '#7a5fb0', '#b84d7a'];

  function data(id) {
    if (calcs[id]) {
      if (cache[id]) return cache[id];
      const ins = calcs[id].inputs.map(data);
      let out;
      if (ins.some((d) => d.status === 'error' || d.status === 'missing')) out = { status: 'error' };
      else if (ins.some((d) => d.status !== 'ok')) out = { status: 'loading' };
      else {
        try { out = { status: 'ok', data: calcs[id].fn(...ins.map((d) => d.data)) }; }
        catch (e) { console.error('calc', id, e); out = { status: 'error' }; }
      }
      cache[id] = out;
      return out;
    }
    return raw[id] || { status: DATASETS.includes(id) ? 'loading' : 'missing' };
  }

  function drawOne(el) {
    const d = draws[el.getAttribute('data-draw')];
    if (!d) return;
    try {
      if (typeof d === 'function') d(el);
      else if (!mounted.has(el)) mounted.set(el, d.mount(el));
      else d.update && d.update(el, mounted.get(el));
    } catch (e) { console.error('draw', el.getAttribute('data-draw'), e); }
  }

  // Charts measure their width, so redraw one when it is shown or resized.
  const widths = new WeakMap();
  let pending = new Set();
  let timer = null;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver((entries) => {
    entries.forEach((en) => {
      const w = Math.round(en.contentRect.width);
      if (widths.get(en.target) === w) return;
      const first = !widths.has(en.target);
      widths.set(en.target, w);
      if (!first && w > 0) pending.add(en.target);
    });
    if (pending.size && !timer) timer = setTimeout(() => {
      timer = null;
      const els = [...pending]; pending = new Set();
      els.forEach(drawOne);
    }, 120);
  }) : null;
  let observed = false;

  function renderAll() {
    cache = {};
    window.dash.colors = palette();
    document.querySelectorAll('[data-draw]').forEach(drawOne);
    if (ro && !observed) {
      observed = true;
      document.querySelectorAll('[data-draw]').forEach((el) => ro.observe(el));
    }
    dataCbs.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });
  }

  async function load() {
    const bust = '?t=' + Math.floor(Date.now() / 60000);
    await Promise.all(DATASETS.map(async (id) => {
      try {
        const r = await fetch('data/' + id + '.json' + bust, { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        raw[id] = { status: 'ok', data: await r.json() };
      } catch (e) {
        if (!raw[id] || raw[id].status !== 'ok') raw[id] = { status: 'error' };
      }
    }));
    renderAll();
  }

  window.dash = {
    colors: palette(),
    data,
    calc: (id, def) => { calcs[id] = def; },
    draw: (name, def) => { draws[name] = def; },
    params: () => ({ ...params }),
    setParams: (p) => {
      params = { ...params, ...p };
      try {
        const q = new URLSearchParams(params);
        history.replaceState(null, '', '?' + q.toString() + location.hash);
      } catch (e) {}
      renderAll();
    },
    setLink: (hash) => { try { history.replaceState(null, '', location.pathname + location.search + '#' + hash); } catch (e) {} },
    onData: (cb) => { dataCbs.push(cb); },
  };

  const start = () => {
    load();
    setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
