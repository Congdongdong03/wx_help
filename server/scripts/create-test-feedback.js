const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestFeedback() {
  try {
    // 获取一些用户ID
    const users = await prisma.users.findMany({
      take: 5,
      select: { id: true },
    });

    if (users.length === 0) {
      console.log("没有找到用户，请先创建一些用户");
      return;
    }

    const testFeedbacks = [
      {
        user_id: users[0].id,
        content: "建议增加更多的商品分类，方便用户查找",
        type: "advice",
        status: 0,
      },
      {
        user_id: users[1]?.id || users[0].id,
        content: "应用偶尔会闪退，特别是在浏览商品列表时",
        type: "bug",
        status: 0,
      },
      {
        user_id: users[2]?.id || users[0].id,
        content: "举报一个虚假商品信息，商品描述与实际不符",
        type: "report",
        status: 1,
      },
      {
        user_id: users[3]?.id || users[0].id,
        content: "希望能增加商品收藏功能，这样更方便管理感兴趣的商品",
        type: "advice",
        status: 0,
      },
      {
        user_id: users[4]?.id || users[0].id,
        content: "搜索功能有时候反应比较慢，希望能优化一下",
        type: "bug",
        status: 0,
      },
    ];

    for (const feedback of testFeedbacks) {
      await prisma.feedback.create({
        data: feedback,
      });
    }

    console.log("✅ 测试反馈数据创建成功！");
    console.log(`创建了 ${testFeedbacks.length} 条反馈记录`);
  } catch (error) {
    console.error("❌ 创建测试反馈失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestFeedback();
