Witney Wire front page fix – Oxford drug supply article

What this patch fixes
- The Craig Ballantyne / Oxford drug supply article was present in the site data but marked excludeFromHomepage.
- That meant it could show on the article page but would not appear on the front page feed.

What this patch changes
- Removes excludeFromHomepage from that article in all article JSON copies where it appears.
- Keeps the landscape-safe image path.
- Keeps the full-face display flag.
- Does not change adverts, footer, forms, CSS, page templates, or rendering code.

Expected result
- The article should appear on the front page as the newest story after deployment.
- Article URL remains: /article?id=man-jailed-drug-supply-oxford-craig-ballantyne

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace the existing files when prompted.
4. Commit in GitHub Desktop.
5. Push origin and wait for Cloudflare Pages to deploy.
6. Hard refresh the front page with Ctrl + F5.
