const db = require('../config/db');

function logAdminAction(adminId, adminUsername, action, details, ipAddress = '') {
  try {
    db.run(
      'INSERT INTO admin_logs (admin_id, admin_username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [adminId || null, adminUsername || 'system', action, typeof details === 'object' ? JSON.stringify(details) : details, ipAddress]
    );
  } catch (err) {
    console.error('Failed to write admin log:', err);
  }
}

module.exports = {
  logAdminAction
};
