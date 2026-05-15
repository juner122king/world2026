# World Cup 2026

基于 Vite + React + TypeScript 的单页站点，页面内容从站内聚合 API 动态加载。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 数据

前端通过 `src/services/contentApi.ts` 请求 `GET /api/content/worldcup2026`。
本地只跑 `npm run dev` 时，如果 Vercel API 不存在，会自动回退到 `public/data/worldcup2026.json`，方便前端开发。
该接口优先读取 Vercel KV 中的最新快照；没有快照时使用 `public/data/worldcup2026.json` 作为兜底内容。

同步入口为 `GET/POST /api/sync/worldcup2026`，用于 Vercel Cron 或手动触发。同步接口会从第三方足球 API 拉取数据，经服务端 adapter 转换成前端稳定使用的 `WorldCupContent`。

状态接口为 `GET /api/status/worldcup2026`，用于检查 Redis/KV 是否已配置、是否存在快照、最近同步时间、同步结果和当前快照比赛数量。

需要在 Vercel 配置这些环境变量：

```bash
FOOTBALL_API_PROVIDER=wc2026api
FOOTBALL_API_BASE_URL=https://api.wc2026api.com
FOOTBALL_API_KEY=
SYNC_SECRET=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

可选环境变量：

```bash
FOOTBALL_API_KEY_HEADER=Authorization
FOOTBALL_API_AUTH_SCHEME=Bearer
FOOTBALL_API_FIXTURES_PATH=/matches
FOOTBALL_API_STANDINGS_PATH=/standings
FOOTBALL_API_TEAMS_PATH=/teams
FOOTBALL_API_VENUES_PATH=/stadiums
VITE_CONTENT_API_URL=/api/content/worldcup2026
```

如果改用 API-Football / ApiSports，则配置：

```bash
FOOTBALL_API_PROVIDER=api-football
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
FOOTBALL_API_KEY_HEADER=x-apisports-key
FOOTBALL_API_AUTH_SCHEME=
FOOTBALL_API_FIXTURES_PATH=/fixtures?league=1&season=2026
FOOTBALL_API_STANDINGS_PATH=/standings?league=1&season=2026
FOOTBALL_API_TEAMS_PATH=/teams?league=1&season=2026
FOOTBALL_API_VENUES_PATH=/venues?league=1&season=2026
```

## 外网部署

默认部署目标是 Vercel，且保持纯静态站点：
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

当前配置默认按根路径部署：
- 生产根路径：`/`
- 数据接口默认请求 `/api/content/worldcup2026`

如果后续需要部署到子路径，例如 `/world2026/`，在构建前设置环境变量：

```bash
VITE_BASE_PATH=/world2026/ npm run build
```

这样 Vite 生成的静态资源路径和 `src/services/contentApi.ts` 的 API 请求路径会保持一致。

## 上线前检查

本地先执行：

```bash
npm run build
npm run preview
```

检查项：
- 页面首屏正常渲染
- `assets/*` 请求返回 200
- `api/content/worldcup2026` 请求返回 200
- tab 切换正常
- 倒计时正常显示
- 控制台没有路径相关报错

## 上线后检查

部署到 Vercel 后检查：
- 公网首页可直接访问
- 刷新页面后仍可正常打开
- 静态资源和 `api/content/worldcup2026` 都返回 200
- 移动端视口没有明显布局错位

## 后端与数据库路线

当前正式方案是 `Vercel Functions + Upstash Redis`：
- `GET /api/content/worldcup2026` 读取最新聚合快照。
- `GET/POST /api/sync/worldcup2026` 同步 WC2026 API 并覆盖快照。
- `GET /api/status/worldcup2026` 查看同步状态和快照概况。

如果后续需要按球队/场馆/小组查询、后台编辑、历史同步记录或数据审计，优先升级为 `Vercel Functions + Supabase Postgres + Upstash Redis`：
- Supabase 存结构化表，例如 `teams`、`venues`、`matches`、`groups`、`sync_runs`。
- Redis 继续保存前端读取的 `WorldCupContent` 快照。
- 前端接口保持不变，避免组件层感知数据库结构。

如果只需要代码化迁移和 serverless Postgres，不需要 Supabase 后台，可改用 `Neon Postgres + Drizzle`。

如果后续出现高频同步、队列、实时比分推送或复杂后台，再考虑独立 Node 后端。
