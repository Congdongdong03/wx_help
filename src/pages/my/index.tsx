import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import React, { useState, useEffect } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import { useUser } from "../../store/user/hooks";
import "./index.scss";

const DEFAULT_AVATAR = "https://picsum.photos/seed/avatar/100"; // Placeholder avatar
const DEFAULT_NICKNAME = "点击设置昵称";

interface LocalUserInfo {
  nickname: string;
  avatarUrl: string;
}

export default function My() {
  // 使用新的用户状态管理
  const { currentUser, userNickname, userAvatar } = useUser();

  // 本地状态用于显示
  const [userInfo, setUserInfo] = useState<LocalUserInfo>({
    nickname: DEFAULT_NICKNAME,
    avatarUrl: DEFAULT_AVATAR,
  });

  // 更新用户信息显示
  useEffect(() => {
    if (currentUser && userNickname) {
      setUserInfo({
        nickname: userNickname,
        avatarUrl: userAvatar || DEFAULT_AVATAR,
      });
      console.log("Updated user info from Redux store:", currentUser);
    } else {
      setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR });
    }
  }, [currentUser, userNickname, userAvatar]);

  // 监听全局 userInfoUpdated 事件
  useEffect(() => {
    const handler = () => {
      console.log("Received userInfoUpdated event");
    };
    Taro.eventCenter.on("userInfoUpdated", handler);
    return () => {
      Taro.eventCenter.off("userInfoUpdated", handler);
    };
  }, []);

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
          return; // Should not happen
        }

        Taro.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: sourceType as ("album" | "camera")[], // Cast to satisfy TypeScript
          success: (imgRes) => {
            const tempFilePath = imgRes.tempFilePaths[0];
            console.log("Image chosen:", tempFilePath);

            // 1. 立即用 tempFilePath 更新 UI
            const newUserInfo = { ...userInfo, avatarUrl: tempFilePath };
            setUserInfo(newUserInfo);
            // 2. 立即更新本地存储（临时路径）
            try {
              const loggedInUser = getLoggedInUser();
              if (loggedInUser) {
                const updatedLoggedInUser = {
                  ...loggedInUser,
                  avatarUrl: tempFilePath,
                };
                Taro.setStorageSync("userInfo", updatedLoggedInUser);
              }
            } catch (e) {}

            // 3. 模拟上传
            setTimeout(() => {
              const permanentUrl = "https://picsum.photos/seed/new-avatar/100";
              console.log("模拟上传成功，并拿到了永久URL", permanentUrl);
              // 4. 用永久URL更新 UI 和本地存储
              setUserInfo({ ...userInfo, avatarUrl: permanentUrl });
              try {
                const loggedInUser = getLoggedInUser();
                if (loggedInUser) {
                  const updatedLoggedInUser = {
                    ...loggedInUser,
                    avatarUrl: permanentUrl,
                  };
                  Taro.setStorageSync("userInfo", updatedLoggedInUser);
                }
              } catch (e) {}
            }, 1500); // 1.5秒模拟上传
          },
          fail: (imgErr) => {
            console.log("Image selection failed:", imgErr);
            // Check if the error message indicates cancellation
            if (imgErr.errMsg && !imgErr.errMsg.includes("cancel")) {
              Taro.showToast({ title: "选择图片失败", icon: "none" });
            }
          },
        });
      },
      fail: (err) => {
        console.log("Action sheet failed:", err);
        // Check if the error message indicates cancellation
        if (err.errMsg && !err.errMsg.includes("cancel")) {
          // Handle other action sheet errors if necessary
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
      // Pass current nickname to prefill, or let edit page fetch it
      url: `/pages/my/edit-nickname/index?nickname=${encodeURIComponent(
        userInfo.nickname === DEFAULT_NICKNAME ? "" : userInfo.nickname
      )}`,
    });
  };

  // const handleTestRequest = async () => { ... }; // Removed for brevity now

  return (
    <View className="my-page">
      {/* User Info Section */}
      <View
        className="user-info-section"
        // onClick={handleNavigateToEditNickname} // Remove this, handle clicks on children
      >
        {userInfo.avatarUrl === DEFAULT_AVATAR || !userInfo.avatarUrl ? (
          <View
            className="user-avatar default-avatar-placeholder" // Add a specific class for styling "BB"
            onClick={handleAvatarClick}
          >
            <Text>BB</Text>
          </View>
        ) : (
          <Image
            className="user-avatar"
            src={userInfo.avatarUrl}
            onClick={handleAvatarClick} // Add click handler for avatar
          />
        )}
        <View className="user-details" onClick={handleNavigateToEditNickname}>
          <Text className="user-nickname">{userInfo.nickname}</Text>
          <Text className="edit-indicator">&gt;</Text>{" "}
        </View>
        {/* Simple indicator for edit */}
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
          <View
            style={{
              backgroundColor: "red",
              borderRadius: "50%",
              width: "20rpx",
              height: "20rpx",
              marginLeft: "auto",
              marginRight: "20rpx",
            }}
          ></View>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        {/* TODO: Add "帮助与反馈" here */}
        <View
          className="menu-item"
          onClick={() =>
            Taro.navigateTo({ url: "/pages/settings/help-feedback/index" })
          } // Placeholder
        >
          <Text>帮助与反馈</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
        <View
          className="menu-item"
          onClick={() =>
            Taro.navigateTo({ url: "/pages/settings/about/index" })
          } // Placeholder
        >
          <Text>关于帮帮</Text>
          <Text className="menu-arrow">&gt;</Text>
        </View>
      </View>

      {/* <Button onClick={handleNavigateToMyPosts}>前往我的发布 (带Tab)</Button> */}
      {/* TODO: Add "退出登录" button at the bottom if needed */}
    </View>
  );
}

// definePageConfig is usually in a separate .config.ts file
// definePageConfig({
//   navigationBarTitleText: "我的",
// });
