import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import "./index.scss";

export default function AboutPage() {
  const appVersion = "1.0.0";

  const navigateToPolicy = (type: "user-agreement" | "privacy-policy") => {
    if (type === "user-agreement") {
      Taro.navigateTo({ url: "/pages/settings/user-agreement/index" });
    } else if (type === "privacy-policy") {
      Taro.navigateTo({ url: "/pages/settings/privacy-policy/index" });
    }
  };

  return (
    <View className="about-page">
      <View className="about-section logo-section">
        <Text className="app-name">帮帮</Text>
        <Text className="app-version">版本号：{appVersion}</Text>
      </View>

      <View className="about-section links-section">
        <View
          className="link-item"
          onClick={() => navigateToPolicy("user-agreement")}
        >
          <Text>用户协议</Text>
          <Text className="arrow">&gt;</Text>
        </View>
        <View
          className="link-item"
          onClick={() => navigateToPolicy("privacy-policy")}
        >
          <Text>隐私政策</Text>
          <Text className="arrow">&gt;</Text>
        </View>
      </View>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "关于帮帮",
});
