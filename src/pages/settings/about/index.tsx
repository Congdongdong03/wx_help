import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import "./index.scss";

export default function AboutPage() {
  const appVersion = "1.0.0"; // Placeholder version

  const navigateToPolicy = (type: "user-agreement" | "privacy-policy") => {
    // TODO: Create these pages and update URLs
    if (type === "user-agreement") {
      Taro.navigateTo({ url: "/pages/settings/user-agreement/index" });
    } else if (type === "privacy-policy") {
      Taro.navigateTo({ url: "/pages/settings/privacy-policy/index" });
    }
    console.log("Navigate to:", type);
  };

  return (
    <View className="about-page">
      <View className="about-section logo-section">
        {/* You can add a logo Image here if you have one */}
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

      {/* Optional: Add copyright or other info here */}
      {/* <View className="footer-info">
        <Text>版权所有 © 2024</Text>
      </View> */}
    </View>
  );
}

// Optional: Page configuration if needed
definePageConfig({
  navigationBarTitleText: "关于帮帮",
});
