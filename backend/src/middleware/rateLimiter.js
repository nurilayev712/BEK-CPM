const rateLimit = require('express-rate-limit');

// General API rate limiter: 100 requests per 1 minute
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Juda koʻp soʻrov yuborildi. Iltimos 1 daqiqadan soʻng qayta urining.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Koʻp marta xato urinishlar. Iltimos 15 daqiqadan soʻng qayta urining.' }
});

module.exports = {
  apiLimiter,
  authLimiter
};
