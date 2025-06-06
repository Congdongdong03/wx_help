import React, { useState, useEffect, useCallback } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button, ScrollView } from "@tarojs/components";
import styles from "./index.module.scss";
import { BASE_URL } from "../../utils/env";

// Replace with your actual API base URL
const BASE_API_URL = `${BASE_URL}/api`;

// Simplified Post interface - align with your actual Post model
interface Post {
  id: number;
  title: string;
  status: "draft" | "pending" | "published" | "failed";
  content?: string;
  // Add other relevant fields you expect from the API
  created_at?: string;
  updated_at?: string;
}

interface Stats {
  draftCount: number;
  pendingCount: number;
  publishedCount: number;
  failedCount: number;
  totalCount: number;
}

interface FetchPostsResponse {
  posts: Post[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
  };
  stats: Stats;
}

const MyPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10); // Or make it configurable
  const [currentStatus, setCurrentStatus] = useState<string>(""); // Empty string means all
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = `${BASE_API_URL}/posts/my?page=${currentPage}&limit=${limit}`;
        if (currentStatus) {
          url += `&status=${currentStatus}`;
        }

        const response = await Taro.request<FetchPostsResponse>({
          url,
          method: "GET",
        });

        if (response.statusCode === 200 && response.data) {
          setPosts(response.data.posts);
          setTotalPages(response.data.pagination.totalPages);
          setStats(response.data.stats);
        } else {
          throw new Error(
            `Failed to fetch posts. Status: ${response.statusCode}`
          );
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        setPosts([]);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, limit, currentStatus]);

  const handleStatusFilterChange = (status: string) => {
    setCurrentStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Placeholder Action Handlers
  const handleRefresh = (postId: number) => {
    Taro.showToast({
      title: `擦亮 Post ID: ${postId} (Not Implemented)`,
      icon: "none",
    });
    // TODO: Implement API call for PUT /api/posts/:id/refresh
  };

  const handleEdit = (postId: number) => {
    Taro.showToast({
      title: `编辑 Post ID: ${postId} (Not Implemented)`,
      icon: "none",
    });
    // TODO: Navigate to edit page or implement modal for PUT /api/posts/:id
  };

  const handleDelete = (postId: number) => {
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除这篇帖子吗？此操作不可撤销。",
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: `删除 Post ID: ${postId} (Not Implemented)`,
            icon: "none",
          });
          // TODO: Implement API call for DELETE /api/posts/:id
          // After successful deletion, refetch posts: fetchPosts();
        }
      },
    });
  };

  const handleRepublish = (postId: number) => {
    Taro.showToast({
      title: `重新发布 Post ID: ${postId} (Not Implemented)`,
      icon: "none",
    });
    // TODO: Implement API call for PUT /api/posts/:id/publish
  };

  const statusFilters: { label: string; value: string }[] = [
    { label: "全部", value: "" },
    { label: "草稿", value: "draft" },
    { label: "审核中", value: "pending" },
    { label: "已发布", value: "published" },
    { label: "未通过", value: "failed" },
  ];

  return (
    <View className={styles.myPostsPage}>
      <View className={styles.filterContainer}>
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            size="mini"
            className={`${styles.filterButton} ${
              currentStatus === filter.value ? styles.filterButtonActive : ""
            }`}
            onClick={() => handleStatusFilterChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </View>

      {stats && (
        <View className={styles.statsContainer}>
          <Text>总计: {stats.totalCount} |</Text>
          <Text>草稿: {stats.draftCount} |</Text>
          <Text>审核中: {stats.pendingCount} |</Text>
          <Text>已发布: {stats.publishedCount} |</Text>
          <Text>未通过: {stats.failedCount}</Text>
        </View>
      )}

      {isLoading && <View className={styles.loading}>加载中...</View>}
      {error && <View className={styles.error}>错误: {error}</View>}

      {!isLoading && !error && posts.length === 0 && (
        <View className={styles.noPosts}>没有找到帖子。</View>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <ScrollView scrollY>
          {posts.map((post) => (
            <View key={post.id} className={styles.postItem}>
              <Text className={styles.postTitle}>{post.title}</Text>
              <Text className={styles.postStatus}>状态: {post.status}</Text>
              {/* Display other post details as needed */}
              {/* e.g., <Text>内容: {post.content}</Text> */}
              <View className={styles.postActions}>
                {post.status === "draft" && (
                  <Button
                    size="mini"
                    className={`${styles.actionButton} ${styles.republishButton}`}
                    onClick={() => handleRepublish(post.id)}
                  >
                    发布
                  </Button>
                )}
                <Button
                  size="mini"
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={() => handleEdit(post.id)}
                >
                  编辑
                </Button>
                <Button
                  size="mini"
                  className={`${styles.actionButton} ${styles.refreshButton}`}
                  onClick={() => handleRefresh(post.id)}
                >
                  擦亮
                </Button>
                <Button
                  size="mini"
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDelete(post.id)}
                >
                  删除
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {!isLoading && !error && posts.length > 0 && totalPages > 1 && (
        <View className={styles.paginationContainer}>
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            上一页
          </Button>
          <Text className={styles.paginationText}>
            {currentPage} / {totalPages}
          </Text>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            下一页
          </Button>
        </View>
      )}
    </View>
  );
};

export default MyPostsPage;
