import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Input, Button, Text } from "@tarojs/components";
import "./index.scss";

const USER_INFO_STORAGE_KEY = "my_app_user_info"; // Should be consistent with my/index.tsx

export default function EditNicknamePage() {
  const router = useRouter();
  const [currentNickname, setCurrentNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const initialNickname = decodeURIComponent(router.params.nickname || "");
    setCurrentNickname(initialNickname);
    setOriginalNickname(initialNickname);
    console.log("Initial nickname from params:", initialNickname);
  }, [router.params.nickname]);

  useEffect(() => {
    if (currentNickname.trim() === "" || currentNickname === originalNickname) {
      setIsSaveDisabled(true);
    } else if (currentNickname.length > 10) {
      setIsSaveDisabled(true);
    } else {
      setIsSaveDisabled(false);
    }

    if (currentNickname.length > 10) {
      setErrorText("昵称不能超过10个字符");
    } else if (currentNickname.trim() === "") {
      setErrorText("昵称不能为空");
    } else {
      setErrorText("");
    }
  }, [currentNickname, originalNickname]);

  const handleInputChange = (e) => {
    setCurrentNickname(e.detail.value);
  };

  const handleSave = () => {
    if (isSaveDisabled || errorText) {
      // Double check with errorText as well
      Taro.showToast({ title: errorText || "昵称无效", icon: "none" });
      return;
    }

    // TODO: Add sensitive word check here (local or backend)
    console.log("Attempting to save nickname:", currentNickname);

    // Simulate API call
    Taro.showLoading({ title: "保存中..." });
    setTimeout(() => {
      Taro.hideLoading();
      // Assume success for now
      try {
        const storedUserInfo = Taro.getStorageSync(USER_INFO_STORAGE_KEY) || {};
        const newUserInfo = {
          ...storedUserInfo,
          nickname: currentNickname.trim(),
        };
        Taro.setStorageSync(USER_INFO_STORAGE_KEY, newUserInfo);
        console.log("Saved new user info to storage:", newUserInfo);

        Taro.showToast({ title: "昵称更新成功", icon: "success" });
        Taro.navigateBack();
      } catch (e) {
        console.error("Failed to save nickname to storage:", e);
        Taro.showToast({ title: "保存失败，请稍后再试", icon: "none" });
      }
    }, 1000);
  };

  return (
    <View className="edit-nickname-page">
      <View className="input-container">
        <Input
          className="nickname-input"
          type="text"
          placeholder="请输入新的昵称"
          value={currentNickname}
          onInput={handleInputChange}
          maxlength={10}
          focus
        />
        {currentNickname.length > 0 && (
          <View
            className="clear-input-btn"
            onClick={() => setCurrentNickname("")}
          >
            ✕
          </View>
        )}
      </View>
      {errorText && <Text className="error-text">{errorText}</Text>}
      <Text className="char-limit-info">
        还能输入 {10 - currentNickname.length} 字
      </Text>

      <Button
        className="save-button"
        disabled={isSaveDisabled}
        onClick={handleSave}
      >
        保存
      </Button>
    </View>
  );
}
