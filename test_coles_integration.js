const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function testColesIntegration() {
  console.log("🧪 测试 Coles 图片集成到 /api/posts/pinned 接口...\n");

  try {
    // 1. 测试获取置顶帖子（推荐分类）
    console.log("1. 测试推荐分类的置顶帖子...");
    const pinnedResponse = await axios.get(`${BASE_URL}/posts/pinned`, {
      params: {
        city: "sydney",
        category: "recommend",
        limit: 10,
      },
    });

    if (pinnedResponse.data && pinnedResponse.data.code === 0) {
      const pinnedPosts = pinnedResponse.data.data.pinned_posts || [];
      console.log("✅ 推荐分类置顶帖子数量:", pinnedPosts.length);

      // 查找 Coles 相关的帖子
      const colesPosts = pinnedPosts.filter(
        (post) =>
          post.store === "coles" ||
          post.title.includes("COLES") ||
          post.images.some((img) => img.includes("/catalogue_images/coles/"))
      );

      console.log("✅ 找到 Coles 相关帖子数量:", colesPosts.length);

      if (colesPosts.length > 0) {
        const colesPost = colesPosts[0];
        console.log("📋 Coles 帖子详情:");
        console.log("  - 标题:", colesPost.title);
        console.log("  - 内容:", colesPost.content);
        console.log("  - 图片数量:", colesPost.images.length);
        console.log("  - 总页数:", colesPost.total_pages);
        console.log("  - 第一张图片:", colesPost.images[0]);
      }
    } else {
      console.log("❌ 推荐分类置顶帖子请求失败:", pinnedResponse.data);
    }

    // 2. 测试其他分类的置顶帖子
    console.log("\n2. 测试其他分类的置顶帖子...");
    const otherCategoryResponse = await axios.get(`${BASE_URL}/posts/pinned`, {
      params: {
        city: "sydney",
        category: "help",
        limit: 10,
      },
    });

    if (otherCategoryResponse.data && otherCategoryResponse.data.code === 0) {
      const otherPosts = otherCategoryResponse.data.data.pinned_posts || [];
      console.log("✅ 其他分类置顶帖子数量:", otherPosts.length);

      // 查找 Coles 相关的帖子
      const colesPostsInOther = otherPosts.filter(
        (post) =>
          post.store === "coles" ||
          post.title.includes("COLES") ||
          post.images.some((img) => img.includes("/catalogue_images/coles/"))
      );

      console.log(
        "✅ 其他分类中找到 Coles 相关帖子数量:",
        colesPostsInOther.length
      );
    } else {
      console.log("❌ 其他分类置顶帖子请求失败:", otherCategoryResponse.data);
    }

    // 3. 测试目录图片调试接口
    console.log("\n3. 测试目录图片调试接口...");
    const debugResponse = await axios.get(`${BASE_URL}/debug/catalogue-images`);

    if (debugResponse.data && debugResponse.data.success) {
      console.log("✅ 目录图片调试接口正常");
      console.log(
        "  - Coles 目录存在:",
        debugResponse.data.stores.coles.exists
      );
      if (debugResponse.data.stores.coles.exists) {
        console.log(
          "  - Coles 图片数量:",
          debugResponse.data.stores.coles.count
        );
        console.log(
          "  - Coles 图片文件:",
          debugResponse.data.stores.coles.files
            .slice(0, 3)
            .map((f) => f.filename)
        );
      }
    } else {
      console.log("❌ 目录图片调试接口失败:", debugResponse.data);
    }

    console.log("\n🎉 Coles 图片集成测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
}

// 运行测试
testColesIntegration();
