

## План: один wrapper для всех слоёв света фар

### Проблема
Сейчас `.headlight-core`, `.headlight-glow` и `.headlight-beam` — три **отдельных** absolute-элемента, каждый со своими `left/top/transform`. На разных ширинах и зуме браузер по-своему округляет проценты для каждого слоя → они расходятся на 1–3px, свет «дробится».

### Решение: общий якорь
Все три слоя кладу в один контейнер `.headlight-anchor`, привязанный к точке фары **один раз**. Внутри контейнера слои позиционируются относительно него (`left:0; top:0`), а не относительно лого. Браузер считает координаты якоря один раз — слои не могут разойтись.

### Изменения

**HTML** (`public/index.html`, `catalog.html`, `about.html`, `contacts.html` + 5 страниц товаров с лого) — внутри `.logo-wrap`:

```html
<!-- было: 3 независимых элемента -->
<span class="headlight-core"></span>
<span class="headlight-glow"></span>
<span class="headlight-beam"></span>

<!-- стало: один якорь + 3 слоя внутри -->
<span class="headlight-anchor" aria-hidden="true">
  <span class="headlight-core"></span>
  <span class="headlight-glow"></span>
  <span class="headlight-beam"></span>
</span>
```

**CSS** (`public/css/style.css`, блок ~2120–2135):

```css
.logo-wrap { position: relative; }

/* Единственная точка привязки к фаре машины на лого */
.headlight-anchor {
  position: absolute;
  left: 18%;          /* X фары */
  top: 45%;           /* Y фары */
  width: 0; height: 0;
  transform-origin: 0 0;
  pointer-events: none;
  will-change: transform;
}

/* Все слои теперь относительно якоря, без процентов от лого */
.headlight-core,
.headlight-glow,
.headlight-beam {
  position: absolute;
  left: 0; top: 0;
  pointer-events: none;
}

.headlight-core  { width: 14px;  height: 14px;  margin: -7px 0 0 -7px;  /* центрируем */ }
.headlight-glow  { width: 64px;  height: 64px;  margin: -32px 0 0 -32px; }
.headlight-beam  {
  width: 260px; height: 90px;
  margin: -45px 0 0 0;            /* выходит вправо из точки */
  transform-origin: 0 50%;
  transform: rotate(-4deg);
  clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 60%);
}
```

**Починка анимаций** — переписать `@keyframes headlightCore/Glow/Beam` одним валидным блоком с синхронной длительностью **4.2s** и общей задержкой, чтобы три слоя мигали вместе:

```css
@keyframes headlightFlash {
  0%, 100% { opacity: 0; }
  20%      { opacity: .35; }
  35%      { opacity: 1; }
  55%      { opacity: .4; }
  70%      { opacity: .9; }
  85%      { opacity: .2; }
}
.headlight-core, .headlight-glow, .headlight-beam {
  animation: headlightFlash 4.2s ease-in-out infinite;
}
```

(индивидуальные `opacity`-множители оставлю через `filter: brightness()` если нужно акцент, но общий ритм один).

### Адаптив
Якорь на процентах (`18% / 45%`) масштабируется с лого автоматически. Слои внутри — в **пикселях**, поэтому на мобиле через `@media (max-width: 640px)` уменьшу их `width/height/margin` пропорционально (примерно ×0.6).

### Проверка
Открою preview на 855×535 и сделаю скриншот в момент пика яркости. Проверю что:
1. Core, glow, beam — в одной точке, никакого «расщепления».
2. При зуме браузера 75 / 100 / 150% слои не разъезжаются.
3. На мобильной ширине (≤640px) свет на месте, размер пропорциональный.
4. Все слои мигают синхронно (одна анимация).

### Затрагиваемые файлы
- `public/css/style.css` — переписать блок `.headlight-*` + keyframes (~40 строк).
- 9 HTML с лого — обернуть три `<span>` в `.headlight-anchor`.

