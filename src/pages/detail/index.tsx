import React, { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { API_CONFIG } from "../../config/api";
import "./index.scss";

interface PostDetail {
  id: number;
  title: string;
  content: string;
  images: string[];
  category: string;
  price?: string;
  wechat_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    nickname: string;
    avatar_url: string;
  };
}

const PostDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPostDetail();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

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

  const handleCopyWechatId = () => {
    if (post?.wechat_id) {
      Taro.setClipboardData({
        data: post.wechat_id,
        success: () => {
          Taro.showToast({
            title: "微信号已复制",
            icon: "success",
          });
        },
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

  // 兼容 images 字段为字符串、null、undefined等情况，确保 images 一定是数组
  let images: string[] = [];
  if (Array.isArray(post.images)) {
    images = post.images;
  } else if (typeof post.images === "string") {
    try {
      const parsed = JSON.parse(post.images);
      if (Array.isArray(parsed)) {
        images = parsed;
      } else if (parsed) {
        images = [parsed];
      }
    } catch {
      if (post.images) images = [post.images];
    }
  } else if (post.images) {
    images = [post.images];
  }

  return (
    <View className="detail-page">
      <View className="content">
        {images.length > 0 && (
          <View className="image-grid">
            <View className="grid-container">
              {images.map((image, index) => (
                <View
                  key={index}
                  className="grid-item"
                  onClick={() => handleImageClick(image)}
                >
                  <Image className="image" src={image} mode="aspectFill" />
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="post-info">
          <Text className="title">{post.title}</Text>
          <Text className="description">{post.content}</Text>
          {post.price && <Text className="price">¥{post.price}</Text>}
        </View>

        <View className="user-info">
          <Image
            className="avatar"
            src={
              post.user?.avatar_url || "https://example.com/default-avatar.png"
            }
          />
          <View className="user-details">
            <Text className="nickname">
              {post.user?.nickname || "未知用户"}
            </Text>
            <Text className="post-time">
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className="contact-info">
          <Text className="contact-title">联系方式</Text>
          <View className="wechat-id">
            <Text className="id-text">{post.wechat_id}</Text>
            <Button className="copy-button" onClick={handleCopyWechatId}>
              复制
            </Button>
          </View>
        </View>
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
