import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";

export default function My() {
  const handleNavigateToMyPosts = () => {
    Taro.navigateTo({
      url: "/pages/my/my-posts/my-posts", // 跳转到 src/pages/my/my-posts.tsx 对应的页面路径
    });
  };
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
      <Button onClick={handleNavigateToMyPosts}>前往我的发布 (带Tab)</Button>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的",
});
