const { Telegraf, Markup } = require('telegraf');
const db = require('../config/db');
const { t } = require('./locales');
const keyboards = require('./keyboards');
const escrowService = require('../services/escrowService');
const { setBotInstance } = require('../services/botService');

// State storage for multi-step wizards & search
const userStates = new Map();

function initBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.warn('⚠️ [BOT] BOT_TOKEN topilmadi! Bot hozircha ishga tushirilmadi. Iltimos .env faylida BOT_TOKEN ni belgilang.');
    return null;
  }

  const bot = new Telegraf(token);
  setBotInstance(bot);

  // Helper to get or create user
  function getOrCreateUser(ctx) {
    const from = ctx.from;
    let user = db.get('SELECT * FROM users WHERE telegram_id = ?', [from.id]);

    if (!user) {
      // Check start payload for referral
      let referrerId = null;
      if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/start ref_')) {
        const refId = parseInt(ctx.message.text.replace('/start ref_', ''));
        const refUser = db.get('SELECT id FROM users WHERE id = ?', [refId]);
        if (refUser) referrerId = refUser.id;
      }

      db.run(`
        INSERT INTO users (telegram_id, first_name, last_name, username, language, referrer_id)
        VALUES (?, ?, ?, ?, 'uz', ?)
      `, [from.id, from.first_name || '', from.last_name || '', from.username || '', referrerId]);

      user = db.get('SELECT * FROM users WHERE telegram_id = ?', [from.id]);
    } else {
      // Update basic info
      db.run(`
        UPDATE users 
        SET first_name = ?, last_name = ?, username = ?
        WHERE id = ?
      `, [from.first_name || '', from.last_name || '', from.username || '', user.id]);
    }

    return user;
  }

  // Check if user is banned
  bot.use((ctx, next) => {
    if (ctx.from) {
      const user = db.get('SELECT status FROM users WHERE telegram_id = ?', [ctx.from.id]);
      if (user && user.status === 'banned') {
        return ctx.reply('⛔ Sizning hisobingiz bloklangan. Administratorga murojaat qiling.');
      }
    }
    return next();
  });

  // /start command
  bot.start(async (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';

    const welcomeMsg = t(lang, 'welcome', {
      name: ctx.from.first_name || 'Foydalanuvchi'
    });

    await ctx.reply(welcomeMsg, {
      parse_mode: 'HTML',
      ...keyboards.mainMenu(lang)
    });
  });

  // Language switch
  bot.hears([/🌐 Tilni o'zgartirish/, /🌐 Сменить язык/], (ctx) => {
    ctx.reply(t('uz', 'choose_language'), keyboards.languageSelect());
  });

  bot.action('set_lang_uz', async (ctx) => {
    db.run("UPDATE users SET language = 'uz' WHERE telegram_id = ?", [ctx.from.id]);
    await ctx.answerCbQuery();
    await ctx.reply(t('uz', 'lang_saved'), keyboards.mainMenu('uz'));
  });

  bot.action('set_lang_ru', async (ctx) => {
    db.run("UPDATE users SET language = 'ru' WHERE telegram_id = ?", [ctx.from.id]);
    await ctx.answerCbQuery();
    await ctx.reply(t('ru', 'lang_saved'), keyboards.mainMenu('ru'));
  });

  // Profile
  bot.hears([/👤 Mening profilim/, /👤 Мой профиль/], async (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';

    const botInfo = await bot.telegram.getMe();
    const listingsCount = db.get("SELECT COUNT(*) as count FROM listings WHERE seller_id = ? AND status = 'active'", [user.id]).count;

    const profileText = t(lang, 'profile_text', {
      id: user.id,
      name: user.first_name || user.username || 'Foydalanuvchi',
      rating: user.rating.toFixed(1),
      reviews_count: user.reviews_count,
      deals_count: user.deals_count,
      listings_count: listingsCount,
      created_at: new Date(user.created_at).toLocaleDateString(),
      bot_username: botInfo.username
    });

    ctx.reply(profileText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, 'btn_my_listings'), callback_data: 'my_listings' }]
        ]
      }
    });
  });

  // Wallet / Balance
  bot.hears([/💳 Hamyon & Balans/, /💳 Кошелек & Баланс/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';

    const text = `💳 <b>Sizning Hamyoningiz:</b>\n\n` +
      `💰 Balans: <b>${user.balance ? user.balance.toLocaleString() : '0'} UZS</b>\n` +
      `⭐ O'yindagi muvaffaqiyatli xaridlar: <b>${user.deals_count} ta</b>\n\n` +
      `💡 <i>Balansingizdagi mablag'dan CPM Market ichida mashinalarni VIP qilish, reklamalar sotib olish yoki donat xizmatlari uchun foydalanishingiz mumkin.</i>`;

    ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "💎 O'yinga pul solish (Donat)", callback_data: 'start_topup' }]
        ]
      }
    });
  });

  // Topup / Donat Menu
  bot.hears([/💎 O'yinga pul solish/, /💎 Донат в игру/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';

    const text = `💎 <b>Car Parking Multiplayer — Donat & O'yinga Pul Solish Markazi:</b>\n\n` +
      `Biz orqali o'yindagi hisobingizga arzon narxlarda va 100% xavfsiz holda o'yin puli (CPM Money), oltin tangalar (Coins), pullik mashinalarni ochish va tyuning to'plamlarini sotib olishingiz mumkin!\n\n` +
      `👇 <b>Quyidagi xizmatlardan birini tanlang:</b>`;

    ctx.reply(text, {
      parse_mode: 'HTML',
      ...keyboards.topupServicesMenu(lang)
    });
  });

  bot.action('start_topup', (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';
    ctx.answerCbQuery();
    ctx.reply(`💎 <b>Kerakli xizmat turini tanlang:</b>`, {
      parse_mode: 'HTML',
      ...keyboards.topupServicesMenu(lang)
    });
  });

  // Select Topup Service
  bot.action(/^topup_select_(\d+)$/, async (ctx) => {
    const serviceId = parseInt(ctx.match[1]);
    const service = db.get('SELECT * FROM topup_services WHERE id = ?', [serviceId]);
    await ctx.answerCbQuery();
    if (!service) return ctx.reply("Xizmat topilmadi");

    const user = getOrCreateUser(ctx);
    userStates.set(user.telegram_id, {
      step: 'topup_game_id',
      data: { serviceId: service.id, serviceTitle: service.title_uz, price: service.price, currency: service.currency }
    });

    const promptText = `💎 <b>Tanlangan xizmat:</b> ${service.title_uz}\n` +
      `💰 <b>Narxi:</b> ${service.price.toLocaleString()} ${service.currency}\n` +
      `📄 <i>${service.description_uz}</i>\n\n` +
      `🎮 Iltimos, Car Parking Multiplayer o'yindagi <b>ID raqamingizni</b> yoki akkaunt pochtangizni yozib yuboring:\n` +
      `<i>(Masalan: CPM1948201 yoki email@example.com)</i>`;

    ctx.reply(promptText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[Markup.button.callback('❌ Bekor qilish', 'topup_cancel')]]
      }
    });
  });

  bot.action('topup_cancel', async (ctx) => {
    const user = getOrCreateUser(ctx);
    userStates.delete(user.telegram_id);
    await ctx.answerCbQuery();
    await ctx.reply("❌ Donat xizmati bekor qilindi.", keyboards.mainMenu(user.language));
  });

  // My Listings
  bot.action('my_listings', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const listings = db.query('SELECT * FROM listings WHERE seller_id = ? ORDER BY id DESC', [user.id]);

    await ctx.answerCbQuery();
    if (listings.length === 0) {
      return ctx.reply("Sizda hali e'lonlar mavjud emas. '➕ E'lon berish' tugmasi orqali yangi e'lon qo'shishingiz mumkin!");
    }

    let text = `📦 <b>Sizning e'lonlaringiz (${listings.length} ta):</b>\n\n`;
    listings.forEach((l, idx) => {
      text += `${idx + 1}. <b>${l.title}</b> — ${l.price.toLocaleString()} ${l.currency}\nHolati: <i>${l.status}</i> | Ko'rishlar: ${l.views_count}\n\n`;
    });

    ctx.reply(text, { parse_mode: 'HTML' });
  });

  // Help & Rules
  bot.hears([/ℹ️ Yordam & Qoidalar/, /ℹ️ Помощь & Правила/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';
    const supportUser = db.get("SELECT value FROM system_settings WHERE key = 'support_username'");

    const helpMsg = t(lang, 'help_text', {
      support_username: supportUser ? supportUser.value : 'CPMMarketAdmin'
    });

    ctx.reply(helpMsg, { parse_mode: 'HTML' });
  });

  // Favorites
  bot.hears([/❤️ Sevimlilar/, /❤️ Избранное/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const favs = db.query(`
      SELECT l.*, c.name_uz, c.name_ru
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      JOIN categories c ON l.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.id DESC
    `, [user.id]);

    if (favs.length === 0) {
      return ctx.reply("❤️ Sizning sevimlilar ro'yxatingiz bo'sh. Katalogdagi e'lonlarni ❤️ tugmasi orqali saqlab qo'yishingiz mumkin!");
    }

    let text = `❤️ <b>Sevimlilar ro'yxatingiz (${favs.length} ta):</b>\n\n`;
    const buttons = [];
    favs.forEach((item, idx) => {
      text += `${idx + 1}. <b>${item.title}</b> — ${item.price.toLocaleString()} ${item.currency} (${item.status})\n`;
      buttons.push([Markup.button.callback(`🚗 ${item.title.slice(0, 25)}`, `show_listing_${item.id}`)]);
    });

    ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  });

  // Catalog Menu
  bot.hears([/🚗 E'lonlar katalogi/, /🚗 Каталог объявлений/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';
    ctx.reply(t(lang, 'wizard_step1'), keyboards.categoriesMenu(lang, 'browse_cat'));
  });

  // Browse category listings
  bot.action(/^browse_cat_(\d+)$/, async (ctx) => {
    const catId = parseInt(ctx.match[1]);
    await showCategoryListing(ctx, catId, 0);
  });

  // Listing navigation
  bot.action(/^list_nav_(\d+)_(\d+)$/, async (ctx) => {
    const catId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    await ctx.answerCbQuery();
    await showCategoryListing(ctx, catId, index, true);
  });

  // Back to categories
  bot.action('back_to_categories', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';
    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'wizard_step1'), keyboards.categoriesMenu(lang, 'browse_cat'));
  });

  async function showCategoryListing(ctx, catId, index = 0, isEdit = false) {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';

    const listings = db.query(`
      SELECT l.*, 
             c.name_uz as cat_name_uz, c.name_ru as cat_name_ru,
             u.first_name as seller_name, u.username as seller_username, u.rating as seller_rating, u.deals_count as seller_deals
      FROM listings l
      JOIN categories c ON l.category_id = c.id
      JOIN users u ON l.seller_id = u.id
      WHERE l.category_id = ? AND l.status = 'active'
      ORDER BY l.is_vip DESC, l.id DESC
    `, [catId]);

    if (listings.length === 0) {
      if (isEdit) {
        return ctx.reply(t(lang, 'empty_catalog'));
      } else {
        await ctx.answerCbQuery();
        return ctx.reply(t(lang, 'empty_catalog'), keyboards.categoriesMenu(lang, 'browse_cat'));
      }
    }

    const currentItem = listings[Math.max(0, Math.min(index, listings.length - 1))];
    const isFav = db.get('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?', [user.id, currentItem.id]);

    // Parse images and tags
    const images = JSON.parse(currentItem.images || '[]');
    const tags = JSON.parse(currentItem.tags || '[]');
    const tagsStr = tags.length > 0 ? tags.map(t => `#${t}`).join(' ') : '—';

    // Increment views
    db.run('UPDATE listings SET views_count = views_count + 1 WHERE id = ?', [currentItem.id]);

    const cardText = t(lang, 'listing_card', {
      title: currentItem.title,
      vip_badge: currentItem.is_vip ? '⭐ [VIP]' : '',
      category: lang === 'ru' ? currentItem.cat_name_ru : currentItem.cat_name_uz,
      price: currentItem.price.toLocaleString(),
      currency: currentItem.currency,
      tags: tagsStr,
      description: currentItem.description,
      seller_name: currentItem.seller_name || 'Foydalanuvchi',
      seller_username: currentItem.seller_username || 'nomaʼlum',
      seller_rating: currentItem.seller_rating.toFixed(1),
      seller_deals: currentItem.seller_deals,
      views: currentItem.views_count + 1
    });

    const replyMarkup = keyboards.listingCard(currentItem, index, listings.length, !!isFav, lang);

    if (images.length > 0 && images[0]) {
      try {
        await ctx.replyWithPhoto(images[0], {
          caption: cardText,
          parse_mode: 'HTML',
          ...replyMarkup
        });
      } catch (err) {
        // Fallback to text if image error
        await ctx.reply(cardText, {
          parse_mode: 'HTML',
          ...replyMarkup
        });
      }
    } else {
      await ctx.reply(cardText, {
        parse_mode: 'HTML',
        ...replyMarkup
      });
    }
  }

  // Show listing directly by ID (e.g., from favorites or search)
  bot.action(/^show_listing_(\d+)$/, async (ctx) => {
    const listingId = parseInt(ctx.match[1]);
    const listing = db.get('SELECT category_id FROM listings WHERE id = ?', [listingId]);
    await ctx.answerCbQuery();
    if (listing) {
      await showCategoryListing(ctx, listing.category_id, 0);
    } else {
      await ctx.reply("E'lon topilmadi yoki o'chirilgan.");
    }
  });

  // Favorite toggle
  bot.action(/^fav_(\d+)$/, async (ctx) => {
    const listingId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);

    const existing = db.get('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?', [user.id, listingId]);
    if (existing) {
      db.run('DELETE FROM favorites WHERE id = ?', [existing.id]);
      await ctx.answerCbQuery('💔 Sevimlilardan olib tashlandi');
    } else {
      db.run('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)', [user.id, listingId]);
      await ctx.answerCbQuery('❤️ Sevimlilarga qoʻshildi!');
    }
  });

  // Buy (Initiate Escrow)
  bot.action(/^buy_(\d+)$/, async (ctx) => {
    const listingId = parseInt(ctx.match[1]);
    try {
      const deal = escrowService.createDeal(listingId, ctx.from.id);
      await ctx.answerCbQuery();
      const user = getOrCreateUser(ctx);

      ctx.reply(
        `🤝 <b>Xavfsiz Bitim (#${deal.deal_code}) ochildi!</b>\n\nNarx: <b>${deal.price.toLocaleString()} ${deal.currency}</b>\n\nTo'lovni amalga oshirgach, quyidagi <b>'💳 To'lov yuborildi'</b> tugmasini bosing:`,
        {
          parse_mode: 'HTML',
          ...keyboards.dealActions(deal, user.id)
        }
      );
    } catch (err) {
      await ctx.answerCbQuery(err.message, { show_alert: true });
    }
  });

  // My Deals
  bot.hears([/🤝 Mening bitimlarim/, /🤝 Мои сделки/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const deals = db.query(`
      SELECT d.*, l.title as listing_title
      FROM deals d
      JOIN listings l ON d.listing_id = l.id
      WHERE d.buyer_id = ? OR d.seller_id = ?
      ORDER BY d.id DESC
      LIMIT 10
    `, [user.id, user.id]);

    if (deals.length === 0) {
      return ctx.reply("Sizda hali hech qanday faol yoki yakunlangan bitimlar yo'q. Katalogdan mashina tanlab 'Sotib olish' orqali birinchi xavfsiz savdongizni boshlashingiz mumkin!");
    }

    let text = `🤝 <b>Sizning bitimlaringiz (oxirgi 10 ta):</b>\n\n`;
    deals.forEach((d) => {
      const role = d.buyer_id === user.id ? '🛒 Xaridor' : '🚗 Sotuvchi';
      text += `• <b>#${d.deal_code}</b> — ${d.listing_title}\n  Narx: ${d.price.toLocaleString()} ${d.currency}\n  Roli: ${role} | Holat: <b>${d.status}</b>\n\n`;
    });

    const buttons = deals.map(d => [
      Markup.button.callback(`Bitim #${d.deal_code} ni ko'rish`, `view_deal_${d.id}`)
    ]);

    ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  });

  // View specific deal
  bot.action(/^view_deal_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    const deal = db.get(`
      SELECT d.*, l.title as listing_title, l.description as listing_desc,
             b.first_name as buyer_name, b.username as buyer_username,
             s.first_name as seller_name, s.username as seller_username
      FROM deals d
      JOIN listings l ON d.listing_id = l.id
      JOIN users b ON d.buyer_id = b.id
      JOIN users s ON d.seller_id = s.id
      WHERE d.id = ?
    `, [dealId]);

    await ctx.answerCbQuery();
    if (!deal) return ctx.reply('Bitim topilmadi.');

    const statusMap = {
      pending: "⏳ To'lov kutilmoqda",
      payment_sent: "💳 To'lov yuborildi (Mashina topshirilishi kutilmoqda)",
      item_transferred: "🚗 Mashina topshirildi (Xaridor tasdiqlashi kutilmoqda)",
      completed: "✅ Muvaffaqiyatli yakunlandi",
      disputed: "⚠️ Nizo ko'rib chiqilmoqda",
      cancelled: "❌ Bekor qilingan"
    };

    const text = `🤝 <b>Bitim #${deal.deal_code}</b>\n\n` +
      `🚗 Mahsulot: <b>${deal.listing_title}</b>\n` +
      `💰 Narxi: <b>${deal.price.toLocaleString()} ${deal.currency}</b>\n` +
      `📌 Holat: <b>${statusMap[deal.status] || deal.status}</b>\n\n` +
      `👤 Xaridor: ${deal.buyer_name} (@${deal.buyer_username || 'yoʻq'})\n` +
      `👤 Sotuvchi: ${deal.seller_name} (@${deal.seller_username || 'yoʻq'})\n` +
      (deal.dispute_reason ? `\n⚠️ Nizo sababi: <i>${deal.dispute_reason}</i>\n` : '') +
      (deal.dispute_resolution ? `\n⚖️ Nizo yechimi: <b>${deal.dispute_resolution}</b>\n` : '');

    ctx.reply(text, {
      parse_mode: 'HTML',
      ...keyboards.dealActions(deal, user.id)
    });
  });

  // Deal Step Actions
  bot.action(/^deal_pay_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    try {
      escrowService.markPaymentSent(dealId, user.id);
      await ctx.answerCbQuery("✅ To'lov yuborilgani qayd etildi!");
      await ctx.reply("✅ Siz to'lov yuborganingizni tasdiqladingiz. Sotuvchiga bildirishnoma bordi. U CPM o'yinida mashinani topshirishi kutilmoqda.");
    } catch (err) {
      await ctx.answerCbQuery(err.message, { show_alert: true });
    }
  });

  bot.action(/^deal_transfer_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    try {
      escrowService.markItemTransferred(dealId, user.id);
      await ctx.answerCbQuery("✅ Mahsulot topshirilgani qayd etildi!");
      await ctx.reply("✅ Mashina topshirilganini tasdiqladingiz. Xaridor qabul qilib olgach savdo yakunlanadi.");
    } catch (err) {
      await ctx.answerCbQuery(err.message, { show_alert: true });
    }
  });

  bot.action(/^deal_complete_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    try {
      escrowService.completeDeal(dealId, user.id);
      await ctx.answerCbQuery("🎉 Savdo muvaffaqiyatli yakunlandi!");
      await ctx.reply("🎉 Savdo muvaffaqiyatli yakunlandi! Iltimos, ikkinchi tomonga baho qo'ying:", keyboards.ratingStars(dealId));
    } catch (err) {
      await ctx.answerCbQuery(err.message, { show_alert: true });
    }
  });

  // Dispute prompt
  bot.action(/^deal_dispute_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    userStates.set(user.telegram_id, { step: 'dispute_reason', dealId });
    await ctx.answerCbQuery();
    await ctx.reply("⚠️ Iltimos, nizo sababini yozib yuboring (masalan: to'lov tushmadi, mashina berilmadi, aldoqchilik va h.k.):");
  });

  // Rating scores
  bot.action(/^rate_(\d+)$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.reply("⭐ Iltimos, 1 dan 5 gacha baholang:", keyboards.ratingStars(dealId));
  });

  bot.action(/^score_(\d+)_([1-5])$/, async (ctx) => {
    const dealId = parseInt(ctx.match[1]);
    const score = parseInt(ctx.match[2]);
    const user = getOrCreateUser(ctx);

    try {
      escrowService.submitReview(dealId, user.id, score, `Baholandi: ${score} yulduz`);
      await ctx.answerCbQuery(`Baho qabul qilindi: ${score} ⭐`);
      await ctx.reply(`Rahmat! Siz ${score} ⭐ baho qoldirdingiz.`);
    } catch (err) {
      await ctx.answerCbQuery(err.message, { show_alert: true });
    }
  });

  // Search
  bot.hears([/🔍 Qidiruv/, /🔍 Поиск/], (ctx) => {
    const user = getOrCreateUser(ctx);
    userStates.set(user.telegram_id, { step: 'search_query' });
    ctx.reply("🔍 Qidirmoqchi bo'lgan mashina nomini yoki kalit so'zni yozing (masalan: M8, Supra, Vinyl):");
  });

  // Sell Wizard Start
  bot.hears([/➕ E'lon berish/, /➕ Продать/], (ctx) => {
    const user = getOrCreateUser(ctx);
    const lang = user.language || 'uz';
    userStates.set(user.telegram_id, { step: 'wizard_cat', data: { tags: [], images: [] } });
    ctx.reply(t(lang, 'wizard_step1'), keyboards.categoriesMenu(lang, 'wiz_cat'));
  });

  // Wizard: Category selected
  bot.action(/^wiz_cat_(\d+)$/, async (ctx) => {
    const catId = parseInt(ctx.match[1]);
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state || state.step !== 'wizard_cat') {
      return ctx.answerCbQuery();
    }

    state.data.categoryId = catId;
    state.step = 'wizard_title';
    await ctx.answerCbQuery();
    await ctx.reply("📝 Mashina yoki mahsulot nomini yozing:\n<i>(Masalan: BMW M8 Competition 1695HP)</i>", { parse_mode: 'HTML' });
  });

  // Wizard: Tag toggling
  bot.action(/^tag_([a-zA-Z0-9]+)$/, async (ctx) => {
    const tagId = ctx.match[1];
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state || state.step !== 'wizard_tags') return ctx.answerCbQuery();

    if (state.data.tags.includes(tagId)) {
      state.data.tags = state.data.tags.filter(t => t !== tagId);
    } else {
      state.data.tags.push(tagId);
    }

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(keyboards.tagsMenu(state.data.tags).reply_markup);
  });

  bot.action('tags_done', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state) return ctx.answerCbQuery();

    state.step = 'wizard_images';
    await ctx.answerCbQuery();
    await ctx.reply(
      "📸 Mashinangiz rasmini yuboring (1 dan 5 tagacha yuborishingiz mumkin).\nRasm yuborib bo'lgach '✅ Rasmlar tayyor' deb yozing yoki tugmani bosing:",
      Markup.inlineKeyboard([[Markup.button.callback('✅ Rasmlar tayyor, davom etish', 'wiz_images_done')]])
    );
  });

  bot.action('wiz_images_done', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state) return ctx.answerCbQuery();
    await ctx.answerCbQuery();
    await showWizardConfirmation(ctx, state);
  });

  async function showWizardConfirmation(ctx, state) {
    const cat = db.get('SELECT name_uz FROM categories WHERE id = ?', [state.data.categoryId]);
    const tagsStr = state.data.tags.length > 0 ? state.data.tags.map(t => `#${t}`).join(' ') : 'Teglarsiz';

    const text = `📋 <b>E'lon ma'lumotlarini tekshiring:</b>\n\n` +
      `🚗 <b>Nomi:</b> ${state.data.title}\n` +
      `📂 <b>Kategoriya:</b> ${cat ? cat.name_uz : 'Kategoriya'}\n` +
      `💰 <b>Narxi:</b> ${state.data.price.toLocaleString()} ${state.data.currency}\n` +
      `🏷️ <b>Teglar:</b> ${tagsStr}\n` +
      `📸 <b>Rasmlar soni:</b> ${state.data.images.length} ta\n\n` +
      `📄 <b>Tavsif:</b>\n${state.data.description}\n\n` +
      `E'lonni katalogga chop etishni tasdiqlaysizmi?`;

    state.step = 'wizard_confirm';
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...keyboards.wizardConfirm()
    });
  }

  // Wizard Confirm / VIP / Cancel
  bot.action('wizard_confirm_yes', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state || !state.data) return ctx.answerCbQuery();

    try {
      db.run(`
        INSERT INTO listings (seller_id, category_id, title, description, price, currency, images, tags, status, is_vip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
      `, [
        user.id,
        state.data.categoryId,
        state.data.title,
        state.data.description,
        state.data.price,
        state.data.currency,
        JSON.stringify(state.data.images),
        JSON.stringify(state.data.tags)
      ]);

      userStates.delete(user.telegram_id);
      await ctx.answerCbQuery();
      await ctx.reply("🎉 <b>Tabriklaymiz!</b> E'loningiz muvaffaqiyatli chop etildi va katalogga joylashtirildi.", {
        parse_mode: 'HTML',
        ...keyboards.mainMenu(user.language)
      });
    } catch (err) {
      await ctx.reply("E'lonni saqlashda xatolik yuz berdi: " + err.message);
    }
  });

  bot.action('wizard_confirm_vip', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);
    if (!state || !state.data) return ctx.answerCbQuery();

    const d = new Date();
    d.setDate(d.getDate() + 7);

    try {
      db.run(`
        INSERT INTO listings (seller_id, category_id, title, description, price, currency, images, tags, status, is_vip, vip_until)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)
      `, [
        user.id,
        state.data.categoryId,
        state.data.title,
        state.data.description,
        state.data.price,
        state.data.currency,
        JSON.stringify(state.data.images),
        JSON.stringify(state.data.tags),
        d.toISOString()
      ]);

      userStates.delete(user.telegram_id);
      await ctx.answerCbQuery();
      await ctx.reply("👑 <b>Tabriklaymiz!</b> E'loningiz ⭐ <b>VIP</b> maqomida birinchi o'rinda joylashtirildi!", {
        parse_mode: 'HTML',
        ...keyboards.mainMenu(user.language)
      });
    } catch (err) {
      await ctx.reply("Xatolik: " + err.message);
    }
  });

  bot.action('wizard_confirm_cancel', async (ctx) => {
    const user = getOrCreateUser(ctx);
    userStates.delete(user.telegram_id);
    await ctx.answerCbQuery();
    await ctx.reply("❌ E'lon berish bekor qilindi.", keyboards.mainMenu(user.language));
  });

  // Handle Photo uploads during wizard & topup
  bot.on('photo', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const state = userStates.get(user.telegram_id);

    // Topup Receipt Photo
    if (state && state.step === 'topup_receipt') {
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `DONAT-${rand}`;

      db.run(`
        INSERT INTO topup_orders (order_code, user_id, service_id, game_id, price, currency, receipt_image, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [orderCode, user.id, state.data.serviceId, state.data.gameId, state.data.price, state.data.currency, fileId]);

      userStates.delete(user.telegram_id);

      return ctx.reply(
        `✅ <b>TO'LOV CHEKI QABUL QILINDI!</b>\n\n` +
        `Buyurtma kodi: <b>#${orderCode}</b>\n` +
        `Xizmat: <b>${state.data.serviceTitle}</b>\n` +
        `O'yin ID: <code>${state.data.gameId}</code>\n\n` +
        `⏳ Buyurtmangiz qabul qilindi va moderatorlarga yetkazildi. To'lov tasdiqlangach 5-15 daqiqada akkauntingizga to'liq o'tkaziladi va bot orqali xabar beriladi!`,
        { parse_mode: 'HTML', ...keyboards.mainMenu(user.language) }
      );
    }

    if (state && state.step === 'wizard_images') {
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id; // Best quality photo
      state.data.images.push(fileId);

      if (state.data.images.length >= 5) {
        await ctx.reply("✅ 5 ta rasm qabul qilindi. Keyingi bosqichga o'tilmoqda...");
        await showWizardConfirmation(ctx, state);
      } else {
        await ctx.reply(
          `📸 Rasm qabul qilindi (${state.data.images.length}/5 ta). Yana rasm yuborishingiz mumkin yoki tugatish tugmasini bosing:`,
          Markup.inlineKeyboard([[Markup.button.callback('✅ Rasmlar tayyor, davom etish', 'wiz_images_done')]])
        );
      }
    }
  });

  // General Text Input Handler (for wizards, search, disputes)
  bot.on('text', async (ctx) => {
    const user = getOrCreateUser(ctx);
    const text = ctx.message.text.trim();
    const state = userStates.get(user.telegram_id);

    if (!state) return;

    // Topup Game ID Input
    if (state.step === 'topup_game_id') {
      state.data.gameId = text;
      state.step = 'topup_receipt';

      const cardNum = db.get("SELECT value FROM system_settings WHERE key = 'payment_card_number'")?.value || '8600 5304 1234 5678';
      const cardHolder = db.get("SELECT value FROM system_settings WHERE key = 'payment_card_holder'")?.value || 'CPM MARKET ADMIN';
      const bankName = db.get("SELECT value FROM system_settings WHERE key = 'payment_bank_name'")?.value || 'Payme / Click';

      const msg = `💳 <b>To'lov Ma'lumotlari:</b>\n\n` +
        `💎 Xizmat: <b>${state.data.serviceTitle}</b>\n` +
        `🎮 O'yin ID: <code>${state.data.gameId}</code>\n` +
        `💰 To'lov summasi: <b>${state.data.price.toLocaleString()} ${state.data.currency}</b>\n\n` +
        `📥 <b>To'lov uchun karta rekvizitlari:</b>\n` +
        `💳 Karta raqam: <code>${cardNum}</code>\n` +
        `👤 Karta egasi: <b>${cardHolder}</b>\n` +
        `🏦 To'lov usuli: ${bankName}\n\n` +
        `📸 <b>Iltimos, to'lovni amalga oshirgach to'lov chekini (skrinshotini) rasm shaklida shu yerga yuboring:</b>`;

      return ctx.reply(msg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('❌ Bekor qilish', 'topup_cancel')]]
        }
      });
    }

    // Search query
    if (state.step === 'search_query') {
      userStates.delete(user.telegram_id);
      const results = db.query(`
        SELECT l.*, c.name_uz as cat_name
        FROM listings l
        JOIN categories c ON l.category_id = c.id
        WHERE l.status = 'active' AND (l.title LIKE ? OR l.description LIKE ?)
        ORDER BY l.is_vip DESC, l.id DESC
        LIMIT 10
      `, [`%${text}%`, `%${text}%`]);

      if (results.length === 0) {
        return ctx.reply(`🔍 "<b>${text}</b>" bo'yicha hech qanday e'lon topilmadi. Boshqa so'z bilan qidirib ko'ring.`, { parse_mode: 'HTML' });
      }

      let resText = `🔍 "<b>${text}</b>" bo'yicha topilgan natijalar (${results.length} ta):\n\n`;
      const buttons = results.map(r => [
        Markup.button.callback(`🚗 ${r.title} — ${r.price.toLocaleString()} ${r.currency}`, `show_listing_${r.id}`)
      ]);

      return ctx.reply(resText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // Dispute reason
    if (state.step === 'dispute_reason') {
      const dealId = state.dealId;
      userStates.delete(user.telegram_id);
      try {
        escrowService.openDispute(dealId, user.id, text);
        return ctx.reply("⚠️ Nizo arizangiz qabul qilindi va moderatorlarga yetkazildi. Tez orada adolatli hal qilinadi.");
      } catch (err) {
        return ctx.reply("Xatolik: " + err.message);
      }
    }

    // Wizard Steps
    if (state.step === 'wizard_title') {
      state.data.title = text;
      state.step = 'wizard_desc';
      return ctx.reply("📄 Mashina yoki mahsulot tavsifini yozing:\n<i>(Motor ot kuchi, tyuning holati, vinil originalmi, o'yindagi holati haqida)</i>", { parse_mode: 'HTML' });
    }

    if (state.step === 'wizard_desc') {
      state.data.description = text;
      state.step = 'wizard_price';
      return ctx.reply("💰 Narxini kiriting:\n<i>(Masalan: 50 000 UZS, 10 USD, yoki 25 000 000 CPM)</i>", { parse_mode: 'HTML' });
    }

    if (state.step === 'wizard_price') {
      // Extract number and currency
      const numMatch = text.match(/[\d\s,.]+/);
      const cleanNum = numMatch ? parseFloat(numMatch[0].replace(/[\s,]/g, '')) : 0;

      let currency = 'UZS';
      if (/usd|\$/i.test(text)) currency = 'USD';
      if (/cpm/i.test(text)) currency = 'CPM';

      if (!cleanNum || cleanNum <= 0) {
        return ctx.reply("⚠️ Iltimos, narxni to'g'ri raqam ko'rinishida kiriting (masalan: 50000):");
      }

      state.data.price = cleanNum;
      state.data.currency = currency;
      state.step = 'wizard_tags';

      return ctx.reply("🏷️ Mashinangizga mos teglarni tanlang (bir nechta tanlashingiz mumkin):", keyboards.tagsMenu(state.data.tags));
    }
  });

  // Fetch bot info and launch polling
  bot.telegram.getMe().then((me) => {
    console.log(`🤖 [BOT] Telegram bot muvaffaqiyatli ishga tushdi: @${me.username} (${me.first_name})`);
  }).catch((err) => {
    console.error('❌ [BOT] Bot getMe error:', err.message);
  });

  bot.launch()
    .then(() => {
      console.log('🤖 [BOT] Polling muvaffaqiyatli boshlandi!');
    })
    .catch((err) => {
      console.error('❌ [BOT] Bot launch error:', err.message);
    });

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}

module.exports = { initBot };
