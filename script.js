const API_BASE = "/api";
let PRODUCTS = [];

const SMART_VIEWED_KEY = "leles_recently_viewed";
const SMART_FAV_KEY = "leles_favourites";
const SMART_LOW_STOCK_THRESHOLD = 3;

function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (e) {
    return [];
  }
}

function setStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function rememberViewedProduct(id) {
  const items = getStoredArray(SMART_VIEWED_KEY).filter(x => Number(x) !== Number(id));
  items.unshift(Number(id));
  setStoredArray(SMART_VIEWED_KEY, items.slice(0, 8));
}

function getViewedProducts() {
  const ids = getStoredArray(SMART_VIEWED_KEY).map(Number);
  return ids.map(id => PRODUCTS.find(p => Number(p.id) === id)).filter(Boolean);
}

function getFavourites() {
  return getStoredArray(SMART_FAV_KEY).map(Number);
}

function toggleFavourite(id) {
  const ids = getFavourites();
  const n = Number(id);
  const next = ids.includes(n) ? ids.filter(x => x !== n) : [n, ...ids];
  setStoredArray(SMART_FAV_KEY, next.slice(0, 30));
  renderProducts();
  renderSmartSections();
}

function isFavourite(id) {
  return getFavourites().includes(Number(id));
}

function getSmartRecommendations(currentId = null) {
  const current = PRODUCTS.find(p => Number(p.id) === Number(currentId));
  const viewed = getViewedProducts().filter(p => Number(p.id) !== Number(currentId));
  const favIds = new Set(getFavourites());
  const pool = PRODUCTS.filter(p =>
    Number(p.id) !== Number(currentId) &&
    Number(p.active ?? 1) !== 0 &&
    Number(p.stock ?? 0) > 0
  );

  const score = p => {
    let s = 0;
    if (current && String(p.category).toLowerCase() === String(current.category).toLowerCase()) s += 5;
    if (viewed.some(v => String(v.category).toLowerCase() === String(p.category).toLowerCase())) s += 3;
    if (favIds.has(Number(p.id))) s += 2;
    if (Number(p.stock) > SMART_LOW_STOCK_THRESHOLD) s += 1;
    return s;
  };

  return pool
    .sort((a, b) => score(b) - score(a) || Number(b.id) - Number(a.id))
    .slice(0, 4);
}

function smartProductCard(p, mode = "recommendation") {
  const stock = Math.max(0, Number(p.stock || 0));
  const fav = isFavourite(p.id);
  const image = p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
    : `<span class="photo-label">${escapeHtml(p.category || "PRODUCT")}</span>`;

  const stockText = stock === 0
    ? "Out of stock"
    : stock <= SMART_LOW_STOCK_THRESHOLD
      ? `Only ${stock} left`
      : "In stock";

  return `
    <article class="smart-card">
      <div class="smart-photo">${image}
        <button class="smart-fav ${fav ? "active" : ""}" type="button"
          onclick="toggleFavourite(${Number(p.id)})"
          aria-label="${fav ? "Remove from favourites" : "Add to favourites"}">${fav ? "♥" : "♡"}</button>
      </div>
      <div class="smart-body">
        <div class="smart-category">${escapeHtml(p.category || "")}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="smart-price">${money(p.price)}</div>
        <div class="smart-stock ${stock <= SMART_LOW_STOCK_THRESHOLD ? "low" : ""}">${stockText}</div>
        <button class="btn smart-add" type="button"
          ${stock === 0 ? "disabled" : ""}
          onclick="smartAddToCart(${Number(p.id)})">${stock === 0 ? "Out of stock" : "Add to cart"}</button>
      </div>
    </article>`;
}

function smartAddToCart(id) {
  rememberViewedProduct(id);
  addToCart(id);
  renderSmartSections();
}

function addSmartStyles() {
  if (document.getElementById("lelesSmartStyles")) return;
  const style = document.createElement("style");
  style.id = "lelesSmartStyles";
  style.textContent = `
    .smart-section{padding:45px 0 10px}
    .smart-head{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:18px}
    .smart-head h2{margin:4px 0 0;color:#321526;font-size:clamp(1.55rem,3vw,2.1rem)}
    .smart-head p{margin:5px 0 0;color:#766871}
    .smart-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .smart-card{background:#fff;border:1px solid #eadde3;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(50,21,38,.06);display:flex;flex-direction:column}
    .smart-photo{height:190px;background:linear-gradient(145deg,#f8e8ee,#fff);position:relative;display:grid;place-items:center;overflow:hidden}
    .smart-photo img{width:100%;height:100%;object-fit:cover}
    .smart-fav{position:absolute;right:10px;top:10px;width:38px;height:38px;border:0;border-radius:50%;background:#fff;color:#96345f;font-size:23px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.12)}
    .smart-fav.active{background:#96345f;color:#fff}
    .smart-body{padding:14px;display:flex;flex-direction:column;flex:1}
    .smart-category{font-size:.68rem;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#96345f}
    .smart-body h3{font-size:1.05rem;color:#321526;margin:5px 0 8px}
    .smart-price{font-weight:900;font-size:1.08rem;color:#321526}
    .smart-stock{font-size:.78rem;color:#47734f;margin:5px 0 11px}
    .smart-stock.low{color:#b25b20;font-weight:800}
    .smart-add{margin-top:auto;width:100%}
    .smart-add:disabled{opacity:.55;cursor:not-allowed}
    .smart-empty{padding:18px;border:1px dashed #d9cbd2;border-radius:14px;color:#766871;background:#fff}
    .smart-promo{margin:25px 0 10px;padding:22px;border-radius:20px;background:linear-gradient(135deg,#321526,#96345f);color:#fff}
    .smart-promo strong{font-size:1.15rem}
    .smart-promo span{display:block;color:#eadce2;margin-top:4px}
    @media(max-width:900px){.smart-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:520px){.smart-grid{grid-template-columns:1fr 1fr}.smart-photo{height:155px}.smart-head{display:block}}
  `;
  document.head.appendChild(style);
}

