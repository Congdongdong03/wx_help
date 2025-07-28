import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { API_CONFIG } from "../../config/api";
import { messageService } from "../../services/messageService";
import { useUser } from "../../store/user";
import "./index.scss";

interface PostDetail {
  id: number;
  title: string;
  content: string;
  images: string[];
  category: string;
  price?: string;
  status: string;
  created_at: string;
  updated_at: string;
  users: {
    id: number;
    nickname: string;
    avatar_url: string;
    openid: string;
  };
  cover_image?: string;
  mockImagePlaceholderColor?: string;
}

const PostDetailPage = () => {
  const router = useRouter();
  const { id } = router.params;
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 获取当前登录用户信息
  const { currentUser, userId } = useUser();

  useEffect(() => {
    if (id) {
      fetchPostDetail();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  // 监听用户状态变化，重新获取帖子数据
  useEffect(() => {
    if (id && currentUser) {
      console.log("用户状态变化，重新获取帖子数据");
      fetchPostDetail();
    }
  }, [currentUser?.id]);

  const fetchPostDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError(false);

    try {
      console.log("Fetching post detail for ID:", id);
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl(`/posts/${id}`),
        method: "GET",
        header: {
          "content-type": "application/json",
        },
      });

      console.log("API Response:", res);

      if (res.statusCode === 200 && res.data) {
        if (res.data.code === 0 && res.data.data) {
          setPost(res.data.data);
        } else {
          console.error("API returned error:", res.data);
          setError(true);
        }
      } else {
        console.error("API request failed:", res);
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching post detail:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  const handleMessageSeller = async () => {
    if (!post?.users?.openid || !post?.users?.nickname || !id) {
      Taro.showToast({
        title: "用户信息缺失，无法私信",
        icon: "none",
      });
      return;
    }

    try {
      Taro.showLoading({ title: "正在连接..." });

      // 创建或找到对话
      // 获取当前用户的 openid
      const currentUserOpenid =
        currentUser?.openid || Taro.getStorageSync("openid");

      if (!currentUserOpenid) {
        Taro.hideLoading();
        Taro.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      console.log("Creating conversation with:", {
        postId: id,
        otherUserId: post.users.openid,
        currentUserOpenid: currentUserOpenid,
      });

      const conversationId = await messageService.findOrCreateConversation(
        id,
        post.users.openid,
        currentUserOpenid
      );

      Taro.hideLoading();

      // 跳转到聊天窗口
      Taro.navigateTo({
        url: `/pages/messages/chat/index?conversationId=${conversationId}&postId=${id}&otherUserId=${encodeURIComponent(
          post.users.openid
        )}&nickname=${encodeURIComponent(
          post.users.nickname
        )}&avatar=${encodeURIComponent(post.users.avatar_url || "")}`,
      });
    } catch (error) {
      Taro.hideLoading();
      console.error("Error creating conversation:", error);
      Taro.showToast({
        title: "创建对话失败",
        icon: "none",
      });
    }
  };

  if (loading) {
    return (
      <View className="detail-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="detail-page">
        <View className="error-container">
          <Text className="error-text">加载失败，请重试</Text>
          <Button className="retry-button" onClick={fetchPostDetail}>
            重新加载
          </Button>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="detail-page">
        <View className="error-container">
          <Text className="error-text">帖子不存在</Text>
        </View>
      </View>
    );
  }

  // 兼容 cover_image、images[0]、images 字符串
  const mainImage =
    post.cover_image ||
    (Array.isArray(post.images) && post.images.length > 0 && post.images[0]) ||
    (typeof post.images === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(post.images);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
            if (typeof parsed === "string") return parsed;
          } catch {
            return post.images;
          }
        })()
      : post.images) ||
    "";

  // 兼容 mockImagePlaceholderColor
  const placeholderColor = post.mockImagePlaceholderColor || "rgb(240,240,240)"; // 默认灰色

  const [imgLoaded, setImgLoaded] = useState(false);

  // 判断是否显示联系方式部分
  // 只有当当前登录用户的 openid 不等于帖子发布者 openid 时才显示
  const shouldShowContactInfo =
    currentUser &&
    post?.users?.openid &&
    currentUser.openid !== post.users.openid;

  // 调试信息
  console.log("=== 帖子详情页权限调试 ===");
  console.log("当前用户:", currentUser);
  console.log("帖子发布者:", post?.users);
  console.log("当前用户openid:", currentUser?.openid);
  console.log("帖子发布者openid:", post?.users?.openid);
  console.log("是否显示私信按钮:", shouldShowContactInfo);

  return (
    <View className="detail-page">
      <View
        className="image-main"
        style={{
          width: "100%",
          height: "200rpx",
          background: placeholderColor,
          borderRadius: "16rpx",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!imgLoaded && (
          <View
            style={{
              width: "100%",
              height: "100%",
              background: placeholderColor,
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        )}
        {mainImage && (
          <Image
            className="image"
            src={mainImage}
            mode="aspectFill"
            style={{
              width: "100%",
              height: "100%",
              display: imgLoaded ? "block" : "none",
            }}
            onLoad={() => setImgLoaded(true)}
          />
        )}
      </View>
      {selectedImage && (
        <View className="image-preview-modal" onClick={handleClosePreview}>
          <View className="modal-content">
            <Image
              className="preview-image"
              src={selectedImage}
              mode="aspectFit"
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default PostDetailPage;
