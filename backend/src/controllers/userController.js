const db = require('../config/db');
const { logAdminAction } = require('../services/logService');
const { sendTelegramMessage } = require('../services/botService');

const userController = {
  getUsers(req, res) {
    try {
      const {
        search = '',
        status = '',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];
      const params = [];

      if (search.trim()) {
        conditions.push('(username LIKE ? OR first_name LIKE ? OR telegram_id LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s);
      }

      if (status && status !== 'all') {
        conditions.push('status = ?');
        params.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const total = db.get(`SELECT COUNT(*) as total FROM users ${whereClause}`, params).total;

      const users = db.query(`
        SELECT u.*, 
               (SELECT COUNT(*) FROM listings WHERE seller_id = u.id) as listings_count,
               (SELECT COUNT(*) FROM deals WHERE buyer_id = u.id OR seller_id = u.id) as total_deals
        FROM users u
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      return res.json({
        success: true,
        data: users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
      if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });

      // User listings
      const listings = db.query('SELECT * FROM listings WHERE seller_id = ? ORDER BY id DESC', [id]);

      // User deals
      const deals = db.query(`
        SELECT d.*, l.title as listing_title
        FROM deals d
        JOIN listings l ON d.listing_id = l.id
        WHERE d.buyer_id = ? OR d.seller_id = ?
        ORDER BY d.id DESC
      `, [id, id]);

      // User reviews received
      const reviews = db.query(`
        SELECT r.*, u.first_name, u.username
        FROM ratings r
        JOIN users u ON r.from_user_id = u.id
        WHERE r.to_user_id = ?
        ORDER BY r.id DESC
      `, [id]);

      // Referrals
      const referrals = db.query('SELECT id, first_name, username, created_at FROM users WHERE referrer_id = ?', [id]);

      return res.json({
        success: true,
        data: {
          user,
          listings: listings.map(l => ({ ...l, images: JSON.parse(l.images || '[]') })),
          deals,
          reviews,
          referrals
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Toggle user ban status
  updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'active', 'banned'

      const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
      if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });

      db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'UPDATE_USER_STATUS',
        `Foydalanuvchi #${id} (@${user.username || user.telegram_id}) holati '${status}' ga o'zgartirildi`,
        req.ip
      );

      if (status === 'banned') {
        sendTelegramMessage(
          user.telegram_id,
          '⛔ <b>Sizning hisobingiz bloklandi!</b>\n\nPlatforma qoidalarini buzganingiz sababli akkauntingiz vaqtincha yoki butunlay cheklangan. Qoʻshimcha maʼlumot uchun adminga murojaat qiling.'
        );
      } else {
        sendTelegramMessage(
          user.telegram_id,
          '✅ <b>Hisobingiz qayta faollashtirildi!</b>\n\nSiz yana CPM Market platformasidan bemalol foydalanishingiz mumkin.'
        );
      }

      return res.json({ success: true, message: `Foydalanuvchi holati '${status}' ga oʻzgartirildi` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Direct message to user via Telegram
  sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Xabar matnini kiriting' });
      }

      const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
      if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });

      const sent = sendTelegramMessage(
        user.telegram_id,
        `📩 <b>ADMIN XABARI:</b>\n\n${message.trim()}\n\n<i>CPM Market Ma'muriyati</i>`
      );

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'SEND_USER_MESSAGE',
        `Foydalanuvchi #${id} (@${user.username || user.telegram_id}) ga xabar yuborildi: ${message.slice(0, 50)}...`,
        req.ip
      );

      return res.json({ success: true, message: 'Xabar foydalanuvchiga muvaffaqiyatli yetkazildi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = userController;
