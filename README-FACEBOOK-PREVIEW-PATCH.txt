Witney Wire Facebook preview patch
===================================

Purpose:
- Fixes Facebook link previews for article URLs such as:
  https://witneywire.co.uk/article?id=phone-free-schools-thames-valley-fund

What changed:
- Added Cloudflare Pages Function: functions/article.js
  This serves article pages with proper Open Graph metadata before Facebook reads the page.
- Added _routes.json so the Function is only used for /article.
- Updated internal article links in app.js, assets/app.js and data/app.js to use /article?id=...
- Added a 1200 x 630 social preview image for the phone-free schools article:
  assets/phone-free-classroom-illustration-social.png
- Added safer generic fallback metadata to article.html.

After uploading:
1. Deploy the changed files to Cloudflare Pages.
2. Go to Facebook Sharing Debugger.
3. Paste the article URL:
   https://witneywire.co.uk/article?id=phone-free-schools-thames-valley-fund
4. Click Debug, then Scrape Again.
5. Create a new Facebook post using the same article link.

Expected Facebook preview:
- Title: Criminal cash to fund phone-free schools as Oxford head’s approach gains backing
- Description: Schools across the Thames Valley could receive funding to help keep pupils off mobile phones during the school day, as an Oxford school’s stricter approach attracts wider attention.
- Image: phone-free classroom illustration, wide social preview format.
