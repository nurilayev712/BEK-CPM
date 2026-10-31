const { Markup } = require('telegraf');
const { t } = require('./locales');
const db = require('../config/db');

const keyboards = {
  // Main Menu Reply Keyboard
  mainMenu(lang = 'uz') {
    return Markup.keyboard([
      [t(lang, 'btn_catalog'), t(lang, 'btn_sell')],
      [t(lang, 'btn_topup')],
      [t(lang, 'btn_my_deals'), t(lang, 'btn_profile')],
      [t(lang, 'btn_wallet'), t(lang, 'btn_favorites')],
      [t(lang, 'btn_search'), t(lang, 'btn_help')],
      [t(lang, 'btn_lang')]
    ]).resize();
  },

  // Language selection
  languageSelect() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇿 O'zbek tili", 'set_lang_uz'),
        Markup.button.callback("🇷🇺 Русский язык", 'set_lang_ru')
      ]
    ]);
  },

  // Category select keyboard (Inline)
  categoriesMenu(lang = 'uz', actionPrefix = 'cat') {
    const categories = db.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC');
    const buttons = categories.map(c => [
      Markup.button.callback(`${c.icon} ${lang === 'ru' ? c.name_ru : c.name_uz}`, `${actionPrefix}_${c.id}`)
    ]);
    return Markup.inlineKeyboard(buttons);
  },

  // Tags selection keyboard
  tagsMenu(selectedTags = []) {
    const availableTags = [
      { id: 'tuning', label: '⚡ Max Tuning' },
      { id: 'stock', label: '🚗 Stock (Zavod)' },
      { id: 'vinyl', label: '🎨 Art Vinyl' },
      { id: 'rare', label: '💎 Rare (Noyob)' },
      { id: 'drift', label: '💨 Drift Setup' },
      { id: 'w16', label: '🔥 W16 Motor' },
      { id: 'chrome', label: '✨ Chrome' }
    ];

    const rows = [];
    for (let i = 0; i < availableTags.length; i += 2) {
      const row = [];
      const tag1 = availableTags[i];
      const isSelected1 = selectedTags.includes(tag1.id);
      row.push(Markup.button.callback(`${isSelected1 ? '✅ ' : ''}${tag1.label}`, `tag_${tag1.id}`));

      if (availableTags[i + 1]) {
        const tag2 = availableTags[i + 1];
        const isSelected2 = selectedTags.includes(tag2.id);
        row.push(Markup.button.callback(`${isSelected2 ? '✅ ' : ''}${tag2.label}`, `tag_${tag2.id}`));
      }
      rows.push(row);
    }

    rows.push([Markup.button.callback('➡️ Davom etish', 'tags_done')]);
    return Markup.inlineKeyboard(rows);
  },

  // Wizard Confirmation
  wizardConfirm() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Ha, chop etish", "wizard_confirm_yes"),
        Markup.button.callback("⭐ VIP sifatida chop etish", "wizard_confirm_vip")
      ],
      [
        Markup.button.callback("❌ Bekor qilish", "wizard_confirm_cancel")
      ]
    ]);
  },

  // Listing pagination and action keyboard
  listingCard(listing, currentIndex, totalCount, isFavorite = false, lang = 'uz') {
    const buttons = [];

    // Buy & Favorite row
    buttons.push([
      Markup.button.callback(t(lang, 'btn_buy'), `buy_${listing.id}`),
      Markup.button.callback(
        isFavorite ? t(lang, 'btn_fav_remove') : t(lang, 'btn_fav_add'),
        `fav_${listing.id}`
      )
    ]);

    // Contact seller button
    if (listing.seller_username) {
      buttons.push([
        Markup.button.url(t(lang, 'btn_contact_seller'), `https://t.me/${listing.seller_username}`)
      ]);
    }

    // Navigation row
    const navRow = [];
    if (currentIndex > 0) {
      navRow.push(Markup.button.callback('⬅️ Oldingi', `list_nav_${listing.category_id}_${currentIndex - 1}`));
    }
    navRow.push(Markup.button.callback(`📄 ${currentIndex + 1} / ${totalCount}`, 'noop'));
    if (currentIndex < totalCount - 1) {
      navRow.push(Markup.button.callback('Keyingi ➡️', `list_nav_${listing.category_id}_${currentIndex + 1}`));
    }
    buttons.push(navRow);

    // Back to categories
    buttons.push([
      Markup.button.callback('🔙 Barcha kategoriyalar', 'back_to_categories')
    ]);

    return Markup.inlineKeyboard(buttons);
  },

  // Deal action keyboard
  dealActions(deal, currentUserId) {
    const buttons = [];

    if (deal.status === 'pending') {
      if (deal.buyer_id === currentUserId) {
        buttons.push([Markup.button.callback("💳 To'lov yuborildi", `deal_pay_${deal.id}`)]);
      }
      buttons.push([Markup.button.callback("⚠️ Nizo ochish", `deal_dispute_${deal.id}`)]);
    } else if (deal.status === 'payment_sent') {
      if (deal.seller_id === currentUserId) {
        buttons.push([Markup.button.callback("🚗 Mashina topshirildi", `deal_transfer_${deal.id}`)]);
      }
      buttons.push([Markup.button.callback("⚠️ Nizo ochish", `deal_dispute_${deal.id}`)]);
    } else if (deal.status === 'item_transferred') {
      if (deal.buyer_id === currentUserId) {
        buttons.push([Markup.button.callback("✅ Qabul qildim (Savdoni yakunlash)", `deal_complete_${deal.id}`)]);
      }
      buttons.push([Markup.button.callback("⚠️ Nizo ochish", `deal_dispute_${deal.id}`)]);
    } else if (deal.status === 'completed') {
      // Check if user already reviewed
      const existingReview = db.get('SELECT id FROM ratings WHERE deal_id = ? AND from_user_id = ?', [deal.id, currentUserId]);
      if (!existingReview) {
        buttons.push([Markup.button.callback("⭐ Baholash va sharh qoldirish", `rate_${deal.id}`)]);
      }
    }

    return Markup.inlineKeyboard(buttons);
  },

  // Rating stars keyboard
  ratingStars(dealId) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('⭐ 1', `score_${dealId}_1`),
        Markup.button.callback('⭐ 2', `score_${dealId}_2`),
        Markup.button.callback('⭐ 3', `score_${dealId}_3`),
        Markup.button.callback('⭐ 4', `score_${dealId}_4`),
        Markup.button.callback('⭐ 5', `score_${dealId}_5`)
      ]
    ]);
  },

  // CPM Game Topup / Donat Services Keyboard
  topupServicesMenu(lang = 'uz') {
    const services = db.query('SELECT * FROM topup_services WHERE is_active = 1 ORDER BY sort_order ASC');
    const buttons = services.map(s => [
      Markup.button.callback(
        `${s.badge ? `[${s.badge}] ` : ''}${lang === 'ru' ? s.title_ru : s.title_uz} — ${s.price.toLocaleString()} ${s.currency}`,
        `topup_select_${s.id}`
      )
    ]);
    buttons.push([Markup.button.callback('🔙 Asosiy menyu', 'topup_cancel')]);
    return Markup.inlineKeyboard(buttons);
  },

  // Topup Payment Methods
  topupPaymentConfirm() {
    return Markup.inlineKeyboard([
      [Markup.button.callback("✅ To'lov qildim, chek yuborish", "topup_paid_receipt")],
      [Markup.button.callback("❌ Bekor qilish", "topup_cancel")]
    ]);
  }
};

module.exports = keyboards;
