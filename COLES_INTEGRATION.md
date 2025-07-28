# Coles 图片集成到 /api/posts/pinned 接口

## 概述

将 Coles 爬取到的目录图片自动集成到 `/api/posts/pinned` 接口中，作为置顶帖子显示给用户。

## 实现原理

### 1. 图片存储位置

Coles 爬取的图片存储在以下目录：

```
server/src/public/catalogue_images/coles/
```

### 2. 自动集成逻辑

在 `PostService.getPinnedPosts()` 方法中，系统会：

1. **扫描目录**：自动扫描 `catalogue_images/coles/` 目录
2. **创建汇总帖子**：为每个商店创建一个汇总帖子，包含该商店的所有图片
3. **优先显示**：目录图片会优先显示在置顶帖子列表的最前面
4. **包含所有图片**：每个汇总帖子包含该商店的所有图片文件

### 3. 帖子结构

每个 Coles 汇总帖子的结构如下：

```json
{
  "id": "catalogue_coles_summary",
  "title": "COLES 本周打折目录",
  "content": "COLES 本周最新打折信息，包含 45 页详细内容",
  "content_preview": "COLES 本周最新打折信息，包含 45 页详细内容",
  "category": "help",
  "price": "0",
  "images": [
    "/catalogue_images/coles/20250605_page1.jpg",
    "/catalogue_images/coles/20250605_page2.jpg",
    "/catalogue_images/coles/20250605_page3.jpg"
    // ... 更多图片
  ],
  "cover_image": "/catalogue_images/coles/20250605_page1.jpg",
  "is_pinned": true,
  "is_weekly_deal": true,
  "total_pages": 45,
  "store": "coles",
  "users": {
    "id": 1,
    "nickname": "系统",
    "avatar_url": "https://example.com/default-avatar.png"
  }
}
```

## 接口响应

### 推荐分类 (`category=recommend`)

```json
{
  "code": 0,
  "message": "获取置顶帖子成功",
  "data": {
    "pinned_posts": [
      {
        "id": "catalogue_coles_summary",
        "title": "COLES 本周打折目录",
        "images": ["/catalogue_images/coles/20250605_page1.jpg", ...],
        "is_pinned": true,
        "is_weekly_deal": true,
        "total_pages": 45
      },
      {
        "id": "catalogue_woolworths_summary",
        "title": "WOOLWORTHS 本周打折目录",
        "images": ["/catalogue_images/woolworths/20250605_page1.jpg", ...],
        "is_pinned": true,
        "is_weekly_deal": true,
        "total_pages": 32
      },
      // ... 其他置顶帖子
    ]
  }
}
```

### 其他分类

其他分类也会包含 Coles 图片，但优先级相同：

```json
{
  "code": 0,
  "message": "获取置顶帖子成功",
  "data": {
    "pinned_posts": [
      {
        "id": "catalogue_coles_summary",
        "title": "COLES 本周打折目录",
        "images": ["/catalogue_images/coles/20250605_page1.jpg", ...],
        "is_pinned": true,
        "is_weekly_deal": true,
        "total_pages": 45
      },
      // ... 其他置顶帖子
    ]
  }
}
```

## 前端显示

### 1. 图片轮播

前端可以显示所有图片的轮播：

```typescript
// 在 PostCard 组件中
const PostCard = ({ post }) => {
  if (post.is_weekly_deal && post.images.length > 1) {
    return (
      <View className="post-card weekly-deal">
        <Text className="title">{post.title}</Text>
        <Text className="content">{post.content}</Text>
        <ImageSwiper images={post.images} />
        <Text className="pages-info">共 {post.total_pages} 页</Text>
      </View>
    );
  }
  // ... 普通帖子显示逻辑
};
```

### 2. 缩略图显示

也可以显示第一张图片作为缩略图：

```typescript
const PostCard = ({ post }) => {
  return (
    <View className="post-card">
      <Text className="title">{post.title}</Text>
      <Text className="content">{post.content}</Text>
      <Image src={post.cover_image} className="cover-image" />
      {post.is_weekly_deal && (
        <Text className="pages-info">共 {post.total_pages} 页</Text>
      )}
    </View>
  );
};
```

## 测试

### 1. 运行测试脚本

```bash
node test_coles_integration.js
```

### 2. 手动测试接口

```bash
# 测试推荐分类
curl "http://localhost:3000/api/posts/pinned?city=sydney&category=recommend&limit=10"

# 测试其他分类
curl "http://localhost:3000/api/posts/pinned?city=sydney&category=help&limit=10"

# 测试调试接口
curl "http://localhost:3000/api/debug/catalogue-images"
```

## 优势

1. **自动化**：无需手动创建帖子，系统自动扫描目录并生成帖子
2. **实时性**：每次爬取新图片后，接口会自动包含最新内容
3. **完整性**：包含所有图片，用户可以查看完整的目录
4. **优先级**：目录图片优先显示，确保用户能看到重要信息
5. **跨分类**：在所有分类中都能看到目录图片

## 注意事项

1. **图片路径**：确保图片文件存在于正确的目录中
2. **文件格式**：只支持 `.jpg` 和 `.jpeg` 格式的图片
3. **排序**：图片按文件名排序显示
4. **性能**：大量图片可能影响加载性能，建议前端实现懒加载
5. **缓存**：建议对图片进行 CDN 缓存以提高访问速度
