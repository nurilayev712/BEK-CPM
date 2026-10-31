const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/cpm_market.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and performance
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

// Helper wrapper functions
const db = {
  raw: sqlite,

  query(sql, params = []) {
    try {
      const stmt = sqlite.prepare(sql);
      return stmt.all(...params);
    } catch (err) {
      console.error('DB query error:', sql, params, err);
      throw err;
    }
  },

  get(sql, params = []) {
    try {
      const stmt = sqlite.prepare(sql);
      return stmt.get(...params);
    } catch (err) {
      console.error('DB get error:', sql, params, err);
      throw err;
    }
  },

  run(sql, params = []) {
    try {
      const stmt = sqlite.prepare(sql);
      return stmt.run(...params);
    } catch (err) {
      console.error('DB run error:', sql, params, err);
      throw err;
    }
  },

  exec(sql) {
    return sqlite.exec(sql);
  }
};

// Initialize schema and seed data
function initDatabase() {
  db.exec(`
    -- Admins table
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'superadmin', 'admin', 'moderator'
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      language TEXT NOT NULL DEFAULT 'uz',
      phone TEXT,
      rating REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      deals_count INTEGER NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'banned'
      referrer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_uz TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🚗',
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Listings table
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'UZS', -- 'UZS', 'USD', 'CPM'
      images TEXT NOT NULL DEFAULT '[]', -- JSON array of file_id or url
      video_url TEXT,
      tags TEXT NOT NULL DEFAULT '[]', -- JSON array: ["tuning", "rare", "chrome"]
      status TEXT NOT NULL DEFAULT 'active', -- 'pending', 'active', 'rejected', 'sold', 'expired'
      is_vip INTEGER NOT NULL DEFAULT 0,
      vip_until DATETIME,
      views_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    -- Deals table (Escrow system)
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_code TEXT UNIQUE NOT NULL, -- e.g. DEAL-10492
      listing_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'UZS',
      status TEXT NOT NULL DEFAULT 'pending', 
      -- 'pending': kutilmoqda
      -- 'payment_sent': xaridor to'ladi
      -- 'item_transferred': sotuvchi o'yinda mashinani berdi
      -- 'completed': muvaffaqiyatli yakunlandi
      -- 'disputed': nizo ochilgan
      -- 'cancelled': bekor qilingan
      buyer_confirmed INTEGER NOT NULL DEFAULT 0,
      seller_confirmed INTEGER NOT NULL DEFAULT 0,
      dispute_reason TEXT,
      dispute_opened_by INTEGER,
      dispute_resolution TEXT,
      dispute_resolved_by INTEGER,
      dispute_resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings (id),
      FOREIGN KEY (buyer_id) REFERENCES users (id),
      FOREIGN KEY (seller_id) REFERENCES users (id)
    );

    -- Ratings / Reviews table
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals (id),
      FOREIGN KEY (from_user_id) REFERENCES users (id),
      FOREIGN KEY (to_user_id) REFERENCES users (id)
    );

    -- Favorites table (Wishlist)
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, listing_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'deal', -- 'deal', 'system', 'promo', 'topup'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- CPM Game Topup / Donat Services (Chin pul solib berish xizmatlari)
    CREATE TABLE IF NOT EXISTS topup_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_uz TEXT NOT NULL,
      title_ru TEXT NOT NULL,
      description_uz TEXT,
      description_ru TEXT,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'UZS',
      type TEXT NOT NULL DEFAULT 'cpm_money', -- 'cpm_money', 'coins', 'unlock_all', 'w16_siren', 'account'
      badge TEXT, -- 'HIT', 'SUPER', 'MAX'
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Topup / Donat Orders (Pul solish arizalari)
    CREATE TABLE IF NOT EXISTS topup_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL, -- e.g. DONAT-1294
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      game_id TEXT NOT NULL, -- O'yindagi ID yoki akkaunt pochtasi
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'UZS',
      payment_method TEXT NOT NULL DEFAULT 'card', -- 'card', 'click', 'payme', 'balance'
      receipt_image TEXT, -- Chek rasmi
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
      admin_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (service_id) REFERENCES topup_services (id)
    );

    -- User Wallet Transactions (Hamyon to'ldirish va xaridlar)
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'deposit', 'spend_topup', 'spend_vip', 'cashback'
      status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
      payment_method TEXT,
      receipt_image TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Admin logs table
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System settings
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );
  `);

  // Seed default Admin if not exists
  const existingAdmin = db.get('SELECT * FROM admins WHERE username = ?', [process.env.ADMIN_DEFAULT_USER || 'admin']);
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASS || 'admin123', salt);
    db.run(
      'INSERT INTO admins (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [process.env.ADMIN_DEFAULT_USER || 'admin', hash, 'Super Administrator', 'superadmin']
    );
    console.log('✅ Default superadmin created (user: admin, pass: admin123)');
  }

  // Seed Default Categories if empty
  const catCount = db.get('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    const categories = [
      { name_uz: 'Sport avtomobillar', name_ru: 'Спорткары', icon: '🏎️', slug: 'sport', sort_order: 1 },
      { name_uz: 'Klassik mashinalar', name_ru: 'Классические', icon: '🚙', slug: 'classic', sort_order: 2 },
      { name_uz: 'SUV & Jip', name_ru: 'Внедорожники / SUV', icon: '🛻', slug: 'suv', sort_order: 3 },
      { name_uz: 'Drift & Drag tayyor', name_ru: 'Для дрифта и драга', icon: '💨', slug: 'drift-drag', sort_order: 4 },
      { name_uz: 'Vinil & Eksklyuziv', name_ru: 'Винилы и эксклюзив', icon: '🎨', slug: 'vinyl', sort_order: 5 },
      { name_uz: 'CPM Akkauntlar', name_ru: 'CPM Аккаунты', icon: '👑', slug: 'accounts', sort_order: 6 },
      { name_uz: 'Mototsikl & Boshqa', name_ru: 'Мотоциклы и прочее', icon: '🏍️', slug: 'moto', sort_order: 7 }
    ];

    for (const c of categories) {
      db.run(
        'INSERT INTO categories (name_uz, name_ru, icon, slug, sort_order) VALUES (?, ?, ?, ?, ?)',
        [c.name_uz, c.name_ru, c.icon, c.slug, c.sort_order]
      );
    }
    console.log('✅ Default CPM categories seeded');
  }

  // Seed default system settings
  const settings = [
    { key: 'vip_price_stars', value: '50', description: 'VIP eʼlon narxi (Telegram Stars yoki soʻmda)' },
    { key: 'vip_duration_days', value: '7', description: 'VIP eʼlon muddati (kun)' },
    { key: 'listing_expiry_days', value: '30', description: 'Oddiy eʼlon muddati (kun)' },
    { key: 'support_username', value: 'CPMMarketAdmin', description: 'Yordam admini username' },
    { key: 'escrow_fee_percent', value: '0', description: 'Escrow komissiya foizi' },
    { key: 'referral_bonus', value: '1000', description: 'Referal taklifi uchun bonus' },
    { key: 'payment_card_number', value: '8600 5304 1234 5678', description: 'Toʻlov qabul qilish plastik karta raqami' },
    { key: 'payment_card_holder', value: 'BEKZOD A. (CPM Market)', description: 'Karta egasining ismi-sharifi' },
    { key: 'payment_bank_name', value: 'TBC Bank / Payme / Click', description: 'Bank va toʻlov tizimlari' }
  ];

  for (const s of settings) {
    const exists = db.get('SELECT key FROM system_settings WHERE key = ?', [s.key]);
    if (!exists) {
      db.run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.description]);
    }
  }

  // Seed default CPM Topup Services if empty
  const serviceCount = db.get('SELECT COUNT(*) as count FROM topup_services').count;
  if (serviceCount === 0) {
    const defaultServices = [
      {
        title_uz: "💵 50.000.000$ CPM O'yin Puli",
        title_ru: '💵 50.000.000$ Игровой валюты CPM',
        description_uz: "O'yindagi hisobingizga 50M naqd o'yin puli tashlab beriladi. Xaridlar va tyuninglar uchun cheksiz imkoniyat!",
        description_ru: 'На ваш аккаунт будет зачислено 50 миллионов игровой валюты. Мгновенная доставка!',
        price: 15000,
        currency: 'UZS',
        type: 'cpm_money',
        badge: 'HIT 🔥',
        sort_order: 1
      },
      {
        title_uz: '🪙 10.000 Oltin Tanga (CPM Coins)',
        title_ru: '🪙 10.000 Золотых монет (Coins)',
        description_uz: "Pullik tana to'plamlari, maxsus disklar va eksklyuziv buyumlar sotib olish uchun oltin tangalar.",
        description_ru: 'Золотые монеты для покупки обвесов, дисков и платных элементов.',
        price: 20000,
        currency: 'UZS',
        type: 'coins',
        badge: 'TAVSIYA',
        sort_order: 2
      },
      {
        title_uz: '🔓 Barcha Pullik Mashinalarni Ochish (All Cars)',
        title_ru: '🔓 Открытие всех платных машин (All Cars)',
        description_uz: "CPM dagi barcha pullik ($ haqiqiy pulga sotiladigan) mashinalar akkauntingizda umrbod ochiladi!",
        description_ru: 'Все платные авто в игре станут доступны на вашем аккаунте навсегда.',
        price: 30000,
        currency: 'UZS',
        type: 'unlock_all',
        badge: 'TOP 🌟',
        sort_order: 3
      },
      {
        title_uz: '🚨 W16 Motor + Politsiya Sirena + Rangli Tutun',
        title_ru: '🚨 Мотор W16 + Полицейская сирена + Дым',
        description_uz: 'W16 1695HP quvvati, politsiya chiroqlari (sirena) va tezlanishdagi rangli tutunlar to‘plami.',
        description_ru: 'Пакет: Двигатель W16, полицейские мигалки и цветной дым из-под колес.',
        price: 22000,
        currency: 'UZS',
        type: 'w16_siren',
        badge: 'SUPER',
        sort_order: 4
      },
      {
        title_uz: '👑 FULL MAX VIP AKKAUNT (Tayyor)',
        title_ru: '👑 FULL MAX VIP АККАУНТ (Готовый)',
        description_uz: "50M pul + 10.000 coins + Barcha mashinalar ochiq + W16 + Sirenalar. Toza yangi pochtada topshiriladi!",
        description_ru: '50 млн + 10k коинов + все авто открыты + мигалки и W16. Полный доступ!',
        price: 45000,
        currency: 'UZS',
        type: 'account',
        badge: 'PREMIUM 👑',
        sort_order: 5
      }
    ];

    for (const s of defaultServices) {
      db.run(`
        INSERT INTO topup_services (title_uz, title_ru, description_uz, description_ru, price, currency, type, badge, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [s.title_uz, s.title_ru, s.description_uz, s.description_ru, s.price, s.currency, s.type, s.badge, s.sort_order]);
    }
    console.log('✅ Default CPM topup / donat services seeded');
  }
}

// Auto init on import
initDatabase();

module.exports = db;
