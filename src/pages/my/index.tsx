import { View, Text } from "@tarojs/components";
import { definePageConfig } from "@tarojs/taro";
import "./index.scss";

export default function My() {
  return (
    <View className="index">
      <Text>我的页面</Text>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的",
});
