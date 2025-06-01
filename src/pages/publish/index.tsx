import { View, Text } from "@tarojs/components";
import { definePageConfig } from "@tarojs/taro";
import "./index.scss";

export default function Publish() {
  return (
    <View className="index">
      <Text>发布页面</Text>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "发布",
});
