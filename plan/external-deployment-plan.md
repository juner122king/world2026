# 外网部署方案

当前项目已经是 `Vite + React + TypeScript` 静态单页应用，内容通过 `public/data/worldcup2026.json` 提供，并在 `src/services/contentApi.ts` 中使用 `import.meta.env.BASE_URL` 请求。部署目标为 Vercel，保持纯静态站点，不引入后端。

## 核心实现

1. 在 `vite.config.ts` 中显式声明 `base`，默认值为 `/`，并允许通过 `VITE_BASE_PATH` 覆盖，以支持未来子路径部署。
2. 保持 `src/services/contentApi.ts` 的现有实现，继续复用 `import.meta.env.BASE_URL` 保障 JSON 请求路径与静态资源路径一致。
3. 在 `README.md` 中补充 Vercel 部署说明、本地预览方式、根路径与子路径部署差异、以及上线前后检查项。
4. 第一版不增加 `vercel.json`，除非后续验证发现平台默认行为不足。

## 关键文件

- `vite.config.ts`
- `README.md`
- `src/services/contentApi.ts`
- `public/data/worldcup2026.json`

## 验证

### 本地
- `npm run build`
- `npm run preview`
- 检查首页渲染、静态资源、`data/worldcup2026.json`、tab 切换、倒计时、控制台报错

### 子路径验证
- `VITE_BASE_PATH=/world2026/ npm run build`
- 确认资源路径与 `data/worldcup2026.json` 请求都带 `/world2026/` 前缀

### 上线后
- 检查公网首页、刷新行为、静态资源、JSON 请求、移动端布局
