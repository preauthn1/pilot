# polit-api

Spring Boot 3.3.5 + MyBatis-Plus + Redis 游戏后台 API，替代 PHP polit_api。

## 技术栈

| 组件 | 版本 |
|------|------|
| Java | 21 |
| Spring Boot | 3.3.5 |
| MyBatis-Plus | 3.5.10.1 |
| MySQL | 8.x |
| Redis | 6.x+ |
| Druid | 1.2.23 |
| Fastjson | 2.0.53 |

## 快速开始

### 1. 配置数据库

新数据库先导入 `src/main/resources/db/init.sql`，再执行 `src/main/resources/db/20260917_channel_currency_settings.sql`，将币种配置初始化为渠道维度。

编辑 `src/main/resources/application-dev.yml` 或 `application-prod.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/pilot?useUnicode=true&characterEncoding=utf-8&serverTimezone=GMT%2B07:00
    username: root
    password: root
  data:
    redis:
      host: 127.0.0.1
      port: 6379
      database: 3       # 与 PHP 共用 db3
```

### 2. 构建

```bash
mvn clean package -DskipTests
```

### 3. 启动

```bash
# 开发环境
java -jar target/polit-api-1.0.0.jar --spring.profiles.active=dev

# 生产环境
java -jar target/polit-api-1.0.0.jar --spring.profiles.active=prod
```

或使用启动脚本：

```bash
chmod +x start.sh
./start.sh start      # 启动
./start.sh restart    # 平滑重启
./start.sh stop       # 停止
./start.sh status     # 查看状态
```

### 4. 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `spring.profiles.active` | 激活配置 | `dev` |
| `redis.prefix` | Redis key 前缀（与 PHP 一致） | `laravel_database_` |

## 项目结构

```
src/main/java/com/politapi/
├── controller/
│   ├── api/          # 对外开放接口（H5/游戏调用）
│   └── admin/        # 管理后台接口
├── service/          # 业务接口
│   └── impl/         # 业务实现
├── mapper/           # MyBatis-Plus Mapper
├── entity/           # 数据实体
├── config/           # 配置类
├── interceptor/      # 拦截器（JWT 鉴权等）
├── common/           # 通用类（Result, ApiCode 等）
└── util/             # 工具类
```

## 注意事项

- Redis 使用 **db3** 且 key 前缀为 `laravel_database_`，确保 Token 互通。
- 平滑重启依赖 Spring Boot graceful shutdown（`server.shutdown=graceful`），处理中的请求不会丢失。
- 端口默认 8080。
