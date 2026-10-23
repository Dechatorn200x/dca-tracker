import { View } from "./View.js";
import { esc, fmt, COLORS } from "./format.js";

export class HomeView extends View {
  grad(parts) {
    let acc = 0;
    const s = parts.map(x => { const r = `${x.c} ${acc}% ${acc + x.v}%`; acc += x.v; return r; });
    return acc > 0 ? `conic-gradient(${s.join(",")})` : "var(--line)";
  }
  render() {
    const p = this.p, e = this.engine, T = p.totals(), g = T.value - T.cost, gp = T.cost > 0 ? g / T.cost * 100 : 0, ts = p.targetSum() || 1;
    const cur = p.assets.map((a, i) => ({ c: COLORS[i % 8], v: T.value > 0 ? p.value(a) / T.value * 100 : 0 }));
    const tgt = p.assets.map((a, i) => ({ c: COLORS[i % 8], v: a.target / ts * 100 }));
    const out = e.outsideBand(), at = this.app.prices.updatedAt;
    const banner = T.value > 0
      ? `<div class="hint" style="margin:0 0 12px;color:${out.length ? "var(--amber)" : "var(--green)"}">${out.length ? `${out.length} ตัวหลุดช่วงยอมรับ ±${p.band}% เติมเงินใหม่ให้ตัวที่ขาดก่อน ไม่ต้องขายของเดิม` : `พอร์ตอยู่ในช่วงยอมรับ ±${p.band}% ไม่ต้องปรับ ซื้อตามแผนได้เลย`}</div>`
      : `<div class="hint" style="margin:0 0 12px">เริ่มต้น: ไปที่แท็บ “ซื้อ” เพื่อบันทึกการซื้อครั้งแรก หรือแท็บ “พอร์ต” เพื่อปรับสินทรัพย์และเป้าหมาย</div>`;
    return `<h1>ภาพรวมพอร์ต</h1>
<div class="card"><div class="mute">มูลค่ารวม (บาท)</div><div class="big">${fmt(T.value)}</div>
<div class="row" style="margin-top:6px"><span class="mute">เงินลงทุนสะสม ${fmt(T.cost)}</span><span class="${g >= 0 ? "up" : "down"}">${g >= 0 ? "+" : ""}${fmt(g)} (${g >= 0 ? "+" : ""}${gp.toFixed(1)}%)</span></div></div>
${banner}
<div class="row mute" style="margin:0 0 12px"><span>${at ? "ราคาสดอัปเดต " + new Date(at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "ราคาสด: ยังไม่เชื่อม (กรอกเอง)"}</span><button class="s" data-act="refresh">รีเฟรชราคา</button></div>
<div class="card"><div class="donutwrap"><div><div class="r1" style="background:${this.grad(cur)}"><div class="r2" style="background:${this.grad(tgt)}"><div class="hole"></div></div></div>
<div class="mute" style="text-align:center;margin-top:6px">วงนอก = ตอนนี้ · วงใน = เป้า</div></div>
<div class="legend">${p.assets.map((a, i) => `<div><span class="dot" style="background:${COLORS[i % 8]}"></span><span>${esc(a.label)}</span></div>`).join("")}</div></div></div>
<h2>แต่ละสินทรัพย์</h2>
${p.assets.map(a => {
  const cp = p.share(a), st = e.status(cp - a.target);
  return `<div class="card"><div class="row"><div><b>${esc(a.label)}</b> <span class="mute">${esc(a.name)}</span></div><span class="tag" style="color:${st.color}">${st.label}</span></div>
<div class="bar"><i style="width:${Math.min(100, cp)}%;background:${st.color}"></i><b style="left:${Math.min(100, a.target)}%"></b></div>
<div class="row mute"><span>ตอนนี้ ${cp.toFixed(1)}% · เป้า ${a.target}%</span><span>ต้นทุน ${fmt(p.cost(a))}</span></div>
${p.isLive(a)
  ? `<div class="mute" style="margin-top:8px">ราคาสด ${p.livePrice(a).toFixed(2)} บาท × ${+p.units(a).toFixed(4)} หน่วย = ${fmt(p.value(a))} บาท</div>`
  : `<label>มูลค่าตอนนี้ (บาท) — กรอกเองจากแอปโบรกเกอร์</label><input type="number" inputmode="decimal" value="${Math.round(p.value(a))}" data-chg="setVal" data-id="${esc(a.id)}">`}</div>`;
}).join("")}`;
  }
  act(name) { if (name === "refresh") this.app.refreshPrices(true); }
  change(name, el) {
    if (name === "setVal") { this.p.asset(el.dataset.id).value = Math.max(0, +el.value || 0); this.app.commit(); }
  }
}
