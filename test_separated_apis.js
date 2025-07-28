const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function testSeparatedAPIs() {
  console.log("🧪 测试分离的帖子接口...\n");

  try {
    // 测试获取置顶帖子
    console.log("1. 测试获取置顶帖子...");
    const pinnedResponse = await axios.get(`${BASE_URL}/posts/pinned`, {
      params: {
        city: "melbourne",
        category: "recommend",
        limit: 5,
      },
    });

    console.log("✅ 置顶帖子接口响应:", {
      code: pinnedResponse.data.code,
      message: pinnedResponse.data.message,
      count: pinnedResponse.data.data?.pinned_posts?.length || 0,
    });

    // 测试获取普通帖子
    console.log("\n2. 测试获取普通帖子...");
    const normalResponse = await axios.get(`${BASE_URL}/posts/normal`, {
      params: {
        city: "melbourne",
        category: "recommend",
        page: 1,
        limit: 10,
      },
    });

    console.log("✅ 普通帖子接口响应:", {
      code: normalResponse.data.code,
      message: normalResponse.data.message,
      count: normalResponse.data.data?.posts?.length || 0,
      pagination: normalResponse.data.data?.pagination,
    });

    // 测试原来的聚合接口（应该仍然可用）
    console.log("\n3. 测试原来的聚合接口...");
    const combinedResponse = await axios.get(`${BASE_URL}/posts`, {
      params: {
        city: "melbourne",
        category: "recommend",
        page: 1,
        limit: 10,
      },
    });

    console.log("✅ 聚合接口响应:", {
      code: combinedResponse.data.code,
      message: combinedResponse.data.message,
      postsCount: combinedResponse.data.data?.posts?.length || 0,
      pinnedCount: combinedResponse.data.data?.pinned_content?.length || 0,
    });

    console.log("\n🎉 所有接口测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
}

// 运行测试
testSeparatedAPIs();
