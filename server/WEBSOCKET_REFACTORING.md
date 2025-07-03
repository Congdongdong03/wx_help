# WebSocket 重构文档

## 概述

本次重构将原本臃肿的 WebSocket 处理器拆分为模块化的架构，提高了代码的可维护性、可测试性和扩展性。

## 重构目标

1. **结构优化**：拆分巨大的 WebSocket 处理器，实现关注点分离
2. **消除重复代码**：统一消息处理逻辑，避免代码重复
3. **统一数据访问**：所有数据库操作都通过服务层进行
4. **提高可测试性**：模块化设计便于单元测试

## 新架构

### 1. WebSocket 路由器 (`server/src/routes/websocketRouter.ts`)

**职责**：

- 处理 WebSocket 连接的生命周期事件
- 路由消息到相应的控制器方法
- 统一消息类型处理（`sendMessage`、`text`、`image`）

**主要方法**：

- `routeMessage()`: 根据消息类型路由到相应的处理器
- `handleConnection()`: 处理新连接建立
- `handleDisconnect()`: 处理连接断开
- `handleError()`: 处理连接错误

### 2. WebSocket 控制器 (`server/src/controllers/websocketController.ts`)

**职责**：

- 处理具体的 WebSocket 消息业务逻辑
- 调用服务层完成数据操作
- 管理用户认证和状态

**主要方法**：

- `handleAuth()`: 处理用户认证
- `handleSendMessage()`: 统一处理所有类型的消息发送
- `handleTyping()`: 处理输入状态
- `handleJoinRoom()`: 处理加入房间
- `handleRequestOnlineStatus()`: 处理在线状态请求

### 3. WebSocket 服务层 (`server/src/services/websocketService.ts`)

**职责**：

- 管理用户连接状态
- 处理消息发送和广播
- 封装数据库操作
- 提供连接清理功能

**主要方法**：

- `addUser()` / `removeUser()`: 管理用户连接
- `sendToUser()` / `broadcastToUsers()`: 消息发送
- `sendMessage()`: 完整的消息发送流程
- `getUnreadMessages()` / `markMessagesAsRead()`: 未读消息管理
- `cleanupDisconnectedUsers()`: 清理断开连接

## 重构亮点

### 1. 统一消息处理

**之前**：

```typescript
case "sendMessage":
  // 处理逻辑...
case "text":
  // 几乎相同的处理逻辑...
case "image":
  // 几乎相同的处理逻辑...
```

**现在**：

```typescript
case "sendMessage":
case "text":
case "image":
  // 统一处理所有发送消息的类型
  await WebSocketController.handleSendMessage(ws, {
    ...data,
    messageType: data.type === "sendMessage" ? (data.messageType || "text") : data.type
  });
```

### 2. 服务层封装

**之前**：直接在控制器中调用 Prisma

```typescript
const unreadMessages = await prisma.message.findMany({
  where: { receiverId: userId, isRead: false },
  orderBy: { createdAt: "asc" },
});
```

**现在**：通过服务层封装

```typescript
const unreadMessages = await WebSocketService.getUnreadMessages(userId);
```

### 3. 连接状态管理

**之前**：分散在各个地方管理用户映射
**现在**：统一在 WebSocketService 中管理

```typescript
// 添加用户
WebSocketService.addUser(userId, ws);

// 检查在线状态
WebSocketService.isUserOnline(userId);

// 发送消息
WebSocketService.sendToUser(userId, message);
```

## 连接管理优化

### 1. 事件驱动的即时清理

我们依赖 WebSocket 的原生事件进行即时清理，而不是定时任务：

```typescript
// 连接断开时立即清理
ws.on("close", function close() {
  WebSocketRouter.handleDisconnect(ws);
});

// 连接错误时立即清理
ws.on("error", function error(err) {
  WebSocketRouter.handleError(ws, err);
});
```

### 2. 智能连接状态检查

在每次发送消息时都会检查连接状态，自动清理异常连接：

