function authorized(request, env) {
  const key = request.headers.get("X-Admin-Key");
  return Boolean(env.ADMIN_KEY && key && key === env.ADMIN_KEY);
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { customer, items, payment_method, notes = "" } = data;

    if (!customer?.name || !customer?.phone || !customer?.delivery_location) {
      return Response.json({ success: false, error: "Customer name, phone and delivery location are required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ success: false, error: "Your cart is empty" }, { status: 400 });
    }
    if (!payment_method) {
      return Response.json({ success: false, error: "Payment method is required" }, { status: 400 });
    }

    const ids = items.map(x => Number(x.product_id));
    if (!ids.every(Number.isInteger)) {
      return Response.json({ success: false, error: "Invalid products" }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(",");
    const productsResult = await env.LELES_DB.prepare(
      `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders}) AND active = 1`
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

      // Stock of 0 means unavailable for new orders.
      if (Number(product.stock) < quantity) {
        return Response.json({
          success: false,
          error: `${product.name} has only ${Number(product.stock)} item(s) in stock.`
        }, { status: 409 });
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

    const orderNumber = "LELE-" + Date.now().toString(36).toUpperCase();

    // Keep the existing schema and create the customer first.
    const customerResult = await env.LELES_DB.prepare(
      `INSERT INTO customers (name, phone, delivery_location)
       VALUES (?, ?, ?)`
    ).bind(customer.name, customer.phone, customer.delivery_location).run();

    const customerId = customerResult.meta.last_row_id;

    const orderResult = await env.LELES_DB.prepare(
      `INSERT INTO orders (order_number, customer_id, payment_method, total, status, notes)
       VALUES (?, ?, ?, ?, 'Pending', ?)`
    ).bind(orderNumber, customerId, payment_method, total, notes).run();

    const orderId = orderResult.meta.last_row_id;

    const statements = [];

    for (const item of normalized) {
      statements.push(
        env.LELES_DB.prepare(
          `UPDATE products
           SET stock = stock - ?
           WHERE id = ? AND active = 1 AND stock >= ?`
        ).bind(item.quantity, item.product_id, item.quantity)
      );
    }

    for (const item of normalized) {
      statements.push(
        env.LELES_DB.prepare(
          `INSERT INTO order_items
           (order_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          orderId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.subtotal
        )
      );
    }

    if (statements.length) {
      await env.LELES_DB.batch(statements);
    }

    return Response.json({
      success: true,
      order_number: orderNumber,
      order_id: orderId,
      total,
      status: "Pending"
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await env.LELES_DB.prepare(
      `SELECT o.id, o.order_number, o.payment_method, o.total, o.status,
              o.notes, o.created_at, c.name, c.phone, c.delivery_location
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.id DESC`
    ).all();

    return Response.json({ success: true, orders: result.results || [] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const orderId = Number(data.order_id);
    const status = String(data.status || "").trim();
    const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];

    if (!Number.isInteger(orderId) || !allowed.includes(status)) {
      return Response.json({ success: false, error: "Invalid order ID or status" }, { status: 400 });
    }

    const result = await env.LELES_DB.prepare(
      `UPDATE orders SET status = ? WHERE id = ?`
    ).bind(status, orderId).run();

    return Response.json({
      success: true,
      updated: result.meta?.changes || 0
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
