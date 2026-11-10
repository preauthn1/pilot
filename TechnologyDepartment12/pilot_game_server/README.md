# Game Server - 游戏服务器

基于 [Pinus](https://github.com/node-pinus/pinus) 框架的多游戏服务器，使用 TypeScript 开发，支持多种游戏类型。

## 游戏列表

| 游戏 | 服务器类型 | 说明 |
|------|-----------|------|
| Aviator | `aviator` | 小飞机 |
| Mines | `mines` | 扫雷 |
| Dice | `dice` | 骰子 |
| Pirate | `pirate` | 海盗 |
| Racing | `racing` | 赛车 |
| Triple | `triple` | 三倍 |
| Jump | `jump` | 跳一跳 |
| SuperAce | `superAce` | 超级Ace |
| ClearMines | `clearMines` | 清除地雷 |
| Tiger | `tiger` | 老虎 |

## 项目结构

```
game-server/
├── app/                  # 应用源码（TypeScript）
│   ├── components/       # 组件（HTTP服务、MySQL连接池）
│   ├── consts/           # 常量定义
│   ├── dao/              # 数据访问层
│   ├── filter/           # 过滤器
│   ├── games/            # 各游戏逻辑
│   ├── plugin/           # 插件
│   ├── servers/          # 服务器类型（connector/hall/control + 各游戏）
│   ├── services/         # 服务层
│   └── util/             # 工具类
├── config/               # 配置文件（TypeScript）
│   ├── mysql.ts          # MySQL 数据库配置
│   ├── servers.ts        # 服务器节点配置
│   ├── master.ts         # Master 配置
│   └── ...               # 其他配置
├── dist/                 # 编译输出（JavaScript）
├── readMe/               # 补充文档
├── app.ts                # 应用入口
├── preload.ts            # 预加载
└── package.json
```

## 环境要求

| 软件 | 版本 |
|------|------|
| Node.js | 16.14.2+ |
| npm | 8.5.0+ |
| MySQL | 8.0+ |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

或 Windows：

```bash
npm-install.bat
```

### 2. 修改配置

编辑 `config/mysql.ts`，填入正确的 MySQL 连接信息。

### 3. 编译代码

```bash
npm run build
```

### 4. 启动服务器

**开发模式（直接启动）：**

```bash
cd dist
node app
```

看到 `all servers startup in xxx ms` 即表示启动成功。

**生产模式（使用 pinus 命令）：**

```bash
cd dist
pinus start -e production -D
```

### 5. 关闭服务器

```bash
cd dist
pinus stop
```

## 调试

1. 在 game-server 目录启动 VS Code
2. 正常启动游戏服
3. 在 VS Code "运行和调试" 面板，选择 Attach To Connector 或 Attach To Master
4. 按 F5 附加调试器，即可断点调试

## 命令说明

| 命令 | 说明 |
|------|------|
| `npm run build` | 编译 TypeScript |
| `npm run start` | 编译并启动开发服 |
| `npm run dev` | ts-node 直接运行（不编译） |

## 相关文档

- [架设方式](./readMe/架设方式.md)
- [log4js 配置](./readMe/log4js配置.md)
