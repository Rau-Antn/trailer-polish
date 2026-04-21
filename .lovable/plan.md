

## План: чиним модалку «Написать» + наводим порядок

По скринам видно: главная и «О компании» **уже изменены правильно** (нет блока «Каталог», FAQ переехал, премиальная шапка контактов внизу). Если на ваших скринах главной нет изменений — это кеш браузера (Ctrl+Shift+R обновит).

Реальная проблема одна: **модалка «Написать» переполнена** — callback-форма + 4 мессенджера не помещаются по высоте, заголовок «Куда написать?» обрезается сверху.

---

### 1. Компактная модалка «Написать»

Файл: `public/css/style.css`

- `.write-modal-box` — добавить `max-height: 92vh` и `overflow-y: auto` со стилизованным скроллом (тонкая полоска).
- Уменьшить внутренние отступы: `padding: 20px` (было 24), `border-radius: 24px`.
- `.write-head h3` — `font-size: 22px` (было 28), убрать «eyebrow» из верха (избыточный текст).
- `.callback-form` — `padding: 14px`, `gap: 10px`, заголовок `cb-title` до 14px, кнопка `cb-submit` компактнее (`padding: 11px 16px`).
- `.write-options` — `gap: 8px`, `.write-option` высотой 56px (вместо ~72), иконка 36×36, описание в одну строку.
- На мобилке (`max-width: 540px`) — модалка занимает почти весь экран, форма и кнопки растягиваются на всю ширину.

Итого: всё умещается в одно окно без скролла на десктопе и с лёгким скроллом на телефоне.

### 2. Убрать дубль «eyebrow» в шапке модалки

Файлы: `public/index.html`, `public/catalog.html`, `public/about.html`, `public/contacts.html`, `public/products/kama-1/index.html`, `public/products/kama-lite-250x130/index.html`, `public/products/skif-185x121/index.html`, `public/products/sputnik-250x127/index.html`, `public/products/_NEW_PRODUCT_TEMPLATE/index.html`.

В блоке `#writeModal` удалить строку `<div class="eyebrow">Выберите удобный способ связи</div>` — текст дублирует подзаголовок и съедает место.

### 3. Подсказка по кешу

После правок попрошу один раз нажать **Ctrl+Shift+R** в превью — иначе вы продолжите видеть старую версию index.html и думать, что ничего не поменялось.

---

### Технические детали

- Никаких изменений в JS — `initCallbackForm` и `initWriteModal` работают как есть.
- Проверю что `.callback-form` и `.write-options` корректно скроллятся внутри `.write-modal-box` (overflow только на боксе, а не на самом overlay — иначе сломается `backdrop-filter`).
- Светлая тема — добавлю стили скроллбара через `body.light-theme .write-modal-box::-webkit-scrollbar-thumb`.
- Затрагиваемые файлы: `public/css/style.css` (~40 строк) + 9 HTML-файлов (1 строка удаления в каждом).

