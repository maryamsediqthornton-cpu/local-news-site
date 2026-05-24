Witney Wire advertising framework patch

This is a patch-only ZIP. It does not include .git and does not replace the whole website.

Files included:
- local-news-site/index.html
- local-news-site/article.html
- local-news-site/app.js
- local-news-site/styles.css
- local-news-site/advertise.html

What this adds:
- homepage premium advertising banner
- homepage inline advertising strip
- desktop sidebar sponsor card
- reusable in-article advert block inserted by app.js
- print-only sponsor block for printed article pages
- improved Advertise page options, including print-ready article ads
- responsive and print CSS so ads stay clean and do not damage the layout

How to apply safely:
1. Open your current local-news-site folder in File Explorer.
2. Copy ONLY the files inside this patch into the same matching locations in your project.
3. Do not copy any .git files.
4. Open GitHub Desktop and confirm only these five files changed.
5. Commit with a message such as: Add advertising framework.
6. Push to GitHub and let Cloudflare Pages deploy.

Notes:
- This patch keeps the approved footer structure unchanged.
- This patch does not add Google AdSense or third-party ad scripts yet.
- The ad blocks are placeholders designed for direct local sponsors first.
