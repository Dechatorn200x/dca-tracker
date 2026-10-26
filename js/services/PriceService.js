// ดึงราคาจาก /api/quote (Vercel function) แปลงเป็นบาทให้
export class PriceService {
  constructor(endpoint = "/api/quote") { this.endpoint = endpoint; this.quotes = {}; this.updatedAt = null; }
  thbPrice(symbol) {
    const q = symbol && this.quotes[symbol.toUpperCase()];
    if (!q) return null;
    const fx = this.quotes["THB=X"]?.price;
    const k = q.currency === "THB" ? 1 : q.currency === "USD" ? fx : null;
    return k ? q.price * k : null;
  }
  quoteTime(symbol) { const q = symbol && this.quotes[symbol.toUpperCase()]; return q && q.time ? q.time * 1000 : null; }
  async refresh(symbols) {
    const s = [...new Set(symbols.map(x => (x || "").toUpperCase()).filter(Boolean))];
    if (!s.length) return false;
    try {
      const r = await fetch(`${this.endpoint}?symbols=${encodeURIComponent([...s, "THB=X"].join(","))}`);
      if (!r.ok) return false;
      Object.entries(await r.json()).forEach(([k, v]) => { if (v && v.price) this.quotes[k] = v; });
      this.updatedAt = Date.now();
      return true;
    } catch { return false; }
  }
}
