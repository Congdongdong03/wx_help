# 微信登录问题排查指南

## 问题描述

微信登录失败，返回 400 错误："微信登录失败"

## 问题原因

服务器缺少微信小程序的 AppID 和 AppSecret 配置。

## 解决方案

### 方案一：配置真实的微信小程序（推荐）

1. **获取微信小程序凭证**

   - 打开微信公众平台：https://mp.weixin.qq.com/
   - 登录您的小程序账号
   - 进入 "开发" -> "开发管理" -> "开发设置"
   - 复制 "AppID(小程序 ID)" 和 "AppSecret(小程序密钥)"

2. **配置环境变量**

   ```bash
   cd server
   # 编辑 .env 文件
   nano .env
   ```

   将以下行替换为您的实际值：

   ```env
   WECHAT_APP_ID=您的AppID
   WECHAT_APP_SECRET=您的AppSecret
   ```

3. **重启服务器**
   ```bash
   npm run dev
   ```

### 方案二：使用开发环境测试模式（临时）

我已经为开发环境添加了测试认证模式，无需真实的微信凭证即可测试登录功能。

**当前状态：** ✅ 已启用开发环境测试模式

**测试用户信息：**

- OpenID: `dev_openid_123`
- 用户名: `dev_test_user`
- 昵称: 从微信获取的用户昵称

## 验证步骤

1. **检查服务器日志**

   ```bash
   cd server
   npm run dev
   ```

   应该看到类似输出：

   ```
   🔍 Auth: Checking WeChat credentials...
   🔍 Auth: WECHAT_APP_ID: 未配置
   🔍 Auth: WECHAT_APP_SECRET: 未配置
   🧪 Auth: Using development test authentication
   ```

2. **测试登录**
   - 在小程序中点击"微信一键登录"
   - 应该成功登录并显示"开发环境登录成功"

## 常见问题

### Q: 为什么会出现 400 错误？

A: 服务器检测到微信配置缺失，返回 400 错误而不是 500 错误，这是为了更好的错误处理。

### Q: 如何区分开发环境和生产环境？

A: 系统会根据 `NODE_ENV` 环境变量自动判断：

- `development`: 使用测试认证
- `production`: 使用真实微信认证

### Q: 测试用户数据会保存到数据库吗？

A: 是的，测试用户会正常保存到数据库中，可以用于功能测试。

### Q: 如何切换到真实微信认证？

A: 配置真实的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 后，系统会自动使用真实认证。

## 安全注意事项

1. **保护 AppSecret**

   - 永远不要将 AppSecret 提交到版本控制系统
   - 确保 `.env` 文件已添加到 `.gitignore`

2. **生产环境配置**
   - 生产环境必须使用真实的微信小程序凭证
   - 测试认证模式仅用于开发环境

## 相关文件

- `server/src/routes/auth.ts` - 认证路由
- `server/.env` - 环境变量配置
- `src/components/LoginModal/index.tsx` - 前端登录组件

## 技术支持

如果问题仍然存在，请检查：

1. 服务器是否正常运行
2. 数据库连接是否正常
3. 网络连接是否正常
4. 微信小程序配置是否正确
