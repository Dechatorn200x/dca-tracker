import { View } from "./View.js";
import { esc } from "./format.js";
import { Asset, CLASSES, BUCKETS } from "../models/Asset.js";
import { Portfolio } from "../models/Portfolio.js";

const opts = (map, sel) => Object.entries(map).map(([k, v]) => `<option value="${k}"${sel === k ? " selected" : ""}>${v}</option>`).join("");

export class SetupView extends View {
  account() {
    const s = this.app.sync;
    if (!s.enabled) return `<div class="card"><b>ซิงค์ข้ามเครื่อง</b><div class="mute">ยังไม่ได้ตั้งค่า Supabase (ดู README) ตอนนี้ข้อมูลอยู่ในเครื่องนี้เท่านั้น</div></div>`;
    if (s.user) return `<div class="card"><div class="row"><div><b>ซิงค์ข้ามเครื่องเปิดอยู่</b><div class="mute">${esc(s.user.email || "บัญชีของคุณ")} · ${esc(s.message)}</div></div><button class="s" data-act="logout">ออกจากระบบ</button></div></div>`;
    return `<div class="card"><b>ซิงค์ข้ามเครื่อง</b><div class="mute">ล็อกอินเพื่อให้พอร์ตตามคุณไปทุกเครื่อง ข้อมูลของแต่ละคนแยกกัน</div>
<div class="grid2" style="margin-top:10px"><button class="p" data-act="login" data-p="github">GitHub</button><button data-act="login" data-p="google">Google</button></div></div>`;
  }
  quoteLine(a) {
    const q = a.symbol && this.app.prices.quotes[a.symbol.toUpperCase()];
    return q ? `<div class="mute" style="margin-top:4px">ราคาล่าสุด ${q.price} ${q.currency}${q.name ? " · " + esc(q.name) : ""}</div>` : "";
  }
  classCard() {
    const g = this.p.groupTotals("class");
    return `<div class="card"><b>สัดส่วนตามประเภท</b><div class="mute">ปรับทั้งประเภทในช่องเดียว ระบบจะกระจายลงแต่ละตัวตามสัดส่วนเดิม</div>
${Object.entries(g).map(([k, x]) => `<div class="row" style="margin-top:8px"><span>${CLASSES[k] || k} <span class="mute">(${x.assets.length} ตัว)</span></span><input type="number" inputmode="decimal" style="width:96px" value="${+x.target.toFixed(2)}" data-chg="classTarget" data-k="${k}"></div>`).join("")}</div>`;
  }
  render() {
    const p = this.p, s = p.targetSum(), ok = Math.abs(s - 100) < 0.01;
    return `<h1>จัดการพอร์ต</h1>${this.account()}
<div class="card"><label style="margin-top:0">ช่วงยอมรับ (± % จากเป้า) ถ้าอยู่ในช่วงนี้ไม่ต้องปรับ</label><input type="number" inputmode="decimal" value="${p.band}" data-chg="band"></div>
<div class="card row"><span>เป้าหมายรวม</span><b class="${ok ? "up" : "warn"}">${+s.toFixed(2)}%${ok ? " ✓" : " (ต้องเท่ากับ 100)"}</b></div>
${this.classCard()}
${p.assets.map(a => `<div class="card"><div class="row"><b>${esc(a.label)}</b><span><button class="s" data-act="swap" data-id="${esc(a.id)}">เปลี่ยนหุ้น</button> <button class="s d" data-act="delAsset" data-id="${esc(a.id)}">ลบ</button></span></div>
<label>ชื่อ</label><input value="${esc(a.name)}" data-chg="field" data-f="name" data-id="${esc(a.id)}">
<label>สัญลักษณ์ราคา (Yahoo Finance เช่น VOO, TISCO.BK ว่างไว้ถ้ากรอกราคาเอง เช่น ตราสารหนี้ เงินสด)</label><input value="${esc(a.symbol || "")}" data-chg="field" data-f="symbol" data-id="${esc(a.id)}">${this.quoteLine(a)}
<div class="grid2"><div><label>ประเภท</label><select data-chg="field" data-f="class" data-id="${esc(a.id)}">${opts(CLASSES, a.class)}</select></div>
<div><label>ถัง</label><select data-chg="field" data-f="bucket" data-id="${esc(a.id)}">${opts(BUCKETS, a.bucket)}</select></div></div>
<div class="grid2"><div><label>เป้า (%)</label><input type="number" inputmode="decimal" value="${a.target}" data-chg="field" data-f="target" data-id="${esc(a.id)}"></div>
<div><label>เพดานสูงสุด (%) ว่าง = ไม่จำกัด</label><input type="number" inputmode="decimal" value="${a.cap ?? ""}" data-chg="field" data-f="cap" data-id="${esc(a.id)}"></div></div>
${a.cap != null && a.target > a.cap ? `<div class="warn" style="font-size:13px;margin-top:6px">เป้า (${a.target}%) สูงกว่าเพดาน (${a.cap}%)</div>` : ""}
${a.class === "bond" || a.class === "cash" ? `<label>วันครบกำหนด (ถ้ามี) ครบใน 30 วันจะไม่แนะนำเติมเงินเพิ่ม</label><input type="date" value="${esc(a.maturity)}" data-chg="field" data-f="maturity" data-id="${esc(a.id)}">` : ""}
<label>เหตุผลที่ถือ (สั้น ๆ ไว้ทบทวนทีหลัง)</label><input value="${esc(a.thesis)}" data-chg="field" data-f="thesis" data-id="${esc(a.id)}"></div>`).join("")}
<h2>เพิ่มสินทรัพย์</h2><div class="card"><div class="grid2"><div><label style="margin-top:0">ตัวย่อ (เช่น QQQM, BOND1)</label><input id="n_id"></div><div><label style="margin-top:0">เป้า (%)</label><input type="number" inputmode="decimal" id="n_t"></div></div>
<label>สัญลักษณ์ราคา (ถ้ามี)</label><input id="n_s" data-chg="newSymbol"><div id="n_hint" class="mute" style="margin-top:4px"></div>
<label>ชื่อเต็ม</label><input id="n_n">
<div class="grid2"><div><label>ประเภท</label><select id="n_cls">${opts(CLASSES, "stock")}</select></div><div><label>ถัง</label><select id="n_b">${opts(BUCKETS, "core")}</select></div></div>
<p><button class="p" style="width:100%" data-act="addAsset">เพิ่ม</button></p></div>
<h2>สำรองข้อมูล</h2><div class="card"><div class="mute">ข้อมูลเก็บในเครื่องนี้ (และซิงค์ถ้าล็อกอิน) ใช้ย้ายเครื่องแบบไม่ล็อกอินได้ด้วย</div>
<label>ข้อมูล (คัดลอก หรือวางเพื่อนำเข้า)</label><textarea id="bk" rows="4"></textarea>
<div class="grid2" style="margin-top:10px"><button data-act="exp">สร้างข้อมูลสำรอง</button><button data-act="imp">นำเข้าข้อมูล</button></div>
<p><button class="d" style="width:100%" data-act="reset">ล้างข้อมูลทั้งหมด</button></p></div>`;
  }
  act(name, el) {
    const app = this.app, p = this.p, q = s => app.root.querySelector(s);
    if (name === "swap") return this.swap(el.dataset.id);
    if (name === "login") app.sync.login(el.dataset.p);
    if (name === "logout") app.sync.logout();
    if (name === "delAsset" && confirm(`ลบ ${p.asset(el.dataset.id).label} และประวัติการซื้อของตัวนี้?`)) { p.removeAsset(el.dataset.id); app.commit(); }
    if (name === "addAsset") {
      const id = q("#n_id").value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
      if (!id) return alert("ใส่ตัวย่อสินทรัพย์");
      if (p.asset(id)) return alert("มีสินทรัพย์นี้แล้ว");
      p.addAsset(new Asset({ id, name: q("#n_n").value || id.toUpperCase(), class: q("#n_cls").value, bucket: q("#n_b").value, target: +q("#n_t").value || 0, symbol: q("#n_s").value.trim().toUpperCase() }));
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
  async swap(id) {
    const app = this.app, p = this.p, old = p.asset(id);
    const sym = (prompt(`เปลี่ยน ${old.label} เป็นหุ้นตัวไหน? ใส่สัญลักษณ์ (เช่น QQQM, TISCO.BK)`) || "").trim().toUpperCase();
    if (!sym) return;
    const nid = sym.replace(/\.BK$/i, "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
    if (!nid) return alert("สัญลักษณ์ไม่ถูกต้อง");
    if (nid === id) return alert("เป็นตัวเดิมอยู่แล้ว แก้ที่ช่องสัญลักษณ์ได้เลย");
    if (p.asset(nid)) return alert(`มี ${sym} ในพอร์ตอยู่แล้ว`);
    await app.prices.refresh([sym]);
    const name = app.prices.quotes[sym]?.name || sym, n = p.txOf(old).length;
    let migrate = false;
    if (n) {
      migrate = confirm(`ย้ายประวัติการซื้อเดิมของ ${old.label} (${n} รายการ) มาที่ ${sym} ด้วยไหม?\n\nOK = ย้ายมา (เช่น ใส่หุ้นผิดตัว) ยอดเงินติดมา แต่จำนวนหน่วยจะถูกล้าง\nCancel = ไม่ย้าย`);
      if (!migrate && !confirm(`ถ้าไม่ย้าย ประวัติการซื้อของ ${old.label} จะถูกลบ ยืนยันไหม?`)) return;
    }
    p.replaceAsset(id, new Asset({ id: nid, name, class: old.class, bucket: old.bucket, target: old.target, cap: old.cap, symbol: sym }), migrate);
    app.commit(); app.refreshPrices();
  }
  change(name, el) {
    const p = this.p;
    if (name === "newSymbol") this.app.lookupNewSymbol(el.value.trim().toUpperCase());
    if (name === "band") { p.band = Math.max(0, +el.value || 0); this.app.commit(); }
    if (name === "classTarget") { p.setClassTarget(el.dataset.k, Math.max(0, +el.value || 0)); this.app.commit(); }
    if (name === "field") {
      const a = p.asset(el.dataset.id), f = el.dataset.f, v = el.value;
      a[f] = f === "target" ? +v || 0 : f === "cap" ? (v === "" ? null : Math.max(0, +v || 0)) : f === "symbol" ? v.trim().toUpperCase() : v;
      if (f === "symbol") this.app.lookupSymbol(a); else this.app.commit();
    }
  }
}
