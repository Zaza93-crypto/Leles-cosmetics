export async function onRequestGet(context) {
  const { env } = context;

  try {
    const result = await env.LELES_DB.prepare(`
      SELECT id, code, discount_type, discount_value,
             min_order, max_uses, uses, expires_at, active
      FROM coupons
      ORDER BY id DESC
    `).all();

    return Response.json({
      success: true,
      coupons: result.results || []
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const code = String(body.code || "")
      .trim()
      .toUpperCase();

    const discountType = body.discount_type;
    const discountValue = Number(body.discount_value);
    const minOrder = Number(body.min_order || 0);
    const maxUses = Number(body.max_uses || 0);
    const expiresAt = body.expires_at || null;

    if (!code) {
      return Response.json({
        success: false,
        error: "Coupon code is required"
      }, { status: 400 });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return Response.json({
        success: false,
        error: "Invalid discount type"
      }, { status: 400 });
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return Response.json({
        success: false,
        error: "Invalid discount value"
      }, { status: 400 });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return Response.json({
        success: false,
        error: "Percentage discount cannot exceed 100%"
      }, { status: 400 });
    }

    await env.LELES_DB.prepare(`
      INSERT INTO coupons
      (code, discount_type, discount_value, min_order,
       max_uses, uses, expires_at, active)
      VALUES (?, ?, ?, ?, ?, 0, ?, 1)
    `)
      .bind(
        code,
        discountType,
        discountValue,
        minOrder,
        maxUses,
        expiresAt
      )
      .run();

    return Response.json({
      success: true,
      message: "Coupon created successfully"
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const id = Number(body.id);
    const active = Number(body.active);

    if (!id) {
      return Response.json({
        success: false,
        error: "Coupon ID is required"
      }, { status: 400 });
    }

    await env.LELES_DB.prepare(`
      UPDATE coupons
      SET active = ?
      WHERE id = ?
    `)
      .bind(active ? 1 : 0, id)
      .run();

    return Response.json({
      success: true,
      message: active
        ? "Coupon enabled"
        : "Coupon disabled"
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
