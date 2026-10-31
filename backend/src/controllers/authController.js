const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { logAdminAction } = require('../services/logService');

const authController = {
  // Admin Login
  login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Foydalanuvchi nomi va parol kiritilishi shart' });
      }

      const admin = db.get('SELECT * FROM admins WHERE username = ?', [username.trim()]);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Login yoki parol notoʻgʻri' });
      }

      if (!admin.is_active) {
        return res.status(403).json({ success: false, message: 'Ushbu admin hisobi bloklangan' });
      }

      const isMatch = bcrypt.compareSync(password, admin.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Login yoki parol notoʻgʻri' });
      }

      // Update last login
      db.run('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

      // Generate JWT
      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logAdminAction(admin.id, admin.username, 'LOGIN', 'Admin tizimga kirdi', req.ip);

      return res.json({
        success: true,
        message: 'Muvaffaqiyatli kirildi',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name,
          role: admin.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server xatoligi' });
    }
  },

  // Get current admin profile
  me(req, res) {
    return res.json({
      success: true,
      admin: req.admin
    });
  },

  // List admins
  listAdmins(req, res) {
    try {
      const admins = db.query('SELECT id, username, full_name, role, is_active, last_login, created_at FROM admins ORDER BY id ASC');
      return res.json({ success: true, data: admins });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Create new admin
  createAdmin(req, res) {
    try {
      const { username, password, full_name, role } = req.body;
      if (!username || !password || !full_name) {
        return res.status(400).json({ success: false, message: 'Barcha maydonlarni toʻldiring' });
      }

      const existing = db.get('SELECT id FROM admins WHERE username = ?', [username.trim()]);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Ushbu foydalanuvchi nomi band' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const result = db.run(
        'INSERT INTO admins (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [username.trim(), hash, full_name.trim(), role || 'admin']
      );

      logAdminAction(req.admin.id, req.admin.username, 'CREATE_ADMIN', `Yangi admin yaratildi: ${username}`, req.ip);

      return res.json({ success: true, message: 'Yangi admin muvaffaqiyatli yaratildi', adminId: result.lastInsertRowid });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Toggle admin active status
  toggleAdminStatus(req, res) {
    try {
      const { id } = req.params;
      if (parseInt(id) === req.admin.id) {
        return res.status(400).json({ success: false, message: 'Oʻzingizning hisobingizni bloklay olmaysiz' });
      }

      const target = db.get('SELECT * FROM admins WHERE id = ?', [id]);
      if (!target) return res.status(404).json({ success: false, message: 'Admin topilmadi' });

      const newStatus = target.is_active ? 0 : 1;
      db.run('UPDATE admins SET is_active = ? WHERE id = ?', [newStatus, id]);

      logAdminAction(req.admin.id, req.admin.username, 'TOGGLE_ADMIN', `Admin #${id} holati o'zgartirildi: ${newStatus}`, req.ip);

      return res.json({ success: true, message: 'Admin holati oʻzgartirildi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = authController;
