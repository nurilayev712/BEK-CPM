const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cpm_market_super_secret_jwt_key_2026_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Autentifikatsiya talab qilinadi (Token topilmadi)' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token yaroqsiz yoki muddati tugagan' });
    }

    // Verify admin is still active in DB
    const admin = db.get('SELECT id, username, full_name, role, is_active FROM admins WHERE id = ?', [decoded.id]);
    if (!admin || !admin.is_active) {
      return res.status(403).json({ success: false, message: 'Ushbu admin hisobi bloklangan yoki mavjud emas' });
    }

    req.admin = admin;
    next();
  });
}

function requireRole(roles = ['superadmin', 'admin']) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Ruxsat berilmagan' });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: 'Ushbu amal uchun huquqingiz yetarli emas' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
