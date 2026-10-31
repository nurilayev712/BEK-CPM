const db = require('../config/db');
const { logAdminAction } = require('../services/logService');
const { sendTelegramMessage, sendTelegramPhoto } = require('../services/botService');

const settingController = {
  getSettings(req, res) {
    try {
      const settings = db.query('SELECT * FROM system_settings');
      return res.json({ success: true, data: settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateSetting(req, res) {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ success: false, message: 'Kalit kiritilmadi' });

      db.run('UPDATE system_settings SET value = ? WHERE key = ?', [String(value), key]);

      logAdminAction(req.admin.id, req.admin.username, 'UPDATE_SETTING', `Sozlama yangilandi: ${key} = ${value}`, req.ip);

      return res.json({ success: true, message: 'Sozlama yangilandi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getLogs(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const total = db.get('SELECT COUNT(*) as total FROM admin_logs').total;
      const logs = db.query('SELECT * FROM admin_logs ORDER BY id DESC LIMIT ? OFFSET ?', [parseInt(limit), offset]);

      return res.json({
        success: true,
        data: logs,
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

  // Broadcast message to users
  async sendBroadcast(req, res) {
    try {
      const { message, photo_url, target = 'all' } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Xabar matnini kiriting' });
      }

      let query = "SELECT telegram_id FROM users WHERE status = 'active'";
      if (target === 'sellers') {
        query += " AND id IN (SELECT DISTINCT seller_id FROM listings)";
      } else if (target === 'buyers') {
        query += " AND id IN (SELECT DISTINCT buyer_id FROM deals)";
      }

      const recipients = db.query(query);
      if (recipients.length === 0) {
        return res.json({ success: true, message: 'Xabar yuborish uchun foydalanuvchilar topilmadi', sentCount: 0 });
      }

      // Run broadcast asynchronously so request doesn't timeout
      let sentCount = 0;
      let failCount = 0;

      // Broadcast asynchronously in background
      (async () => {
        for (const user of recipients) {
          try {
            if (photo_url) {
              await sendTelegramPhoto(user.telegram_id, photo_url, { caption: message });
            } else {
              await sendTelegramMessage(user.telegram_id, `📢 <b>E'LON:</b>\n\n${message}`);
            }
            sentCount++;
            // Small throttle to avoid Telegram flood limits
            await new Promise(r => setTimeout(r, 40));
          } catch (err) {
            failCount++;
          }
        }
        console.log(`[Broadcast Completed] Sent: ${sentCount}, Failed: ${failCount}`);
      })();

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'BROADCAST',
        `Broadcast boshlandi (${target}): ${recipients.length} ta foydalanuvchiga`,
        req.ip
      );

      return res.json({
        success: true,
        message: `Xabar yuborish boshlandi. Jami qabul qiluvchilar: ${recipients.length}`,
        totalRecipients: recipients.length
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = settingController;
