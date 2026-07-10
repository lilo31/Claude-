/* =========================================================
   LEUMX — theme behaviours (deferred, non-blocking)
   Loaded once from layout/theme.liquid with `defer`.
   Each block is a no-op if its markup isn't on the page.
   Liquid-dependent values are read from data-* attributes so
   this file stays static and cacheable.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Header ---------------- */
  document.querySelectorAll('lx-header').forEach(function (root) {
    // Sticky solid-on-scroll
    if (root.getAttribute('data-sticky') === 'true' && !root.classList.contains('is-solid')) {
      var onScroll = function () { root.classList.toggle('is-scrolled', window.scrollY > 24); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Mobile drawer
    var burger = root.querySelector('.lx-header__burger');
    var drawer = root.querySelector('.lx-header__drawer');
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!open));
        drawer.hidden = open;
      });
    }

    // Language dropdown
    var langToggle = root.querySelector('.lx-lang__toggle');
    var langList = root.querySelector('.lx-lang__list');
    if (langToggle && langList) {
      langToggle.addEventListener('click', function () {
        var open = langToggle.getAttribute('aria-expanded') === 'true';
        langToggle.setAttribute('aria-expanded', String(!open));
        langList.hidden = open;
      });
      document.addEventListener('click', function (e) {
        if (!root.contains(e.target)) { langToggle.setAttribute('aria-expanded', 'false'); langList.hidden = true; }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { langToggle.setAttribute('aria-expanded', 'false'); langList.hidden = true; }
      });
    }
  });

  /* ---------------- Product ---------------- */
  var pdp = document.querySelector('[data-lx-product]');
  if (pdp) {
    // Gallery swap
    var thumbs = pdp.querySelectorAll('[data-thumb]');
    var slides = pdp.querySelectorAll('.lx-pdp__slide');
    function showMedia(id) {
      slides.forEach(function (s) {
        var on = s.getAttribute('data-media-id') === String(id);
        s.hidden = !on; s.classList.toggle('is-active', on);
      });
      thumbs.forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-thumb') === String(id));
      });
    }
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { showMedia(t.getAttribute('data-thumb')); });
    });

    // Quantity
    var qtyInput = pdp.querySelector('.lx-qty__input');
    if (qtyInput) {
      var down = pdp.querySelector('[data-qty-down]');
      var up = pdp.querySelector('[data-qty-up]');
      if (down) down.addEventListener('click', function () { qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1); });
      if (up) up.addEventListener('click', function () { qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1; });
    }

    // Variant picker
    var dataEl = pdp.querySelector('[data-lx-variants]');
    var variants = dataEl ? JSON.parse(dataEl.textContent) : [];
    var select = pdp.querySelector('[data-lx-variant-select]');
    var optionInputs = pdp.querySelectorAll('.lx-opt__input');
    var priceEl = pdp.querySelector('[data-lx-price]');
    var addBtn = pdp.querySelector('[data-lx-add]');
    var addText = pdp.querySelector('[data-add-text]');
    var moneyFormat = pdp.getAttribute('data-money-format') || '${{amount}}';
    var i18nAdd = pdp.getAttribute('data-i18n-add') || 'Add to cart';
    var i18nSold = pdp.getAttribute('data-i18n-sold') || 'Sold out';

    function selectedOptions() {
      var opts = [];
      pdp.querySelectorAll('.lx-opt').forEach(function (fs) {
        var checked = fs.querySelector('.lx-opt__input:checked');
        if (checked) opts.push(checked.value);
      });
      return opts;
    }
    function matchVariant(opts) {
      return variants.find(function (v) {
        return (v.options || []).every(function (o, i) { return o === opts[i]; });
      });
    }
    function formatMoney(cents) {
      var v = (cents / 100).toFixed(2);
      return moneyFormat
        .replace(/\{\{\s*amount\s*\}\}/, v)
        .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(cents / 100));
    }
    function syncSelectedLabels() {
      pdp.querySelectorAll('.lx-opt').forEach(function (fs) {
        var checked = fs.querySelector('.lx-opt__input:checked');
        var label = fs.querySelector('[data-opt-selected]');
        if (checked && label) label.textContent = checked.value;
      });
    }
    function update() {
      if (!optionInputs.length) return;
      syncSelectedLabels();
      var v = matchVariant(selectedOptions());
      if (!v) return;
      if (select) select.value = v.id;
      if (priceEl) {
        var html = '<span class="lx-price__now">' + formatMoney(v.price) + '</span>';
        if (v.compare_at_price && v.compare_at_price > v.price) {
          html = '<span class="lx-price__now lx-price--sale">' + formatMoney(v.price) + '</span>' +
                 ' <s class="lx-price__was">' + formatMoney(v.compare_at_price) + '</s>';
        }
        priceEl.innerHTML = html;
      }
      if (addBtn && addText) {
        addBtn.disabled = !v.available;
        addText.textContent = v.available ? i18nAdd : i18nSold;
      }
      if (history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', v.id);
        history.replaceState({}, '', url);
      }
    }
    optionInputs.forEach(function (inp) { inp.addEventListener('change', update); });
  }
})();
