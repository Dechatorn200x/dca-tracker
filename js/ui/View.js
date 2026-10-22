// คลาสแม่ของทุกหน้า: render() คืน HTML, act()/change() รับเหตุการณ์จาก data-act / data-chg
export class View {
  constructor(app) { this.app = app; }
  get p() { return this.app.portfolio; }
  get engine() { return this.app.engine; }
  render() { return ""; }
  act(name, el) {}
  change(name, el) {}
}
