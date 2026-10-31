const db = require('../config/db');
const { logAdminAction } = require('../services/logService');

const categoryController = {
  getCategories(req, res) {
    try {
      const categories = db.query(`
        SELECT c.*, (SELECT COUNT(*) FROM listings WHERE category_id = c.id) as listings_count
        FROM categories c
        ORDER BY c.sort_order ASC, c.id ASC
      `);
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  createCategory(req, res) {
    try {
      const { name_uz, name_ru, icon = '🚗', slug, sort_order = 0 } = req.body;
      if (!name_uz || !name_ru || !slug) {
        return res.status(400).json({ success: false, message: 'Nomlar va slug maydonlari talab qilinadi' });
      }

      const existing = db.get('SELECT id FROM categories WHERE slug = ?', [slug.trim().toLowerCase()]);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bunday slug allaqachon mavjud' });
      }

      const result = db.run(
        'INSERT INTO categories (name_uz, name_ru, icon, slug, sort_order) VALUES (?, ?, ?, ?, ?)',
        [name_uz.trim(), name_ru.trim(), icon, slug.trim().toLowerCase(), parseInt(sort_order)]
      );

      logAdminAction(req.admin.id, req.admin.username, 'CREATE_CATEGORY', `Yangi kategoriya: ${name_uz}`, req.ip);

      return res.json({ success: true, message: 'Kategoriya muvaffaqiyatli qoʻshildi', categoryId: result.lastInsertRowid });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name_uz, name_ru, icon, slug, sort_order, is_active } = req.body;

      const category = db.get('SELECT * FROM categories WHERE id = ?', [id]);
      if (!category) return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });

      db.run(`
        UPDATE categories 
        SET name_uz = COALESCE(?, name_uz),
            name_ru = COALESCE(?, name_ru),
            icon = COALESCE(?, icon),
            slug = COALESCE(?, slug),
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `, [name_uz, name_ru, icon, slug, sort_order, is_active, id]);

      logAdminAction(req.admin.id, req.admin.username, 'UPDATE_CATEGORY', `Kategoriya #${id} yangilandi: ${name_uz || category.name_uz}`, req.ip);

      return res.json({ success: true, message: 'Kategoriya yangilandi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const listingsCount = db.get('SELECT COUNT(*) as count FROM listings WHERE category_id = ?', [id]).count;
      if (listingsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Ushbu kategoriyada ${listingsCount} ta e'lon mavjud. Avval ularni boshqa kategoriyaga o'tkazing!`
        });
      }

      db.run('DELETE FROM categories WHERE id = ?', [id]);
      logAdminAction(req.admin.id, req.admin.username, 'DELETE_CATEGORY', `Kategoriya #${id} o'chirildi`, req.ip);

      return res.json({ success: true, message: 'Kategoriya oʻchirildi' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = categoryController;
