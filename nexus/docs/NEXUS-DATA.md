# Nexus — data layer notes

## Curated feed (recommended for production)

The batch script `scripts/fetchDiscussions.ts` runs **outside the browser** (Node + `tsx`):

1. Fetches **controversial** posts (`t=day`, `limit=3`) from `worldnews`, `politics`, `technology`, `science`, `philosophy`.
2. Pulls **top** comments per post (≥5 required to analyze).
3. Calls **Anthropic** `claude-sonnet-4-20250514` with `ANTHROPIC_API_KEY` (server env, **not** `VITE_*`).
4. Writes **`public/discussions.json`**.

The Vite app **loads `/discussions.json` first**. If it contains at least one row, the UI uses that list only: **no live Reddit**, no client LLM, no infinite scroll refresh from Reddit.

Run locally:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run fetch-discussions
```

Schedule daily (examples): **cron** on a VM, **GitHub Actions** `schedule`, or **Cloudflare Workers** `scheduled()` calling the same logic (pass `ANTHROPIC_API_KEY` from `env` / secrets, write to **R2**, **D1**, or KV—then expose a read API or sync to static `discussions.json` on deploy).

### Cloudflare Worker sketch

```ts
export default {
  async scheduled(_event: ScheduledEvent, env: { ANTHROPIC_API_KEY: string }, ctx: ExecutionContext) {
    ctx.waitUntil(runFetch(env)) // implement runFetch like fetchDiscussions.ts using env.ANTHROPIC_API_KEY
  },
}
```

Add a Cron Trigger in the Wrangler dashboard (e.g. `0 7 * * *` for 07:00 UTC).

## Environment variables

Copy `.env.example` to `.env` and set:

- `VITE_GOOGLE_CLIENT_ID` — OAuth 2.0 Web client ID for Sign in with Google (required for the in-app gate).
- `VITE_NEWS_API_KEY` — NewsAPI.org key (used only when present).
- `VITE_TWITTER_BEARER_TOKEN` — Twitter/X v2 bearer token (optional).
- `VITE_ANTHROPIC_API_KEY` — Anthropic API key for Claude summaries (optional).

## CORS and the Vite dev proxy

Browsers cannot call Reddit, NewsAPI, Anthropic, or Twitter directly in many cases (CORS or key exposure patterns). This project uses **Vite `server.proxy` / `preview.proxy`** so that **in `npm run dev` and `npm run preview` only**:

- `/reddit/*` → `https://www.reddit.com/*`
- `/newsapi/*` → `https://newsapi.org/v2/*` (API key appended server-side when the key is set at config time)
- `/anthropic/*` → `https://api.anthropic.com/*` (sends `x-api-key` on the proxied request)
- `/twitterapi/*` → `https://api.twitter.com/*` (sends `Authorization: Bearer …`)

A **static production build** served from plain static hosting has **no** proxy unless you add your own edge or origin proxy. In that situation the app **falls back to the six curated mock discussions** when Reddit fetch fails.

## Reddit

Hot listings use `public` JSON endpoints. Comment threads use `/r/{sub}/comments/{id}.json`. Sentiment heuristics approximate stance distribution and civility when the LLM path is unavailable.

## LLM cache

Successful (or heuristic) “both sides” payloads are cached in `localStorage` under keys prefixed with `nexus_llm_` and keyed by discussion id to avoid repeat charges while developing.

## Google sign-in and notifications

There is no Nexus backend. Sign-in uses **Google**; the app decodes the ID token for **name** and **email**, then asks for **age** locally (Google does not return age). Those fields plus comment history persist with **Zustand `persist`** in the browser (`nexus-user-v3`). Notification items are partly **seeded for demo** and partly generated when you post a comment.
