Witney Wire — Safe Article Template Ads Patch

What broke before:
The previous update replaced the article rendering structure with code that did not match the current working site.
Your real articles use data/articles.json and most article bodies are a single text string, not long paragraph arrays.
That meant the old trigger-based ad logic either did not appear or interfered with how the article content rendered.

What this patch does:
- Keeps the current working article renderer intact.
- Reduces the large article hero image height.
- Adds one ad banner directly below the article image.
- Adds one ad banner after the article body.
- Applies automatically to all article pages using article.html.
- Only updates app.js and styles.css.

How to apply:
1. Copy app.js into the project root, replacing the existing app.js.
2. Copy styles.css into the project root, replacing the existing styles.css.
3. Commit and push in GitHub Desktop.
4. Cloudflare Pages should redeploy automatically.

No .git files included.
No full-site replacement.
