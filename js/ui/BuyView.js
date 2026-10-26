import { View } from "./View.js";
import { esc, fmt, today } from "./format.js";

export class BuyView extends View {
  render() {
    const p = this.p, sg = this.engine.suggest(p.budget), left = p.budget - sg.reduce((m, x) => m + x.amount, 0);
    const list = !sg.length || !p.budget ? `<div class="empty">ใส่จำนวนเงินเพื่อดูคำแนะนำ</div>`
      : sg.map(x => `<div class="sug row"><div><b>${esc(x.asset.label)}</b><div class="mute">${x.need > 0 ? `ต่ำกว่าเป้า ${fmt(x.need)} บาท` : "เติมตามสัดส่วนเป้า"}</div></div>
<div style="text-align:right"><b>${fmt(x.amount)}</b> บาท<br><button class="s p" data-act="quick" data-id="${esc(x.asset.id)}" data-amt="${x.amount}">บันทึกซื้อ</button></div></div>`).join("")
        + `<div class="hint">ตัวที่อยู่ในช่วงยอมรับ ±${p.band}% จะไม่ถูกแนะนำก่อน อัปเดตมูลค่าที่หน้าภาพรวมให้ตรงจริงจะแม่นขึ้น</div>${left > 50 ? `<div class="hint" style="color:var(--amber)">เหลือ ${fmt(left)} บาทที่ยังไม่มีที่ลง (ติดเพดานสัดส่วน หรือตัวที่เหลือครบกำหนดแล้ว)</div>` : ""}`;
    const f = this.flash; this.flash = "";
    return `<h1>ซื้อประจำเดือน</h1>${f ? `<div class="hint" style="color:var(--green);margin:0 0 12px">${esc(f)}</div>` : ""}<div class="card"><label style="margin-top:0">เดือนนี้มีเงินเติมเท่าไร (บาท)</label>
<input type="number" inputmode="decimal" value="${p.budget}" data-chg="budget"><h2>ระบบแนะนำให้ซื้อ</h2>${list}</div>
<h2>บันทึกเอง</h2><div class="card"><div class="grid2"><div><label style="margin-top:0">วันที่</label><input type="date" id="f_d" value="${today()}"></div>
<div><label style="margin-top:0">สินทรัพย์</label><select id="f_a">${p.assets.map(a => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("")}</select></div></div>
<label>จำนวนเงิน (บาท)</label><input type="number" inputmode="decimal" id="f_m">
<div class="grid2"><div><label>จำนวนหน่วย (ถ้ามี)</label><input type="number" inputmode="decimal" id="f_u"></div><div><label>ราคาต่อหน่วย (ถ้ามี)</label><input type="number" inputmode="decimal" id="f_p"></div></div>
<p><button class="p" style="width:100%" data-act="addTx">บันทึกการซื้อ</button></p></div>`;
  }
  // ยืนยันก่อนบันทึก + กันแตะซ้ำภายใน 1.5 วินาที + เตือนถ้าเพิ่งบันทึกรายการเดียวกัน
  ok(id, amt, date) {
    if (Date.now() - (this.last || 0) < 1500) return false;
    try {
      const a = this.p.asset(id);
      if (!confirm(`ซื้อ ${a.label} ${fmt(amt)} บาท วันที่ ${date} ใช่ไหม?`)) return false;
      if (this.p.recentDuplicate(id, amt, date, 120000) && !confirm("เพิ่งบันทึกรายการเดียวกันไปเมื่อสักครู่ ต้องการบันทึกซ้ำจริงไหม?")) return false;
      return true;
    } finally { this.last = Date.now(); }
  }
  // หักงบเดือนนี้เมื่อบันทึกซื้อ (งบไม่ควรค้างเท่าเดิมหลังซื้อแล้ว)
  spend(amt) { this.p.budget = Math.max(0, this.p.budget - amt); this.flash += ` · งบเหลือ ${fmt(this.p.budget)} บาท`; }
  act(name, el) {
    const app = this.app, q = s => app.root.querySelector(s);
    if (name === "quick") {
      const amt = +el.dataset.amt, date = today();
      if (!this.ok(el.dataset.id, amt, date)) return;
      el.disabled = true;
      this.flash = `บันทึกซื้อ ${this.p.asset(el.dataset.id).label} ${fmt(amt)} บาท แล้ว`;
      this.p.buy(el.dataset.id, amt, date); this.spend(amt); app.commit();
    }
    if (name === "addTx") {
      const m = +q("#f_m").value, id = q("#f_a").value, date = q("#f_d").value || today();
      if (!(m > 0)) return alert("กรอกจำนวนเงินเป็นบาท");
      if (!this.ok(id, m, date)) return;
      el.disabled = true;
      this.flash = `บันทึกซื้อ ${this.p.asset(id).label} ${fmt(m)} บาท แล้ว`;
      this.p.buy(id, m, date, +q("#f_u").value, +q("#f_p").value); this.spend(m);
      app.tab = "hist"; app.commit();
    }
  }
  change(name, el) { if (name === "budget") { this.p.budget = +el.value || 0; this.app.commit(); } }
}
