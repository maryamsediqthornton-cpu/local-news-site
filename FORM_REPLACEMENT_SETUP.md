# Witney Wire — FormSubmit replacement (NOT LIVE)

Branch: `V065_Replace_FormSubmit_291026` (created from `V064_Roadwatch_Validation_291026`).
Do **not** merge or switch the Cloudflare production branch until all four forms pass end-to-end tests.

## What changed
- Four form pages (`advertise.html`, `newsletter.html`, `subscribe.html`, `send-story.html`) now post to `/api/forms`.
- The new Cloudflare Pages Function (`functions/api/forms.js`) validates form type, allowed fields, required information, newsletter consent, reply email and Cloudflare Turnstile tokens.
- `assets/form-security.js` loads the Turnstile challenge and disables submission until ready.
- Success redirects to the **same origin** `/thanks.html` only when Resend accepts the message.
- Notifications are routed to existing GoDaddy/Outlook inboxes: `advertise@witneywire.co.uk`, `subscribe@witneywire.co.uk`, `contact@witneywire.co.uk`.
- No Mailchimp membership is created automatically: newsletter requests are delivered to the subscription inbox for processing under existing opt-in workflows.
- The original fields, layout and consent copy are retained. No existing email MX or Outlook setup is modified.

## Required private configuration in Cloudflare Pages
For a PREVIEW/TEST deployment of the development branch, configure:
1. `RESEND_API_KEY` — encrypted secret from Resend (sending permission only).
2. `FORM_FROM` — e.g. `Witney Wire <forms@witneywire.co.uk>`, once the domain/sending subdomain is verified with Resend. This is a sender identity, not an inbox. Do not alter existing MX records; verify Resend SPF/DKIM as instructed without disrupting GoDaddy mail.
3. `TURNSTILE_SITE_KEY` — public key from Cloudflare Turnstile for the domains used in testing and production.
4. `TURNSTILE_SECRET_KEY` — encrypted secret. Never place this or the Resend key in GitHub, HTML, or chats.

Turnstile must allow the specific preview hostname and `witneywire.co.uk`. Configure preview and production secrets deliberately; don't assume a production environment variable is present in preview.
No existing Cloudflare or GoDaddy DNS changes have been made by this patch.

If any of the four settings is missing, forms **fail closed** with an explanatory message, rather than misleading users with a success screen.

## Verification checklist before going live
- Confirm that preview project and branch are safely isolated from production; changing the Cloudflare Pages production branch must be a separate approved operation.
- Confirm Resend sender domain is verified, and messages to all three routing inboxes are delivered (including Outlook spam checks).
- Test each of the four forms with real test details and valid Turnstile token.
- Confirm each success redirects to `/thanks.html` on the current origin.
- Confirm invalid email, missing GDPR consent, missing Turnstile, invalid form type, overly long messages and provider outages show an error, NOT a success.
- Confirm website still loads normally and existing article/social-preview and Roadwatch features work.
- Review the Privacy Policy: submissions are forwarded through Resend and Cloudflare before going live. Establish lawful processing and retention practices.
- Confirm rate limits and anti-spam performance; Turnstile is one layer, not a substitute for broader abuse monitoring.
- After tests, request explicit approval to switch the live forms.

## Current limitations
This is **not deployed/tested end-to-end**; no Resend account, credentials, DNS verification or Turnstile keys are available in the repository. Therefore there are no claims that messages are arriving yet. The provider's acceptance response does not guarantee final inbox delivery. The patch does not create a persistent backup/database of enquiries. The form intentionally does not promise that. Implement separate durable storage if lost enquiries remain a concern.

There are no paid-service activations or production deployments in this preparation.
