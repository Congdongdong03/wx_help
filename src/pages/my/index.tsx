import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "./index.scss";

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

      <AtButton
        className="my-posts-button"
        onClick={() => {
          console.log("Navigating to my-posts page...");
          Taro.navigateTo({
            url: "/pages/my/my-posts",
            success: () => {
              console.log("Navigation successful");
            },
            fail: (error) => {
              console.error("Navigation failed:", error);
            },
          });
        }}
      >
        我的发布
      </AtButton>

      <AtButton onClick={handleTestRequest} className="test-request-button">
        测试后端连接
      </AtButton>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的",
});
