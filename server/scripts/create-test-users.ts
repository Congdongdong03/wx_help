import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("开始创建测试用户...");

    // 创建用户A
    const userA = await prisma.users.upsert({
      where: { openid: "dev_openid_123" },
      update: {},
      create: {
        username: "user_a",
        openid: "dev_openid_123",
        nickname: "用户A",
        avatar_url: "https://via.placeholder.com/40/007AFF/FFFFFF?text=A",
        city: "Sydney",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 创建用户B
    const userB = await prisma.users.upsert({
      where: { openid: "test_user_456" },
      update: {},
      create: {
        username: "user_b",
        openid: "test_user_456",
        nickname: "用户B",
        avatar_url: "https://via.placeholder.com/40/28A745/FFFFFF?text=B",
        city: "Melbourne",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("用户A创建成功:", userA);
    console.log("用户B创建成功:", userB);

    // 创建一个测试帖子
    const testPost = await prisma.posts.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        user_id: userA.id,
        title: "测试聊天帖子",
        content: "这是一个用于测试聊天的帖子",
        status: "published",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("测试帖子创建成功:", testPost);

    // 创建两个用户之间的对话
    const conversation = await prisma.conversation.upsert({
      where: {
        id: "test-conversation-123",
      },
      update: {},
      create: {
        id: "test-conversation-123",
        postId: testPost.id,
        participant1Id: userA.openid!,
        participant2Id: userB.openid!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("对话创建成功:", conversation);

    console.log("所有测试用户创建完成！");
  } catch (error) {
    console.error("创建测试用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
