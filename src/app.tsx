import Taro, { useLaunch, useDidShow, useDidHide } from "@tarojs/taro";
import { PropsWithChildren, useState, useEffect } from "react";
import { Provider } from "react-redux";
import store from "./store";
import LoginModal from "./components/LoginModal";
import { useUser } from "./store/user/hooks";

// 定义事件总线用于显示/隐藏登录弹窗
export const loginModalEventBus = new Taro.Events();

// 使用统一的UserInfo类型
export { UserInfo } from "./store/user/types";

// 用户登录状态管理

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
    // 用户登录状态已清理
  } catch (e) {
    // 静默处理清理错误
  }
}

// 检查登录状态并显示登录弹窗
export function checkLoginAndShowModal() {
  const user = getLoggedInUser();
  if (!user) {
    loginModalEventBus.trigger("show", { type: "initial" });
  } else {
    loginModalEventBus.trigger("hide");
  }
}

// 内部App组件，使用Redux状态管理
function AppContent({ children }: PropsWithChildren) {
  const { isLoggedIn, initializeUserState } = useUser();

  useLaunch(() => {
    try {
      // 初始化用户状态（从本地存储）
      initializeUserState();

      // 延迟检查登录状态，避免在应用启动时立即触发
      setTimeout(() => {
        if (!isLoggedIn) {
          loginModalEventBus.trigger("show", { type: "initial" });
        } else {
          loginModalEventBus.trigger("hide");
        }
      }, 100);
    } catch (error) {
      // 静默处理启动错误
    }
  });

  useDidShow(() => {
    // 延迟重新检查登录状态，避免在应用显示时立即触发
    setTimeout(() => {
      if (!isLoggedIn) {
        checkLoginAndShowModal();
      }
    }, 100);
  });

  useEffect(() => {
    const handleAuthSuccess = (userInfo: UserInfo) => {
      // 处理登录成功事件
    };

    const handleAuthReject = () => {
      // 处理登录拒绝事件
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

// 开发环境下的调试函数
if (process.env.NODE_ENV === "development") {
  (Taro as any).logout = clearLoginState;
  (Taro as any).checkLogin = () => getLoggedInUser();
  (Taro as any).clearLoginAndShowModal = () => {
    clearLoginState();
    checkLoginAndShowModal();
  };
}
