import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../store/user/hooks";
import { request } from "../../utils/request";
import { API_CONFIG } from "../../config/api";
import "./index.scss";

interface LoginModalProps {}

interface WechatUserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  country: string;
  province: string;
  city: string;
  language: string;
}

export default function LoginModal(props: LoginModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  useEffect(() => {
    // 监听登录弹窗事件
    const handleShow = () => setIsVisible(true);
    const handleHide = () => setIsVisible(false);

    // 这里可以添加事件监听器
    // loginModalEventBus.on("show", handleShow);
    // loginModalEventBus.on("hide", handleHide);

    return () => {
      // loginModalEventBus.off("show", handleShow);
      // loginModalEventBus.off("hide", handleHide);
    };
  }, []);

  const handleAuthorize = async () => {
    setIsLoading(true);

    try {
      // 获取用户信息
      const userProfileRes = await Taro.getUserProfile({
        desc: "用于完善会员资料与登录",
      });

      if (!userProfileRes.userInfo) {
        throw new Error("获取用户信息失败");
      }

      const userInfo = userProfileRes.userInfo as WechatUserInfo;

      // 获取openid
      const loginRes = await Taro.login();
      if (!loginRes.code) {
        throw new Error("获取登录凭证失败");
      }

      const code =
        process.env.NODE_ENV === "development"
          ? "dev_test_code"
          : loginRes.code;

      // 调用登录接口
      const loginResData = await request(
        API_CONFIG.getApiUrl("/auth/wechat-login"),
        {
          method: "POST",
          data: { code, userInfo },
        }
      );

      const loggedInUser = {
        ...loginResData.data,
        token: loginResData.data.token || "mock_token_" + Date.now(),
      };

      // 保存openid到本地存储
      Taro.setStorageSync("openid", loggedInUser.openid);

      // 登录用户
      login(loggedInUser);

      Taro.showToast({
        title: `欢迎回来，${loggedInUser.nickName}`,
        icon: "success",
        duration: 2000,
      });

      Taro.eventCenter.trigger("userInfoUpdated");
      Taro.switchTab({ url: "/pages/my/index" });
      setIsVisible(false);
    } catch (err: any) {
      console.error("登录失败:", err);

      let errMsg = "授权失败，请稍后重试";
      if (err.errMsg?.includes("getUserProfile:fail auth deny")) {
        errMsg = "您已拒绝授权";
      } else if (err.errMsg?.includes("Network error")) {
        errMsg = "网络连接失败，请检查网络后重试";
      }

      Taro.showToast({
        title: errMsg,
        icon: "none",
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

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
          onClick={() => setIsVisible(false)}
          disabled={isLoading}
        >
          暂不登录
        </Button>
      </View>
    </View>
  );
}
