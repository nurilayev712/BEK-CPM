const db = require('../config/db');

let botInstance = null;

function setBotInstance(bot) {
  botInstance = bot;
}

function getBotInstance() {
  return botInstance;
}

// Send telegram message to user
async function sendTelegramMessage(telegramId, text, extra = {}) {
  if (!botInstance) {
    console.warn(`[BotService] Telegram bot ishlamayapti. Xabar yuborilmadi (to: ${telegramId})`);
    return false;
  }
  try {
    await botInstance.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML', ...extra });
    return true;
  } catch (err) {
    console.error(`[BotService] Telegram xabar yuborishda xatolik (ID: ${telegramId}):`, err.message);
    return false;
  }
}

// Send photo to user
async function sendTelegramPhoto(telegramId, photo, extra = {}) {
  if (!botInstance) return false;
  try {
    await botInstance.telegram.sendPhoto(telegramId, photo, { parse_mode: 'HTML', ...extra });
    return true;
  } catch (err) {
    console.error(`[BotService] Telegram rasm yuborishda xatolik (ID: ${telegramId}):`, err.message);
    return false;
  }
}

// Save notification in database and push via telegram
async function notifyUser(userId, title, message, type = 'deal') {
  try {
    db.run(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );

    const user = db.get('SELECT telegram_id FROM users WHERE id = ?', [userId]);
    if (user && user.telegram_id) {
      await sendTelegramMessage(user.telegram_id, `🔔 <b>${title}</b>\n\n${message}`);
    }
  } catch (err) {
    console.error('[BotService] Notification error:', err);
  }
}

module.exports = {
  setBotInstance,
  getBotInstance,
  sendTelegramMessage,
  sendTelegramPhoto,
  notifyUser
};
