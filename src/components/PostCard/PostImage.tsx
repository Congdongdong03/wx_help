import { View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";

interface PostImageProps {
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  coverImage?: string;
  alt?: string;
}

const PostImage = ({
  mockImagePlaceholderHeight,
  mockImagePlaceholderColor,
  coverImage,
  alt = "Post cover image",
}) => {
  const [imageError, setImageError] = useState(false);

  if (mockImagePlaceholderHeight && mockImagePlaceholderColor) {
    return (
      <View
        className="pcc-image-placeholder"
        style={{
          height: `${mockImagePlaceholderHeight}rpx`,
          backgroundColor: mockImagePlaceholderColor,
        }}
        role="img"
        aria-label="Placeholder image"
      />
    );
  }

  if (coverImage && !imageError) {
    return (
      <Image
        className="pcc-image"
        src={coverImage}
        mode="aspectFill"
        lazyLoad
        onError={() => setImageError(true)}
        alt={alt}
      />
    );
  }

  return null;
};

export default PostImage;
