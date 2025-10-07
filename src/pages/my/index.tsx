import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import { API_CONFIG } from "../../config/api";
import { request } from "../../utils/request";
import "./index.scss";

const DEFAULT_AVATAR = "https://picsum.photos/seed/avatar/100";
const DEFAULT_NICKNAME = "点击设置昵称";

interface LocalUserInfo {
  nickname: string;
  avatarUrl: string;
}

export default function My() {
  const [userInfo, setUserInfo] = useState<LocalUserInfo>({
    nickname: DEFAULT_NICKNAME,
    avatarUrl: DEFAULT_AVATAR,
  });

  // 直接从后端获取用户信息（不经过 Redux）
  const fetchUserInfo = useCallback(async () => {
    try {
      const resp = await request(API_CONFIG.getApiUrl("/users/info"), {
        method: "GET",
        retryCount: 1,
      });
      if (resp?.code === 0 && resp?.data) {
        setUserInfo({
          nickname: resp.data.nickname || DEFAULT_NICKNAME,
          avatarUrl: resp.data.avatar_url || DEFAULT_AVATAR,
        });
      } else {
        setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR });
      }
    } catch (_e) {
      setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR });
    }
  }, []);

  // 页面展示时刷新，确保拿到数据库最新值
  useDidShow(() => {
    fetchUserInfo();
  });

  const handleAvatarClick = () => {
    Taro.showActionSheet({
      itemList: ["从相册选择", "拍照"],
      success: (res) => {
        let sourceType;
        if (res.tapIndex === 0) {
          sourceType = ["album"];
        } else if (res.tapIndex === 1) {
          sourceType = ["camera"];
        } else {
          return;
        }

        Taro.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: sourceType as ("album" | "camera")[],
          success: (imgRes) => {
            const tempFilePath = imgRes.tempFilePaths[0];

            // 立即更新 UI
            setUserInfo({ ...userInfo, avatarUrl: tempFilePath });

            // 模拟上传
            setTimeout(() => {
              const permanentUrl = "https://picsum.photos/seed/new-avatar/100";
              setUserInfo({ ...userInfo, avatarUrl: permanentUrl });
            }, 1500);
          },
          fail: (imgErr) => {
            if (imgErr.errMsg && !imgErr.errMsg.includes("cancel")) {
              Taro.showToast({ title: "选择图片失败", icon: "none" });
            }
          },
        });
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes("cancel")) {
          console.error("Action sheet failed:", err);
        }
      },
    });
  };

  const handleNavigateToMyPosts = () => {
    Taro.navigateTo({
      url: "/pages/my/my-posts/my-posts",
    });
  };

  const handleNavigateToEditNickname = () => {
    Taro.navigateTo({
      url: `/pages/my/edit-nickname/index?nickname=${encodeURIComponent(
        userInfo.nickname === DEFAULT_NICKNAME ? "" : userInfo.nickname
      )}`,
    });
  };

  return (
    <View className="my-page">
      {/* User Info Section */}
      <View className="user-info-section">
        {userInfo.avatarUrl === DEFAULT_AVATAR || !userInfo.avatarUrl ? (
          <View
            className="user-avatar default-avatar-placeholder"
            onClick={handleAvatarClick}
          >
            <Text>BB</Text>
          </View>
        ) : (
          <Image
            className="user-avatar"
            src={userInfo.avatarUrl}
            onClick={handleAvatarClick}
          />
        )}
        <View className="user-details" onClick={handleNavigateToEditNickname}>
          <Text className="user-nickname">{userInfo.nickname}</Text>
          <Text className="edit-indicator">&gt;</Text>
        </View>
      </View>

      {/* Menu List */}
      <View className="menu-list">
        <View className="menu-item" onClick={handleNavigateToMyPosts}>
          <Text>我的发布</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        <View
          className="menu-item"
          onClick={() => Taro.navigateTo({ url: "/pages/my/favorites/index" })}
        >
          <Text>我的收藏</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        <View
          className="menu-item"
          onClick={() => Taro.navigateTo({ url: "/pages/message/index" })}
        >
          <Text>我的消息</Text>
          <View className="message-badge"></View>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        <View
          className="menu-item"
          onClick={() =>
            Taro.navigateTo({ url: "/pages/settings/help-feedback/index" })
          }
        >
          <Text>帮助与反馈</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        <View
          className="menu-item"
          onClick={() =>
            Taro.navigateTo({ url: "/pages/settings/about/index" })
          }
        >
          <Text>关于帮帮</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
      </View>
    </View>
  );
}
