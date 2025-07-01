import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestConversations() {
  console.log("开始创建测试聊天记录...");

  try {
    // 确保有测试用户
    const user1 = await prisma.users.upsert({
      where: { openid: "dev_openid_123" },
      update: {},
      create: {
        openid: "dev_openid_123",
        nickname: "测试用户A",
        avatar_url: "https://via.placeholder.com/100/007AFF/FFFFFF?text=A",
        username: "test_user_a",
      },
    });

    const user2 = await prisma.users.upsert({
      where: { openid: "test_user_456" },
      update: {},
      create: {
        openid: "test_user_456",
        nickname: "测试用户B",
        avatar_url: "https://via.placeholder.com/100/28A745/FFFFFF?text=B",
        username: "test_user_b",
      },
    });

    // 确保openid不为null
    if (!user1.openid || !user2.openid) {
      throw new Error("用户openid不能为null");
    }

    console.log("测试用户创建完成:", {
      user1: user1.nickname,
      user2: user2.nickname,
    });

    // 确保有测试帖子
    const testPost = await prisma.posts.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        user_id: user1.id,
        title: "测试聊天帖子",
        content: "这是一个用于测试聊天的帖子",
        category: "help",
        status: "published",
        contact_info: "test@example.com",
        city_code: "SYD",
      },
    });

    console.log("测试帖子创建完成:", testPost.title);

    // 创建或获取对话
    const conversation = await prisma.conversation.upsert({
      where: {
        postId_participant1Id_participant2Id: {
          postId: testPost.id,
          participant1Id: user1.openid,
          participant2Id: user2.openid,
        },
      },
      update: {},
      create: {
        postId: testPost.id,
        participant1Id: user1.openid,
        participant2Id: user2.openid,
      },
    });

    console.log("对话创建完成:", conversation.id);

    // 删除现有消息（如果有的话）
    await prisma.message.deleteMany({
      where: { conversationId: conversation.id },
    });

    console.log("清理了现有消息");

    // 创建测试消息
    const testMessages = [
      {
        conversationId: conversation.id,
        senderId: user1.openid,
        receiverId: user2.openid,
        type: "text",
        content: "你好！我想了解一下这个帖子",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000), // 1小时前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "text",
        content: "你好！这个帖子还在有效期内，有什么问题吗？",
        isRead: true,
        createdAt: new Date(Date.now() - 3500000), // 58分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user1.openid,
        receiverId: user2.openid,
        type: "text",
        content: "我想看看具体的图片，能发给我吗？",
        isRead: true,
        createdAt: new Date(Date.now() - 3400000), // 57分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "image",
        content:
          "https://via.placeholder.com/400x300/007AFF/FFFFFF?text=测试图片1",
        isRead: true,
        createdAt: new Date(Date.now() - 3300000), // 55分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "text",
        content: "这是第一张图片，还有其他角度的",
        isRead: true,
        createdAt: new Date(Date.now() - 3200000), // 53分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "image",
        content:
          "https://via.placeholder.com/400x300/28A745/FFFFFF?text=测试图片2",
        isRead: true,
        createdAt: new Date(Date.now() - 3100000), // 52分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user1.openid,
        receiverId: user2.openid,
        type: "text",
        content: "看起来不错！价格可以商量吗？",
        isRead: true,
        createdAt: new Date(Date.now() - 3000000), // 50分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "text",
        content: "可以，我们可以面谈，你什么时候方便？",
        isRead: false,
        createdAt: new Date(Date.now() - 600000), // 10分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user1.openid,
        receiverId: user2.openid,
        type: "text",
        content: "明天下午可以吗？",
        isRead: false,
        createdAt: new Date(Date.now() - 300000), // 5分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "image",
        content:
          "https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=位置图片",
        isRead: false,
        createdAt: new Date(Date.now() - 120000), // 2分钟前
      },
      {
        conversationId: conversation.id,
        senderId: user2.openid,
        receiverId: user1.openid,
        type: "text",
        content: "好的，明天下午2点在这个地方见面",
        isRead: false,
        createdAt: new Date(Date.now() - 60000), // 1分钟前
      },
    ];

    // 批量创建消息
    for (const messageData of testMessages) {
      await prisma.message.create({
        data: messageData,
      });
    }

    console.log(`成功创建了 ${testMessages.length} 条测试消息`);

    // 更新对话的最后更新时间
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    console.log("✅ 测试聊天记录创建完成！");
    console.log("对话ID:", conversation.id);
    console.log("用户A:", user1.nickname, "(openid: dev_openid_123)");
    console.log("用户B:", user2.nickname, "(openid: test_user_456)");
    console.log("消息数量:", testMessages.length);
    console.log(
      "包含:",
      testMessages.filter((m) => m.type === "text").length,
      "条文本消息"
    );
    console.log(
      "包含:",
      testMessages.filter((m) => m.type === "image").length,
      "条图片消息"
    );
  } catch (error) {
    console.error("创建测试聊天记录失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createTestConversations();
