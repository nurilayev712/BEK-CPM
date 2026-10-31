# 🚗 CPM Market — Car Parking Multiplayer Xavfsiz Savdo Platformasi

**CPM Market** — Car Parking Multiplayer o'yinchilari uchun to'liq avtomatlashtirilgan, kafolatlangan va xavfsiz savdo platformasi (Escrow Marketplace). Tizim ikkita asosiy qismdan iborat:
1. **Telegram Bot (O'yinchilar uchun)** — E'lon berish, katalog, avtomobillarni qidirish/saralash, xavfsiz savdo (escrow), nizolar, reyting va sharhlar, ikki til (UZ/RU).
2. **Web Admin Panel (Administrator uchun)** — Zamonaviy Dark & Neon Gamer dizaynidagi to'liq boshqaruv portali (React + Tailwind CSS + Chart.js).

---

## ⚡ Asosiy Texnologiyalar

- **Backend**: Node.js (v20+ / v24) + Express.js
- **Ma'lumotlar bazasi**: Native SQLite (`node:sqlite` DatabaseSync — yuqori tezlik, nol C++ kompilyatsiya, xavfsiz prepared statements)
- **Telegram Bot**: Telegraf.js v4 (O'zbek va Rus tillari, Wizard bosqichlari, Inline navigatsiya)
- **Web Admin Panel**: React.js + Vite + Tailwind CSS + Lucide Icons + Chart.js
- **Xavfsizlik**: JWT token autentifikatsiyasi, bcrypt parol xeshlash, Helmet xavfsizlik sarlavhalari, Express Rate Limiting (DDoS va spamdan himoya), SQL Injection va XSS himoyasi

---

## 📁 Loyiha Strukturasi

```text
CPM BEK BOT/
├── backend/
│   ├── src/
│   │   ├── config/          # Ma'lumotlar bazasi, jadvallar va demo seed skriptlari
│   │   ├── controllers/     # Auth, Listings, Deals, Users, Categories, Stats, Settings
│   │   ├── middleware/      # JWT auth, Rate limiter, File upload, Logger
│   │   ├── bot/             # Telegraf bot, Wizard sahnalari, Klaviaturalar, Uz/Ru tillari
│   │   ├── services/        # Escrow savdo mantiqi, Bildirishnomalar, Audit loglari
│   │   └── server.js        # Asosiy Express server va bot ishga tushiruvchi
│   ├── data/                # SQLite bazasi (cpm_market.db)
│   ├── uploads/             # Yuklangan rasmlar
│   ├── .env                 # Maxfiy kalitlar va sozlamalar
│   └── package.json
├── frontend/                # Web Admin Panel (SPA)
│   ├── src/
│   │   ├── pages/           # Dashboard, Listings, Deals & Disputes, Users, Categories, Broadcast, Reports
│   │   ├── components/      # Sidebar, Navbar, Toast, Modallar
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── services/        # Axios API mijozi
│   │   ├── App.jsx
│   │   └── index.css
│   ├── dist/                # Production build (avtomatik server tomonidan xizmat qilinadi)
│   └── tailwind.config.js
├── start.bat                # Windows uchun bir bosishda ishga tushirish skripti
├── package.json             # Root boshqaruv skriptlari
└── README.md
```

---

## 🚀 Tezkor Ishga Tushirish (Windows)

### 1-usul: Bir bosishda (Tavsiya etiladi)
Ildiz papkadagi **`start.bat`** faylini ikki marta bosing!
U avtomatik ravishda:
- Baza jadvallari va demo ma'lumotlarni tekshiradi
- Backend serverni va botni ishga tushiradi
- Brauzerda avtomatik ravishda Web Admin Panelni ochadi: `http://localhost:5000`

### 2-usul: Terminal orqali (npm)
```bash
# 1. Backend papkasiga o'ting
cd backend

# 2. Serverni ishga tushiring
npm start
```

Admin panelga kirish ma'lumotlari:
- **URL**: `http://localhost:5000`
- **Login**: `admin`
- **Parol**: `admin123`

---

## 🤖 Telegram Botni Ulash

1. Telegramda [@BotFather](https://t.me/BotFather) ga kiring va `/newbot` buyrug'i orqali yangi bot yarating.
2. BotFather bergan **HTTP API Token**ni nusxalang.
3. `backend/.env` faylini oching va `BOT_TOKEN` qatoriga tokenni yozing:
   ```env
   BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
4. Serverni qayta ishga tushiring. Bot avtomatik ishga tushadi!

---

## 🛡️ Escrow (Xavfsiz Savdo) Qanday Ishlaydi?

1. **Bitim ochilishi**: Xaridor katalogdan mashinani tanlab *"🛒 Sotib olish (Escrow)"* tugmasini bosadi. Tizim avtomatik ravishda unikal kodli bitim (`#CPM-XXXXX`) yaratadi va ikkala tomonga bildirishnoma yuboradi.
2. **To'lov bosqichi**: Xaridor kelishilgan summani to'laydi va botda *"💳 To'lov yuborildi"* tugmasini bosadi.
3. **Item topshirish**: Sotuvchi to'lovni tekshirib, Car Parking Multiplayer o'yini ichida mashina yoki akkauntni topshiradi va *"🚗 Mashina topshirildi"* tugmasini bosadi.
4. **Yakunlash va Reyting**: Xaridor mashinani to'liq qabul qilib olgach *"✅ Savdoni yakunlash"* tugmasini bosadi. Savdo muvaffaqiyatli yopiladi, e'lon *"Sotilgan"* deb belgilanadi va ikkala tomon bir-biriga 1 dan 5 gacha ⭐ yulduzli baho va sharh qoldiradi.
5. **⚠️ Nizo (Dispute) tartibi**: Agar kelishmovchilik, yolg'on yoki muammo bo'lsa, istalgan tomon *"⚠️ Nizo ochish"* tugmasini bosadi. Bitim to'xtatiladi, Web Admin Panelda favqulodda signal paydo bo'ladi. Moderator suhbat va dalillarni o'rganib chiqib, admin panel orqali adolatli qaror chiqaradi (Xaridor yoki sotuvchi foydasiga yakunlash / Bekor qilish).

---

## 🖥️ Web Admin Panel Imkoniyatlari

- **Dashboard (Bosh sahifa)**: Jami o'yinchilar, faol/bugungi e'lonlar, faol escrow savdolari, nizolar soni, 30 kunlik dinamika grafigi, kategoriyalar taqsimoti.
- **E'lonlar boshqaruvi**: Barcha mashinalar, rasmlar galereyasi, bitta bosishda VIP qilish, tasdiqlash, rad etish, o'chirish.
- **Bitimlar va Nizolar markazi**: Har bir bitimning bosqichma-bosqich tarixi, nizolar bo'yicha admin arbitraji va yechim kiritish oynasi.
- **Foydalanuvchilar boshqaruvi**: Barcha o'yinchilar, ularning savdo reytingi, sharhlari, bloklash/blokdan chiqarish va **Telegram orqali to'g'ridan-to'g'ri shaxsiy xabar jo'natish!**
- **Kategoriyalar**: Mashina turlarini qo'shish, tahrirlash, ikonka tanlash.
- **Broadcast (Ommaviy xabarnoma)**: Barcha foydalanuvchilarga, faqat sotuvchilarga yoki faqat xaridorlarga bir vaqtda rasm va matnli xabarlar jo'natish.
- **Hisobot & Audit loglari**: Foydalanuvchilar, e'lonlar va bitimlarni Excel/CSV formatida yuklab olish, admin amallari jurnali.

---

## 🌐 Bepul Hostingga Joylashtirish (Render / Railway)

1. Loyihani GitHub-ga yuklang (`git push`).
2. **Railway.app** yoki **Render.com** saytida yangi *Web Service* oching.
3. Environment Variables (Muhit o'zgaruvchilari) bo'limida quyidagilarni kiriting:
   - `PORT=5000`
   - `JWT_SECRET=maxfiy_kalitingiz`
   - `ADMIN_DEFAULT_USER=admin`
   - `ADMIN_DEFAULT_PASS=kuchli_parol`
   - `BOT_TOKEN=telegram_bot_tokeningiz`
4. Build Command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
5. Start Command: `node backend/src/server.js`
Loyiha bir necha daqiqada butun dunyo uchun onlayn ishlay boshlaydi!
