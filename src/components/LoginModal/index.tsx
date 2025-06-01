import Taro from "@tarojs/taro";
import { View, Text, Button, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import { UserInfo, storeLoggedInUser, loginModalEventBus } from "../../app"; // Assuming app.tsx is in src
import "./index.scss";

interface LoginModalProps {
  // Props will be passed by the page/layout that renders this
  // For now, its visibility is controlled by listening to loginModalEventBus
}

// Mock API for login simulation (copied from app.tsx for standalone use if needed, or import)
const mockLoginAPI = (
  profileInfo: Taro.getUserProfile.SuccessCallbackResult["userInfo"]
): Promise<UserInfo> => {
  console.log(
    "🔄 mockLoginAPI: Starting login API simulation with profile:",
    profileInfo
  );
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const shouldFail = Math.random() < 0.1;
      console.log(
        `🎲 mockLoginAPI: Random failure check - should fail: ${shouldFail}`
      );

      if (shouldFail) {
        console.log("❌ mockLoginAPI: Simulating network error");
        reject({ errMsg: "Network error or API failure" });
        return;
      }

      const mockUser: UserInfo = {
        ...(profileInfo as any),
        avatarUrl: profileInfo.avatarUrl,
        nickName: profileInfo.nickName,
        openid: `mock_openid_${Date.now()}`,
        token: `mock_token_${Date.now()}`,
      };
      console.log(
        "✅ mockLoginAPI: Login simulation successful, returning user:",
        mockUser
      );
      resolve(mockUser);
    }, 1000);
  });
};

