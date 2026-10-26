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
  outsideBand() { return this.p.assets.filter(a => !this.p.isMatured(a) && Math.abs(this.p.share(a) - a.target) > this.p.band); }

  // 1) เติมตัวที่ต่ำกว่าเป้า (นอกช่วงยอมรับ) ก่อน  2) ที่เหลือกระจายตามเป้า
  // ข้อจำกัด: ไม่เกินเพดาน (cap) ของแต่ละตัว และไม่ลงเงินใหม่ในตัวที่ครบกำหนดภายใน 30 วัน
  suggest(budget) {
    const p = this.p, V = p.totals().value, total = V + budget, A = p.assets;
    const open = A.map(a => !p.isMatured(a));
    const room = A.map(a => a.cap == null ? Infinity : Math.max(0, a.cap / 100 * total - p.value(a)));
    const need = A.map((a, i) => !open[i] || (V > 0 && p.share(a) >= a.target - p.band) ? 0 : Math.min(room[i], Math.max(0, a.target / 100 * total - p.value(a))));
    const ns = need.reduce((s, x) => s + x, 0);
    let alloc;
    if (ns >= budget && ns > 0) alloc = need.map(x => x / ns * budget);
    else {
      alloc = need.slice();
      let rest = budget - ns;
      for (let k = 0; k < 5 && rest > 1; k++) {
        const w = A.map((a, i) => open[i] && alloc[i] < room[i] - 1 ? a.target : 0), sw = w.reduce((s, x) => s + x, 0);
        if (!sw) break;
        let used = 0;
        w.forEach((wi, i) => { if (!wi) return; const add = Math.min(rest * wi / sw, room[i] - alloc[i]); alloc[i] += add; used += add; });
        rest -= used;
      }
    }
    return A.map((a, i) => ({ asset: a, amount: Math.round(alloc[i] / 10) * 10, need: need[i] }))
      .filter(x => x.amount > 0).sort((x, y) => y.need - x.need);
  }
}
