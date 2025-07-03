import { View } from "@tarojs/components";
import React, { useState, useCallback } from "react";
import Taro from "@tarojs/taro";
import { OptimizedPostList } from "../../components/OptimizedPostList";
import { Post } from "../../types";
import { handlePostError } from "../../utils/postUtils";
import "./index.scss";

const PostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/posts`,
        method: "GET",
        data: {
          page,
          limit: 10,
        },
        header: {
          Authorization: `Bearer ${Taro.getStorageSync("token")}`,
        },
      });

      if (response.statusCode === 200) {
        const newPosts = response.data.posts.map((post: any) => ({
          id: post._id,
          title: post.title,
          description: post.description,
          category: post.category,
          price: post.price,
          images: post.images || [],
          createdAt: post.createdAt,
        }));
        setPosts((prev) => [...prev, ...newPosts]);
      }
    } catch (error) {
      handlePostError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePostClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`,
    });
  };

  return (
    <View className="posts-page">
      <OptimizedPostList
        posts={posts}
        onPostClick={handlePostClick}
        loading={loading}
      />
    </View>
  );
};

export default PostsPage;
