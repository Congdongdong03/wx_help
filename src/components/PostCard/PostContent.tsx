import { View, Text } from "@tarojs/components";

interface PostContentProps {
  title: string;
  description?: string;
  category: {
    name: string;
    color: string;
  };
  price?: string | number;
  displayTimeText: string;
}

const PostContent = ({
  title,
  description,
  category,
  price,
  displayTimeText,
}) => {
  return (
    <View className="pcc-content" role="article">
      <Text
        className="pcc-title"
        numberOfLines={2}
        role="heading"
        aria-level={2}
      >
        {title}
      </Text>
      {description && (
        <Text className="pcc-description" numberOfLines={2} role="contentinfo">
          {description.substring(0, 50)}...
        </Text>
      )}
      <View className="pcc-footer">
        <View className="pcc-tags" role="list">
          <Text
            className="pcc-category-tag"
            style={{ backgroundColor: category.color }}
            role="listitem"
          >
            {category.name}
          </Text>
          {price && (
            <Text className="pcc-price-tag" role="listitem">
              {price}
            </Text>
          )}
        </View>
        <Text
          className="pcc-time"
          role="contentinfo"
          aria-label={`Posted ${displayTimeText}`}
        >
          {displayTimeText}
        </Text>
      </View>
    </View>
  );
};

export default PostContent;
