import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../store/user/hooks";
import "./index.scss";

interface UserSwitcherProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function UserSwitcher({
  isVisible,
  onClose,
}: UserSwitcherProps) {
  const { currentUser, logout } = useUser();
  const [selectedUser, setSelectedUser] = useState<string>("");

  const testUsers = [
    { key: "user1", name: "用户1", color: "#FF6B6B" },
    { key: "user2", name: "用户2", color: "#4ECDC4" },
    { key: "admin", name: "管理员", color: "#45B7D1" },
  ];

  const handleUserSwitch = (userType: string) => {
    if ((Taro as any).switchUser) {
      (Taro as any).switchUser(userType);
      setSelectedUser(userType);
      // 延迟关闭，让用户看到切换结果
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleTestLogin = () => {
    if ((Taro as any).testLogin) {
      (Taro as any).testLogin("test_openid_" + Date.now());
      onClose();
    }
  };

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
          <Button className="test-login-button" onClick={handleTestLogin}>
            测试登录
          </Button>
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
