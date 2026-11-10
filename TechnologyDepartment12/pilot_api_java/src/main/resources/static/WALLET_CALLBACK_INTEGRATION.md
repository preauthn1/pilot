# Pilot 游戏钱包对接接口文档

> 适用对象：拥有自有钱包系统、需要接入 Pilot 游戏的商家技术团队

## 1. 对接范围

本文件仅描述自有钱包模式下的游戏对接。商家需实现钱包回调接口；Pilot 游戏平台负责游戏逻辑、下注流程与游戏结果。

不包含后台账号使用、玩家上下分、报表查询或管理后台接口。平台会为商家创建商户与渠道配置，并提供 `channel`、`secret`、可用 `gameCode` 和游戏入口地址。

## 2. 对接流程

1. 商家服务端调用 Pilot 登录接口，取得玩家的游戏地址。
2. 商家将玩家浏览器重定向至游戏地址。
3. 游戏运行期间，Pilot 根据商家配置的 `notifyUrl` 回调商家钱包：查询余额、下注、撤单、结算。
4. 商家钱包完成资金处理并返回最新余额。

商家钱包接口必须支持 HTTPS、JSON 请求、签名校验以及按 `refId` 幂等处理。

## 3. 前置配置

请在联调前向 Pilot 提供以下信息：

| 项目 | 说明 |
| --- | --- |
| `notifyUrl` | 商家钱包服务基础地址，例如 `https://wallet.example.com/game` |
| 固定出口 IP | 供双方配置 API 白名单 |
| `secret` | 双方约定的回调签名密钥 |
| `gameCode` | 需要开通的游戏代码 |
| `channel` | Pilot 分配的渠道名称 |

Pilot 会将商家设置为回调钱包模式（`walletType=1`），并依次请求：

```text
POST {notifyUrl}/getBalance
POST {notifyUrl}/bet
POST {notifyUrl}/unbet
POST {notifyUrl}/settle
```

## 4. 游戏入口接口

### 4.1 获取游戏地址

```text
POST {pilotBaseUrl}/login
Content-Type: application/json
```

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 商家侧玩家唯一标识 |
| `channel` | string | 是 | Pilot 分配的渠道名称 |
| `currency` | string | 否 | 渠道已配置的币种；不传使用渠道默认币种 |
| `gameCode` | string | 否 | 指定进入的游戏代码；也兼容 `game_code` |
| `expand` | string | 否 | 商家扩展信息，原样保存 |

请求示例：

```json
{
  "username": "player001",
  "channel": "demo_channel",
  "currency": "INR",
  "gameCode": "dice"
}
```

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "url": "https://game.example.com?token=6f5d...",
    "username": "player001",
    "channelId": 10001,
    "gameCode": "dice"
  }
}
```

商家应将玩家浏览器重定向到 `data.url`。不要解析、修改、缓存或复用其中的 `token`。首次调用会自动创建玩家。

常见返回码：`107` 游戏未开通或维护中，`108` 渠道未配置请求币种，`201` 渠道不存在。

## 5. 钱包回调通用约定

Pilot 向商家钱包发起的请求均为 `POST`，请求头为：

```text
Content-Type: application/json; charset=utf-8
```

### 5.1 公共字段

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `appid` | string | 固定值 `AF` |
| `channel` | string | 渠道名称 |
| `channelId` | number | Pilot 渠道 ID |
| `username` | string | 商家玩家 ID |
| `currency` | string | 玩家币种 |
| `game_code` | string | 当前游戏代码 |
| `sign` | string | MD5 签名，计算方式见 5.3 节 |

### 5.2 金额单位

钱包回调中的 `amount`、`rewardAmount` 和响应中的 `data.balance` 均使用商家主币单位，不使用分。例如：

| 场景 | 传值 |
| --- | --- |
| 下注 10 元 | `"amount": "10"` |
| 下注 10.5 元 | `"amount": "10.5"` |
| 钱包余额 998.5 元 | `"balance": 998.5` |

商家请使用十进制类型保存和计算金额，避免浮点精度问题。

### 5.3 签名规则

将请求中除 `sign` 外的全部非空字段，按字段名 ASCII 升序拼接，末尾追加 `key={secret}`，然后取小写 MD5。

```text
appid=AF&amount=10&channel=demo_channel&channelId=10001&currency=INR&game_code=dice&refId=R202609290001&username=player001&key={secret}
```

```text
sign = md5(canonicalString).toLowerCase()
```

数值参与签名时去除无意义的末尾零：`10.0` 按 `10`，`1.50` 按 `1.5`。商家必须先验签，再处理资金。

### 5.4 统一响应

所有回调请返回 HTTP 200 和 JSON。成功时使用：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "balance": 998.5
  }
}
```

