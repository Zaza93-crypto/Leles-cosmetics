export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { customer, items, payment_method, notes = "", coupon_code = "" } = data;

    if (!customer?.name || !customer?.phone || !customer?.delivery_location) {
      return Response.json({ success: false, error: "Customer name, phone and delivery location are required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ success: false, error: "Your cart is empty" }, { status: 400 });
    }
    if (!payment_method) {
      return Response.json({ success: false, error: "Payment method is required" }, { status: 400 });
    }

    const ids = items.map(x => Number(x.product_id)).filter(Number.isInteger);
    if (!ids.length) {
      return Response.json({ success: false, error: "Invalid products" }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(",");
    const productsResult = await env.LELES_DB.prepare(
      `SELECT id, name, price FROM products WHERE id IN (${placeholders}) AND active = 1`
    ).bind(...ids).all();

    const products = productsResult.results || [];
    const productMap = new Map(products.map(p => [Number(p.id), p]));

    let total = 0;
    const normalized = [];

    for (const item of items) {
      const product = productMap.get(Number(item.product_id));
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return Response.json({ success: false, error: "One or more cart items are invalid" }, { status: 400 });
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;
      total += subtotal;

      normalized.push({
        product_id: Number(product.id),
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        subtotal
      });
    }

    // Validate and calculate coupon discount server-side.
    // Never trust the discount calculated in the browser.
    let coupon = null;
    let discount = 0;
    const couponCode = String(coupon_code || "").trim().toUpperCase();

    if (couponCode) {
      const couponResult = await env.LELES_DB.prepare(
        `SELECT id, code, discount_type, discount_value, min_order,
                max_uses, uses, expires_at, active
         FROM coupons
         WHERE UPPER(code) = ?
         LIMIT 1`
      ).bind(couponCode).all();

      coupon = (couponResult.results || [])[0] || null;

      if (!coupon || Number(coupon.active) !== 1) {
        return Response.json({ success: false, error: "Invalid or inactive coupon code" }, { status: 400 });
      }

      const minOrder = Number(coupon.min_order || 0);
      if (total < minOrder) {
        return Response.json({
          success: false,
          error: `Minimum order for this coupon is K${minOrder.toFixed(2)}`
        }, { status: 400 });
      }

      const maxUses = Number(coupon.max_uses || 0);
      const uses = Number(coupon.uses || 0);
      if (maxUses > 0 && uses >= maxUses) {
        return Response.json({ success: false, error: "This coupon has reached its usage limit" }, { status: 400 });
      }

      if (coupon.expires_at) {
        const expiry = new Date(coupon.expires_at);
        if (!Number.isNaN(expiry.getTime()) && expiry <= new Date()) {
          return Response.json({ success: false, error: "This coupon has expired" }, { status: 400 });
        }
      }

      const value = Number(coupon.discount_value || 0);

      if (coupon.discount_type === "percentage") {
        discount = total * (value / 100);
      } else if (coupon.discount_type === "fixed") {
        discount = value;
      }

      discount = Math.max(0, Math.min(discount, total));
      total = Math.max(0, total - discount);
    }

    const orderNumber = "LELE-" + Date.now().toString(36).toUpperCase();

    const customerResult = await env.LELES_DB.prepare(
      `INSERT INTO customers (name, phone, delivery_location)
       VALUES (?, ?, ?)`
    ).bind(customer.name, customer.phone, customer.delivery_location).run();

    const customerId = customerResult.meta.last_row_id;

    const orderResult = await env.LELES_DB.prepare(
      `INSERT INTO orders (order_number, customer_id, payment_method, total, status, notes)
       VALUES (?, ?, ?, ?, 'Pending', ?)`
    ).bind(
        orderNumber,
        customerId,
        payment_method,
        total,
        coupon
          ? `${notes}${notes ? "\n" : ""}Coupon: ${coupon.code} | Discount: K${discount.toFixed(2)}`
          : notes
      ).run();

    const orderId = orderResult.meta.last_row_id;

    const statements = normalized.map(item =>
      env.LELES_DB.prepare(
        `INSERT INTO order_items
         (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal)
    );

    if (statements.length) await env.LELES_DB.batch(statements);

    if (coupon) {
      await env.LELES_DB.prepare(
        `UPDATE coupons SET uses = uses + 1 WHERE id = ?`
      ).bind(Number(coupon.id)).run();
    }

    return Response.json({
      success: true,
      order_number: orderNumber,
      order_id: orderId,
      total,
      subtotal: coupon ? total + discount : total,
      discount,
      coupon_code: coupon ? coupon.code : null,
      status: "Pending"
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

function adminAuthorized(request, env) {
  const expected = env.ADMIN_KEY;
  if (!expected) return false;
  const supplied = request.headers.get("X-Admin-Key") || "";
  return supplied === expected;
}

export async function onRequestGet({ request, env }) {
  if (adminAuthorized(request, env)) {
    const result = await env.LELES_DB.prepare(
      `SELECT o.id, o.order_number, o.payment_method, o.total, o.status,
              o.notes, o.created_at, c.name, c.phone, c.delivery_location
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.id DESC`
    ).all();
    return Response.json({ success: true, orders: result.results || [] });
  }

  const url = new URL(request.url);
  const orderNumber = String(url.searchParams.get("order_number") || "").trim().toUpperCase();
  if (!orderNumber) return Response.json({ success: false, error: "Order number is required" }, { status: 400 });

  const result = await env.LELES_DB.prepare(
    `SELECT o.order_number, o.total, o.status, o.created_at
     FROM orders o WHERE UPPER(o.order_number) = ? LIMIT 1`
  ).bind(orderNumber).all();
  const order = (result.results || [])[0];
  if (!order) return Response.json({ success: false, error: "Order not found. Check your order number." }, { status: 404 });

  return Response.json({ success: true, order: {
    order_number: order.order_number, total: Number(order.total || 0),
    status: order.status, created_at: order.created_at
  }});
}

export async function onRequestPatch({ request, env }) {
  if (!adminAuthorized(request, env)) {
    return Response.json({ success: false, error: "Admin authorization required" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const orderId = Number(data.order_id);
    const status = String(data.status || "").trim();
    const allowed = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

    if (!Number.isInteger(orderId) || !allowed.includes(status)) {
      return Response.json({ success: false, error: "Invalid order ID or status" }, { status: 400 });
    }

    const result = await env.LELES_DB.prepare(
      `UPDATE orders SET status = ? WHERE id = ?`
    ).bind(status, orderId).run();

    return Response.json({
      success: true,
      changed: Number(result.meta?.changes || 0),
      status
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
