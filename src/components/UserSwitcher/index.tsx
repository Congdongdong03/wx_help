import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../store/user";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../../store/user/actions";
import { request } from "../../utils/request";
import { API_CONFIG } from "../../config/api";
import "./index.scss";

interface DatabaseUser {
  id: number;
  username: string;
  openid: string;
  nickname: string;
  avatar_url: string;
  gender: number;
  city: string;
  province: string;
  country: string;
  language: string;
  status: string;
}

interface UserSwitcherProps {
  isVisible: boolean;
  onClose: () => void;
}

const UserSwitcher = ({ isVisible, onClose }: UserSwitcherProps) => {
  const { currentUser } = useUser();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [databaseUsers, setDatabaseUsers] = useState<DatabaseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  // 从数据库获取用户列表
  const loadDatabaseUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await request(API_CONFIG.getApiUrl("/auth/users"), {
        method: "GET",
      });

      if (response.code === 0 && response.data) {
        setDatabaseUsers(response.data);
        console.log("✅ 从数据库加载用户列表成功:", response.data);
      } else {
        console.warn("⚠️ 无法从数据库获取用户列表，显示空列表");
        setDatabaseUsers([]);
      }
    } catch (error) {
      console.error("❌ 加载数据库用户失败:", error);
      // 如果加载失败，显示空列表
      setDatabaseUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 当弹窗显示时加载用户列表
  useEffect(() => {
    if (isVisible) {
      loadDatabaseUsers();
    }
  }, [isVisible]);

  const handleSwitchUser = async (user: DatabaseUser) => {
    setIsLoading(true);
    try {
      console.log(`🔄 切换到用户: ${user.nickname}`, user);

      // 先登出当前用户
      if (currentUser) {
        dispatch(logout());
      }

      // 调用API登录用户
      const response = await request(
        API_CONFIG.getApiUrl("/auth/wechat-login"),
        {
          method: "POST",
          data: {
            code: "dev_test_code", // 使用开发环境测试code
            userInfo: {
              nickName: user.nickname,
              avatarUrl: user.avatar_url,
              gender: user.gender,
              city: user.city,
              province: user.province,
              country: user.country,
              language: user.language,
            },
          },
        }
      );

      if (response.code === 0) {
        const userData = response.data;
        console.log("✅ API返回用户数据:", userData);

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
      } else {
        throw new Error(response.message || "登录失败");
      }
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
          {loadingUsers ? (
            <Button className="user-button" disabled loading>
              加载用户中...
            </Button>
          ) : (
            databaseUsers.map((user) => (
              <View key={user.id} className="user-item">
                <View className="user-info">
                  <Text className="user-nickname">{user.nickname}</Text>
                  <Text className="user-details">
                    ID: {user.id} | {user.city || "未知城市"}
                  </Text>
                </View>
                <Button
                  className={`user-button ${
                    currentUser?.id === user.id ? "active" : ""
                  }`}
                  onClick={() => handleSwitchUser(user)}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {currentUser?.id === user.id ? "当前用户" : "切换到此用户"}
                </Button>
              </View>
            ))
          )}

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
