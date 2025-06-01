import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { useState, useEffect } from "react"; // 引入 useState 和 useEffect
import "./index.scss"; // 引入样式文件，确保文件路径正确

// 定义 Tab 的状态类型
type Status = "all" | "published" | "draft" | "reviewing";
// 定义帖子的审核状态类型
type AuditStatus = "pending" | "approved" | "rejected";

// 定义 TabItem 接口
interface TabItem {
  title: string;
  status: Status;
}

// 定义帖子数据结构接口
interface Post {
  id: number;
  image: string; // 图片 URL
  description: string; // 帖子描述/内容
  createTime: string; // 发布时间
  auditStatus: AuditStatus; // 审核状态
  // TODO: 在实际应用中，这里可能需要添加一个字段来表示是否已被当前用户擦亮 (跨天/跨设备)
}

// Mock 数据数组
const mockPosts: Post[] = [
  {
    id: 1,
    image: "https://picsum.photos/200/150?random=1", // 示例图片 URL
    description:
      "周末一起去爬山，寻找秋天的落叶和美景，活动强度适中，欢迎报名。",
    createTime: "2024-03-25 09:00",
    auditStatus: "approved", // 审核通过
  },
  {
    id: 2,
    image: "https://picsum.photos/200/150?random=2",
    description: "急需一位有经验的Java后端开发者，参与电商平台项目，薪资面议。",
    createTime: "2024-03-24 14:00",
    auditStatus: "pending", // 审核中
  },
  {
    id: 3,
    image: "https://picsum.photos/200/150?random=3",
    description:
      "转让一台几乎全新的MacBook Pro 14寸，M1芯片，刚买半年，因工作需要换Windows。",
    createTime: "2024-03-23 19:30",
    auditStatus: "rejected", // 未通过
  },
  {
    id: 4,
    image: "https://picsum.photos/200/150?random=4",
    description: "有没有附近的朋友一起约打羽毛球？初学者也可，重在参与！",
    createTime: "2024-03-22 11:00",
    auditStatus: "approved", // 审核通过
  },
  // 你可以在这里添加更多不同状态的 mock 数据，例如 'draft' 状态
];

// 将 tabList 移到组件外部，确保引用稳定
const tabList: TabItem[] = [
  { title: "全部", status: "all" },
  { title: "已发布", status: "published" }, // 这个 Tab 对应 auditStatus 'approved'
  { title: "草稿", status: "draft" }, // TODO: 如果 mock 数据有 draft 状态，需要实现过滤逻辑
  { title: "审核中", status: "reviewing" }, // 这个 Tab 对应 auditStatus 'pending' 或 'rejected'
];

