import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";

export default function My() {
  const handleTestRequest = async () => {
    try {
      const response = await Taro.request({
        url: "http://localhost:3000/", // 测试请求后端根路径
        method: "GET",
      });
      console.log("Test request successful:", response.data);
    } catch (error) {
      console.error("Test request failed:", error);
    }
  };

  return (
    <View className="index">
      <Text>我的页面</Text>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的",
});
