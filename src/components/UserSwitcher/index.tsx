import React from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface UserSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
}

const users: User[] = [
  {
    id: "dev_openid_123",
    nickname: "用户A",
    avatar: "https://via.placeholder.com/40/007AFF/FFFFFF?text=A",
  },
  {
    id: "test_user_456",
    nickname: "用户B",
    avatar: "https://via.placeholder.com/40/28A745/FFFFFF?text=B",
  },
];

const UserSwitcher: React.FC<UserSwitcherProps> = ({
  currentUser,
  onUserChange,
}) => {
  const handleUserSwitch = (user: User) => {
    if (user.id !== currentUser.id) {
      // 切换用户
      onUserChange(user);

      // 显示切换提示
      Taro.showToast({
        title: `已切换到${user.nickname}`,
        icon: "success",
        duration: 1500,
      });
    }
  };

  return (
    <View
      style={{
        position: "fixed",
        top: "140rpx",
        right: "20rpx",
        zIndex: 1000,
        backgroundColor: "white",
        borderRadius: "20rpx",
        padding: "20rpx",
        boxShadow: "0 4rpx 12rpx rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "10rpx",
      }}
    >
      <Text style={{ fontSize: "24rpx", color: "#666", textAlign: "center" }}>
        当前: {currentUser.nickname}
      </Text>
      <View style={{ display: "flex", gap: "10rpx" }}>
        {users.map((user) => (
          <Button
            key={user.id}
            onClick={() => handleUserSwitch(user)}
            disabled={user.id === currentUser.id}
            style={{
              backgroundColor: user.id === currentUser.id ? "#ccc" : "#007AFF",
              color: "white",
              fontSize: "20rpx",
              padding: "10rpx 20rpx",
              borderRadius: "10rpx",
              border: "none",
              minWidth: "80rpx",
            }}
          >
            {user.nickname}
          </Button>
        ))}
      </View>
    </View>
  );
};

export default UserSwitcher;
