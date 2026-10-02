function authorized(request, env) {
  const key = request.headers.get("X-Admin-Key");
  return Boolean(env.ADMIN_KEY && key && key === env.ADMIN_KEY);
}

// Public catalogue
export async function onRequestGet({ env }) {
  try {
    const result = await env.LELES_DB.prepare(
      "SELECT id, name, category, description, price, stock, image_url, active FROM products WHERE active = 1 ORDER BY id"
    ).all();

    return Response.json({
      success: true,
      products: result.results || []
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Admin: add product
export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      name,
      category,
      description = "",
      price,
      stock = 0,
      image_url = "",
      active = 1
    } = data;

    if (!name || !category || price === undefined) {
      return Response.json(
        { success: false, error: "name, category and price are required" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!Number.isFinite(numericPrice) || numericPrice < 0 ||
        !Number.isInteger(numericStock) || numericStock < 0) {
      return Response.json(
        { success: false, error: "Price and stock must be valid non-negative values" },
        { status: 400 }
      );
    }

    const result = await env.LELES_DB.prepare(
      `INSERT INTO products
       (name, category, description, price, stock, image_url, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      String(name).trim(),
      String(category).trim(),
      String(description).trim(),
      numericPrice,
      numericStock,
      String(image_url).trim(),
      active ? 1 : 0
    ).run();

    return Response.json({
      success: true,
      id: result.meta?.last_row_id
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Admin: edit product
export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return Response.json({ success: false, error: "Invalid product ID" }, { status: 400 });
    }

    const currentResult = await env.LELES_DB.prepare(
      "SELECT id, name, category, description, price, stock, image_url, active FROM products WHERE id = ?"
    ).bind(id).all();

    const current = currentResult.results?.[0];
    if (!current) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const name = data.name !== undefined ? String(data.name).trim() : current.name;
    const category = data.category !== undefined ? String(data.category).trim() : current.category;
    const description = data.description !== undefined ? String(data.description).trim() : (current.description || "");
    const image_url = data.image_url !== undefined ? String(data.image_url).trim() : (current.image_url || "");
    const price = data.price !== undefined ? Number(data.price) : Number(current.price);
    const stock = data.stock !== undefined ? Number(data.stock) : Number(current.stock);
    const active = data.active !== undefined ? (data.active ? 1 : 0) : Number(current.active);

    if (!name || !category || !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stock) || stock < 0) {
      return Response.json({ success: false, error: "Invalid product details" }, { status: 400 });
    }

    await env.LELES_DB.prepare(
      `UPDATE products
       SET name = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ?, active = ?
       WHERE id = ?`
    ).bind(name, category, description, price, stock, image_url, active, id).run();

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
