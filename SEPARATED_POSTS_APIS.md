# 分离的帖子接口设计

## 概述

根据需求，我们将原来的聚合帖子接口分离为两个独立的接口：

- `/api/posts/pinned` - 获取置顶帖子
- `/api/posts/normal` - 获取普通帖子

这样可以提供更灵活的 API 设计，允许前端根据需要分别获取不同类型的帖子。

## 接口详情

### 1. 获取置顶帖子

**接口地址：** `GET /api/posts/pinned`

**请求参数：**

- `category` (可选): 分类 ID，支持 "help", "rent", "used", "jobs", "recommend"
- `city` (可选): 城市代码或名称
- `limit` (可选): 返回数量限制，默认 10，最大 50

**响应格式：**

```json
{
  "code": 0,
  "message": "获取置顶帖子成功",
  "data": {
    "pinned_posts": [
      {
        "id": 1,
        "title": "置顶帖子标题",
        "content": "帖子内容",
        "category": "help",
        "price": "100",
        "images": ["image1.jpg", "image2.jpg"],
        "is_pinned": true,
        "users": {
          "id": 1,
          "nickname": "用户名",
          "avatar_url": "头像URL"
        }
      }
    ]
  }
}
```

### 2. 获取普通帖子

**接口地址：** `GET /api/posts/normal`

**请求参数：**

- `category` (可选): 分类 ID，支持 "help", "rent", "used", "jobs", "recommend"
- `city` (可选): 城市代码或名称
- `keyword` (可选): 搜索关键词
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20，最大 50
- `sort` (可选): 排序方式，"latest" 或 "popular"，默认 "latest"

**响应格式：**

```json
{
  "code": 0,
  "message": "获取普通帖子成功",
  "data": {
    "posts": [
      {
        "id": 2,
        "title": "普通帖子标题",
        "content": "帖子内容",
        "category": "rent",
        "price": "500",
        "images": ["image1.jpg"],
        "is_pinned": false,
        "users": {
          "id": 2,
          "nickname": "用户名",
          "avatar_url": "头像URL"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalPosts": 100,
      "limit": 20
    }
  }
}
```

## 前端使用示例

### 使用 usePosts Hook

前端已经更新了 `usePosts` hook，现在会并行调用两个接口：

```typescript
const {
  pinnedPosts, // 置顶帖子
  normalPosts, // 普通帖子
  displayedPosts, // 显示的帖子（根据分类逻辑）
  isLoading,
  loadMore,
  refresh,
} = usePosts({
  selectedCity: "melbourne",
  selectedCategoryId: "recommend",
});
```

### 直接调用接口

如果需要直接调用接口：

```typescript
// 获取置顶帖子
const pinnedResponse = await Taro.request({
  url: "/api/posts/pinned",
  method: "GET",
  data: {
    city: "melbourne",
    category: "recommend",
    limit: 10,
  },
});

// 获取普通帖子
const normalResponse = await Taro.request({
  url: "/api/posts/normal",
  method: "GET",
  data: {
    city: "melbourne",
    category: "recommend",
    page: 1,
    limit: 20,
  },
});
```

## 优势

1. **灵活性**：前端可以根据需要分别获取置顶和普通帖子
2. **性能**：可以并行请求，提高加载速度
3. **缓存**：可以分别缓存不同类型的帖子
4. **扩展性**：未来可以轻松添加更多帖子类型
5. **向后兼容**：原来的聚合接口仍然可用

## 注意事项

1. 置顶帖子接口不支持分页，因为置顶帖子数量通常较少
2. 普通帖子接口支持完整的分页功能
3. 两个接口都支持相同的筛选条件（城市、分类等）
4. 推荐分类（recommend）有特殊的处理逻辑，包括每周特价和目录图片

## 测试

可以使用提供的测试脚本验证接口：

```bash
node test_separated_apis.js
```

这将测试所有三个接口（置顶、普通、聚合）是否正常工作。
