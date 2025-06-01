import { View, Text } from "@tarojs/components";
export default function Index() {
  return (
    <View className="index">
      {" "}
      <Text>首页页面</Text>
    </View>
  );
}
definePageConfig({ navigationBarTitleText: "首页" });
