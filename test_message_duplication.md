# 消息重复问题修复测试指南

## 问题描述

用户 A 发送私信给用户 B 时，会显示两条消息：一条是"正在发送中"，另一条是"发送成功"。

## 修复内容

### 1. 客户端消息处理逻辑优化

- 使用 `clientTempId` 来匹配和更新乐观更新的消息
- 避免重复添加相同的消息
- 正确处理消息状态转换

### 2. 错误处理改进

- 添加消息发送失败的处理
- 提供重试功能
- 显示清晰的状态指示器

## 测试步骤

### 1. 启动服务

```bash
# 启动服务器
cd server && npm run dev

# 启动前端
npm run dev:weapp
```

### 2. 测试场景

#### 场景 1：正常发送消息

1. 打开聊天页面
2. 用户 A 发送消息给用户 B
3. 验证：
   - 只显示一条消息
   - 消息状态从"发送中"变为"✓"
   - 没有重复消息

#### 场景 2：网络断开重连

1. 断开网络连接
2. 用户 A 发送消息
3. 消息显示"发送中"状态
4. 重新连接网络
5. 验证消息状态正确更新

#### 场景 3：发送失败重试

1. 模拟网络错误
2. 用户 A 发送消息
3. 消息显示"✗"状态和重试按钮
4. 点击重试按钮
5. 验证消息重新发送成功

### 3. 预期结果

- ✅ 每条消息只显示一次
- ✅ 消息状态正确转换
- ✅ 支持失败重试
- ✅ 用户体验流畅

## 技术实现细节

### 关键代码修改

1. **消息回调处理** (`src/pages/messages/chat/index.tsx`)

```typescript
// 使用 clientTempId 匹配乐观更新消息
if (msg.clientTempId) {
  const existingIndex = prev.findIndex(
    (m) => m.clientTempId === msg.clientTempId
  );
  if (existingIndex !== -1) {
    // 更新现有消息而不是添加新消息
    updatedMessages[existingIndex] = {
      ...updatedMessages[existingIndex],
      id: msg.messageId || updatedMessages[existingIndex].id,
      status: "sent",
      timestamp: msg.timestamp || updatedMessages[existingIndex].timestamp,
    };
    return updatedMessages;
  }
}
```

2. **服务器端** (`server/src/index.ts`)

```typescript
// 正确传递 clientTempId 给发送者回显
ws.send(
  JSON.stringify({
    type: "chat",
    content: data.content,
    senderId: ws.userId,
    toUserId: data.toUserId,
    conversationId: data.conversationId,
    timestamp: savedMsg.createdAt,
    messageId: savedMsg.id,
    clientTempId: data.clientTempId || null, // 关键：传递 clientTempId
  })
);
```

### 消息流程

1. 用户发送消息 → 添加乐观更新消息（status: "pending"）
2. WebSocket 发送到服务器 → 服务器保存到数据库
3. 服务器回显给发送者 → 客户端通过 clientTempId 匹配并更新状态
4. 服务器推送给接收者 → 接收者显示新消息

这样确保了消息不会重复显示，同时提供了良好的用户体验。
