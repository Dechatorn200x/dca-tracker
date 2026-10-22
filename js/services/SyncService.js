const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

// ล็อกอิน + ซิงค์พอร์ตกับ Supabase (1 แถวต่อผู้ใช้ กันด้วย RLS) ใช้ข้อมูลที่ "ใหม่กว่า" ชนะ
export class SyncService {
  constructor(cfg, hooks) { this.cfg = cfg; this.hooks = hooks; this.sb = null; this.user = null; this.message = ""; this.timer = null; }
  get enabled() { return !!(this.cfg.SUPABASE_URL && this.cfg.SUPABASE_KEY); }

  async init() {
    if (!this.enabled) return;
    try {
      const { createClient } = await import(SUPABASE_ESM);
      this.sb = createClient(this.cfg.SUPABASE_URL, this.cfg.SUPABASE_KEY);
      this.sb.auth.onAuthStateChange((_e, s) => {
        const had = !!this.user; this.user = s ? s.user : null;
        if (this.user && !had) this.pull(); else this.hooks.onStatus();
      });
      document.addEventListener("visibilitychange", () => { if (!document.hidden && this.user) this.pull(); });
    } catch { this.message = "โหลดระบบซิงค์ไม่สำเร็จ"; this.hooks.onStatus(); }
  }
  login(provider) { this.sb?.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } }); }
  async logout() { await this.sb?.auth.signOut(); this.user = null; this.message = ""; this.hooks.onStatus(); }

  schedulePush() { if (!this.user) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.pushNow(), 800); }
  async pushNow() {
    const r = await this.sb.from("portfolios").upsert({ user_id: this.user.id, data: this.hooks.getLocal().toJSON(), updated_at: new Date().toISOString() });
    this.message = r.error ? "ซิงค์ไม่สำเร็จ" : "ซิงค์แล้ว";
    this.hooks.onStatus();
  }
  async pull() {
    try {
      const r = await this.sb.from("portfolios").select("data").eq("user_id", this.user.id).maybeSingle();
      if (r.error) throw r.error;
      if (!r.data) return this.pushNow();
      const remote = r.data.data.updated || 0, local = this.hooks.getLocal().updated || 0;
      if (remote > local) { this.hooks.applyRemote(r.data.data); this.message = "ดึงข้อมูลล่าสุดแล้ว"; }
      else if (local > remote) return this.pushNow();
      else this.message = "ซิงค์แล้ว";
    } catch { this.message = "ซิงค์ไม่สำเร็จ"; }
    this.hooks.onStatus();
  }
}
