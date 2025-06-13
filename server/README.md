# BangBang Server

BangBang 小程序的后端服务器。

## 环境要求

- Node.js >= 14
- MySQL >= 8.0
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

然后编辑 `.env` 文件，填入相应的配置信息。

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
  ├── types/          # 类型定义
  └── utils/          # 工具函数
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
