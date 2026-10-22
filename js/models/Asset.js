export const CATEGORIES = { US_Core: "US หลัก", US_Satellite: "US เสริม", Thai_Stock: "หุ้นไทย", Other: "อื่น ๆ" };

export class Asset {
  constructor(d) {
    Object.assign(this, { id: "", name: "", category: "Other", target: 0, symbol: "", value: null }, d);
  }
}
