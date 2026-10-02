const API_BASE = "/api";
let PRODUCTS = [];

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("leles_cart") || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(c) {
  localStorage.setItem("leles_cart", JSON.stringify(c));
  updateCartCount();
}

function money(n) {
  return "K" + Number(n || 0).toFixed(2);
}

function updateCartCount() {
  const n = getCart().reduce((s, x) => s + Number(x.qty || 0), 0);
  document.querySelectorAll("#cartCount").forEach(e => e.textContent = n);
}

async function loadProducts() {
  try {
    const r = await fetch(API_BASE + "/products");
    const d = await r.json();
    if (d.success) {
      PRODUCTS = d.products || [];
      return true;
    }
  } catch (e) {
    console.error("Product API error:", e);
  }
  return false;
}

function addToCart(id) {
  const p = PRODUCTS.find(x => Number(x.id) === Number(id));
  if (!p) return;

  const c = getCart();
  const item = c.find(x => Number(x.id) === Number(id));

  if (item) {
    item.qty = Number(item.qty || 0) + 1;
  } else {
    c.push({
      id: Number(p.id),
      name: p.name,
      category: p.category,
      price: Number(p.price),
      qty: 1
    });
  }

  saveCart(c);
  alert(p.name + " added to cart.");
}

function changeQty(id, delta) {
  const c = getCart();
  const item = c.find(x => Number(x.id) === Number(id));

  if (!item) return;

  item.qty = Number(item.qty || 0) + delta;

  saveCart(c.filter(x => x.qty > 0));
  renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter(x => Number(x.id) !== Number(id)));
  renderCart();
}

