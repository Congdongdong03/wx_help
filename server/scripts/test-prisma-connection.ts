import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 测试 Prisma Client 连接...\n");

    // 测试查询每个表
    const adminUsers = await prisma.admin_user.findMany();
    console.log(`✅ admin_user: ${adminUsers.length} 条记录`);

    const categories = await prisma.category.findMany();
    console.log(`✅ category: ${categories.length} 条记录`);

    const cities = await prisma.cities.findMany();
    console.log(`✅ cities: ${cities.length} 条记录`);

    const users = await prisma.users.findMany();
    console.log(`✅ users: ${users.length} 条记录`);

    const posts = await prisma.posts.findMany();
    console.log(`✅ posts: ${posts.length} 条记录`);

    const favorites = await prisma.favorite.findMany();
    console.log(`✅ favorite: ${favorites.length} 条记录`);

    const feedback = await prisma.feedback.findMany();
    console.log(`✅ feedback: ${feedback.length} 条记录`);

    const polishLogs = await prisma.polish_log.findMany();
    console.log(`✅ polish_log: ${polishLogs.length} 条记录`);

    const weeklyDeals = await prisma.weekly_deals.findMany();
    console.log(`✅ weekly_deals: ${weeklyDeals.length} 条记录`);

    const catalogueImages = await prisma.catalogue_images.findMany();
    console.log(`✅ catalogue_images: ${catalogueImages.length} 条记录`);

    const validationRules = await prisma.validationRule.findMany();
    console.log(`✅ ValidationRule: ${validationRules.length} 条记录`);

    const systemConfigs = await prisma.systemConfig.findMany();
    console.log(`✅ SystemConfig: ${systemConfigs.length} 条记录`);

    const conversations = await prisma.conversation.findMany();
    console.log(`✅ Conversation: ${conversations.length} 条记录`);

    const messages = await prisma.message.findMany();
    console.log(`✅ Message: ${messages.length} 条记录`);

    console.log("\n🎉 所有表都可以正常访问！");
    console.log("✅ Prisma Client 连接正常");
    console.log("✅ 数据库 schema 同步成功");
    console.log("✅ 现在应该可以使用 Prisma Studio 了");
  } catch (error) {
    console.error("❌ 连接测试失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
