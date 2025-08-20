#!/bin/bash

# Prisma Studio 启动脚本
# 自动处理端口冲突问题

PORT=${1:-5555}  # 默认端口 5555，可以通过参数指定其他端口

echo "🔍 检查端口 $PORT 是否被占用..."

# 检查端口是否被占用
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用，正在尝试释放..."
    
    # 获取占用端口的进程ID
    PID=$(lsof -ti :$PORT)
    
    if [ ! -z "$PID" ]; then
        echo "📋 找到进程 ID: $PID"
        echo "🔄 正在终止进程..."
        kill -9 $PID
        sleep 2
        
        # 再次检查端口是否已释放
        if lsof -i :$PORT > /dev/null 2>&1; then
            echo "❌ 无法释放端口 $PORT，请手动处理"
            exit 1
        else
            echo "✅ 端口 $PORT 已释放"
        fi
    fi
fi

echo "🚀 启动 Prisma Studio 在端口 $PORT..."
echo "📱 浏览器将自动打开 http://localhost:$PORT"
echo "⏹️  按 Ctrl+C 停止服务"

# 启动 Prisma Studio
npx prisma studio --port $PORT
