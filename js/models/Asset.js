export const CLASSES = { stock: "หุ้น/ETF", bond: "ตราสารหนี้/พันธบัตร", gold: "ทองคำ", cash: "เงินสด/เงินฝาก", fund: "กองทุนรวม" };
export const BUCKETS = { safety: "Safety ปลอดภัย (0-2 ปี)", dividend: "Dividend ปันผล (2-10 ปี)", core: "Core ถือยาว (10 ปี+)", growth: "Growth เติบโต/เสี่ยงสูง (1-5 ปี)" };
const OLD_BUCKET = { US_Core: "core", US_Satellite: "growth", Thai_Stock: "dividend", Other: "core" };

export class Asset {
  constructor(d) {
    Object.assign(this, { id: "", name: "", category: "Other", target: 0, symbol: "", value: null,
      class: "", bucket: "", maturity: "", cap: null, thesis: "" }, d);
    // ข้อมูลเก่าที่ยังไม่มีประเภท/ถัง: เติมให้อัตโนมัติ
    if (!this.class) this.class = this.id === "gold" ? "gold" : "stock";
    if (!this.bucket) this.bucket = OLD_BUCKET[this.category] || "core";
  }
  // ชื่อที่แสดงบนหน้าจอ: ใช้สัญลักษณ์ราคาถ้ามี (ไม่ใช้รหัสภายใน id ที่ผูกกับประวัติการซื้อ)
  get label() { return (this.symbol || this.id).replace(/\.BK$/i, "").toUpperCase(); }
}
