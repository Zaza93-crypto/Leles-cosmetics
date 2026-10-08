LELE'S COSMETICS — NEUTRAL THEME UPLOAD

This ZIP contains neutral-theme.css, a style-only update inspired by your reference image.
It does not replace or edit your product, cart, order, payment, or admin JavaScript.

IMPORTANT: This is a theme stylesheet, not complete replacement HTML pages.

ANDROID / GITHUB UPLOAD STEPS
1. Extract this ZIP on your phone.
2. In your GitHub repository, open Add file > Upload files.
3. Upload neutral-theme.css to the ROOT of:
   Zaza93-crypto/Leles-cosmetics
4. Commit the upload.
5. For each customer-facing page below, open the HTML file and choose Edit:
   - index.html
   - products.html
   - perfumes.html
   - about.html
   - cart.html
   - track-order.html
6. Find the closing </head> tag. Immediately BEFORE </head>, add:
   <link rel="stylesheet" href="neutral-theme.css">
7. Commit each edit. Do not replace the whole HTML file with the CSS file.
8. Refresh the live site. If it still shows old colours, refresh after a short wait.

The theme is intended to give pages a warm cream background, beige panels, charcoal
buttons/headings, muted grey text, and subtle beige borders. Some page-specific inline
styles may still override individual details; check each page after deployment.

The admin dashboard files are intentionally not included.
