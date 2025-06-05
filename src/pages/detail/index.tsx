import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Swiper,
  SwiperItem,
  Image,
  Button,
  ScrollView,
} from "@tarojs/components";
import "./index.scss";
import { API_CONFIG } from "../../config/api";

// Define PostDetail interface based on requirements
interface PostDetail {
  id: string;
  images: string[]; // URLs for swiper
  title: string;
  category: string; // e.g., "租房", "二手"
  publishTime: string; // e.g., "2024-05-30 10:00" or relative time
  price?: string; // e.g., "$280/week" or "$150"
  description: string;
  wechatId?: string;
  status: "normal" | "taken_down" | "rejected"; // normal, taken_down, rejected etc.
  isPinned?: boolean; // 是否为置顶帖子
  // Potentially other fields like publisher_avatar, user_id etc.
}

// Mock data for a single post detail
const MOCK_POST_DETAIL_NORMAL: PostDetail = {
  id: "123",
  images: [
    "https://picsum.photos/seed/detail1/750/400",
    "https://picsum.photos/seed/detail2/750/400",
    "https://picsum.photos/seed/detail3/750/400",
    "https://picsum.photos/seed/detail4/750/400",
  ],
  title: "这是一个非常棒的帖子标题，可能会有点长，需要测试换行效果哦！",
  category: "租房",
  publishTime: "2024-05-28 14:00",
  price: "$280/week",
  description:
    '这里是帖子的详细描述内容。\n第一段描述。\n第二段描述，可能会非常非常长，包含了许多的细节和信息，用户可能需要滚动或者点击展开才能看到全部内容。我们先假设它可以直接显示，后续再添加"展开更多"的功能。\n - 特点一\n - 特点二\n - 特点三\n这是另一行重要的信息。联系我时请注明来自帮帮。',
  wechatId: "mimicode123",
  status: "normal",
};

const MOCK_POST_DETAIL_TAKEN_DOWN: PostDetail = {
  id: "456",
  images: [],
  title: "已下架的帖子",
  category: "二手",
  publishTime: "2024-05-01 12:00",
  description: "此信息已处理。",
  wechatId: "hidden_wechat",
  status: "taken_down",
};

