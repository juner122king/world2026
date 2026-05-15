# World Cup 2026

2026 世界杯双端 monorepo。当前仓库包含 Web 前端、Vercel API、服务端内容同步逻辑、共享内容契约，以及 Native Kotlin Android 项目骨架。

## 目录结构

```text
world2026/
  apps/
    web/                  # Vite + React Web app
    android/              # Native Kotlin Android app
  packages/
    content-contract/     # Shared TypeScript API/content types
  api/                    # Vercel Functions
  server/                 # Provider mapping, KV storage, prediction helpers
  public-data/            # Static fallback data copied into the Web build
  dist/                   # Web build output for Vercel
```

## 当前能力

- Web 主站：Hero、分组、小组赛程、淘汰赛、赛事概览、Vercel Analytics。
- 内容接口：`GET /api/content/worldcup2026`。
- 同步接口：`GET/POST /api/sync/worldcup2026`，支持 Vercel Cron 和手动触发。
- 状态接口：`GET /api/status/worldcup2026`。
- AI 预测：Hero 夺冠热门和 `POST /api/predictions/match` 单场预测。
- Android：Native Kotlin 标准项目骨架，默认 API 指向 `https://world2026.vercel.app`。

## 常用命令

```bash
npm install
npm run dev:web
npm run build
npm run preview:web
npm run typecheck:api
```

说明：

- `npm run build` 会构建 Web 并检查 Vercel API/server TypeScript。
- Web 构建输出仍是根目录 `dist/`，Vercel Output Directory 保持不变。
- Android 请用 Android Studio 打开 `apps/android`。

## Web

Web app 位于 `apps/web`，主要技术栈：

- `React 18`
- `TypeScript`
- `Vite`
- `@vercel/analytics`
- `flag-icons`

前端内容请求入口：

- `apps/web/src/services/contentApi.ts`
- 默认请求 `/api/content/worldcup2026`
- 本地开发时，如果 API 不可用，会回退到 `/data/worldcup2026.json`

静态 fallback 数据位于 `public-data/data/worldcup2026.json`，Vite 会在构建时复制到 `dist/data/worldcup2026.json`。

## API 与同步

Vercel Functions 仍保留在根目录 `api/`，避免破坏 Vercel 默认发现路径：

- `GET /api/content/worldcup2026`
- `GET /api/status/worldcup2026`
- `GET/POST /api/sync/worldcup2026`
- `POST /api/predictions/match`

服务端逻辑位于 `server/`：

- provider 数据拉取和映射
- Upstash Redis 快照读写
- 同步状态读写
- 总览预测和单场预测

Cron 配置位于 `vercel.json`：

- path: `/api/sync/worldcup2026`
- schedule: `0 0 * * *`
- Vercel Cron 使用 UTC，对香港时间是每天 `08:00`

## Android

Android 项目位于 `apps/android`：

- Native Kotlin
- package name: `com.juner.world2026`
- module: `:app`
- minSdk: `26`
- compileSdk / targetSdk: `35`

默认 API base URL：

```text
https://world2026.vercel.app
```

可通过 Gradle property 覆盖：

```bash
./gradlew assembleDebug -PWORLD2026_API_BASE_URL=https://your-preview.vercel.app
```

当前 Android v1 只提供项目骨架和 API 配置入口，完整 UI 与 API 客户端实现属于下一阶段。

## 共享契约

共享 TypeScript 类型位于 `packages/content-contract`，由 Web、API 和 server 共同引用。

主要类型：

- `WorldCupContent`
- `ScheduleDay`
- `ScheduleMatch`
- `OverallPredictionSummary`
- `MatchPrediction`
- `MatchPredictionRequest`

Android 不直接导入 TypeScript package；实现 API client 时应按这些字段建立 Kotlin data class。

## 环境变量

必填：

```bash
FOOTBALL_API_PROVIDER=wc2026api
FOOTBALL_API_BASE_URL=https://api.wc2026api.com
FOOTBALL_API_KEY=
SYNC_SECRET=
CRON_SECRET=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

可选：

```bash
FOOTBALL_API_KEY_HEADER=Authorization
FOOTBALL_API_AUTH_SCHEME=Bearer
FOOTBALL_API_FIXTURES_PATH=/matches
FOOTBALL_API_STANDINGS_PATH=/standings
FOOTBALL_API_TEAMS_PATH=/teams
FOOTBALL_API_VENUES_PATH=/stadiums
VITE_CONTENT_API_URL=/api/content/worldcup2026
KV_REST_API_READ_ONLY_TOKEN=
KV_URL=
REDIS_URL=
```

## 上线检查

- `npm run build` 成功。
- `GET /api/content/worldcup2026` 返回 200。
- `GET /api/status/worldcup2026` 返回 200。
- Hero 夺冠热门在 `predictions.overall` 存在时正常显示。
- 赛程区块单场预测可请求。
- Vercel 部署仍使用根目录项目，Output Directory 仍为 `dist`。
- Android Studio 能打开并同步 `apps/android`。
