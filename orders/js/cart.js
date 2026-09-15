const Cart = (function () {
  const qtyById = {};
  const flatProducts = {};

  PRODUCT_CATALOG.forEach(function (category) {
    category.products.forEach(function (product) {
      flatProducts[product.id] = {
        id: product.id,
        name: product.name,
        mrp: product.mrp,
        category: category.name
      };
      qtyById[product.id] = 0;
    });
  });

  function getQty(id) {
    return qtyById[id] || 0;
  }

  function setQty(id, qty) {
    if (!(id in flatProducts)) return;
    const clamped = Math.max(0, Math.min(999, Math.floor(qty) || 0));
    qtyById[id] = clamped;
    render();
  }

  function changeQty(id, delta) {
    setQty(id, getQty(id) + delta);
  }

  function getRefCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') || '').toLowerCase();
  }

  function getDiscountPercent(mrpTotal) {
    const ref = getRefCode();
    if (CONFIG.VIP_DISCOUNTS[ref] !== undefined) {
      return CONFIG.VIP_DISCOUNTS[ref];
    }
    if (mrpTotal >= CONFIG.DISCOUNT_THRESHOLD) {
      return CONFIG.DEFAULT_DISCOUNT;
    }
    return 0;
  }

  function getLineItems() {
    return Object.keys(flatProducts)
      .filter(function (id) { return getQty(id) > 0; })
      .map(function (id) {
        const product = flatProducts[id];
        const qty = getQty(id);
        return {
          id: id,
          name: product.name,
          mrp: product.mrp,
          qty: qty,
          lineTotal: product.mrp * qty
        };
      });
  }

  function computeTotals() {
    const items = getLineItems();
    const mrpTotal = items.reduce(function (sum, item) { return sum + item.lineTotal; }, 0);
    const discountPercent = mrpTotal > 0 ? getDiscountPercent(mrpTotal) : 0;
    const discountAmount = Math.round(mrpTotal * discountPercent) / 100;
    const finalAmount = mrpTotal - discountAmount;
    return {
      items: items,
      mrpTotal: mrpTotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      finalAmount: finalAmount
    };
  }

  function formatRupees(amount) {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function isFormValid() {
    const form = document.getElementById('order-form');
    if (!form) return false;
    const fields = form.querySelectorAll('[required]');
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.checkValidity()) return false;
    }
    return true;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderSummary() {
    const totals = computeTotals();

    const itemsContainer = document.getElementById('summary-items');
    if (totals.items.length === 0) {
      itemsContainer.innerHTML = '<p class="summary-empty">No items added yet</p>';
    } else {
      itemsContainer.innerHTML = totals.items.map(function (item) {
        return '<div class="summary-item">' +
          '<span class="summary-item-name">' + escapeHtml(item.name) + ' × ' + item.qty + '</span>' +
          '<span class="summary-item-total">' + formatRupees(item.lineTotal) + '</span>' +
          '</div>';
      }).join('');
    }

    document.getElementById('summary-mrp').textContent = formatRupees(totals.mrpTotal);
    document.getElementById('summary-final').textContent = formatRupees(totals.finalAmount);

    const discountRow = document.getElementById('summary-discount-row');
    if (totals.discountAmount > 0) {
      discountRow.hidden = false;
      document.getElementById('summary-discount-label').textContent = 'Discount (' + totals.discountPercent + '%)';
      document.getElementById('summary-discount-amount').textContent = '-' + formatRupees(totals.discountAmount);
    } else {
      discountRow.hidden = true;
    }

    const itemCount = totals.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    document.getElementById('toggle-item-count').textContent = itemCount + (itemCount === 1 ? ' item' : ' items');
    document.getElementById('toggle-final-amount').textContent = formatRupees(totals.finalAmount);

    const hasItems = totals.items.length > 0;
    const formValid = isFormValid();
    const proceedBtn = document.getElementById('proceed-btn');
    proceedBtn.disabled = !(hasItems && formValid);

    const hint = document.getElementById('proceed-hint');
    if (!hasItems) {
      hint.textContent = 'Add at least one product to continue';
      hint.hidden = false;
    } else if (!formValid) {
      hint.textContent = 'Please complete your delivery details below';
      hint.hidden = false;
    } else {
      hint.textContent = '';
      hint.hidden = true;
    }

    return totals;
  }

  function renderCategoryNav() {
    const nav = document.getElementById('category-nav');
    nav.innerHTML = PRODUCT_CATALOG.map(function (category) {
      return '<a href="#category-' + category.id + '" class="category-pill" data-target="category-' + category.id + '">' +
        escapeHtml(category.name) + '</a>';
    }).join('');
  }

  function renderCatalog() {
    const container = document.getElementById('catalog-container');
    container.innerHTML = PRODUCT_CATALOG.map(function (category) {
      const cardsHtml = category.products.map(function (product) {
        const img = product.image
          ? '<img class="product-card-image" src="' + product.image + '" alt="' + escapeHtml(product.name) + '" loading="lazy">'
          : '';
        return '<div class="product-card" id="card-' + product.id + '">' +
          img +
          '<div class="product-card-body">' +
            '<span class="product-card-name">' + escapeHtml(product.name) + '</span>' +
            '<span class="product-card-mrp">₹' + product.mrp + '</span>' +
          '</div>' +
          '<div class="qty-control" id="qty-control-' + product.id + '">' +
            '<button type="button" class="add-btn" data-action="plus" data-id="' + product.id + '">+ Add</button>' +
            '<div class="stepper">' +
              '<button type="button" class="stepper-btn stepper-minus" data-action="minus" data-id="' + product.id + '" aria-label="Decrease quantity">−</button>' +
              '<span class="stepper-qty" id="qty-' + product.id + '">0</span>' +
              '<button type="button" class="stepper-btn stepper-plus" data-action="plus" data-id="' + product.id + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      const categoryImg = category.image
        ? '<img class="category-image" src="' + category.image + '" alt="' + escapeHtml(category.name) + '" loading="lazy">'
        : '';

      return '<div class="category-section" id="category-' + category.id + '">' +
        categoryImg +
        '<h3 class="category-title">' + escapeHtml(category.name) + (category.subtitle ? ' <span class="category-subtitle">(' + escapeHtml(category.subtitle) + ')</span>' : '') + '</h3>' +
        '<div class="product-grid">' + cardsHtml + '</div>' +
      '</div>';
    }).join('');

    container.addEventListener('click', function (event) {
      const btn = event.target.closest('.stepper-btn, .add-btn');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const delta = btn.getAttribute('data-action') === 'plus' ? 1 : -1;
      changeQty(id, delta);
    });
  }

  function initCategoryNavScroll() {
    const nav = document.getElementById('category-nav');
    nav.addEventListener('click', function (event) {
      const pill = event.target.closest('.category-pill');
      if (!pill) return;
      event.preventDefault();
      const target = document.getElementById(pill.getAttribute('data-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const sections = PRODUCT_CATALOG.map(function (category) {
      return document.getElementById('category-' + category.id);
    }).filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const pills = nav.querySelectorAll('.category-pill');
          pills.forEach(function (pill) {
            pill.classList.toggle('active', pill.getAttribute('data-target') === entry.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  function initSummaryToggle() {
    const panel = document.getElementById('summary-panel');
    const toggle = document.getElementById('summary-toggle');
    toggle.addEventListener('click', function () {
      const expanded = panel.classList.toggle('expanded');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.querySelector('.summary-toggle-icon').textContent = expanded ? '▼' : '▲';
    });
  }

  function render() {
    PRODUCT_CATALOG.forEach(function (category) {
      category.products.forEach(function (product) {
        const qty = getQty(product.id);
        const qtyEl = document.getElementById('qty-' + product.id);
        if (qtyEl) qtyEl.textContent = qty;
        const controlEl = document.getElementById('qty-control-' + product.id);
        if (controlEl) controlEl.classList.toggle('has-qty', qty > 0);
        const cardEl = document.getElementById('card-' + product.id);
        if (cardEl) cardEl.classList.toggle('has-qty', qty > 0);
      });
    });
    renderSummary();
  }

  function init() {
    renderCategoryNav();
    renderCatalog();
    initCategoryNavScroll();
    initSummaryToggle();
    render();

    const form = document.getElementById('order-form');
    form.addEventListener('input', renderSummary);
    form.addEventListener('change', renderSummary);
  }

  return {
    init: init,
    getQty: getQty,
    setQty: setQty,
    changeQty: changeQty,
    computeTotals: computeTotals,
    getDiscountPercent: getDiscountPercent,
    getRefCode: getRefCode,
    isFormValid: isFormValid,
    formatRupees: formatRupees,
    render: render
  };
})();

document.addEventListener('DOMContentLoaded', Cart.init);
