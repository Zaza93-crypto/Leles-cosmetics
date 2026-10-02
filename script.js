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

    alert(
      `Order ${result.order_number} was created successfully.\n\n` +
      `Total: ${money(result.total)}`
    );

    window.open(
      "https://wa.me/260978955714?text=" + encodeURIComponent(message),
      "_blank"
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

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", submitOrder);
  }
});
