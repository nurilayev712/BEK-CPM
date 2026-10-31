const db = require('../config/db');

const statsController = {
  getDashboardStats(req, res) {
    try {
      // Basic counts
      const usersCount = db.get('SELECT COUNT(*) as count FROM users').count;
      const activeListings = db.get("SELECT COUNT(*) as count FROM listings WHERE status = 'active'").count;
      const todayListings = db.get("SELECT COUNT(*) as count FROM listings WHERE date(created_at) = date('now')").count;
      
      const activeDeals = db.get("SELECT COUNT(*) as count FROM deals WHERE status IN ('pending', 'payment_sent', 'item_transferred')").count;
      const completedDeals = db.get("SELECT COUNT(*) as count FROM deals WHERE status = 'completed'").count;
      const disputedDeals = db.get("SELECT COUNT(*) as count FROM deals WHERE status = 'disputed'").count;
      
      const totalVolume = db.get("SELECT COALESCE(SUM(price), 0) as total FROM deals WHERE status = 'completed'").total;

      // Category distribution
      const categoryStats = db.query(`
        SELECT c.name_uz, c.name_ru, c.icon, COUNT(l.id) as listing_count
        FROM categories c
        LEFT JOIN listings l ON c.id = l.category_id
        GROUP BY c.id
        ORDER BY listing_count DESC
      `);

      // 30 Days trend (Users and Deals)
      const last30DaysUsers = db.query(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= date('now', '-30 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);

      const last30DaysDeals = db.query(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM deals
        WHERE created_at >= date('now', '-30 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);

      // Recent 10 deals
      const recentDeals = db.query(`
        SELECT d.id, d.deal_code, d.price, d.currency, d.status, d.created_at,
               l.title as listing_title,
               b.first_name as buyer_name, b.username as buyer_username,
               s.first_name as seller_name, s.username as seller_username
        FROM deals d
        JOIN listings l ON d.listing_id = l.id
        JOIN users b ON d.buyer_id = b.id
        JOIN users s ON d.seller_id = s.id
        ORDER BY d.id DESC
        LIMIT 7
      `);

      // Recent 10 admin logs
      const recentLogs = db.query(`
        SELECT * FROM admin_logs ORDER BY id DESC LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          metrics: {
            usersCount,
            activeListings,
            todayListings,
            activeDeals,
            completedDeals,
            disputedDeals,
            totalVolume
          },
          categoryStats,
          trends: {
            users: last30DaysUsers,
            deals: last30DaysDeals
          },
          recentDeals,
          recentLogs
        }
      });
    } catch (err) {
      console.error('Stats error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = statsController;
