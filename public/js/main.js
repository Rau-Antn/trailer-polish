(() => {
  const body = document.body;

  const attachSwipe = (element, onPrev, onNext) => {
    if (!element) return;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let tracking = false;

    const onStart = e => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      deltaX = 0;
      tracking = true;
      element.classList.add('is-swiping');
    };
    const onMove = e => {
      if (!tracking) return;
      const t = e.touches?.[0];
      if (!t) return;
      deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;
      if (Math.abs(deltaX) > Math.abs(deltaY)) e.preventDefault();
    };
    const onEnd = () => {
      if (!tracking) return;
      element.classList.remove('is-swiping');
      if (Math.abs(deltaX) > 40) {
        if (deltaX > 0) onPrev();
        else onNext();
      }
      tracking = false;
      deltaX = 0;
    };

    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchmove', onMove, { passive: false });
    element.addEventListener('touchend', onEnd, { passive: true });
    element.addEventListener('touchcancel', onEnd, { passive: true });
  };

  const setBodyLocked = locked => {
    body.style.overflow = locked ? 'hidden' : '';
  };

  const syncBodyLockState = () => {
    const hasOpenModal = [
      document.getElementById('siteGalleryModal')?.classList.contains('open'),
      document.getElementById('callModal')?.classList.contains('open'),
      document.getElementById('writeModal')?.classList.contains('open'),
      document.getElementById('productPreviewModal')?.classList.contains('open')
    ].some(Boolean);
    setBodyLocked(hasOpenModal);
  };

  // Shared modal for gallery fullscreen
  let galleryModal = document.getElementById('siteGalleryModal');
  if (!galleryModal) {
    const modalHtml = `
      <div class="modal" id="siteGalleryModal">
        <div class="modal-box">
          <button aria-label="Закрыть" class="modal-close" type="button">×</button>
          <button aria-label="Предыдущее фото" class="modal-prev" type="button">‹</button>
          <button aria-label="Следующее фото" class="modal-next" type="button">›</button>
          <div class="modal-stage"></div>
          <div class="modal-counter"></div>
        </div>
      </div>`;
    body.insertAdjacentHTML('beforeend', modalHtml);
    galleryModal = document.getElementById('siteGalleryModal');
  }

  let galleryModalImages = [];
  let galleryModalIndex = 0;
  const galleryModalStage = galleryModal.querySelector('.modal-stage');
  const galleryModalCounter = galleryModal.querySelector('.modal-counter');

  const renderGalleryModal = () => {
    galleryModalStage.innerHTML = '';
    galleryModalImages.forEach((item, i) => {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.className = i === galleryModalIndex ? 'active' : '';
      img.decoding = 'async';
      if (i !== galleryModalIndex) img.loading = 'lazy';
      galleryModalStage.appendChild(img);
    });
    galleryModalCounter.textContent = `${galleryModalIndex + 1} / ${galleryModalImages.length}`;
  };

  const closeGalleryModal = () => {
    galleryModal.classList.remove('open');
    syncBodyLockState();
  };
  const shiftGalleryModal = delta => {
    if (!galleryModalImages.length) return;
    galleryModalIndex = (galleryModalIndex + delta + galleryModalImages.length) % galleryModalImages.length;
    renderGalleryModal();
  };

  window.openGalleryModal = (images, startIndex = 0) => {
    galleryModalImages = images;
    galleryModalIndex = startIndex;
    renderGalleryModal();
    galleryModal.classList.add('open');
    syncBodyLockState();
  };

  galleryModal.querySelector('.modal-close')?.addEventListener('click', closeGalleryModal);
  galleryModal.querySelector('.modal-prev')?.addEventListener('click', () => shiftGalleryModal(-1));
  galleryModal.querySelector('.modal-next')?.addEventListener('click', () => shiftGalleryModal(1));
  galleryModal.addEventListener('click', e => { if (e.target === galleryModal) closeGalleryModal(); });
  attachSwipe(galleryModalStage, () => shiftGalleryModal(-1), () => shiftGalleryModal(1));

  document.addEventListener('keydown', e => {
    if (galleryModal.classList.contains('open')) {
      if (e.key === 'Escape') closeGalleryModal();
      if (e.key === 'ArrowLeft') shiftGalleryModal(-1);
      if (e.key === 'ArrowRight') shiftGalleryModal(1);
    }
  });

  const initGalleries = (root = document) => {
    root.querySelectorAll('.gallery').forEach(gallery => {
      if (gallery.dataset.galleryReady === '1') return;
      gallery.dataset.galleryReady = '1';

      const images = Array.from(gallery.querySelectorAll('img'));
      if (!images.length) return;
      let index = images.findIndex(img => img.classList.contains('active'));
      if (index < 0) index = 0;

      const show = nextIndex => {
        index = (nextIndex + images.length) % images.length;
        images.forEach((img, i) => img.classList.toggle('active', i === index));
      };

      gallery.querySelector('.prev')?.addEventListener('click', () => show(index - 1));
      gallery.querySelector('.next')?.addEventListener('click', () => show(index + 1));

      const stage = gallery.querySelector('.gallery-stage');
      if (stage) {
        stage.addEventListener('click', () => {
          openGalleryModal(images.map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') || '' })), index);
        });
        stage.style.cursor = 'zoom-in';
        attachSwipe(stage, () => show(index - 1), () => show(index + 1));
      }
    });
  };

  const initTabs = (root = document) => {
    root.querySelectorAll('.tabs').forEach(tabs => {
      if (tabs.dataset.tabsReady === '1') return;
      tabs.dataset.tabsReady = '1';

      const buttons = tabs.querySelectorAll('.tab-btn');
      const contents = tabs.querySelectorAll('.tab-content');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          tabs.querySelector(`[data-content="${btn.dataset.tab}"]`)?.classList.add('active');
        });
      });
    });
  };

  const initCallModal = (root = document) => {
    const callModal = document.getElementById('callModal');
    if (!callModal) return;

    const closeCall = () => {
      callModal.classList.remove('open');
      syncBodyLockState();
    };
    if (!callModal.dataset.modalReady) {
      callModal.dataset.modalReady = '1';
      callModal.querySelector('.call-close')?.addEventListener('click', closeCall);
      callModal.addEventListener('click', e => { if (e.target === callModal) closeCall(); });
    }

    root.querySelectorAll('.open-call-modal').forEach(btn => {
      if (btn.dataset.callReady === '1') return;
      btn.dataset.callReady = '1';
      btn.addEventListener('click', () => {
        callModal.classList.add('open');
        syncBodyLockState();
      });
    });
  };

  const initWriteModal = (root = document) => {
    const writeModal = document.getElementById('writeModal');
    if (!writeModal) return;

    const closeWrite = () => {
      writeModal.classList.remove('open');
      syncBodyLockState();
    };
    if (!writeModal.dataset.modalReady) {
      writeModal.dataset.modalReady = '1';
      writeModal.querySelector('.write-close')?.addEventListener('click', closeWrite);
      writeModal.addEventListener('click', e => { if (e.target === writeModal) closeWrite(); });
    }

    root.querySelectorAll('.open-write-modal').forEach(btn => {
      if (btn.dataset.writeReady === '1') return;
      btn.dataset.writeReady = '1';
      btn.addEventListener('click', () => {
        const previewModal = document.getElementById('productPreviewModal');
        if (previewModal?.classList.contains('open') && btn.closest('#productPreviewModal')) {
          previewModal.classList.remove('open', 'is-loading');
          previewModal.setAttribute('aria-hidden', 'true');
          previewModal.querySelector('.product-preview-body')?.replaceChildren();
        }
        writeModal.classList.add('open');
        syncBodyLockState();
      });
    });
  };

  const initCopyNumber = (root = document) => {
    const buttons = Array.from(root.querySelectorAll('.copy-number'));
    const copyToast = document.getElementById('copyToast');
    if (!buttons.length) return;

    buttons.forEach(copyBtn => {
      if (copyBtn.dataset.copyReady === '1') return;
      copyBtn.dataset.copyReady = '1';
      copyBtn.addEventListener('click', async function(){
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText('89131474624');
          } else {
            const helper = document.createElement('textarea');
            helper.value = '89131474624';
            helper.setAttribute('readonly', '');
            helper.style.position = 'fixed';
            helper.style.opacity = '0';
            document.body.appendChild(helper);
            helper.select();
            document.execCommand('copy');
            helper.remove();
          }
          copyBtn.textContent = 'Скопировано ✓';
          copyBtn.classList.add('copied');
          copyToast?.classList.add('show');
          setTimeout(() => copyToast?.classList.remove('show'), 1800);
          setTimeout(() => {
            copyBtn.textContent = 'Скопировать номер';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch {
          copyBtn.textContent = 'Не удалось скопировать';
          setTimeout(() => {
            copyBtn.textContent = 'Скопировать номер';
          }, 2000);
        }
      });
    });
  };


  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatCatalogPrice = value => new Intl.NumberFormat('ru-RU').format(Number(value || 0)) + ' ₽';

  const canShowProduct = product => {
    if (!product || product.active !== true) return false;
    const hasTitle = typeof product.title === 'string' && product.title.trim().length > 0;
    const hasPrice = Number(product.price) > 0;
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    return hasTitle && hasPrice && hasImages;
  };

  const removeCatalogPlaceholder = () => {
    const ph = document.getElementById('catalogDynamicPlaceholder');
    if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
  };

  const renderCatalogFromData = () => {
    const catalog = document.querySelector('main.catalog');
    if (!catalog) return;
    // Не запускать рендер на страницах товара и не затирать готовую карточку
    if (document.body.classList.contains('product-page')) return;
    if (catalog.querySelector(':scope > .item')) return;
    const data = Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA : null;
    if (catalog.dataset.catalogRendered === '1') return;

    if (!data) {
      removeCatalogPlaceholder();
      catalog.innerHTML = '<div class="catalog-empty-state">Не удалось загрузить каталог. Обновите страницу или свяжитесь с нами.</div>';
      return;
    }
    catalog.dataset.catalogRendered = '1';

    const visibleProducts = data.filter(canShowProduct);
    if (!visibleProducts.length) {
      removeCatalogPlaceholder();
      catalog.innerHTML = '<div class="catalog-empty-state">В каталоге пока нет активных товаров.</div>';
      return;
    }

    const html = visibleProducts.map(product => {
      const galleryImages = product.images.map((innerSrc, innerIndex) =>
        `    <img alt="${escapeHtml((product.title || 'Товар') + ' ' + (innerIndex + 1))}" ${innerIndex === 0 ? 'class="active" ' : ''}src="${escapeHtml(innerSrc)}" ${innerIndex === 0 ? 'decoding="async" fetchpriority="high"' : 'loading="lazy" decoding="async" fetchpriority="low"'}/>`
      ).join('\n');
      const images = `
<div class="gallery">
  <div class="gallery-stage">
${galleryImages}
  </div>
  <button class="prev" type="button">‹</button>
  <button class="next" type="button">›</button>
</div>`.trim();
      const badges = (product.badges || []).map((badge, index) => `<div class="badge${index === (product.badges || []).length - 1 && /в наличии/i.test(badge) ? ' badge-stock' : ''}">${escapeHtml(badge)}</div>`).join('');
      const description = escapeHtml(product.description || '').replace(/\n/g, '<br/>');
      const specs = (product.specs || []).map(spec => `<div class="spec-row"><span>${escapeHtml(spec.label)}</span><strong>${escapeHtml(spec.value)}</strong></div>`).join('');
      // Поисковая строка для фильтра по тексту
      const searchParts = [product.title, product.type, product.length, product.axles, product.capacity, product.description, product.stockNote, product.slug];
      if (Array.isArray(product.badges)) searchParts.push(product.badges.join(' '));
      if (Array.isArray(product.specs)) product.specs.forEach(s => { searchParts.push(s.label); searchParts.push(s.value); });
      const searchBlob = searchParts.filter(Boolean).join(' ').toLowerCase().replace(/ё/g, 'е');
      return `<div class="item" data-axles="${escapeHtml(product.axles || '')}" data-capacity="${escapeHtml(product.capacity || '')}" data-length="${escapeHtml(product.length || '')}" data-price="${Number(product.price || 0)}" data-type="${escapeHtml(product.type || '')}" data-search="${escapeHtml(searchBlob)}">
${images}
<div class="info">
  <div class="badges">${badges}</div>
  <h2>${escapeHtml(product.title || '')}</h2>
  <div class="price-row">
    <div class="price"><small>Цена</small><strong>${escapeHtml(formatCatalogPrice(product.price || 0))}</strong></div>
    <div class="stock-note">${escapeHtml(product.stockNote || '')}</div>
  </div>
  <div class="cta-row">
    <a class="cta cta-availability open-product-modal" href="products/${escapeHtml(product.slug)}/"><span>Смотреть карточку</span></a>
    <button class="cta cta-call open-call-modal" type="button"><span>Позвонить</span></button>
    <button class="cta cta-write open-write-modal" type="button"><span>Написать</span></button>
  </div>
  <div class="tabs">
    <div class="tabs-head"><button class="tab-btn active" data-tab="desc" type="button">Описание</button><button class="tab-btn" data-tab="specs" type="button">Основные характеристики</button></div>
    <div class="tabs-content">
      <div class="tab-content active" data-content="desc"><div class="desc-box"><p>${description}</p></div></div>
      <div class="tab-content" data-content="specs"><div class="spec-box">${specs}</div></div>
    </div>
  </div>
</div>
</div>`;
    }).join('');

    removeCatalogPlaceholder();
    catalog.innerHTML = html;
  };


  const initFilters = () => {
    const catalog = document.querySelector('main.catalog');
    const items = catalog ? Array.from(catalog.querySelectorAll('.item')) : [];
    const typeChecks = Array.from(document.querySelectorAll('input[name="type"]'));
    const lengthFilter = document.getElementById('lengthFilter');
    const axlesFilter = document.getElementById('axlesFilter');
    const capacityFilter = document.getElementById('capacityFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = document.getElementById('priceValue');
    const sortFilter = document.getElementById('sortFilter');
    const resetBtn = document.getElementById('resetFilters');
    const filterCount = document.getElementById('filterCount');
    const catalogFound = document.getElementById('catalogFound');
    const filterToggle = document.getElementById('catalogFilterToggle');
    const filterBadge = document.getElementById('catalogFilterBadge');
    const filterPanel = document.getElementById('filters');
    const applyBtn = document.getElementById('applyFilters');
    const collapseLink = document.getElementById('collapseFilters');
    const searchInput = document.getElementById('catalogSearchInput');
    const searchClear = document.getElementById('catalogSearchClear');

    if (!catalog || !items.length || !typeChecks.length || !priceFilter) return;
    if (catalog.dataset.filtersReady === '1') return;
    catalog.dataset.filtersReady = '1';

    const PRICE_MAX = Number(priceFilter.max || 500000);
    const fmtPrice = (v) => new Intl.NumberFormat('ru-RU').format(v) + ' \u20bd';
    const updatePriceLabel = () => { if (priceValue) priceValue.textContent = fmtPrice(Number(priceFilter.value)); };

    const plural = (n) => {
      const a = Math.abs(n) % 100, b = a % 10;
      if (a > 10 && a < 20) return '\u043f\u0440\u0438\u0446\u0435\u043f\u043e\u0432';
      if (b > 1 && b < 5) return '\u043f\u0440\u0438\u0446\u0435\u043f\u0430';
      if (b === 1) return '\u043f\u0440\u0438\u0446\u0435\u043f';
      return '\u043f\u0440\u0438\u0446\u0435\u043f\u043e\u0432';
    };

    const norm = (s) => String(s || '').toLowerCase().replace(/\u0451/g, '\u0435').replace(/[\u00d7x\u2715\u2716]/g, 'x').replace(/\s+/g, ' ').trim();

    const countActive = () => {
      let n = 0;
      if (typeChecks.some(c => c.checked)) n++;
      if (lengthFilter && lengthFilter.value) n++;
      if (axlesFilter && axlesFilter.value) n++;
      if (capacityFilter && capacityFilter.value) n++;
      if (Number(priceFilter.value) < PRICE_MAX) n++;
      if (sortFilter && sortFilter.value) n++;
      return n;
    };

    const applyFilters = () => {
      const activeTypes = typeChecks.filter(ch => ch.checked).map(ch => ch.value);
      const length = lengthFilter ? lengthFilter.value : '';
      const axles = axlesFilter ? axlesFilter.value : '';
      const capacity = capacityFilter ? capacityFilter.value : '';
      const maxPrice = Number(priceFilter.value);
      const q = searchInput ? norm(searchInput.value) : '';
      const tokens = q ? q.split(' ').filter(t => t.length >= 2) : [];

      let visibleItems = items.filter(item => {
        const matchType = activeTypes.length === 0 || activeTypes.includes(item.dataset.type);
        const matchLen = !length || item.dataset.length === length;
        const matchAxl = !axles || item.dataset.axles === axles;
        const matchCap = !capacity || item.dataset.capacity === capacity;
        const matchPr = Number(item.dataset.price) <= maxPrice;
        let matchSearch = true;
        if (tokens.length) {
          const hay = norm(item.dataset.search || '');
          matchSearch = tokens.every(t => hay.includes(t));
        }
        const show = matchType && matchLen && matchAxl && matchCap && matchPr && matchSearch;
        item.classList.toggle('hidden', !show);
        return show;
      });

      if (sortFilter && sortFilter.value === 'asc') visibleItems.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      else if (sortFilter && sortFilter.value === 'desc') visibleItems.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));

      visibleItems.forEach(item => catalog.appendChild(item));
      items.filter(item => item.classList.contains('hidden')).forEach(item => catalog.appendChild(item));

      const n = visibleItems.length;
      const txt = '\u041d\u0430\u0439\u0434\u0435\u043d\u043e: ' + n + ' ' + plural(n);
      if (filterCount) filterCount.textContent = txt;
      if (catalogFound) catalogFound.textContent = txt;
      if (applyBtn) applyBtn.innerHTML = '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c ' + n + ' ' + plural(n);

      const ac = countActive();
      if (filterBadge) {
        filterBadge.hidden = ac === 0;
        filterBadge.textContent = String(ac);
      }
      if (searchClear) searchClear.hidden = !(searchInput && searchInput.value.length > 0);
    };

    // --- filter toggle (collapsible) ---
    const togglePanel = (forceOpen) => {
      if (!filterPanel) return;
      const open = typeof forceOpen === 'boolean' ? forceOpen : filterPanel.classList.contains('is-collapsed');
      filterPanel.classList.toggle('is-collapsed', !open);
      filterPanel.setAttribute('aria-hidden', String(!open));
      if (filterToggle) filterToggle.setAttribute('aria-expanded', String(open));
    };

    if (filterToggle) filterToggle.addEventListener('click', () => togglePanel());
    if (collapseLink) collapseLink.addEventListener('click', () => togglePanel(false));
    if (applyBtn) applyBtn.addEventListener('click', () => togglePanel(false));

    // --- event listeners ---
    typeChecks.forEach(ch => ch.addEventListener('change', applyFilters));
    [lengthFilter, axlesFilter, capacityFilter, sortFilter].forEach(el => el && el.addEventListener('change', applyFilters));
    priceFilter.addEventListener('input', () => { updatePriceLabel(); applyFilters(); });

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(applyFilters, 180);
      });
    }
    if (searchClear) searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applyFilters();
      if (searchInput) searchInput.focus();
    });

    if (resetBtn) resetBtn.addEventListener('click', () => {
      typeChecks.forEach(ch => ch.checked = false);
      if (lengthFilter) lengthFilter.value = '';
      if (axlesFilter) axlesFilter.value = '';
      if (capacityFilter) capacityFilter.value = '';
      priceFilter.value = String(PRICE_MAX);
      if (sortFilter) sortFilter.value = '';
      if (searchInput) searchInput.value = '';
      updatePriceLabel();
      applyFilters();
    });

    updatePriceLabel();
    applyFilters();
  };

  const initProductPreviewModal = () => {
    const links = Array.from(document.querySelectorAll('.open-product-modal'));
    if (!links.length) return;

    let modal = document.getElementById('productPreviewModal');
    if (!modal) {
      const modalHtml = `
        <div class="product-preview-modal" id="productPreviewModal" aria-hidden="true">
          <div class="product-preview-backdrop"></div>
          <div class="product-preview-dialog" role="dialog" aria-modal="true" aria-label="Карточка товара">
            <div class="product-preview-header product-preview-header--minimal">
              <a class="product-preview-open" href="#" target="_self" rel="noopener" hidden>Открыть страницей</a>
              <button class="product-preview-close" type="button" aria-label="Закрыть окно">×</button>
            </div>
            <div class="product-preview-content-wrap">
              <div class="product-preview-loading">Загружаем карточку товара…</div>
              <div class="product-preview-body" id="productPreviewBody"></div>
            </div>
          </div>
        </div>`;
      body.insertAdjacentHTML('beforeend', modalHtml);
      modal = document.getElementById('productPreviewModal');
    }

    const bodyEl = modal.querySelector('.product-preview-body');
    const titleEl = modal.querySelector('.product-preview-title'); // может отсутствовать
    const openFullLink = modal.querySelector('.product-preview-open');
    const closeBtn = modal.querySelector('.product-preview-close');
    const productCache = new Map();
    let lastTrigger = null;
    let requestId = 0;

    const toAbsoluteUrl = (value, baseUrl) => {
      if (!value) return value;
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return value;
      try {
        return new URL(value, baseUrl).toString();
      } catch {
        return value;
      }
    };

    const absolutizeFragmentUrls = (root, baseUrl) => {
      root.querySelectorAll('[src]').forEach(el => {
        const value = el.getAttribute('src');
        if (value) el.setAttribute('src', toAbsoluteUrl(value, baseUrl));
      });
      root.querySelectorAll('[href]').forEach(el => {
        const value = el.getAttribute('href');
        if (value) el.setAttribute('href', toAbsoluteUrl(value, baseUrl));
      });
      root.querySelectorAll('[srcset]').forEach(el => {
        const value = el.getAttribute('srcset');
        if (!value) return;
        const parsed = value
          .split(',')
          .map(part => part.trim())
          .filter(Boolean)
          .map(part => {
            const [urlPart, descriptor] = part.split(/\s+/, 2);
            const absolute = toAbsoluteUrl(urlPart, baseUrl);
            return descriptor ? `${absolute} ${descriptor}` : absolute;
          })
          .join(', ');
        el.setAttribute('srcset', parsed);
      });
    };

    const parseProductPage = (html, pageUrl) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sourceItem = doc.querySelector('main.catalog .item') || doc.querySelector('.item');
      if (!sourceItem) throw new Error('Не найден блок карточки товара');

      const wrapper = document.createElement('div');
      wrapper.className = 'product-preview-body-inner';
      const productNode = sourceItem.cloneNode(true);
      productNode.classList.add('product-preview-item');
      absolutizeFragmentUrls(productNode, pageUrl);

      // Гарантируем наличие CTA-кнопок (Позвонить / Написать) внутри карточки
      const info = productNode.querySelector('.info');
      if (info && !info.querySelector('.cta-row')) {
        const ctaRow = document.createElement('div');
        ctaRow.className = 'cta-row';
        ctaRow.innerHTML = `
          <button class="cta cta-call open-call-modal" type="button"><span>Позвонить</span></button>
          <button class="cta cta-write open-write-modal" type="button"><span>Написать</span></button>
        `;
        const priceRow = info.querySelector('.price-row');
        if (priceRow && priceRow.nextSibling) {
          info.insertBefore(ctaRow, priceRow.nextSibling);
        } else {
          info.appendChild(ctaRow);
        }
      }

      wrapper.appendChild(productNode);

      const title = sourceItem.querySelector('h2')?.textContent?.trim()
        || doc.querySelector('title')?.textContent?.replace(/\s+—\s+.*$/, '')
        || 'Карточка товара';

      return {
        title,
        html: wrapper.innerHTML
      };
    };

    // Fallback: build preview directly from window.PRODUCTS_DATA when fetch is blocked
    // (e.g. when running inside the Lovable preview iframe / SPA proxy that returns shell HTML).
    const buildPreviewFromData = (url) => {
      const data = Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA : null;
      if (!data) return null;
      // Match by slug derived from the URL path: products/<slug>/ or products/<slug>.html
      const match = url.match(/products\/([^/.?#]+)(?:\/|\.html)?/i);
      const slug = match ? match[1] : null;
      if (!slug) return null;
      const product = data.find(p => p && p.slug === slug && canShowProduct(p));
      if (!product) return null;

      const galleryImages = product.images.map((src, i) =>
        `<img alt="${escapeHtml((product.title || 'Товар') + ' ' + (i + 1))}" ${i === 0 ? 'class="active" ' : ''}src="${escapeHtml(src)}" ${i === 0 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}/>`
      ).join('');
      const badges = (product.badges || []).map((b, i, arr) =>
        `<div class="badge${i === arr.length - 1 && /в наличии/i.test(b) ? ' badge-stock' : ''}">${escapeHtml(b)}</div>`
      ).join('');
      const description = escapeHtml(product.description || '').replace(/\n/g, '<br/>');
      const specs = (product.specs || []).map(s =>
        `<div class="spec-row"><span>${escapeHtml(s.label)}</span><strong>${escapeHtml(s.value)}</strong></div>`
      ).join('');

      const html = `
<div class="product-preview-body-inner">
  <div class="item product-preview-item">
    <div class="gallery">
      <div class="gallery-stage">${galleryImages}</div>
      <button class="prev" type="button">‹</button>
      <button class="next" type="button">›</button>
    </div>
    <div class="info">
      <div class="badges">${badges}</div>
      <h2>${escapeHtml(product.title || '')}</h2>
      <div class="price-row">
        <div class="price"><small>Цена</small><strong>${escapeHtml(formatCatalogPrice(product.price || 0))}</strong></div>
        <div class="stock-note">${escapeHtml(product.stockNote || '')}</div>
      </div>
      <div class="cta-row">
        <button class="cta cta-call open-call-modal" type="button"><span>Позвонить</span></button>
        <button class="cta cta-write open-write-modal" type="button"><span>Написать</span></button>
      </div>
      <div class="tabs">
        <div class="tabs-head">
          <button class="tab-btn active" data-tab="desc" type="button">Описание</button>
          <button class="tab-btn" data-tab="specs" type="button">Основные характеристики</button>
        </div>
        <div class="tabs-content">
          <div class="tab-content active" data-content="desc"><div class="desc-box"><p>${description}</p></div></div>
          <div class="tab-content" data-content="specs"><div class="spec-box">${specs}</div></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
      return { title: product.title || 'Карточка товара', html };
    };

    const loadProductPage = async url => {
      const absoluteUrl = new URL(url, window.location.href).toString();
      if (!productCache.has(absoluteUrl)) {
        const request = fetch(absoluteUrl, {
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'fetch' }
        })
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
          })
          .then(html => {
            try {
              return parseProductPage(html, absoluteUrl);
            } catch (e) {
              const fallback = buildPreviewFromData(url);
              if (fallback) return fallback;
              throw e;
            }
          })
          .catch(err => {
            const fallback = buildPreviewFromData(url);
            if (fallback) return fallback;
            throw err;
          });
        productCache.set(absoluteUrl, request);
      }
      return productCache.get(absoluteUrl);
    };

    const closeProductPreview = () => {
      requestId += 1;
      modal.classList.remove('open', 'is-loading');
      modal.setAttribute('aria-hidden', 'true');
      bodyEl.innerHTML = '';
      syncBodyLockState();
      lastTrigger?.focus?.();
    };

    const openProductPreview = async (url, title, trigger) => {
      lastTrigger = trigger || null;
      requestId += 1;
      const currentRequestId = requestId;

      modal.classList.add('open', 'is-loading');
      modal.setAttribute('aria-hidden', 'false');
      if (titleEl) titleEl.textContent = title || 'Карточка товара';
      if (openFullLink) openFullLink.href = url;
      bodyEl.innerHTML = '';
      bodyEl.scrollTop = 0;
      syncBodyLockState();

      try {
        const result = await loadProductPage(url);
        if (currentRequestId !== requestId) return;
        bodyEl.innerHTML = result.html;
        if (titleEl) titleEl.textContent = result.title || title || 'Карточка товара';
        initGalleries(bodyEl);
        initTabs(bodyEl);
        initCallModal(bodyEl);
        initWriteModal(bodyEl);
        initCopyNumber(bodyEl);
        modal.classList.remove('is-loading');
      } catch (error) {
        if (currentRequestId !== requestId) return;
        const fileProtocolHint = window.location.protocol === 'file:'
          ? '<p>AJAX-загрузка работает через локальный сервер или хостинг, а не при прямом открытии HTML-файла.</p>'
          : '<p>Попробуйте открыть товар отдельной страницей.</p>';
        bodyEl.innerHTML = `
          <div class="product-preview-error">
            <strong>Не удалось загрузить карточку товара.</strong>
            ${fileProtocolHint}
            <a class="product-preview-open" href="${url}">Открыть товар отдельной страницей</a>
          </div>`;
        modal.classList.remove('is-loading');
      }
    };

    if (!modal.dataset.previewReady) {
      modal.dataset.previewReady = '1';
      closeBtn?.addEventListener('click', closeProductPreview);
      modal.querySelector('.product-preview-backdrop')?.addEventListener('click', closeProductPreview);
    }

    links.forEach(link => {
      if (link.dataset.previewReady === '1') return;
      link.dataset.previewReady = '1';
      link.addEventListener('click', e => {
        if (e.defaultPrevented || e.button !== 0 || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const item = link.closest('.item');
        const title = item?.querySelector('h2')?.textContent?.trim() || link.textContent.trim() || 'Карточка товара';
        openProductPreview(link.getAttribute('href'), title, link);
      });
    });

    document.addEventListener('keydown', e => {
      if (galleryModal.classList.contains('open')) return;
      if (modal.classList.contains('open') && e.key === 'Escape') closeProductPreview();
    });
  };

  const initIntroSplash = () => {
    const splash = document.getElementById('introSplash');
    if (!splash || !body.classList.contains('home-page')) return;

    // Безопасная работа с sessionStorage
    const safeStorage = {
      get(key){ try { return window.sessionStorage.getItem(key); } catch(_) { return null; } },
      set(key, val){ try { window.sessionStorage.setItem(key, val); } catch(_) {} }
    };

    const markFinished = () => {
      body.classList.add('intro-finished');
      safeStorage.set('introSplashSeen', '1');
    };

    // Если intro уже показывалось в этой сессии — сразу скрываем
    if (safeStorage.get('introSplashSeen') === '1') {
      splash.remove();
      body.classList.add('intro-finished');
      return;
    }

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    body.classList.add('splash-active');

    let closed = false;
    let autoTimer = null;
    let enterTimer = null;

    const skipNow = () => closeSplash(true);

    const cleanup = () => {
      splash.removeEventListener('pointerdown', skipNow);
      splash.removeEventListener('touchstart', skipNow);
      splash.removeEventListener('click', skipNow);
      document.removeEventListener('keydown', skipNow);
      document.removeEventListener('touchstart', skipNow);
      document.removeEventListener('pointerdown', skipNow);
      window.removeEventListener('wheel', skipNow);
      window.removeEventListener('scroll', skipNow);
      splash.style.pointerEvents = 'none';
      body.classList.remove('splash-active');
      syncBodyLockState();
    };

    const closeSplash = (immediate = false) => {
      if (closed) return;
      closed = true;
      if (autoTimer) clearTimeout(autoTimer);
      if (enterTimer) clearTimeout(enterTimer);
      if (immediate) splash.classList.add('is-skip');
      splash.classList.add('is-hiding');
      cleanup();
      markFinished();
      window.setTimeout(() => {
        if (splash.parentNode) splash.remove();
      }, immediate ? 260 : 1200);
    };

    splash.addEventListener('pointerdown', skipNow, { passive: true });
    splash.addEventListener('touchstart', skipNow, { passive: true });
    splash.addEventListener('click', skipNow, { passive: true });
    document.addEventListener('keydown', skipNow);
    document.addEventListener('touchstart', skipNow, { passive: true });
    document.addEventListener('pointerdown', skipNow, { passive: true });
    window.addEventListener('wheel', skipNow, { passive: true });
    window.addEventListener('scroll', skipNow, { passive: true });

    if (reduceMotion) {
      splash.classList.add('is-entered');
      autoTimer = window.setTimeout(() => closeSplash(true), 400);
      return;
    }

    enterTimer = window.setTimeout(() => {
      splash.classList.add('is-entered');
    }, 80);

    // Авто-закрытие через ~2.2 секунды
    autoTimer = window.setTimeout(() => closeSplash(false), 2200);
  };


  const initEmbeddedProductPage = () => {
    if (!body.classList.contains('product-page')) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('modal') === '1') {
      body.classList.add('product-embed');
    }
  };


  document.addEventListener('click', e => {
    const telLink = e.target.closest('a[href^="tel:"]');
    if (!telLink) return;
    if (telLink.classList.contains('call-number')) return;
    e.preventDefault();
    document.getElementById('callModal')?.classList.add('open');
  });

  // ========== THEME TOGGLE (dark/light) ==========
  const initThemeToggle = () => {
    // Auto-inject toggle into headers that don't have one (about/contacts/product pages)
    document.querySelectorAll('header .header-inner').forEach(inner => {
      // Гарантируем наличие ряда .header-actions-row для пары кнопок над меню
      let row = inner.querySelector('.header-actions-row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'header-actions-row';
        // Вставляем сразу после логотипа (или в начало), чтобы nav был ниже
        const logo = inner.querySelector('.logo-wrap, .logo, a[href="/"], a[href="index.html"]');
        if (logo && logo.parentNode === inner) inner.insertBefore(row, logo.nextSibling);
        else inner.insertBefore(row, inner.firstChild);
      }

      // Если уже есть theme-toggle где-то в шапке — переносим его в row
      let btn = inner.querySelector('.theme-toggle');
      if (btn && btn.parentNode !== row) row.appendChild(btn);
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.id = inner.closest('header').querySelector('#themeToggle') ? '' : 'themeToggle';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Переключить тему');
        btn.title = 'Переключить тему';
        btn.innerHTML = '<span class="theme-toggle-icon">🌙</span>';
        row.appendChild(btn);
      } else {
        // Удаляем старый label если был
        const oldLbl = btn.querySelector('.btn-label');
        if (oldLbl) oldLbl.remove();
      }
    });

    const saved = (() => { try { return localStorage.getItem('site-theme'); } catch { return null; }})();
    const applyTheme = theme => {
      if (theme === 'light') body.classList.add('light-theme');
      else body.classList.remove('light-theme');
      document.querySelectorAll('.theme-toggle-icon').forEach(i => {
        i.textContent = theme === 'light' ? '☀️' : '🌙';
      });
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f7fb' : '#0b1017');
    };
    applyTheme(saved || 'dark');

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      if (btn.dataset.themeReady === '1') return;
      btn.dataset.themeReady = '1';
      btn.addEventListener('click', () => {
        const next = body.classList.contains('light-theme') ? 'dark' : 'light';
        applyTheme(next);
        try { localStorage.setItem('site-theme', next); } catch {}
      });
    });
  };

  // ========== HEADER SEARCH (Lottie + product filter) ==========
  let lottieLoadingPromise = null;
  const ensureLottie = () => {
    if (window.lottie) return Promise.resolve(window.lottie);
    if (lottieLoadingPromise) return lottieLoadingPromise;
    lottieLoadingPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie_light.min.js';
      s.async = true;
      s.onload = () => resolve(window.lottie);
      s.onerror = () => reject(new Error('lottie failed'));
      document.head.appendChild(s);
    });
    return lottieLoadingPromise;
  };

  const initHeaderSearch = () => {
    document.querySelectorAll('header .header-inner').forEach(inner => {
      if (inner.querySelector('.search-wrap')) return;

      // Wrapper holds the button (which expands inline) + a dropdown for results.
      const wrap = document.createElement('div');
      wrap.className = 'search-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-toggle';
      btn.setAttribute('aria-label', 'Поиск по товарам');
      btn.setAttribute('aria-expanded', 'false');
      btn.title = 'Поиск по товарам';
      btn.innerHTML = '<span class="search-icon-wrap">'
        + '<svg class="search-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
        + '</span>'
        + '<span class="search-lottie" aria-hidden="true"></span>'
        + '<input type="search" inputmode="search" maxlength="80" class="search-input" placeholder="Поиск по названию прицепа…" aria-label="Поиск по товарам" tabindex="-1"/>'
        + '<span class="btn-label">Поиск</span>';

      wrap.appendChild(btn);

      // Вставляем в общий ряд кнопок над меню (перед .theme-toggle)
      let row = inner.querySelector('.header-actions-row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'header-actions-row';
        inner.insertBefore(row, inner.firstChild);
      }
      const themeBtn = row.querySelector('.theme-toggle');
      if (themeBtn) row.insertBefore(wrap, themeBtn);
      else row.appendChild(wrap);

      const pop = document.createElement('div');
      pop.className = 'search-popover';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Поиск товаров');
      pop.innerHTML = '<div class="search-results" role="listbox"></div>';
      wrap.appendChild(pop);

      const input = btn.querySelector('.search-input');
      const results = pop.querySelector('.search-results');
      let lottieAnim = null;

      ensureLottie().then(lottie => {
        const container = btn.querySelector('.search-lottie');
        if (!container || !lottie) { btn.classList.add('no-lottie'); return; }
        try {
          lottieAnim = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/lottie/search.json',
          });
          // Анимация при наведении
          btn.addEventListener('mouseenter', () => {
            try { lottieAnim.goToAndPlay(0, true); } catch (e) {}
          });
          btn.addEventListener('mouseleave', () => {
            if (!pop.classList.contains('is-open')) {
              try { lottieAnim.stop(); } catch (e) {}
            }
          });
          btn.addEventListener('focus', () => {
            try { lottieAnim.goToAndPlay(0, true); } catch (e) {}
          });
          btn.addEventListener('blur', () => {
            if (!pop.classList.contains('is-open')) {
              try { lottieAnim.stop(); } catch (e) {}
            }
          });
        } catch (e) { btn.classList.add('no-lottie'); }
      }).catch(() => btn.classList.add('no-lottie'));

      // Словарь синонимов: ключ — что вводит пользователь, значения — на что расширяем
      const SEARCH_SYNONYMS = {
        'лодка': ['лодочн', 'лодк', 'плавсредств', 'катер'],
        'лодки': ['лодочн', 'лодк'],
        'лодочный': ['лодочн', 'лодк'],
        'катер': ['лодочн', 'катер'],
        'мото': ['мотоцикл', 'мото', 'снегоход', 'квадроцикл'],
        'мотоцикл': ['мотоцикл', 'мото'],
        'квадрик': ['квадроцикл', 'квадрик', 'atv'],
        'квадроцикл': ['квадроцикл', 'atv'],
        'снегоход': ['снегоход'],
        'машина': ['автовоз', 'легков', 'авто'],
        'авто': ['автовоз', 'легков', 'авто'],
        'легковой': ['легков'],
        'грузовой': ['грузов', 'бортов'],
        'борт': ['бортов', 'борт'],
        'бортовой': ['бортов'],
        'самосвал': ['самосвал'],
        'крытый': ['кофр', 'фургон', 'крыт', 'тент'],
        'фургон': ['фургон', 'кофр', 'крыт'],
        'кофр': ['кофр'],
        'тент': ['тент', 'крыт'],
        'дача': ['дачн', 'хозяйств'],
        'дачный': ['дачн'],
        'строй': ['строит', 'грузов'],
        'охота': ['охот', 'рыбалк'],
        'рыбалка': ['рыбалк', 'лодочн', 'лодк'],
        'двухосный': ['двухосн', '2-осн'],
        'одноосный': ['одноосн', '1-осн'],
        'прицеп': [''], // любой
        'трейлер': [''],
      };

      // Извлекает все числа из строки (для поиска по размерам типа 1850, 185, 250 и т.п.)
      const extractNumbers = (str) => {
        const m = String(str || '').match(/\d{2,5}/g);
        return m || [];
      };

      // Нормализация: убираем лишнее, приводим к нижнему регистру, заменяем разделители
      const normalize = (s) => String(s || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[×x✕✖]/g, 'x')
        .replace(/[^\wа-я0-9x\s.,-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Собирает «поисковое поле» товара — всё, по чему ищем
      const buildHaystack = (p) => {
        const parts = [
          p.title, p.type, p.length, p.axles, p.capacity,
          p.description, p.stockNote, p.slug
        ];
        if (Array.isArray(p.badges)) parts.push(p.badges.join(' '));
        if (Array.isArray(p.specs)) {
          p.specs.forEach(s => { parts.push(s.label); parts.push(s.value); });
        }
        return normalize(parts.filter(Boolean).join(' '));
      };

      // Считает релевантность совпадения для одного товара
      const scoreProduct = (p, tokens, numbers) => {
        const title = normalize(p.title);
        const type = normalize(p.type);
        const hay = buildHaystack(p);
        let score = 0;
        let matched = 0;

        tokens.forEach(tok => {
          if (!tok) return;
          // Расширяем синонимами
          const variants = new Set([tok]);
          const syn = SEARCH_SYNONYMS[tok];
          if (syn) syn.forEach(v => v && variants.add(v));
          // также пробуем «обрезанные» формы (стемминг по-простому)
          if (tok.length > 4) variants.add(tok.slice(0, tok.length - 1));
          if (tok.length > 5) variants.add(tok.slice(0, tok.length - 2));

          let tokenMatched = false;
          variants.forEach(v => {
            if (!v || v.length < 2) return;
            if (title.includes(v)) { score += 10; tokenMatched = true; }
            else if (type.includes(v)) { score += 6; tokenMatched = true; }
            else if (hay.includes(v)) { score += 3; tokenMatched = true; }
          });
          if (tokenMatched) matched++;
        });

        // Поиск по числам (размеры): 185, 1850, 250×127 и т.д.
        const prodNumbers = extractNumbers(hay);
        numbers.forEach(n => {
          if (prodNumbers.includes(n)) { score += 8; matched++; }
          else if (prodNumbers.some(pn => pn.startsWith(n) || n.startsWith(pn))) {
            score += 4; matched++;
          }
        });

        return { score, matched };
      };

      const renderResults = (q) => {
        const data = Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA.filter(p => p && p.active !== false) : [];
        const queryRaw = (q || '').trim();
        if (!queryRaw) {
          results.innerHTML = '';
          return;
        }
        const query = normalize(queryRaw);
        // Разбиваем на токены (слова + числа отдельно)
        const tokens = query.split(/[\s,.-]+/).filter(t => t && t.length >= 2 && !/^\d+$/.test(t));
        const numbers = query.match(/\d{2,5}/g) || [];

        const totalCriteria = tokens.length + numbers.length;
        if (!totalCriteria) {
          results.innerHTML = '<div class="search-empty">Уточните запрос…</div>';
          return;
        }

        const scored = data.map(p => ({ p, ...scoreProduct(p, tokens, numbers) }))
          .filter(x => x.score > 0)
          // требуем чтобы совпало хотя бы половина критериев (но минимум 1)
          .filter(x => x.matched >= Math.max(1, Math.ceil(totalCriteria / 2)))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        if (!scored.length) {
          results.innerHTML = '<div class="search-empty">Ничего не найдено. Попробуйте: «лодочный», «бортовой», «250», «750 кг»</div>';
          return;
        }
        results.innerHTML = scored.map(({ p }) => {
          const imgSrc = (p.images && p.images[0]) ? '/' + escapeHtml(p.images[0]) : '';
          const price = p.price ? new Intl.NumberFormat('ru-RU').format(p.price) + ' ₽' : '';
          return '<a href="/products/' + escapeHtml(p.slug) + '/" tabindex="0">'
            + (imgSrc ? '<img src="' + imgSrc + '" alt="" loading="lazy"/>' : '')
            + '<span class="sr-title"><strong>' + escapeHtml(p.title || '') + '</strong>'
            + '<small>' + escapeHtml(p.type || '') + (price ? ' · ' + price : '') + '</small></span>'
            + '</a>';
        }).join('');
      };

      const open = () => {
        if (wrap.classList.contains('is-open')) return;
        wrap.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        input.removeAttribute('tabindex');
        renderResults(input.value);
        if (lottieAnim) { try { lottieAnim.goToAndPlay(0, true); } catch (e) {} }
        setTimeout(() => input.focus(), 60);
      };
      const close = () => {
        if (!wrap.classList.contains('is-open')) return;
        wrap.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        input.setAttribute('tabindex', '-1');
        input.blur();
        if (lottieAnim) { try { lottieAnim.stop(); } catch (e) {} }
      };

      btn.addEventListener('click', (e) => {
        // Клик по самому инпуту не должен закрывать
        if (e.target === input) return;
        e.stopPropagation();
        if (wrap.classList.contains('is-open')) {
          // если поле пустое — сворачиваем; иначе фокусим инпут
          if (!input.value.trim()) close();
          else input.focus();
        } else {
          open();
        }
      });
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('input', (e) => renderResults(e.target.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); btn.focus(); }
        if (e.key === 'ArrowDown') {
          const first = results.querySelector('a');
          if (first) { e.preventDefault(); first.focus(); }
        }
      });
      pop.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) {
          if (!input.value.trim()) close();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    });
  };

  // ========== RIPPLE EFFECT on buttons ==========
  const initRipple = (root = document) => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    // Auto-apply ripple to all .btn, .cta, .contact-action, .write-option
    const selector = '.btn, .cta, .contact-action, .write-option, .float-btn, .copy-number, .theme-toggle';
    root.querySelectorAll(selector).forEach(el => {
      if (el.dataset.rippleReady === '1') return;
      el.dataset.rippleReady = '1';
      el.addEventListener('pointerdown', e => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ink = document.createElement('span');
        ink.className = 'ripple-ink';
        ink.style.width = ink.style.height = size + 'px';
        ink.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ink.style.top = (e.clientY - rect.top - size / 2) + 'px';
        el.appendChild(ink);
        setTimeout(() => ink.remove(), 700);
      });
    });
  };

  // 3D tilt removed by user request — оставляем только лёгкий spotlight на ховере фото
  const initTilt = (root = document) => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia?.('(hover: none)').matches;
    if (prefersReduced || isTouch) return;

    root.querySelectorAll('main.catalog .item .gallery-stage').forEach(stage => {
      if (stage.dataset.spotReady === '1') return;
      stage.dataset.spotReady = '1';
      stage.addEventListener('pointermove', e => {
        const rect = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        stage.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
    });
  };

  // ========== PARALLAX on hero ==========
  const initParallax = () => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const hero = document.getElementById('heroCinematic');
    if (!hero) return;
    const layers = Array.from(hero.querySelectorAll('[data-parallax]'));
    if (!layers.length) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const progress = rect.top; // negative when scrolling past
        layers.forEach(layer => {
          const rate = parseFloat(layer.dataset.parallax) || 0;
          layer.style.transform = `translate3d(0, ${(-progress * rate).toFixed(2)}px, 0)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  // ===== Callback form (in #writeModal) =====
  const initCallbackForm = () => {
    const form = document.getElementById('callbackForm');
    if (!form || form.dataset.cbReady === '1') return;
    form.dataset.cbReady = '1';
    const nameI = form.querySelector('[name="cb-name"]');
    const phoneI = form.querySelector('[name="cb-phone"]');
    const submit = form.querySelector('.cb-submit');
    const toast = document.getElementById('copyToast');

    const formatPhone = raw => {
      let d = raw.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      const p = d.slice(1);
      let out = '+7';
      if (p.length > 0) out += ' (' + p.slice(0, 3);
      if (p.length >= 3) out += ') ' + p.slice(3, 6);
      if (p.length >= 6) out += '-' + p.slice(6, 8);
      if (p.length >= 8) out += '-' + p.slice(8, 10);
      return out;
    };
    phoneI?.addEventListener('input', () => { phoneI.value = formatPhone(phoneI.value); });
    phoneI?.addEventListener('focus', () => { if (!phoneI.value) phoneI.value = '+7 ('; });

    const showToast = (text) => {
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2400);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (nameI?.value || '').trim();
      const phoneDigits = (phoneI?.value || '').replace(/\D/g, '');
      let valid = true;
      if (name.length < 2 || name.length > 60) { nameI?.classList.add('cb-invalid'); valid = false; } else nameI?.classList.remove('cb-invalid');
      if (phoneDigits.length !== 11) { phoneI?.classList.add('cb-invalid'); valid = false; } else phoneI?.classList.remove('cb-invalid');
      if (!valid) { showToast('Проверьте имя и телефон'); return; }

      const last = Number(localStorage.getItem('cb_last') || 0);
      if (Date.now() - last < 60000) { showToast('Заявка уже отправлена. Перезвоним.'); return; }
      localStorage.setItem('cb_last', String(Date.now()));

      const msg = encodeURIComponent(`Заявка с сайта: ${name}, ${phoneI.value}`);
      const wa = 'https://wa.me/79131474624?text=' + msg;
      window.open(wa, '_blank', 'noopener');
      showToast('Заявка принята, перезвоним за 5 минут');
      nameI.value = ''; phoneI.value = '';
    });
  };

  // ===== Skeleton loader for catalog =====
  const showCatalogSkeletons = (count = 6) => {
    const placeholder = document.getElementById('catalogDynamicPlaceholder');
    if (!placeholder) return;
    let html = '<div class="skeleton-grid">';
    for (let i = 0; i < count; i++) {
      html += '<div class="skeleton-card"><div class="sk-img"></div><div class="sk-body">' +
        '<div class="sk-line sk-h22 sk-w70"></div>' +
        '<div class="sk-line sk-w50"></div>' +
        '<div class="sk-line sk-w90"></div>' +
        '<div class="sk-line sk-w70"></div>' +
        '</div></div>';
    }
    html += '</div>';
    placeholder.innerHTML = html;
  };

  const flashFilterSkeleton = () => {
    const catalog = document.querySelector('main.catalog');
    if (!catalog) return;
    catalog.classList.add('is-filtering');
    clearTimeout(catalog._fltTo);
    catalog._fltTo = setTimeout(() => catalog.classList.remove('is-filtering'), 280);
  };

  // ===== Quiz =====
  const initQuiz = () => {
    const quiz = document.getElementById('quizSection');
    if (!quiz || quiz.dataset.quizReady === '1') return;
    quiz.dataset.quizReady = '1';

    const steps = Array.from(quiz.querySelectorAll('.quiz-step'));
    const progressDots = Array.from(quiz.querySelectorAll('.quiz-progress span'));
    const prevBtn = quiz.querySelector('.qbtn-prev');
    const nextBtn = quiz.querySelector('.qbtn-next');
    const restartBtn = quiz.querySelector('.qbtn-restart');
    const resultsBox = quiz.querySelector('.quiz-results');
    const answers = {};
    let current = 0;

    const render = () => {
      steps.forEach((s, i) => s.classList.toggle('active', i === current));
      progressDots.forEach((d, i) => {
        d.classList.toggle('active', i === current);
        d.classList.toggle('done', i < current);
      });
      const isLast = current === steps.length - 1;
      const stepKey = steps[current]?.dataset.key;
      const hasAnswer = !!answers[stepKey] || isLast;
      if (prevBtn) prevBtn.style.display = current === 0 ? 'none' : '';
      if (nextBtn) {
        nextBtn.textContent = isLast ? 'Подобрать' : 'Далее →';
        nextBtn.disabled = !hasAnswer;
      }
      if (restartBtn) restartBtn.style.display = quiz.classList.contains('show-results') ? '' : 'none';
    };

    quiz.addEventListener('click', (e) => {
      const opt = e.target.closest('.quiz-option');
      if (opt) {
        const step = opt.closest('.quiz-step');
        const key = step.dataset.key;
        answers[key] = opt.dataset.value;
        step.querySelectorAll('.quiz-option').forEach(o => o.classList.toggle('selected', o === opt));
        render();
        return;
      }
      if (e.target.closest('.qbtn-next')) {
        if (current < steps.length - 1) { current++; render(); }
        else { computeResults(); }
      } else if (e.target.closest('.qbtn-prev')) {
        if (current > 0) { current--; render(); }
      } else if (e.target.closest('.qbtn-restart')) {
        Object.keys(answers).forEach(k => delete answers[k]);
        quiz.classList.remove('show-results');
        steps.forEach(s => s.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected')));
        current = 0;
        if (resultsBox) resultsBox.innerHTML = '';
        render();
      }
    });

    const computeResults = () => {
      const data = Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA.filter(canShowProduct) : [];
      const cargo = answers.cargo;
      const budget = answers.budget;
      const budgetMax = budget === 'low' ? 80000 : budget === 'mid' ? 120000 : Infinity;
      const budgetMin = budget === 'high' ? 120000 : 0;

      const scored = data.map(p => {
        let score = 0;
        if (cargo === 'boat' || cargo === 'moto') {
          if (p.type === 'Специализированный') score += 3;
        } else if (cargo === 'build' || cargo === 'household') {
          if (p.type === 'Бортовой') score += 3;
        } else if (cargo === 'atv') {
          if (p.type === 'Специализированный' || p.type === 'Бортовой') score += 2;
        }
        const price = Number(p.price || 0);
        if (price <= budgetMax && price >= budgetMin) score += 2;
        if (price <= budgetMax) score += 1;
        return { p, score };
      }).sort((a, b) => b.score - a.score);

      const picks = scored.slice(0, 3).map(x => x.p);
      if (resultsBox) {
        if (!picks.length) {
          resultsBox.innerHTML = '<div class="quiz-empty">К сожалению, под эти условия пока нет товаров. Откройте каталог или напишите нам — поможем подобрать.</div>';
        } else {
          resultsBox.innerHTML = picks.map(p => `
            <div class="quiz-result-card">
              <div class="qr-img"><img src="${escapeHtml(p.images?.[0] || '')}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async"/></div>
              <div class="qr-title">${escapeHtml(p.title)}</div>
              <div class="qr-price">${escapeHtml(formatCatalogPrice(p.price))}</div>
              <a class="qr-link" href="products/${escapeHtml(p.slug)}/">Открыть карточку</a>
            </div>`).join('');
        }
      }
      quiz.classList.add('show-results');
      const lastStep = steps[steps.length - 1];
      if (lastStep) lastStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      render();
    };

    render();
  };

  // ===== Share button =====
  const initShareButton = (root = document) => {
    root.querySelectorAll('.share-btn').forEach(btn => {
      if (btn.dataset.shareReady === '1') return;
      btn.dataset.shareReady = '1';
      btn.addEventListener('click', async () => {
        const title = document.title;
        const url = location.href;
        const text = btn.dataset.shareText || title;
        const toast = document.getElementById('copyToast');
        try {
          if (navigator.share) {
            await navigator.share({ title, text, url });
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            if (toast) { toast.textContent = 'Ссылка скопирована'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }
          }
        } catch { /* user cancelled */ }
      });
    });
  };

  // ===== Blur-up lazy images =====
  const initBlurUp = (root = document) => {
    const imgs = root.querySelectorAll('img:not([data-blur-ready])');
    imgs.forEach(img => {
      img.dataset.blurReady = '1';
      // Skip icons / svgs / data URIs / very small assets
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:') || /\.svg($|\?)/i.test(src)) return;
      // Skip logo/header
      if (img.closest('header') || img.classList.contains('contact-action-icon') || img.classList.contains('messenger-icon-img')) return;
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      img.classList.add('blur-up');
      const markLoaded = () => img.classList.add('loaded');
      if (img.complete && img.naturalWidth > 0) markLoaded();
      else { img.addEventListener('load', markLoaded, { once: true }); img.addEventListener('error', markLoaded, { once: true }); }
    });
  };

  initIntroSplash();
  initEmbeddedProductPage();

  // Active nav link based on current path
  try {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('header nav a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      a.removeAttribute('style');
      if (href === path || (path === '' && href === 'index.html')) a.classList.add('is-active');
    });
  } catch (e) {}

  // Reveal-on-scroll
  const initReveal = (root) => {
    try {
      const targets = (root || document).querySelectorAll('.trust-card, .product-card, .faq-item, .contact-item, .quiz-shell, .contact-card, .map-card');
      targets.forEach(el => { if (!el.classList.contains('reveal')) el.classList.add('reveal'); });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(el => { if (!el.classList.contains('in')) io.observe(el); });
      } else {
        targets.forEach(el => el.classList.add('in'));
      }
    } catch (e) {}
  };
  window.__initReveal = initReveal;

  showCatalogSkeletons(6);
  renderCatalogFromData();
  initGalleries(document);
  initTabs(document);
  initFilters();
  // Hook fade transition into existing filter inputs
  document.querySelectorAll('input[name="type"], #lengthFilter, #axlesFilter, #capacityFilter, #priceFilter, #sortFilter, #resetFilters')
    .forEach(el => el.addEventListener(el.tagName === 'BUTTON' ? 'click' : 'input', flashFilterSkeleton));
  initCallModal(document);
  initWriteModal(document);
  initCallbackForm();
  initCopyNumber();
  initProductPreviewModal();
  initThemeToggle();
  initHeaderSearch();
  initQuiz();
  initShareButton(document);
  initBlurUp(document);
  initRipple(document);
  initTilt(document);
  initParallax();
  initReveal(document);

  // Re-init ripple & tilt after catalog/product preview rendered dynamically
  const observer = new MutationObserver(() => {
    initRipple(document);
    initTilt(document);
    initShareButton(document);
    initBlurUp(document);
    initCallbackForm();
    initReveal(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
