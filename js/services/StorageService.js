import { Portfolio } from "../models/Portfolio.js";

// เก็บ/โหลดใน localStorage (key เดิม ข้อมูลเก่าใช้ต่อได้)
export class StorageService {
  constructor(key = "dca_tracker_v1") { this.key = key; this.mem = null; this.persist = "unknown"; } // unknown | yes | no | unsupported
  load() {
    try { const r = localStorage.getItem(this.key); if (r) return Portfolio.fromJSON(JSON.parse(r)); } catch {}
    return this.mem || Portfolio.createDefault();
  }
  save(p) { this.mem = p; try { localStorage.setItem(this.key, JSON.stringify(p)); } catch {} }
  // ขอให้เบราว์เซอร์เก็บข้อมูลถาวร (ไม่ลบเองตอนความจำเต็ม) เบราว์เซอร์เป็นผู้ตัดสินใจ ไม่รับประกัน
  async ensurePersist() {
    if (this.persist === "yes") return;
    try {
      if (!navigator.storage || !navigator.storage.persist) { this.persist = "unsupported"; return; }
      this.persist = (await navigator.storage.persisted()) || (await navigator.storage.persist()) ? "yes" : "no";
    } catch { this.persist = "no"; }
  }
}
