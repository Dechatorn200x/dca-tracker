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
  }
  setPortfolio(p) { p.prices = this.prices; this.portfolio = p; }
  replacePortfolio(data) { this.setPortfolio(Portfolio.fromJSON(data)); this.storage.save(this.portfolio); this.render(); this.refreshPrices(); }
  commit() { this.portfolio.touch(); this.storage.save(this.portfolio); this.sync.schedulePush(); this.render(); }

  async refreshPrices(force = false) {
    if (!await this.prices.refresh(this.portfolio.assets.map(a => a.symbol))) return;
    const typing = document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (force || !typing) this.render();
  }
  render() {
    const y = scrollY;
    this.root.innerHTML = this.view.render();
    this.nav.innerHTML = TABS.map(([k, l]) => `<button class="${k === this.tab ? "on" : ""}" data-tab="${k}">${l}</button>`).join("");
    scrollTo(0, y);
  }
}
