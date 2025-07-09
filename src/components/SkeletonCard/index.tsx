import { View } from "@tarojs/components";
import "./index.scss";

interface SkeletonCardProps {
  mockImageHeight: number;
}

const SkeletonCard = ({ mockImageHeight }: SkeletonCardProps) => {
  return (
    <View className="post-card skeleton-card">
      <View
        className="skeleton-image"
        style={{ height: `${mockImageHeight}rpx` }}
      />
      <View className="post-card-content">
        <View className="skeleton-line title" />
        <View className="skeleton-line short" />
        <View className="skeleton-line long" />
        <View className="post-card-footer skeleton-footer">
          <View className="skeleton-line tag" />
          <View className="skeleton-line time" />
        </View>
      </View>
    </View>
  );
};

export default SkeletonCard;
