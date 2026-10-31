# Advert and job reports — preview setup

Prepared from main at c8e2b7d29629d750d21fda766c7b8781316c8fe3.
Do not merge to main until preview testing is approved.

## Cloudflare preview environment only
1. In Cloudflare Storage & databases > D1, create witney-wire-tracking-preview.
2. Open its Console and run the contents of tracking/schema.sql.
3. In the existing Witney Wire Pages project > Settings > Bindings, select Preview.
   Add a D1 binding named TRACKING_DB and select that preview database.
4. Under Preview Variables and Secrets, add an encrypted secret named REPORT_PASSWORD.
   Choose a long random password. Enter it in Cloudflare only, never GitHub or chat.
5. Redeploy this feature branch's preview after adding the binding and secret.
6. Open /advert-reports.html on that branch preview. Enter the password and select today's dates.
7. Click the Bluebell homepage advert. Check its advert-click and listing-view totals increase.
   Reloading the jobs page counts another listing view when the listing enters the screen.
   Email and phone links count separately. Cancel the email/call prompt during testing.
8. Verify an incorrect password cannot read figures, and the existing website navigation,
   articles, homepage rotation and forms still work.

No production configuration has been changed. Before an approved production merge,
create a separate production database, run the schema and add the same binding and a
different report secret under Production. Keep preview test figures out of production.

## What is measured
Only the real Bluebell advert and job listing currently on main are connected.
The Witney Wire house advert and empty job-listing placeholders are excluded.
There is no Pest Solutions advert in the current homepage source; it was sample data
in the mock-up. Add future paid adverts deliberately to the server allowlist, report
measure list and their link attributes.

Counts are daily aggregate events, using Europe/London dates. No cookies,
local storage, visitor IDs, IPs, email addresses or user agents are stored by this code.
Reports are password protected at the API; the empty report page itself is public.
Password stays in page memory and is never put in a URL or browser storage.
Use a strong secret; Cloudflare rate limiting or Access can further protect the endpoint.

Totals include repeat interactions, may include bots and can miss blocked requests.
Listing views mean the listing enters the viewport once per page load, not a unique
reader or completed reading. Email and phone clicks are not completed applications.
Existing Cloudflare request logging settings are separate from this aggregate storage.

## Operational notes
Tracking uses Cloudflare Pages Functions and D1, subject to account quotas.
Missing database configuration leaves ordinary navigation working but records no events.
No historical clicks can be recovered by installing this feature.
The D1 table stores one row per item/event/day. Export or delete older aggregate rows
in Cloudflare D1 according to the publisher's reporting needs.
