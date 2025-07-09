import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../store/user";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../../store/user/actions";
import "./index.scss";

// 测试用户数据
const TEST_USERS = {
  userA: {
    id: 1,
    openid: "dev_openid_123",
    nickName: "用户A（卖家）",
    avatarUrl:
      "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    gender: 1,
    city: "Sydney",
    province: "NSW",
    country: "Australia",
    language: "zh_CN",
    status: "active",
    token: "test_token_user_a",
  },
  userB: {
    id: 2,
    openid: "dev_openid_456",
    nickName: "用户B（买家）",
    avatarUrl:
      "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    gender: 2,
    city: "Melbourne",
    province: "VIC",
    country: "Australia",
    language: "zh_CN",
    status: "active",
    token: "test_token_user_b",
  },
};

interface UserSwitcherProps {
  isVisible: boolean;
  onClose: () => void;
}

const UserSwitcher = ({ isVisible, onClose }: UserSwitcherProps) => {
  const { currentUser } = useUser();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleSwitchUser = async (userKey: keyof typeof TEST_USERS) => {
    setIsLoading(true);
    try {
      const userData = TEST_USERS[userKey];

      // 先登出当前用户
      if (currentUser) {
        dispatch(logout());
      }

      // 模拟登录延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 登录新用户
      dispatch(loginSuccess(userData));

      // 存储到本地存储
      Taro.setStorageSync("openid", userData.openid);
      Taro.setStorageSync("userInfo", userData);

      Taro.showToast({
        title: `已切换到${userData.nickName}`,
        icon: "success",
        duration: 2000,
      });

      // 触发全局事件
      Taro.eventCenter.trigger("userInfoUpdated");

      onClose();
    } catch (error) {
      console.error("切换用户失败:", error);
      Taro.showToast({
        title: "切换用户失败",
        icon: "none",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      dispatch(logout());
      Taro.removeStorageSync("openid");
      Taro.removeStorageSync("userInfo");

      Taro.showToast({
        title: "已退出登录",
        icon: "success",
        duration: 2000,
      });

      Taro.eventCenter.trigger("userInfoUpdated");
      onClose();
    } catch (error) {
      console.error("退出登录失败:", error);
      Taro.showToast({
        title: "退出登录失败",
        icon: "none",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="user-switcher-overlay" onClick={onClose}>
      <View
        className="user-switcher-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <View className="modal-header">
          <Text className="modal-title">测试用户切换面板</Text>
          <Text className="modal-subtitle">仅开发环境可见</Text>
        </View>

        <View className="current-user-info">
          <Text className="current-user-label">当前用户：</Text>
          <Text className="current-user-name">
            {currentUser ? currentUser.nickName : "未登录"}
          </Text>
        </View>

        <View className="user-buttons">
          <Button
            className={`user-button ${
              currentUser?.id === TEST_USERS.userA.id ? "active" : ""
            }`}
            onClick={() => handleSwitchUser("userA")}
            disabled={isLoading}
            loading={isLoading}
          >
            一键登录为用户A（卖家）
          </Button>

          <Button
            className={`user-button ${
              currentUser?.id === TEST_USERS.userB.id ? "active" : ""
            }`}
            onClick={() => handleSwitchUser("userB")}
            disabled={isLoading}
            loading={isLoading}
          >
            一键登录为用户B（买家）
          </Button>

          {currentUser && (
            <Button
              className="logout-button"
              onClick={handleLogout}
              disabled={isLoading}
              loading={isLoading}
            >
              退出登录
            </Button>
          )}
        </View>

        <View className="test-tips">
          <Text className="tips-title">测试说明：</Text>
          <Text className="tips-content">
            1. 用户A是卖家，查看自己的帖子时不会看到"私信卖家"按钮
          </Text>
          <Text className="tips-content">
            2. 用户B是买家，查看用户A的帖子时会看到"私信卖家"按钮
          </Text>
          <Text className="tips-content">
            3. 切换用户后，请刷新页面或重新进入帖子详情页
          </Text>
        </View>

        <Button className="close-button" onClick={onClose}>
          关闭
        </Button>
      </View>
    </View>
  );
};

export default UserSwitcher;
