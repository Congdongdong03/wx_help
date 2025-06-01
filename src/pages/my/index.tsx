import Taro, { useDidShow, useRouter } from "@tarojs/taro"; // Assuming useRouter might be needed later
import { useState, useEffect } from "react"; // Corrected import for core hooks
import { View, Text, Button, Image } from "@tarojs/components";
import "./index.scss"; // We will create/update this SCSS file

const USER_INFO_STORAGE_KEY = "my_app_user_info";
const DEFAULT_AVATAR = "https://picsum.photos/seed/avatar/100"; // Placeholder avatar
const DEFAULT_NICKNAME = "点击设置昵称";

interface UserInfo {
  nickname: string;
  avatarUrl: string;
}

export default function My() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nickname: DEFAULT_NICKNAME,
    avatarUrl: DEFAULT_AVATAR,
  });

  const loadUserInfo = () => {
    try {
      const storedUserInfo = Taro.getStorageSync(USER_INFO_STORAGE_KEY);
      if (storedUserInfo && storedUserInfo.nickname) {
        setUserInfo(storedUserInfo);
        console.log("Loaded user info from storage:", storedUserInfo);
      } else {
        // First time or no stored info, use defaults or fetch from backend
        console.log("No user info in storage, using defaults.");
        // setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR }); // Already set by default
        // TODO: Fetch from backend if not in storage and app is truly multi-user
      }
    } catch (e) {
      console.error("Failed to load user info from storage:", e);
      // Fallback to defaults if storage fails
      setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR });
    }
  };

  // Load user info on initial mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Refresh user info when page is shown (e.g., after returning from edit-nickname page)
  useDidShow(() => {
    console.log("My page didShow, reloading user info.");
    loadUserInfo();
  });

  const handleAvatarClick = () => {
    Taro.showActionSheet({
      itemList: ["从相册选择", "拍照"],
      success: (res) => {
        let sourceType;
        if (res.tapIndex === 0) {
          // "从相册选择"
          sourceType = ["album"];
        } else if (res.tapIndex === 1) {
          // "拍照"
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

            const newUserInfo = { ...userInfo, avatarUrl: tempFilePath };
            setUserInfo(newUserInfo);
            try {
              Taro.setStorageSync(USER_INFO_STORAGE_KEY, newUserInfo);
              console.log("Saved new avatar to storage:", newUserInfo);
            } catch (e) {
              console.error("Failed to save avatar to storage:", e);
              Taro.showToast({ title: "头像保存失败", icon: "none" });
            }
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
