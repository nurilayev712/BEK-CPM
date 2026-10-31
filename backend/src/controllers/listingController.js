const db = require('../config/db');
const { logAdminAction } = require('../services/logService');
const { notifyUser } = require('../services/botService');

const listingController = {
  // Get listings with filters and pagination
  getListings(req, res) {
    try {
      const {
        search = '',
        category_id = '',
        status = '',
        is_vip = '',
        sort = 'newest', // 'newest', 'price_asc', 'price_desc', 'views'
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];
      const params = [];

      if (search.trim()) {
        conditions.push('(l.title LIKE ? OR l.description LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s);
      }

      if (category_id) {
        conditions.push('l.category_id = ?');
        params.push(parseInt(category_id));
      }

      if (status && status !== 'all') {
        conditions.push('l.status = ?');
        params.push(status);
      }

      if (is_vip !== '') {
        conditions.push('l.is_vip = ?');
        params.push(parseInt(is_vip));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Sorting
      let orderBy = 'l.is_vip DESC, l.id DESC';
      if (sort === 'price_asc') orderBy = 'l.price ASC';
      if (sort === 'price_desc') orderBy = 'l.price DESC';
      if (sort === 'views') orderBy = 'l.views_count DESC';
      if (sort === 'oldest') orderBy = 'l.id ASC';

      // Count query
      const countSql = `SELECT COUNT(*) as total FROM listings l ${whereClause}`;
      const total = db.get(countSql, params).total;

      // Data query
      const dataSql = `
        SELECT l.*, 
               c.name_uz as category_name_uz, c.name_ru as category_name_ru, c.icon as category_icon,
               u.first_name as seller_name, u.username as seller_username, u.telegram_id as seller_telegram_id, u.rating as seller_rating, u.deals_count as seller_deals
        FROM listings l
        JOIN categories c ON l.category_id = c.id
        JOIN users u ON l.seller_id = u.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const listings = db.query(dataSql, [...params, parseInt(limit), offset]);

      // Parse JSON fields
      const formattedListings = listings.map(item => ({
        ...item,
        images: JSON.parse(item.images || '[]'),
        tags: JSON.parse(item.tags || '[]')
      }));

      return res.json({
        success: true,
        data: formattedListings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('Listings error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get single listing by ID
  getListingById(req, res) {
    try {
      const { id } = req.params;
      const listing = db.get(`
        SELECT l.*, 
               c.name_uz as category_name_uz, c.name_ru as category_name_ru, c.icon as category_icon,
               u.first_name as seller_name, u.username as seller_username, u.telegram_id as seller_telegram_id, u.rating as seller_rating, u.deals_count as seller_deals, u.created_at as seller_joined
        FROM listings l
        JOIN categories c ON l.category_id = c.id
        JOIN users u ON l.seller_id = u.id
        WHERE l.id = ?
      `, [id]);

      if (!listing) {
        return res.status(404).json({ success: false, message: "E'lon topilmadi" });
      }

      // Increment views count
      db.run('UPDATE listings SET views_count = views_count + 1 WHERE id = ?', [id]);

      listing.images = JSON.parse(listing.images || '[]');
      listing.tags = JSON.parse(listing.tags || '[]');

      return res.json({ success: true, data: listing });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Update listing status (Admin: approve, reject, sold, etc.)
  updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body; // status: 'active', 'rejected', 'sold'

      const listing = db.get('SELECT * FROM listings WHERE id = ?', [id]);
      if (!listing) return res.status(404).json({ success: false, message: "E'lon topilmadi" });

      db.run('UPDATE listings SET status = ? WHERE id = ?', [status, id]);

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'UPDATE_LISTING_STATUS',
        `E'lon #${id} ("${listing.title}") holati '${status}' ga o'zgartirildi`,
        req.ip
      );

      // Notify seller
      if (status === 'active') {
        notifyUser(listing.seller_id, "E'loningiz tasdiqlandi! ✅", `Sizning "<b>${listing.title}</b>" nomli e'loningiz moderator tomonidan tasdiqlandi va qidiruvda ko'rinmoqda.`, 'system');
      } else if (status === 'rejected') {
        notifyUser(listing.seller_id, "E'loningiz rad etildi ❌", `Sizning "<b>${listing.title}</b>" nomli e'loningiz rad etildi.\nSabab: ${reason || "Qoidalarga to'g'ri kelmaydi"}`, 'system');
      }

      return res.json({ success: true, message: "E'lon holati muvaffaqiyatli yangilandi" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Toggle VIP status
  toggleVip(req, res) {
    try {
      const { id } = req.params;
      const { days = 7 } = req.body;

      const listing = db.get('SELECT * FROM listings WHERE id = ?', [id]);
      if (!listing) return res.status(404).json({ success: false, message: "E'lon topilmadi" });

      const newVip = listing.is_vip ? 0 : 1;
      let vipUntil = null;
      if (newVip) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(days));
        vipUntil = d.toISOString();
      }

      db.run('UPDATE listings SET is_vip = ?, vip_until = ? WHERE id = ?', [newVip, vipUntil, id]);

      logAdminAction(
        req.admin.id,
        req.admin.username,
        'TOGGLE_VIP',
        `E'lon #${id} VIP holati: ${newVip ? 'Yoqildi (' + days + ' kun)' : 'Oʻchirildi'}`,
        req.ip
      );

      if (newVip) {
        notifyUser(listing.seller_id, "VIP status faollashdi! ⭐👑", `Sizning "<b>${listing.title}</b>" e'loningiz VIP qatorga ko'tarildi (${days} kun).`, 'system');
      }

      return res.json({ success: true, message: 'VIP holati oʻzgartirildi', is_vip: newVip });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Delete listing
  deleteListing(req, res) {
    try {
      const { id } = req.params;
      const listing = db.get('SELECT * FROM listings WHERE id = ?', [id]);
      if (!listing) return res.status(404).json({ success: false, message: "E'lon topilmadi" });

      db.run('DELETE FROM listings WHERE id = ?', [id]);

      logAdminAction(req.admin.id, req.admin.username, 'DELETE_LISTING', `E'lon #${id} ("${listing.title}") o'chirildi`, req.ip);

      return res.json({ success: true, message: "E'lon muvaffaqiyatli o'chirildi" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = listingController;
