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

  const renderCatalogFromData = () => {
    const catalog = document.querySelector('main.catalog');
    const data = Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA : null;
    if (!catalog || !data || catalog.dataset.catalogRendered === '1') return;
    catalog.dataset.catalogRendered = '1';

    const visibleProducts = data.filter(canShowProduct);
    if (!visibleProducts.length) {
      catalog.innerHTML = '<div class="catalog-empty">В каталоге пока нет активных товаров.</div>';
      return;
    }

    const html = visibleProducts.map(product => {
      // Одна галерея на товар со всеми его фото (не повторять по числу картинок!)
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
      return `<div class="item" data-axles="${escapeHtml(product.axles || '')}" data-capacity="${escapeHtml(product.capacity || '')}" data-length="${escapeHtml(product.length || '')}" data-price="${Number(product.price || 0)}" data-type="${escapeHtml(product.type || '')}">
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
    const resetFilters = document.getElementById('resetFilters');
    const filterCount = document.getElementById('filterCount');

    if (!catalog || !items.length || !typeChecks.length || !priceFilter) return;
    if (catalog.dataset.filtersReady === '1') return;
    catalog.dataset.filtersReady = '1';

    function formatPrice(value){ return new Intl.NumberFormat('ru-RU').format(value) + ' ₽'; }
    function updatePriceLabel(){ if (priceValue && priceFilter) priceValue.textContent = formatPrice(Number(priceFilter.value)); }
    function applyFilters(){
      const activeTypes = typeChecks.filter(ch => ch.checked).map(ch => ch.value);
      const length = lengthFilter?.value || '';
      const axles = axlesFilter?.value || '';
      const capacity = capacityFilter?.value || '';
      const maxPrice = priceFilter ? Number(priceFilter.value) : Infinity;

      let visibleItems = items.filter(item => {
        const matchesType = activeTypes.length === 0 || activeTypes.includes(item.dataset.type);
        const matchesLength = !length || item.dataset.length === length;
        const matchesAxles = !axles || item.dataset.axles === axles;
        const matchesCapacity = !capacity || item.dataset.capacity === capacity;
        const matchesPrice = Number(item.dataset.price) <= maxPrice;
        const show = matchesType && matchesLength && matchesAxles && matchesCapacity && matchesPrice;
        item.classList.toggle('hidden', !show);
        return show;
      });

      if (sortFilter?.value === 'asc') visibleItems.sort((a,b)=>Number(a.dataset.price)-Number(b.dataset.price));
      else if (sortFilter?.value === 'desc') visibleItems.sort((a,b)=>Number(b.dataset.price)-Number(a.dataset.price));

      visibleItems.forEach(item => catalog.appendChild(item));
      items.filter(item => item.classList.contains('hidden')).forEach(item => catalog.appendChild(item));
      if (filterCount) filterCount.textContent = 'Найдено: ' + visibleItems.length;
    }

    typeChecks.forEach(ch => ch.addEventListener('change', applyFilters));
    [lengthFilter, axlesFilter, capacityFilter, sortFilter].forEach(el => el?.addEventListener('change', applyFilters));
    priceFilter.addEventListener('input', () => { updatePriceLabel(); applyFilters(); });
    resetFilters?.addEventListener('click', () => {
      typeChecks.forEach(ch => ch.checked = false);
      if (lengthFilter) lengthFilter.value = '';
      if (axlesFilter) axlesFilter.value = '';
      if (capacityFilter) capacityFilter.value = '';
      priceFilter.value = '500000';
      if (sortFilter) sortFilter.value = '';
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
          <div class="product-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="productPreviewTitle">
            <div class="product-preview-header">
              <div class="product-preview-headline">
                <div class="product-preview-kicker">Карточка товара</div>
                <strong class="product-preview-title" id="productPreviewTitle">Карточка товара</strong>
              </div>
              <div class="product-preview-actions">
                <a class="product-preview-open" href="#" target="_self" rel="noopener">Открыть страницей</a>
                <button class="product-preview-close" type="button" aria-label="Закрыть окно">×</button>
              </div>
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
    const titleEl = modal.querySelector('.product-preview-title');
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
          .then(html => parseProductPage(html, absoluteUrl));
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
      titleEl.textContent = title || 'Карточка товара';
      openFullLink.href = url;
      bodyEl.innerHTML = '';
      bodyEl.scrollTop = 0;
      syncBodyLockState();

      try {
        const result = await loadProductPage(url);
        if (currentRequestId !== requestId) return;
        bodyEl.innerHTML = result.html;
        titleEl.textContent = result.title || title || 'Карточка товара';
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

    body.classList.add('splash-active');

    let closed = false;
    let autoTimer = null;
    let enterTimer = null;

    const cleanup = () => {
      splash.removeEventListener('pointerdown', skipNow);
      splash.removeEventListener('touchstart', skipNow);
      document.removeEventListener('keydown', skipNow);
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
      window.setTimeout(() => {
        splash.remove();
      }, immediate ? 260 : 1750);
    };

    const skipNow = () => closeSplash(true);

    splash.addEventListener('pointerdown', skipNow, { passive: true });
    splash.addEventListener('touchstart', skipNow, { passive: true });
    splash.addEventListener('click', skipNow, { passive: true });
    document.addEventListener('keydown', skipNow);
    window.addEventListener('wheel', skipNow, { passive: true, once: true });

    // Логотип проявляется из тумана сразу после первого кадра
    enterTimer = window.setTimeout(() => {
      splash.classList.add('is-entered');
    }, 120);

    // Хореография: 0.12s ожидание → ~1.8s проявление → ~1.4s удержание → ~1.7s растворение
    autoTimer = window.setTimeout(() => closeSplash(false), 3400);
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

  initIntroSplash();
  initEmbeddedProductPage();
  renderCatalogFromData();
  initGalleries(document);
  initTabs(document);
  initFilters();
  initCallModal(document);
  initWriteModal(document);
  initCopyNumber();
  initProductPreviewModal();
})();
