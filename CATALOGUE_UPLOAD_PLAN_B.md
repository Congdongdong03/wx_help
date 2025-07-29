# 目录上传 Plan B 方案

## 概述

当自动爬虫失败时，Plan B 提供了手动上传 PDF 文件的功能，确保打折目录能够及时更新。

## 功能特性

### 1. 双渠道支持

- **Coles PDF 上传**: 支持上传 Coles 打折目录 PDF
- **Woolworths PDF 上传**: 支持上传 Woolworths 打折目录 PDF

### 2. 文件管理

- 自动清理旧文件
- 文件大小限制（50MB）
- 文件类型验证（仅 PDF）
- 自动生成文件名（日期\_商店名\_catalogue.pdf）

### 3. 状态监控

- 实时显示上传状态
- 文件数量统计
- 文件大小统计
- 更新时间跟踪
- 新旧程度判断（7 天内为最新）

### 4. PDF 查看

- 在线 PDF 查看器
- 支持浏览器内置 PDF 预览

## 使用方法

### 方法一：管理后台上传

1. 访问管理后台：`http://localhost:3000/crm/admin-panel.html`
2. 点击"目录上传"标签页
3. 选择对应的商店（Coles 或 Woolworths）
4. 点击"选择 PDF 文件"按钮
5. 选择要上传的 PDF 文件
6. 点击"上传并转换"按钮
7. 等待上传完成

### 方法二：测试页面上传

1. 访问测试页面：`http://localhost:3000/crm/test-upload.html`
2. 选择要上传的 PDF 文件
3. 点击上传按钮
4. 查看上传结果和状态

## API 接口

### 1. 获取目录状态

```
GET /api/admin/catalogue/status
Headers: X-Openid: dev_openid_123
```

响应示例：

```json
{
  "success": true,
  "data": {
    "coles": {
      "exists": true,
      "imageCount": 1,
      "pdfCount": 1,
      "totalSize": "2.45",
      "lastUpdate": "2025-01-07T10:30:00.000Z",
      "isRecent": true
    },
    "woolworths": {
      "exists": false
    }
  }
}
```

### 2. 上传 PDF 文件

```
POST /api/admin/catalogue/upload
Headers: X-Openid: dev_openid_123
Content-Type: multipart/form-data

Body:
- pdf: PDF文件
- store: 商店名称 (coles 或 woolworths)
```

响应示例：

```json
{
  "success": true,
  "data": {
    "pages": 1,
    "store": "coles",
    "message": "成功转换1页PDF为图片"
  }
}
```

### 3. 查看 PDF 文件

```
GET /catalogue-pdf/:store
```

## 文件存储结构

```
server/src/public/catalogue_images/
├── coles/
│   ├── 20250107_coles_catalogue.pdf
│   └── 20250107_placeholder.jpg
└── woolworths/
    ├── 20250107_woolworths_catalogue.pdf
    └── 20250107_placeholder.jpg
```

## 数据库结构

```sql
CREATE TABLE catalogue_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_name VARCHAR(50) NOT NULL,
  page_number INT NOT NULL,
  image_data LONGTEXT NOT NULL,
  week_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_week (store_name, week_date)
);
```

## 工作流程

### 1. 自动爬虫流程（Plan A）

```
网站爬取 → PDF下载 → 转换为图片 → 保存到数据库 → 显示给用户
```

### 2. 手动上传流程（Plan B）

```
手动下载PDF → 上传到管理后台 → 保存PDF文件 → 更新数据库 → 显示给用户
```

## 故障排除

### 1. 上传失败

- 检查文件大小是否超过 50MB
- 确认文件格式为 PDF
- 检查服务器磁盘空间
- 查看服务器日志

### 2. 状态显示异常

- 检查文件权限
- 确认目录存在
- 验证数据库连接

### 3. PDF 无法查看

- 确认 PDF 文件存在
- 检查文件路径
- 验证 MIME 类型设置

## 安全考虑

1. **文件类型验证**: 只允许上传 PDF 文件
2. **文件大小限制**: 最大 50MB
3. **认证机制**: 需要管理员权限
4. **路径安全**: 防止目录遍历攻击
5. **临时文件清理**: 自动清理上传的临时文件

## 性能优化

1. **异步处理**: 文件上传使用异步处理
2. **文件压缩**: 考虑对 PDF 进行压缩
3. **缓存机制**: 对状态信息进行缓存
4. **批量操作**: 支持批量文件处理

## 扩展功能

### 未来可能的改进

1. **自动转换**: 集成 PDF 转图片功能
2. **批量上传**: 支持多个文件同时上传
3. **版本管理**: 支持多个版本的目录
4. **通知系统**: 上传完成后发送通知
5. **备份功能**: 自动备份上传的文件

## 维护说明

### 定期维护任务

1. 清理过期的 PDF 文件
2. 检查磁盘空间使用情况
3. 备份重要的目录文件
4. 更新安全策略

### 监控指标

1. 上传成功率
2. 文件大小分布
3. 用户访问频率
4. 系统响应时间

## 联系支持

如果遇到问题，请检查：

1. 服务器日志文件
2. 数据库连接状态
3. 文件系统权限
4. 网络连接状态

---

**注意**: 这是一个备用方案，建议优先使用自动爬虫功能。只有在自动爬虫失败时才使用手动上传功能。
