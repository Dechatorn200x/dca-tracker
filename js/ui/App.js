import { RebalanceEngine } from "../core/RebalanceEngine.js";
import { Portfolio } from "../models/Portfolio.js";
import { HomeView } from "./HomeView.js";
import { BuyView } from "./BuyView.js";
import { HistoryView } from "./HistoryView.js";
import { SetupView } from "./SetupView.js";

const TABS = [["home", "ภาพรวม"], ["buy", "ซื้อ"], ["hist", "ประวัติ"], ["setup", "พอร์ต"]];

// ตัวประสานทุกส่วน: ถือ portfolio + services, สลับหน้า, ส่งเหตุการณ์ให้ view
export class App {
  constructor({ root, nav, portfolio, storage, prices, sync }) {
    Object.assign(this, { root, nav, storage, prices, sync, tab: "home" });
    this.setPortfolio(portfolio);
    this.views = { home: new HomeView(this), buy: new BuyView(this), hist: new HistoryView(this), setup: new SetupView(this) };
  }
  get view() { return this.views[this.tab]; }
  get engine() { return new RebalanceEngine(this.portfolio); }

  start() {
    this.root.addEventListener("click", e => { const el = e.target.closest("[data-act]"); if (el) this.view.act(el.dataset.act, el); });
    this.root.addEventListener("change", e => { const el = e.target.closest("[data-chg]"); if (el) this.view.change(el.dataset.chg, el); });
    this.nav.addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) { this.tab = b.dataset.tab; this.render(); scrollTo(0, 0); } });
    this.render(); this.refreshPrices(); this.sync.init();
    this.storage.ensurePersist();
    setInterval(() => { if (!document.hidden) this.refreshPrices(); }, 5 * 60 * 1000);   // อัปเดตราคาเองทุก 5 นาทีตอนเปิดหน้าอยู่
    document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - (this.prices.updatedAt || 0) > 2 * 60 * 1000) this.refreshPrices(); });
  }
  setPortfolio(p) { p.prices = this.prices; this.portfolio = p; }
  replacePortfolio(data) { this.setPortfolio(Portfolio.fromJSON(data)); this.storage.save(this.portfolio); this.render(); this.refreshPrices(); }
  commit() { this.portfolio.touch(); this.storage.save(this.portfolio); this.sync.schedulePush(); if (this.storage.persist !== "yes") this.storage.ensurePersist(); this.render(); }
  markBackup() { this.portfolio.lastBackup = Date.now(); this.storage.save(this.portfolio); }

  async refreshPrices(force = false) {
    if (!await this.prices.refresh(this.portfolio.assets.map(a => a.symbol))) return;
    const typing = document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (force || !typing) this.render();
  }
  async lookupSymbol(asset) {
    const sym = (asset.symbol || "").toUpperCase();
    if (!sym) return this.commit();
    await this.prices.refresh([sym]);
    const q = this.prices.quotes[sym];
    if (q && q.name && (!asset.name || asset.name === asset.id.toUpperCase())) asset.name = q.name;
    this.commit();
  }
  async lookupNewSymbol(sym) {
    const hint = this.root.querySelector("#n_hint"), nameEl = this.root.querySelector("#n_n");
    if (!sym) { if (hint) hint.textContent = ""; return; }
    if (hint) hint.textContent = "กำลังค้นหา...";
    await this.prices.refresh([sym]);
    const q = this.prices.quotes[sym];
    if (q && q.name && nameEl && !nameEl.value) nameEl.value = q.name;
    if (hint) hint.textContent = q ? `ราคาล่าสุด ${q.price} ${q.currency}` : "ดึงข้อมูลไม่ได้ (ทดสอบบน Vercel เท่านั้น หรือสัญลักษณ์ไม่ถูกต้อง)";
  }
  render() {
    const y = scrollY;
    this.root.innerHTML = this.view.render();
    this.nav.innerHTML = TABS.map(([k, l]) => `<button class="${k === this.tab ? "on" : ""}" data-tab="${k}">${l}</button>`).join("");
    scrollTo(0, y);
  }
}
