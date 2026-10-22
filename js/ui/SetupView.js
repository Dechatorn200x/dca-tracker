import { View } from "./View.js";
import { esc } from "./format.js";
import { Asset, CATEGORIES } from "../models/Asset.js";
import { Portfolio } from "../models/Portfolio.js";

export class SetupView extends View {
  account() {
    const s = this.app.sync;
    if (!s.enabled) return `<div class="card"><b>ซิงค์ข้ามเครื่อง</b><div class="mute">ยังไม่ได้ตั้งค่า Supabase (ดู README) ตอนนี้ข้อมูลอยู่ในเครื่องนี้เท่านั้น</div></div>`;
    if (s.user) return `<div class="card"><div class="row"><div><b>ซิงค์ข้ามเครื่องเปิดอยู่</b><div class="mute">${esc(s.user.email || "บัญชีของคุณ")} · ${esc(s.message)}</div></div><button class="s" data-act="logout">ออกจากระบบ</button></div></div>`;
    return `<div class="card"><b>ซิงค์ข้ามเครื่อง</b><div class="mute">ล็อกอินเพื่อให้พอร์ตตามคุณไปทุกเครื่อง ข้อมูลของแต่ละคนแยกกัน</div>
<div class="grid2" style="margin-top:10px"><button class="p" data-act="login" data-p="github">GitHub</button><button data-act="login" data-p="google">Google</button></div></div>`;
  }
  render() {
    const p = this.p, s = p.targetSum(), ok = Math.abs(s - 100) < 0.01;
    const cats = sel => Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}"${sel === k ? " selected" : ""}>${v}</option>`).join("");
    return `<h1>จัดการพอร์ต</h1>${this.account()}
<div class="card"><label style="margin-top:0">ช่วงยอมรับ (± % จากเป้า) ถ้าอยู่ในช่วงนี้ไม่ต้องปรับ</label><input type="number" inputmode="decimal" value="${p.band}" data-chg="band"></div>
<div class="card row"><span>เป้าหมายรวม</span><b class="${ok ? "up" : "warn"}">${+s.toFixed(2)}%${ok ? " ✓" : " (ต้องเท่ากับ 100)"}</b></div>
${p.assets.map(a => `<div class="card"><div class="row"><b>${esc(a.id.toUpperCase())}</b><button class="s d" data-act="delAsset" data-id="${esc(a.id)}">ลบ</button></div>
<label>ชื่อ</label><input value="${esc(a.name)}" data-chg="field" data-f="name" data-id="${esc(a.id)}">
<label>สัญลักษณ์ราคา (Yahoo Finance เช่น VOO, TISCO.BK ว่างไว้ถ้ากรอกราคาเอง)</label><input value="${esc(a.symbol || "")}" data-chg="field" data-f="symbol" data-id="${esc(a.id)}">
<div class="grid2"><div><label>หมวด</label><select data-chg="field" data-f="category" data-id="${esc(a.id)}">${cats(a.category)}</select></div>
<div><label>เป้า (%)</label><input type="number" inputmode="decimal" value="${a.target}" data-chg="field" data-f="target" data-id="${esc(a.id)}"></div></div></div>`).join("")}
<h2>เพิ่มสินทรัพย์</h2><div class="card"><div class="grid2"><div><label style="margin-top:0">ตัวย่อ (เช่น QQQM)</label><input id="n_id"></div><div><label style="margin-top:0">เป้า (%)</label><input type="number" inputmode="decimal" id="n_t"></div></div>
<label>ชื่อเต็ม</label><input id="n_n"><label>สัญลักษณ์ราคา (ถ้ามี)</label><input id="n_s"><label>หมวด</label><select id="n_c">${cats("")}</select>
<p><button class="p" style="width:100%" data-act="addAsset">เพิ่ม</button></p></div>
<h2>สำรองข้อมูล</h2><div class="card"><div class="mute">ข้อมูลเก็บในเครื่องนี้ (และซิงค์ถ้าล็อกอิน) ใช้ย้ายเครื่องแบบไม่ล็อกอินได้ด้วย</div>
<label>ข้อมูล (คัดลอก หรือวางเพื่อนำเข้า)</label><textarea id="bk" rows="4"></textarea>
<div class="grid2" style="margin-top:10px"><button data-act="exp">สร้างข้อมูลสำรอง</button><button data-act="imp">นำเข้าข้อมูล</button></div>
<p><button class="d" style="width:100%" data-act="reset">ล้างข้อมูลทั้งหมด</button></p></div>`;
  }
  act(name, el) {
    const app = this.app, p = this.p, q = s => app.root.querySelector(s);
    if (name === "login") app.sync.login(el.dataset.p);
    if (name === "logout") app.sync.logout();
    if (name === "delAsset" && confirm(`ลบ ${el.dataset.id.toUpperCase()} และประวัติการซื้อของตัวนี้?`)) { p.removeAsset(el.dataset.id); app.commit(); }
    if (name === "addAsset") {
      const id = q("#n_id").value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
      if (!id) return alert("ใส่ตัวย่อสินทรัพย์");
      if (p.asset(id)) return alert("มีสินทรัพย์นี้แล้ว");
      p.addAsset(new Asset({ id, name: q("#n_n").value || id.toUpperCase(), category: q("#n_c").value, target: +q("#n_t").value || 0, symbol: q("#n_s").value.trim().toUpperCase() }));
      app.commit(); app.refreshPrices();
    }
    if (name === "exp") { const t = q("#bk"); t.value = JSON.stringify(p); t.select(); try { navigator.clipboard.writeText(t.value); } catch {} }
    if (name === "imp") {
      try {
        const d = JSON.parse(q("#bk").value);
        if (!d.assets || !d.tx) throw 0;
        if (!confirm("แทนที่ข้อมูลปัจจุบันทั้งหมด?")) return;
        app.setPortfolio(Portfolio.fromJSON(d)); app.commit(); app.refreshPrices();
      } catch { alert("ข้อมูลไม่ถูกต้อง วางข้อมูลสำรองที่คัดลอกไว้"); }
    }
    if (name === "reset" && confirm("ล้างข้อมูลทั้งหมดและเริ่มใหม่?")) { app.setPortfolio(Portfolio.createDefault()); app.commit(); }
  }
  change(name, el) {
    const p = this.p;
    if (name === "band") { p.band = Math.max(0, +el.value || 0); this.app.commit(); }
    if (name === "field") {
      const a = p.asset(el.dataset.id), f = el.dataset.f;
      a[f] = f === "target" ? +el.value || 0 : f === "symbol" ? el.value.trim().toUpperCase() : el.value;
      this.app.commit();
      if (f === "symbol") this.app.refreshPrices();
    }
  }
}
