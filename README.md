# World Cup 2026

2026 世界杯专题站。当前项目已经不是单纯的静态展示页，而是一个基于 `Vite + React + TypeScript + Vercel Functions + Upstash Redis` 的内容站，包含赛事快照同步、状态检查、AI 夺冠热门、单场预测和生产端自动更新能力。

## 当前进度

- 前端主站已完成：Hero、分组、小组赛程、淘汰赛、赛事概览等核心版块已经可用。
- 内容接口已完成：前端统一通过 `GET /api/content/worldcup2026` 读取内容。
- 快照存储已完成：生产环境优先读取 Upstash Redis 中的最新世界杯内容快照。
- 同步任务已完成：`GET/POST /api/sync/worldcup2026` 会拉取第三方足球数据并覆盖快照。
- 状态检查已完成：`GET /api/status/worldcup2026` 可查看同步状态、快照时间和比赛数量。
- AI 预测已完成：
  - Hero 区域展示 `predictions.overall` 生成的夺冠热门。
  - `GET/POST` 不适用，单场预测使用 `POST /api/predictions/match`。
  - 单场预测结果会写入 KV 缓存，避免重复生成。
- 生产部署已完成：项目已接入 Vercel。
- 分析埋点已完成：已集成 `@vercel/analytics`。

## 技术栈

- 前端：`React 18`、`TypeScript`、`Vite`
- Serverless：`@vercel/node`
- 存储：`Upstash Redis / Vercel KV`
- 数据源：可配置第三方足球 API，当前适配器围绕 `wc2026api` / `api-football`
- 分析：`@vercel/analytics`

## 运行架构

### 1. 内容读取

前端通过 [src/services/contentApi.ts](/C:/Users/juner/githubProjects/world2026/src/services/contentApi.ts:3) 请求：

- `GET /api/content/worldcup2026`

服务端行为：

- 先读 KV 快照
- KV 没有内容时退回 [server/content/fallbackContent.ts](/C:/Users/juner/githubProjects/world2026/server/content/fallbackContent.ts:5)
- fallback 数据来源于 [public/data/worldcup2026.json](/C:/Users/juner/githubProjects/world2026/public/data/worldcup2026.json:1)

本地开发时，如果 Vercel API 不存在，前端会自动回退到静态 JSON。

### 2. 内容同步

同步入口是：

- `GET /api/sync/worldcup2026`
- `POST /api/sync/worldcup2026`

同步流程定义在 [api/sync/worldcup2026.ts](/C:/Users/juner/githubProjects/world2026/api/sync/worldcup2026.ts:33)：

1. 校验鉴权
2. 拉取第三方 provider 数据
3. 映射为统一的 `WorldCupContent`
4. 生成 `predictions.overall`
5. 写入内容快照和同步状态

当前鉴权支持两类入口：

- `Authorization: Bearer <CRON_SECRET>`：给 Vercel Cron 用
- `Authorization: Bearer <SYNC_SECRET>`、`x-sync-secret`、`?secret=`：给手动触发用

### 3. 状态检查

状态接口：

- `GET /api/status/worldcup2026`

返回内容包括：

- KV 是否已配置
- 当前是否存在快照
- 最近一次同步时间
- 最近一次同步结果
- 当前快照中的比赛总数

### 4. AI 预测

当前有两类预测能力：

- 总览预测：由 [server/content/predictions.ts](/C:/Users/juner/githubProjects/world2026/server/content/predictions.ts:50) 生成 `predictions.overall`
- 单场预测：由 `POST /api/predictions/match` 生成，并缓存到 KV

前端使用位置：

- Hero 区域读取 `content.predictions?.overall`
- 赛程区块支持按场次请求单场预测

## 本地开发

```bash
npm install
npm run dev
```

默认前端会请求：

- `VITE_CONTENT_API_URL=/api/content/worldcup2026`

如果只跑前端开发服务器且本地没有对应 API，前端会自动回退到 `public/data/worldcup2026.json`。

## 构建

```bash
npm run build
npm run preview
```

## API 一览

- `GET /api/content/worldcup2026`
  - 返回当前前端使用的世界杯内容
- `GET /api/status/worldcup2026`
  - 返回同步状态和快照概况
- `GET /api/sync/worldcup2026`
  - 允许手动或 cron 触发同步
- `POST /api/sync/worldcup2026`
  - 同上
- `POST /api/predictions/match`
  - 生成并缓存单场预测

## 环境变量

### 必填

```bash
FOOTBALL_API_PROVIDER=wc2026api
FOOTBALL_API_BASE_URL=https://api.wc2026api.com
FOOTBALL_API_KEY=
SYNC_SECRET=
CRON_SECRET=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### 可选

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

### ApiSports / API-Football 配置示例

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

## Vercel 部署

当前部署方式：

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

项目同时使用：

- Vite 构建静态前端
- Vercel Functions 提供 `/api/*`
- Upstash Redis 保存内容快照、同步状态和单场预测缓存

## Cron 配置

当前 [vercel.json](/C:/Users/juner/githubProjects/world2026/vercel.json:1) 配置为：

- `/api/sync/worldcup2026`
- `0 0 * * *`

注意：

- Vercel Cron 使用 `UTC` 时区
- 这条表达式等于每天 `00:00 UTC`
- 对香港时间是每天 `08:00`
- 新部署不会自动刷新快照，只有 cron 触发或手动触发同步时，KV 内容才会更新

如果你看到线上页面已经部署成功，但 Hero 区域没有最新的 AI 夺冠热门，优先检查：

1. `/api/status/worldcup2026` 是否还是旧快照时间
2. `CRON_SECRET` 是否存在于 Production
3. 是否已经成功调用过 `/api/sync/worldcup2026`

## 手动同步示例

PowerShell：

```powershell
$secret = "your-sync-secret"
Invoke-RestMethod `
  -Uri "https://world2026.vercel.app/api/sync/worldcup2026" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $secret" }
```

## 上线检查

上线前建议至少验证：

- `npm run build` 成功
- 首页首屏正常渲染
- `GET /api/content/worldcup2026` 返回 200
- `GET /api/status/worldcup2026` 返回 200
- Hero 倒计时正常
- Hero 夺冠热门在存在 `predictions.overall` 时正常显示
- 赛程区块单场预测可正常请求
- 移动端布局没有明显错位

## 后续开发建议

当前项目已经具备上线运行能力，下一阶段建议按下面顺序推进：

1. 增加同步失败告警，例如 Vercel Cron 失败通知或第三方告警。
2. 为 `api/predictions/match` 增加更清晰的请求限流和缓存策略。
3. 把 provider 映射层拆成更明确的 schema 校验，减少第三方接口变更风险。
4. 增加集成测试，至少覆盖 `content`、`sync`、`status`、`predictions` 四条主链路。
5. 如果后续需要后台编辑、审计和历史回溯，再引入结构化数据库，而不是继续把所有状态都塞进快照。
