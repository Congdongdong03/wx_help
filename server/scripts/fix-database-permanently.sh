#!/bin/bash

# 永久性数据库修复脚本
# 解决 Prisma Studio 表不存在的问题

echo "🔧 开始永久性数据库修复..."

# 1. 停止所有 Prisma Studio 进程
echo "📋 停止 Prisma Studio 进程..."
pkill -f "prisma studio" 2>/dev/null || true
sleep 2

# 2. 清理所有缓存
echo "🧹 清理 Prisma 缓存..."
rm -rf ~/.cache/prisma 2>/dev/null || true
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf .prisma 2>/dev/null || true

# 3. 删除冲突的数据库文件
echo "🗑️  清理冲突的数据库文件..."
rm -f ./wx_help.sqlite 2>/dev/null || true
rm -f ./prisma/prisma/wx_help.sqlite 2>/dev/null || true

# 4. 重新生成 Prisma Client
echo "🔨 重新生成 Prisma Client..."
npx prisma generate

# 5. 应用迁移
echo "📊 应用数据库迁移..."
npx prisma migrate deploy

# 6. 重新创建测试数据
echo "📝 重新创建测试数据..."
npx ts-node scripts/create-all-test-data.ts

# 7. 验证修复
echo "✅ 验证修复结果..."
npx ts-node scripts/final-verification.ts

echo ""
echo "🎉 永久性修复完成！"
echo "📱 现在可以启动 Prisma Studio:"
echo "   npx prisma studio --port 5555"
echo ""
echo "🔧 如果问题再次出现，请运行此脚本："
echo "   ./scripts/fix-database-permanently.sh"
