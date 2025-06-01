import { View, Text } from "@tarojs/components";
// import "./index.scss";
import { Button as NutButton } from "@nutui/nutui-react-taro";
export default function Index() {
  return (
    <View className="index">
      {" "}
      <Text>首页页面</Text> <NutButton type="primary">NutUI 按钮</NutButton>
    </View>
  );
}
definePageConfig({ navigationBarTitleText: "首页" });
