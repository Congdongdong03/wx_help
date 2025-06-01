import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { useState } from "react";
// 导入 Taro UI 的默认样式
import "./my-posts.scss"; // 如果有自定义样式，仍然保留导入

type Status = "all" | "published" | "draft" | "reviewing";

interface TabItem {
  title: string;
  status: Status; // 添加 status 字段以便后续数据请求使用
}

export default function MyPosts() {
  const [current, setCurrent] = useState(0); // current 状态用于控制当前选中的 tab 索引

  // 定义标签页列表，包含标题和对应的状态
  const tabList: TabItem[] = [
    { title: "全部", status: "all" },
    { title: "已发布", status: "published" },
    { title: "草稿", status: "draft" },
    { title: "审核中", status: "reviewing" },
  ];

  // 处理标签页切换
  const handleClick = (value: number) => {
    setCurrent(value);
    const selectedStatus = tabList[value].status;
    console.log("Selected status:", selectedStatus);
    // TODO: 根据 selectedStatus 重新请求对应状态的数据
    // 这里你需要调用相应的 action 或函数来获取数据
  };

  // TODO: 在组件加载时获取默认状态 (全部) 的数据
  // useEffect(() => {
  //   // fetch data for "all" status
  // }, []);

  return (
    <View className="my-posts">
      {/* 使用 AtTabs 组件 */}
      <AtTabs current={current} tabList={tabList} onClick={handleClick}>
        {/* 为每个标签页创建 AtTabsPane */}
        {tabList.map((tab, index) => (
          <AtTabsPane current={current} index={index} key={tab.status}>
            <View className="post-list">
              {/* TODO: 这里将根据当前选中的 tab (tab.status) 来渲染对应的帖子列表 */}
              <View>{`这里显示${tab.title}的内容`}</View> {/* 占位符内容 */}
            </View>
          </AtTabsPane>
        ))}
      </AtTabs>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的发布",
});
