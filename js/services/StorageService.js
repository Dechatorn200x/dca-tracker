import { Portfolio } from "../models/Portfolio.js";

// เก็บ/โหลดใน localStorage (key เดิม ข้อมูลเก่าใช้ต่อได้)
export class StorageService {
  constructor(key = "dca_tracker_v1") { this.key = key; this.mem = null; }
  load() {
    try { const r = localStorage.getItem(this.key); if (r) return Portfolio.fromJSON(JSON.parse(r)); } catch {}
    return this.mem || Portfolio.createDefault();
  }
  save(p) { this.mem = p; try { localStorage.setItem(this.key, JSON.stringify(p)); } catch {} }
}
