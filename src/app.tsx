import Taro, { useLaunch, useDidShow, useDidHide } from "@tarojs/taro";
import { PropsWithChildren, useState, useEffect } from "react";
import { Provider } from "react-redux";
import store from "./store";
import LoginModal from "./components/LoginModal";
import { useUser } from "./store/user/hooks";

// 定义事件总线用于显示/隐藏登录弹窗
export const loginModalEventBus = new Taro.Events();

// 为了向后兼容，保留原有的UserInfo接口
export interface UserInfo {
  id: string | number;
  avatarUrl: string;
  nickName: string;
  openid: string;
  token: string;
  // other fields from Taro.getUserProfile or your backend
  gender?: number;
  country?: string;
  province?: string;
  city?: string;
  status?: string;
}

// 注意：现在使用真实的API调用，不再使用mock数据

// 为了向后兼容，保留原有的函数
export function getLoggedInUser(): UserInfo | null {
  try {
    const userInfo = Taro.getStorageSync("userInfo") as UserInfo | null;
    if (userInfo && userInfo.openid) {
      console.log("getLoggedInUser: Found valid user in storage:", userInfo);
      return userInfo;
    }
    console.log("getLoggedInUser: No valid user in storage.");
  } catch (e) {
    console.error("getLoggedInUser: Error reading login state from storage", e);
  }
  return null;
}

export function storeLoggedInUser(userInfo: UserInfo) {
  try {
    Taro.setStorageSync("userInfo", userInfo);
    console.log("storeLoggedInUser: User stored successfully.");
  } catch (e) {
    console.error("storeLoggedInUser: Error storing user info", e);
  }
}

export function clearLoginState() {
  try {
    Taro.removeStorageSync("userInfo");
    console.log("clearLoginState: User login state cleared.");
  } catch (e) {
    console.error("clearLoginState: Error clearing login state", e);
  }
}

// 检查登录状态并显示登录弹窗
export function checkLoginAndShowModal() {
  const user = getLoggedInUser();
  if (!user) {
    console.log(
      "App: No logged-in user found. Emitting event to show login modal."
    );
    loginModalEventBus.trigger("show", { type: "initial" });
  } else {
    console.log("App: User already logged in.", user);
    loginModalEventBus.trigger("hide"); // Ensure it's hidden if somehow stuck
  }
}

// 内部App组件，使用Redux状态管理
function AppContent({ children }: PropsWithChildren) {
  const { isLoggedIn, initializeUserState } = useUser();

  useLaunch(() => {
    console.log("App launched");

    try {
      // 初始化用户状态（从本地存储）
      initializeUserState();

      // 检查本地缓存中的 openid
      const cachedOpenid = Taro.getStorageSync("openid");
      console.log("App: Cached openid:", cachedOpenid);

      // 延迟检查登录状态，避免在应用启动时立即触发
      setTimeout(() => {
        if (!isLoggedIn) {
          console.log(
            "App: No logged-in user found. Emitting event to show login modal."
          );
          loginModalEventBus.trigger("show", { type: "initial" });
        } else {
          console.log("App: User already logged in.");
          loginModalEventBus.trigger("hide");
        }
      }, 100);
    } catch (error) {
      console.error("App launch error:", error);
    }
  });

  useDidShow(() => {
    console.log("App did show");
    // 延迟重新检查登录状态，避免在应用显示时立即触发
    setTimeout(() => {
      if (!isLoggedIn) {
        checkLoginAndShowModal();
      }
    }, 100);
  });

  useEffect(() => {
    const handleAuthSuccess = (userInfo: UserInfo) => {
      console.log(
        "App: AuthSuccess event received from modal. User:",
        userInfo
      );
    };

    const handleAuthReject = () => {
      console.log("App: AuthReject event received from modal.");
    };

    loginModalEventBus.on("authSuccess", handleAuthSuccess);
    loginModalEventBus.on("authReject", handleAuthReject);

    return () => {
      loginModalEventBus.off("authSuccess", handleAuthSuccess);
      loginModalEventBus.off("authReject", handleAuthReject);
    };
  }, []);

  return (
    <>
      {children}
      <LoginModal />
    </>
  );
}

// 主App组件，提供Redux Provider
function App({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AppContent>{children}</AppContent>
    </Provider>
  );
}

export default App;

// For testing purposes, you might add a global function to trigger logout:
(Taro as any).logout = clearLoginState;
(Taro as any).checkLogin = () => console.log(getLoggedInUser());
(Taro as any).clearLoginAndShowModal = () => {
  clearLoginState();
  checkLoginAndShowModal();
};
