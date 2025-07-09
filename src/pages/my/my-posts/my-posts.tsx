import Taro, {
  useRouter,
  useState,
  useEffect,
  useCallback,
} from "@tarojs/taro";
import { View, Text, Image, Button, ScrollView } from "@tarojs/components";
import { request } from "@/utils/request";
import "./index.scss";
import { BASE_URL } from "../../../utils/env";

// --- API Integration START ---
const BASE_API_URL = `${BASE_URL}/api`; // 确保这是您后端API的正确地址

// 和后端 /api/posts/my 返回一致的 Post 结构
interface ApiPost {
  id: number; // API 返回的 ID 是数字
  title: string;
  content?: string; // 后端是 content 字段
  category: string;
  status: "draft" | "pending" | "published" | "failed"; // API 的状态类型
  images?: string; // API 返回的是图片URL JSON字符串或null
  created_at?: string;
  updated_at?: string;
  // 您可以根据需要添加其他从API返回的字段
}

interface ApiStats {
  draftCount: number;
  pendingCount: number;
  publishedCount: number;
  failedCount: number;
  totalCount: number;
}

interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  limit: number;
}

interface FetchPostsApiResponse {
  posts: ApiPost[];
  pagination: ApiPagination;
  stats: ApiStats;
}
// --- API Integration END ---

// 定义 Tab 的状态类型 (保持现有，但我们会映射到API状态)
type UITabStatus = "all" | "published" | "draft" | "reviewing" | "failed"; // Added 'failed' for potential future use

// 定义帖子的前端展示状态类型 (可以逐步替换 auditStatus)
type UIDisplayStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "taken_down"
  | "published"
  | "failed";

// 定义 TabItem 接口
interface TabItem {
  title: string;
  status: UITabStatus; // 使用新的 UITabStatus
}

// Post 接口，尝试融合现有字段和API字段
// 这个接口将主要用于UI展示，数据会从ApiPost转换而来
interface UIPost {
  id: number | string; // string for local draftId, number for API posts
  image: string; // UI展示的图片URL
  description: string; // UI展示的描述
  title?: string; // UI展示的标题
  createTime: string; // UI展示的创建时间
  uiDisplayStatus: UIDisplayStatus; // UI展示的状态 (替代 auditStatus)
  category: string;

  // 保留一些特定字段用于编辑/特定逻辑
  originalApiPost?: ApiPost; // 存储原始API对象，方便后续操作
  draftId?: string; // 本地草稿的ID
  // ... 其他您在UI层面需要的字段，比如 roomType, rentAmount 等，可以从 originalApiPost.content 或特定字段解析
}

interface DraftPostData {
  formData: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
  imageFiles: Taro.chooseImage.ImageFile[];
  category: string | null;
  timestamp: number;
}

// mockPosts 将被API数据替代，暂时注释或后续删除
// const mockPosts: UIPost[] = [ ... ];

const tabList: TabItem[] = [
  { title: "全部", status: "all" },
  { title: "已发布", status: "published" },
  { title: "审核中", status: "reviewing" },
  { title: "未通过", status: "failed" }, // 新增 "未通过" 标签页
  { title: "草稿", status: "draft" },
];

