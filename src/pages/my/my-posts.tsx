import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { useState } from "react";

type Status = "all" | "published" | "draft" | "reviewing";

interface TabItem {
  title: string;
  status: Status;
}

export default function MyPosts() {
  const [current, setCurrent] = useState(0);

  const tabList: TabItem[] = [
    { title: "全部", status: "all" },
    { title: "已发布", status: "published" },
    { title: "草稿", status: "draft" },
    { title: "审核中", status: "reviewing" },
  ];

  const handleClick = (value: number) => {
    setCurrent(value);
    const selectedStatus = tabList[value].status;
    console.log("Selected status:", selectedStatus);
  };

  return (
    <View className="my-posts">
      <View className="tabs">
        {tabList.map((tab, index) => (
          <View
            key={tab.status}
            className={`tab-item ${current === index ? "active" : ""}`}
            onClick={() => handleClick(index)}
          >
            <Text>{tab.title}</Text>
          </View>
        ))}
      </View>
      <View className="tab-content">
        <View className="post-list">
          <View>{`这里显示${tabList[current].title}的内容`}</View>
        </View>
      </View>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的发布",
});
