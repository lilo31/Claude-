/* ============================================================
   THEME JS — Seed & Co. Shopify Theme
   ============================================================ */

'use strict';

/* ─── UTILS ──────────────────────────────────────────────── */

const Utils = {
  formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || '${{amount}}';
    function defaultTo(value, defaultValue) {
      return value === null || value === undefined || value !== value ? defaultValue : value;
    }
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultTo(precision, 2);
      thousands = defaultTo(thousands, ',');
      decimal = defaultTo(decimal, '.');
      if (isNaN(number) || number === null) return 0;
      number = (number / 100).toFixed(precision);
      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
      const centsAmount = parts[1] ? `${decimal}${parts[1]}` : '';
      return dollarsAmount + centsAmount;
    }
    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount': value = formatWithDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = formatWithDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = formatWithDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = formatWithDelimiters(cents, 0, '.', ','); break;
    }
    return formatString.replace(placeholderRegex, value);
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  },

  trapFocus(el) {
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  },

  getUrlWithVariant(url, variantId) {
    if (/variant=/.test(url)) return url.replace(/(variant=)[^&]+/, `$1${variantId}`);
    if (/\?/.test(url)) return `${url}&variant=${variantId}`;
    return `${url}?variant=${variantId}`;
  }
};

/* ─── CART ───────────────────────────────────────────────── */

const Cart = {
  async get() {
    const res = await fetch(window.routes.cart_url + '.js', { headers: { 'Content-Type': 'application/json' } });
    return res.json();
  },

  async add(items) {
    const res = await fetch(window.routes.cart_add_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return res.json();
  },

  async change(id, quantity, properties) {
    const res = await fetch(window.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity, properties })
    });
    return res.json();
  },

  async update(updates) {
    const res = await fetch(window.routes.cart_update_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return res.json();
  }
};

/* ─── TOAST NOTIFICATIONS ────────────────────────────────── */

