import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "./my-posts.scss"; // 保留样式导入，虽然页面内容很少，但样式文件仍然可能包含一些基础设置

export default function MyPosts() {
  return (
    <View className="my-posts">
      <Text>我的发布页面</Text> {/* 一个简单的文本，确认页面渲染 */}
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的发布",
});
