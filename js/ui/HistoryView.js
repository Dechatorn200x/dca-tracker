import { View } from "./View.js";
import { esc, fmt } from "./format.js";

export class HistoryView extends View {
  label(t) { const a = this.p.asset(t.asset_id); return a ? a.label : t.asset_id.toUpperCase(); }
  render() {
    const h = `<h1>ประวัติการซื้อ</h1>`;
    if (!this.p.tx.length) return h + `<div class="empty">ยังไม่มีรายการ ไปแท็บ “ซื้อ” เพื่อบันทึกครั้งแรก</div>`;
    return h + this.p.tx.slice().sort((a, b) => a.date < b.date ? 1 : -1).map(t => `<div class="card row"><div><b>${esc(this.label(t))}</b> <span class="mute">${t.date}</span>
${t.units ? `<div class="mute">${+t.units.toFixed(4)} หน่วย${t.price_per_unit ? ` @ ${+t.price_per_unit.toFixed(2)}` : ""}</div>` : ""}</div>
<div style="text-align:right"><b>${fmt(t.amount_thb)}</b> บาท<br><button class="s d" data-act="del" data-id="${t.id}">ลบ</button></div></div>`).join("");
  }
  act(name, el) { if (name === "del" && confirm("ลบรายการนี้?")) { this.p.removeTx(el.dataset.id); this.app.commit(); } }
}
