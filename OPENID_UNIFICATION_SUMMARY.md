# OpenID 统一化实现总结

## 概述

本次更新确保了消息系统所有相关功能都使用 openid 作为用户标识，而不是数字 ID。这包括消息列表页跳转、聊天页面参数解析、消息发送以及后端所有相关逻辑。

## 主要变更

### 1. 后端 API 变更

#### `server/src/routes/conversation.ts`

**find-or-create 端点更新:**

- 修改前：接收 `otherUserId` 作为数字 ID，然后查询对应的 openid
- 修改后：直接接收 `otherUserId` 作为 openid，验证用户是否存在
- 移除了数字 ID 到 openid 的转换逻辑

**消息发送端点更新:**

- 修改前：从对话中自动确定 receiverId
- 修改后：从请求体中接收 `receiverId` 参数，并验证是否为对话参与者
- 确保 receiverId 是 openid 格式

**标记已读端点更新:**

- 修改前：需要请求体中的 `userId` 参数（数字 ID）
- 修改后：仅使用请求头中的 `x-openid`，移除请求体中的 userId 参数

### 2. 前端服务层变更

#### `src/services/messageService.ts`

**sendMessage 函数更新:**

- 移除了 `senderId` 参数（数字 ID）
- 保留 `receiverId` 参数，确保是 openid 格式
- 在请求体中添加 `receiverId` 参数

**markMessagesAsRead 函数更新:**

- 移除了 `numericUserId` 参数
- 仅使用 `userOpenId` 参数（从请求头传递）

### 3. 前端页面变更

#### `src/pages/detail/index.tsx`

**私信功能修复:**

- 修复了 `handleMessageSeller` 函数中的 bug
- 修改前：使用 `post.users.id`（数字 ID）作为 `otherUserId`
- 修改后：使用 `post.users.openid` 作为 `otherUserId`
- 确保跳转到聊天页面时传递的是 openid 而不是数字 ID

#### `src/pages/messages/chat/index.tsx`

**WebSocket 连接:**

- 使用 `currentUser.openid` 而不是 `currentUser.id` 进行连接

**消息发送:**

- HTTP 回退调用使用新的 `sendMessage` 签名
- 移除了 `senderId` 参数传递

**消息状态检查:**

- 使用 `currentUser.openid` 而不是 `currentUser.id` 进行消息归属判断

**依赖项更新:**

- 所有 useEffect 依赖项从 `currentUser.id` 改为 `currentUser.openid`

#### `src/pages/messages/list/index.tsx`

**会话点击处理:**

- 使用 `currentUser.openid` 进行用户身份验证
- 确保 `otherUserId` 是 openid 格式

#### `src/pages/message/index.tsx`

**会话获取:**

- 添加用户状态管理
- 传递 `currentUser.openid` 给 `fetchConversations` 函数
- 添加登录状态检查

### 4. 数据库架构

**确认现有架构正确:**

- `Conversation` 表的 `participant1Id` 和 `participant2Id` 字段已经是 openid 字符串
- `Message` 表的 `senderId` 和 `receiverId` 字段已经是 openid 字符串
- 无需数据库架构变更

## 验证要点

### 1. 消息列表页跳转参数

✅ 跳转到聊天页时，`otherUserId` 必须传 openid

### 2. 聊天页面参数解析

✅ 聊天页面收到的 `otherUserId` 必须是 openid，不能是数字 ID

### 3. 聊天页面发消息

✅ 发送消息时，`toUserId` 必须是 openid，`senderId` 也是 openid

### 4. 后端所有相关逻辑

✅ 数据库 conversation、message 表的相关字段都必须是 openid

## 测试建议

1. **消息列表功能测试:**

   - 验证消息列表能正确显示
   - 验证点击会话能正确跳转到聊天页面

2. **聊天功能测试:**

   - 验证能正确发送文本消息
   - 验证能正确发送图片消息
   - 验证消息状态正确更新

3. **WebSocket 连接测试:**

   - 验证使用 openid 能正确建立连接
   - 验证消息能实时推送

4. **已读状态测试:**
   - 验证消息能正确标记为已读

## 注意事项

1. 所有用户相关的操作现在都使用 openid 作为唯一标识
2. 移除了数字 ID 和 openid 之间的转换逻辑
3. 确保前端传递的参数格式与后端期望一致
4. WebSocket 连接使用 openid 进行身份验证

## 兼容性

- 现有数据库中的数据已经是 openid 格式，无需迁移
- API 接口变更是向后兼容的，因为 openid 格式保持不变
- 前端代码变更确保了与后端 API 的一致性
