import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SystemStatus {
  database: boolean;
  tables: string[];
  dataCounts: Record<string, number>;
  errors: string[];
}

async function checkSystemStatus(): Promise<SystemStatus> {
  const status: SystemStatus = {
    database: false,
    tables: [],
    dataCounts: {},
    errors: [],
  };

  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    status.database = true;
    console.log("✅ 数据库连接正常");

    // 检查所有表
    const tables = [
      "users",
      "posts",
      "category",
      "cities",
      "feedback",
      "favorite",
      "admin_user",
      "conversation",
      "message",
    ];

    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count();
        status.tables.push(table);
        status.dataCounts[table] = count;
        console.log(`✅ 表 ${table}: ${count} 条记录`);
      } catch (error) {
        status.errors.push(`表 ${table} 检查失败: ${error}`);
        console.log(`❌ 表 ${table}: 检查失败`);
      }
    }

    // 检查关键数据完整性
    await checkDataIntegrity();
  } catch (error) {
    status.errors.push(`数据库连接失败: ${error}`);
    console.error("❌ 数据库连接失败:", error);
  } finally {
    await prisma.$disconnect();
  }

  return status;
}

async function checkDataIntegrity() {
  console.log("\n🔍 检查数据完整性...");

  // 检查是否有管理员用户
  const adminCount = await prisma.admin_user.count();
  if (adminCount === 0) {
    console.log("⚠️  警告: 没有管理员用户");
  } else {
    console.log(`✅ 管理员用户: ${adminCount} 个`);
  }

  // 检查是否有城市数据
  const cityCount = await prisma.cities.count();
  if (cityCount === 0) {
    console.log("⚠️  警告: 没有城市数据");
  } else {
    console.log(`✅ 城市数据: ${cityCount} 个`);
  }

  // 检查是否有分类数据
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    console.log("⚠️  警告: 没有分类数据");
  } else {
    console.log(`✅ 分类数据: ${categoryCount} 个`);
  }

  // 检查用户和帖子的关联
  const usersWithPosts = await prisma.users.findMany({
    include: {
      posts: true,
    },
  });

  const usersWithPostsCount = usersWithPosts.filter(
    (user) => user.posts.length > 0
  ).length;
  console.log(`✅ 有帖子的用户: ${usersWithPostsCount} 个`);
}

async function verifySetup() {
  console.log("🔧 验证系统设置...\n");

  const status = await checkSystemStatus();

  console.log("\n📊 系统状态总结:");
  console.log(`   数据库连接: ${status.database ? "✅ 正常" : "❌ 失败"}`);
  console.log(`   可用表数量: ${status.tables.length}`);
  console.log(`   错误数量: ${status.errors.length}`);

  if (status.errors.length > 0) {
    console.log("\n❌ 发现的问题:");
    status.errors.forEach((error) => console.log(`   - ${error}`));
  } else {
    console.log("\n🎉 系统设置验证完成，一切正常！");
  }

  return status;
}

async function finalVerification() {
  console.log("🚀 执行最终验证...\n");

  // 1. 基础系统检查
  await verifySetup();

  // 2. 检查环境变量
  console.log("\n🔧 检查环境变量...");
  const requiredEnvVars = ["DATABASE_URL", "PORT", "NODE_ENV"];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: 已设置`);
    } else {
      console.log(`❌ ${envVar}: 未设置`);
    }
  }

  // 3. 检查文件权限
  console.log("\n📁 检查文件权限...");
  const fs = require("fs");
  const path = require("path");

  const uploadDir = path.join(__dirname, "../src/public/uploads");
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log("✅ 上传目录权限正常");
  } catch (error) {
    console.log("❌ 上传目录权限异常");
  }

  console.log("\n🎉 最终验证完成！");
}

// 如果直接运行此脚本
if (require.main === module) {
  finalVerification();
}

export { checkSystemStatus, verifySetup, finalVerification, SystemStatus };
