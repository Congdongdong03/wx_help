import Taro from "@tarojs/taro";
import React, { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import "./index.scss";

interface CategoryOption {
  id: "rent" | "used" | "jobs" | "help";
  name: string;
  icon: string; // Emoji or a class name for an icon font, or path to an image
}

const POST_CATEGORIES: CategoryOption[] = [
  { id: "help", name: "帮帮", icon: "🤝" },
  { id: "rent", name: "租房", icon: "🏠" },
  { id: "used", name: "二手", icon: "📦" },
  { id: "jobs", name: "招聘", icon: "💼" },
];

export default function PostCategorySelectionPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryOption["id"] | null
  >(null);

  const handleCategorySelect = (categoryId: CategoryOption["id"]) => {
    setSelectedCategory(categoryId);
  };

  const handleNextStep = () => {
    if (!selectedCategory) {
      Taro.showToast({
        title: "请选择一个分类类型",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    // Navigate to the form page for the selected category
    // Example: Taro.navigateTo({ url: `/pages/post-form/index?category=${selectedCategory}` });
    console.log("Navigating to form for category:", selectedCategory);
    Taro.showToast({
      title: `下一步: ${selectedCategory} 表单 (待实现)`,
      icon: "none",
    });
    // For now, let's navigate to a placeholder or the old publish page if it makes sense
    // Or, we can create a new unified form page: /pages/post/form?category=rent etc.
    // Based on your new doc: "进入对应表单页面"
    // Let's assume a new path like /pages/post/form/index for now
    Taro.navigateTo({
      url: `/pages/post/form/index?category=${selectedCategory}`,
    });
  };

  return (
    <View className="post-category-selection-page">
      <Text className="page-title">你想发布什么？</Text>

      <View className="category-options-container">
        {POST_CATEGORIES.map((category) => (
          <View
            key={category.id}
            className={`category-card ${
              selectedCategory === category.id ? "selected" : ""
            }`}
            onClick={() => handleCategorySelect(category.id)}
          >
            <Text className="category-icon">{category.icon}</Text>
            <Text className="category-name">{category.name}</Text>
          </View>
        ))}
      </View>

      <Button
        className="next-step-button"
        disabled={!selectedCategory}
        onClick={handleNextStep}
      >
        下一步
      </Button>
    </View>
  );
}