export default function LoginModal(props: LoginModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [modalType, setModalType] = useState<"initial" | "overlay">("initial");
  const [isLoading, setIsLoading] = useState(false);

  console.log("🏗️ LoginModal: Component rendered with state:", {
    isVisible,
    modalType,
    isLoading,
  });

  useEffect(() => {
    console.log("🔧 LoginModal: Setting up event listeners");

    const showHandler = (options: { type: "initial" | "overlay" }) => {
      console.log(
        "📨 LoginModal: Received showLogin event with options:",
        options
      );
      console.log("📨 LoginModal: Current state before update:", {
        isVisible,
        modalType,
      });

      const newType = options.type || "initial";
      console.log(
        `📨 LoginModal: Setting modalType to '${newType}' and isVisible to true`
      );

      setModalType(newType);
      setIsVisible(true);
    };

    const hideHandler = () => {
      console.log("📨 LoginModal: Received hideLogin event");
      console.log("📨 LoginModal: Current isVisible state:", isVisible);
      console.log("📨 LoginModal: Setting isVisible to false");
      setIsVisible(false);
    };

    loginModalEventBus.on("showLogin", showHandler);
    loginModalEventBus.on("hideLogin", hideHandler);
    console.log("✅ LoginModal: Event listeners registered successfully");

    return () => {
      console.log("🧹 LoginModal: Cleaning up event listeners");
      loginModalEventBus.off("showLogin", showHandler);
      loginModalEventBus.off("hideLogin", hideHandler);
      console.log("✅ LoginModal: Event listeners cleaned up");
    };
  }, []);

  const handleAuthorize = async () => {
    console.log("🔘 LoginModal: Authorize button clicked");
    console.log("🔘 LoginModal: Current modal type:", modalType);
    console.log("🔘 LoginModal: Setting loading state to true");

    setIsLoading(true);

    try {
      console.log("📱 LoginModal: Calling Taro.getUserProfile...");
      const res = await Taro.getUserProfile({
        desc: "用于完善会员资料与登录", // Description for the user
      });
      console.log(
        "✅ LoginModal: Taro.getUserProfile success, userInfo received:",
        res.userInfo
      );

      console.log("🔄 LoginModal: Calling mockLoginAPI with userInfo...");
      const loggedInUser = await mockLoginAPI(res.userInfo);
      console.log(
        "✅ LoginModal: mockLoginAPI successful, user data:",
        loggedInUser
      );

      console.log("💾 LoginModal: Storing logged in user...");
      storeLoggedInUser(loggedInUser);
      console.log("✅ LoginModal: User stored successfully");

      console.log("🎉 LoginModal: Showing success toast");
      Taro.showToast({
        title: `欢迎回来，${loggedInUser.nickName}`,
        icon: "success",
        duration: 2000,
      });

      console.log("🚪 LoginModal: Hiding modal (setting isVisible to false)");
      setIsVisible(false); // Hide modal on success

      console.log("🔄 LoginModal: Setting loading state to false");
      setIsLoading(false);

      console.log("📤 LoginModal: Triggering authSuccess event");
      loginModalEventBus.trigger("authSuccess", loggedInUser); // Notify app (optional)
      console.log(
        "✅ LoginModal: Authorization process completed successfully"
      );
    } catch (err: any) {
      console.error("❌ LoginModal: Authorization failed with error:", err);
      console.log("🔄 LoginModal: Setting loading state to false due to error");
      setIsLoading(false);

      let errMsg = "授权失败，请稍后重试";
      console.log("🔍 LoginModal: Analyzing error type...");

      if (err.errMsg && err.errMsg.includes("getUserProfile:fail auth deny")) {
        console.log("🚫 LoginModal: User explicitly denied authorization");
        errMsg = "您已拒绝授权";
        console.log(
          "🔄 LoginModal: Switching to overlay mode due to user rejection"
        );
        setModalType("overlay");
        console.log("📤 LoginModal: Triggering authReject event");
        loginModalEventBus.trigger("authReject"); // Notify app of explicit rejection
      } else if (err.errMsg && err.errMsg.includes("Network error")) {
        console.log("🌐 LoginModal: Network error detected");
        errMsg = "授权失败，请检查网络后重试";
      }

      console.log(`📝 LoginModal: Final error message: "${errMsg}"`);
      console.log(
        `🔍 LoginModal: Current modalType for error handling: "${modalType}"`
      );

      // For initial type, if it's not an explicit user deny, show error in place or a toast
      // For overlay type, error is usually shown within the overlay
      if (modalType === "initial" && errMsg !== "您已拒绝授权") {
        console.log(
          "🍞 LoginModal: Showing error toast for initial modal (non-rejection error)"
        );
        Taro.showToast({
          title: errMsg,
          icon: "none",
          duration: 2500,
        });
      } else if (modalType === "overlay") {
        console.log("🍞 LoginModal: Showing error toast for overlay modal");
        // Error message can be displayed within the overlay UI for this type
        // For now, a toast for overlay too, or you can add a text field in the overlay
        Taro.showToast({
          title: errMsg,
          icon: "none",
          duration: 2500,
        });
      }
      console.log("❌ LoginModal: Error handling completed");
    }
  };

  const handleRejectInitial = () => {
    console.log("🚫 LoginModal: Initial reject button clicked");
    console.log("🚫 LoginModal: Current modalType:", modalType);
    console.log(
      "🔄 LoginModal: Switching modalType from 'initial' to 'overlay'"
    );
    setModalType("overlay");
    console.log("📤 LoginModal: Triggering authReject event");
    loginModalEventBus.trigger("authReject"); // Notify app
    console.log("✅ LoginModal: Reject handling completed");
  };

  console.log(
    "🔍 LoginModal: Checking visibility state before render, isVisible:",
    isVisible
  );
  if (!isVisible) {
    console.log("👻 LoginModal: Component not visible, returning null");
    return null;
  }

  console.log("📱 LoginModal: Component is visible, rendering modal");
  console.log(
    "🎭 LoginModal: Checking modal type for rendering, modalType:",
    modalType
  );

  if (modalType === "overlay") {
    console.log("📱 LoginModal: Rendering overlay modal");
    return (
      <View className="login-modal-overlay">
        <View className="overlay-content">
          <Text className="overlay-title">请先登录后再继续使用哦～</Text>
          {/* <Text className="overlay-message">为了提供更完整的服务，请授权登录</Text> */}
          <Button
            className="overlay-auth-button"
            onClick={handleAuthorize}
            loading={isLoading}
            disabled={isLoading}
          >
            重新授权
          </Button>
        </View>
      </View>
    );
  }

  // Initial Modal Type
  console.log("📱 LoginModal: Rendering initial modal");
  return (
    <View className="login-modal-backdrop">
      <View className="login-modal-content">
        <Text className="modal-title">微信授权登录</Text>
        {/* You can add an App logo/icon here */}
        {/* <Image src='/path/to/your/app_icon.png' className='app-logo' /> */}
        <Text className="modal-description">
          为了更好地体验我们的服务，请授权登录，我们将获取您的头像、昵称信息。
        </Text>
        <Button
          className="auth-button primary"
          onClick={handleAuthorize}
          loading={isLoading}
          disabled={isLoading}
        >
          授权登录
        </Button>
        <Button
          className="auth-button secondary"
          onClick={handleRejectInitial}
          disabled={isLoading}
        >
          拒绝
        </Button>
      </View>
    </View>
  );
}
