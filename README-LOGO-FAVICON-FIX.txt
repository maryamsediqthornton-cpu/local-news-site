WITNEY WIRE LOGO + FAVICON FIX

This ZIP fixes the actual site references, not just the assets folder.

What changed:
- Header now uses: assets/witney-wire-logo.png
- Browser favicon now uses: assets/icon-192.png
- Apple touch icon now uses: assets/icon-192.png
- Web app manifest now uses assets/icon-192.png and assets/icon-512.png
- Text-only 'Witney Wire' header is replaced with the image logo.

Important branch note:
This package cannot change branches by itself. If Cloudflare shows this as a preview, GitHub Desktop was on a preview branch when you committed. To update production, switch GitHub Desktop to main before replacing files, then commit and push.

After deployment:
- Hard refresh with Ctrl+F5.
- Favicons can be cached heavily by Chrome; open the site in Incognito or clear site data if the tab icon does not update immediately.
