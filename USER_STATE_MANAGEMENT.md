# 用户状态管理系统

## 概述

本项目实现了基于 Redux 的全局用户状态管理系统，用于管理用户的登录状态、用户信息以及与本地存储的同步。

## 架构设计

### 1. 状态管理结构

```
src/store/user/
├── types.ts          # 类型定义
├── actions.ts        # Action创建器
├── reducer.ts        # Reducer函数
├── selectors.ts      # 状态选择器
├── hooks.ts          # React Hooks
├── utils.ts          # 工具函数
└── index.ts          # 统一导出
```

### 2. 核心功能

#### 用户状态管理

- **登录状态**: 管理用户是否已登录
- **用户信息**: 存储当前登录用户的详细信息
- **加载状态**: 处理异步操作的加载状态
- **错误处理**: 统一处理错误信息

#### 本地存储同步

- **自动同步**: 登录状态与本地存储自动同步
- **数据持久化**: 应用重启后自动恢复用户状态
- **数据验证**: 确保存储数据的完整性

#### API 集成

- **统一请求**: 自动在请求头中添加用户身份信息
- **错误重试**: 网络请求失败时自动重试
- **状态更新**: API 调用后自动更新 Redux 状态

## 使用方法

### 1. 在组件中使用

```typescript
import { useUser } from "../store/user/hooks";

function MyComponent() {
  const { currentUser, isLoggedIn, isLoading, login, logout, updateUser } =
    useUser();

  // 使用用户状态
  if (isLoading) {
    return <Loading />;
  }

  if (!isLoggedIn) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>欢迎, {currentUser?.nickName}</h1>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

### 2. 登录流程

```typescript
import { useUser } from "../store/user/hooks";
import { UserService } from "../services/userService";

function LoginComponent() {
  const { login } = useUser();

  const handleLogin = async () => {
    try {
      // 获取微信登录凭证
      const loginRes = await Taro.login();
      const userProfileRes = await Taro.getUserProfile({
        desc: "用于完善会员资料与登录",
      });

      // 调用登录API
      const userInfo = await UserService.wechatLogin(
        loginRes.code,
        userProfileRes.userInfo
      );

      // 更新Redux状态
      login(userInfo);

      Taro.showToast({ title: "登录成功", icon: "success" });
    } catch (error) {
      console.error("登录失败:", error);
    }
  };

  return <button onClick={handleLogin}>微信登录</button>;
}
```

### 3. 更新用户信息

```typescript
import { useUser } from "../store/user/hooks";

function EditProfileComponent() {
  const { updateUser } = useUser();

  const handleUpdateNickname = (newNickname: string) => {
    updateUser({ nickName: newNickname });
  };

  return (
    <input
      onChange={(e) => handleUpdateNickname(e.target.value)}
      placeholder="输入新昵称"
    />
  );
}
```

### 4. 网络请求

```typescript
import { requestWithRedux } from "../utils/requestWithRedux";

// 自动在请求头中添加用户openid
const response = await requestWithRedux("/api/posts", {
  method: "GET",
  retryCount: 3,
});
```

## 状态结构

### UserState

```typescript
interface UserState {
  currentUser: UserInfo | null; // 当前用户信息
  isLoggedIn: boolean; // 登录状态
  isLoading: boolean; // 加载状态
  error: string | null; // 错误信息
}
```

### UserInfo

```typescript
interface UserInfo {
  id: string; // 用户ID
  openid: string; // 微信openid
  nickName: string; // 昵称
  avatarUrl: string; // 头像URL
  gender?: number; // 性别
  city?: string; // 城市
  province?: string; // 省份
  country?: string; // 国家
  language?: string; // 语言
  status?: string; // 状态
  token?: string; // 访问令牌
}
```

## 主要特性

### 1. 自动状态同步

- 应用启动时自动从本地存储恢复用户状态
- 登录/登出时自动更新本地存储
- 用户信息更新时自动同步

### 2. 类型安全

- 完整的 TypeScript 类型定义
- 编译时类型检查
- 智能代码提示

### 3. 错误处理

- 统一的错误处理机制
- 网络请求失败自动重试
- 用户友好的错误提示

### 4. 性能优化

- 状态选择器优化
- 避免不必要的重新渲染
- 内存使用优化

## 最佳实践

### 1. 组件中使用状态

```typescript
// ✅ 推荐：使用Hook获取状态
const { currentUser, isLoggedIn } = useUser();

// ❌ 不推荐：直接访问store
const state = store.getState();
const user = state.user.currentUser;
```

### 2. 状态更新

```typescript
// ✅ 推荐：使用Hook方法更新状态
const { updateUser } = useUser();
updateUser({ nickName: "新昵称" });

// ❌ 不推荐：直接dispatch action
dispatch(updateUserInfo({ nickName: "新昵称" }));
```

### 3. 网络请求

```typescript
// ✅ 推荐：使用带Redux的请求工具
import { requestWithRedux } from "../utils/requestWithRedux";

// ❌ 不推荐：手动添加用户信息
const response = await Taro.request({
  url: "/api/data",
  header: { "x-openid": getCurrentUserId() },
});
```

## 迁移指南

### 从旧版本迁移

1. **更新导入**

```typescript
// 旧版本
import { getLoggedInUser, storeLoggedInUser } from "../app";

// 新版本
import { useUser } from "../store/user/hooks";
```

2. **更新组件**

```typescript
// 旧版本
const userInfo = getLoggedInUser();

// 新版本
const { currentUser } = useUser();
```

3. **更新网络请求**

```typescript
// 旧版本
import { request } from "../utils/request";

// 新版本
import { requestWithRedux } from "../utils/requestWithRedux";
```

## 故障排除

### 常见问题

1. **状态不同步**

   - 检查是否正确使用了`useUser` Hook
   - 确认 Redux Provider 是否正确配置

2. **登录状态丢失**

   - 检查本地存储权限
   - 确认数据格式是否正确

3. **网络请求失败**
   - 检查用户是否已登录
   - 确认 API 地址是否正确

### 调试工具

```typescript
// 在控制台查看当前状态
console.log(store.getState().user);

// 检查本地存储
console.log(Taro.getStorageSync("userInfo"));
```

## 扩展功能

### 1. 添加新的用户属性

```typescript
// 在types.ts中添加新属性
interface UserInfo {
  // ... 现有属性
  phone?: string; // 新增手机号
}
```

### 2. 添加新的 Action

```typescript
// 在actions.ts中添加新action
export const updatePhone = (phone: string) => ({
  type: USER_ACTION_TYPES.UPDATE_PHONE,
  payload: phone,
});
```

### 3. 添加新的选择器

```typescript
// 在selectors.ts中添加新选择器
export const selectUserPhone = (state: RootState): string =>
  state.user.currentUser?.phone || "";
```

这个用户状态管理系统为整个应用提供了统一的用户状态管理解决方案，确保了数据的一致性和可维护性。
