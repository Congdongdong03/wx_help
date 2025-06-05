import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createPinnedPost() {
  try {
    // 1. 创建帖子
    const post = await prisma.posts.create({
      data: {
        user_id: 1, // 使用管理员账号
        title: "Coles WWS 每周打折信息",
        category: "help",
        content: "每周更新 Coles 和 Woolworths 的打折信息，帮助大家省钱！",
        city: "通用",
        status: "published",
        wechat_id: "admin",
        images: JSON.stringify(["https://example.com/coles-wws.jpg"]),
        price: "0",
      },
    });

    // 2. 添加到推荐表并设置为置顶
    await prisma.recommendations.create({
      data: {
        post_id: post.id,
        is_pinned: true,
        sort_order: 0,
      },
    });

    console.log("Successfully created pinned post:", post);
  } catch (error) {
    console.error("Error creating pinned post:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createPinnedPost();
