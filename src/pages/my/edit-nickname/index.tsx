import Taro, { useRouter } from "@tarojs/taro";
import { View, Input, Button, Text } from "@tarojs/components";
import { debounce, throttle } from "../../../utils/debounce";
import { useUser } from "../../../store/user/hooks";
import "./index.scss";
import { useState, useEffect } from "react";

export default function EditNicknamePage() {
  const router = useRouter();
  const { currentUser, updateUser } = useUser();
  const [currentNickname, setCurrentNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    // 优先使用路由参数，如果没有则使用当前用户信息
    const initialNickname =
      decodeURIComponent(router.params.nickname || "") ||
      currentUser?.nickName ||
      "";
    setCurrentNickname(initialNickname);
    setOriginalNickname(initialNickname);
    console.log("Initial nickname:", initialNickname);
  }, [router.params.nickname, currentUser?.nickName]);

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

  // 使用防抖处理输入变化
  const handleInputChange = debounce((e) => {
    setCurrentNickname(e.detail.value);
  }, 300);

  // 使用节流处理保存操作
  const handleSave = throttle(() => {
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
        // 使用新的用户状态管理更新昵称
        updateUser({ nickName: currentNickname.trim() });
        console.log("Updated nickname in Redux store:", currentNickname.trim());

        Taro.showToast({ title: "昵称更新成功", icon: "success" });
        Taro.navigateBack();
      } catch (e) {
        console.error("Failed to update nickname:", e);
        Taro.showToast({ title: "保存失败，请稍后再试", icon: "none" });
      }
    }, 1000);
  }, 1000);

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
