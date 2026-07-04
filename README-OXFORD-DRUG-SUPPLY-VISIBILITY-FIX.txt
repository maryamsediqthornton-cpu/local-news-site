Witney Wire fix patch – Oxford drug supply article visibility

What this patch fixes
- The Oxford drug supply article was already present in the latest ZIP, but it was marked excludeFromHomepage.
- That meant it could look like the article had not worked because it would not show in the normal homepage News feed.
- This patch removes that flag from the Oxford drug supply article only.
- It keeps the article in the News category and keeps the Thames Valley Police image supplied/approved by the user.

Article details
- ID: man-jailed-drug-supply-oxford-craig-ballantyne
- Category: news
- Headline: Oxford man jailed after police witness drug deal in city park
- Image: assets/craig-ballantyne-thames-valley-police.jpeg

After upload
The article should be visible as the newest story in the main News/Home feed and will also be available at:
/article?id=man-jailed-drug-supply-oxford-craig-ballantyne

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace files when prompted.
4. Commit in GitHub Desktop.
5. Push origin and allow Cloudflare Pages to deploy.
