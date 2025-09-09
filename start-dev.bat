@echo off
echo 🚀 启动开发环境...
echo 将同时启动:
echo   • 前端开发服务器 (npm run dev:weapp)
echo   • 后端服务器 (yarn dev)
echo   • Prisma Studio (npx prisma studio --port 5555)
echo.

REM 创建日志目录
if not exist logs mkdir logs

REM 启动前端开发服务器
echo 📱 启动前端开发服务器...
start "Frontend Dev Server" cmd /k "npm run dev:weapp"

REM 等待一下让前端启动
timeout /t 3 /nobreak >nul

REM 启动后端服务器
echo 🔧 启动后端服务器...
start "Backend Server" cmd /k "cd server && yarn dev"

REM 等待一下让后端启动
timeout /t 3 /nobreak >nul

REM 启动Prisma Studio
echo 🗄️ 启动Prisma Studio...
start "Prisma Studio" cmd /k "cd server && npx prisma studio --port 5555"

echo.
echo ✅ 所有服务已启动!
echo.
echo 服务信息:
echo   • 前端开发服务器: http://localhost:10086
echo   • 后端服务器: http://localhost:3000
echo   • Prisma Studio: http://localhost:5555
echo.
echo 按任意键退出...
pause >nul
