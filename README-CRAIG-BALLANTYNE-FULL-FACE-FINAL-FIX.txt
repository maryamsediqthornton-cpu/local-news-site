Witney Wire Craig Ballantyne full-face image final fix

Why the previous fix did not show correctly
- The visible article page can be served by the Cloudflare Pages Function file at functions/article.js.
- That file has its own embedded fallback article copy.
- The fallback copy was still pointing to the original portrait image, so the page could still show the cropped version even though the main JSON files had been updated.

What this patch fixes
- Updates the embedded fallback copies inside functions/article.js and mirrored function files.
- Points the Craig Ballantyne article to the landscape-safe image.
- Adds heroContain to the fallback article data.
- Replaces the original Craig image filename with the landscape-safe image too, so either image path now shows the full face.
- Keeps the fix targeted to this article/image issue.

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace the existing files when prompted.
4. Commit in GitHub Desktop.
5. Push origin and allow Cloudflare Pages to deploy.

After deployment, hard refresh the article page once using Ctrl + F5 if your browser still shows the cached old image.
