export const COLORS = ["#2e7d5b", "#4a6fa5", "#d9822b", "#8a5fa8", "#c2443a", "#2f9aa8", "#a8923a", "#7a8a85"];
export const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const fmt = n => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
