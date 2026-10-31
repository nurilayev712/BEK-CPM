const { Parser } = require('json2csv');
const db = require('../config/db');

const reportController = {
  exportCSV(req, res) {
    try {
      const { type = 'users' } = req.query; // 'users', 'listings', 'deals'

      let data = [];
      let fields = [];
      let filename = `cpm_${type}_${Date.now()}.csv`;

      if (type === 'users') {
        data = db.query(`
          SELECT id, telegram_id, first_name, username, language, rating, reviews_count, deals_count, balance, status, created_at
          FROM users
          ORDER BY id DESC
        `);
        fields = ['id', 'telegram_id', 'first_name', 'username', 'language', 'rating', 'reviews_count', 'deals_count', 'balance', 'status', 'created_at'];
      } else if (type === 'listings') {
        data = db.query(`
          SELECT l.id, l.title, c.name_uz as category, l.price, l.currency, l.status, l.is_vip, l.views_count, u.username as seller, l.created_at
          FROM listings l
          JOIN categories c ON l.category_id = c.id
          JOIN users u ON l.seller_id = u.id
          ORDER BY l.id DESC
        `);
        fields = ['id', 'title', 'category', 'price', 'currency', 'status', 'is_vip', 'views_count', 'seller', 'created_at'];
      } else if (type === 'deals') {
        data = db.query(`
          SELECT d.id, d.deal_code, l.title as listing_title, d.price, d.currency, d.status,
                 b.username as buyer, s.username as seller, d.created_at, d.updated_at
          FROM deals d
          JOIN listings l ON d.listing_id = l.id
          JOIN users b ON d.buyer_id = b.id
          JOIN users s ON d.seller_id = s.id
          ORDER BY d.id DESC
        `);
        fields = ['id', 'deal_code', 'listing_title', 'price', 'currency', 'status', 'buyer', 'seller', 'created_at', 'updated_at'];
      } else {
        return res.status(400).json({ success: false, message: 'Nomaʼlum hisobot turi' });
      }

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);

      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      return res.send(csv);
    } catch (err) {
      console.error('CSV export error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = reportController;
