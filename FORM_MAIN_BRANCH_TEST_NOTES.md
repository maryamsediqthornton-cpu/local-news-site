# FormSubmit replacement — current-main test branch (30 October 2026)

**Source branch: main** (created directly from main; not from V064 or V065).
**Test branch:** V066_Forms_From_Main_301026
**Production:** no merge, release, DNS edit or live form switch.

## Static checks performed (10 passed)
- The Advertise, Newsletter, Subscribe and Send a Story HTML forms use POST to /api/forms, include form_kind, preserve field names and require server-side routing.
- No FormSubmit endpoints remain in those four form pages.
- The four pages load assets/form-security.js.
- Cloudflare _routes.json includes /api/forms while retaining the current main routes.
- The server-side handler fails closed when Resend/Turnstile configuration is missing.
- The handler validates form type, required fields, allowed fields, email shape and newsletter consent.
- A Turnstile siteverify call is present, and only allowed inboxes are selected by the backend.
- Resend acceptance must precede the thank-you redirect.

**Limits of these checks:** these are source-level assertions, not browser or live-delivery tests. Cloudflare's preview deployment and the Outlook mailbox delivery must still be checked. Neither an actual HTTP submission nor email delivery has been claimed.

## Configuration
Already configured by owner in Cloudflare Pages **Preview**: RESEND_API_KEY (secret), FORM_FROM (text, Witney Wire <forms@forms.witneywire.co.uk>), TURNSTILE_SITE_KEY (text), TURNSTILE_SECRET_KEY (secret).
Verified Resend sender domain: forms.witneywire.co.uk.
Do not copy keys to GitHub, a chat, or the production environment until promotion is explicitly approved.

## Preview test procedure
1. In Cloudflare Pages for local-news-site, inspect the deployment for **V066_Forms_From_Main_301026**. Make sure it is a preview deployment (not Production).
2. Open its unique deployment URL, check that /api/forms returns a siteKey (never a secret), and confirm a Turnstile widget appears on each form.
3. Send harmless labelled test submissions from each of the four forms.
4. Confirm respective GoDaddy/Outlook inbox receipts: advertise@, subscribe@, contact@. Check spam folders.
5. Confirm successful redirect to same-host /thanks.html, and test missing required fields / missing consent / Turnstile failure and downtime.
6. Verify main site's home, article rendering, Roadwatch and social previews are untouched.
7. Once the owner approves the outcome, plan a controlled merge into main with a verified Preview-to-Production configuration check.

Note: DNS verification and environment setup alone do not prove email delivery. No persistent backup database is yet implemented.
