const locales = {
  uz: {
    welcome: `👋 Assalomu alaykum, <b>{name}</b>!\n\n🚗 <b>CPM Market</b> — Car Parking Multiplayer o'yinchilari uchun xavfsiz va kafolatlangan savdo maydonchasiga xush kelibsiz!\n\nBu yerda siz o'z avtomobillaringiz, noyob vinillar, tayyor drift/drag tyuninglar va akkauntlarni xavfsiz (escrow) vositachilik orqali sotishingiz va sotib olishingiz mumkin.`,
    choose_language: "🌐 Iltimos, tilni tanlang / Пожалуйста, выберите язык:",
    lang_saved: "✅ Til muvaffaqiyatli tanlandi: O'zbek tili",
    
    // Menu buttons
    btn_catalog: "🚗 E'lonlar katalogi",
    btn_sell: "➕ E'lon berish (Sotish)",
    btn_topup: "💎 O'yinga pul solish (Donat)",
    btn_my_deals: "🤝 Mening bitimlarim (Escrow)",
    btn_profile: "👤 Mening profilim",
    btn_wallet: "💳 Hamyon & Balans",
    btn_favorites: "❤️ Sevimlilar",
    btn_search: "🔍 Qidiruv",
    btn_help: "ℹ️ Yordam & Qoidalar",
    btn_lang: "🌐 Tilni o'zgartirish",
    
    // Profile
    profile_text: `👤 <b>Sizning profilingiz:</b>\n\n🆔 ID: <code>{id}</code>\n👤 Ism: <b>{name}</b>\n⭐ Reyting: <b>{rating} / 5.0</b> ({reviews_count} ta sharh)\n💼 Muvaffaqiyatli savdolar: <b>{deals_count} ta</b>\n🚗 Faol e'lonlaringiz: <b>{listings_count} ta</b>\n📅 Ro'yxatdan o'tgan sana: {created_at}\n\n🔗 <b>Referal havolangiz:</b>\n<code>https://t.me/{bot_username}?start=ref_{id}</code>\n<i>Do'stingizni taklif qiling va savdolarida bonuslarga ega bo'ling!</i>`,
    btn_my_listings: "📦 Mening e'lonlarim",
    
    // Help
    help_text: `🛡️ <b>CPM Market — Xavfsiz Savdo (Escrow) Qoidalari:</b>\n\n1. <b>E'lon berish:</b> Mashinangiz yoki itemingiz parametrlarini kiriting, rasm yuklang va e'lon bering.\n2. <b>Sotib olish:</b> Xaridor 'Sotib olish' tugmasini bosganda alohida Bitim (#ID) ochiladi.\n3. <b>To'lov:</b> Xaridor to'lovni yuboradi va 'To'lov qilindi' tugmasini bosadi.\n4. <b>Item uzatish:</b> Sotuvchi CPM o'yini ichida mashina yoki akkauntni xaridorga beradi va 'Mashina topshirildi' tugmasini bosadi.\n5. <b>Yakunlash:</b> Xaridor mahsulotni to'liq qabul qilib olgach 'Yakunlash' tugmasini bosadi. Savdo muvaffaqiyatli yopiladi va ikkala tomon bir-biriga baho qo'yadi.\n\n⚠️ <b>Nizo (Dispute):</b> Agar biror tomon aldamoqchi bo'lsa yoki muammo yuzaga kelsa, istalgan vaqt '⚠️ Nizo ochish' tugmasini bosing. Administratorlarimiz aralashib adolatli hal qiladi.\n\n📞 <b>Admin bilan aloqa:</b> @{support_username}`,
    
    // Wizard
    wizard_step1: "🚗 Qaysi kategoriyada e'lon bermoqchisiz? Quyidagi ro'yxatdan tanlang:",
    wizard_step2: "📝 Mashina yoki item nomini yozing:\n<i>(Masalan: BMW M8 F93 1695HP yoki Nissan GTR R35 Vinyl)</i>",
    wizard_step3: "📄 Batafsil tavsif kiriting:\n<i>(Masalan: Motor kuchi, maxsus tormoz, podveska, vinil chizmalari, o'yindagi ID va h.k.)</i>",
    wizard_step4: "💰 Narxini kiriting (faqat raqam yoki valyuta bilan):\n<i>(Masalan: 50 000 UZS, 10 USD, yoki 20 000 000 CPM o'yin puli)</i>",
    wizard_step5: "🏷️ Qo'shimcha teglarni tanlang yoki o'tkazib yuboring:",
    wizard_step6: "📸 Mashina yoki mahsulot rasmini yuboring (1 tadan 5 tagacha rasm yuborishingiz mumkin, rasm yuborib bo'lgach '✅ Rasmlarni tasdiqlash' tugmasini bosing):",
    wizard_confirm: `📋 <b>E'lon ma'lumotlarini tekshiring:</b>\n\n🚗 <b>Nomi:</b> {title}\n📂 <b>Kategoriya:</b> {category}\n💰 <b>Narxi:</b> {price} {currency}\n🏷️ <b>Teglar:</b> {tags}\n📄 <b>Tavsif:</b>\n{description}\n\nE'lonni chop etasizmi?`,
    wizard_published: "🎉 <b>Tabriklaymiz!</b> E'loningiz muvaffaqiyatli chop etildi va katalogga joylashtirildi.",
    wizard_cancelled: "❌ E'lon berish bekor qilindi.",

    // Catalog & Listing card
    listing_card: `🚗 <b>{title}</b> {vip_badge}\n📂 <b>Kategoriya:</b> {category}\n💰 <b>Narxi:</b> <b>{price} {currency}</b>\n🏷️ <b>Teglar:</b> {tags}\n\n📄 <b>Tavsif:</b>\n{description}\n\n👤 <b>Sotuvchi:</b> {seller_name} (@{seller_username})\n⭐ <b>Reyting:</b> {seller_rating} / 5.0 ({seller_deals} ta savdo)\n👁️ Ko'rishlar: {views}`,
    btn_buy: "🛒 Sotib olish (Escrow)",
    btn_fav_add: "❤️ Sevimlilarga qo'shish",
    btn_fav_remove: "💔 Sevimlilardan o'chirish",
    btn_contact_seller: "💬 Sotuvchiga yozish",
    empty_catalog: "Hozircha ushbu bo'limda faol e'lonlar mavjud emas.",
    
    // Search
    search_prompt: "🔍 Qidirmoqchi bo'lgan mashina, brend yoki item nomini yozing:",
    search_results: "🔍 '<b>{query}</b>' so'rovi bo'yicha topilgan natijalar:",
    
    // Deals
    deal_created: `🤝 <b>Yangi bitim ochildi!</b>\nBitim kodi: <b>#{deal_code}</b>\n\nMahsulot: <b>{title}</b>\nNarxi: <b>{price} {currency}</b>\nHolat: <b>To'lov kutilmoqda</b>`,
    deal_payment_sent: "✅ Xaridor to'lov yuborilganini tasdiqladi. Sotuvchi to'lovni tekshirib, mashinani topshirishi kutilmoqda.",
    deal_item_transferred: "🚗 Sotuvchi mashina/item topshirilganini tasdiqladi. Xaridor qabul qilganini tasdiqlashi kutilmoqda.",
    deal_completed: "🎉 Savdo muvaffaqiyatli yakunlandi! Rahmat.",
    deal_disputed: "⚠️ Ushbu bitim bo'yicha nizo ochildi. Moderator tez orada ko'rib chiqadi.",
    
    // Dispute prompt
    dispute_reason_prompt: "Iltimos, nizo sababini batafsil yozib yuboring (masalan: to'lov tushmadi, mashina berilmadi va h.k.):"
  },
  ru: {
    welcome: `👋 Здравствуйте, <b>{name}</b>!\n\n🚗 Добро пожаловать на <b>CPM Market</b> — безопасную торговую площадку для игроков Car Parking Multiplayer!\n\nЗдесь вы можете безопасно покупать и продавать свои автомобили, эксклюзивные винилы, тюнинг для дрифта/драга и аккаунты через гаранта (эскроу).`,
    choose_language: "🌐 Пожалуйста, выберите язык / Iltimos, tilni tanlang:",
    lang_saved: "✅ Выбран русский язык",

    // Menu buttons
    btn_catalog: "🚗 Каталог объявлений",
    btn_sell: "➕ Продать (Подать объявление)",
    btn_topup: "💎 Донат в игру (CPM Валюта)",
    btn_my_deals: "🤝 Мои сделки (Гарант)",
    btn_profile: "👤 Мой профиль",
    btn_wallet: "💳 Кошелек & Баланс",
    btn_favorites: "❤️ Избранное",
    btn_search: "🔍 Поиск",
    btn_help: "ℹ️ Помощь & Правила",
    btn_lang: "🌐 Сменить язык",

    // Profile
    profile_text: `👤 <b>Ваш профиль:</b>\n\n🆔 ID: <code>{id}</code>\n👤 Имя: <b>{name}</b>\n⭐ Рейтинг: <b>{rating} / 5.0</b> ({reviews_count} отзывов)\n💼 Успешных сделок: <b>{deals_count}</b>\n🚗 Активных объявлений: <b>{listings_count}</b>\n📅 Дата регистрации: {created_at}\n\n🔗 <b>Ваша реферальная ссылка:</b>\n<code>https://t.me/{bot_username}?start=ref_{id}</code>\n<i>Приглашайте друзей и получайте бонусы за их активность!</i>`,
    btn_my_listings: "📦 Мои объявления",

    // Help
    help_text: `🛡️ <b>Правила безопасной сделки (Escrow / Гарант):</b>\n\n1. <b>Создание объявления:</b> Укажите характеристики автомобиля, загрузите фото и опубликуйте.\n2. <b>Покупка:</b> Покупатель нажимает «Купить», открывается индивидуальная Сделка (#ID).\n3. <b>Оплата:</b> Покупатель переводит средства и нажимает кнопку «Оплачено».\n4. <b>Передача:</b> Продавец в игре CPM передает машину или данные и нажимает «Авто передано».\n5. <b>Завершение:</b> Покупатель проверяет и подтверждает получение. Сделка успешно закрывается, стороны оставляют отзывы.\n\n⚠️ <b>Спор:</b> Если возникли проблемы, нажмите «⚠️ Открыть спор». Модератор вмешается и справедливо решит вопрос.\n\n📞 <b>Связь с поддержкой:</b> @{support_username}`,

    // Wizard
    wizard_step1: "🚗 Выберите категорию для вашего объявления:",
    wizard_step2: "📝 Введите название автомобиля или товара:\n<i>(Например: BMW M8 F93 1695HP или Nissan GTR R35 Винил)</i>",
    wizard_step3: "📄 Введите подробное описание:\n<i>(Мощность, тормоза, подвеска, уникальность винила, ID в игре и т.д.)</i>",
    wizard_step4: "💰 Введите цену:\n<i>(Например: 50 000 UZS, 10 USD, или 20 000 000 игровой валюты CPM)</i>",
    wizard_step5: "🏷️ Выберите теги или пропустите этот шаг:",
    wizard_step6: "📸 Отправьте фото автомобиля (от 1 до 5 фото, после отправки нажмите '✅ Подтвердить фото'):",
    wizard_confirm: `📋 <b>Проверьте данные объявления:</b>\n\n🚗 <b>Название:</b> {title}\n📂 <b>Категория:</b> {category}\n💰 <b>Цена:</b> {price} {currency}\n🏷️ <b>Теги:</b> {tags}\n📄 <b>Описание:</b>\n{description}\n\nОпубликовать объявление?`,
    wizard_published: "🎉 <b>Поздравляем!</b> Ваше объявление успешно опубликовано в каталоге.",
    wizard_cancelled: "❌ Создание объявления отменено.",

    // Catalog & Listing card
    listing_card: `🚗 <b>{title}</b> {vip_badge}\n📂 <b>Категория:</b> {category}\n💰 <b>Цена:</b> <b>{price} {currency}</b>\n🏷️ <b>Теги:</b> {tags}\n\n📄 <b>Описание:</b>\n{description}\n\n👤 <b>Продавец:</b> {seller_name} (@{seller_username})\n⭐ <b>Рейтинг:</b> {seller_rating} / 5.0 ({seller_deals} сделок)\n👁️ Просмотров: {views}`,
    btn_buy: "🛒 Купить (Гарант)",
    btn_fav_add: "❤️ В избранное",
    btn_fav_remove: "💔 Удалить из избранного",
    btn_contact_seller: "💬 Написать продавцу",
    empty_catalog: "В этом разделе пока нет активных объявлений.",

    // Search
    search_prompt: "🔍 Введите название машины, бренда или товара для поиска:",
    search_results: "🔍 Результаты поиска по запросу '<b>{query}</b>':",

    // Deals
    deal_created: `🤝 <b>Открыта новая сделка!</b>\nКод: <b>#{deal_code}</b>\n\nТовар: <b>{title}</b>\nЦена: <b>{price} {currency}</b>\nСтатус: <b>Ожидание оплаты</b>`,
    deal_payment_sent: "✅ Покупатель подтвердил оплату. Продавцу необходимо проверить поступление и передать авто.",
    deal_item_transferred: "🚗 Продавец подтвердил передачу товара. Ожидается подтверждение покупателя.",
    deal_completed: "🎉 Сделка успешно завершена! Спасибо.",
    deal_disputed: "⚠️ По сделке открыт спор. Администратор скоро рассмотрит заявку.",

    // Dispute prompt
    dispute_reason_prompt: "Пожалуйста, опишите причину спора (например: оплата не поступила, товар не передан и т.д.):"
  }
};

function t(lang, key, params = {}) {
  const l = locales[lang] || locales['uz'];
  let text = l[key] || locales['uz'][key] || key;

  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }

  return text;
}

module.exports = { locales, t };
