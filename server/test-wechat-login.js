const axios = require("axios");

// 测试微信登录接口
async function testWechatLogin() {
  try {
    console.log("🧪 测试微信登录接口...");

    const response = await axios.post(
      "http://192.168.20.18:3000/api/auth/wechat-login",
      {
        code: "test_code_123",
        userInfo: {
          nickName: "测试用户",
          avatarUrl: "https://example.com/avatar.jpg",
          gender: 1,
          country: "China",
          province: "Beijing",
          city: "Beijing",
          language: "zh_CN",
        },
      }
    );

    console.log("✅ 登录成功:", response.data);
  } catch (error) {
    console.error("❌ 登录失败:", error.response?.data || error.message);
  }
}

// 测试健康检查接口
async function testHealthCheck() {
  try {
    console.log("🏥 测试健康检查接口...");

    const response = await axios.get("http://192.168.20.18:3000/api/health");

    console.log("✅ 健康检查成功:", response.data);
  } catch (error) {
    console.error("❌ 健康检查失败:", error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  console.log("🚀 开始运行测试...\n");

  await testHealthCheck();
  console.log("");

  await testWechatLogin();
  console.log("\n✨ 测试完成");
}

runTests();
