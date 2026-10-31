const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const statsController = require('../controllers/statsController');
const listingController = require('../controllers/listingController');
const dealController = require('../controllers/dealController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const settingController = require('../controllers/settingController');
const reportController = require('../controllers/reportController');
const topupController = require('../controllers/topupController');

const { authenticateToken, requireRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Public Auth
router.post('/auth/login', authLimiter, authController.login);

// Public categories and listings (for public catalog if needed)
router.get('/public/categories', categoryController.getCategories);
router.get('/public/listings', listingController.getListings);
router.get('/public/listings/:id', listingController.getListingById);
router.get('/public/topup-services', topupController.getServices);
router.get('/public/payment-details', topupController.getPaymentDetails);

// Image upload (authenticated or open with file validation)
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Fayl yuklanmadi' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    message: 'Rasm muvaffaqiyatli yuklandi',
    url: fileUrl,
    filename: req.file.filename
  });
});

// Protected routes (Admin token required)
router.use(authenticateToken);

// Auth Me & Admin Management
router.get('/auth/me', authController.me);
router.get('/admins', requireRole(['superadmin']), authController.listAdmins);
router.post('/admins', requireRole(['superadmin']), authController.createAdmin);
router.patch('/admins/:id/status', requireRole(['superadmin']), authController.toggleAdminStatus);

// Dashboard Stats
router.get('/stats/dashboard', statsController.getDashboardStats);

// Listings Management
router.get('/listings', listingController.getListings);
router.get('/listings/:id', listingController.getListingById);
router.patch('/listings/:id/status', listingController.updateStatus);
router.post('/listings/:id/vip', listingController.toggleVip);
router.delete('/listings/:id', listingController.deleteListing);

// Deals & Escrow & Disputes
router.get('/deals', dealController.getDeals);
router.get('/deals/:id', dealController.getDealById);
router.post('/deals/:id/resolve-dispute', dealController.resolveDispute);

// Users Management
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.patch('/users/:id/status', userController.updateStatus);
router.post('/users/:id/message', userController.sendMessage);

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Topup & Donat Services & Orders (Admin)
router.get('/topup/services', topupController.getAllServicesAdmin);
router.post('/topup/services', topupController.createService);
router.put('/topup/services/:id', topupController.updateService);
router.delete('/topup/services/:id', topupController.deleteService);
router.get('/topup/orders', topupController.getOrders);
router.patch('/topup/orders/:id/status', topupController.updateOrderStatus);
router.get('/topup/payment-details', topupController.getPaymentDetails);
router.post('/topup/payment-details', topupController.updatePaymentDetails);

// Settings, Logs, Broadcast
router.get('/settings', settingController.getSettings);
router.post('/settings', settingController.updateSetting);
router.get('/logs', settingController.getLogs);
router.post('/broadcast', settingController.sendBroadcast);

// CSV Export Reports
router.get('/reports/export', reportController.exportCSV);

module.exports = router;