失败时返回非 0 `code` 和原因：

```json
{
  "code": 3001,
  "msg": "insufficient balance"
}
```

## 6. 钱包回调接口

### 6.1 查询余额

```text
POST {notifyUrl}/getBalance
```

请求示例：

```json
{
  "appid": "AF",
  "channel": "demo_channel",
  "channelId": 10001,
  "username": "player001",
  "currency": "INR",
  "game_code": "dice",
  "sign": "..."
}
```

商家返回该玩家当前可用余额：

```json
{
  "code": 0,
  "msg": "success",
  "data": { "balance": 1000.25 }
}
```

### 6.2 下注扣款

```text
POST {notifyUrl}/bet
```

在公共字段基础上新增：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `refId` | string | Pilot 注单唯一号，也是商家扣款幂等键 |
| `amount` | string | 下注金额，主币单位，必定大于 0 |

请求示例：

```json
{
  "appid": "AF",
  "channel": "demo_channel",
  "channelId": 10001,
  "username": "player001",
  "currency": "INR",
  "game_code": "dice",
  "refId": "R202609290001",
  "amount": "10.5",
  "sign": "..."
}
```

商家必须以 `refId` 幂等扣款。重复请求不得重复扣钱，应返回第一次成功后的结果和当前余额。

### 6.3 取消下注

```text
POST {notifyUrl}/unbet
```

在公共字段基础上新增 `refId`。Pilot 当前不会传递退款金额，商家应依据 `refId` 查询原下注并进行幂等退款。

```json
{
  "appid": "AF",
  "channel": "demo_channel",
  "channelId": 10001,
  "username": "player001",
  "currency": "INR",
  "game_code": "dice",
  "refId": "R202609290001",
  "sign": "..."
}
```

同一注单已退款时仍应返回 `code=0`，避免 Pilot 因重试导致异常。

### 6.4 结算派奖

```text
POST {notifyUrl}/settle
```

在公共字段基础上新增：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `refId` | string | 与下注相同的注单号，也是结算幂等键 |
| `rewardAmount` | string | 派彩金额，主币单位；可为 0 或负数 |

```json
{
  "appid": "AF",
  "channel": "demo_channel",
  "channelId": 10001,
  "username": "player001",
  "currency": "INR",
  "game_code": "dice",
  "refId": "R202609290001",
  "rewardAmount": "21",
  "sign": "..."
}
```

商家必须按 `refId` 幂等入账，同一注单只能派奖一次。网络异常时 Pilot 会重试结算请求，商家应返回原处理结果而不是重复派彩。

## 7. 联调验收

请按以下顺序完成测试：

1. 调用登录接口，确认可获取游戏地址并正常进入游戏。
2. 确认进入游戏时 `getBalance` 被回调，余额显示正确。
3. 完成一笔下注，确认 `bet` 只扣款一次。
4. 模拟取消下注，确认 `unbet` 只退款一次。
5. 完成一局结算，确认 `settle` 只派奖一次。
6. 对同一 `refId` 重放 `bet`、`unbet`、`settle`，确认不会重复记账。
7. 验证错误签名、余额不足和回调超时均能被安全处理。

## 8. 对接支持信息

联调问题请提供：渠道名称、玩家 ID、游戏代码、`refId`、请求时间、完整请求与响应（请脱敏 `sign` 和 `secret`）。
