

## План: 7 улучшений (пункты 5, 6, 8, 9, 11, 12, 13)

Все правки — в существующих файлах (`public/index.html`, `public/catalog.html`, `public/css/style.css`, `public/js/main.js` и страницах товаров `public/products/*/index.html`). React не трогаем.

---

### 1. Форма обратного звонка (в модалке «Написать»)

В `#writeModal` (внутри `public/index.html`, `catalog.html`, `about.html`, `contacts.html` и всех product‑страницах) добавить блок:

- Поля: «Имя», «Телефон» (валидация: имя 2–60 символов, телефон по маске `+7 (___) ___‑__‑__`).
- Кнопка «Перезвоним за 5 мин».
- Текст‑гарантия: «Не передаём номер третьим лицам».

Логика в `main.js → initCallbackForm()`:
- Маска телефона на `input`.
- При сабмите формирует сообщение `Заявка с сайта: <имя>, <телефон>` и открывает WhatsApp/Telegram (выбор кнопкой) либо отправляет на `mailto:` как fallback.
- Сохраняет последнюю заявку в `localStorage` (анти‑дубль 60 сек).
- Показывает toast «Заявка принята, перезвоним в течение 5 минут».

---

### 2. Skeleton‑заглушки каталога

В `public/css/style.css` добавить классы `.skeleton-card`, `.skeleton-shimmer` (анимация `@keyframes shimmer` — градиент пробегает слева направо).

В `main.js`:
- Перед `renderCatalogFromData()` вставлять 6 скелетонов в `#catalogDynamicPlaceholder`.
- В `initFilters()` при изменении фильтра — короткий fade‑out → скелетоны на 250 мс → fade‑in новых карточек. Создаёт ощущение «живой» загрузки без реальной задержки данных.

---

### 3. Квиз‑подбор прицепа (3 шага)

Новый блок на главной (`public/index.html`) после hero: секция `#quiz` с тремя экранами:
1. **Что возите?** — стройматериалы / лодка / квадроцикл / мото / бытовое.
2. **Машина?** — седан / кроссовер / внедорожник / грузовик.
3. **Бюджет?** — до 80 / 80–120 / 120+ тыс.

Логика в `main.js → initQuiz()`:
- Маппинг ответов → фильтр по `window.PRODUCTS_DATA` (по `type`, `capacity`, `price`).
- Результат: 2–3 карточки с кнопкой «Открыть» (вызывает существующий product preview modal).
- Прогресс‑бар сверху, кнопки «Назад/Далее», возможность пройти заново.

Стили — премиальные карточки‑опции с hover‑glow (как существующие кнопки).

---

### 4. FAQ‑аккордеон

Новая секция `#faq` на главной (перед footer) и на `catalog.html`.

Вопросы:
- Нужны ли права на прицеп?
- Какая гарантия?
- Регистрируется ли в ГИБДД?
- Можно ли в рассрочку?
- Доставка по области?
- Что входит в комплект?

Использовать существующий `<details>/<summary>` либо новые классы `.faq-item`, `.faq-q`, `.faq-a` с CSS‑анимацией высоты. JS не нужен (нативный `<details>` + плавность через CSS `grid-template-rows: 0fr → 1fr`).

---

### 5. OG‑теги для каждого товара

В каждом `public/products/*/index.html` в `<head>` добавить:
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://.../products/<slug>/images/cover.jpg">
<meta property="og:type" content="product">
<meta property="og:url" content="...">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="...">
<meta name="twitter:title" content="...">
```

Значения брать из существующих `<title>` и `window.PRODUCTS_DATA[slug]`. Для черновиков (`product-05`…`product-40`) — пропустить (там `noindex`).

---

### 6. Кнопка «Поделиться» (Web Share API)

На каждой странице товара рядом с «Позвонить/Написать» — кнопка с иконкой share.

В `main.js → initShareButton()`:
```js
if (navigator.share) {
  navigator.share({ title, text, url: location.href });
} else {
  navigator.clipboard.writeText(location.href);
  // toast «Ссылка скопирована»
}
```

Также добавить кнопку share в product preview modal (через AJAX‑превью).

---

### 7. Lazy‑load + blur‑up

Для всех `<img>` в каталоге и галереях:
- Добавить `loading="lazy"` и `decoding="async"`.
- Класс `.blur-up`: изначально `filter: blur(14px); transform: scale(1.04); opacity: 0.6`.
- В `main.js → initBlurUp()` подписаться на `img.onload` → плавно убрать blur за 400 мс.
- Фон контейнера — уже подготовленный градиент (есть в CSS), так что «дыр» при загрузке не будет.

WebP‑конвертация и сжатие (пункт 14) — отдельной задачей, нужен запуск скрипта `cwebp` по всем `public/products/*/images/*.{jpg,png}`. Сделаю **после одобрения этого плана** — это исполняемая часть, требующая default mode.

---

### Технические детали

**Файлы:**
- `public/css/style.css` — +~250 строк (skeleton, quiz, faq, blur‑up, callback form, share btn).
- `public/js/main.js` — +5 функций: `initCallbackForm`, `initQuiz`, `initShareButton`, `initBlurUp`, `showSkeletons`. Все вызываются из существующего общего `init()` в конце файла.
- `public/index.html`, `public/catalog.html` — добавить разметку секций quiz и faq, поля в `#writeModal`.
- `public/products/*/index.html` (активные: kama-1, kama-lite-250x130, sputnik-250x127, skif-185x121) — OG‑мета + кнопка share + поля в `#writeModal`.
- `public/js/products-data.js` — без изменений (квиз и OG читают существующие поля).

**Совместимость:** всё на чистом HTML/CSS/JS, без новых зависимостей. Темы (dark/light) поддерживаются через существующие CSS‑переменные.

**Порядок реализации:** сначала skeleton + blur‑up + callback (быстрая ощутимая польза), затем quiz + FAQ (контент), затем OG + share (SEO/распространение), в конце — WebP оптимизация изображений.