const Toast = {
  container: null,
  timeouts: new Map(),

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'default', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    `;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const close = () => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast__close').addEventListener('click', close);
    const t = setTimeout(close, duration);
    this.timeouts.set(toast, t);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); }
};

/* ─── CART DRAWER ────────────────────────────────────────── */

class CartDrawer {
  constructor() {
    this.drawer = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-drawer-overlay');
    this.body = document.getElementById('cart-drawer-body');
    this.countEls = document.querySelectorAll('[data-cart-count]');
    this.subtotalEls = document.querySelectorAll('[data-cart-subtotal]');
    if (!this.drawer) return;
    this.bindEvents();
  }

  bindEvents() {
    document.querySelectorAll('[data-cart-open]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); this.open(); });
    });
    this.overlay?.addEventListener('click', () => this.close());
    document.getElementById('cart-drawer-close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
    document.body.addEventListener('change', '[data-cart-quantity]', this.handleQuantityChange.bind(this));
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-cart-remove]')) this.removeItem(e);
    });
  }

  async open() {
    await this.refresh();
    this.drawer.classList.add('is-open');
    this.overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    Utils.trapFocus(this.drawer);
  }

  close() {
    this.drawer.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  async refresh() {
    const cart = await Cart.get();
    this.updateCount(cart.item_count);
    this.updateSubtotal(cart.total_price);
    this.renderItems(cart);
  }

  updateCount(count) {
    this.countEls.forEach(el => {
      el.textContent = count;
      el.classList.toggle('visible', count > 0);
    });
  }

  updateSubtotal(price) {
    this.subtotalEls.forEach(el => {
      el.textContent = Utils.formatMoney(price);
    });
  }

  renderItems(cart) {
    if (!this.body) return;
    if (cart.item_count === 0) {
      this.body.innerHTML = `
        <div class="cart-drawer__empty">
          <svg class="cart-drawer__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Your cart is empty</p>
          <a href="/collections/all" class="button button--primary" style="margin-top:1.6rem">Continue Shopping</a>
        </div>
      `;
      return;
    }
    this.body.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-line="${item.key}">
        <div class="cart-item__image">
          <img src="${item.image}" alt="${item.product_title}" loading="lazy">
        </div>
        <div class="cart-item__details">
          <p class="cart-item__title">${item.product_title}</p>
          <p class="cart-item__variant">${item.variant_title || ''}</p>
          <div class="cart-item__actions">
            <div class="quantity quantity--small">
              <button class="quantity__button" data-quantity-dec data-key="${item.key}">−</button>
              <input class="quantity__input" type="number" value="${item.quantity}" min="0" data-cart-quantity data-key="${item.key}">
              <button class="quantity__button" data-quantity-inc data-key="${item.key}">+</button>
            </div>
            <span class="cart-item__price">${Utils.formatMoney(item.final_line_price)}</span>
            <button class="cart-item__remove" data-cart-remove data-key="${item.key}">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    // Quantity buttons
    this.body.querySelectorAll('[data-quantity-dec]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const input = this.body.querySelector(`input[data-key="${key}"]`);
        const qty = Math.max(0, parseInt(input.value) - 1);
        await Cart.change(key, qty);
        this.refresh();
      });
    });
    this.body.querySelectorAll('[data-quantity-inc]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const input = this.body.querySelector(`input[data-key="${key}"]`);
        const qty = parseInt(input.value) + 1;
        await Cart.change(key, qty);
        this.refresh();
      });
    });
  }

  async removeItem(e) {
    const key = e.target.closest('[data-cart-remove]').dataset.key;
    await Cart.change(key, 0);
    this.refresh();
    Toast.success('Item removed from cart');
  }

  async handleQuantityChange(e) {
    const el = e.target.closest('[data-cart-quantity]');
    if (!el) return;
    const key = el.dataset.key;
    const qty = parseInt(el.value);
    if (isNaN(qty)) return;
    await Cart.change(key, qty);
    this.refresh();
  }
}

/* ─── PRODUCT FORM ───────────────────────────────────────── */

class ProductForm {
  constructor(el) {
    this.el = el;
    this.productData = JSON.parse(el.querySelector('[data-product-json]')?.textContent || '{}');
    this.form = el.querySelector('form[data-product-form]');
    this.variantInput = el.querySelector('[name="id"]');
    this.atcBtn = el.querySelector('[data-atc-btn]');
    this.priceEl = el.querySelector('[data-price]');
    this.comparePriceEl = el.querySelector('[data-compare-price]');
    this.savingsEl = el.querySelector('[data-savings]');
    this.stockEl = el.querySelector('[data-stock]');
    this.optionSelectors = el.querySelectorAll('[data-option-selector]');
    this.sellingPlanInputs = el.querySelectorAll('[name="selling_plan"]');
    this.thumbnails = document.querySelectorAll('[data-thumbnail]');
    this.mainImage = document.querySelector('[data-product-main-image]');
    this.zoomBtn = document.querySelector('[data-zoom-btn]');
    this.zoomModal = document.getElementById('zoom-modal');
    this.zoomImg = document.getElementById('zoom-img');
    this.stickyATC = document.getElementById('sticky-atc');
    this.stickyATCBtn = document.getElementById('sticky-atc-btn');

    this.selectedOptions = {};
    this.selectedSellingPlan = null;
    this.currentVariant = null;

    this.bindOptions();
    this.bindSellingPlans();
    this.bindForm();
    this.bindGallery();
    this.bindStickyATC();
    this.bindAccordions();
    this.initAnimations();
  }

  bindOptions() {
    this.optionSelectors.forEach(btn => {
      btn.addEventListener('click', () => {
        const option = btn.dataset.option;
        const value = btn.dataset.value;

        // Deselect siblings
        this.el.querySelectorAll(`[data-option="${option}"]`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        this.selectedOptions[option] = value;

        // Update label
        const labelEl = this.el.querySelector(`[data-option-label="${option}"]`);
        if (labelEl) labelEl.textContent = value;

        this.updateVariant();
      });
    });

    // Select first available option
    const optionGroups = {};
    this.optionSelectors.forEach(btn => {
      const opt = btn.dataset.option;
      if (!optionGroups[opt]) {
        optionGroups[opt] = btn;
        btn.click();
      }
    });
  }

  bindSellingPlans() {
    this.sellingPlanInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.selectedSellingPlan = input.value || null;
        const parent = input.closest('.product__selling-plan-option');
        this.el.querySelectorAll('.product__selling-plan-option').forEach(el => el.classList.remove('selected'));
        if (parent) parent.classList.add('selected');
        this.updatePriceForPlan();
      });
    });

    // Auto-select first
    const first = this.sellingPlanInputs[0];
    if (first) {
      first.checked = true;
      first.dispatchEvent(new Event('change'));
    }
  }

  updatePriceForPlan() {
    if (!this.currentVariant) return;
    const planId = this.selectedSellingPlan;
    if (!planId) {
      this.displayVariantPrice(this.currentVariant);
      return;
    }
    // Find selling plan price from product data
    const allGroups = this.productData.selling_plan_groups || [];
    for (const group of allGroups) {
      for (const plan of group.selling_plans) {
        if (String(plan.id) === String(planId)) {
          const priceAdjustments = plan.price_adjustments;
          if (priceAdjustments && priceAdjustments.length > 0) {
            const adj = priceAdjustments[0];
            let price = this.currentVariant.price;
            if (adj.value_type === 'percentage') price = Math.round(price * (100 - adj.value) / 100);
            else if (adj.value_type === 'fixed_amount') price = price - adj.value;
            else if (adj.value_type === 'price') price = adj.value;
            if (this.priceEl) this.priceEl.textContent = Utils.formatMoney(price);
            if (this.comparePriceEl) {
              this.comparePriceEl.textContent = Utils.formatMoney(this.currentVariant.price);
              this.comparePriceEl.style.display = '';
            }
            const savings = this.currentVariant.price - price;
            if (this.savingsEl && savings > 0) {
              this.savingsEl.textContent = `Save ${Utils.formatMoney(savings)}`;
              this.savingsEl.style.display = '';
            }
          }
          return;
        }
      }
    }
    this.displayVariantPrice(this.currentVariant);
  }

  updateVariant() {
    const optionValues = Object.values(this.selectedOptions);
    const variant = this.productData.variants?.find(v =>
      v.options.every((opt, i) => opt === optionValues[i])
    );
    this.currentVariant = variant || null;
    this.displayVariantPrice(this.currentVariant);
    this.updateAvailability();
    this.updateUrl();
    this.updateVariantImage();
  }

  displayVariantPrice(variant) {
    if (!variant) return;
    if (this.priceEl) this.priceEl.textContent = Utils.formatMoney(variant.price);
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      if (this.comparePriceEl) {
        this.comparePriceEl.textContent = Utils.formatMoney(variant.compare_at_price);
        this.comparePriceEl.style.display = '';
      }
      const savings = variant.compare_at_price - variant.price;
      if (this.savingsEl) {
        this.savingsEl.textContent = `Save ${Utils.formatMoney(savings)}`;
        this.savingsEl.style.display = '';
      }
    } else {
      if (this.comparePriceEl) this.comparePriceEl.style.display = 'none';
      if (this.savingsEl) this.savingsEl.style.display = 'none';
    }
    if (this.stickyATC) {
      const stickyPrice = this.stickyATC.querySelector('[data-sticky-price]');
      if (stickyPrice) stickyPrice.textContent = Utils.formatMoney(variant.price);
    }
    if (this.variantInput) this.variantInput.value = variant.id;
    // Update selling plan prices
    this.updatePriceForPlan();
  }

  updateAvailability() {
    if (!this.currentVariant) {
      this.setATCState('unavailable');
      return;
    }
    if (this.currentVariant.available) {
      this.setATCState('available');
      this.updateStockDisplay(this.currentVariant);
    } else {
      this.setATCState('sold-out');
    }
  }

  setATCState(state) {
    if (!this.atcBtn) return;
    const states = {
      available: { text: window.variantStrings?.addToCart || 'Add to Cart', disabled: false },
      'sold-out': { text: window.variantStrings?.soldOut || 'Sold Out', disabled: true },
      unavailable: { text: window.variantStrings?.unavailable || 'Unavailable', disabled: true },
      loading: { text: 'Adding...', disabled: true }
    };
    const s = states[state] || states.available;
    this.atcBtn.querySelector('[data-atc-text]').textContent = s.text;
    this.atcBtn.disabled = s.disabled;
    if (this.stickyATCBtn) {
      this.stickyATCBtn.textContent = s.text;
      this.stickyATCBtn.disabled = s.disabled;
    }
  }

  updateStockDisplay(variant) {
    if (!this.stockEl) return;
    const qty = variant.inventory_quantity;
    const policy = variant.inventory_policy;
    if (!qty && policy === 'deny') return;
    this.stockEl.className = 'product__stock';
    if (qty > 20) {
      this.stockEl.classList.add('product__stock--in-stock');
      this.stockEl.querySelector('[data-stock-text]').textContent = 'In Stock — Ready to Ship';
    } else if (qty > 0) {
      this.stockEl.classList.add('product__stock--low-stock');
      this.stockEl.querySelector('[data-stock-text]').textContent = `Low Stock — Only ${qty} left`;
    } else {
      this.stockEl.classList.add('product__stock--out-of-stock');
      this.stockEl.querySelector('[data-stock-text]').textContent = 'Out of Stock';
    }
    this.stockEl.style.display = 'flex';
  }

  updateUrl() {
    if (!this.currentVariant) return;
    const url = Utils.getUrlWithVariant(window.location.pathname, this.currentVariant.id);
    window.history.replaceState({ variantId: this.currentVariant.id }, '', url);
  }

  updateVariantImage() {
    if (!this.currentVariant?.featured_image) return;
    const imgSrc = this.currentVariant.featured_image.src;
    if (this.mainImage) {
      this.mainImage.src = imgSrc;
    }
    // Activate matching thumbnail
    this.thumbnails.forEach(thumb => {
      if (thumb.dataset.thumbnail === imgSrc) {
        thumb.click();
      }
    });
  }

  bindForm() {
    if (!this.form) return;
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.atcBtn?.disabled) return;

      this.setATCState('loading');

      const formData = new FormData(this.form);
      const items = [{
        id: parseInt(formData.get('id')),
        quantity: parseInt(formData.get('quantity') || 1)
      }];
      const sellingPlan = formData.get('selling_plan');
      if (sellingPlan) items[0].selling_plan = parseInt(sellingPlan);

      try {
        const result = await Cart.add(items);
        if (result.status) {
          Toast.error(result.description || 'Could not add to cart');
          this.setATCState('available');
        } else {
          await window.cartDrawer?.refresh();
          window.cartDrawer?.open();
          Toast.success('Added to cart!');
          this.setATCState('available');
        }
      } catch (err) {
        Toast.error('Something went wrong. Please try again.');
        this.setATCState('available');
      }
    });
  }

  bindGallery() {
    this.thumbnails.forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        const src = thumb.querySelector('img')?.src;
        if (this.mainImage && src) {
          this.mainImage.style.opacity = '0';
          setTimeout(() => {
            this.mainImage.src = src;
            this.mainImage.style.opacity = '1';
          }, 150);
        }
        this.thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    // Zoom
    if (this.zoomBtn && this.zoomModal && this.zoomImg) {
      this.zoomBtn.addEventListener('click', () => {
        this.zoomImg.src = this.mainImage?.src || '';
        this.zoomModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
      this.zoomModal.querySelector('[data-zoom-close]')?.addEventListener('click', () => this.closeZoom());
      this.zoomModal.addEventListener('click', (e) => {
        if (e.target === this.zoomModal) this.closeZoom();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeZoom(); });
    }

    // Touch swipe on main image
    if (this.mainImage) {
      let startX = 0;
      this.mainImage.parentElement.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
      this.mainImage.parentElement.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) < 50) return;
        const thumbArr = Array.from(this.thumbnails);
        const current = thumbArr.findIndex(t => t.classList.contains('active'));
        const next = dx < 0 ? Math.min(current + 1, thumbArr.length - 1) : Math.max(current - 1, 0);
        thumbArr[next]?.click();
      });
    }
  }

  closeZoom() {
    if (this.zoomModal) this.zoomModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  bindStickyATC() {
    if (!this.stickyATC) return;
    const atcSection = document.querySelector('[data-product-atc-section]');
    if (!atcSection) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      this.stickyATC.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(atcSection);

    this.stickyATCBtn?.addEventListener('click', () => {
      this.form?.dispatchEvent(new Event('submit'));
    });
  }

  bindAccordions() {
    document.querySelectorAll('.product__tab-header').forEach(header => {
      header.addEventListener('click', () => {
        const tab = header.closest('.product__details-tab');
        const isOpen = tab.classList.contains('is-open');
        tab.classList.toggle('is-open', !isOpen);
        header.setAttribute('aria-expanded', !isOpen);
      });
    });
  }

  initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));
  }
}

/* ─── HEADER ─────────────────────────────────────────────── */

class Header {
  constructor() {
    this.header = document.querySelector('.header');
    this.menuBtn = document.querySelector('.header__menu-btn');
    this.mobileNav = document.querySelector('.mobile-nav');
    this.mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    this.searchBtn = document.querySelector('[data-search-open]');
    this.searchModal = document.getElementById('search-modal');
    this.searchClose = document.getElementById('search-modal-close');
    this.searchInput = document.getElementById('search-modal-input');
    this.bindEvents();
  }

  bindEvents() {
    // Scroll
    window.addEventListener('scroll', Utils.debounce(() => {
      this.header?.classList.toggle('scrolled', window.scrollY > 10);
    }, 50));

    // Mobile nav
    this.menuBtn?.addEventListener('click', () => this.openNav());
    this.mobileNavOverlay?.addEventListener('click', () => this.closeNav());
    document.getElementById('mobile-nav-close')?.addEventListener('click', () => this.closeNav());

    // Search
    this.searchBtn?.addEventListener('click', (e) => { e.preventDefault(); this.openSearch(); });
    this.searchClose?.addEventListener('click', () => this.closeSearch());
    this.searchModal?.querySelector('.search-modal__overlay')?.addEventListener('click', () => this.closeSearch());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeSearch(); });
  }

  openNav() {
    this.mobileNav?.classList.add('is-open');
    this.mobileNavOverlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  closeNav() {
    this.mobileNav?.classList.remove('is-open');
    this.mobileNavOverlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openSearch() {
    this.searchModal?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.searchInput?.focus(), 100);
  }

  closeSearch() {
    this.searchModal?.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

/* ─── PREDICTIVE SEARCH ──────────────────────────────────── */

class PredictiveSearch {
  constructor(input, resultsEl) {
    this.input = input;
    this.resultsEl = resultsEl;
    this.abortController = null;
    input.addEventListener('input', Utils.debounce(this.search.bind(this), 300));
    input.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  async search() {
    const query = this.input.value.trim();
    if (!query || query.length < 2) { this.resultsEl.innerHTML = ''; return; }
    this.abortController?.abort();
    this.abortController = new AbortController();
    try {
      const url = `${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5&section_id=predictive-search`;
      const res = await fetch(url, { signal: this.abortController.signal });
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const results = doc.querySelector('[data-predictive-search-results]');
      this.resultsEl.innerHTML = results?.innerHTML || '';
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      window.location.href = `/search?q=${encodeURIComponent(this.input.value)}`;
    }
  }
}

/* ─── QUANTITY SELECTOR ──────────────────────────────────── */

function initQuantitySelectors() {
  document.querySelectorAll('.quantity').forEach(widget => {
    const input = widget.querySelector('.quantity__input');
    if (!input) return;
    widget.querySelector('[data-quantity-dec]')?.addEventListener('click', () => {
      input.value = Math.max(parseInt(input.min || 1), parseInt(input.value) - 1);
      input.dispatchEvent(new Event('change'));
    });
    widget.querySelector('[data-quantity-inc]')?.addEventListener('click', () => {
      const max = input.max ? parseInt(input.max) : Infinity;
      input.value = Math.min(max, parseInt(input.value) + 1);
      input.dispatchEvent(new Event('change'));
    });
  });
}

/* ─── INIT ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Header
  window.siteHeader = new Header();

  // Cart drawer
  window.cartDrawer = new CartDrawer();

  // Product form
  const productFormEl = document.querySelector('[data-product-form-wrapper]');
  if (productFormEl) {
    window.productForm = new ProductForm(productFormEl);
  }

  // Quantity selectors
  initQuantitySelectors();

  // Predictive search
  const searchInput = document.getElementById('search-modal-input');
  const searchResults = document.getElementById('search-modal-results');
  if (searchInput && searchResults) {
    new PredictiveSearch(searchInput, searchResults);
  }

  // Announce cart refresh on page load
  Cart.get().then(cart => {
    window.cartDrawer?.updateCount(cart.item_count);
    window.cartDrawer?.updateSubtotal(cart.total_price);
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));
});
