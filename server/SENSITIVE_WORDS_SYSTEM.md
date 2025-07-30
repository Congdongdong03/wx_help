# 敏感词检测系统使用说明

## 系统概述

本系统实现了完整的敏感词检测和审核功能，包括：

1. **敏感词库管理** - 从 GitHub 开源词库导入，支持分类管理
2. **实时检测** - 在发布/修改帖子时自动检测敏感词
3. **审核队列** - 高风险内容自动进入人工审核队列
4. **管理后台** - 提供直观的审核界面

## 功能特性

### 1. 敏感词分类

- **porn** (色情类) - 304 个词
- **political** (政治类) - 303 个词
- **advertisement** (广告类) - 120 个词
- **url** (网址类) - 14592 个词

### 2. 检测逻辑

- 检测帖子标题和内容
- 支持模糊匹配
- 返回命中的敏感词和分类
- 自动标记高风险内容

### 3. 审核流程

- 检测到敏感词 → 状态设为 `review_required`
- 进入高风险审核队列
- 管理员人工审核（通过/拒绝）
- 审核通过后正常发布

## API 接口

### 敏感词检测

```typescript
// 检查文本是否包含敏感词
const result = await sensitiveWordService.checkSensitiveWords(text);
// 返回: { hasSensitiveWords: boolean, matchedWords: string[], categories: string[] }
```

### 管理后台 API

```
GET /api/admin/posts/sensitive - 获取敏感词审核队列
GET /api/admin/posts/stats - 获取审核统计
POST /api/admin/posts/:id/review - 审核帖子
```

## 数据库结构

### 敏感词表 (sensitive_word)

```sql
CREATE TABLE sensitive_word (
  id INT PRIMARY KEY AUTO_INCREMENT,
  word VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY word_category (word, category)
);
```

### 帖子表新增字段

```sql
ALTER TABLE posts ADD COLUMN review_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE posts ADD COLUMN review_note TEXT;
ALTER TABLE posts ADD COLUMN sensitive_words JSON;
```

## 使用步骤

### 1. 初始化敏感词库

```bash
# 导入敏感词库
npx ts-node scripts/import-sensitive-words.ts

# 测试检测功能
npx ts-node scripts/test-sensitive-words.ts
```

### 2. 启动服务

```bash
npm run dev
```

### 3. 访问管理后台

```
http://localhost:3000/admin-sensitive-review.html
```

## 管理后台功能

### 审核队列页面

- 📊 实时统计：待审核数量、今日新增、分类统计
- 🔍 筛选功能：按敏感词分类、关键词搜索
- ✅ 审核操作：一键通过/拒绝
- 📄 分页浏览：支持大量数据浏览

### 审核操作

1. 查看帖子详情和检测到的敏感词
2. 点击"通过"或"拒绝"按钮
3. 系统自动更新帖子状态
4. 审核记录保存到数据库

## 配置说明

### 敏感词库配置

```typescript
// src/services/sensitiveWordService.ts
const categoryFiles = [
  { filename: "色情类.txt", category: "porn" },
  { filename: "政治类.txt", category: "political" },
  { filename: "广告.txt", category: "advertisement" },
  { filename: "网址.txt", category: "url" },
];
```

### 检测阈值配置

```typescript
// 可以调整检测逻辑
if (sensitiveResult.hasSensitiveWords) {
  postStatus = "review_required"; // 自动进入审核队列
}
```

## 性能优化

### 内存缓存

- 敏感词库加载到内存中
- 避免频繁数据库查询
- 支持热更新

### 批量处理

- 支持批量导入敏感词
- 批量审核功能
- 分页查询优化

## 安全考虑

### 数据安全

- 敏感词库加密存储
- 审核日志记录
- 权限控制

### 误判处理

- 人工审核机制
- 白名单功能
- 误判反馈机制

## 扩展功能

### 可扩展的敏感词库

- 支持自定义敏感词添加
- 支持敏感词分类管理
- 支持敏感词权重设置

### 智能检测

- 支持正则表达式匹配
- 支持模糊匹配算法
- 支持上下文分析

## 故障排除

### 常见问题

1. **敏感词库导入失败**

   - 检查文件路径是否正确
   - 检查数据库连接
   - 查看错误日志

2. **检测不准确**

   - 检查敏感词库是否完整
   - 验证检测逻辑
   - 调整匹配算法

3. **管理后台无法访问**
   - 检查 API 路由配置
   - 验证权限设置
   - 查看服务器日志

### 日志查看

```bash
# 查看敏感词检测日志
tail -f logs/sensitive-words.log

# 查看审核操作日志
tail -f logs/admin-review.log
```

## 更新维护

### 敏感词库更新

```bash
# 重新导入敏感词库
npx ts-node scripts/import-sensitive-words.ts

# 重启服务
npm run dev
```

### 系统升级

1. 备份数据库
2. 更新代码
3. 运行数据库迁移
4. 重启服务

## 技术支持

如有问题，请查看：

- 系统日志文件
- 数据库错误信息
- API 响应状态码

---

**注意**: 本系统仅用于内容审核，请遵守相关法律法规。
