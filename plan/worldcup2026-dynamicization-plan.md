# World Cup 2026 站点动态化与部署整理方案

## Summary
将当前单文件静态页升级为 `Vite + React` 单页站点，保留现有视觉和信息结构，但把所有硬编码赛事内容抽离为可请求的数据文件。第一版使用本地 JSON 动态获取，部署目标定为 `Vercel`，不引入后端；同时预留统一数据访问层，方便后续替换为第三方足球 API 或定时同步脚本。

## Key Changes
- 工程结构改为前端项目：
  - `src/` 放 React 入口、页面组件、状态和样式。
  - `public/data/worldcup2026.json` 放当前页面所有赛事内容。
  - `public/` 放 favicon、静态图片等无需打包处理的资源。
- 页面拆分为数据驱动组件，至少包括：
  - `Ticker`
  - `Hero`
  - `SectionTabs`
  - `GroupsSection`
  - `ScheduleSection`
  - `KnockoutSection`
  - `OverviewSection`
  - `Footer`
- 建立统一数据访问层，例如 `src/services/contentApi.ts`：
  - 页面初始化时 `fetch` 本地 JSON，而不是直接写死在 JSX/HTML 中。
  - 统一处理 `loading / error / success` 三种状态。
  - 获取路径使用 `import.meta.env.BASE_URL` 组装，避免后续换部署根路径时出错。
- 将当前内联脚本迁移为 React 逻辑：
  - tab 切换改为组件状态控制。
  - 倒计时改为独立 hook 或 utility，按开幕时间计算并定时刷新。
- 样式从单 HTML 中拆出：
  - 保留现有设计语言和 CSS variables。
  - 基础样式与区块样式分离，避免继续维护超长内联 `<style>`。
- 部署准备：
  - 增加 `package.json`、Vite 配置、README。
  - 让 `npm run build` 产出可直接由 Vercel 托管的静态资源。
  - 不为 v1 增加服务端函数；如后续接私有 API key，再补 `api/` 或 serverless proxy。

## Public APIs / Data Shape
- 对外页面仍是单页站点，不新增用户可见路由。
- 新增内部数据契约 `worldcup2026.json`，建议包含这些顶层字段：
  - `meta`: 标题、最后更新时间、来源列表
  - `ticker`: 滚动条文案数组
  - `hero`: 赛事标题、时间范围、主办国、开幕信息
  - `groups`: 12 个小组及球队列表
  - `schedule`: 按日期分组的比赛列表
  - `knockout`: 阶段摘要、决赛场地、赛制说明
  - `overview`: 统计卡片、东道主摘要、热门排行
- React 侧使用 TypeScript 定义对应类型，确保后续替换数据源时只需适配服务层和数据映射。

## Test Plan
- 渲染验证：
  - 首屏成功拉取 JSON 后，页面能完整渲染当前 4 个主区块。
  - 小组数、比赛数、热门排行数与 JSON 数据一致，不再依赖硬编码 DOM。
- 交互验证：
  - tab 切换正常显示对应区块。
  - 倒计时在开赛前显示剩余天数，开赛后显示进行中状态。
- 异常验证：
  - JSON 请求失败时显示明确错误提示，不出现空白页。
  - JSON 缺少非关键字段时，页面可优雅降级。
- 构建部署验证：
  - `npm run build` 成功。
  - 本地预览与 Vercel 预览环境都能正确读取 `public/data/worldcup2026.json`。

## Assumptions
- 保持当前单页信息架构和视觉风格，不在本轮改成多路由网站。
- 第一版“动态获取”定义为“前端通过请求数据文件渲染页面”，不是接实时比赛 API。
- 采用 `React + TypeScript + Vite`，不引入额外 UI 框架。
- 当前页脚里的来源与更新时间继续作为内容数据的一部分维护，后续若接真实数据源再改为自动生成。
