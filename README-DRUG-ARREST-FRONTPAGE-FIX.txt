Witney Wire drug arrest article front-page visibility fix

What this patch fixes
- The Craig Ballantyne / Oxford drug supply article was present in the files but hidden from the homepage because it still had excludeFromHomepage set to true.
- This patch removes that hidden flag from the article data and the Cloudflare article fallback copies.

Article affected
- man-jailed-drug-supply-oxford-craig-ballantyne

Expected result
- The article should appear on the front page as the newest story.
- It should also remain available at:
  /article?id=man-jailed-drug-supply-oxford-craig-ballantyne

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace the existing files when prompted.
4. Commit in GitHub Desktop.
5. Push origin and allow Cloudflare Pages to deploy.
6. Hard refresh the front page with Ctrl + F5.
