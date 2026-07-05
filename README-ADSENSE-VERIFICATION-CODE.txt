Witney Wire AdSense verification code patch

What this patch does
- Adds the Google AdSense verification script to the <head> section of all main HTML pages.
- Adds the same script to the Cloudflare article function templates, so article pages are also covered.
- Does not change your article data, design, advert placeholders, images or CSS.

AdSense code added
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9678324763933867"
     crossorigin="anonymous"></script>

How to apply
1. Extract this ZIP.
2. Copy the included files into your latest local-news-site folder.
3. Replace existing files when prompted.
4. Commit and push in GitHub Desktop.
5. Wait for Cloudflare Pages to finish deploying.
6. Go back to Google AdSense, tick "I've placed the code", then click Verify.

Important
Only click Verify after the updated site has deployed live at witneywire.co.uk.
