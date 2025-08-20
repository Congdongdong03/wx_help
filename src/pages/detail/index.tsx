import { useState, useEffect, useCallback } from "react";
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
  created_at: string;
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

  // 获取当前登录用户信息
  const { currentUser } = useUser();

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
      fetchPostDetail();
    }
  }, [currentUser?.id, id]);

  const fetchPostDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(false);

    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl(`/posts/${id}`),
        method: "GET",
        header: {
          "content-type": "application/json",
        },
      });

      if (res.statusCode === 200 && res.data) {
        if (res.data.code === 0 && res.data.data) {
          setPost(res.data.data);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching post detail:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleImageClick = (imageUrl: string) => {
    const imageList = parseImages(post?.images);

    if (imageList.length > 0) {
      // 使用微信原生的图片预览
      Taro.previewImage({
        current: imageUrl,
        urls: imageList,
      });
    }
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

  // 解析图片数组
  const parseImages = (images: any): string[] => {
    if (Array.isArray(images)) {
      // 过滤掉无效的图片URL
      const validImages = images.filter((url: string) => {
        return url && typeof url === "string" && url.trim() !== "";
      });
      return validImages.slice(0, 9); // 最多显示9张图片
    }
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          // 过滤掉无效的图片URL
          const validImages = parsed.filter((url: string) => {
            return url && typeof url === "string" && url.trim() !== "";
          });
          return validImages.slice(0, 9); // 最多显示9张图片
        }
        if (typeof parsed === "string") {
          return parsed.trim() ? [parsed] : [];
        }
      } catch (error) {
        return images.trim() ? [images] : [];
      }
    }
    return [];
  };

  const imageList = parseImages(post.images);
  const mainImage =
    post.cover_image || (imageList.length > 0 ? imageList[0] : "");

  // 兼容 mockImagePlaceholderColor
  const placeholderColor = post.mockImagePlaceholderColor || "rgb(240,240,240)"; // 默认灰色

  // 判断是否显示联系方式部分
  // 只有当当前登录用户的 openid 不等于帖子发布者 openid 时才显示
  const shouldShowContactInfo =
    currentUser &&
    post?.users?.openid &&
    currentUser.openid !== post.users.openid;

  // 格式化联系方式文本，每8个字符换行
  const formatContactInfo = (text: string): string => {
    if (!text) return "";

    // 移除多余的空格
    const cleanText = text.trim();

    // 每8个字符插入换行符
    const formattedText = cleanText.replace(/(.{8})/g, "$1\n").trim();

    return formattedText;
  };

  return (
    <View className="detail-page">
      <View className="content">
        {/* 图片网格 */}
        {imageList.length > 0 && (
          <View className="image-grid">
            <View className="grid-container">
              {imageList.map((imageUrl, index) => (
                <View
                  key={index}
                  className="grid-item"
                  onClick={() => handleImageClick(imageUrl)}
                >
                  <Image
                    className="image"
                    src={imageUrl}
                    mode="aspectFill"
                    onError={(e) => {
                      console.log(`图片加载失败 [${index}]:`, imageUrl, e);
                    }}
                    style={{
                      backgroundColor: placeholderColor,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 帖子信息 */}
        <View className="post-info">
          <Text className="title">{post.title}</Text>
          <Text className="description">{post.content}</Text>
          {post.price && (
            <Text className="price">
              价格: {post.price}
              {post.price_unit || "元"}
            </Text>
          )}
        </View>

        {/* 用户信息 */}
        <View className="user-info">
          <Image className="avatar" src={post.users.avatar_url} />
          <View className="user-details">
            <Text className="nickname">{post.users.nickname}</Text>
            <Text className="post-time">
              发布于 {new Date(post.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* 联系方式 */}
        {post.contact_info && (
          <View className="contact-info">
            <Text className="contact-title">联系方式:</Text>
            <View className="wechat-id">
              <Text className="id-text">
                {formatContactInfo(post.contact_info)}
              </Text>
              <Button className="copy-button">复制</Button>
            </View>
          </View>
        )}
      </View>

      {/* 私信按钮 */}
      {shouldShowContactInfo && (
        <View style={{ padding: "32rpx" }}>
          <Button
            style={{
              backgroundColor: "#07c160",
              color: "#fff",
              padding: "24rpx",
              borderRadius: "16rpx",
              fontSize: "32rpx",
              width: "100%",
            }}
            onClick={handleMessageSeller}
          >
            私信卖家
          </Button>
        </View>
      )}
    </View>
  );
};

export default PostDetailPage;
