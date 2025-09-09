#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 启动开发环境...${NC}"
echo -e "${YELLOW}将同时启动:${NC}"
echo -e "  • 前端开发服务器 (npm run dev:weapp)"
echo -e "  • 后端服务器 (yarn dev)"
echo -e "  • Prisma Studio (npx prisma studio --port 5555)"
echo ""

# 检查必要的命令是否存在
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ yarn 未安装${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx 未安装${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动前端开发服务器
echo -e "${GREEN}📱 启动前端开发服务器...${NC}"
npm run dev:weapp > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待一下让前端启动
sleep 2

# 启动后端服务器
echo -e "${GREEN}🔧 启动后端服务器...${NC}"
cd server && yarn dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# 等待一下让后端启动
sleep 2

# 启动Prisma Studio
echo -e "${GREEN}🗄️  启动Prisma Studio...${NC}"
cd server && npx prisma studio --port 5555 > ../logs/prisma.log 2>&1 &
PRISMA_PID=$!

# 回到根目录
cd ..

echo ""
echo -e "${GREEN}✅ 所有服务已启动!${NC}"
echo ""
echo -e "${YELLOW}服务信息:${NC}"
echo -e "  • 前端开发服务器: ${BLUE}http://localhost:10086${NC} (PID: $FRONTEND_PID)"
echo -e "  • 后端服务器: ${BLUE}http://localhost:3000${NC} (PID: $BACKEND_PID)"
echo -e "  • Prisma Studio: ${BLUE}http://localhost:5555${NC} (PID: $PRISMA_PID)"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo -e "  • 前端日志: ${BLUE}logs/frontend.log${NC}"
echo -e "  • 后端日志: ${BLUE}logs/backend.log${NC}"
echo -e "  • Prisma日志: ${BLUE}logs/prisma.log${NC}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"

# 创建停止脚本
cat > stop-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 停止所有开发服务..."

# 停止前端
pkill -f "taro build --type weapp"
echo "✅ 前端服务已停止"

# 停止后端
pkill -f "nodemon.*src/index.ts"
echo "✅ 后端服务已停止"

# 停止Prisma Studio
pkill -f "prisma studio"
echo "✅ Prisma Studio已停止"

echo "🎉 所有服务已停止"
EOF

chmod +x stop-dev.sh

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止所有服务..."; kill $FRONTEND_PID $BACKEND_PID $PRISMA_PID 2>/dev/null; echo "✅ 所有服务已停止"; exit 0' INT

# 保持脚本运行
wait
