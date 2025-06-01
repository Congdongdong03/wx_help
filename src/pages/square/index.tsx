import { View, Text } from "@tarojs/components";
import { definePageConfig } from "@tarojs/taro";

export default function Square() {
  return (
    <View className="index">
      <Text>广场页面</Text>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "广场",
});