function renderCart() {
  const el = document.getElementById("cart");
  if (!el) return;

  const c = getCart();

  if (!c.length) {
    el.innerHTML = `
      <div class="empty">
        Your cart is empty.
        <br><br>
        <a href="products.html">Shop products</a>
      </div>`;
    updateCartCount();
    return;
  }

  let total = 0;

  el.innerHTML = c.map(x => {
    const qty = Number(x.qty || 0);
    const subtotal = Number(x.price || 0) * qty;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <strong>${escapeHtml(x.name)}</strong>
          <small>${escapeHtml(x.category || "")}</small>
        </div>

        <div class="qty-controls">
          <button type="button" onclick="changeQty(${Number(x.id)}, -1)">−</button>
          <span>${qty}</span>
          <button type="button" onclick="changeQty(${Number(x.id)}, 1)">+</button>
        </div>

        <strong>${money(subtotal)}</strong>

        <button type="button" class="remove-btn"
          onclick="removeFromCart(${Number(x.id)})">Remove</button>
      </div>`;
  }).join("") + `
    <div class="total">
      <span>Total</span>
      <strong>${money(total)}</strong>
    </div>`;

  updateCartCount();
}


function addCheckoutEnhancements() {
  if (document.getElementById("lelesCheckoutEnhancements")) return;

  const style = document.createElement("style");
  style.id = "lelesCheckoutEnhancements";
  style.textContent = `
    .checkout-card {
      background: #fff;
      border: 1px solid #eadfe4;
      border-radius: 18px;
      padding: 22px;
      margin-top: 20px;
      box-shadow: 0 8px 28px rgba(40, 25, 35, .07);
    }
    .checkout-card h2 {
      margin: 0 0 6px;
    }
    .checkout-card .checkout-subtitle {
      margin: 0 0 18px;
      color: #6b6268;
      font-size: .95rem;
    }
    #checkoutForm {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      align-items: end;
    }
    #checkoutForm input,
    #checkoutForm select,
    #checkoutForm textarea {
      width: 100%;
      min-height: 46px;
      box-sizing: border-box;
      border: 1px solid #d9cdd3;
      border-radius: 10px;
      padding: 11px 12px;
      font: inherit;
      background: #fff;
    }
    #checkoutForm textarea {
      min-height: 92px;
      resize: vertical;
    }
    #checkoutForm input:focus,
    #checkoutForm select:focus,
    #checkoutForm textarea:focus {
      outline: 2px solid rgba(143,49,93,.18);
      border-color: #8f315d;
    }
    #checkoutForm .checkout-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    #checkoutForm .checkout-field label {
      font-weight: 700;
      font-size: .88rem;
    }
    #checkoutForm .checkout-full {
      grid-column: 1 / -1;
    }
    #checkoutForm button[type="submit"] {
      min-height: 48px;
      border: 0;
      border-radius: 10px;
      padding: 12px 18px;
      background: #8f315d;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    #checkoutForm button[type="submit"]:disabled {
      opacity: .65;
      cursor: wait;
    }
    .lele-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(18, 12, 16, .62);
      display: grid;
      place-items: center;
      padding: 18px;
    }
    .lele-order-modal {
      width: min(460px, 100%);
      background: #fff;
      border-radius: 20px;
      padding: 26px;
      box-shadow: 0 20px 60px rgba(0,0,0,.28);
      text-align: center;
    }
    .lele-order-icon {
      width: 58px;
      height: 58px;
      margin: 0 auto 12px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #e7f8ed;
      color: #168044;
      font-size: 30px;
      font-weight: 800;
    }
    .lele-order-modal h2 { margin: 0 0 8px; }
    .lele-order-modal p { color: #655c62; margin: 7px 0; }
    .lele-order-details {
      text-align: left;
      background: #faf7f8;
      border-radius: 12px;
      padding: 14px;
      margin: 16px 0;
      line-height: 1.7;
    }
    .lele-order-modal .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .lele-order-modal .modal-actions button,
    .lele-order-modal .modal-actions a {
      border: 0;
      border-radius: 10px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .lele-wa-btn { background: #25d366; color: #083b20; }
    .lele-close-btn { background: #eee8eb; color: #30272d; }

    @media (max-width: 700px) {
      .checkout-card { padding: 16px; border-radius: 14px; }
      #checkoutForm { grid-template-columns: 1fr; gap: 12px; }
      #checkoutForm .checkout-full { grid-column: auto; }
      #checkoutForm button[type="submit"] { width: 100%; }
      .lele-order-modal { padding: 21px; }
    }
  `;
  document.head.appendChild(style);
}

function showOrderConfirmation(orderNumber, total, paymentMethod, whatsappUrl) {
  const old = document.getElementById("leleOrderConfirmation");
  if (old) old.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "leleOrderConfirmation";
  backdrop.className = "lele-modal-backdrop";
  backdrop.innerHTML = `
    <div class="lele-order-modal" role="dialog" aria-modal="true" aria-labelledby="leleOrderTitle">
      <div class="lele-order-icon">✓</div>
      <h2 id="leleOrderTitle">Order confirmed!</h2>
      <p>Your order has been recorded successfully.</p>
      <div class="lele-order-details">
        <div><strong>Order:</strong> ${escapeHtml(orderNumber)}</div>
        <div><strong>Total:</strong> ${money(total)}</div>
        <div><strong>Payment:</strong> ${escapeHtml(paymentMethod)}</div>
        <div><strong>Status:</strong> Pending</div>
      </div>
      <p>Continue to WhatsApp to send the order details to Lele's Cosmetics.</p>
      <div class="modal-actions">
        <a class="lele-wa-btn" href="${whatsappUrl}" target="_blank" rel="noopener">Open WhatsApp</a>
        <button type="button" class="lele-close-btn" id="leleCloseConfirmation">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  document.getElementById("leleCloseConfirmation")?.addEventListener("click", () => {
    backdrop.remove();
  });

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.remove();
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  const search = (document.getElementById("productSearch")?.value || "")
    .toLowerCase().trim();

  const category = document.getElementById("categoryFilter")?.value || "all";

  const list = PRODUCTS.filter(p => {
    const text = `${p.name} ${p.category} ${p.description || ""}`.toLowerCase();
    return (!search || text.includes(search)) &&
           (category === "all" || p.category === category);
  });

  const count = document.getElementById("resultCount");
  if (count) {
    count.textContent =
      `${list.length} product${list.length === 1 ? "" : "s"} available`;
  }

  if (!list.length) {
    el.innerHTML = `<div class="empty">No products found. Try another search.</div>`;
    return;
  }

  el.innerHTML = list.map(p => {
    const image = p.image_url
      ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<span class="photo-label">${escapeHtml(p.category || "PRODUCT")}</span>`;

    return `
      <article class="card">
        <div class="product-photo">${image}</div>
        <div class="card-body">
          <div class="category">${escapeHtml(p.category || "")}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="description">
            ${escapeHtml(p.description || "A beautiful addition to your everyday beauty routine.")}
          </p>
          <div class="price-row">
            <span class="price">${money(p.price)}</span>
            <button class="btn" type="button"
              onclick="addToCart(${Number(p.id)})">Add to cart</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

async function submitOrder(event) {
  event.preventDefault();

  const cart = getCart();

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const customerName = document.getElementById("customerName");
  const phone = document.getElementById("phone");
  const location = document.getElementById("location");
  const payment = document.getElementById("payment");
  const notes = document.getElementById("notes");

  if (!customerName?.value.trim() ||
      !phone?.value.trim() ||
      !location?.value.trim() ||
      !payment?.value) {
    alert("Please complete all required checkout fields.");
    return;
  }

  const payload = {
    customer: {
      name: customerName.value.trim(),
      phone: phone.value.trim(),
      delivery_location: location.value.trim()
    },
    payment_method: payment.value,
    notes: notes?.value.trim() || "",
    items: cart.map(x => ({
      product_id: Number(x.id),
      quantity: Number(x.qty)
    }))
  };

  const button = event.submitter || document.querySelector(
    '#checkoutForm button[type="submit"]'
  );

  if (button) {
    button.disabled = true;
    button.textContent = "Processing order...";
  }

  try {
    const response = await fetch(API_BASE + "/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Order could not be created.");
    }

    const lines = cart.map(x =>
      `${x.name} x${x.qty} = ${money(Number(x.price) * Number(x.qty))}`
    ).join("\n");

    const message =
      `Hello Lele's Cosmetics!\n\n` +
      `I have placed order ${result.order_number}.\n\n` +
      `${lines}\n\n` +
      `Total: ${money(result.total)}\n` +
      `Name: ${payload.customer.name}\n` +
      `Phone: ${payload.customer.phone}\n` +
      `Delivery: ${payload.customer.delivery_location}\n` +
      `Payment: ${payload.payment_method}` +
      (payload.notes ? `\nNotes: ${payload.notes}` : "");

    localStorage.removeItem("leles_cart");
    updateCartCount();
    renderCart();

    const whatsappUrl =
      "https://wa.me/260978955714?text=" + encodeURIComponent(message);

    showOrderConfirmation(
      result.order_number,
      result.total,
      payload.payment_method,
      whatsappUrl
    );

  } catch (error) {
    console.error("Checkout error:", error);
    alert(error.message || "Could not connect to the online order system.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Place Order on WhatsApp";
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  addCheckoutEnhancements();
  updateCartCount();

  const productsEl = document.getElementById("products");

  if (productsEl) {
    const ok = await loadProducts();

    if (ok) {
      renderProducts();

      document.getElementById("productSearch")
        ?.addEventListener("input", renderProducts);

      document.getElementById("categoryFilter")
        ?.addEventListener("change", renderProducts);
    } else {
      productsEl.innerHTML =
        `<div class="empty">Products could not be loaded. Please refresh the page.</div>`;
    }
  }

  if (document.getElementById("cart")) {
    renderCart();
  }

  // Make sure the checkout payment options are always available.
  // This also fixes older checkout HTML where the <select> exists
  // but has no <option> elements.
  const paymentSelect = document.getElementById("payment");

  if (paymentSelect) {
    const paymentOptions = [
      { value: "Mobile Money", label: "Mobile Money" },
      { value: "Cash on Delivery", label: "Cash on Delivery" }
    ];

    // Only add the options when they are missing.
    if (paymentSelect.options.length === 0) {
      paymentSelect.innerHTML =
        '<option value="" disabled selected>Select payment method</option>' +
        paymentOptions.map(option =>
          `<option value="${option.value}">${option.label}</option>`
        ).join("");
    }
  }

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", submitOrder);
  }
});
