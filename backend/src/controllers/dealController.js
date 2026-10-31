const db = require('../config/db');
const escrowService = require('../services/escrowService');

const dealController = {
  getDeals(req, res) {
    try {
      const {
        status = '',
        disputed = '',
        search = '',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];
      const params = [];

      if (status && status !== 'all') {
        conditions.push('d.status = ?');
        params.push(status);
      }

      if (disputed === '1' || disputed === 'true') {
        conditions.push("d.status = 'disputed'");
      }

      if (search.trim()) {
        conditions.push('(d.deal_code LIKE ? OR l.title LIKE ? OR b.username LIKE ? OR s.username LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s, s);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(*) as total 
        FROM deals d
        JOIN listings l ON d.listing_id = l.id
        JOIN users b ON d.buyer_id = b.id
        JOIN users s ON d.seller_id = s.id
        ${whereClause}
      `;
      const total = db.get(countSql, params).total;

      const dataSql = `
        SELECT d.*,
               l.title as listing_title, l.price as listing_price, l.currency as listing_currency, l.images as listing_images,
               b.first_name as buyer_name, b.username as buyer_username, b.telegram_id as buyer_telegram_id, b.rating as buyer_rating,
               s.first_name as seller_name, s.username as seller_username, s.telegram_id as seller_telegram_id, s.rating as seller_rating
        FROM deals d
        JOIN listings l ON d.listing_id = l.id
        JOIN users b ON d.buyer_id = b.id
        JOIN users s ON d.seller_id = s.id
        ${whereClause}
        ORDER BY d.id DESC
        LIMIT ? OFFSET ?
      `;

      const deals = db.query(dataSql, [...params, parseInt(limit), offset]);

      const formatted = deals.map(item => ({
        ...item,
        listing_images: JSON.parse(item.listing_images || '[]')
      }));

      return res.json({
        success: true,
        data: formatted,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('Deals query error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getDealById(req, res) {
    try {
      const { id } = req.params;
      const deal = db.get(`
        SELECT d.*,
               l.title as listing_title, l.description as listing_desc, l.price as listing_price, l.images as listing_images,
               b.first_name as buyer_name, b.username as buyer_username, b.telegram_id as buyer_telegram_id, b.rating as buyer_rating, b.deals_count as buyer_deals,
               s.first_name as seller_name, s.username as seller_username, s.telegram_id as seller_telegram_id, s.rating as seller_rating, s.deals_count as seller_deals,
               a.username as resolver_admin
        FROM deals d
        JOIN listings l ON d.listing_id = l.id
        JOIN users b ON d.buyer_id = b.id
        JOIN users s ON d.seller_id = s.id
        LEFT JOIN admins a ON d.dispute_resolved_by = a.id
        WHERE d.id = ?
      `, [id]);

      if (!deal) return res.status(404).json({ success: false, message: 'Bitim topilmadi' });

      deal.listing_images = JSON.parse(deal.listing_images || '[]');

      // Get reviews if any
      const reviews = db.query(`
        SELECT r.*, u.first_name, u.username 
        FROM ratings r
        JOIN users u ON r.from_user_id = u.id
        WHERE r.deal_id = ?
      `, [id]);

      return res.json({ success: true, data: { ...deal, reviews } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Resolve dispute
  resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { action, resolution } = req.body; // action: 'complete' or 'cancel'

      if (!action || !resolution) {
        return res.status(400).json({ success: false, message: 'Qaror turi va izoh yozilishi shart' });
      }

      const updated = escrowService.resolveDispute(
        id,
        req.admin.id,
        req.admin.username,
        resolution,
        action
      );

      return res.json({ success: true, message: 'Nizo muvaffaqiyatli hal qilindi', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = dealController;
