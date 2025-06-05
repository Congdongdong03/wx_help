import { View } from "@tarojs/components";
import "./index.scss";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "#007AFF",
  text,
}) => {
  return (
    <View
      className={`loading-spinner ${size}`}
      role="status"
      aria-label={text || "加载中"}
    >
      <View className="spinner" style={{ borderColor: color }} />
      {text && <View className="spinner-text">{text}</View>}
    </View>
  );
};

export default LoadingSpinner;
