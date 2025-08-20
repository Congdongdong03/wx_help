import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log("🔍 深度诊断数据库问题...\n");

    // 1. 检查环境变量
    console.log("📋 环境变量检查:");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("");

    // 2. 检查数据库文件
    console.log("📁 数据库文件检查:");
    const dbPath = process.env.DATABASE_URL?.replace("file:", "");
    if (dbPath) {
      const absolutePath = path.resolve(dbPath);
      console.log("数据库路径:", absolutePath);
      console.log("文件存在:", fs.existsSync(absolutePath));
      if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        console.log("文件大小:", stats.size, "bytes");
        console.log("最后修改:", stats.mtime);
      }
    }
    console.log("");

    // 3. 检查其他可能的数据库文件
    console.log("🔍 查找所有 SQLite 数据库文件:");
    const possibleDbs = [
      "./prisma/wx_help.sqlite",
      "./prisma/prisma/wx_help.sqlite",
      "../prisma/wx_help.sqlite",
      "../../prisma/wx_help.sqlite",
    ];

    for (const db of possibleDbs) {
      const fullPath = path.resolve(db);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ ${db}: ${stats.size} bytes, 修改时间: ${stats.mtime}`);
      } else {
        console.log(`❌ ${db}: 不存在`);
      }
    }
    console.log("");

    // 4. 测试 Prisma Client 连接
    console.log("🔌 Prisma Client 连接测试:");
    try {
      await prisma.$connect();
      console.log("✅ Prisma Client 连接成功");

      // 测试查询每个表
      const tables = [
        "admin_user",
        "category",
        "cities",
        "users",
        "posts",
        "favorite",
        "feedback",
        "polish_log",
        "weekly_deals",
        "catalogue_images",
        "ValidationRule",
        "SystemConfig",
        "Conversation",
        "Message",
      ];

      for (const table of tables) {
        try {
          const result = await (prisma as any)[table].findMany({ take: 1 });
          console.log(`✅ ${table}: ${result.length} 条记录`);
        } catch (error: any) {
          console.log(`❌ ${table}: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.log("❌ Prisma Client 连接失败:", error.message);
    }
    console.log("");

    // 5. 检查 schema 同步状态
    console.log("📊 Schema 同步状态:");
    try {
      const result =
        await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
      console.log(
        "✅ 数据库表列表:",
        (result as any[]).map((r: any) => r.name).join(", ")
      );
    } catch (error: any) {
      console.log("❌ 无法查询数据库表:", error.message);
    }

    // 6. 检查 Prisma 配置
    console.log("\n⚙️ Prisma 配置检查:");
    const schemaPath = path.resolve("./prisma/schema.prisma");
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, "utf8");
      const datasourceMatch = schemaContent.match(
        /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/
      );
      const urlMatch = schemaContent.match(/url\s*=\s*env\("([^"]+)"\)/);

      console.log("Schema 文件存在:", fs.existsSync(schemaPath));
      console.log("Provider:", datasourceMatch ? datasourceMatch[1] : "未找到");
      console.log("URL 环境变量:", urlMatch ? urlMatch[1] : "未找到");
    } else {
      console.log("❌ Schema 文件不存在");
    }

    console.log("\n🎯 诊断完成！");
  } catch (error) {
    console.error("❌ 诊断过程中出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
