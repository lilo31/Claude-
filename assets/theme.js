/* ==========================================================================
   Revive Theme - Main JavaScript
   ========================================================================== */

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

/* --------------------------------------------------------------------------
   Cart Management
   -------------------------------------------------------------------------- */
const Cart = {
  async get() {
    const res = await fetch('/cart.js');
    return res.json();
  },

  async add(variantId, quantity = 1, properties = {}) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity, properties })
    });
    return res.json();
  },

  async update(updates) {
    const res = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return res.json();
  },

  async change(id, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity })
    });
    return res.json();
  },

  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD'
    }).format(cents / 100);
  }
};

/* --------------------------------------------------------------------------
   Cart Drawer
   -------------------------------------------------------------------------- */
const CartDrawer = {
  el: document.getElementById('cart-drawer'),
  body: document.getElementById('cart-drawer-body'),
  subtotal: document.getElementById('cart-subtotal'),

  open() {
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.refresh();
  },

  close() {
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  async refresh() {
    const cart = await Cart.get();
    this.render(cart);
  },

  render(cart) {
    if (this.subtotal) {
      this.subtotal.textContent = Cart.formatMoney(cart.total_price);
    }

    this.updateCount(cart.item_count);

    if (!this.body) return;

    if (cart.items.length === 0) {
      this.body.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"></path>
          </svg>
          <p class="cart-empty__title">Your cart is empty</p>
          <a href="/collections/all" class="btn btn--outline btn--sm">Continue Shopping</a>
        </div>
      `;
      return;
    }

    const itemsHtml = cart.items.map(item => `
      <div class="cart-item" data-variant-id="${item.variant_id}">
        <a href="${item.url}">
          <img class="cart-item__image" src="${item.image ? item.image.replace('_400x', '_200x') : ''}" alt="${item.title}" width="80" height="107">
        </a>
        <div class="cart-item__details">
          <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-item__variant">${item.variant_title}</p>` : ''}
          <div class="cart-item__price-row">
            <span class="cart-item__price">${Cart.formatMoney(item.final_line_price)}</span>
            <div class="cart-item__qty">
              <button class="cart-item__qty-btn" data-action="decrease" data-id="${item.variant_id}" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-count">${item.quantity}</span>
              <button class="cart-item__qty-btn" data-action="increase" data-id="${item.variant_id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    this.body.innerHTML = itemsHtml;

    // Qty buttons
    this.body.querySelectorAll('.cart-item__qty-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const action = e.target.dataset.action;
        const countEl = e.target.parentElement.querySelector('.cart-item__qty-count');
        const current = parseInt(countEl.textContent);
        const newQty = action === 'increase' ? current + 1 : Math.max(0, current - 1);

        await Cart.change(id, newQty);
        this.refresh();
      });
    });
  },

  updateCount(count) {
    document.querySelectorAll('.site-header__cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  init() {
    if (!this.el) return;

    // Close button
    this.el.querySelector('.cart-drawer__close')?.addEventListener('click', () => this.close());

    // Overlay click
    this.el.querySelector('.cart-drawer__overlay')?.addEventListener('click', () => this.close());

    // Cart button in header
    document.querySelectorAll('[data-cart-trigger]').forEach(btn => {
      btn.addEventListener('click', () => this.open());
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Initial count
    Cart.get().then(cart => this.updateCount(cart.item_count));
  }
};

/* --------------------------------------------------------------------------
   Mobile Menu
   -------------------------------------------------------------------------- */
const MobileMenu = {
  el: document.getElementById('mobile-menu'),

  open() {
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  init() {
    if (!this.el) return;

    document.querySelector('.site-header__hamburger')?.addEventListener('click', () => this.open());
    this.el.querySelector('.mobile-menu__close')?.addEventListener('click', () => this.close());
    this.el.querySelector('.mobile-menu__overlay')?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }
};

/* --------------------------------------------------------------------------
   Add to Cart
   -------------------------------------------------------------------------- */
const AddToCart = {
  init() {
    document.querySelectorAll('[data-add-to-cart]').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        const variantId = form.querySelector('[name="id"]')?.value;
        const qty = parseInt(form.querySelector('[name="quantity"]')?.value || 1);

        if (!variantId) return;

        btn.disabled = true;
        const origText = btn.textContent;
        btn.textContent = 'Adding...';

        try {
          await Cart.add(variantId, qty);
          btn.textContent = 'Added!';
          setTimeout(() => {
            btn.textContent = origText;
            btn.disabled = false;
          }, 1500);
          CartDrawer.open();
        } catch (err) {
          btn.textContent = 'Error';
          setTimeout(() => {
            btn.textContent = origText;
            btn.disabled = false;
          }, 1500);
        }
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Accordion
   -------------------------------------------------------------------------- */
const Accordion = {
  init() {
    document.querySelectorAll('.accordion-item__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.accordion-item');
        const isOpen = item.classList.contains('is-open');

        // Close all others in same group
        const siblings = item.parentElement?.querySelectorAll('.accordion-item');
        siblings?.forEach(sib => sib.classList.remove('is-open'));

        if (!isOpen) item.classList.add('is-open');
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Product Gallery
   -------------------------------------------------------------------------- */
const ProductGallery = {
  init() {
    const thumbs = document.querySelectorAll('.product-gallery__thumb');
    const mainImg = document.querySelector('.product-gallery__main img');

    if (!thumbs.length || !mainImg) return;

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const src = thumb.querySelector('img')?.src;
        if (src) {
          const largeSrc = src.replace('_100x', '_800x').replace('_200x', '_800x');
          mainImg.src = largeSrc;
        }
      });
    });

    // Set first thumb active
    thumbs[0]?.classList.add('active');
  }
};

/* --------------------------------------------------------------------------
   Variant Selector
   -------------------------------------------------------------------------- */
const VariantSelector = {
  init() {
    document.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const group = btn.closest('.variant-buttons');
        group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update hidden select if present
        const selectId = btn.dataset.for;
        if (selectId) {
          const select = document.getElementById(selectId);
          if (select) {
            select.value = btn.dataset.value;
            select.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Native variant select handler
    document.querySelectorAll('[data-variant-select]').forEach(select => {
      select.addEventListener('change', () => {
        const option = select.options[select.selectedIndex];
        const price = option.dataset.price;
        const available = option.dataset.available !== 'false';
        const variantId = option.value;

        // Update price
        const priceEl = document.querySelector('.product-info__price [data-current-price]');
        if (priceEl && price) priceEl.textContent = Cart.formatMoney(parseInt(price));

        // Update hidden input
        const hiddenInput = document.querySelector('[name="id"]');
        if (hiddenInput) hiddenInput.value = variantId;

        // Update ATC button
        const atcBtn = document.querySelector('[data-atc-btn]');
        if (atcBtn) {
          if (!available) {
            atcBtn.textContent = 'Sold Out';
            atcBtn.disabled = true;
          } else {
            atcBtn.textContent = 'Add to Cart';
            atcBtn.disabled = false;
          }
        }
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Quantity Input
   -------------------------------------------------------------------------- */
const QtyInput = {
  init() {
    document.querySelectorAll('.product-info__qty').forEach(wrapper => {
      const input = wrapper.querySelector('.product-info__qty-input');
      const decrease = wrapper.querySelector('[data-qty="decrease"]');
      const increase = wrapper.querySelector('[data-qty="increase"]');

      decrease?.addEventListener('click', () => {
        const val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
      });

      increase?.addEventListener('click', () => {
        const val = parseInt(input.value) || 1;
        input.value = val + 1;
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Announcement Bar Slider
   -------------------------------------------------------------------------- */
const AnnouncementSlider = {
  init() {
    const slides = document.querySelectorAll('.announcement-bar__slide');
    if (slides.length <= 1) return;

    let current = 0;
    slides.forEach((slide, i) => {
      slide.style.display = i === 0 ? 'block' : 'none';
    });

    setInterval(() => {
      slides[current].style.display = 'none';
      current = (current + 1) % slides.length;
      slides[current].style.display = 'block';
    }, 4000);
  }
};

/* --------------------------------------------------------------------------
   Lazy Loading
   -------------------------------------------------------------------------- */
const LazyLoad = {
  init() {
    if ('loading' in HTMLImageElement.prototype) return; // native lazy load

    const images = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
  }
};

/* --------------------------------------------------------------------------
   Filter Toggle (Mobile)
   -------------------------------------------------------------------------- */
const FilterToggle = {
  init() {
    document.querySelectorAll('.filter-group__title').forEach(title => {
      title.addEventListener('click', () => {
        const group = title.closest('.filter-group');
        group.classList.toggle('is-open');
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Newsletter Form
   -------------------------------------------------------------------------- */
const Newsletter = {
  init() {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        const btn = form.querySelector('.newsletter-form__btn');

        if (!email) return;

        const origText = btn.textContent;
        btn.textContent = 'Subscribing...';
        btn.disabled = true;

        // Submit to Shopify newsletter
        try {
          const res = await fetch('/contact#contact_form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              form_type: 'customer',
              utf8: '✓',
              customer: JSON.stringify({ email, tags: 'newsletter' })
            })
          });

          btn.textContent = 'Subscribed!';
          setTimeout(() => {
            btn.textContent = origText;
            btn.disabled = false;
            form.reset();
          }, 3000);
        } catch {
          btn.textContent = origText;
          btn.disabled = false;
        }
      });
    });
  }
};

/* --------------------------------------------------------------------------
   Sticky Header
   -------------------------------------------------------------------------- */
const StickyHeader = {
  header: document.querySelector('.site-header'),
  lastScroll: 0,

  init() {
    if (!this.header) return;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        this.header.classList.add('is-scrolled');
      } else {
        this.header.classList.remove('is-scrolled');
      }

      this.lastScroll = currentScroll;
    }, { passive: true });
  }
};

/* --------------------------------------------------------------------------
   Image Hover (Product Cards)
   -------------------------------------------------------------------------- */
const ProductCardHover = {
  init() {
    // Touch devices: disable hover effects
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.product-card').forEach(card => {
      const hoverImg = card.querySelector('.product-card__image--hover');
      if (!hoverImg) return;

      // Load hover image on first hover
      card.addEventListener('mouseenter', () => {
        if (!hoverImg.src && hoverImg.dataset.src) {
          hoverImg.src = hoverImg.dataset.src;
        }
      }, { once: true });
    });
  }
};

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  CartDrawer.init();
  MobileMenu.init();
  AddToCart.init();
  Accordion.init();
  ProductGallery.init();
  VariantSelector.init();
  QtyInput.init();
  AnnouncementSlider.init();
  LazyLoad.init();
  FilterToggle.init();
  Newsletter.init();
  StickyHeader.init();
  ProductCardHover.init();
});
