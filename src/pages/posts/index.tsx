import { View } from "@tarojs/components";
import { useState } from "react";
import Taro from "@tarojs/taro";
import PostList from "../../components/PostList";
import { PostCardData } from "../../components/PostCard";
import { handlePostError } from "../../utils/postUtils";
import "./index.scss";

const PostsPage = () => {
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (page: number): Promise<PostCardData[]> => {
    try {
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
        return response.data.posts.map((post: any) => ({
          id: post._id,
          title: post.title,
          description: post.description,
          category: {
            name: post.category,
            color: "#007AFF",
          },
          price: post.price,
          displayTimeText: new Date(post.createdAt).toLocaleDateString(),
          mockImagePlaceholderHeight: 300,
          mockImagePlaceholderColor: "#f0f0f0",
        }));
      }
      return [];
    } catch (error) {
      handlePostError(error);
      return [];
    }
  };

  const handlePostClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`,
    });
  };

  return (
    <View className="posts-page">
      <PostList fetchPosts={fetchPosts} onPostClick={handlePostClick} />
    </View>
  );
};

export default PostsPage;