export default function PostDetailPage() {
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catalogueImages, setCatalogueImages] = useState<string[]>([]);

  useEffect(() => {
    const postId = router.params.id;
    setLoading(true);
    setError(false);

    Taro.request({
      url: API_CONFIG.getApiUrl(`/posts/${postId}`),
      method: "GET",
    })
      .then((res) => {
        if (res.data && res.data.code === 0) {
          const apiPost = res.data.data;
          setPost({
            id: String(apiPost.id),
            images: apiPost.images
              ? JSON.parse(apiPost.images).map((img: string) =>
                  API_CONFIG.getImageUrl(img)
                )
              : [],
            title: apiPost.title,
            category: apiPost.category,
            publishTime: apiPost.created_at || "",
            price: apiPost.price,
            description: apiPost.content,
            wechatId: apiPost.wechat_id,
            status: apiPost.status === "published" ? "normal" : apiPost.status,
            isPinned: apiPost.recommendations?.is_pinned === true,
          });
          if (apiPost.recommendations?.is_pinned === true) {
            Taro.request({
              url: API_CONFIG.getApiUrl(
                `/admin/catalogue-images?postId=${apiPost.id}`
              ),
              method: "GET",
            })
              .then((imgRes) => {
                if (
                  imgRes.data &&
                  imgRes.data.code === 0 &&
                  Array.isArray(imgRes.data.data)
                ) {
                  setCatalogueImages(
                    imgRes.data.data.map((img: string) =>
                      API_CONFIG.getImageUrl(img)
                    )
                  );
                } else {
                  setCatalogueImages([]);
                }
              })
              .catch(() => setCatalogueImages([]));
          } else {
            setCatalogueImages([]);
          }
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [router.params.id]);

  const handleImageClick = (index: number) => {
    if (post && post.images.length > 0) {
      Taro.previewImage({
        current: post.images[index],
        urls: post.images,
      });
    }
  };

  const handleCopyWechatId = () => {
    if (post && post.wechatId) {
      Taro.showModal({
        title: "提示",
        content: `是否复制微信号联系对方？请备注\'帮帮 + ${post.category}\'，提高添加成功率。`,
        success: (res) => {
          if (res.confirm) {
            Taro.setClipboardData({
              data: post.wechatId!,
              success: () => {
                Taro.showToast({
                  title: "复制成功！请到微信添加好友",
                  icon: "success",
                });
              },
              fail: () => {
                Taro.showToast({ title: "复制失败，请稍后重试", icon: "none" });
              },
            });
          }
        },
      });
    } else if (!post?.wechatId) {
      Taro.showToast({ title: "暂无微信号", icon: "none" });
    }
  };

  if (loading) {
    return <View className="detail-page-loading">加载中...</View>; // TODO: Better loading state
  }

  if (error) {
    return (
      <View className="detail-page-error">
        <Text>加载失败，请检查网络后重试</Text>
        {/* TODO: Add retry button */}
      </View>
    );
  }

  if (!post) {
    return <View className="detail-page-error">帖子信息不存在</View>; // Should not happen if API returns 404 then error state
  }

  // Handle taken_down status
  if (post.status === "taken_down" || post.status === "rejected") {
    return (
      <View className="detail-page-unavailable">
        <Text>该信息已下架</Text>
        {/* TODO: Add a back button or rely on nav bar back */}
      </View>
    );
  }

  const imagesToShow = post.isPinned ? catalogueImages : post.images;

  return (
    <ScrollView
      scrollY
      className={`detail-page ${post.isPinned ? "pinned-post" : ""}`}
    >
      {/* 1. Top Swiper */}
      {imagesToShow && imagesToShow.length > 0 && (
        <Swiper
          className={`image-swiper ${post.isPinned ? "fullscreen-swiper" : ""}`}
          indicatorColor="#999"
          indicatorActiveColor="#333"
          circular
          indicatorDots
          autoplay={false}
        >
          {imagesToShow.map((imageUrl, index) => (
            <SwiperItem key={index} onClick={() => handleImageClick(index)}>
              <Image
                className={`swiper-image ${
                  post.isPinned ? "fullscreen-image" : ""
                }`}
                src={imageUrl}
                mode={post.isPinned ? "aspectFit" : "aspectFill"}
              />
            </SwiperItem>
          ))}
        </Swiper>
      )}

      {/* 2. 非置顶帖子才显示其他内容 */}
      {!post.isPinned && (
        <View className="content-padding">
          <Text className="title-text" selectable>
            {post.title}
          </Text>

          {/* 3. Category + Publish Time */}
          <View className="meta-info">
            <Text className="category-tag">{post.category}</Text>
            <Text className="publish-time">{post.publishTime}</Text>
          </View>

          {/* 4. Price */}
          {post.price && (
            <Text className="price-text" selectable>
              {post.price}
            </Text>
          )}

          {/* 5. Description */}
          {/* Wrap description in a ScrollView if it needs its own scroll, 
              otherwise the main page ScrollView will handle it. 
              For "展开更多", JS would be needed to toggle height/class 
          */}
          <Text className="description-text" selectable>
            {post.description}
          </Text>

          {/* 6. WeChat ID + Copy Button */}
          {post.wechatId && (
            <View className="wechat-section">
              <Text className="wechat-id-text" selectable>
                微信号: {post.wechatId}
              </Text>
              <Button
                className="copy-button"
                size="mini"
                onClick={handleCopyWechatId}
              >
                复制
              </Button>
            </View>
          )}
          {!post.wechatId && (
            <View className="wechat-section">
              <Text className="wechat-id-text muted">暂无微信号</Text>
              <Button
                className="copy-button disabled"
                size="mini"
                disabled
                onClick={handleCopyWechatId}
              >
                复制
              </Button>
            </View>
          )}

          {/* 7. Warm Reminder */}
          <Text className="reminder-text">
            请勿私下转账，平台不承担担保责任。
          </Text>
        </View>
      )}

      {/* 8. Taken Down / Rejected (handled at the top) */}
    </ScrollView>
  );
}
