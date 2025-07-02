# 认证头统一处理方案

## 问题描述

在之前的实现中，每个需要认证的 API 请求都需要手动添加 `x-openid` 头：

```typescript
header: {
  "x-openid":
    process.env.NODE_ENV === "development"
      ? "dev_openid_123"
      : Taro.getStorageSync("openid") || "",
}
```

这种方式存在以下问题：

1. 代码重复，每个请求都要写一遍
2. 容易遗漏，导致 401 错误
3. 维护困难，如果需要修改认证逻辑需要修改所有地方

## 解决方案

### 1. 统一的请求工具函数

在 `src/utils/request.ts` 中创建了统一的请求函数，自动添加认证头：

```typescript
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  // ... 重试逻辑

  const response = await Taro.request({
    url,
    ...requestOptions,
    header: {
      ...(requestOptions.header || {}),
      "x-openid": getCurrentUserId(), // 自动添加认证头
    },
  });

  // ... 响应处理
}
```

### 2. 智能的用户 ID 获取

```typescript
function getCurrentUserId(): string {
  try {
    if (process.env.NODE_ENV === "development") {
      return "dev_openid_123";
    }
    return Taro.getStorageSync("openid") || "";
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return process.env.NODE_ENV === "development" ? "dev_openid_123" : "";
  }
}
```

### 3. 文件上传也支持

```typescript
export async function uploadFile<T = any>(
  url: string,
  filePath: string,
  options = {}
): Promise<T> {
  // ... 重试逻辑

  const response = await Taro.uploadFile({
    url,
    filePath,
    ...uploadOptions,
    header: {
      ...(uploadOptions.header || {}),
      "x-openid": getCurrentUserId(), // 自动添加认证头
    },
  });

  // ... 响应处理
}
```

## 使用方式

### 之前的方式（需要手动添加认证头）

```typescript
const response = await Taro.request({
  url: `${BASE_API_URL}/posts`,
  method: "POST",
  data: payload,
  header: {
    "Content-Type": "application/json",
    "x-openid": "dev_openid_123", // 手动添加
  },
});
```

### 现在的方式（自动添加认证头）

```typescript
import { request } from "@/utils/request";

const response = await request(`${BASE_API_URL}/posts`, {
  method: "POST",
  data: payload,
  header: {
    "Content-Type": "application/json",
    // 不需要手动添加 x-openid，会自动添加
  },
});
```

## 已更新的文件

1. **PostForm 组件** (`src/components/PostForm/index.tsx`)

   - 获取城市列表
   - 获取帖子详情
   - 保存草稿
   - 发布帖子

2. **MyPosts 组件** (`src/pages/my/my-posts/my-posts.tsx`)
   - 获取用户帖子列表
   - 擦亮帖子
   - 删除帖子
   - 重新发布帖子

## 优势

1. **代码简洁**：不需要在每个请求中重复添加认证头
2. **统一管理**：认证逻辑集中在一个地方
3. **自动重试**：内置重试机制，提高请求成功率
4. **错误处理**：统一的错误处理逻辑
5. **类型安全**：支持 TypeScript 泛型

## 注意事项

1. 确保在开发环境中使用 `dev_openid_123`
2. 生产环境中需要正确设置 `openid` 到 Taro 存储中
3. 如果需要特殊的认证头，可以在 `header` 中覆盖

## 测试验证

所有 API 端点都已测试通过：

- ✅ `POST /api/posts` - 创建帖子
- ✅ `GET /api/posts/my` - 获取用户帖子
- ✅ `DELETE /api/posts/:id` - 删除帖子
- ✅ `POST /api/posts/:id/polish` - 擦亮帖子
- ✅ `PUT /api/posts/:id` - 更新帖子
- ✅ `POST /api/posts/upload` - 上传文件
