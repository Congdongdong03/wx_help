# 敏感词检测系统

## 概述

系统自动检测帖子内容中的敏感词，支持以下分类：

- 色情类 (porn)
- 政治类 (political)
- 广告类 (advertisement)
- 网址类 (url)

## 使用方法

```typescript
// 检查文本是否包含敏感词
const result = await sensitiveWordService.checkSensitiveWords(text);
// 返回: { hasSensitiveWords: boolean, matchedWords: string[], categories: string[] }
```

## 管理后台

访问 `http://localhost:3000/admin-sensitive-review.html` 进行内容审核。

## 配置

敏感词库文件位于 `sensitive-words/` 目录，系统启动时自动加载。
