// กติกา rebalance + ระบบแนะนำ แยกออกมาเพื่อแก้/ลองกลยุทธ์ใหม่ได้ง่าย
export class RebalanceEngine {
  constructor(portfolio) { this.p = portfolio; }

  status(diff) {
    const b = this.p.band;
    if (Math.abs(diff) <= b) return { color: "var(--green)", label: "ใกล้เป้า" };
    if (diff > b) return { color: "var(--blue)", label: "เกินเป้า" };
    if (diff > -(b + 3)) return { color: "var(--amber)", label: "ต่ำกว่าเป้า" };
    return { color: "var(--red)", label: "ขาดมาก" };
  }
  outsideBand() { return this.p.assets.filter(a => Math.abs(this.p.share(a) - a.target) > this.p.band); }

  // เติมเงินใหม่ให้ตัวที่ต่ำกว่าเป้า (นอกช่วงยอมรับ) ก่อน ที่เหลือกระจายตามสัดส่วนเป้า
  suggest(budget) {
    const p = this.p, V = p.totals().value, total = V + budget;
    const need = p.assets.map(a => V > 0 && p.share(a) >= a.target - p.band ? 0 : Math.max(0, a.target / 100 * total - p.value(a)));
    const ns = need.reduce((s, x) => s + x, 0), ts = p.targetSum() || 1;
    const res = ns >= budget && ns > 0 ? need.map(x => x / ns * budget) : need.map((x, i) => x + (budget - ns) * p.assets[i].target / ts);
    return p.assets.map((a, i) => ({ asset: a, amount: Math.round(res[i] / 10) * 10, need: need[i] }))
      .filter(x => x.amount > 0).sort((x, y) => y.need - x.need);
  }
}
