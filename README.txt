LELE'S COSMETICS — PRODUCT & STOCK MANAGEMENT

Upload/replace these exact paths:
1. admin.html -> repository root
2. admin.js -> repository root
3. functions/api/products.js -> replace existing products.js
4. functions/api/orders.js -> replace existing orders.js

Do NOT delete the LELES_DB binding.
Keep ADMIN_KEY as a Cloudflare Secret.

After deployment:
https://leles-cosmetics.pages.dev/admin.html

The customer GET /api/products remains public.
Admin product POST/PATCH and order GET/PATCH require X-Admin-Key.

Stock:
- Admin sets stock from Products & Stock.
- New orders are rejected when requested quantity exceeds stock.
- Stock is reduced when a new order is created.
- Existing test orders are not changed.
