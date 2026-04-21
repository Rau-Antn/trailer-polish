

## План: 3 точечных правки

### 1. Фото в карточках каталога — убрать наложение
`public/css/style.css`, блок `.gallery img`:
- Принудительно `opacity: 0 !important` для всех изображений галереи.
- `.gallery img.active { opacity: 1 !important }` — видна только активная.
- Сохранить плавный `transition: opacity .35s ease`.

### 2. FAQ — только на странице «О компании»
- `public/catalog.html`: удалить секцию `<section class="faq-section" id="faq">…</section>` целиком (если ещё осталась).
- `public/index.html`: убедиться что FAQ удалён.
- `public/about.html`: FAQ остаётся, добавить отступ сверху (`padding-top: 90px; scroll-margin-top: 80px`), чтобы заголовок не подлезал под шапку.

### 3. Модалка «Написать» — 2 колонки, без ползунка, без лишнего текста

**CSS** (`public/css/style.css`):
- `.write-modal-box` — расширить до `max-width: 760px`, убрать `overflow-y: auto` и `max-height` (никакого скролла).
- Контент в 2 колонки на десктопе: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`.
  - Левая колонка — мессенджеры (`.write-options`).
  - Правая колонка — форма «Жду звонка» (`.callback-form`).
- На мобилке (`max-width: 720px`) — обратно в одну колонку.
- Крестик закрытия — `position: absolute; top: 10px; right: 10px`.
- Компактнее: `.write-option { min-height: 52px }`, `.callback-form { padding: 14px; gap: 10px }`.

**HTML** (9 файлов: `index.html`, `catalog.html`, `about.html`, `contacts.html`, `products/kama-1/index.html`, `products/kama-lite-250x130/index.html`, `products/skif-185x121/index.html`, `products/sputnik-250x127/index.html`, `products/_NEW_PRODUCT_TEMPLATE/index.html`):
- Удалить из `#writeModal` строку с текстом «Откроется выбранный мессенджер или почта».
- Обернуть `.write-options` и `.callback-form` в общий контейнер с grid-раскладкой.

---

### Технические детали
- Файлы: `public/css/style.css` (~50 строк), `public/catalog.html` (удалить FAQ если есть), 9 HTML с модалкой (удалить лишний текст + добавить grid-обёртку).
- JS не трогаю — `initCallbackForm` и `initWriteModal` работают как есть.
- После правок открою preview в браузере на вьюпорте 855×535 и сделаю скриншоты:
  1. Каталога — убедиться что в карточке одно фото.
  2. About — FAQ виден полностью, заголовок не обрезан.
  3. Модалки «Написать» — 2 колонки, без ползунка, без фразы про мессенджер/почту.
- Если хоть один баг останется — фикшу в том же раунде.

