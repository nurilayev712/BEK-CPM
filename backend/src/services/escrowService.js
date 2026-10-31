const db = require('../config/db');
const { notifyUser, sendTelegramMessage } = require('./botService');
const { logAdminAction } = require('./logService');

function generateDealCode() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CPM-${rand}`;
}

const escrowService = {
  // Create a new deal
  createDeal(listingId, buyerTelegramId) {
    const listing = db.get(`
      SELECT l.*, u.telegram_id as seller_telegram_id, u.first_name as seller_name, u.username as seller_username
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.id = ?
    `, [listingId]);

    if (!listing) {
      throw new Error("E'lon topilmadi!");
    }

    if (listing.status !== 'active') {
      throw new Error("Ushbu e'lon hozirda faol emas yoki sotilgan!");
    }

    const buyer = db.get('SELECT * FROM users WHERE telegram_id = ?', [buyerTelegramId]);
    if (!buyer) {
      throw new Error("Xaridor profili topilmadi! /start bosing.");
    }

    if (buyer.id === listing.seller_id) {
      throw new Error("O'zingizning e'loningizni sotib ololmaysiz!");
    }

    // Check if an active deal already exists for this listing and buyer
    const existingDeal = db.get(`
      SELECT * FROM deals 
      WHERE listing_id = ? AND buyer_id = ? AND status IN ('pending', 'payment_sent', 'item_transferred')
    `, [listingId, buyer.id]);

    if (existingDeal) {
      return existingDeal;
    }

    const dealCode = generateDealCode();

    const result = db.run(`
      INSERT INTO deals (deal_code, listing_id, buyer_id, seller_id, price, currency, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [dealCode, listing.id, buyer.id, listing.seller_id, listing.price, listing.currency]);

    const deal = db.get('SELECT * FROM deals WHERE id = ?', [result.lastInsertRowid]);

    // Send notifications to both parties
    notifyUser(
      listing.seller_id,
      `Yangi bitim ochildi! #${dealCode}`,
      `Sizning "<b>${listing.title}</b>" e'loningizga xaridor chiqdi!\nNarx: <b>${listing.price.toLocaleString()} ${listing.currency}</b>\nXaridor: ${buyer.first_name || buyer.username || 'Foydalanuvchi'}\n\nXaridor to'lovni yuborishi kutilmoqda. Xavfsiz savdo kafolatlanadi.`,
      'deal'
    );

    notifyUser(
      buyer.id,
      `Bitim ochildi! #${dealCode}`,
      `Siz "<b>${listing.title}</b>" uchun bitim ochdingiz.\nNarx: <b>${listing.price.toLocaleString()} ${listing.currency}</b>\nSotuvchi: ${listing.seller_name || listing.seller_username || 'Sotuvchi'}\n\nIltimos, sotuvchi bilan kelishib to'lovni yuboring va 'To'lov qilindi' tugmasini bosing!`,
      'deal'
    );

    return deal;
  },

  // Mark payment sent by buyer
  markPaymentSent(dealId, buyerId) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');
    if (deal.buyer_id !== buyerId) throw new Error('Faqat xaridor toʻlovni tasdiqlashi mumkin!');
    if (deal.status !== 'pending') throw new Error(`Bitim holati '${deal.status}', toʻlovni tasdiqlab boʻlmaydi!`);

    db.run(`
      UPDATE deals 
      SET status = 'payment_sent', buyer_confirmed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [dealId]);

    const listing = db.get('SELECT title FROM listings WHERE id = ?', [deal.listing_id]);

    notifyUser(
      deal.seller_id,
      `To'lov yuborildi! #${deal.deal_code}`,
      `Xaridor "<b>${listing ? listing.title : 'Mahsulot'}</b>" uchun to'lov qilganini bildirdi!\n\nIltimos, to'lovni hisobingizda tekshirib ko'ring va Car Parking Multiplayer (CPM) o'yini ichida mashina yoki akkauntni xaridorga topshiring. Shundan so'ng 'Mashina topshirildi' tugmasini bosing.`,
      'deal'
    );

    return db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
  },

  // Mark item transferred by seller
  markItemTransferred(dealId, sellerId) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');
    if (deal.seller_id !== sellerId) throw new Error('Faqat sotuvchi topshirilganini tasdiqlashi mumkin!');
    if (deal.status !== 'payment_sent' && deal.status !== 'pending') {
      throw new Error(`Bitim holati '${deal.status}', topshirishni tasdiqlab boʻlmaydi!`);
    }

    db.run(`
      UPDATE deals 
      SET status = 'item_transferred', seller_confirmed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [dealId]);

    const listing = db.get('SELECT title FROM listings WHERE id = ?', [deal.listing_id]);

    notifyUser(
      deal.buyer_id,
      `Mahsulot topshirildi! #${deal.deal_code}`,
      `Sotuvchi "<b>${listing ? listing.title : 'Mahsulot'}</b>"ni topshirganini tasdiqladi!\n\nIltimos, CPM o'yini ichida mashinani to'liq qabul qilib olganingizga ishonch hosil qiling va 'Savdoni muvaffaqiyatli yakunlash' tugmasini bosing! Agar muammo bo'lsa 'Nizo ochish' tugmasini bosing.`,
      'deal'
    );

    return db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
  },

  // Buyer completes the deal
  completeDeal(dealId, userId) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');
    if (deal.buyer_id !== userId && deal.seller_id !== userId) {
      throw new Error('Faqat bitim ishtirokchisi yakunlashi mumkin!');
    }
    if (deal.status === 'completed') throw new Error('Bitim allaqachon yakunlangan!');

    db.run(`
      UPDATE deals 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [dealId]);

    // Mark listing as sold
    db.run(`UPDATE listings SET status = 'sold' WHERE id = ?`, [deal.listing_id]);

    // Increment deals count for both users
    db.run(`UPDATE users SET deals_count = deals_count + 1 WHERE id IN (?, ?)`, [deal.buyer_id, deal.seller_id]);

    const listing = db.get('SELECT title FROM listings WHERE id = ?', [deal.listing_id]);

    // Notify both users
    notifyUser(
      deal.buyer_id,
      `Savdo muvaffaqiyatli yakunlandi! 🎉 #${deal.deal_code}`,
      `"<b>${listing ? listing.title : 'Mahsulot'}</b>" savdosi yakunlandi. Sotuvchiga baho va sharh qoldiring!`,
      'deal'
    );

    notifyUser(
      deal.seller_id,
      `Savdo muvaffaqiyatli yakunlandi! 🎉 #${deal.deal_code}`,
      `"<b>${listing ? listing.title : 'Mahsulot'}</b>" savdosi yakunlandi. Xaridorga baho va sharh qoldiring!`,
      'deal'
    );

    return db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
  },

  // Open a dispute
  openDispute(dealId, userId, reason) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');
    if (deal.buyer_id !== userId && deal.seller_id !== userId) {
      throw new Error('Faqat bitim ishtirokchisi nizo ocha oladi!');
    }
    if (deal.status === 'completed' || deal.status === 'cancelled') {
      throw new Error('Yakunlangan yoki bekor qilingan bitim boʻyicha nizo ochib boʻlmaydi!');
    }

    db.run(`
      UPDATE deals 
      SET status = 'disputed', dispute_reason = ?, dispute_opened_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason || 'Sabab koʻrsatilmadi', userId, dealId]);

    // Notify other party
    const targetUserId = userId === deal.buyer_id ? deal.seller_id : deal.buyer_id;
    notifyUser(
      targetUserId,
      `⚠️ Nizo ochildi! #${deal.deal_code}`,
      `Ikkinchi tomon ushbu bitim bo'yicha nizo ochdi.\nSabab: <i>${reason}</i>\n\nBitim moderatorlar tomonidan ko'rib chiqilmoqda. Tez orada admin siz bilan bog'lanadi.`,
      'deal'
    );

    notifyUser(
      userId,
      `⚠️ Nizo qabul qilindi #${deal.deal_code}`,
      `Sizning nizo arizangiz qabul qilindi. Admin tekshiruvidan so'ng bitim bo'yicha yakuniy qaror chiqariladi.`,
      'deal'
    );

    return db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
  },

  // Admin resolves dispute
  resolveDispute(dealId, adminId, adminUsername, resolution, action) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');

    let newStatus = 'completed';
    if (action === 'cancel') {
      newStatus = 'cancelled';
      // Re-activate listing
      db.run(`UPDATE listings SET status = 'active' WHERE id = ?`, [deal.listing_id]);
    } else {
      // Completed in favor of buyer/seller
      db.run(`UPDATE listings SET status = 'sold' WHERE id = ?`, [deal.listing_id]);
      db.run(`UPDATE users SET deals_count = deals_count + 1 WHERE id IN (?, ?)`, [deal.buyer_id, deal.seller_id]);
    }

    db.run(`
      UPDATE deals 
      SET status = ?, dispute_resolution = ?, dispute_resolved_by = ?, dispute_resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, resolution, adminId, dealId]);

    logAdminAction(adminId, adminUsername, 'RESOLVE_DISPUTE', {
      deal_code: deal.deal_code,
      action,
      resolution
    });

    notifyUser(
      deal.buyer_id,
      `⚖️ Nizo yechimi (#${deal.deal_code})`,
      `Admin qarori: <b>${action === 'cancel' ? 'Bitim bekor qilindi' : 'Bitim yakunlandi'}</b>\nXulosa: ${resolution}`,
      'deal'
    );

    notifyUser(
      deal.seller_id,
      `⚖️ Nizo yechimi (#${deal.deal_code})`,
      `Admin qarori: <b>${action === 'cancel' ? 'Bitim bekor qilindi' : 'Bitim yakunlandi'}</b>\nXulosa: ${resolution}`,
      'deal'
    );

    return db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
  },

  // Submit review / rating
  submitReview(dealId, fromUserId, score, comment) {
    const deal = db.get('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Bitim topilmadi!');
    if (deal.status !== 'completed') throw new Error('Faqat yakunlangan bitim uchun baho berish mumkin!');

    const toUserId = fromUserId === deal.buyer_id ? deal.seller_id : deal.buyer_id;

    // Check if already reviewed
    const existing = db.get('SELECT id FROM ratings WHERE deal_id = ? AND from_user_id = ?', [dealId, fromUserId]);
    if (existing) {
      throw new Error('Siz ushbu bitimga allaqachon baho bergansiz!');
    }

    db.run(`
      INSERT INTO ratings (deal_id, from_user_id, to_user_id, score, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [dealId, fromUserId, toUserId, Math.min(5, Math.max(1, score)), comment || '']);

    // Recalculate target user's average rating
    const avgData = db.get(`
      SELECT AVG(score) as avg_score, COUNT(*) as count 
      FROM ratings 
      WHERE to_user_id = ?
    `, [toUserId]);

    const newRating = avgData && avgData.count > 0 ? parseFloat(avgData.avg_score.toFixed(1)) : 5.0;
    const reviewCount = avgData ? avgData.count : 0;

    db.run('UPDATE users SET rating = ?, reviews_count = ? WHERE id = ?', [newRating, reviewCount, toUserId]);

    notifyUser(
      toUserId,
      `Yangi sharh va baho! ⭐`,
      `Sizga ${score} ⭐ baho qo'yildi.\nIzoh: "<i>${comment || 'Izohsiz'}</i>"\nSizning yangi umumiy reytingingiz: <b>${newRating}</b> ⭐`,
      'system'
    );

    return { success: true, newRating, reviewCount };
  }
};

module.exports = escrowService;
