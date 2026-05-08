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
