import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { useState, useEffect, useCallback } from "react"; // 引入 useCallback
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

// Updated Post interface for editing capabilities
interface Post {
  id: number | string; // string for draftId, number for mock/API posts
  image: string; // For mock/API posts, this is a URL. For drafts, might be local path.
  description: string; // Main content/description
  createTime: string; // Publish time or draft creation time
  auditStatus: AuditStatus;
  category: string; // IMPORTANT: Category of the post (e.g., "help", "rent")
  title?: string; // Optional: Formal title, if different from description (for form mapping)
  wechatId?: string; // Optional: WeChat ID, if applicable (e.g., for "help")
  // Add other category-specific fields that might be needed for form repopulation
  // For example, for "rent" posts:
  roomType?: string;
  rentAmount?: string;
  address?: string;
  // ... etc.
  draftId?: string; // The storage key if it's a loaded draft
  includesBills?: boolean;
  itemCategory?: string;
  price?: string;
  condition?: string;
  position?: string;
  salaryRange?: string;
  timeRequirement?: string;
}

// Interface for DraftData stored in Taro.storage (from form page)
interface DraftPostData {
  formData: {
    title?: string;
    description?: string;
    wechatId?: string;
    [key: string]: any;
  };
  imageFiles: Taro.chooseImage.ImageFile[];
  category: string | null;
  timestamp: number;
}

