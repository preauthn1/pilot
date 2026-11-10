# aviator

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## 环境配置

通过 `.env.development`、`.env.production` 配置接口地址和 WebSocket 地址：

```bash
# .env.production 示例
NODE_ENV = 'production'
ENV = '-production'

# 后端接口地址
VUE_APP_BASE_API = 'java-api.99ads.vip/api'

# 游戏 WebSocket 地址（game-server connector）
VUE_APP_WS_ADDRESS = 'wsspolt.99ads.vip'
```

- 本地开发：`npm run dev`（加载 `.env.development`）
- 生产构建：`npm run build`（加载 `.env.production`）

修改配置后需重启开发服务器或重新构建。
