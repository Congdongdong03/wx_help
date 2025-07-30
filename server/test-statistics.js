const API_BASE = "http://localhost:3000/api";

async function testStatistics() {
  console.log("🧪 开始测试统计功能...\n");

  try {
    // 测试仪表盘数据
    console.log("1. 测试仪表盘数据...");
    const dashboardResponse = await fetch(`${API_BASE}/statistics/dashboard`, {
      headers: { "X-Openid": "dev_openid_123" },
    });
    const dashboardData = await dashboardResponse.json();

    if (dashboardData.success) {
      console.log("✅ 仪表盘数据获取成功");
      console.log(`   总用户数: ${dashboardData.data.overview.total_users}`);
      console.log(`   总帖子数: ${dashboardData.data.overview.total_posts}`);
      console.log(`   总反馈数: ${dashboardData.data.overview.total_feedback}`);
      console.log(
        `   待审核数: ${dashboardData.data.overview.pending_reviews}`
      );
    } else {
      console.log("❌ 仪表盘数据获取失败:", dashboardData.error);
    }

    // 测试分类统计
    console.log("\n2. 测试分类统计...");
    const categoriesResponse = await fetch(
      `${API_BASE}/statistics/categories`,
      {
        headers: { "X-Openid": "dev_openid_123" },
      }
    );
    const categoriesData = await categoriesResponse.json();

    if (categoriesData.success) {
      console.log("✅ 分类统计获取成功");
      categoriesData.data.forEach((cat) => {
        console.log(`   ${cat.name}: ${cat.count} 篇 (${cat.pending} 待审核)`);
      });
    } else {
      console.log("❌ 分类统计获取失败:", categoriesData.error);
    }

    // 测试活跃用户排行
    console.log("\n3. 测试活跃用户排行...");
    const topUsersResponse = await fetch(`${API_BASE}/statistics/top-users`, {
      headers: { "X-Openid": "dev_openid_123" },
    });
    const topUsersData = await topUsersResponse.json();

    if (topUsersData.success) {
      console.log("✅ 活跃用户排行获取成功");
      topUsersData.data.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.nickname} (${user.post_count} 篇)`
        );
      });
    } else {
      console.log("❌ 活跃用户排行获取失败:", topUsersData.error);
    }

    // 测试趋势数据
    console.log("\n4. 测试趋势数据...");
    const trendsResponse = await fetch(`${API_BASE}/statistics/trends?days=7`, {
      headers: { "X-Openid": "dev_openid_123" },
    });
    const trendsData = await trendsResponse.json();

    if (trendsData.success) {
      console.log("✅ 趋势数据获取成功");
      console.log(`   用户增长数据点: ${trendsData.data.user_growth.length}`);
      console.log(`   帖子增长数据点: ${trendsData.data.post_growth.length}`);
      console.log(
        `   反馈增长数据点: ${trendsData.data.feedback_growth.length}`
      );
    } else {
      console.log("❌ 趋势数据获取失败:", trendsData.error);
    }

    console.log("\n🎉 所有测试完成！");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error.message);
  }
}

testStatistics();
