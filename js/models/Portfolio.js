import { Asset } from "./Asset.js";
import { Transaction } from "./Transaction.js";

// เก็บสินทรัพย์ + รายการซื้อ + การตั้งค่า และคำนวณมูลค่า (ไม่ยุ่งกับ UI/เครือข่าย)
export class Portfolio {
  constructor({ assets = [], tx = [], budget = 10000, band = 2, updated = 0 } = {}) {
    this.assets = assets.map(a => new Asset(a));
    this.tx = tx.map(t => new Transaction(t));
    this.budget = budget;
    this.band = band ?? 2;       // ช่วงยอมรับ ± % จากเป้า
    this.updated = updated;      // เวลาแก้ไขล่าสุด ใช้ตัดสินตอนซิงค์
    this.prices = null;          // PriceService (ไม่เก็บลงข้อมูล)
  }
  static fromJSON(d) { return new Portfolio(d); }
  static createDefault() {
    return new Portfolio({ assets: [
      { id: "voo", name: "Vanguard S&P 500 ETF", category: "US_Core", target: 50, symbol: "VOO" },
      { id: "nvda", name: "NVIDIA", category: "US_Satellite", target: 15, symbol: "NVDA" },
      { id: "o", name: "Realty Income", category: "US_Satellite", target: 15, symbol: "O" },
      { id: "tisco", name: "TISCO", category: "Thai_Stock", target: 10, symbol: "TISCO.BK" },
      { id: "gold", name: "ทองคำ", category: "Other", target: 10, symbol: "" }] });
  }
  toJSON() { return { assets: this.assets, tx: this.tx, budget: this.budget, band: this.band, updated: this.updated }; }
  touch() { this.updated = Date.now(); }

  asset(id) { return this.assets.find(a => a.id === id); }
  txOf(a) { return this.tx.filter(t => t.asset_id === a.id); }
  cost(a) { return this.txOf(a).reduce((s, t) => s + t.amount_thb, 0); }
  // รวมหน่วยได้ก็ต่อเมื่อทุกรายการมี units ไม่งั้นคืน null แล้วใช้มูลค่าที่กรอกเอง
  units(a) { const t = this.txOf(a); return !t.length || t.some(x => !x.units) ? null : t.reduce((s, x) => s + x.units, 0); }
  livePrice(a) { return this.prices ? this.prices.thbPrice(a.symbol) : null; }
  isLive(a) { return this.units(a) != null && this.livePrice(a) != null; }
  value(a) { return this.isLive(a) ? this.units(a) * this.livePrice(a) : (a.value ?? this.cost(a)); }
  totals() {
    return this.assets.reduce((t, a) => ({ value: t.value + this.value(a), cost: t.cost + this.cost(a) }), { value: 0, cost: 0 });
  }
  share(a) { const v = this.totals().value; return v > 0 ? this.value(a) / v * 100 : 0; }
  targetSum() { return this.assets.reduce((s, a) => s + a.target, 0); }

  addAsset(a) { this.assets.push(a); }
  removeAsset(id) { this.tx = this.tx.filter(t => t.asset_id !== id); this.assets = this.assets.filter(a => a.id !== id); }
  // เปลี่ยนหุ้นในช่องเดิม (คงเป้า % และหมวด) migrate=true ย้ายประวัติมาด้วยแต่ล้างจำนวนหน่วย เพราะคำนวณจากหุ้นตัวเก่า
  replaceAsset(oldId, next, migrate) {
    const i = this.assets.findIndex(a => a.id === oldId);
    if (i < 0) return;
    if (migrate) {
      this.tx.forEach(t => { if (t.asset_id === oldId) { t.asset_id = next.id; t.units = null; t.price_per_unit = null; } });
      next.value = this.assets[i].value;
    } else this.tx = this.tx.filter(t => t.asset_id !== oldId);
    this.assets[i] = next;
  }
  buy(assetId, amount, date, units, price) {
    const a = this.asset(assetId), lp = a && this.livePrice(a);
    if (!units && lp) { units = amount / lp; price = lp; }   // คำนวณหน่วยจากราคาสดให้อัตโนมัติ
    this.tx.push(Transaction.create({ date, asset_id: assetId, amount_thb: amount, units: units || null, price_per_unit: price || null }));
    if (a && a.value != null) a.value += amount;
  }
  removeTx(id) {
    const t = this.tx.find(x => x.id === id), a = t && this.asset(t.asset_id);
    if (a && a.value != null) a.value = Math.max(0, a.value - t.amount_thb);
    this.tx = this.tx.filter(x => x.id !== id);
  }
}
