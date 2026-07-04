Witney Wire face crop fix patch – Craig Ballantyne article

What this patch fixes
- The Craig Ballantyne Thames Valley Police image was being cropped too tightly on the article page.
- This patch makes that specific article image display in full instead of cutting off the face.

How it works
- Adds a heroContain flag to the Oxford drug supply article.
- Updates article rendering so flagged images use a contain-style hero image.
- Adds targeted CSS for contain-style hero images.

Files included
- styles.css
- assets/styles.css
- data/styles.css
- app.js
- assets/app.js
- data/app.js
- functions/article.js and mirrored function copies
- article JSON copies containing the Craig Ballantyne story

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace the existing files when prompted.
4. Commit in GitHub Desktop.
5. Push origin and allow Cloudflare Pages to deploy.
