import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function checkStudioDatabase() {
  try {
    console.log("🔍 检查 Prisma Studio 数据库连接...\n");

    // 1. 检查当前环境变量
    console.log("📋 当前环境变量:");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("PWD:", process.env.PWD);
    console.log("");

    // 2. 检查数据库文件
    const dbPath = process.env.DATABASE_URL?.replace("file:", "");
    if (dbPath) {
      const absolutePath = path.resolve(dbPath);
      console.log("📁 数据库文件信息:");
      console.log("相对路径:", dbPath);
      console.log("绝对路径:", absolutePath);
      console.log("文件存在:", fs.existsSync(absolutePath));

      if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        console.log("文件大小:", stats.size, "bytes");
        console.log("最后修改:", stats.mtime);

        // 3. 检查数据库内容
        console.log("\n📊 数据库内容检查:");
        try {
          const tables =
            await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
          console.log(
            "数据库中的表:",
            (tables as any[]).map((t: any) => t.name).join(", ")
          );

          // 检查 favorite 表
          const favoriteCount =
            await prisma.$queryRaw`SELECT COUNT(*) as count FROM favorite`;
          console.log(
            "favorite 表记录数:",
            (favoriteCount as any[])[0]?.count || 0
          );
        } catch (error: any) {
          console.log("❌ 数据库查询失败:", error.message);
        }
      }
    }

    // 4. 测试 Prisma Client 连接
    console.log("\n🔌 Prisma Client 测试:");
    try {
      await prisma.$connect();
      console.log("✅ Prisma Client 连接成功");

      const favorite = await prisma.favorite.findMany({ take: 1 });
      console.log("✅ favorite 表查询成功，记录数:", favorite.length);
    } catch (error: any) {
      console.log("❌ Prisma Client 连接失败:", error.message);
    }

    // 5. 检查可能的数据库文件冲突
    console.log("\n🔍 检查数据库文件冲突:");
    const possiblePaths = [
      "./prisma/wx_help.sqlite",
      "./wx_help.sqlite",
      "../prisma/wx_help.sqlite",
      "../../prisma/wx_help.sqlite",
      "./prisma/prisma/wx_help.sqlite",
    ];

    for (const dbPath of possiblePaths) {
      const fullPath = path.resolve(dbPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(
          `✅ ${dbPath}: ${stats.size} bytes, 修改时间: ${stats.mtime}`
        );
      } else {
        console.log(`❌ ${dbPath}: 不存在`);
      }
    }

    console.log("\n🎯 检查完成！");
  } catch (error) {
    console.error("❌ 检查过程中出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudioDatabase();
