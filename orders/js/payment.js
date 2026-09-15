const Payment = (function () {

  function showError(msg) {
    const el = document.getElementById('payment-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function clearError() {
    const el = document.getElementById('payment-error');
    el.hidden = true;
    el.textContent = '';
  }

  function getFormData() {
    return {
      name: document.getElementById('fullName').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      email: document.getElementById('email').value.trim(),
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value,
      pincode: document.getElementById('pincode').value.trim()
    };
  }

  function setProcessing(isProcessing) {
    const btn = document.getElementById('proceed-btn');
    btn.disabled = isProcessing || !(Cart.isFormValid() && Cart.computeTotals().items.length > 0);
    btn.textContent = isProcessing ? 'Processing…' : 'Proceed to Pay';
  }

  function submitOrderToBackend(orderPayload) {
    return fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(orderPayload)
    }).then(function (res) { return res.json(); });
  }

  function openCheckout() {
    clearError();
    if (!Cart.isFormValid()) {
      showError('Please fill in all required fields.');
      return;
    }
    const totals = Cart.computeTotals();
    if (totals.items.length === 0) {
      showError('Please add at least one product to your order.');
      return;
    }

    const customer = getFormData();

    const options = {
      key: CONFIG.RAZORPAY_KEY,
      amount: Math.round(totals.finalAmount * 100),
      currency: CONFIG.CURRENCY,
      name: CONFIG.BUSINESS_NAME,
      description: 'Order Payment',
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.whatsapp
      },
      notes: {
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode
      },
      theme: { color: '#1a3c6e' },
      handler: function (response) {
        setProcessing(true);
        const orderPayload = {
          name: customer.name,
          whatsapp: customer.whatsapp,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          products: totals.items,
          mrpTotal: totals.mrpTotal,
          discountPercent: totals.discountPercent,
          discountAmount: totals.discountAmount,
          finalAmount: totals.finalAmount,
          razorpayPaymentId: response.razorpay_payment_id
        };

        submitOrderToBackend(orderPayload)
          .then(function (result) {
            if (!result || !result.orderId) {
              throw new Error('Invalid response from server');
            }
            sessionStorage.setItem(
              'diabliss_order_' + result.orderId,
              JSON.stringify(Object.assign({}, orderPayload, { orderId: result.orderId }))
            );
            window.location.href = 'confirm.html?order_id=' + encodeURIComponent(result.orderId);
          })
          .catch(function () {
            setProcessing(false);
            showError(
              'Your payment was successful (Payment ID: ' + response.razorpay_payment_id + ') but we could not ' +
              'record your order automatically. Please WhatsApp us at ' + CONFIG.WHATSAPP_SUPPORT +
              ' with this Payment ID so we can confirm your order.'
            );
          });
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setProcessing(false);
      showError('Payment failed: ' + (response.error && response.error.description ? response.error.description : 'Please try again.'));
    });

    rzp.open();
  }

  function init() {
    document.getElementById('proceed-btn').addEventListener('click', openCheckout);
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', Payment.init);
