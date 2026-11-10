# pilot_game_server 规则

来源：`../.cursor/rules/pilot-game-server.mdc`。这些规则适用于 Pinus TypeScript 游戏服务端。

- 这是 Pinus TypeScript 游戏服务端，使用 yarn classic。运行命令时从 `pilot_game_server` 子仓库根目录执行。
- 本地配置里的关键端口：connector frontend `3050`、control frontend `8050`、control HTTP `9000`、master `3005`。不要把 Java API 端口 `8880` 和 Pinus websocket/control 端口混淆。
- route 名称必须和 `config/dictionary.ts`、前端 Pomelo 请求、`app/servers/*/handler` 下服务端 handler 同步。
- 游戏逻辑分布在 `app/games/*`、`app/servers/*`、`app/services`、`app/dao`、`app/util`。复用这些边界，不要把业务逻辑随意塞进 handler。
- 修改 Aviator 行为前，先检查 `app/games/aviator/chanelRoom.ts`、`app/games/aviator/controlConfig.ts`，以及对应 `app/servers/aviator` handlers/remotes。
- 外部钱包调用集中在 `app/util/HttpsUtil.ts`。保持 bet、cancel、settle、balance、freeBetUse、freeBetRecover 的请求语义。
- 结算和进度逻辑尽量保持幂等。必须防止重复 cash-out、cancel、free-bet recovery、forced settlement、reconnect、offline handling。
- 修改渠道或用户身份传递时，要一起追 Java token 生成、玩家 `/api/serverConfig`、connector entry、`channelId`、`merchantId`、game-room lookup。
- 管理端控制和实时监控要区分 control frontend `8050`、control HTTP `9000`，以及 `status`、`syncPoint` 等 observer events。
- 金额和倍数计算要使用精确逻辑。除非 Java API、前端展示、数据库 schema 同时更新，否则保持当前内部倍数约定。
- 验证命令从 `pilot_game_server` 执行：编译验证用 `yarn run build` 或 `yarn test`。除非用户要求，不要启动或重启服务端。
