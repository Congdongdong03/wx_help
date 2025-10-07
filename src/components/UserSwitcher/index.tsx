import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../store/user/hooks";
import { UserService } from "../../services/userService";
import "./index.scss";

interface UserSwitcherProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function UserSwitcher({
  isVisible,
  onClose,
}: UserSwitcherProps) {
  const { currentUser, logout, login } = useUser();
  const [selectedUser, setSelectedUser] = useState<string>("");

  const testUsers = [
    { key: "user1", name: "用户1", color: "#FF6B6B" },
    { key: "user2", name: "用户2", color: "#4ECDC4" },
    { key: "admin", name: "管理员", color: "#45B7D1" },
  ];

  const handleUserSwitch = async (userType: string) => {
    try {
      Taro.showLoading({ title: "切换中..." });
      const nicknameMap: Record<string, string> = {
        user1: "用户1",
        user2: "用户2",
        admin: "管理员",
      };

      const taroLogin = await Taro.login();
      const code =
        process.env.NODE_ENV === "development"
          ? "dev_test_code"
          : taroLogin.code;

      const userInfo = {
        nickName: nicknameMap[userType] || "微信用户",
        avatarUrl: "",
        gender: 0,
        country: "中国",
        province: "",
        city: "",
        language: "zh_CN",
        // 传入固定 openid，保证切换后仍是同一数据库用户
        openid:
          userType === "user1"
            ? "dev_openid_user1"
            : userType === "user2"
            ? "dev_openid_user2"
            : "dev_openid_admin",
      } as any;

      const user = await UserService.wechatLogin(code, userInfo);
      Taro.setStorageSync("openid", user.openid);
      login(user);
      setSelectedUser(userType);
      Taro.showToast({ title: `已切换到${user.nickName}`, icon: "success" });
      setTimeout(() => onClose(), 400);
    } catch (e) {
      console.error("切换用户失败:", e);
      Taro.showToast({ title: "切换失败，请稍后重试", icon: "none" });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  // 已移除本地测试登录，使用真实登录流程

  if (!isVisible) {
    return null;
  }

  return (
    <View className="user-switcher-overlay" onClick={onClose}>
      <View
        className="user-switcher-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <View className="user-switcher-header">
          <Text className="user-switcher-title">用户切换器</Text>
          <Text className="user-switcher-subtitle">开发环境专用</Text>
        </View>

        <View className="current-user-info">
          <Text className="current-user-label">当前用户:</Text>
          <Text className="current-user-name">
            {currentUser?.nickName || "未登录"}
          </Text>
          <Text className="current-user-id">
            ID: {currentUser?.id || "N/A"}
          </Text>
        </View>

        <View className="user-switcher-actions">
          <Text className="action-section-title">切换用户:</Text>
          {testUsers.map((user) => (
            <Button
              key={user.key}
              className="user-switch-button"
              style={{ backgroundColor: user.color }}
              onClick={() => handleUserSwitch(user.key)}
            >
              {user.name}
            </Button>
          ))}

          <Text className="action-section-title">其他操作:</Text>
          <Button className="logout-button" onClick={handleLogout}>
            退出登录
          </Button>
        </View>

        <View className="user-switcher-footer">
          <Button className="close-button" onClick={onClose}>
            关闭
          </Button>
        </View>
      </View>
    </View>
  );
}
