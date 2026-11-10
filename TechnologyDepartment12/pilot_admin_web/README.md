# pilot-admin-web

游戏管理后台前端项目，基于 Vue 2 + Element UI 构建。

## 技术栈

- Vue 2.6 + Vue Router + Vuex
- Element UI 2.15
- ECharts 5
- Axios

## 开发

```bash
npm install --legacy-peer-deps
npm run dev
```

开发服务器默认运行在 `http://localhost:9999`

## 构建

```bash
# 生产环境
npm run build:production
```

构建产物输出到 `dist/` 目录。

## 环境配置

通过 `.env.development`、`.env.production` 等文件配置接口地址和 WebSocket 地址，修改后需重新构建：

```bash
# .env.production 示例
NODE_ENV = 'production'

# 后端接口地址
VUE_APP_BASE_API = 'java-api.99ads.vip/admin'

# 游戏 WebSocket 地址（control-server）
VUE_APP_WEBSOCKET_API = 'wsspolt.99ads.vip/wss'
```

本地开发使用 `npm run dev`（加载 `.env.development`），生产构建使用 `npm run build`（加载 `.env.production`）。

将 `dist/` 目录下的文件部署到 Nginx 或其他静态服务即可。
