const db = require('../config/db');
const { logAdminAction } = require('../services/logService');
const { notifyUser, sendTelegramMessage } = require('../services/botService');

function generateOrderCode() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DONAT-${rand}`;
}

const topupController = {
  // Get all topup services
  getServices(req, res) {
    try {
      const services = db.query('SELECT * FROM topup_services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Admin: Get all services (including inactive)
  getAllServicesAdmin(req, res) {
    try {
      const services = db.query('SELECT * FROM topup_services ORDER BY sort_order ASC, id ASC');
      return res.json({ success: true, data: services });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Create new service
  createService(req, res) {
    try {
      const { title_uz, title_ru, description_uz, description_ru, price, currency = 'UZS', type, badge, sort_order = 0 } = req.body;
      if (!title_uz || !title_ru || !price) {
        return res.status(400).json({ success: false, message: 'Xizmat nomi va narxi kiritilishi shart' });
      }

      const result = db.run(`
        INSERT INTO topup_services (title_uz, title_ru, description_uz, description_ru, price, currency, type, badge, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [title_uz, title_ru, description_uz || '', description_ru || '', parseFloat(price), currency, type || 'cpm_money', badge || '', parseInt(sort_order)]);

      logAdminAction(req.admin.id, req.admin.username, 'CREATE_TOPUP_SERVICE', `Yangi donat xizmati: ${title_uz}`, req.ip);

      return res.json({ success: true, message: 'Xizmat muvaffaqiyatli qoʻshildi', id: result.lastInsertRowid });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Update service
  updateService(req, res) {
    try {
      const { id } = req.params;
      const { title_uz, title_ru, description_uz, description_ru, price, currency, type, badge, sort_order, is_active } = req.body;

      db.run(`
        UPDATE topup_services 
        SET title_uz = COALESCE(?, title_uz),
            title_ru = COALESCE(?, title_ru),
            description_uz = COALESCE(?, description_uz),
            description_ru = COALESCE(?, description_ru),
            price = COALESCE(?, price),
            currency = COALESCE(?, currency),
            type = COALESCE(?, type),
            badge = COALESCE(?, badge),
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `, [title_uz, title_ru, description_uz, description_ru, price, currency, type, badge, sort_order, is_active, id]);

      logAdminAction(req.admin.id, req.admin.username, 'UPDATE_TOPUP_SERVICE', `Donat xizmati #${id} yangilandi`, req.ip);

      return res.json({ success: true, message: 'Xizmat yangilandi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Delete service
  deleteService(req, res) {
    try {
      const { id } = req.params;
      db.run('DELETE FROM topup_services WHERE id = ?', [id]);
      logAdminAction(req.admin.id, req.admin.username, 'DELETE_TOPUP_SERVICE', `Donat xizmati #${id} o'chirildi`, req.ip);
      return res.json({ success: true, message: 'Xizmat oʻchirildi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get Topup Orders
  getOrders(req, res) {
    try {
      const { status = '', search = '', page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];
      const params = [];

      if (status && status !== 'all') {
        conditions.push('o.status = ?');
        params.push(status);
      }

      if (search.trim()) {
        conditions.push('(o.order_code LIKE ? OR o.game_id LIKE ? OR u.username LIKE ? OR u.first_name LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s, s);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(*) as total 
        FROM topup_orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
      `;
      const total = db.get(countSql, params).total;

      const dataSql = `
        SELECT o.*, 
               s.title_uz as service_title_uz, s.title_ru as service_title_ru, s.type as service_type,
               u.first_name, u.username, u.telegram_id, u.rating
        FROM topup_orders o
        JOIN users u ON o.user_id = u.id
        JOIN topup_services s ON o.service_id = s.id
        ${whereClause}
        ORDER BY o.id DESC
        LIMIT ? OFFSET ?
      `;

      const orders = db.query(dataSql, [...params, parseInt(limit), offset]);

      return res.json({
        success: true,
        data: orders,
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

  // Update Topup Order Status (Approve or Reject)
  updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_note } = req.body; // 'completed', 'rejected', 'processing'

      const order = db.get(`
        SELECT o.*, s.title_uz, u.telegram_id, u.first_name 
        FROM topup_orders o
        JOIN users u ON o.user_id = u.id
        JOIN topup_services s ON o.service_id = s.id
        WHERE o.id = ?
      `, [id]);

      if (!order) return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });

      const completedAt = status === 'completed' ? new Date().toISOString() : null;

      db.run(`
        UPDATE topup_orders 
        SET status = ?, admin_note = ?, completed_at = ?
        WHERE id = ?
      `, [status, admin_note || '', completedAt, id]);

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'UPDATE_TOPUP_STATUS',
        `Donat buyurtmasi #${order.order_code} holati '${status}' ga o'zgartirildi`,
        req.ip
      );

      // Send Telegram notification to user
      if (status === 'completed') {
        sendTelegramMessage(
          order.telegram_id,
          `🎉 <b>DONAT MUVAFFAQIYATLI BAJARILDI!</b>\n\n` +
          `Buyurtma kodi: <b>#${order.order_code}</b>\n` +
          `Xizmat: <b>${order.title_uz}</b>\n` +
          `O'yin ID: <code>${order.game_id}</code>\n\n` +
          `✅ Akkauntingizga pul/itemlar to'liq o'tkazildi! Car Parking Multiplayer o'yiniga kirib tekshirib ko'rishingiz mumkin.\n\n` +
          `<i>CPM Market platformasidan foydalanganingiz uchun tashakkur!</i>`
        );
      } else if (status === 'rejected') {
        sendTelegramMessage(
          order.telegram_id,
          `❌ <b>BUYURTMA RAD ETILDI</b>\n\n` +
          `Buyurtma kodi: <b>#${order.order_code}</b>\n` +
          `Xizmat: <b>${order.title_uz}</b>\n` +
          `Sabab: <i>${admin_note || "To'lov cheki tasdiqlanmadi yoki o'yin ID xato kiritilgan"}</i>\n\n` +
          `Qo'shimcha savollar bo'lsa adminga murojaat qiling.`
        );
      }

      return res.json({ success: true, message: `Buyurtma '${status}' holatiga oʻtkazildi` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Payment Details (Card number, holder)
  getPaymentDetails(req, res) {
    try {
      const cardNumber = db.get("SELECT value FROM system_settings WHERE key = 'payment_card_number'")?.value || '';
      const cardHolder = db.get("SELECT value FROM system_settings WHERE key = 'payment_card_holder'")?.value || '';
      const bankName = db.get("SELECT value FROM system_settings WHERE key = 'payment_bank_name'")?.value || '';
      return res.json({
        success: true,
        data: { cardNumber, cardHolder, bankName }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Update Payment Details
  updatePaymentDetails(req, res) {
    try {
      const { cardNumber, cardHolder, bankName } = req.body;
      if (cardNumber !== undefined) {
        db.run("UPDATE system_settings SET value = ? WHERE key = 'payment_card_number'", [cardNumber]);
      }
      if (cardHolder !== undefined) {
        db.run("UPDATE system_settings SET value = ? WHERE key = 'payment_card_holder'", [cardHolder]);
      }
      if (bankName !== undefined) {
        db.run("UPDATE system_settings SET value = ? WHERE key = 'payment_bank_name'", [bankName]);
      }

      logAdminAction(req.admin.id, req.admin.username, 'UPDATE_PAYMENT_DETAILS', 'Toʻlov rekvizitlari yangilandi', req.ip);

      return res.json({ success: true, message: 'Toʻlov rekvizitlari muvaffaqiyatli saqlandi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = topupController;
