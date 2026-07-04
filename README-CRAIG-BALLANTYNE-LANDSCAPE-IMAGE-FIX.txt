Witney Wire image crop fix – Craig Ballantyne article

What this patch fixes
- The Thames Valley Police image was still being cropped by the article hero image area.
- This patch uses a new landscape-safe version of the same supplied TVP image so the full face is visible in the existing article layout.
- The new filename also avoids browser/Cloudflare cache showing the old cropped version.

Files included
- assets/craig-ballantyne-thames-valley-police-landscape.jpeg
- article JSON copies updated to use the new image path

No article rendering, footer, adverts, forms or layout files are changed in this patch.

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace files when asked.
4. Commit in GitHub Desktop.
5. Push origin and wait for Cloudflare Pages to deploy.

After deployment, hard-refresh the article page if the old image is still cached.