// MyPosts 页面组件
export default function MyPosts() {
  const router = useRouter();
  const [currentTabIndex, setCurrentTabIndex] = useState(0); // Renamed from 'current' for clarity

  // --- API Related State START ---
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]); // 存储从API获取的原始帖子
  const [displayedPosts, setDisplayedPosts] = useState<UIPost[]>([]); // 存储转换后用于UI展示的帖子
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    limit: 10, // 每页数量，可以设为可配置
  });
  const [stats, setStats] = useState<ApiStats | null>(null);
  // --- API Related State END ---

  const [activeMenuPostId, setActiveMenuPostId] = useState<
    number | string | null
  >(null);
  const [boostedPostIds, setBoostedPostIds] = useState<Set<number | string>>(
    new Set()
  );

  const getCurrentApiStatusFilter = useCallback(() => {
    const selectedTab = tabList[currentTabIndex]; // tabList is in closure, currentTabIndex is state
    let apiStatusFilter = "";
    switch (selectedTab.status) {
      case "published":
        apiStatusFilter = "published";
        break;
      case "reviewing":
        apiStatusFilter = "pending";
        break;
      case "failed":
        apiStatusFilter = "failed";
        break;
      case "all":
      default:
        apiStatusFilter = "";
        break;
    }
    return apiStatusFilter;
  }, [currentTabIndex]); // Dependency on currentTabIndex

  // 将 API Post 转换为 UIPost
  const mapApiPostToUIPost = useCallback((apiPost: ApiPost): UIPost => {
    let imageUrl = "https://via.placeholder.com/200x150.png?text=No+Image";
    if (
      typeof apiPost.images === "string" &&
      apiPost.images.trim().startsWith("[")
    ) {
      try {
        const imagesArray = JSON.parse(apiPost.images);
        if (Array.isArray(imagesArray) && imagesArray.length > 0) {
          imageUrl = imagesArray[0]; // 取第一张图作为封面
        }
      } catch (e) {
        console.error("Error parsing images JSON:", e);
      }
    }

    let uiStatus: UIDisplayStatus = "pending"; // Default
    switch (apiPost.status) {
      case "published":
        uiStatus = "published";
        break;
      case "pending":
        uiStatus = "pending";
        break;
      case "failed":
        uiStatus = "rejected";
        break; // API 'failed' -> UI 'rejected' (未通过)
      case "draft":
        uiStatus = "draft";
        break;
    }

    return {
      id: apiPost.id,
      image: imageUrl,
      title: apiPost.title,
      description: apiPost.content || apiPost.title, // 如果没有content，用title
      createTime: apiPost.created_at
        ? new Date(apiPost.created_at).toLocaleString()
        : "未知时间",
      uiDisplayStatus: uiStatus,
      category: apiPost.category,
      originalApiPost: apiPost, // 保存原始数据
    };
  }, []); // Empty dependency array as it doesn't depend on component state/props

  // 将本地草稿转换为 UIPost
  const mapLocalDraftToUIPost = useCallback(
    (draftData: DraftPostData, draftKey: string): UIPost | null => {
      if (draftData && typeof draftData === "object" && draftData.category) {
        return {
          id: draftKey, // 使用 draftKey 作为唯一ID
          draftId: draftKey,
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
          uiDisplayStatus: "draft",
          category: draftData.category,
        };
      }
      return null;
    },
    [] // Empty dependency array
  );

  const fetchAndSetLocalDrafts = useCallback(() => {
    console.log("MyPosts: fetchAndSetLocalDrafts called");
    setIsLoading(true); // 也为加载本地草稿设置loading
    setError(null);
    try {
      const { keys } = Taro.getStorageInfoSync();
      const draftKeys = keys.filter((key) => key.startsWith("draft_"));
      let loadedDrafts = draftKeys
        .map((key) => {
          const storedValue = Taro.getStorageSync(key);
          // Ensure storedValue is a valid object structure before casting to DraftPostData
          // and before calling mapLocalDraftToUIPost
          if (
            storedValue &&
            typeof storedValue === "object" &&
            typeof storedValue.category === "string" &&
            typeof storedValue.timestamp === "number" &&
            typeof storedValue.formData === "object" &&
            Array.isArray(storedValue.imageFiles)
          ) {
            return mapLocalDraftToUIPost(storedValue as DraftPostData, key);
          }
          return null; // Will be filtered out by .filter(Boolean)
        })
        .filter(Boolean) as UIPost[];

      loadedDrafts.sort((a, b) => {
        const tsA = parseInt(a.draftId?.split("_").pop() || "0");
        const tsB = parseInt(b.draftId?.split("_").pop() || "0");
        return tsB - tsA;
      });

      console.log("MyPosts: Loaded all local drafts:", loadedDrafts.length);
      setDisplayedPosts(loadedDrafts);
      setApiPosts([]); // 清空API帖子
      setStats(null); // 本地草稿不从API获取统计
      setPagination((prev) => ({
        ...prev,
        totalPages: 1,
        currentPage: 1,
        totalPosts: loadedDrafts.length,
      }));
    } catch (e) {
      console.error("MyPosts: Error loading local drafts:", e);
      setError("加载草稿失败");
      setDisplayedPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapLocalDraftToUIPost]); // Added mapLocalDraftToUIPost

  // 获取 API 帖子的函数
  const fetchApiPosts = useCallback(
    async (page = 1, statusFilter = "", isLoadMore = false) => {
      console.log(
        `MyPosts: fetchApiPosts called for page: ${page}, status: ${statusFilter}, isLoadMore: ${isLoadMore}`
      );
      setIsLoading(true);
      setError(null);
      try {
        let url = `${BASE_API_URL}/posts/my?page=${page}&limit=${pagination.limit}`;
        if (statusFilter) {
          url += `&status=${statusFilter}`;
        }

        // Define a more generic type for the raw API response that includes code and message
        interface RawApiResponse {
          code?: number;
          message?: string;
          error?: string; // Some APIs might use error instead of message for errors
          data?: FetchPostsApiResponse; // The expected data structure for success
        }

        const response = await request<RawApiResponse>(url, {
          method: "GET",
        });

        if (response && response.code === 0 && response.data) {
          const apiData = response.data;
          const postsFromApi = apiData.posts;
          const safePosts = Array.isArray(postsFromApi) ? postsFromApi : [];

          console.log("MyPosts: Posts from API after safety check:", safePosts);
          setApiPosts((prev) =>
            isLoadMore ? [...prev, ...safePosts] : safePosts
          );
          const uiPosts = safePosts.map(mapApiPostToUIPost);
          console.log("MyPosts: Posts mapped to UI Posts:", uiPosts);
          setDisplayedPosts((prev) =>
            isLoadMore ? [...prev, ...uiPosts] : uiPosts
          );

          if (apiData.pagination) {
            setPagination(apiData.pagination);
          } else {
            console.warn(
              "MyPosts: Pagination data missing from API response. Setting default."
            );
            setPagination({
              currentPage: page,
              totalPages: page,
              totalPosts: safePosts.length,
              limit: pagination.limit,
            });
          }

          if (apiData.stats) {
            setStats(apiData.stats);
          } else {
            console.warn(
              "MyPosts: Stats data missing from API response. Setting default based on posts."
            );
            setStats({
              draftCount: 0,
              pendingCount: 0,
              publishedCount: 0,
              failedCount: 0,
              totalCount: safePosts.length,
            });
          }
        } else {
          let errorMessage = `请求失败`;
          if (response.data && (response.data.message || response.data.error)) {
            errorMessage =
              response.data.message || response.data.error || errorMessage;
          } else if (response.statusCode) {
            errorMessage += `，状态码: ${response.statusCode}`;
          }
          console.error(
            "MyPosts: API business logic error or non-200 response:",
            errorMessage,
            response
          );
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        let detailedErrorMessage = "获取帖子列表失败";
        if (err.message) {
          detailedErrorMessage = err.message;
        } else if (
          err.response &&
          err.response.data &&
          (err.response.data.message || err.response.data.error)
        ) {
          detailedErrorMessage =
            err.response.data.message || err.response.data.error;
        }
        console.error(
          "MyPosts: Error fetching API posts (catch block):",
          detailedErrorMessage,
          err
        );
        setError(detailedErrorMessage);
        if (!isLoadMore) {
          setApiPosts([]);
          setDisplayedPosts([]);
          setStats(null);
          setPagination((prev) => ({
            ...prev,
            currentPage: 1,
            totalPages: 1,
            totalPosts: 0,
          }));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, mapApiPostToUIPost]
  );

  // 根据当前选中的Tab加载数据
  const loadCurrentTabData = useCallback(() => {
    const selectedTab = tabList[currentTabIndex];
    console.log(
      "MyPosts: loadCurrentTabData for tab:",
      selectedTab.title,
      selectedTab.status
    );

    setActiveMenuPostId(null); // 切换tab时关闭菜单

    if (selectedTab.status === "draft") {
      fetchAndSetLocalDrafts();
    } else {
      let apiStatusFilter = "";
      switch (selectedTab.status) {
        case "published":
          apiStatusFilter = "published";
          break;
        case "reviewing":
          apiStatusFilter = "pending";
          break;
        case "failed":
          apiStatusFilter = "failed";
          break;
        case "all": // "all" falls through to no filter
        default:
          apiStatusFilter = "";
          break;
      }
      fetchApiPosts(1, apiStatusFilter); // 默认加载第一页
    }
  }, [
    currentTabIndex,
    fetchApiPosts,
    fetchAndSetLocalDrafts,
    mapLocalDraftToUIPost,
  ]); // Added mapLocalDraftToUIPost

  useEffect(() => {
    loadCurrentTabData();
  }, [currentTabIndex, loadCurrentTabData]); // currentTabIndex 变化时重新加载数据

  Taro.useDidShow(() => {
    console.log(
      "MyPosts: useDidShow triggered. Current tab index:",
      currentTabIndex
    );
    const needsRefresh = Taro.getStorageSync("refreshMyPosts");
    if (needsRefresh === "true") {
      console.log(
        "MyPosts: Detected refreshMyPosts flag. Refreshing current tab data."
      );
      Taro.removeStorageSync("refreshMyPosts");
      loadCurrentTabData(); // 重新加载当前tab数据
    } else {
      // 如果不是强制刷新，并且当前是草稿页，也刷新一下草稿列表，因为草稿可能在表单页被修改
      if (tabList[currentTabIndex].status === "draft") {
        fetchAndSetLocalDrafts();
      }
    }
    // ... (保留您原有的 eventCenter 逻辑，如果还需要)
  });

  Taro.usePullDownRefresh(() => {
    console.log(
      "MyPosts: usePullDownRefresh hook triggered for tab index:",
      currentTabIndex
    );
    const selectedTab = tabList[currentTabIndex];
    if (selectedTab.status === "draft") {
      fetchAndSetLocalDrafts();
    } else {
      const apiStatusFilter = getCurrentApiStatusFilter();
      fetchApiPosts(1, apiStatusFilter, false); // 重置到第一页
    }
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  // 添加触底加载更多功能
  Taro.useReachBottom(() => {
    console.log("MyPosts: Reached bottom, loading more...");
    const selectedTab = tabList[currentTabIndex];
    if (
      selectedTab.status !== "draft" &&
      !isLoading &&
      pagination.currentPage < pagination.totalPages
    ) {
      const apiStatusFilter = getCurrentApiStatusFilter();
      fetchApiPosts(pagination.currentPage + 1, apiStatusFilter, true);
    }
  });

  // Tab 点击处理函数
  const handleTabClick = (index: number) => {
    setCurrentTabIndex(index);
    const apiStatusFilter =
      tabList[index].status === "draft" ? "draft" : getCurrentApiStatusFilter();
    fetchApiPosts(1, apiStatusFilter, false);
  };

  // *** 修改函数：处理擦亮按钮点击事件 (占位符) ***
  const handleBoostClick = async (postId: number | string) => {
    const postToBoost = displayedPosts.find((p) => p.id === postId);
    if (
      !postToBoost ||
      typeof postToBoost.id !== "number" ||
      postToBoost.uiDisplayStatus !== "published"
    ) {
      Taro.showToast({ title: "只有已发布的帖子才能擦亮", icon: "none" });
      return;
    }

    const numericPostId = postToBoost.id as number;

    setIsLoading(true);
    try {
      const response = await request(
        `${BASE_API_URL}/posts/${numericPostId}/polish`,
        {
          method: "POST",
          data: {
            title: "擦亮帖子",
            description: "帖子已擦亮",
          },
        }
      );

      if (response && response.code === 0) {
        Taro.showToast({ title: "擦亮成功", icon: "success" });
        setBoostedPostIds((prev) => new Set(prev).add(numericPostId));
        const currentFilter = getCurrentApiStatusFilter();
        fetchApiPosts(pagination.currentPage, currentFilter);
      } else {
        const errorMessage = response?.message || "擦亮失败";
        throw new Error(`擦亮失败: ${errorMessage}`);
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "擦亮失败", icon: "error" });
      console.error("Error boosting post:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (postToEdit: UIPost) => {
    setActiveMenuPostId(null);
    console.log("Editing post:", postToEdit);
    if (!postToEdit.category) {
      Taro.showToast({ title: "帖子分类未知，无法编辑", icon: "none" });
      return;
    }

    if (postToEdit.draftId) {
      // 是本地草稿
      Taro.navigateTo({
        url: `/pages/post/form/index?category=${postToEdit.category}&draftId=${postToEdit.draftId}`,
      });
    } else if (
      typeof postToEdit.id === "number" &&
      postToEdit.originalApiPost
    ) {
      // 是API帖子
      // 对于API帖子，导航到表单页，并传递ID和分类，表单页应能根据ID获取完整帖子信息
      Taro.setStorageSync("editingPostData", postToEdit.originalApiPost); // 可以先存一份用于快速回填
      Taro.navigateTo({
        url: `/pages/post/form/index?editingPostId=${postToEdit.id}&category=${postToEdit.category}`,
      });
      // TODO: 后续表单页应实现根据 editingPostId 从API获取最新数据
    } else {
      Taro.showToast({ title: "无法确定帖子类型进行编辑", icon: "none" });
    }
  };

  const handleDeleteDraft = (draftIdToDelete: string) => {
    // 这个函数保持不变，处理本地草稿删除
    setActiveMenuPostId(null);
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除此草稿吗？操作不可撤销。",
      success: (res) => {
        if (res.confirm) {
          try {
            Taro.removeStorageSync(draftIdToDelete);
            Taro.showToast({ title: "草稿已删除", icon: "success" });
            fetchAndSetLocalDrafts(); // 重新加载草稿列表
          } catch (e) {
            Taro.showToast({ title: "删除失败", icon: "error" });
          }
        }
      },
    });
  };

  const handleDeleteApiPost = (postId: number) => {
    setActiveMenuPostId(null);
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除此帖子吗？此操作不可撤销。",
      success: async (res) => {
        if (res.confirm) {
          setIsLoading(true);
          try {
            const response = await request(`${BASE_API_URL}/posts/${postId}`, {
              method: "DELETE",
            });

            if (response && response.code === 0) {
              Taro.showToast({ title: "删除成功", icon: "success" });
              const currentFilter = getCurrentApiStatusFilter();
              fetchApiPosts(1, currentFilter); // Refresh list, go to page 1
            } else {
              const errorMessage = response?.message || "删除失败";
              throw new Error(`删除失败: ${errorMessage}`);
            }
          } catch (e: any) {
            Taro.showToast({ title: e.message || "删除失败", icon: "error" });
            console.error("Error deleting API post:", e);
          } finally {
            setIsLoading(false);
          }
        }
      },
    });
  };

  const handleRepublish = async (postId: number) => {
    setActiveMenuPostId(null);

    Taro.showModal({
      title: "确认重新发布",
      content: "确定要重新发布此帖子吗？",
      success: async (res) => {
        if (res.confirm) {
          setIsLoading(true);
          try {
            const response = await request(`${BASE_API_URL}/posts/${postId}`, {
              method: "PUT",
              data: {
                status: "publish",
              },
            });

            if (response && response.code === 0) {
              Taro.showToast({ title: "重新发布成功", icon: "success" });
              const currentFilter = getCurrentApiStatusFilter();
              fetchApiPosts(pagination.currentPage, currentFilter); // Refresh current page
            } else {
              const errorMessage = response?.message || "重新发布失败";
              throw new Error(`重新发布失败: ${errorMessage}`);
            }
          } catch (e: any) {
            Taro.showToast({
              title: e.message || "重新发布失败",
              icon: "error",
            });
            console.error("Error republishing post:", e);
          } finally {
            setIsLoading(false);
          }
        }
      },
    });
  };

  // 辅助函数：将 UI 展示状态转换为中文显示
  const displayUiStatus = (status: UIDisplayStatus) => {
    switch (status) {
      case "pending":
        return "审核中";
      case "published": // Fallthrough
      case "approved":
        return "已发布";
      case "rejected": // Fallthrough
      case "failed":
        return "未通过";
      case "taken_down":
        return "已下架";
      case "draft":
        return "草稿";
      default:
        return "未知";
    }
  };

  // 组件渲染结构
  return (
    <View className="my-posts">
      <View className="tabs">
        {tabList.map((tab, index) => (
          <View
            key={tab.status}
            className={`tab-item ${currentTabIndex === index ? "active" : ""}`}
            onClick={() => handleTabClick(index)}
          >
            <Text>{tab.title}</Text>
          </View>
        ))}
      </View>

      <View className="tab-content">
        {isLoading && <View className="loading-message">加载中...</View>}
        {error && <View className="error-message">错误: {error}</View>}

        {!isLoading && !error && displayedPosts.length === 0 && (
          <View className="no-posts-message">
            {tabList[currentTabIndex].status === "draft"
              ? "你还没有任何本地草稿～"
              : "没有找到相关帖子～"}
          </View>
        )}

        {!isLoading && !error && displayedPosts.length > 0 && (
          <ScrollView
            scrollY
            className="post-list"
            onScrollToLower={() => {
              if (
                tabList[currentTabIndex].status !== "draft" &&
                !isLoading &&
                pagination.currentPage < pagination.totalPages
              ) {
                const apiStatusFilter = getCurrentApiStatusFilter();
                fetchApiPosts(
                  pagination.currentPage + 1,
                  apiStatusFilter,
                  true
                );
              }
            }}
          >
            {(tabList[currentTabIndex].status === "reviewing"
              ? displayedPosts.filter((post) => post.title !== "草稿")
              : displayedPosts
            ).map((post) => {
              const isApiPost = typeof post.id === "number";
              const isBoostable =
                isApiPost && post.uiDisplayStatus === "published"; // API帖子且已发布
              const isBoosted = isBoostable && boostedPostIds.has(post.id);
              const currentPostIdForMenu = post.draftId || post.id;

              return (
                <View key={currentPostIdForMenu} className="post-card">
                  <View
                    className="post-main"
                    onClick={() => {
                      if (post.category) {
                        handleEdit(post);
                      }
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
                        <View className="post-meta">
                          <Text className="post-time">{post.createTime}</Text>
                          <Text
                            className={`post-status status-${post.uiDisplayStatus}`}
                          >
                            {post.uiDisplayStatus === "pending" &&
                            post.title === "草稿"
                              ? "草稿"
                              : displayUiStatus(post.uiDisplayStatus)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="post-actions">
                    {/* 右上角三点菜单 */}
                    <View className="post-options-menu-container">
                      <Text
                        className="three-dots-icon"
                        onClick={() =>
                          setActiveMenuPostId(
                            activeMenuPostId === currentPostIdForMenu
                              ? null
                              : currentPostIdForMenu
                          )
                        }
                      >
                        ···
                      </Text>
                      {activeMenuPostId === currentPostIdForMenu && (
                        <View className="options-menu">
                          <Button
                            className="menu-button"
                            onClick={() => handleEdit(post)}
                          >
                            {post.draftId ? "编辑草稿" : "编辑"}
                          </Button>

                          {/* Universal Delete Button for all API Posts */}
                          {isApiPost && (
                            <Button
                              className="menu-button takedown"
                              onClick={() =>
                                handleDeleteApiPost(post.id as number)
                              }
                            >
                              删除
                            </Button>
                          )}

                          {post.draftId && ( // 本地草稿的删除
                            <Button
                              className="menu-button takedown"
                              onClick={() => handleDeleteDraft(post.draftId!)}
                            >
                              删除草稿
                            </Button>
                          )}

                          {/* 重新发布按钮 (针对API草稿或可重新提交的帖子) */}
                          {isApiPost &&
                            (post.uiDisplayStatus === "draft" || // API Draft
                              post.uiDisplayStatus === "rejected") && (
                              <Button
                                className="menu-button"
                                onClick={() =>
                                  handleRepublish(post.id as number)
                                }
                              >
                                重新发布
                              </Button>
                            )}
                        </View>
                      )}
                    </View>

                    {/* 擦亮按钮 */}
                    {isBoostable && (
                      <View
                        className={`boost-button-container ${
                          isBoosted ? "is-boosted" : ""
                        }`}
                        onClick={() => {
                          if (!isBoosted && typeof post.id === "number") {
                            handleBoostClick(post.id);
                          } else if (isBoosted) {
                            Taro.showToast({
                              title: "一天只能擦亮一次",
                              icon: "none",
                            });
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
            {isLoading && (
              <View className="loading-more">
                <Text>加载更多...</Text>
              </View>
            )}
            {!isLoading && pagination.currentPage >= pagination.totalPages && (
              <View className="no-more">
                <Text>没有更多内容了</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

definePageConfig({
  navigationBarTitleText: "我的发布",
  enablePullDownRefresh: true,
});

// 注意：
// 1. CSS 类名如 .stats-container, .loading-message, .error-message, .post-list-scroll, .pagination-controls 等
//    需要在对应的 .scss 文件中定义样式。
// 2. "下架" 功能暂时映射为删除API帖子的操作，后续可以根据您的API设计调整。
// 3. "擦亮"、"删除API帖子"、"重新发布" 的真实API调用逻辑已用 TODO 标记，并提供了注释掉的示例代码框架。
// 4. 确保您的后端API `/api/posts/my` 支持 `page`, `limit`, `status` 参数，并返回与 FetchPostsApiResponse 结构一致的数据。
// 5. 认证（Authorization header）部分也用 TODO 标记。
