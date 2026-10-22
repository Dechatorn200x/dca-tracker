import { View } from "./View.js";
import { esc, fmt, today } from "./format.js";

export class BuyView extends View {
  render() {
    const p = this.p, sg = this.engine.suggest(p.budget);
    const list = !sg.length || !p.budget ? `<div class="empty">ใส่จำนวนเงินเพื่อดูคำแนะนำ</div>`
      : sg.map(x => `<div class="sug row"><div><b>${esc(x.asset.id.toUpperCase())}</b><div class="mute">${x.need > 0 ? `ต่ำกว่าเป้า ${fmt(x.need)} บาท` : "เติมตามสัดส่วนเป้า"}</div></div>
<div style="text-align:right"><b>${fmt(x.amount)}</b> บาท<br><button class="s p" data-act="quick" data-id="${esc(x.asset.id)}" data-amt="${x.amount}">บันทึกซื้อ</button></div></div>`).join("")
        + `<div class="hint">ตัวที่อยู่ในช่วงยอมรับ ±${p.band}% จะไม่ถูกแนะนำก่อน อัปเดตมูลค่าที่หน้าภาพรวมให้ตรงจริงจะแม่นขึ้น</div>`;
    return `<h1>ซื้อประจำเดือน</h1><div class="card"><label style="margin-top:0">เดือนนี้มีเงินเติมเท่าไร (บาท)</label>
<input type="number" inputmode="decimal" value="${p.budget}" data-chg="budget"><h2>ระบบแนะนำให้ซื้อ</h2>${list}</div>
<h2>บันทึกเอง</h2><div class="card"><div class="grid2"><div><label style="margin-top:0">วันที่</label><input type="date" id="f_d" value="${today()}"></div>
<div><label style="margin-top:0">สินทรัพย์</label><select id="f_a">${p.assets.map(a => `<option value="${esc(a.id)}">${esc(a.id.toUpperCase())}</option>`).join("")}</select></div></div>
<label>จำนวนเงิน (บาท)</label><input type="number" inputmode="decimal" id="f_m">
<div class="grid2"><div><label>จำนวนหน่วย (ถ้ามี)</label><input type="number" inputmode="decimal" id="f_u"></div><div><label>ราคาต่อหน่วย (ถ้ามี)</label><input type="number" inputmode="decimal" id="f_p"></div></div>
<p><button class="p" style="width:100%" data-act="addTx">บันทึกการซื้อ</button></p></div>`;
  }
  act(name, el) {
    const app = this.app, q = s => app.root.querySelector(s);
    if (name === "quick") {
      this.p.buy(el.dataset.id, +el.dataset.amt, today()); app.commit();
      alert(`บันทึกซื้อ ${el.dataset.id.toUpperCase()} ${fmt(el.dataset.amt)} บาท แล้ว`);
    }
    if (name === "addTx") {
      const m = +q("#f_m").value;
      if (!(m > 0)) return alert("กรอกจำนวนเงินเป็นบาท");
      this.p.buy(q("#f_a").value, m, q("#f_d").value || today(), +q("#f_u").value, +q("#f_p").value);
      app.tab = "hist"; app.commit();
    }
  }
  change(name, el) { if (name === "budget") { this.p.budget = +el.value || 0; this.app.commit(); } }
}
