import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. 用户
  const user = await prisma.users.create({
    data: {
      username: "test_user",
      email: "test@example.com",
      nickname: "测试用户",
      phone: "1234567890",
      openid: "test_openid",
      avatar_url: "https://example.com/avatar.jpg",
      gender: 1,
      city: "beijing",
      status: "active",
      language: "zh_CN",
      last_login_at: new Date(),
    },
  });

  // 2. 城市
  const beijing = await prisma.cities.create({
    data: {
      name: "北京",
      code: "beijing",
      is_hot: true,
      sort_order: 1,
      is_active: true,
    },
  });

  // 3. 分类
  const category = await prisma.category.create({
    data: {
      name: "租房",
      code: "rent",
    },
  });

  // 4. 帖子
  const post = await prisma.posts.create({
    data: {
      user_id: user.id,
      title: "测试帖子",
      category: "rent",
      content: "这是一个测试帖子",
      wechat_id: "test_wechat",
      images: JSON.stringify(["https://example.com/image.jpg"]),
      city: beijing.code,
      status: "published",
      price: "1000",
      is_pinned: false,
    },
  });

  // 5. 推荐
  await prisma.recommendations.create({
    data: {
      post_id: post.id,
      is_pinned: true,
      sort_order: 1,
    },
  });

  // 6. 收藏
  await prisma.favorite.create({
    data: {
      user_id: user.id,
      post_id: post.id,
    },
  });

  // 7. 反馈
  await prisma.feedback.create({
    data: {
      user_id: user.id,
      content: "测试反馈内容",
      image: "https://example.com/feedback.jpg",
      type: "advice",
      status: 0,
    },
  });

  // 8. 擦亮日志
  await prisma.polish_log.create({
    data: {
      user_id: user.id,
      post_id: post.id,
      polished_at: new Date(),
    },
  });

  // 9. 商品目录图片
  await prisma.catalogue_images.create({
    data: {
      store_name: "Coles",
      page_number: 1,
      image_data: "base64imagestring",
      week_date: new Date(),
    },
  });

  console.log("Seed data created for all tables!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