// MyPosts 页面组件
export default function MyPosts() {
  // 获取路由信息，用于返回功能
  const router = useRouter();
  // 当前选中 Tab 的索引状态，默认为第一个 Tab (全部)
  const [current, setCurrent] = useState(0);
  // 用于存储当前需要显示的帖子列表的状态，初始为空数组
  const [posts, setPosts] = useState<Post[]>([]);

  // *** 新增状态：存储当前 session 中已被擦亮的帖子 id ***
  const [boostedPostIds, setBoostedPostIds] = useState<Set<number>>(new Set());

  // 使用 useEffect Hook 在 Tab 变化时过滤帖子列表
  useEffect(() => {
    const selectedStatus = tabList[current].status; // 获取当前选中 Tab 对应的状态值
    console.log("Selected status:", selectedStatus); // 打印选中的状态

    let filteredPosts: Post[] = [];

    if (selectedStatus === "all") {
      // 如果选中“全部”Tab，显示所有 mock 数据
      filteredPosts = mockPosts;
    } else if (selectedStatus === "published") {
      // 如果选中“已发布”Tab，过滤出 auditStatus 为 'approved' 的帖子
      filteredPosts = mockPosts.filter(
        (post) => post.auditStatus === "approved"
      );
    } else if (selectedStatus === "reviewing") {
      // 如果选中“审核中”Tab，显示 auditStatus 为 'pending' 或 'rejected' 的帖子
      filteredPosts = mockPosts.filter(
        (post) =>
          post.auditStatus === "pending" || post.auditStatus === "rejected"
      );
    } else if (selectedStatus === "draft") {
      // 如果选中“草稿”Tab，过滤出 auditStatus 为 'draft' 的帖子
      filteredPosts = mockPosts.filter((post) => post.auditStatus === "draft");
    }
    // TODO: 如果有其他 Tab 状态，在这里添加对应的过滤逻辑

    setPosts(filteredPosts); // 在所有过滤逻辑处理完后，统一更新 posts 状态
  }, [current, tabList]); // 依赖项：当 current 或 tabList 变化时重新运行这个 Effect

  // Tab 点击处理函数
  const handleClick = (value: number) => {
    setCurrent(value); // 更新当前选中 Tab 的索引
    // 过滤逻辑已移至 useEffect 中
  };

  // *** 新增函数：处理擦亮按钮点击事件 ***
  const handleBoostClick = (postId: number) => {
    console.log(`Boosting post ${postId}`);
    // 在实际应用中，这里会调用 API 通知后端进行擦亮操作

    // 更新本地状态，将帖子 id 添加到 boostedPostIds Set 中
    setBoostedPostIds((prevBoostedIds) => {
      const newSet = new Set(prevBoostedIds); // 创建 Set 的新副本以确保状态更新
      newSet.add(postId);
      return newSet;
    });

    // TODO: 根据后端返回的结果处理成功或失败提示
  };

  // 辅助函数：将英文的审核状态转换为中文显示
  const displayAuditStatus = (status: AuditStatus) => {
    switch (status) {
      case "pending":
        return "审核中";
      case "approved":
        return "已发布"; // Tab 显示“已发布”，状态显示“已发布”保持一致
      case "rejected":
        return "未通过";
      default:
        return "未知状态";
    }
  };

  // 组件渲染结构
  return (
    <View className="my-posts">
      {/* Tabs 切换标签栏 */}
      <View className="tabs">
        {/* 遍历 Tab 列表，渲染每个 Tab */}
        {tabList.map((tab, index) => (
          <View
            key={tab.status} // 使用状态作为 key
            // 根据是否当前选中应用不同的类名
            className={`tab-item ${current === index ? "active" : ""}`}
            onClick={() => handleClick(index)} // 点击时调用 handleClick 更新选中状态
          >
            <Text>{tab.title}</Text> {/* Tab 标题文本 */}
          </View>
        ))}
      </View>
      {/* Posts List with Cards 帖子列表内容区域 */}
      {/* 外层 View 用于给列表内容提供顶部边距 */}
      <View className="tab-content">
        {/* 帖子列表容器 */}
        <View className="post-list">
          {/* 遍历当前需要显示的 posts 数组，渲染每个帖子卡片 */}
          {posts.map((post) => {
            // *** 检查当前帖子是否已被擦亮 ***
            const isBoosted = boostedPostIds.has(post.id);

            return (
              <View key={post.id} className="post-card">
                {" "}
                {/* 帖子卡片容器 */}
                {/* 帖子图片 */}
                <Image
                  className="post-image"
                  src={post.image}
                  mode="aspectFill" // 图片填充模式
                />
                {/* 帖子详情区域（图片右侧的内容） */}
                <View className="post-details">
                  {/* 帖子描述/内容 */}
                  <Text className="post-description">{post.description}</Text>
                  {/* 包裹时间/状态和按钮的容器 */}
                  <View className="post-footer-row">
                    {" "}
                    {/* 这个类名对应 CSS 修改 */}
                    {/* 发布时间 和 审核状态区域 */}
                    <View className="post-meta">
                      <Text className="post-time">{post.createTime}</Text>{" "}
                      {/* 发布时间 */}
                      {/* 根据审核状态应用不同的样式类名 */}
                      <Text
                        className={`post-status status-${post.auditStatus}`}
                      >
                        {/* 调用辅助函数显示中文审核状态 */}
                        {displayAuditStatus(post.auditStatus)}
                      </Text>
                    </View>
                    <View className="post-actions">
                      {/* 条件渲染包含按钮的 View：只有审核状态为 'approved' 时显示 */}
                      {post.auditStatus === "approved" && (
                        // 新增一个可点击的 View 来包裹按钮
                        <View
                          className={`boost-button-container ${
                            isBoosted ? "is-boosted" : ""
                          }`} // 添加类名，根据是否已擦亮动态添加 is-boosted 类
                          onClick={() => {
                            // 在点击时判断是否已被擦亮
                            if (isBoosted) {
                              console.log("一天只能擦亮一次"); // 如果已擦亮，打印提示
                              // TODO: 在实际应用中，你可能希望在这里显示一个 UI 提示 (Toast/Modal)
                            } else {
                              handleBoostClick(post.id); // 如果未擦亮，执行擦亮操作
                            }
                          }}
                        >
                          {/* 将 Button 放在 View 内部，Button 本身不再处理点击和禁用状态 */}
                          <Button
                            className="boost-button"
                            disabled={isBoosted} // Button 仍然可以根据 isBoosted 状态设置 disabled 属性，用于样式控制或防止原生点击效果
                          >
                            {isBoosted ? "已擦亮" : "擦亮"}{" "}
                            {/* 根据状态改变按钮文本 */}
                          </Button>
                        </View>
                      )}
                    </View>
                  </View>{" "}
                  {/* post-footer-row 结束 */}
                </View>{" "}
                {/* post-details 结束 */}
              </View>
            );
          })}
          {/* 如果 posts 数组为空，可以显示一个提示 */}
          {posts.length === 0 && (
            <View className="no-posts-message">暂无内容</View>
          )}
        </View>{" "}
        {/* post-list 结束 */}
      </View>{" "}
      {/* tab-content 结束 */}
    </View> // my-posts 结束
  );
}

// 页面配置，通常用于设置原生导航栏等
definePageConfig({
  navigationBarTitleText: "我的发布", // 页面标题，可能被自定义 header 覆盖
  // 注意：如果使用了自定义 header，原生导航栏通常会被隐藏或不需要显示标题
});
