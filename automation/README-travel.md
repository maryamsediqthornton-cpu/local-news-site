# Witney Wire traffic automation — V060

## Status
The National Highways API key is already stored in Cloudflare as `NATIONAL_HIGHWAYS_API_KEY`. The user confirmed a successful authenticated test (HTTP 200). This repository contains a read-only schema inspection Worker at `automation/national-highways-worker.js`.

## Manual next step (no paid services)
In Cloudflare Workers & Pages, open Worker `witney-wire-travel-updates`, Edit code and paste the complete contents of `automation/national-highways-worker.js`. Deploy, then visit its `/health` endpoint. It should return `connected:true`, `payload_kind` and `root_keys`, without exposing the key or raw closure records. Record only those nonsecret schema fields to map DATEX II reliably.

## Before live traffic feed
1. Inspect schema without publishing or exposing the raw feed. Implement a validated transformer mapping real road/closure IDs, locations and verified start/end dates to the site's `data/travel-feed.json` schema.
2. Filter relevant A40/M40/Oxfordshire notices using verified geographic details rather than substring matches alone; test sample records and edge cases (revised/cancelled works, planned vs active, missing expiry).
3. Set up Cloudflare KV or equivalent to store latest validated data atomically, preserve last successful fetch time and avoid stale alerts. Never store API key in repo, KV notices, or client code.
4. Configure Cron Trigger `*/30 * * * *` (UTC) only after scheduled handler exists and works. Ensure updates fail closed if upstream is unavailable.
5. Connect `travel-updates.html` to verified feed, with CORS restrictions and last-checked timestamp. Deploy and review preview before merging into V059/live.

## Important
Never infer that an empty feed means roads are clear. The page currently reads a nonlive placeholder `data/travel-feed.json`; it does not yet retrieve Worker output. No travel auto-posting is active.