// Updated Mock 数据数组 with category and potential form fields
const mockPosts: Post[] = [
  {
    id: 1,
    image: "https://picsum.photos/200/150?random=1",
    title: "周末爬山活动",
    description:
      "周末一起去爬山，寻找秋天的落叶和美景，活动强度适中，欢迎报名。",
    createTime: "2024-03-25 09:00",
    auditStatus: "approved",
    category: "help", // Example category
    wechatId: "user1_wx",
  },
  {
    id: 2,
    image: "https://picsum.photos/200/150?random=2",
    title: "急聘Java后端",
    description: "急需一位有经验的Java后端开发者，参与电商平台项目，薪资面议。",
    createTime: "2024-03-24 14:00",
    auditStatus: "pending",
    category: "jobs", // Example category
    wechatId: "hr_helper_wx", // Assuming jobs might also have a contact
  },
  {
    id: 3,
    image: "https://picsum.photos/200/150?random=3",
    title: "转MacBook Pro 14寸",
    description:
      "转让一台几乎全新的MacBook Pro 14寸，M1芯片，刚买半年，因工作需要换Windows。",
    createTime: "2024-03-23 19:30",
    auditStatus: "rejected",
    category: "used", // Example category
    wechatId: "seller123",
  },
  {
    id: 4,
    image: "https://picsum.photos/200/150?random=4",
    title: "约羽毛球初学者",
    description: "有没有附近的朋友一起约打羽毛球？初学者也可，重在参与！",
    createTime: "2024-03-22 11:00",
    auditStatus: "approved",
    category: "help",
    wechatId: "sportslover",
  },
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
  const [activeMenuPostId, setActiveMenuPostId] = useState<
    number | string | null
  >(null);

  // *** 新增状态：存储当前 session 中已被擦亮的帖子 id ***
  const [boostedPostIds, setBoostedPostIds] = useState<Set<number | string>>(
    new Set()
  );

  const fetchAndSetDrafts = useCallback(() => {
    console.log("MyPosts: fetchAndSetDrafts called");
    try {
      const { keys } = Taro.getStorageInfoSync();
      // Fetch all drafts, not just for 'help'
      const draftKeys = keys.filter((key) => key.startsWith("draft_"));

      let loadedDrafts = draftKeys
        .map((key) => {
          const draftData = Taro.getStorageSync(key) as DraftPostData | "";
          // Ensure draftData and category are valid before processing
          if (
            draftData &&
            typeof draftData === "object" &&
            draftData.category
          ) {
            return {
              id: key,
              draftId: key,
              image:
                draftData.imageFiles && draftData.imageFiles.length > 0
                  ? draftData.imageFiles[0].path
                  : "https://via.placeholder.com/200x150.png?text=No+Image",
              title:
                draftData.formData.title ||
                draftData.formData.description ||
                `草稿: ${draftData.category}`,
              description:
                draftData.formData.description ||
                draftData.formData.title ||
                "无描述内容",
              createTime: new Date(draftData.timestamp).toLocaleString(),
              auditStatus: "draft" as AuditStatus,
              category: draftData.category,
              wechatId: draftData.formData.wechatId,
            } as Post;
          }
          return null;
        })
        .filter(Boolean) as Post[];

      loadedDrafts.sort((a, b) => {
        // Assuming timestamp is part of draftId (e.g., draft_category_timestamp)
        const tsA = parseInt(a.draftId?.split("_").pop() || "0");
        const tsB = parseInt(b.draftId?.split("_").pop() || "0");
        return tsB - tsA;
      });

      console.log("MyPosts: Loaded all drafts:", loadedDrafts.length);
      setPosts(loadedDrafts);
    } catch (e) {
      console.error("MyPosts: Error loading drafts:", e);
      setPosts([]);
    }
  }, []);

  const loadCurrentTabData = useCallback(() => {
    console.log(
      "MyPosts: loadCurrentTabData for tab:",
      tabList[current].status
    );
    const selectedStatus = tabList[current].status;
    if (selectedStatus === "draft") {
      fetchAndSetDrafts();
    } else {
      // For non-draft tabs, filter from mockPosts
      // This part needs to be aware that mockPosts itself might need updating if an edit is saved.
      // For now, it just re-filters the static mockPosts.
      let filteredPosts: Post[] = [];
      if (selectedStatus === "all") {
        filteredPosts = mockPosts.filter(
          (post) => post.auditStatus !== "taken_down"
        );
      } else if (selectedStatus === "published") {
        filteredPosts = mockPosts.filter(
          (post) => post.auditStatus === "approved"
        );
      } else if (selectedStatus === "reviewing") {
        filteredPosts = mockPosts.filter(
          (post) =>
            post.auditStatus === "pending" || post.auditStatus === "rejected"
        );
      }
      setPosts(filteredPosts);
    }
  }, [current, fetchAndSetDrafts]);

  useEffect(() => {
    loadCurrentTabData();
  }, [current, loadCurrentTabData]);

  Taro.useDidShow(() => {
    console.log(
      "MyPosts: useDidShow triggered. Current tab:",
      tabList[current].status
    );
    const needsRefresh = Taro.getStorageSync("refreshMyPosts");
    if (needsRefresh === "true") {
      console.log(
        "MyPosts: Detected refreshMyPosts flag. Refreshing current tab data."
      );
      Taro.removeStorageSync("refreshMyPosts"); // Clear the flag immediately
      // Potentially, here you might want to re-fetch *all* data sources if an edit could affect any list.
      // For now, just reload current tab's data.
      loadCurrentTabData();
    } else {
      // If no explicit refresh flag, only refresh drafts if that's the current tab
      // (as other tabs are from static mock data for now)
      if (tabList[current].status === "draft") {
        fetchAndSetDrafts();
      }
    }

    const eventHandlerForPullRefresh = () => {
      console.log("MyPosts: Pull refresh event caught by eventCenter");
      loadCurrentTabData(); // Reload data for the current tab on pull refresh event
    };
    Taro.eventCenter.on("myPostsPullRefresh", eventHandlerForPullRefresh);
    return () => {
      Taro.eventCenter.off("myPostsPullRefresh", eventHandlerForPullRefresh);
    };
  });

  Taro.usePullDownRefresh(() => {
    console.log(
      "MyPosts: usePullDownRefresh hook triggered for tab:",
      tabList[current].status
    );
    loadCurrentTabData(); // Reload data for the current tab
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  // Tab 点击处理函数
  const handleClick = (value: number) => {
    setCurrent(value); // 更新当前选中 Tab 的索引
    setActiveMenuPostId(null); // Close any open menu when switching tabs
  };

  // *** 修改函数：处理擦亮按钮点击事件 ***
  const handleBoostClick = async (postId: number | string) => {
    // Boost logic likely doesn't apply to drafts, so ensure post.auditStatus === 'approved'
    const postToBoost = posts.find((p) => p.id === postId);
    if (!postToBoost || postToBoost.auditStatus !== "approved") {
      Taro.showToast({ title: "只有已发布的帖子才能擦亮", icon: "none" });
      return;
    }
    // ... (rest of the boost logic, ensure postId is handled if it's a number from mock)
    // For now, we assume only numeric IDs from mockPosts can be boosted.
    if (typeof postId !== "number") return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const apiSaysBoostAllowed = true;

      if (apiSaysBoostAllowed) {
        setBoostedPostIds((prevBoostedIds) => {
          const newSet = new Set(prevBoostedIds);
          newSet.add(postId);
          return newSet;
        });
        Taro.showToast({
          title: "擦亮成功",
          icon: "success",
          duration: 2000,
        });
      } else {
        Taro.showToast({
          title: "一天只能擦亮一次",
          icon: "none",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`Error boosting post ${postId}:`, error);
      Taro.showToast({
        title: "擦亮失败，请稍后再试",
        icon: "none",
        duration: 2000,
      });
    }
  };

  const handleEdit = (postToEdit: Post) => {
    setActiveMenuPostId(null);
    console.log("Editing post:", postToEdit);
    if (!postToEdit.category) {
      Taro.showToast({ title: "帖子分类未知，无法编辑", icon: "none" });
      return;
    }

    if (postToEdit.auditStatus === "draft" && postToEdit.draftId) {
      Taro.navigateTo({
        url: `/pages/post/form/index?category=${postToEdit.category}&draftId=${postToEdit.draftId}`,
      });
    } else {
      // For non-draft posts (approved, pending, rejected from mockPosts or API)
      try {
        Taro.setStorageSync("editingPostData", postToEdit); // Store the full post object
        Taro.navigateTo({
          url: `/pages/post/form/index?editingPostId=${postToEdit.id}&category=${postToEdit.category}`,
        });
      } catch (e) {
        Taro.showToast({ title: "编辑准备失败，请稍后重试", icon: "error" });
        console.error("Error preparing post for editing:", e);
      }
    }
  };

  const handleDeleteDraft = (draftIdToDelete: string) => {
    setActiveMenuPostId(null);
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除此草稿吗？操作不可撤销。",
      success: (res) => {
        if (res.confirm) {
          try {
            Taro.removeStorageSync(draftIdToDelete);
            Taro.showToast({ title: "草稿已删除", icon: "success" });
            // Refresh draft list
            fetchAndSetDrafts();
          } catch (e) {
            Taro.showToast({ title: "删除失败", icon: "error" });
            console.error("Failed to delete draft:", e);
          }
        }
      },
    });
  };

  const handleTakedown = (postId: number | string) => {
    // Takedown logic likely only applies to 'approved' posts from mock/API.
    // Ensure this logic is robust if posts array can contain drafts.
    const postToTakedown = mockPosts.find(
      (p) => p.id === postId && typeof p.id === "number"
    ); // Find in mockPosts
    if (!postToTakedown || postToTakedown.auditStatus !== "approved") {
      Taro.showToast({ title: "操作无效", icon: "none" });
      return;
    }

    setActiveMenuPostId(null);
    Taro.showModal({
      title: "确认操作",
      content: "确认下架该信息吗？",
      success: (res) => {
        if (res.confirm) {
          // This part needs to correctly update the source of truth (mockPosts)
          // and then trigger a re-render/re-filter.
          const postIndex = mockPosts.findIndex((p) => p.id === postId);
          if (postIndex !== -1) {
            mockPosts[postIndex].auditStatus = "taken_down";

            // Force a re-filter by making current effect re-run or manually setting posts
            // Easiest might be to re-trigger the effect logic:
            const selectedStatus = tabList[current].status;
            let refreshedPosts: Post[] = [];
            if (selectedStatus === "all") {
              refreshedPosts = mockPosts.filter(
                (p) => p.auditStatus !== "taken_down"
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
            }
            // Drafts are handled by fetchAndSetDrafts, so no change here for them
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
      case "draft":
        return "草稿"; // Added display for draft
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
            const isBoosted =
              post.auditStatus === "approved" &&
              typeof post.id === "number" &&
              boostedPostIds.has(post.id);
            // Ensure post.id is string for draftId key in activeMenuPostId
            const currentPostId = post.draftId || post.id;

            return (
              <View key={currentPostId} className="post-card">
                <View
                  className="post-main"
                  onClick={() => {
                    // If it's a draft, clicking the main card area can also trigger edit
                    if (post.auditStatus === "draft" || post.category) {
                      handleEdit(post);
                    }
                    // For other types, no action on card click, only on menu/buttons
                  }}
                >
                  <Image
                    className="post-image"
                    src={post.image}
                    mode="aspectFill"
                  />
                  <View className="post-details">
                    <Text className="post-description">
                      {post.title || post.description}
                    </Text>
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
                  {post.auditStatus !== "taken_down" && (
                    <View className="post-options-menu-container">
                      <Text
                        className="three-dots-icon"
                        onClick={() =>
                          setActiveMenuPostId(
                            activeMenuPostId === currentPostId
                              ? null
                              : currentPostId
                          )
                        }
                      >
                        ···
                      </Text>
                      {activeMenuPostId === currentPostId && (
                        <View className="options-menu">
                          <Button
                            className="menu-button"
                            onClick={() => handleEdit(post)}
                          >
                            {post.auditStatus === "draft" ? "编辑草稿" : "编辑"}
                          </Button>
                          {post.auditStatus === "approved" &&
                            typeof post.id === "number" && (
                              <Button
                                className="menu-button takedown"
                                onClick={() =>
                                  handleTakedown(post.id as number)
                                }
                              >
                                下架
                              </Button>
                            )}
                          {post.auditStatus === "draft" && post.draftId && (
                            <Button
                              className="menu-button takedown"
                              onClick={() => handleDeleteDraft(post.draftId!)}
                            >
                              删除草稿
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  {post.auditStatus === "approved" &&
                    typeof post.id === "number" && (
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
                            handleBoostClick(post.id as number);
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
            <View className="no-posts-message">
              {tabList[current].status === "draft"
                ? "你还没有任何草稿～"
                : "你还没有发布任何信息～"}
            </View>
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
  enablePullDownRefresh: true, // Enable pull down to refresh drafts
  // onPullDownRefresh function is removed from here
});
