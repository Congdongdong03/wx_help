# 开发环境启动指南

## 🚀 一键启动所有开发服务

### 方法1: 使用启动脚本 (推荐)

#### macOS/Linux:
```bash
./start-dev.sh
```

#### Windows:
```cmd
start-dev.bat
```

### 方法2: 使用npm脚本
```bash
npm run dev
# 或者
npm run dev:all
```

## 📋 启动的服务

脚本会自动启动以下三个服务：

1. **前端开发服务器** - `npm run dev:weapp`
   - 端口: 10086
   - 用于微信小程序开发

2. **后端服务器** - `yarn dev`
   - 端口: 3000
   - API服务器

3. **Prisma Studio** - `npx prisma studio --port 5555`
   - 端口: 5555
   - 数据库管理界面

## 📁 日志文件

所有服务的日志都会保存在 `logs/` 目录下：
- `logs/frontend.log` - 前端开发服务器日志
- `logs/backend.log` - 后端服务器日志
- `logs/prisma.log` - Prisma Studio日志

## 🛑 停止服务

### 使用脚本停止 (macOS/Linux):
```bash
./stop-dev.sh
```

### 手动停止:
- 按 `Ctrl+C` 停止启动脚本
- 或者分别停止各个服务进程

## 🔧 手动启动 (如果需要单独启动)

### 前端开发服务器:
```bash
npm run dev:weapp
```

### 后端服务器:
```bash
cd server
yarn dev
```

### Prisma Studio:
```bash
cd server
npx prisma studio --port 5555
```

## 📝 注意事项

1. 确保已安装所有依赖：
   ```bash
   npm install
   cd server && yarn install
   ```

2. 确保数据库已初始化：
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

3. 如果遇到端口冲突，请检查相应端口是否被占用

## 🎯 访问地址

- 前端开发服务器: http://localhost:10086
- 后端API: http://localhost:3000
- Prisma Studio: http://localhost:5555
