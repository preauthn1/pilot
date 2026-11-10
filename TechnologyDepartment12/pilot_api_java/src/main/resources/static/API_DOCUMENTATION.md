# Pilot API - 商户对接指南

> **服务地址**: `http://localhost:8880`
> **金额单位**: **分**（1元 = 100分）
> **返回格式**: `{ "code": 0, "message": "success", "data": {...} }`
> **Postman 集合**: 导入项目根目录 `pilot_api.postman_collection.json` 即可直接测试

---

## 场景一：商户对接（上分、游戏、下分）

**流程**: 创建用户 → 上分 → 登录获取游戏链接 → [用户玩游戏] → 查注单 / 下分

### 1. 创建用户

```
POST /createUser
```

```bash
curl -X POST http://localhost:8880/createUser \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","merchantId":"1","channelId":1,"currency":"INR"}'
```

> `merchantId` 是字符串。`currency` 必须属于 `channelId` 对应渠道的币种配置；未传时使用该渠道的首个币种配置，未配置或不匹配返回 `code:108`。

---

### 2. 上分（转入游戏币）

从渠道余额扣款 → 加到用户余额。

```
POST /transfer/in
```

```bash
curl -X POST http://localhost:8880/transfer/in \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel","money":100000,"orderId":"TX_001","currency":"INR"}'
```

| 参数 | 说明 |
|------|------|
| money | 100000分 = 1000元 |
| orderId | 你的订单号，**必须唯一**。重复返回 code:105 |

**失败处理**：

| code | 原因 | 处理 |
|------|------|------|
| 105 | 订单重复 | 视为成功 |
| 202 | 渠道余额不足 | 联系平台充值 |
| 305 | 玩家游戏中 | 等游戏结束 |

---

### 3. 查询余额

```
POST /transfer/getUserAmount
```

```bash
curl -X POST http://localhost:8880/transfer/getUserAmount \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel"}'
```

响应：`{"code":0,"data":{"amount":100000}}`

---

### 4. 登录获取游戏链接

拿到 url 后将用户浏览器重定向到该地址即可进入游戏。

```
POST /login
```

```bash
curl -X POST http://localhost:8880/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel","currency":"INR"}'
```

响应：
```json
{"code":0,"data":{"url":"https://game.example.com?token=abc...","username":"player001","channelId":1}}
```

游戏入口 URL 中的临时 token 有效期为 5 分钟，过期后请重新调用登录接口获取新的入口 URL。

> 如果用户不存在，首次登录会自动创建。`currency` 按渠道校验；未传时优先使用该用户已有币种，新用户使用渠道首个币种配置。

---

### 5. 下分（取回游戏币）

用户余额 → 加回渠道余额。

全额取回（推荐）：
```bash
curl -X POST http://localhost:8880/transfer/out \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel","money":0,"orderId":"TXOUT_001","isFull":1}'
```

| code | 原因 |
|------|------|
| 307 | 余额不足 |
| 305 | 玩家游戏中 |
| 105 | 订单重复 |

---

### 6. 查注单记录

```
POST /order/getCoinRecord
```

```bash
curl -X POST http://localhost:8880/order/getCoinRecord \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel","username":"player001","start":1718640000,"end":1718726400}'
```

start/end 是 Unix 时间戳（秒）。返回字段：betsCoin（投注）, rewardCoin（派彩）。

---

### 7. 查转账订单状态

```bash
curl -X POST http://localhost:8880/order/transfer \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel","orderId":"TX_001"}'
```

status=success 表示已处理，status=noExist 表示不存在。

---

### 8. 渠道汇总报表

```bash
curl -X POST http://localhost:8880/order/getChannelSumRecord \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel","start":1718640000,"end":1718726400}'
```

---

## 场景二：活动系统 — 发放免费下注次数

> 需要签名验证，先联系平台获取签名算法。

### 发放免费次数

```
POST /api/freeBet/grant
```

```bash
curl -X POST http://localhost:8880/api/freeBet/grant \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel","count":5,"activityId":"act_001","sourceOrderId":"YOUR_ID_001","expireAt":"2025-12-31 23:59:59","sign":"<签名>","timestamp":1718712000}'
```

- sourceOrderId：幂等键，同一单号不会重复发放
- expireAt：格式 yyyy-MM-dd HH:mm:ss

### 查询剩余次数

```
POST /api/freeBet/remain
```

```bash
curl -X POST http://localhost:8880/api/freeBet/remain \
  -H "Content-Type: application/json" \
  -d '{"username":"player001","channel":"my_channel","sign":"<签名>"}'
```

---

## 场景三：游戏前端 — 获取配置

游戏前端加载时需要取规则和服务器地址。

### 游戏规则

```
GET /api/gameSetting
```

```bash
curl http://localhost:8880/api/gameSetting
```

返回投注范围、结算倍数、振幅、规则说明等。

### 服务器地址

```
POST /api/server/getConfig
```

```bash
curl -X POST http://localhost:8880/api/server/getConfig \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel"}'
```

### 机器人配置

```
POST /robot/getSetting
```

```bash
curl -X POST http://localhost:8880/robot/getSetting \
  -H "Content-Type: application/json" \
  -d '{"channel":"my_channel"}'
```

---

## 错误码速查

| code | 含义 |
|------|------|
| 0 | 成功 |
| 105 | 订单重复（已处理） |
| 108 | 当前渠道未配置请求币种 |
| 201 | 渠道不存在 |
| 202 | 渠道余额不足 |
| 304 | 用户不存在 |
| 305 | 玩家游戏中 |
| 307 | 用户余额不足 |
| 401 | 签名错误 |

---

## 一键测试脚本

替换 CHANNEL/USER/URL 为实际值：

```bash
URL="http://localhost:8880"
CHANNEL="my_channel"
USER="player001"

# 1. 创建用户
curl -s -X POST $URL/createUser -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"merchantId\":\"1\",\"channelId\":1,\"currency\":\"INR\"}"

# 2. 上分 1000元
curl -s -X POST $URL/transfer/in -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"channel\":\"$CHANNEL\",\"money\":100000,\"orderId\":\"TX_$(date +%s)\",\"currency\":\"INR\"}"

# 3. 查余额
curl -s -X POST $URL/transfer/getUserAmount -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"channel\":\"$CHANNEL\"}"

# 4. 登录拿游戏链接
curl -s -X POST $URL/login -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"channel\":\"$CHANNEL\",\"currency\":\"INR\"}"

# 5. 全额下分
curl -s -X POST $URL/transfer/out -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"channel\":\"$CHANNEL\",\"money\":0,\"orderId\":\"TXOUT_$(date +%s)\",\"isFull\":1}"
```
