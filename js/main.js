import { CONFIG } from "./config.js";
import { StorageService } from "./services/StorageService.js";
import { PriceService } from "./services/PriceService.js";
import { SyncService } from "./services/SyncService.js";
import { App } from "./ui/App.js";

const storage = new StorageService();
const prices = new PriceService();
let app;
const sync = new SyncService(CONFIG, {
  getLocal: () => app.portfolio,
  applyRemote: data => app.replacePortfolio(data),
  onStatus: () => app.render(),
});
app = new App({ root: document.getElementById("app"), nav: document.getElementById("nav"), portfolio: storage.load(), storage, prices, sync });
app.start();
