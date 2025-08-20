# BangBang Server

BangBang 小程序的后端服务器。

## 环境要求

- Node.js >= 14
- MySQL >= 8.0 或 SQLite
- Redis >= 6.0

## 安装

1. 克隆仓库

```bash
git clone https://github.com/yourusername/bangbang-server.git
cd bangbang-server
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
```

4. 初始化数据库

```bash
npx prisma migrate dev
```

5. 启动开发服务器

```bash
npm run dev
```

## 项目结构

```
src/
  ├── config/         # 配置文件
  ├── controllers/    # 控制器
  ├── middleware/     # 中间件
  ├── models/         # 数据模型
  ├── routes/         # 路由
  ├── services/       # 服务
  └── utils/          # 工具函数

scripts/
  ├── create-all-test-data.ts    # 创建测试数据
  ├── final-check.ts             # 系统验证
  ├── fix-database-permanently.sh # 数据库修复
  └── start-studio.sh            # 启动 Prisma Studio

tools/
  └── create-pinned-posts.ts     # 创建置顶帖子
```

## 开发工具

### 创建测试数据

```bash
npx ts-node scripts/create-all-test-data.ts
```

### 系统验证

```bash
npx ts-node scripts/final-check.ts
```

### 创建置顶帖子

```bash
npx ts-node tools/create-pinned-posts.ts
```

### 启动 Prisma Studio

```bash
./scripts/start-studio.sh
```

## API 文档

### 用户相关

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息

### 帖子相关

- `GET /api/posts` - 获取帖子列表
- `POST /api/posts` - 创建帖子
- `GET /api/posts/:id` - 获取帖子详情
- `PUT /api/posts/:id` - 更新帖子
- `DELETE /api/posts/:id` - 删除帖子

### 文件上传

- `POST /api/upload` - 上传文件

## 开发

```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

## 部署

1. 构建项目

```bash
npm run build
```

2. 启动生产服务器

```bash
npm start
```

## 许可证

ISC
