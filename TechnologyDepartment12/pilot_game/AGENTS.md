# pilot_game 规则

来源：`../.cursor/rules/pilot-game.mdc`。这些规则适用于 Vue2 玩家端。

- 这是玩家端游戏前端，技术栈是 Vue2、Vue CLI、Vuex、Vant、Phaser、axios，以及内置 Pinus/Pomelo client。运行命令时从 `pilot_game` 子仓库根目录执行。
- HTTP API 调用必须走 `src/common/request.js` 和 `src/api` 下现有模块。不要在组件里创建重复 axios 实例。
- 玩家正常进入链路是 Java `/api/serverConfig` -> 前端 client store -> Pinus `connector.entryHandler.entry` -> game handlers。
- Pinus client 状态集中在 `src/store/modules/client.js` 和 `window.pomelo`。复用这个 store，不要另建第二套 socket client。
- 游戏交互组件使用 Pomelo routes，例如 `aviator.aviatorHandler.enterRequest`、`betRequest`、`cancelRequest`、`cashOutRequest`、`updateAutoCashOutRequest`。route 名称必须和 `pilot_game_server/config/dictionary.ts` 对齐。
- 修改 Aviator UI 或行为前，先检查 `src/components/mixin.js`、`src/components/bet-box/index.vue`、`src/components/list-box/index.vue`、`src/common/game.js`。
- 除非确认问题在协议本身，不要修改 `src/assets/js/pinus` 下内置 Pinus 协议文件。
- 保留现有移动端布局习惯、Vant 组件、rem/pxtorem 样式和 Phaser 资源加载方式。
- 涉及免费下注、自动提现、钱包余额、结算行为时，必须同时核对前端请求和 game-server handler，不要只改一侧。
- 验证命令从 `pilot_game` 执行：lint 用 `npm run lint`，生产构建用 `npm run build`；只有用户要求运行服务时才执行 `npm run serve` 或 `npm run dev`。
