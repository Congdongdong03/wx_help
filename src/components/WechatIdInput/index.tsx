import React from "react";
import { View, Text, Input } from "@tarojs/components";

interface WechatIdInputProps {
  value: string | undefined;
  onInput: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const WechatIdInput: React.FC<WechatIdInputProps> = ({
  value,
  onInput,
  placeholder = "填写你的微信号",
  label = "微信号",
  required = true, // Defaulting to true as it seems to be always required
}) => {
  return (
    <View className="form-item">
      {" "}
      {/* Uses existing global/page styles */}
      <Text className="form-label">
        {label}
        {required && <Text className="required-indicator">*</Text>}{" "}
        {/* Uses existing global/page styles */}
      </Text>
      <Input
        className="form-input" // Uses existing global/page styles
        type="text"
        placeholder={placeholder}
        value={value || ""} // Ensure value is not undefined for Input
        onInput={(e) => onInput(e.detail.value)}
      />
    </View>
  );
};

export default WechatIdInput;
