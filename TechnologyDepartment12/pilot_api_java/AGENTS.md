# pilot_api_java 规则

来源：`../.cursor/rules/pilot-api-java.mdc`。这些规则适用于 Spring Boot Java 后端。

- 这是 Spring Boot 3.3.5、Java 21、MyBatis-Plus、MySQL、Redis、Maven 后端。运行命令时从 `pilot_api_java` 子仓库根目录执行。
- 保持 `src/main/java/com/politapi` 下现有分层：`controller`、`service`、`service/impl`、`mapper`、`entity`、`dto`、`config`、`interceptor`、`context`、`util`。
- Controller 保持薄层：只做参数接收/校验、调用 service、返回 `Result`。业务规则放到 service。
- 管理后台 API 使用 `/admin/*` 路由；玩家或商户对接 API 沿用现有 `/api/*` 风格。新增接口时要和前端 API 模块路径精确对应。
- 自定义 SQL 优先复用 MyBatis-Plus `BaseMapper` 和 `src/main/resources/mapper` 下现有 XML mapper 模式。Java mapper 方法签名和 XML 参数名必须同步。
- 保留认证和数据范围行为。修改后台列表/报表查询、渠道/商户过滤前，先检查 `JwtInterceptor`、`AdminContext`、`DataScopeHelper`。
- 公开 API 文档中的金额通常以分为单位。修改钱包、报表、金币、免费下注、结算代码前，必须确认单位转换。
- 修改 `game_max` 等游戏控制倍数字段时要谨慎，先确认当前链路期望的是前端展示倍数、数据库 decimal 值，还是 game-server 内部单位。
- 数据库变更尽量做成增量且可重复执行。迁移脚本放在 `src/main/resources/db`；只有种子/初始化数据也需要同步时才更新 `init.sql`。
- 不要提交真实密钥、线上数据库密码、钱包 key 或本地 `application-*.yml` 里的生产 host 改动。
- 验证命令从 `pilot_api_java` 执行：有测试时用 `mvn test`；没有聚焦测试时，至少用 `mvn -DskipTests compile` 做编译验证。
