export async function onRequestGet({ env }) {
  const result = await env.LELES_DB.prepare(
    "SELECT id, name, category, description, price, stock, image_url, active FROM products WHERE active = 1 ORDER BY id"
  ).all();

  return Response.json({
    success: true,
    products: result.results || []
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, category, description = "", price, stock = 0, image_url = "" } = data;

    if (!name || !category || price === undefined) {
      return Response.json({ success: false, error: "name, category and price are required" }, { status: 400 });
    }

    const result = await env.LELES_DB.prepare(
      `INSERT INTO products (name, category, description, price, stock, image_url, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).bind(name, category, description, Number(price), Number(stock), image_url).run();

    return Response.json({ success: true, id: result.meta?.last_row_id });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