```typescript
static sendToUser(userId: string, message: any): boolean {
  const ws = userMap.get(userId);
  if (!ws) {
    return false;
  }

  // 检查连接状态
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      // 发送失败时自动清理连接
      this.removeUser(userId);
      return false;
    }
  } else {
    // 连接状态异常，自动清理
    this.removeUser(userId);
    return false;
  }
}
```

### 3. 重复连接处理

当同一用户重新连接时，自动清理旧连接：

```typescript
static addUser(userId: string, ws: ExtWebSocket) {
  // 如果用户已存在，先移除旧连接
  if (userMap.has(userId)) {
    console.log(`⚠️ 用户 ${userId} 已有连接，移除旧连接`);
    this.removeUser(userId);
  }

  userMap.set(userId, ws);
}
```

### 4. 批量操作

```typescript
// 批量标记消息为已读
await WebSocketService.markMessagesAsRead(messageIds);

// 批量广播消息
WebSocketService.broadcastToUsers(userIds, message);
```

### 5. 连接诊断和监控

提供详细的连接状态诊断信息：

```typescript
GET / api / socket / status;
```

返回：

```json
{
  "status": "running",
  "clientCount": 10,
  "onlineCount": 8,
  "diagnostics": {
    "totalConnections": 8,
    "healthyConnections": 7,
    "unhealthyConnections": 1,
    "connectionStates": {
      "user1": 1,
      "user2": 3
    },
    "users": ["user1", "user2"]
  },
  "uptime": 3600,
  "timestamp": 1640995200000
}
```

手动清理接口（仅用于诊断）：

```typescript
POST / api / socket / cleanup;
```

## 测试支持

新增了测试文件 `server/src/__tests__/websocket.test.ts`，包含：

- WebSocketService 的单元测试
- WebSocketController 的单元测试
- 用户连接管理测试
- 消息发送测试

## 使用示例

### 发送消息

```typescript
// 客户端发送
{
  "type": "sendMessage",
  "conversationId": "conv_123",
  "toUserId": "user_456",
  "content": "Hello!",
  "messageType": "text",
  "clientTempId": "temp_789"
}
```

### 认证

```typescript
// 客户端发送
{
  "type": "auth",
  "userId": "user_123"
}
```

### 在线状态查询

```typescript
// 客户端发送
{
  "type": "requestOnlineStatus",
  "conversationId": "conv_123"
}
```

## 扩展性

### 添加新的消息类型

1. 在 `WebSocketRouter.routeMessage()` 中添加新的 case
2. 在 `WebSocketController` 中添加对应的处理方法
3. 如果需要，在 `WebSocketService` 中添加相应的服务方法

### 添加新的功能

1. 在服务层添加业务逻辑
2. 在控制器中添加处理方法
3. 在路由器中添加路由逻辑

## 监控和维护

### 状态检查接口

```typescript
GET / api / socket / status;
```

返回：

```json
{
  "status": "running",
  "clientCount": 10,
  "onlineCount": 8,
  "uptime": 3600,
  "timestamp": 1640995200000
}
```

### 日志记录

所有关键操作都有详细的日志记录：

- 用户连接/断开
- 消息发送状态
- 错误处理
- 性能监控

## 总结

通过这次重构，我们实现了：

1. **模块化架构**：清晰的职责分离
2. **代码复用**：消除了重复逻辑
3. **统一接口**：一致的数据访问模式
4. **易于测试**：模块化设计便于单元测试
5. **易于扩展**：新功能可以轻松添加
6. **智能连接管理**：事件驱动的即时清理，避免僵尸连接
7. **完善的监控**：详细的连接状态诊断和手动清理工具

### 连接管理策略

我们采用了**事件驱动**的连接管理策略，而不是依赖定时任务：

- ✅ **即时清理**：依赖 WebSocket 的 `close` 和 `error` 事件
- ✅ **智能检查**：在每次操作时检查连接状态
- ✅ **自动处理**：重复连接时自动清理旧连接
- ✅ **诊断工具**：提供详细的连接状态监控
- ✅ **手动清理**：保留清理方法作为诊断工具

这种架构为未来的功能扩展和维护提供了坚实的基础，同时确保了连接管理的可靠性和效率。
