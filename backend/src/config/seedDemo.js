const db = require('./db');

function seedDemoData() {
  console.log('🌱 Seeding CPM demo data...');

  // Check if users already exist
  const count = db.get('SELECT COUNT(*) as count FROM users').count;
  if (count > 2) {
    console.log('ℹ️ Demo users already seeded. Skipping.');
    return;
  }

  // Demo users
  const demoUsers = [
    { telegram_id: 1001, first_name: 'Javohir (DriftKing)', username: 'cpm_drift_king', rating: 4.9, reviews: 24, deals: 32 },
    { telegram_id: 1002, first_name: 'Sardor', username: 'cpm_sardor_seller', rating: 4.8, reviews: 15, deals: 19 },
    { telegram_id: 1003, first_name: 'Diyorbek CPM', username: 'diyor_tuning', rating: 5.0, reviews: 9, deals: 11 },
    { telegram_id: 1004, first_name: 'Bekzod', username: 'bekzod_gamer', rating: 4.6, reviews: 7, deals: 8 },
    { telegram_id: 1005, first_name: 'Azizbek', username: 'aziz_cpm_trader', rating: 4.9, reviews: 31, deals: 45 }
  ];

  const userIds = [];
  for (const u of demoUsers) {
    const res = db.run(`
      INSERT INTO users (telegram_id, first_name, username, language, rating, reviews_count, deals_count)
      VALUES (?, ?, ?, 'uz', ?, ?, ?)
    `, [u.telegram_id, u.first_name, u.username, u.rating, u.reviews, u.deals]);
    userIds.push(res.lastInsertRowid);
  }

  // Demo Listings
  const categories = db.query('SELECT id, slug FROM categories');
  const getCatId = (slug) => {
    const c = categories.find(item => item.slug === slug);
    return c ? c.id : categories[0].id;
  };

  const demoListings = [
    {
      seller_id: userIds[0],
      category_id: getCatId('sport'),
      title: 'BMW M8 Competition F93 (1695 HP, W16)',
      description: 'Toʻliq tyuning qilingan. 1695 ot kuchi, W16 motor, sport podveska va tormozlar. Mashinada original politsiya chiroqlari oʻrnatilgan. Xaridorga oʻyinda 5 daqiqada beriladi.',
      price: 85000,
      currency: 'UZS',
      images: JSON.stringify(['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80']),
      tags: JSON.stringify(['tuning', 'w16', 'rare']),
      status: 'active',
      is_vip: 1,
      views: 342
    },
    {
      seller_id: userIds[1],
      category_id: getCatId('drift-drag'),
      title: 'Toyota Supra MK4 Custom Drift Setup',
      description: 'Noyob Drift nastroyka. Har qanday burilishda ideal sirpanadi. Narx kelishiladi. Vinil maxsus chizilgan anime dizayn.',
      price: 60000,
      currency: 'UZS',
      images: JSON.stringify(['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80']),
      tags: JSON.stringify(['drift', 'vinyl']),
      status: 'active',
      is_vip: 1,
      views: 215
    },
    {
      seller_id: userIds[2],
      category_id: getCatId('suv'),
      title: 'Mercedes-Benz G63 AMG (Gelandewagen) Chrome',
      description: 'Toʻliq xrom qoplama (Gold Chrome). Hech qanday chiziqsiz, 1695HP motor va sirena mavjud. Tezkor savdo.',
      price: 110000,
      currency: 'UZS',
      images: JSON.stringify(['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800&q=80']),
      tags: JSON.stringify(['chrome', 'w16', 'rare']),
      status: 'active',
      is_vip: 0,
      views: 180
    },
    {
      seller_id: userIds[4],
      category_id: getCatId('accounts'),
      title: 'CPM Full Max Akkaunt: 50.000.000$ + Barcha mashinalar ochiq',
      description: 'Barcha pullik mashinalar, tutunlar, sirena va disklar sotib olingan. Akkaunt toza pochta bilan topshiriladi. Kafolatlangan escrow.',
      price: 250000,
      currency: 'UZS',
      images: JSON.stringify(['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80']),
      tags: JSON.stringify(['rare', 'vip']),
      status: 'active',
      is_vip: 1,
      views: 520
    },
    {
      seller_id: userIds[3],
      category_id: getCatId('vinyl'),
      title: 'Nissan GT-R R35 Godzilla Monster Vinyl',
      description: '3 kun davomida chizilgan maxsus professional vinil. CPM eng zoʻr R35 loyihalaridan biri.',
      price: 45000,
      currency: 'UZS',
      images: JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80']),
      tags: JSON.stringify(['vinyl', 'tuning']),
      status: 'active',
      is_vip: 0,
      views: 95
    }
  ];

  const listingIds = [];
  for (const l of demoListings) {
    const res = db.run(`
      INSERT INTO listings (seller_id, category_id, title, description, price, currency, images, tags, status, is_vip, views_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [l.seller_id, l.category_id, l.title, l.description, l.price, l.currency, l.images, l.tags, l.status, l.is_vip, l.views]);
    listingIds.push(res.lastInsertRowid);
  }

  // Demo Deals
  const demoDeals = [
    {
      code: 'CPM-89102',
      listing_id: listingIds[0],
      buyer_id: userIds[3],
      seller_id: userIds[0],
      price: 85000,
      status: 'completed'
    },
    {
      code: 'CPM-45129',
      listing_id: listingIds[1],
      buyer_id: userIds[2],
      seller_id: userIds[1],
      price: 60000,
      status: 'payment_sent'
    },
    {
      code: 'CPM-77210',
      listing_id: listingIds[2],
      buyer_id: userIds[0],
      seller_id: userIds[2],
      price: 110000,
      status: 'disputed',
      dispute_reason: "Xaridor to'lov chekini soxtalashtirgan deb da'vo qilmoqda, pul tushmadi."
    },
    {
      code: 'CPM-99031',
      listing_id: listingIds[3],
      buyer_id: userIds[1],
      seller_id: userIds[4],
      price: 250000,
      status: 'item_transferred'
    }
  ];

  for (const d of demoDeals) {
    db.run(`
      INSERT INTO deals (deal_code, listing_id, buyer_id, seller_id, price, currency, status, dispute_reason)
      VALUES (?, ?, ?, ?, ?, 'UZS', ?, ?)
    `, [d.code, d.listing_id, d.buyer_id, d.seller_id, d.price, d.status, d.dispute_reason || null]);
  }

  // Demo reviews
  db.run(`
    INSERT INTO ratings (deal_id, from_user_id, to_user_id, score, comment)
    VALUES (1, ?, ?, 5, 'Juda tezkor va ishonchli sotuvchi! CPM oʻyinida 2 daqiqada mashinani berdi. Rahmat!')
  `, [userIds[3], userIds[0]]);

  console.log('✅ Demo users, listings, deals and reviews successfully seeded!');
}

seedDemoData();
