import { View, Text } from "@tarojs/components";
import { definePageConfig } from "@tarojs/taro";

export default function Manage() {
  return (
    <View className="index">
      <Text>管理页面</Text>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "管理",
});
