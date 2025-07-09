import { useState, useEffect } from "react";
import { View, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PostCard from "../../components/PostCard";
import { usePostService } from "../../services/postService";
import "./index.scss";

const PAGE_SIZE = 10;

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const postService = usePostService();

  // 加载帖子列表
  const loadPosts = async (page: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await postService.getPostList(page, PAGE_SIZE);

      if (page === 1) {
        setPosts(response.posts);
      } else {
        setPosts((prev) => [...prev, ...response.posts]);
      }

      setHasMore(response.posts.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load posts:", error);
      Taro.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPosts(1);
  }, []);

  // 处理滚动加载
  const handleScrollToLower = () => {
    if (!loading && hasMore) {
      loadPosts(currentPage + 1);
    }
  };

  // 处理帖子点击
  const handlePostClick = (post) => {
    Taro.navigateTo({
      url: `/pages/postDetail/index?id=${post.id}`,
    });
  };

  return (
    <View className="post-list">
      <ScrollView
        scrollY
        className="post-list-scroll"
        onScrollToLower={handleScrollToLower}
      >
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => handlePostClick(post)}
          />
        ))}
        {loading && <View className="loading">加载中...</View>}
        {!hasMore && posts.length > 0 && (
          <View className="no-more">没有更多了</View>
        )}
      </ScrollView>
    </View>
  );
}
