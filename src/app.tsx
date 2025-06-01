import Taro, { useLaunch, useDidShow, useDidHide } from "@tarojs/taro";
import { PropsWithChildren, useState, useEffect } from "react";
// It's good practice to manage global state via a proper state management library (Recoil, Zustand, Redux)
// for larger apps. For this example, we'll use a simple observable pattern or direct prop drilling
// if the LoginModal is rendered conditionally at the root of page components.
// For a true global modal controlled by App.tsx, event bus or context might be needed.

// Let's define a simple event bus for showing/hiding the modal from App.tsx
export const loginModalEventBus = new Taro.Events();

export interface UserInfo {
  avatarUrl: string;
  nickName: string;
  openid: string;
  token: string;
  // other fields from Taro.getUserProfile or your backend
  gender?: number;
  country?: string;
  province?: string;
  city?: string;
}

// Mock API for login simulation
const mockLoginAPI = (
  profileInfo: Taro.getUserProfile.SuccessCallbackResult["userInfo"]
): Promise<UserInfo> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        // 10% chance of failure
        reject({ errMsg: "Network error or random API failure" });
        return;
      }
      const mockUser: UserInfo = {
        ...(profileInfo as any), // Cast to any to spread, then ensure types
        avatarUrl: profileInfo.avatarUrl,
        nickName: profileInfo.nickName,
        openid: `mock_openid_${Date.now()}`,
        token: `mock_token_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
      };
      console.log("Mock API: Login successful, returning user:", mockUser);
      resolve(mockUser);
    }, 1000);
  });
};

export function getLoggedInUser(): UserInfo | null {
  try {
    const userInfo = Taro.getStorageSync("userInfo") as UserInfo | null;
    if (userInfo && userInfo.token && userInfo.openid) {
      // TODO: Add token expiry check if implementing that
      // For now, if it exists, it's considered valid.
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

function App({ children }: PropsWithChildren) {
  // This state is local to App, to trigger modal via event bus
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<"initial" | "overlay">(
    "initial"
  );

  const checkLoginAndShowModal = () => {
    const user = getLoggedInUser();
    if (!user) {
      console.log(
        "App: No logged-in user found. Emitting event to show login modal."
      );
      loginModalEventBus.trigger("showLogin", { type: "initial" });
    } else {
      console.log("App: User already logged in.", user);
      loginModalEventBus.trigger("hideLogin"); // Ensure it's hidden if somehow stuck
    }
  };

  useLaunch(() => {
    console.log("App launched");
    checkLoginAndShowModal();
  });

  // useDidShow is also important if the app returns from background
  // and login state might have changed (e.g. token expired on server side,
  // or user logged out on another device - though that's more complex)
  useDidShow(() => {
    console.log("App did show");
    // For mandatory login, if they somehow bypass the initial modal (not typical)
    // or if login becomes invalid while app is in background, re-check.
    checkLoginAndShowModal();
  });

  useEffect(() => {
    const handleAuthSuccess = (userInfo: UserInfo) => {
      console.log(
        "App: AuthSuccess event received from modal. User:",
        userInfo
      );
      // No need to store here, modal should have stored it.
      // Toast is also handled by modal as per spec.
      // Main action is to ensure modal is hidden if App was controlling its direct visibility.
      // If modal hides itself, this is more of a notification.
    };

    const handleAuthReject = () => {
      console.log("App: AuthReject event received from modal.");
      // Modal should transition to 'overlay' type itself.
    };

    loginModalEventBus.on("authSuccess", handleAuthSuccess);
    loginModalEventBus.on("authReject", handleAuthReject); // If modal needs to signal explicit rejection to app

    return () => {
      loginModalEventBus.off("authSuccess", handleAuthSuccess);
      loginModalEventBus.off("authReject", handleAuthReject);
    };
  }, []);

  // children are the pages of the app.
  // The LoginModal will be rendered by individual pages or a layout component listening to the event bus.
  return children;
}

export default App;

// For testing purposes, you might add a global function to trigger logout:
// (Taro as any).logout = clearLoginState;
// (Taro as any).checkLogin = () => console.log(getLoggedInUser());
