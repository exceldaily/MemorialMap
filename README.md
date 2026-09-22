# Everwhere — Memorial Map

A digital memorial platform centered on an interactive world map. Choose a place in the world, create a memorial, and give their story somewhere to live.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, Postgres + PostGIS, Storage, RLS) · Mapbox GL JS v3 · Vercel

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase publishable / anon key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | yes | Mapbox public token (`pk.…`) used by the browser map |
| `MAPBOX_SERVER_TOKEN` | no | Optional separate token for server-side geocoding (falls back to the public token) |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL, e.g. `https://everwhere.example` |
| `NEXT_PUBLIC_SITE_NAME` | no | Defaults to `Everwhere` |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only; enables storage cleanup when photos are deleted. Never exposed to the browser. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Shown on the contact page |

## Database

All tables live in the `memorial` schema of the Supabase project (migrations `memorial_0001` … `memorial_0006`): profiles, memorials, memorial_locations (PostGIS), memorial_admins, memorial_photos, memorial_videos, memories, tributes, timeline_events, family_relationships, family_groups, family_group_members, saved_memorials, reports, blocked_geographic_areas, activity_logs, plans, subscriptions, settings. Row Level Security is enabled on every table; writes that need coordination (location claims, tributes, publishing, admin actions) go through `security definer` RPCs.

Storage buckets: `memorial-avatars`, `memorial-profile-images`, `memorial-cover-images`, `memorial-gallery`, `memorial-memory-photos`, `memorial-videos` (objects live under `<userId>/…`).

## Development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

`npm run lint`, `npx tsc --noEmit` and `npm run build` must pass before deploying.

## Important product rule

Memorial locations are **virtual markers** within the platform. They never imply burial, ownership, occupancy, access, affiliation or any rights to the corresponding physical place. The UI never uses "buried at", "located at", "grave", "buy/own land" or "property" for a digital memorial location; an optional, separate *Actual resting place* field exists for families who want to record one.
