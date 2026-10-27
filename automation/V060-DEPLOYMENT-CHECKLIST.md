# V060 Travel Worker: deployment checklist

**Current state:** Staging code prepared, NOT activated and NOT producing public travel notices. The old V059 live site is unchanged.

## Files
- `automation/national-highways-worker.js`: National Highways XML ingestion, bounded pagination, date/status filtering, Cloudflare scheduled handler, KV snapshot, HTTP health and feed endpoints. It intentionally returns NO travel notices pending geographical review.
- `travel-updates.html`: V060 development travel page points to the Worker /feed endpoint. Fails safely if not configured or stale.
- `data/travel-feed.json`: legacy placeholder, not used by the revised travel page.

## Configuration in Cloudflare
1. Open Worker `witney-wire-travel-updates` and paste the latest Worker code into Edit code. Do not share the secret.
2. Confirm encrypted secret `NATIONAL_HIGHWAYS_API_KEY` is still present.
3. Create a Workers KV namespace named `witney-wire-travel-kv` on the free tier, if available. Under Worker > Settings > Bindings add a KV Namespace binding named **TRAVEL_KV** selecting that namespace.
4. Deploy Worker code and verify `/health` reports `kv_configured:true` and `key_configured:true`. The Worker `/feed` will return 503 before the first successful scheduled refresh.
5. In Worker Settings > Triggers > Cron Triggers, set `*/30 * * * *` (every 30 minutes UTC). Only turn it on when stage config is ready and no paid service is enabled.
6. After a successful run, `/health` should report `last_success`, and `/feed` should return an empty notice list with `status:pending_geographic_validation`. It must not publish notices at this stage.
7. Preview the V060 Pages build before changing any production deployments.

## Why publishing is held
A broad bounding box is not proof that a closure is in Oxfordshire. A robust county/route filter with authoritative road-geometries, DATEX II stable record identities (including attributes), cross-page deduplication, road sections, cancellation/updates, a final human-reviewed sample, and correct display of published restrictions is still needed. The diagnostic output gave 24 *candidates*, not 24 verified local closures. This code **intentionally fails closed** rather than making potentially unsafe assertions.

## Security and operational notes
- API key only via encrypted Worker secret, never client JS or GitHub.
- Data stored in KV has no key, personal data, or raw XML.
- /health exposes generic configuration booleans and age; never secret values.
- Neither scheduled execution nor a 200 from /feed means the site is ready to publish.
- Check National Highways usage licence/attribution and API limits before public display.
