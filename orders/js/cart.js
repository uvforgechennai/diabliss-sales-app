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

    const hasItems = totals.items.length > 0;
    const proceedBtn = document.getElementById('proceed-btn');
    proceedBtn.disabled = !(hasItems && isFormValid());

    return totals;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCatalog() {
    const container = document.getElementById('catalog-container');
    container.innerHTML = PRODUCT_CATALOG.map(function (category) {
      const productsHtml = category.products.map(function (product) {
        const img = product.image
          ? '<img class="product-thumb" src="' + product.image + '" alt="' + escapeHtml(product.name) + '" loading="lazy">'
          : '';
        return '<div class="product-row" data-product-id="' + product.id + '">' +
          img +
          '<div class="product-info">' +
            '<span class="product-name">' + escapeHtml(product.name) + '</span>' +
            '<span class="product-mrp">₹' + product.mrp + '</span>' +
          '</div>' +
          '<div class="stepper">' +
            '<button type="button" class="stepper-btn stepper-minus" data-action="minus" data-id="' + product.id + '" aria-label="Decrease quantity">−</button>' +
            '<span class="stepper-qty" id="qty-' + product.id + '">0</span>' +
            '<button type="button" class="stepper-btn stepper-plus" data-action="plus" data-id="' + product.id + '" aria-label="Increase quantity">+</button>' +
          '</div>' +
        '</div>';
      }).join('');

      const categoryImg = category.image
        ? '<img class="category-image" src="' + category.image + '" alt="' + escapeHtml(category.name) + '" loading="lazy">'
        : '';

      return '<div class="category-section" id="category-' + category.id + '">' +
        categoryImg +
        '<h3 class="category-title">' + escapeHtml(category.name) + (category.subtitle ? ' <span class="category-subtitle">(' + escapeHtml(category.subtitle) + ')</span>' : '') + '</h3>' +
        '<div class="product-list">' + productsHtml + '</div>' +
      '</div>';
    }).join('');

    container.addEventListener('click', function (event) {
      const btn = event.target.closest('.stepper-btn');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const delta = btn.getAttribute('data-action') === 'plus' ? 1 : -1;
      changeQty(id, delta);
    });
  }

  function render() {
    PRODUCT_CATALOG.forEach(function (category) {
      category.products.forEach(function (product) {
        const el = document.getElementById('qty-' + product.id);
        if (el) el.textContent = getQty(product.id);
      });
    });
    renderSummary();
  }

  function init() {
    renderCatalog();
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
