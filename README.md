# World Cup 2026

基于 Vite + React + TypeScript 的单页站点，页面内容从 `public/data/worldcup2026.json` 动态加载。

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

首版不接后端，前端通过 `src/services/contentApi.ts` 请求本地 JSON。
后续如果切换到第三方足球 API，只需要替换数据访问层和映射逻辑。

## 外网部署

默认部署目标是 Vercel，且保持纯静态站点：
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

当前配置默认按根路径部署：
- 生产根路径：`/`
- 数据文件地址会通过 `import.meta.env.BASE_URL` 自动解析到 `data/worldcup2026.json`

如果后续需要部署到子路径，例如 `/world2026/`，在构建前设置环境变量：

```bash
VITE_BASE_PATH=/world2026/ npm run build
```

这样 Vite 生成的静态资源路径和 `src/services/contentApi.ts` 的数据请求路径会保持一致。

## 上线前检查

本地先执行：

```bash
npm run build
npm run preview
```

检查项：
- 页面首屏正常渲染
- `assets/*` 请求返回 200
- `data/worldcup2026.json` 请求返回 200
- tab 切换正常
- 倒计时正常显示
- 控制台没有路径相关报错

## 上线后检查

部署到 Vercel 后检查：
- 公网首页可直接访问
- 刷新页面后仍可正常打开
- 静态资源和 `worldcup2026.json` 都返回 200
- 移动端视口没有明显布局错位
