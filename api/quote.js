// Vercel serverless function: GET /api/quote?symbols=VOO,NVDA,TISCO.BK,THB=X
module.exports = async function (req, res) {
  const syms = String(req.query.symbols || "").split(",").map(s => s.trim())
    .filter(s => /^[A-Za-z0-9.\-=^]{1,15}$/.test(s)).slice(0, 20);
  const out = {};
  await Promise.all(syms.map(async s => {
    try {
      const r = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(s) + "?range=1d&interval=1d", { headers: { "User-Agent": "Mozilla/5.0" } });
      const m = (await r.json()).chart.result[0].meta;
      out[s.toUpperCase()] = { price: m.regularMarketPrice, currency: m.currency };
    } catch (e) {}
  }));
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json(out);
};
