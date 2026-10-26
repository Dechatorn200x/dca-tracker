export class Transaction {
  constructor(d) {
    Object.assign(this, { id: "", date: "", asset_id: "", amount_thb: 0, units: null, price_per_unit: null, created: 0 }, d);
  }
  static create(d) {
    return new Transaction({ id: "t" + Date.now() + Math.floor(Math.random() * 999), created: Date.now(), ...d });
  }
}
