import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { useState, useEffect } from "react"; // 引入 useState 和 useEffect
import "./index.scss"; // 引入样式文件，确保文件路径正确

// 定义 Tab 的状态类型
type Status = "all" | "published" | "draft" | "reviewing";
// 定义帖子的审核状态类型
type AuditStatus = "pending" | "approved" | "rejected" | "draft" | "taken_down";

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
  const [activeMenuPostId, setActiveMenuPostId] = useState<number | null>(null);

  // *** 新增状态：存储当前 session 中已被擦亮的帖子 id ***
  const [boostedPostIds, setBoostedPostIds] = useState<Set<number>>(new Set());

  // 使用 useEffect Hook 在 Tab 变化时过滤帖子列表
  useEffect(() => {
    const selectedStatus = tabList[current].status; // 获取当前选中 Tab 对应的状态值
    console.log("Selected status:", selectedStatus); // 打印选中的状态

    let filteredPosts: Post[] = [];

    if (selectedStatus === "all") {
      filteredPosts = mockPosts.filter(
        (post) => post.auditStatus !== "taken_down"
      ); // Exclude taken_down from 'all' for now, or handle as needed
    } else if (selectedStatus === "published") {
      filteredPosts = mockPosts.filter(
        (post) => post.auditStatus === "approved"
      );
    } else if (selectedStatus === "reviewing") {
      filteredPosts = mockPosts.filter(
        (post) =>
          post.auditStatus === "pending" || post.auditStatus === "rejected"
      );
    } else if (selectedStatus === "draft") {
      filteredPosts = mockPosts.filter((post) => post.auditStatus === "draft");
    }
    // TODO: Consider a tab for "taken_down" posts if needed

    setPosts(filteredPosts);
  }, [current, mockPosts]); // Add mockPosts to dependencies if it can be modified directly by takedown

  // Tab 点击处理函数
  const handleClick = (value: number) => {
    setCurrent(value); // 更新当前选中 Tab 的索引
    // 过滤逻辑已移至 useEffect 中
  };

  // *** 修改函数：处理擦亮按钮点击事件 ***
  const handleBoostClick = async (postId: number) => {
    // 模拟 API 调用到后端进行擦亮操作
    // 在实际应用中，这里会是 Taro.request({...})
    try {
      // 假设的 API 调用
      // const response = await Taro.request({
      //   url: `/api/posts/${postId}/boost`, // 示例 API 端点
      //   method: 'POST',
      //   // header: { 'Authorization': 'Bearer YOUR_USER_TOKEN' } // 如果需要认证
      // });

      // --- Mocking API response for now ---
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      // Simulate success. In a real scenario, check response.statusCode or response.data
      const apiSaysBoostAllowed = true; //  IMPORTANT: Replace with actual API response check
      // const apiSaysBoostAllowed = Math.random() > 0.5; // Simulate random success/fail for testing
      // if (response.statusCode === 200 || response.data.success) {
      //   apiSaysBoostAllowed = true;
      // } else if (response.statusCode === 429) { // Example: 429 for "already boosted today"
      //   apiSaysBoostAllowed = false;
      // }
      // --- End Mock ---

      if (apiSaysBoostAllowed) {
        console.log(
          `Post ${postId} boosted successfully (simulated API call).`
        );
        // 更新本地状态，将帖子 id 添加到 boostedPostIds Set 中
        setBoostedPostIds((prevBoostedIds) => {
          const newSet = new Set(prevBoostedIds); // 创建 Set 的新副本以确保状态更新
          newSet.add(postId);
          return newSet;
        });
        Taro.showToast({
          title: "擦亮成功",
          icon: "success",
          duration: 2000,
        });
      } else {
        // API 表示今天已经擦亮过
        Taro.showToast({
          title: "一天只能擦亮一次",
          icon: "none",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`Error boosting post ${postId}:`, error);
      Taro.showToast({
        title: "擦亮失败，请稍后再试", // Or "一天只能擦亮一次" if error specifically indicates that
        icon: "none",
        duration: 2000,
      });
    }
  };

  const handleEdit = (postId: number) => {
    console.log(`Edit post ${postId}`);
    Taro.showToast({ title: "编辑功能待实现", icon: "none" });
    setActiveMenuPostId(null);
  };

  const handleTakedown = (postId: number) => {
    setActiveMenuPostId(null); // Close menu first
    Taro.showModal({
      title: "确认操作",
      content: "确认下架该信息吗？",
      success: (res) => {
        if (res.confirm) {
          console.log(`Taking down post ${postId}`);
          // Simulate API call
          // Find the post in mockPosts and update its status
          const postIndex = mockPosts.findIndex((p) => p.id === postId);
          if (postIndex !== -1) {
            // Change status to 'rejected' or a new 'taken_down' status
            // For this example, let's change it to 'rejected' so it moves to '审核中' or disappears from '已发布'
            // Or, ideally, add a 'taken_down' status and handle its display.
            // For now, to ensure it's removed from "published", we can use 'rejected'
            // Or filter it out directly if we don't want it in "reviewing"
            mockPosts[postIndex].auditStatus = "taken_down"; // Using the new status

            // Trigger a re-filter by updating the posts state based on the new mockPosts
            // This can be done by forcing useEffect to re-run or by recalculating here.
            // For simplicity, let's manually re-filter based on the current tab.
            const selectedStatus = tabList[current].status;
            let refreshedPosts: Post[] = [];
            if (selectedStatus === "all") {
              refreshedPosts = mockPosts.filter(
                (post) => post.auditStatus !== "taken_down"
              );
            } else if (selectedStatus === "published") {
              refreshedPosts = mockPosts.filter(
                (p) => p.auditStatus === "approved"
              );
            } else if (selectedStatus === "reviewing") {
              refreshedPosts = mockPosts.filter(
                (p) =>
                  p.auditStatus === "pending" || p.auditStatus === "rejected"
              );
            } else if (selectedStatus === "draft") {
              refreshedPosts = mockPosts.filter(
                (p) => p.auditStatus === "draft"
              );
            }
            setPosts(refreshedPosts);

            Taro.showToast({ title: "下架成功", icon: "success" });
          } else {
            Taro.showToast({ title: "操作失败", icon: "error" });
          }
        }
      },
    });
  };

  // 辅助函数：将英文的审核状态转换为中文显示
  const displayAuditStatus = (status: AuditStatus) => {
    switch (status) {
      case "pending":
        return "审核中";
      case "approved":
        return "已发布"; // Tab 显示"已发布"，状态显示"已发布"保持一致
      case "rejected":
        return "未通过";
      case "taken_down":
        return "已下架";
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
            const isBoosted = boostedPostIds.has(post.id);

            return (
              <View key={post.id} className="post-card">
                <View className="post-main">
                  <Image
                    className="post-image"
                    src={post.image}
                    mode="aspectFill"
                  />
                  <View className="post-details">
                    <Text className="post-description">{post.description}</Text>
                    <View className="post-footer-row">
                      {/* New container for meta and actions */}
                      <View className="post-meta">
                        <Text className="post-time">{post.createTime}</Text>
                        <Text
                          className={`post-status status-${post.auditStatus}`}
                        >
                          {displayAuditStatus(post.auditStatus)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {/* 底部操作按钮，移出 post-details 外部 */}
                <View className="post-actions">
                  {/* Three-dot menu first */}
                  {(post.auditStatus === "approved" ||
                    post.auditStatus === "rejected" ||
                    post.auditStatus === "pending" ||
                    post.auditStatus === "draft") && (
                    <View className="post-options-menu-container">
                      <Text
                        className="three-dots-icon"
                        onClick={() =>
                          setActiveMenuPostId(
                            activeMenuPostId === post.id ? null : post.id
                          )
                        }
                      >
                        ···
                      </Text>
                      {activeMenuPostId === post.id && (
                        <View className="options-menu">
                          <Button
                            className="menu-button"
                            onClick={() => handleEdit(post.id)}
                          >
                            编辑
                          </Button>
                          {post.auditStatus === "approved" && (
                            <Button
                              className="menu-button takedown"
                              onClick={() => handleTakedown(post.id)}
                            >
                              下架
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  {/* Boost Button second */}
                  {post.auditStatus === "approved" && (
                    <View
                      className={`boost-button-container ${
                        isBoosted ? "is-boosted" : ""
                      }`}
                      onClick={() => {
                        if (isBoosted) {
                          Taro.showToast({
                            title: "一天只能擦亮一次",
                            icon: "none",
                            duration: 2000,
                          });
                        } else {
                          handleBoostClick(post.id);
                        }
                      }}
                    >
                      <Button className="boost-button" disabled={isBoosted}>
                        {isBoosted ? "已擦亮" : "擦亮"}
                      </Button>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          {/* 如果 posts 数组为空，可以显示一个提示 */}
          {posts.length === 0 && (
            <View className="no-posts-message">你还没有发布任何信息～</View>
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
