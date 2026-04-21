Быстрый шаблон нового товара

Что уже есть:
- js/products-data.js — общий список всех товаров
- products/_NEW_PRODUCT_TEMPLATE/ — готовый шаблон папки нового товара
- product-05 ... product-40 — пустые слоты, скрытые из каталога

Как быстро добавить новый товар:
1. Скопируйте папку products/_NEW_PRODUCT_TEMPLATE/
2. Переименуйте её, например в products/krepysh-250x130/
3. Положите фото в папку images/
4. Откройте js/products-data.js
5. Найдите нужный черновик, например slug: "product-05"
6. Замените данные на реальные и поставьте active: true

Товар появится в каталоге только если одновременно:
- active: true
- есть title
- цена price больше 0
- есть хотя бы одна картинка в images[]

Шаблон блока данных лежит тут:
- products/_NEW_PRODUCT_TEMPLATE/PRODUCT_DATA_TEMPLATE.txt

Подсказка:
проще всего брать один из уже готовых товаров в js/products-data.js,
копировать его блок и менять только slug, title, price, images, description, specs.