function ensureSmartSections() {
  if (!document.getElementById("products")) return;
  if (document.getElementById("lelesSmartSections")) return;

  const wrap = document.createElement("div");
  wrap.id = "lelesSmartSections";
  wrap.className = "container";
  wrap.innerHTML = `
    <section class="smart-section" id="smartRecommendations">
      <div class="smart-head">
        <div><div class="eyebrow">Smart picks</div><h2>You may also like</h2><p>Suggestions based on the products you're browsing.</p></div>
      </div>
      <div class="smart-grid" id="recommendationGrid"></div>
    </section>
    <section class="smart-section" id="smartRecentlyViewed">
      <div class="smart-head">
        <div><div class="eyebrow">Your activity</div><h2>Recently viewed</h2><p>Pick up where you left off.</p></div>
      </div>
      <div class="smart-grid" id="recentGrid"></div>
    </section>
    <div class="smart-promo">
      <strong>✨ Find something you love?</strong>
      <span>Save favourites with the ♥ button and they'll stay on this device for your next visit.</span>
    </div>`;
  const catalogue = document.querySelector('section.container[aria-label="Product catalogue"]');
  if (catalogue) catalogue.insertAdjacentElement("afterend", wrap);
}

function renderSmartSections(currentId = null) {
  const rec = document.getElementById("recommendationGrid");
  const recent = document.getElementById("recentGrid");
  if (!rec || !recent) return;

  const recommendations = getSmartRecommendations(currentId);
  const viewed = getViewedProducts().slice(0, 4);

  rec.innerHTML = recommendations.length
    ? recommendations.map(p => smartProductCard(p)).join("")
    : `<div class="smart-empty">Browse a few products and we'll build recommendations for you.</div>`;

  recent.innerHTML = viewed.length
    ? viewed.map(p => smartProductCard(p, "recent")).join("")
    : `<div class="smart-empty">Products you view will appear here.</div>`;
}

function renderLowStockAdmin() {
  const possible = document.querySelector("#productsTable, #adminProducts, .products-table, [data-products-table]");
  if (!possible) return;

  let box = document.getElementById("smartLowStockPanel");
  if (!box) {
    box = document.createElement("div");
    box.id = "smartLowStockPanel";
    box.style.cssText = "margin:18px 0;padding:18px;border:1px solid #eadde3;border-radius:16px;background:#fff;";
    possible.parentElement?.insertBefore(box, possible);
  }

  const low = PRODUCTS.filter(p => Number(p.stock || 0) <= SMART_LOW_STOCK_THRESHOLD && Number(p.active ?? 1) !== 0);
  box.innerHTML = `
    <strong style="color:#321526">⚠️ Low-stock products</strong>
    <div style="margin-top:8px;color:#766871">
      ${low.length
        ? low.map(p => `<div style="padding:5px 0"><b>${escapeHtml(p.name)}</b> — ${Number(p.stock || 0)} left</div>`).join("")
        : "No products are currently at or below the low-stock threshold."}
    </div>`;
}

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
  if (count) count.textContent =
    `${list.length} product${list.length === 1 ? "" : "s"} available`;

  if (!list.length) {
    el.innerHTML = `<div class="empty">No products found. Try another search.</div>`;
    renderSmartSections();
    return;
  }

  el.innerHTML = list.map(p => {
    const image = p.image_url
      ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<span class="photo-label">${escapeHtml(p.category || "PRODUCT")}</span>`;
    const stock = Math.max(0, Number(p.stock || 0));
    const fav = isFavourite(p.id);
    const stockText = stock === 0 ? "Out of stock" : stock <= SMART_LOW_STOCK_THRESHOLD ? `Only ${stock} left` : "In stock";

    return `
      <article class="card" onclick="rememberViewedProduct(${Number(p.id)}); renderSmartSections(${Number(p.id)})">
        <div class="product-photo">
          ${image}
          <button type="button" class="smart-fav ${fav ? "active" : ""}"
            onclick="event.stopPropagation(); toggleFavourite(${Number(p.id)})"
            aria-label="${fav ? "Remove from favourites" : "Add to favourites"}">${fav ? "♥" : "♡"}</button>
        </div>
        <div class="card-body">
          <div class="category">${escapeHtml(p.category || "")}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="description">${escapeHtml(p.description || "A beautiful addition to your everyday beauty routine.")}</p>
          <div style="font-size:.8rem;color:${stock <= SMART_LOW_STOCK_THRESHOLD ? "#b25b20" : "#47734f"};font-weight:700;margin-bottom:10px">${stockText}</div>
          <div class="price-row">
            <span class="price">${money(p.price)}</span>
            <button class="btn" type="button" ${stock === 0 ? "disabled" : ""}
              onclick="event.stopPropagation(); smartAddToCart(${Number(p.id)})">${stock === 0 ? "Out of stock" : "Add to cart"}</button>
          </div>
        </div>
      </article>`;
  }).join("");

  renderSmartSections();
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
  addSmartStyles();
  updateCartCount();

  const productsEl = document.getElementById("products");

  if (productsEl) {
    const ok = await loadProducts();

    if (ok) {
      ensureSmartSections();
      renderProducts();
      renderLowStockAdmin();

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
