# DCA Tracker (แยกไฟล์ แบบ OOP ไม่ต้อง build)

## โครงสร้าง
```
index.html            หน้าเปล่า โหลด js/main.js
css/style.css         หน้าตา
api/quote.js          Vercel function ดึงราคา Yahoo Finance
supabase.sql          ตารางซิงค์ข้อมูล
js/config.js          ใส่ค่า Supabase ที่นี่
js/main.js            ประกอบทุกส่วนเข้าด้วยกัน
js/models/            Asset, Transaction, Portfolio (ข้อมูล + คำนวณมูลค่า)
js/core/              RebalanceEngine (ช่วงยอมรับ + ระบบแนะนำ)
js/services/          StorageService, PriceService, SyncService
js/ui/                App (ตัวประสาน), View (แม่), Home/Buy/History/Setup
```
อยากแก้อะไร → ไปที่: กติกา rebalance = `core/` · เพิ่มช่องข้อมูล = `models/` + `ui/SetupView` · เพิ่มหน้าใหม่ = สร้างคลาสสืบทอด `View` แล้วลงทะเบียนใน `ui/App.js` · เปลี่ยนแหล่งราคา = `PriceService` + `api/quote.js`

## ทดลองในเครื่อง
ต้องเปิดผ่านเซิร์ฟเวอร์ (ดับเบิลคลิกไฟล์ไม่ได้ เพราะใช้ ES modules): ติดตั้งส่วนเสริม **Live Server** ใน VS Code → คลิกขวา `index.html` → Open with Live Server (ราคาสดจะยังไม่ทำงาน จนกว่าจะขึ้น Vercel)

## 1) ขึ้น GitHub
VS Code → Source Control → Initialize Repository → Commit → Publish to GitHub

## 2) Vercel (ราคาสด + ลิงก์ให้คนอื่นใช้)
vercel.com → Sign up ด้วย GitHub → Add New → Project → เลือก repo → Deploy (ไม่ต้องตั้งค่า)

## 3) Supabase (ซิงค์ข้ามเครื่อง)
1. supabase.com → Sign in ด้วย GitHub → New project → SQL Editor → วาง `supabase.sql` → Run
2. Project Settings → API → คัดลอก Project URL และ anon public key ใส่ใน `js/config.js` (anon key เปิดเผยได้ เพราะ RLS กันแต่ละคนเห็นแค่ของตัวเอง)
3. Authentication → URL Configuration → Site URL และ Redirect URLs = ลิงก์ Vercel
4. **GitHub login:** GitHub → Settings → Developer settings → OAuth Apps → New (Homepage = ลิงก์ Vercel, Callback = `https://<project-id>.supabase.co/auth/v1/callback`) → นำ Client ID/Secret ไปใส่ใน Supabase → Authentication → Providers → GitHub
5. **Google login (ถ้าจะแชร์ให้คนที่ไม่มี GitHub):** console.cloud.google.com → OAuth Client ID (Web) ใช้ Callback เดียวกัน → ใส่ใน Providers → Google

แก้ไฟล์แล้ว Commit + Push → Vercel deploy ให้เองอัตโนมัติ

## หมายเหตุ
- ข้อมูลเดิมที่เคยบันทึกในเบราว์เซอร์ใช้ต่อได้ (key และโครงสร้างเดิม)
- Yahoo Finance เป็นช่องทางไม่เป็นทางการ ถ้าดึงไม่ได้แอปจะให้กรอกมูลค่าเองเหมือนเดิม
- ราคาสดใช้ได้เมื่อทุกรายการซื้อของตัวนั้นมี "จำนวนหน่วย" (รายการใหม่หลังตั้งสัญลักษณ์ราคา แอปคำนวณให้เอง)
- ซิงค์แบบ "ข้อมูลที่แก้ไขใหม่กว่าชนะ"
