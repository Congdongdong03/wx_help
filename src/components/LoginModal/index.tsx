import Taro from "@tarojs/taro";
import { View, Text, Button, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { UserInfo, loginModalEventBus } from "../../app";
import { useUser } from "../../store/user/hooks";
import { throttle } from "../../utils/debounce";
import { request } from "../../utils/request";
import { API_CONFIG } from "../../config/api";
import "./index.scss";

interface LoginModalProps {
  // Props will be passed by the page/layout that renders this
  // For now, its visibility is controlled by listening to loginModalEventBus
}

interface WechatUserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  country: string;
  province: string;
  city: string;
  language: string;
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

  // 使用新的用户状态管理
  const { login, isLoggedIn } = useUser();

  console.log("🏗️ LoginModal: Component rendered with state:", {
    isVisible,
    modalType,
    isLoading,
  });

  useEffect(() => {
    console.log("🔌 LoginModal: Setting up event listeners");
    loginModalEventBus.on("show", () => {
      console.log("📢 LoginModal: Received show event");
      setIsVisible(true);
      setModalType("initial");
    });

    loginModalEventBus.on("hide", () => {
      console.log("📢 LoginModal: Received hide event");
      setIsVisible(false);
    });

    return () => {
      console.log("🔌 LoginModal: Cleaning up event listeners");
      loginModalEventBus.off("show");
      loginModalEventBus.off("hide");
    };
  }, []);

  // 使用节流处理授权操作
  const handleAuthorize = throttle(async () => {
    console.log("🔘 LoginModal: Authorize button clicked");
    console.log("🔘 LoginModal: Current modal type:", modalType);
    console.log("🔘 LoginModal: Setting loading state to true");

    setIsLoading(true);

    try {
      // 1. 获取用户信息
      console.log("📱 LoginModal: Calling Taro.getUserProfile...");
      const userProfileRes = await Taro.getUserProfile({
        desc: "用于完善会员资料与登录",
      });

      if (!userProfileRes.userInfo) {
        throw new Error("获取用户信息失败");
      }

      const userInfo = userProfileRes.userInfo as WechatUserInfo;
      console.log(
        "✅ LoginModal: Taro.getUserProfile success, userInfo received:",
        userInfo
      );

      // 2. 获取openid
      console.log("📱 LoginModal: Getting openid...");
      const loginRes = await Taro.login();
      if (!loginRes.code) {
        throw new Error("获取登录凭证失败");
      }

      // 开发环境使用测试code
      const code =
        process.env.NODE_ENV === "development"
          ? "dev_test_code"
          : loginRes.code;
      console.log("🔧 LoginModal: Using code:", code);

      // 3. 调用登录接口
      console.log("🔄 LoginModal: Calling login API...");
      const loginResData = await request(
        API_CONFIG.getApiUrl("/api/auth/wechat-login"),
        {
          method: "POST",
          data: {
            code: code,
            userInfo,
          },
          retryCount: 3,
          retryDelay: 1000,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        }
      );

      const loggedInUser = {
        ...loginResData.data,
        token: loginResData.data.token || "mock_token_" + Date.now(),
      };
      console.log(
        "✅ LoginModal: Login API successful, user data:",
        loggedInUser
      );

      console.log("💾 LoginModal: Storing logged in user...");
      // 使用新的用户状态管理
      login(loggedInUser);
      console.log("✅ LoginModal: User stored successfully");

      console.log("🎉 LoginModal: Showing success toast");
      Taro.showToast({
        title: `欢迎回来，${loggedInUser.nickName}`,
        icon: "success",
        duration: 2000,
      });
      // 新增：触发全局事件并跳转到"我的"页面，确保页面刷新
      Taro.eventCenter.trigger("userInfoUpdated");
      Taro.switchTab({ url: "/pages/my/index" });

      console.log("🚪 LoginModal: Hiding modal (setting isVisible to false)");
      setIsVisible(false);

      console.log("🔄 LoginModal: Setting loading state to false");
      setIsLoading(false);

      console.log("📤 LoginModal: Triggering authSuccess event");
      loginModalEventBus.trigger("authSuccess", loggedInUser);
      console.log(
        "✅ LoginModal: Authorization process completed successfully"
      );
    } catch (err: any) {
      console.error("❌ LoginModal: Authorization failed with error:", err);
      console.log("🔄 LoginModal: Setting loading state to false due to error");
      setIsLoading(false);

      let errMsg = "授权失败，请稍后重试";
      console.log("🔍 LoginModal: Analyzing error type...");

      if (err.errMsg?.includes("getUserProfile:fail auth deny")) {
        console.log("🚫 LoginModal: User explicitly denied authorization");
        errMsg = "您已拒绝授权";
        console.log(
          "🔄 LoginModal: Switching to overlay mode due to user rejection"
        );
        setModalType("overlay");
        console.log("📤 LoginModal: Triggering authReject event");
        loginModalEventBus.trigger("authReject");
      } else if (err.errMsg?.includes("Network error")) {
        console.log("🌐 LoginModal: Network error detected");
        errMsg = "网络连接失败，请检查网络后重试";
      } else if (err.message?.includes("HTTP 429")) {
        console.log("🚫 LoginModal: Rate limit exceeded");
        errMsg = "请求过于频繁，请稍后再试";
      } else if (err.message?.includes("HTTP 5")) {
        console.log("🚫 LoginModal: Server error");
        errMsg = "服务器暂时不可用，请稍后再试";
      } else if (err.message === "获取用户信息失败") {
        errMsg = "获取用户信息失败，请重试";
      } else if (err.message === "获取登录凭证失败") {
        errMsg = "登录失败，请重试";
      }

      console.log(`📝 LoginModal: Final error message: "${errMsg}"`);
      console.log(
        `🔍 LoginModal: Current modalType for error handling: "${modalType}"`
      );

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
        Taro.showToast({
          title: errMsg,
          icon: "none",
          duration: 2500,
        });
      }
      console.log("❌ LoginModal: Error handling completed");
    }
  }, 1000);

  // 使用节流处理拒绝操作
  const handleRejectInitial = throttle(() => {
    console.log("🚫 LoginModal: Initial reject button clicked");
    console.log("🚫 LoginModal: Current modalType:", modalType);
    console.log(
      "🔄 LoginModal: Switching modalType from 'initial' to 'overlay'"
    );
    setModalType("overlay");
    console.log("📤 LoginModal: Triggering authReject event");
    loginModalEventBus.trigger("authReject");
    console.log("✅ LoginModal: Reject handling completed");
  }, 1000);

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
    <View className="login-modal">
      <View className="modal-content">
        <Text className="modal-title">欢迎使用帮帮</Text>
        <Text className="modal-subtitle">授权后即可使用完整功能</Text>
        <Button
          className="auth-button"
          onClick={handleAuthorize}
          loading={isLoading}
          disabled={isLoading}
        >
          微信一键登录
        </Button>
        <Button
          className="reject-button"
          onClick={handleRejectInitial}
          disabled={isLoading}
        >
          暂不登录
        </Button>
      </View>
    </View>
  );
}
