# @world2026/content-contract

Shared TypeScript contract for the World Cup 2026 content API.

This package defines the JSON shape consumed by:

- Web app in `apps/web`
- Vercel Functions in `api`
- Server content helpers in `server`

Android does not import this TypeScript package directly. The Kotlin app should mirror these fields in native data classes when the Android API client is implemented.

Primary exported types:

- `WorldCupContent`
- `ScheduleDay`
- `ScheduleMatch`
- `OverallPredictionSummary`
- `MatchPrediction`
- `MatchPredictionRequest`
